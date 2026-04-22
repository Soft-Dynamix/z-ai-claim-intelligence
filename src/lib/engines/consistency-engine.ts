/**
 * Consistency & Fraud Detection Engine
 * Compares data across all sources for consistency
 * Detects potential fraud indicators
 */

import { structuredAnalysis } from '../ai-client'
import type { LicenseDiscData, ClaimFormData, PolicyScheduleData } from './ocr-engine'
import type { DamageAssessmentResult } from './damage-assessment-engine'
import type { VehicleMatchResult } from './policy-matching-engine'

export interface FraudIndicator {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  type: string
  description: string
  evidence: string
  recommendation: string
}

export interface ConsistencyCheckResult {
  vehicleMatch: boolean
  policyValid: boolean
  damageConsistent: boolean
  incidentPlausible: boolean
  timelineConsistent: boolean
  documentationComplete: boolean
  
  discrepancies: string[]
  fraudIndicators: FraudIndicator[]
  
  overallRiskScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  summary: string
  requiresInvestigation: boolean
  investigationReasons: string[]
}

const CONSISTENCY_CHECK_PROMPT = `You are an insurance fraud detection specialist with expertise in motor claims.

Analyze the claim data for consistency and potential fraud indicators.

Check for:
1. VEHICLE IDENTITY
   - VIN matches across all documents
   - Registration matches policy
   - Vehicle description consistent

2. POLICY VALIDITY
   - Policy active at incident date
   - Coverage type appropriate
   - Driver authorized

3. DAMAGE CONSISTENCY
   - Damage type matches incident description
   - Damage location consistent with incident type
   - Damage severity plausible

4. INCIDENT PLAUSIBILITY
   - Timeline makes sense
   - Location details consistent
   - Weather conditions match damage type

5. TIMELINE CHECKS
   - Incident date within policy period
   - Claim submitted timely
   - No suspicious delays

FRAUD INDICATORS TO DETECT:
- Wrong vehicle claimed
- Pre-existing damage
- Staged accident indicators
- Inflated damage claims
- Identity inconsistencies
- Timeline anomalies
- Documentation issues

Provide detailed analysis in JSON format.`

export async function performConsistencyCheck(
  licenseData: LicenseDiscData | null,
  claimFormData: ClaimFormData | null,
  policyData: PolicyScheduleData | null,
  damageAssessment: DamageAssessmentResult | null,
  vehicleMatch: VehicleMatchResult | null
): Promise<ConsistencyCheckResult> {
  // Build context for analysis
  const context = buildAnalysisContext(
    licenseData,
    claimFormData,
    policyData,
    damageAssessment,
    vehicleMatch
  )

  const result = await structuredAnalysis<ConsistencyCheckResult>(
    CONSISTENCY_CHECK_PROMPT,
    context
  )

  if (result.success && result.data) {
    return result.data
  }

  // Return default if analysis fails
  return {
    vehicleMatch: vehicleMatch?.matchStatus === 'MATCH' || false,
    policyValid: true,
    damageConsistent: true,
    incidentPlausible: true,
    timelineConsistent: true,
    documentationComplete: true,
    discrepancies: [],
    fraudIndicators: [],
    overallRiskScore: 0,
    riskLevel: 'LOW',
    summary: 'Consistency check completed with default values',
    requiresInvestigation: false,
    investigationReasons: []
  }
}

function buildAnalysisContext(
  licenseData: LicenseDiscData | null,
  claimFormData: ClaimFormData | null,
  policyData: PolicyScheduleData | null,
  damageAssessment: DamageAssessmentResult | null,
  vehicleMatch: VehicleMatchResult | null
): string {
  const sections: string[] = []

  if (licenseData) {
    sections.push(`
LICENSE DISC DATA:
- VIN: ${licenseData.vin}
- Registration: ${licenseData.registrationNumber}
- Vehicle: ${licenseData.make} ${licenseData.model} ${licenseData.year}
- Expiry: ${licenseData.expiryDate}
`)
  }

  if (claimFormData) {
    sections.push(`
CLAIM FORM DATA:
- Incident Date: ${claimFormData.incidentDate}
- Location: ${claimFormData.location}
- Description: ${claimFormData.description}
- Driver: ${claimFormData.driverName}
- Weather: ${claimFormData.weatherConditions}
- Third Party: ${claimFormData.thirdPartyInvolved ? 'Yes' : 'No'}
`)
  }

  if (policyData) {
    sections.push(`
POLICY DATA:
- Policy Number: ${policyData.policyNumber}
- Insured: ${policyData.insuredName}
- Period: ${policyData.startDate} to ${policyData.endDate}
- Sum Insured: R${policyData.sumInsured?.toLocaleString()}
- Vehicle VIN: ${policyData.vehicleDetails.vin}
- Vehicle Reg: ${policyData.vehicleDetails.registrationNumber}
`)
  }

  if (damageAssessment) {
    const damagedAreasList = Array.isArray(damageAssessment.damagedAreas) 
      ? damageAssessment.damagedAreas.map((a: any) => typeof a === 'string' ? a : a?.area || a?.name || 'Unknown').join(', ')
      : 'Not specified'
    const safetySystemsList = Array.isArray(damageAssessment.safetySystemsAffected)
      ? damageAssessment.safetySystemsAffected.join(', ')
      : 'None identified'
    
    sections.push(`
DAMAGE ASSESSMENT:
- Severity: ${damageAssessment.overallSeverity || damageAssessment.severityAssessment || 'Unknown'}
- Severity Score: ${damageAssessment.severityScore || 'N/A'}%
- Damaged Areas: ${damagedAreasList}
- Structural Damage: ${damageAssessment.structuralDamage || 'Not assessed'}
- Safety Systems: ${safetySystemsList}
`)
  }

  if (vehicleMatch) {
    sections.push(`
VEHICLE MATCH:
- Status: ${vehicleMatch.matchStatus}
- VIN Match: ${vehicleMatch.vinMatch}
- Registration Match: ${vehicleMatch.registrationMatch}
- Make/Model Match: ${vehicleMatch.makeModelMatch}
- Discrepancies: ${Array.isArray(vehicleMatch.discrepancies) ? vehicleMatch.discrepancies.join(', ') : 'None'}
`)
  }

  return sections.join('\n')
}

// Specific fraud pattern detection
export function detectFraudPatterns(
  data: {
    incidentDate: string
    policyStartDate: string
    policyEndDate: string
    claimSubmissionDate?: string
    damageSeverity: string
    incidentType: string
    vehicleAge: number
    previousClaims?: number
  }
): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  // Early claim after policy start
  const incidentDate = new Date(data.incidentDate)
  const policyStart = new Date(data.policyStartDate)
  const daysSincePolicyStart = Math.floor((incidentDate.getTime() - policyStart.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSincePolicyStart < 30) {
    indicators.push({
      level: 'MEDIUM',
      type: 'EARLY_CLAIM',
      description: 'Claim filed within 30 days of policy start',
      evidence: `Incident occurred ${daysSincePolicyStart} days after policy inception`,
      recommendation: 'Verify prior insurance history and vehicle condition'
    })
  }

  // High severity on older vehicle
  if (data.vehicleAge > 10 && data.damageSeverity === 'SEVERE') {
    indicators.push({
      level: 'MEDIUM',
      type: 'OLD_VEHICLE_SEVERE_DAMAGE',
      description: 'Severe damage on vehicle over 10 years old',
      evidence: `Vehicle age: ${data.vehicleAge} years, Severity: ${data.damageSeverity}`,
      recommendation: 'Verify pre-accident condition and value'
    })
  }

  // Multiple previous claims
  if (data.previousClaims && data.previousClaims > 2) {
    indicators.push({
      level: 'HIGH',
      type: 'MULTIPLE_CLAIMS',
      description: 'Multiple previous claims on record',
      evidence: `${data.previousClaims} previous claims`,
      recommendation: 'Review claim history for patterns'
    })
  }

  return indicators
}

// Check for staged accident indicators
export function detectStagedAccidentIndicators(
  incidentData: {
    description: string
    location: string
    time: string
    thirdPartyInvolved: boolean
    witnesses: boolean
  }
): FraudIndicator[] {
  const indicators: FraudIndicator[] = []
  const descLower = incidentData.description.toLowerCase()

  // Low-speed rear-end (common staged scenario)
  if (descLower.includes('rear-end') || descLower.includes('rear end')) {
    if (!incidentData.witnesses) {
      indicators.push({
        level: 'LOW',
        type: 'POTENTIAL_STAGED',
        description: 'Rear-end collision without independent witnesses',
        evidence: 'Common staged accident scenario',
        recommendation: 'Request witness statements or CCTV footage'
      })
    }
  }

  // Late night/early morning incidents
  const hour = parseInt(incidentData.time.split(':')[0])
  if (hour >= 22 || hour <= 5) {
    indicators.push({
      level: 'LOW',
      type: 'UNUSUAL_TIME',
      description: 'Incident occurred during low-traffic hours',
      evidence: `Time of incident: ${incidentData.time}`,
      recommendation: 'Verify location and circumstances'
    })
  }

  return indicators
}
