/**
 * Write-Off Estimation Engine
 * Estimates if vehicle is likely a write-off
 * Based on repair cost vs insured value
 */

import { structuredAnalysis } from '../ai-client'
import type { DamageAssessmentResult } from './damage-assessment-engine'

export interface WriteOffEstimationResult {
  insuredValue: number
  estimatedRepairCost: number
  salvageValue: number
  writeOffPercentage: number
  classification: 'REPAIR' | 'BORDERLINE' | 'LIKELY_WRITE_OFF' | 'TOTAL_LOSS'
  recommendation: string
  assumptions: string[]
  breakdown: {
    partsCost: number
    laborCost: number
    paintCost: number
    otherCosts: number
  }
  netClaimEstimate: number
}

const WRITEOFF_ANALYSIS_PROMPT = `You are a motor claims cost analyst with expertise in write-off determinations.

Analyze the repair costs vs insured value to determine write-off status.

WRITE-OFF THRESHOLDS:
- <50% repair ratio → REPAIR
- 50-70% repair ratio → BORDERLINE
- >70% repair ratio → LIKELY_WRITE_OFF
- >85% or structural damage → TOTAL_LOSS

Calculate:
1. Repair cost breakdown (parts, labor, paint, other)
2. Salvage value if written off
3. Net claim estimate
4. Classification based on thresholds

Provide conservative estimates with clear assumptions.

Output JSON with:
- insuredValue
- estimatedRepairCost
- salvageValue (estimate if written off)
- writeOffPercentage
- classification
- recommendation
- assumptions (array)
- breakdown (partsCost, laborCost, paintCost, otherCosts)
- netClaimEstimate (repair cost minus salvage if applicable)`

export function calculateWriteOffPercentage(
  repairCost: number,
  insuredValue: number
): number {
  if (insuredValue <= 0) return 0
  return (repairCost / insuredValue) * 100
}

export function classifyWriteOff(
  percentage: number,
  hasStructuralDamage: boolean
): 'REPAIR' | 'BORDERLINE' | 'LIKELY_WRITE_OFF' | 'TOTAL_LOSS' {
  if (hasStructuralDamage && percentage > 60) {
    return 'TOTAL_LOSS'
  }
  if (percentage > 85) {
    return 'TOTAL_LOSS'
  }
  if (percentage > 70) {
    return 'LIKELY_WRITE_OFF'
  }
  if (percentage >= 50) {
    return 'BORDERLINE'
  }
  return 'REPAIR'
}

export async function estimateWriteOff(
  damageAssessment: DamageAssessmentResult,
  insuredValue: number,
  excessAmount: number = 0,
  vehicleAge?: number
): Promise<WriteOffEstimationResult> {
  const repairCost = damageAssessment.totalEstimatedRepair
  const writeOffPercentage = calculateWriteOffPercentage(repairCost, insuredValue)
  const classification = classifyWriteOff(writeOffPercentage, damageAssessment.structuralDamage)

  // Get detailed analysis from AI
  const analysisContext = `
DAMAGE ASSESSMENT:
- Overall Severity: ${damageAssessment.overallSeverity}
- Severity Score: ${damageAssessment.severityScore}%
- Damaged Areas: ${damageAssessment.damagedAreas.map(a => a.area).join(', ')}
- Total Repair Estimate: R${repairCost.toLocaleString()}
- Structural Damage: ${damageAssessment.structuralDamage}
- Safety Systems Affected: ${damageAssessment.safetySystemsAffected.join(', ')}

FINANCIAL DATA:
- Insured Value: R${insuredValue.toLocaleString()}
- Excess Amount: R${excessAmount.toLocaleString()}
${vehicleAge ? `- Vehicle Age: ${vehicleAge} years` : ''}

WRITE-OFF PERCENTAGE: ${writeOffPercentage.toFixed(1)}%
INITIAL CLASSIFICATION: ${classification}
`

  const result = await structuredAnalysis<Omit<WriteOffEstimationResult, 'assumptions'> & { assumptions: string[] }>(
    WRITEOFF_ANALYSIS_PROMPT,
    analysisContext
  )

  if (result.success && result.data) {
    return {
      ...result.data,
      assumptions: result.data.assumptions || [
        'Estimates based on visible damage only',
        'Parts prices subject to market availability',
        'Labor rates based on industry averages'
      ]
    }
  }

  // Calculate manually if AI fails
  const salvageValue = insuredValue * 0.15 // Typical salvage value
  const partsCost = repairCost * 0.45
  const laborCost = repairCost * 0.35
  const paintCost = repairCost * 0.15
  const otherCosts = repairCost * 0.05
  const netClaimEstimate = classification === 'REPAIR' 
    ? repairCost - excessAmount 
    : insuredValue - salvageValue - excessAmount

  return {
    insuredValue,
    estimatedRepairCost: repairCost,
    salvageValue,
    writeOffPercentage,
    classification,
    recommendation: generateRecommendation(classification, writeOffPercentage),
    assumptions: [
      'Estimates based on visible damage only',
      'Parts prices subject to market availability',
      'Labor rates based on industry averages'
    ],
    breakdown: {
      partsCost,
      laborCost,
      paintCost,
      otherCosts
    },
    netClaimEstimate
  }
}

function generateRecommendation(
  classification: 'REPAIR' | 'BORDERLINE' | 'LIKELY_WRITE_OFF' | 'TOTAL_LOSS',
  percentage: number
): string {
  switch (classification) {
    case 'REPAIR':
      return `Repair recommended. Repair cost (${percentage.toFixed(1)}%) is well below write-off threshold. Vehicle should be economically repairable.`
    case 'BORDERLINE':
      return `Borderline case. Repair cost (${percentage.toFixed(1)}%) is close to write-off threshold. Recommend detailed repair quote before decision. Consider salvage options.`
    case 'LIKELY_WRITE_OFF':
      return `Likely write-off. Repair cost (${percentage.toFixed(1)}%) exceeds recommended repair threshold. Total loss settlement recommended.`
    case 'TOTAL_LOSS':
      return `Total loss declared. Repair cost (${percentage.toFixed(1)}%) far exceeds economic viability. Process as write-off.`
  }
}

// Calculate depreciation-adjusted value
export function calculateDepreciatedValue(
  originalValue: number,
  ageYears: number,
  depreciationRate: number = 0.15 // 15% per year
): number {
  return originalValue * Math.pow(1 - depreciationRate, ageYears)
}

// Betterment adjustment for replaced parts
export function calculateBetterment(
  partsCost: number,
  vehicleAge: number,
  partLifespan: number
): number {
  if (vehicleAge <= partLifespan) return 0
  
  const bettermentYears = vehicleAge - partLifespan
  const bettermentRate = Math.min(bettermentYears * 0.1, 0.5) // Max 50% betterment
  return partsCost * bettermentRate
}
