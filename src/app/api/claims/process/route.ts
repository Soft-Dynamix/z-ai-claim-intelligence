import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  extractLicenseDisc, 
  extractClaimForm, 
  extractPolicySchedule,
  extractDamageInfo 
} from '@/lib/engines/ocr-engine'
import { matchVehicleToPolicy } from '@/lib/engines/policy-matching-engine'
import { assessDamage, aggregateDamageAssessments } from '@/lib/engines/damage-assessment-engine'
import { estimateWriteOff } from '@/lib/engines/writeoff-estimation-engine'
import { performConsistencyCheck } from '@/lib/engines/consistency-engine'
import { validateClaim } from '@/lib/engines/validation-engine'

export const maxDuration = 300 // 5 minutes max

interface ProcessedDocument {
  type: string
  extractedData: any
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const files = formData.getAll('files') as File[]
    const documentTypes = formData.getAll('documentTypes') as string[]
    const assessorObservationsStr = formData.get('assessorObservations') as string | null
    
    // Parse assessor observations if provided
    let assessorObservations: any[] = []
    if (assessorObservationsStr) {
      try {
        assessorObservations = JSON.parse(assessorObservationsStr)
      } catch (e) {
        console.warn('Failed to parse assessor observations:', e)
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create a new claim record
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    const claim = await db.claim.create({
      data: {
        claimNumber,
        status: 'PROCESSING'
      }
    })

    // Process documents
    const processedDocs: ProcessedDocument[] = []
    const damagePhotos: { base64: string; mimeType: string }[] = []
    
    let licenseData = null
    let claimFormData = null
    let policyData = null
    let damageAssessments: any[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const docType = documentTypes[i] || 'damage_photo'
      
      // Convert file to base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const mimeType = file.type

      // Save document record
      await db.document.create({
        data: {
          claimId: claim.id,
          type: docType.toUpperCase() as any,
          fileName: file.name,
          filePath: `/uploads/${claim.id}/${file.name}`,
          fileSize: file.size,
          mimeType,
          ocrStatus: 'PROCESSING'
        }
      })

      // Process based on document type
      if (docType === 'license_disc') {
        const result = await extractLicenseDisc(base64, mimeType)
        if (result.success && result.data) {
          licenseData = result.data
          processedDocs.push({
            type: 'license_disc',
            extractedData: result.data,
            confidence: result.data.confidence.overall
          })
          
          // Save vehicle data
          await db.vehicle.create({
            data: {
              claimId: claim.id,
              registrationNumber: result.data.registrationNumber,
              vin: result.data.vin,
              make: result.data.make,
              model: result.data.model,
              year: result.data.year,
              regConfidence: result.data.confidence.registrationNumber,
              vinConfidence: result.data.confidence.vin
            }
          })
        }
      } else if (docType === 'claim_form') {
        const result = await extractClaimForm(base64, mimeType)
        if (result.success && result.data) {
          claimFormData = result.data
          processedDocs.push({
            type: 'claim_form',
            extractedData: result.data,
            confidence: 85 // Default confidence for forms
          })
          
          // Save incident data
          await db.incident.create({
            data: {
              claimId: claim.id,
              incidentDate: result.data.incidentDate ? new Date(result.data.incidentDate) : null,
              location: result.data.location,
              description: result.data.description,
              driverName: result.data.driverName,
              driverLicense: result.data.driverLicense
            }
          })
        }
      } else if (docType === 'policy_schedule') {
        const result = await extractPolicySchedule(base64, mimeType)
        if (result.success && result.data) {
          policyData = result.data
          processedDocs.push({
            type: 'policy_schedule',
            extractedData: result.data,
            confidence: 80
          })
          
          // Save policy data
          await db.policy.create({
            data: {
              claimId: claim.id,
              policyNumber: result.data.policyNumber,
              insuredName: result.data.insuredName,
              insurerName: result.data.insurerName,
              startDate: result.data.startDate ? new Date(result.data.startDate) : null,
              endDate: result.data.endDate ? new Date(result.data.endDate) : null,
              insuredVin: result.data.vehicleDetails.vin,
              insuredRegNumber: result.data.vehicleDetails.registrationNumber,
              insuredMake: result.data.vehicleDetails.make,
              insuredModel: result.data.vehicleDetails.model,
              sumInsured: result.data.sumInsured,
              excess: result.data.excess,
              insuredExtras: JSON.stringify(result.data.extras)
            }
          })
        }
      } else {
        // Damage photo
        const result = await extractDamageInfo(base64, mimeType)
        if (result.success && result.data) {
          damageAssessments.push(result.data)
          damagePhotos.push({ base64, mimeType })
          
          processedDocs.push({
            type: 'damage_photo',
            extractedData: result.data,
            confidence: 75
          })
        }
      }
    }

    // Update claim status
    await db.claim.update({
      where: { id: claim.id },
      data: { status: 'ANALYZING' }
    })

    // Run policy matching if we have license and policy data
    let policyMatchResult = null
    if (licenseData && policyData) {
      const observedInfo = damageAssessments[0]?.observedVehicleInfo
      policyMatchResult = await matchVehicleToPolicy(
        licenseData,
        policyData,
        observedInfo
      )
      
      // Update vehicle match status
      await db.vehicle.update({
        where: { claimId: claim.id },
        data: {
          matchStatus: policyMatchResult.vehicleMatch.matchStatus as any,
          matchDetails: JSON.stringify(policyMatchResult.vehicleMatch)
        }
      })
    }

    // Run damage assessment
    let damageAssessmentResult = null
    if (damageAssessments.length > 0) {
      if (damageAssessments.length === 1) {
        damageAssessmentResult = {
          ...damageAssessments[0],
          totalEstimatedRepair: damageAssessments[0].damagedAreas?.reduce(
            (sum: number, a: any) => sum + (a.estimatedCost || 0), 0
          ) || 0
        }
      } else {
        // Aggregate multiple damage assessments
        damageAssessmentResult = await aggregateDamageAssessments(damageAssessments)
      }
      
      // Save damage assessment
      await db.damageAssessment.create({
        data: {
          claimId: claim.id,
          overallSeverity: damageAssessmentResult.overallSeverity as any,
          severityScore: damageAssessmentResult.severityScore,
          damagedAreas: JSON.stringify(damageAssessmentResult.damagedAreas),
          estimatedRepairCost: damageAssessmentResult.totalEstimatedRepair,
          analysisDetails: JSON.stringify(damageAssessmentResult)
        }
      })
    }

    // Run write-off estimation
    let writeOffResult = null
    if (damageAssessmentResult && policyData?.sumInsured) {
      writeOffResult = await estimateWriteOff(
        damageAssessmentResult,
        policyData.sumInsured,
        policyData.excess || 0
      )
      
      await db.writeOffEstimation.create({
        data: {
          claimId: claim.id,
          insuredValue: writeOffResult.insuredValue,
          estimatedRepairCost: writeOffResult.estimatedRepairCost,
          writeOffPercentage: writeOffResult.writeOffPercentage,
          classification: writeOffResult.classification as any,
          recommendation: writeOffResult.recommendation,
          assumptions: JSON.stringify(writeOffResult.assumptions)
        }
      })
    }

    // Run consistency check
    let consistencyResult = null
    if (licenseData || claimFormData || policyData || damageAssessmentResult) {
      consistencyResult = await performConsistencyCheck(
        licenseData,
        claimFormData,
        policyData,
        damageAssessmentResult,
        policyMatchResult?.vehicleMatch || null
      )
      
      await db.consistencyCheck.create({
        data: {
          claimId: claim.id,
          vehicleMatch: consistencyResult.vehicleMatch,
          policyValid: consistencyResult.policyValid,
          damageConsistent: consistencyResult.damageConsistent,
          incidentPlausible: consistencyResult.incidentPlausible,
          riskIndicators: JSON.stringify(consistencyResult.fraudIndicators),
          riskScore: consistencyResult.overallRiskScore,
          summary: consistencyResult.summary
        }
      })
    }

    // Run validation
    let validationResult = null
    if (policyMatchResult && damageAssessmentResult && writeOffResult && consistencyResult) {
      validationResult = await validateClaim(
        policyMatchResult,
        damageAssessmentResult,
        writeOffResult,
        consistencyResult
      )
    }

    // Generate final recommendation
    let finalRecommendation = 'PENDING'
    let recommendationReason = ''
    let confidence = 0

    if (validationResult && consistencyResult && writeOffResult) {
      if (validationResult.recommendation === 'REJECT_AND_REASSESS') {
        finalRecommendation = 'INVESTIGATE'
        recommendationReason = 'Validation engine flagged issues requiring investigation'
      } else if (consistencyResult.riskLevel === 'HIGH' || consistencyResult.riskLevel === 'CRITICAL') {
        finalRecommendation = 'INVESTIGATE'
        recommendationReason = `High risk level detected: ${consistencyResult.summary}`
      } else if (writeOffResult.classification === 'TOTAL_LOSS' || writeOffResult.classification === 'LIKELY_WRITE_OFF') {
        finalRecommendation = 'WRITE_OFF'
        recommendationReason = writeOffResult.recommendation
      } else if (validationResult.recommendation === 'PROCEED') {
        finalRecommendation = 'APPROVE'
        recommendationReason = 'All checks passed. Claim validated for processing.'
      } else {
        finalRecommendation = 'INVESTIGATE'
        recommendationReason = 'Manual review recommended'
      }
      
      confidence = validationResult.overallConfidence

      // Save report
      await db.report.create({
        data: {
          claimId: claim.id,
          vehicleSection: JSON.stringify(licenseData),
          policySection: JSON.stringify(policyData),
          incidentSection: JSON.stringify(claimFormData),
          damageSection: JSON.stringify(damageAssessmentResult),
          consistencySection: JSON.stringify(consistencyResult),
          writeOffSection: JSON.stringify(writeOffResult),
          riskSection: JSON.stringify(consistencyResult?.fraudIndicators),
          recommendation: finalRecommendation as any,
          recommendationReason
        }
      })
    }

    // Update claim status
    await db.claim.update({
      where: { id: claim.id },
      data: { status: 'COMPLETED' }
    })

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      claimNumber,
      processedDocuments: processedDocs.length,
      assessorObservations: assessorObservations,
      results: {
        vehicleIdentification: licenseData,
        policyMatch: policyMatchResult,
        damageAssessment: damageAssessmentResult,
        writeOffEstimation: writeOffResult,
        consistencyCheck: consistencyResult,
        validation: validationResult,
        finalRecommendation,
        recommendationReason,
        confidence
      }
    })

  } catch (error) {
    console.error('Claim processing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process claim',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const claimId = searchParams.get('claimId')

  if (!claimId) {
    return NextResponse.json(
      { error: 'Claim ID required' },
      { status: 400 }
    )
  }

  try {
    const claim = await db.claim.findUnique({
      where: { id: claimId },
      include: {
        vehicle: true,
        policy: true,
        incident: true,
        documents: true,
        damageAssessment: true,
        consistencyCheck: true,
        writeOffEstimation: true,
        report: true
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ claim })
  } catch (error) {
    console.error('Error fetching claim:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim' },
      { status: 500 }
    )
  }
}
