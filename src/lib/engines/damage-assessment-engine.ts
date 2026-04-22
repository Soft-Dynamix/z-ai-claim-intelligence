/**
 * Damage Assessment Engine
 * Analyzes damage severity from photos
 * Estimates repair costs
 */

import { structuredAnalysis } from '../ai-client'

export interface DamageArea {
  area: string
  severity: 'MINOR' | 'MODERATE' | 'SEVERE'
  repairType: 'REPAIR' | 'REPLACE'
  estimatedCost: number
  confidence: number
}

export interface DamageAssessmentResult {
  overallSeverity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'TOTAL_LOSS'
  severityScore: number // 0-100
  damagedAreas: DamageArea[]
  totalEstimatedRepair: number
  confidence: number
  structuralDamage: boolean
  safetySystemsAffected: string[]
  repairabilityAssessment: string
  AssessorNotes: string
}

const DAMAGE_ASSESSMENT_PROMPT = `You are a motor claims damage assessor with 20 years of experience.

Analyze the vehicle damage and provide a comprehensive assessment.

Consider:
1. Visible damage extent and severity
2. Affected components and systems
3. Repair vs replacement requirements
4. Labor intensity
5. Parts availability and cost
6. Safety implications

Severity Classification:
- MINOR: Cosmetic damage, easily repairable, <15% of vehicle value
- MODERATE: Significant repairs needed, 15-40% of vehicle value
- SEVERE: Major structural/mechanical damage, 40-70% of vehicle value
- TOTAL_LOSS: Beyond economic repair, >70% of vehicle value

Provide detailed assessment in JSON format including:
- overallSeverity
- severityScore (0-100)
- damagedAreas (array with area, severity, repairType, estimatedCost, confidence)
- totalEstimatedRepair
- confidence
- structuralDamage (boolean)
- safetySystemsAffected (array: airbags, seatbelts, etc.)
- repairabilityAssessment
- AssessorNotes

Be conservative in estimates. State assumptions clearly.`

export async function assessDamage(
  damagePhotosBase64: string[],
  mimeTypes: string[],
  vehicleInfo?: { make?: string; model?: string; year?: number; value?: number }
): Promise<DamageAssessmentResult> {
  // For multiple photos, we'll analyze each and aggregate
  // For now, analyze the first photo
  if (damagePhotosBase64.length === 0) {
    return {
      overallSeverity: 'MINOR',
      severityScore: 0,
      damagedAreas: [],
      totalEstimatedRepair: 0,
      confidence: 0,
      structuralDamage: false,
      safetySystemsAffected: [],
      repairabilityAssessment: 'No damage photos provided',
      AssessorNotes: 'Unable to assess without damage photos'
    }
  }

  const vehicleContext = vehicleInfo 
    ? `\n\nVEHICLE CONTEXT:\n- Make: ${vehicleInfo.make || 'Unknown'}\n- Model: ${vehicleInfo.model || 'Unknown'}\n- Year: ${vehicleInfo.year || 'Unknown'}\n- Value: R${vehicleInfo.value?.toLocaleString() || 'Unknown'}`
    : ''

  const result = await structuredAnalysis<Omit<DamageAssessmentResult, 'AssessorNotes'> & { assessorNotes: string }>(
    DAMAGE_ASSESSMENT_PROMPT + vehicleContext,
    'Analyze this vehicle damage photo. Provide a detailed assessment in JSON format.',
    damagePhotosBase64[0],
    mimeTypes[0]
  )

  if (result.success && result.data) {
    return {
      ...result.data,
      AssessorNotes: result.data.assessorNotes || ''
    }
  }

  // Return a default assessment if analysis fails
  return {
    overallSeverity: 'MODERATE',
    severityScore: 50,
    damagedAreas: [],
    totalEstimatedRepair: 0,
    confidence: 0,
    structuralDamage: false,
    safetySystemsAffected: [],
    repairabilityAssessment: 'Unable to assess - analysis failed',
    AssessorNotes: 'Damage assessment failed. Manual inspection required.'
  }
}

// Aggregate damage from multiple photos
export async function aggregateDamageAssessments(
  assessments: DamageAssessmentResult[]
): Promise<DamageAssessmentResult> {
  if (assessments.length === 0) {
    return {
      overallSeverity: 'MINOR',
      severityScore: 0,
      damagedAreas: [],
      totalEstimatedRepair: 0,
      confidence: 0,
      structuralDamage: false,
      safetySystemsAffected: [],
      repairabilityAssessment: 'No assessments provided',
      AssessorNotes: ''
    }
  }

  if (assessments.length === 1) {
    return assessments[0]
  }

  // Aggregate multiple assessments
  const allDamagedAreas = assessments.flatMap(a => a.damagedAreas)
  const totalEstimatedRepair = assessments.reduce((sum, a) => sum + a.totalEstimatedRepair, 0)
  const avgSeverityScore = assessments.reduce((sum, a) => sum + a.severityScore, 0) / assessments.length
  const hasStructuralDamage = assessments.some(a => a.structuralDamage)
  const allSafetySystems = [...new Set(assessments.flatMap(a => a.safetySystemsAffected))]
  const avgConfidence = assessments.reduce((sum, a) => sum + a.confidence, 0) / assessments.length

  // Determine overall severity
  let overallSeverity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'TOTAL_LOSS' = 'MINOR'
  if (avgSeverityScore >= 70) {
    overallSeverity = 'TOTAL_LOSS'
  } else if (avgSeverityScore >= 40) {
    overallSeverity = 'SEVERE'
  } else if (avgSeverityScore >= 15) {
    overallSeverity = 'MODERATE'
  }

  return {
    overallSeverity,
    severityScore: Math.round(avgSeverityScore),
    damagedAreas: allDamagedAreas,
    totalEstimatedRepair,
    confidence: Math.round(avgConfidence),
    structuralDamage: hasStructuralDamage,
    safetySystemsAffected: allSafetySystems,
    repairabilityAssessment: `Aggregated from ${assessments.length} damage photos. ${hasStructuralDamage ? 'Structural damage detected.' : 'No structural damage detected.'}`,
    AssessorNotes: assessments.map(a => a.AssessorNotes).filter(Boolean).join(' ')
  }
}
