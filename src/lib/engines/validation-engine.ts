/**
 * Validation Engine
 * Challenges ALL agent outputs
 * Flags assumptions and uncertainties
 * Simulates independent verification
 */

import { chatCompletion, structuredAnalysis } from '../ai-client'
import type { ConsistencyCheckResult } from './consistency-engine'
import type { DamageAssessmentResult } from './damage-assessment-engine'
import type { WriteOffEstimationResult } from './writeoff-estimation-engine'
import type { PolicyMatchResult } from './policy-matching-engine'

export interface ValidationChallenge {
  agentName: string
  findingChallenged: string
  challengeReason: string
  suggestedAlternative: string
  confidence: number
  requiresManualReview: boolean
}

export interface ValidationResult {
  challenges: ValidationChallenge[]
  assumptions: string[]
  uncertainties: string[]
  dataQualityIssues: string[]
  
  overallConfidence: number
  recommendation: 'PROCEED' | 'REVIEW_REQUIRED' | 'REJECT_AND_REASSESS'
  
  summary: string
  actionItems: string[]
}

const VALIDATION_PROMPT = `You are an independent claims validator. Your role is to CHALLENGE all findings from other AI agents.

Apply critical thinking and skepticism. Your job is to:
1. Question assumptions made by other agents
2. Identify data quality issues
3. Flag uncertainties and gaps
4. Suggest alternative interpretations
5. Recommend manual verification where needed

CHALLENGE EVERYTHING:
- Is the vehicle identification truly verified?
- Could the damage be pre-existing?
- Are the repair estimates realistic?
- Is the write-off calculation accurate?
- Could there be fraud that was missed?

Be thorough and conservative. Better to over-challenge than miss issues.

Provide detailed validation in JSON format.`

export async function validateClaim(
  policyMatch: PolicyMatchResult,
  damageAssessment: DamageAssessmentResult,
  writeOffEstimation: WriteOffEstimationResult,
  consistencyCheck: ConsistencyCheckResult
): Promise<ValidationResult> {
  // Build context from all agent outputs
  const context = `
POLICY MATCH ENGINE OUTPUT:
- Vehicle Match Status: ${policyMatch.vehicleMatch.matchStatus}
- Confidence: ${policyMatch.vehicleMatch.confidence}%
- Insurance Status: ${policyMatch.insuranceAnalysis.insuranceStatus}
- Risk Level: ${policyMatch.overallRiskLevel}

DAMAGE ASSESSMENT ENGINE OUTPUT:
- Severity: ${damageAssessment.overallSeverity}
- Severity Score: ${damageAssessment.severityScore}%
- Repair Estimate: R${damageAssessment.totalEstimatedRepair.toLocaleString()}
- Confidence: ${damageAssessment.confidence}%
- Structural Damage: ${damageAssessment.structuralDamage}

WRITE-OFF ESTIMATION ENGINE OUTPUT:
- Write-Off %: ${writeOffEstimation.writeOffPercentage.toFixed(1)}%
- Classification: ${writeOffEstimation.classification}
- Assumptions: ${writeOffEstimation.assumptions.join(', ')}

CONSISTENCY CHECK ENGINE OUTPUT:
- Vehicle Match: ${consistencyCheck.vehicleMatch}
- Policy Valid: ${consistencyCheck.policyValid}
- Damage Consistent: ${consistencyCheck.damageConsistent}
- Risk Score: ${consistencyCheck.overallRiskScore}
- Risk Level: ${consistencyCheck.riskLevel}
`

  const result = await structuredAnalysis<ValidationResult>(
    VALIDATION_PROMPT,
    context
  )

  if (result.success && result.data) {
    return result.data
  }

  // Return default validation if analysis fails
  return generateDefaultValidation(
    policyMatch,
    damageAssessment,
    writeOffEstimation,
    consistencyCheck
  )
}

function generateDefaultValidation(
  policyMatch: PolicyMatchResult,
  damageAssessment: DamageAssessmentResult,
  writeOffEstimation: WriteOffEstimationResult,
  consistencyCheck: ConsistencyCheckResult
): ValidationResult {
  const challenges: ValidationChallenge[] = []
  const assumptions: string[] = []
  const uncertainties: string[] = []
  const dataQualityIssues: string[] = []

  // Challenge low confidence findings
  if (policyMatch.vehicleMatch.confidence < 80) {
    challenges.push({
      agentName: 'Policy Matching Engine',
      findingChallenged: 'Vehicle match determination',
      challengeReason: `Confidence score of ${policyMatch.vehicleMatch.confidence}% is below threshold`,
      suggestedAlternative: 'Manual verification of VIN and registration required',
      confidence: 70,
      requiresManualReview: true
    })
  }

  if (damageAssessment.confidence < 70) {
    challenges.push({
      agentName: 'Damage Assessment Engine',
      findingChallenged: 'Damage severity assessment',
      challengeReason: `Assessment confidence of ${damageAssessment.confidence}% indicates uncertainty`,
      suggestedAlternative: 'Physical inspection recommended',
      confidence: 60,
      requiresManualReview: true
    })
  }

  // Collect assumptions
  assumptions.push(...writeOffEstimation.assumptions)
  
  // Identify uncertainties
  if (damageAssessment.damagedAreas.some(a => a.confidence < 70)) {
    uncertainties.push('Some damage area assessments have low confidence')
  }
  
  if (consistencyCheck.discrepancies.length > 0) {
    uncertainties.push(`Discrepancies found: ${consistencyCheck.discrepancies.join(', ')}`)
  }

  // Data quality issues
  if (policyMatch.vehicleMatch.matchStatus === 'PARTIAL_MATCH') {
    dataQualityIssues.push('Partial vehicle match - data quality concern')
  }

  // Calculate overall confidence
  const confidences = [
    policyMatch.vehicleMatch.confidence,
    damageAssessment.confidence,
    100 - consistencyCheck.overallRiskScore
  ]
  const overallConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length

  // Determine recommendation
  let recommendation: 'PROCEED' | 'REVIEW_REQUIRED' | 'REJECT_AND_REASSESS'
  if (challenges.some(c => c.requiresManualReview) || overallConfidence < 70) {
    recommendation = 'REVIEW_REQUIRED'
  } else if (consistencyCheck.requiresInvestigation) {
    recommendation = 'REJECT_AND_REASSESS'
  } else {
    recommendation = 'PROCEED'
  }

  return {
    challenges,
    assumptions,
    uncertainties,
    dataQualityIssues,
    overallConfidence: Math.round(overallConfidence),
    recommendation,
    summary: generateValidationSummary(challenges, recommendation),
    actionItems: challenges.filter(c => c.requiresManualReview).map(c => c.suggestedAlternative)
  }
}

function generateValidationSummary(
  challenges: ValidationChallenge[],
  recommendation: string
): string {
  if (challenges.length === 0) {
    return 'All agent outputs validated successfully. No significant issues identified.'
  }

  const criticalChallenges = challenges.filter(c => c.requiresManualReview)
  
  if (criticalChallenges.length > 0) {
    return `${criticalChallenges.length} finding(s) require manual review. ${recommendation === 'REVIEW_REQUIRED' ? 'Human verification recommended before proceeding.' : 'Proceed with caution.'}`
  }

  return `${challenges.length} minor challenge(s) identified. No critical issues found.`
}

// Simulate independent research
export async function simulateResearch(
  vehicleInfo: { make: string; model: string; year: number },
  damageType: string
): Promise<{
  marketValueRange: { min: number; max: number }
  typicalRepairCosts: { min: number; max: number }
  similarIncidents: number
  recommendations: string[]
}> {
  const researchContext = `
Research request for:
- Vehicle: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}
- Damage Type: ${damageType}

Provide typical market values, repair costs, and any relevant statistics.
`

  const result = await structuredAnalysis<{
    marketValueRange: { min: number; max: number }
    typicalRepairCosts: { min: number; max: number }
    similarIncidents: number
    recommendations: string[]
  }>(
    'You are an insurance research analyst. Provide market research data for claims validation.',
    researchContext
  )

  if (result.success && result.data) {
    return result.data
  }

  // Return estimates if research fails
  const baseValue = 200000 // Default estimate
  return {
    marketValueRange: { min: baseValue * 0.8, max: baseValue * 1.2 },
    typicalRepairCosts: { min: 10000, max: 50000 },
    similarIncidents: 0,
    recommendations: ['Unable to complete research - manual verification recommended']
  }
}
