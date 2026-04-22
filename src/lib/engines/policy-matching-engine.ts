/**
 * Policy Matching Engine
 * Matches actual vehicle vs insured vehicle
 * Detects under/over insurance
 * Identifies undeclared modifications
 */

import { chatCompletion, structuredAnalysis } from '../ai-client'
import type { LicenseDiscData, PolicyScheduleData } from './ocr-engine'

export interface VehicleMatchResult {
  matchStatus: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'ERROR'
  matchDetails: string
  vinMatch: boolean
  registrationMatch: boolean
  makeModelMatch: boolean
  discrepancies: string[]
  confidence: number
}

export interface InsuranceAnalysis {
  sumInsured: number
  marketValueEstimate: number
  insuranceStatus: 'ADEQUATE' | 'UNDER_INSURED' | 'OVER_INSURED'
  gap: number
  gapPercentage: number
  recommendation: string
}

export interface ExtrasAnalysis {
  insuredExtras: string[]
  observedExtras: string[]
  missingFromPolicy: string[]
  notInsuredButObserved: string[]
  totalExtrasValue: number
}

export interface PolicyMatchResult {
  vehicleMatch: VehicleMatchResult
  insuranceAnalysis: InsuranceAnalysis
  extrasAnalysis: ExtrasAnalysis
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string
}

const VEHICLE_MATCH_PROMPT = `You are an insurance policy validation expert.

Compare the extracted vehicle data against the policy schedule data.

Tasks:
1. Confirm vehicle match (VIN is primary identifier)
2. Identify any mismatches
3. Check for discrepancies

VIN Matching Rules:
- VIN is the primary identifier - must match exactly
- If VIN doesn't match, it's a different vehicle
- Registration can change but VIN is permanent

Discrepancy Types:
- Different vehicle entirely
- Incorrect model/year
- Modified vehicle not matching policy
- VIN mismatch (critical)

Provide:
- matchStatus: MATCH, PARTIAL_MATCH, MISMATCH, or ERROR
- matchDetails: Explanation of the match result
- vinMatch: Boolean
- registrationMatch: Boolean
- makeModelMatch: Boolean
- discrepancies: Array of any discrepancies found
- confidence: 0-100 score`

const INSURANCE_ANALYSIS_PROMPT = `You are a motor insurance valuation expert.

Analyze the sum insured against typical market values.

Consider:
- Vehicle make, model, year
- Current market conditions
- Depreciation factors
- Regional market (South Africa)

Provide:
- sumInsured: The policy sum insured
- marketValueEstimate: Estimated current market value
- insuranceStatus: ADEQUATE, UNDER_INSURED, or OVER_INSURED
- gap: Difference between insured and market value
- gapPercentage: Gap as percentage of market value
- recommendation: Advice for the insurer`

const EXTRAS_ANALYSIS_PROMPT = `You are an insurance extras validation expert.

Compare insured extras against observed extras from damage photos.

Consider:
- Factory vs aftermarket extras
- Declared vs undeclared modifications
- Value of extras

Provide:
- insuredExtras: Array of extras listed in policy
- observedExtras: Array of extras observed in photos
- missingFromPolicy: Extras in policy but not observed
- notInsuredButObserved: Extras observed but not in policy
- totalExtrasValue: Total value of insured extras`

export async function matchVehicleToPolicy(
  licenseData: LicenseDiscData,
  policyData: PolicyScheduleData,
  observedVehicleInfo?: { make?: string; model?: string; color?: string; year?: number }
): Promise<PolicyMatchResult> {
  // Create comparison context
  const comparisonContext = `
VEHICLE FROM LICENSE DISC:
- VIN: ${licenseData.vin}
- Registration: ${licenseData.registrationNumber}
- Make: ${licenseData.make}
- Model: ${licenseData.model}
- Year: ${licenseData.year}

VEHICLE FROM POLICY SCHEDULE:
- VIN: ${policyData.vehicleDetails.vin}
- Registration: ${policyData.vehicleDetails.registrationNumber}
- Make: ${policyData.vehicleDetails.make}
- Model: ${policyData.vehicleDetails.model}
- Year: ${policyData.vehicleDetails.year}

${observedVehicleInfo ? `
OBSERVED FROM DAMAGE PHOTOS:
- Make: ${observedVehicleInfo.make || 'Not visible'}
- Model: ${observedVehicleInfo.model || 'Not visible'}
- Color: ${observedVehicleInfo.color || 'Not visible'}
- Year: ${observedVehicleInfo.year || 'Not visible'}
` : ''}
`

  // Run vehicle match analysis
  const matchResult = await structuredAnalysis<VehicleMatchResult>(
    VEHICLE_MATCH_PROMPT,
    comparisonContext
  )

  // Run insurance analysis
  const insuranceContext = `
VEHICLE: ${licenseData.make} ${licenseData.model} ${licenseData.year}
SUM INSURED: ${policyData.sumInsured}
EXTRAS VALUE: ${policyData.extras.reduce((sum, e) => sum + (e.value || 0), 0)}
`
  const insuranceResult = await structuredAnalysis<InsuranceAnalysis>(
    INSURANCE_ANALYSIS_PROMPT,
    insuranceContext
  )

  // Run extras analysis
  const extrasContext = `
INSURED EXTRAS FROM POLICY:
${policyData.extras.map(e => `- ${e.name}: R${e.value}`).join('\n')}

OBSERVED EXTRAS: None provided in this analysis
`
  const extrasResult = await structuredAnalysis<ExtrasAnalysis>(
    EXTRAS_ANALYSIS_PROMPT,
    extrasContext
  )

  // Determine overall risk level
  let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  
  if (matchResult.data?.matchStatus === 'MISMATCH') {
    overallRiskLevel = 'HIGH'
  } else if (matchResult.data?.matchStatus === 'PARTIAL_MATCH') {
    overallRiskLevel = 'MEDIUM'
  } else if (insuranceResult.data?.insuranceStatus === 'UNDER_INSURED') {
    overallRiskLevel = 'MEDIUM'
  }

  // Generate summary
  const summary = await generateSummary(
    matchResult.data,
    insuranceResult.data,
    extrasResult.data
  )

  return {
    vehicleMatch: matchResult.data || {
      matchStatus: 'ERROR' as const,
      matchDetails: 'Failed to analyze vehicle match',
      vinMatch: false,
      registrationMatch: false,
      makeModelMatch: false,
      discrepancies: ['Analysis failed'],
      confidence: 0
    },
    insuranceAnalysis: insuranceResult.data || {
      sumInsured: policyData.sumInsured || 0,
      marketValueEstimate: 0,
      insuranceStatus: 'ADEQUATE' as const,
      gap: 0,
      gapPercentage: 0,
      recommendation: 'Unable to analyze'
    },
    extrasAnalysis: extrasResult.data || {
      insuredExtras: policyData.extras.map(e => e.name),
      observedExtras: [],
      missingFromPolicy: [],
      notInsuredButObserved: [],
      totalExtrasValue: 0
    },
    overallRiskLevel,
    summary
  }
}

async function generateSummary(
  vehicleMatch?: VehicleMatchResult,
  insuranceAnalysis?: InsuranceAnalysis,
  extrasAnalysis?: ExtrasAnalysis
): Promise<string> {
  const parts: string[] = []

  if (vehicleMatch) {
    if (vehicleMatch.matchStatus === 'MATCH') {
      parts.push(`Vehicle verified: VIN and registration match policy.`)
    } else if (vehicleMatch.matchStatus === 'PARTIAL_MATCH') {
      parts.push(`Partial vehicle match: ${vehicleMatch.matchDetails}`)
    } else if (vehicleMatch.matchStatus === 'MISMATCH') {
      parts.push(`⚠️ Vehicle mismatch detected: ${vehicleMatch.matchDetails}`)
    }
  }

  if (insuranceAnalysis) {
    parts.push(`Insurance coverage: ${insuranceAnalysis.insuranceStatus}.`)
    if (insuranceAnalysis.gapPercentage > 10) {
      parts.push(`Coverage gap: R${Math.abs(insuranceAnalysis.gap).toLocaleString()} (${Math.abs(insuranceAnalysis.gapPercentage).toFixed(1)}%)`)
    }
  }

  if (extrasAnalysis && extrasAnalysis.notInsuredButObserved.length > 0) {
    parts.push(`⚠️ Undeclared extras found: ${extrasAnalysis.notInsuredButObserved.join(', ')}`)
  }

  return parts.join(' ')
}
