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
export const dynamic = 'force-dynamic'

interface ProcessedDocument {
  type: string
  extractedData: any
  confidence: number
}

export async function POST(request: NextRequest) {
  console.log('[API] === Starting claim processing ===')
  
  try {
    const formData = await request.formData()
    console.log('[API] FormData received')
    
    const files = formData.getAll('files') as File[]
    const documentTypes = formData.getAll('documentTypes') as string[]
    const assessorObservationsStr = formData.get('assessorObservations') as string | null
    
    console.log('[API] Files count:', files.length)
    console.log('[API] Document types:', documentTypes)
    
    // Parse assessor observations if provided
    let assessorObservations: any[] = []
    if (assessorObservationsStr) {
      try {
        assessorObservations = JSON.parse(assessorObservationsStr)
        console.log('[API] Assessor observations:', assessorObservations.length)
      } catch (e) {
        console.warn('[API] Failed to parse assessor observations:', e)
      }
    }
    
    if (files.length === 0) {
      console.error('[API] No files provided')
      return NextResponse.json(
        { error: 'No files provided', success: false },
        { status: 400 }
      )
    }

    // Create a new claim record
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    console.log('[API] Creating claim:', claimNumber)
    
    let claim
    try {
      claim = await db.claim.create({
        data: {
          claimNumber,
          status: 'PROCESSING'
        }
      })
      console.log('[API] Claim created:', claim.id)
    } catch (dbError) {
      console.error('[API] Failed to create claim:', dbError)
      // Continue without database - we'll return results anyway
      claim = { id: 'temp-' + Date.now(), claimNumber }
    }

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
      
      console.log(`[API] Processing file ${i + 1}/${files.length}: ${file.name}, type: ${docType}, size: ${file.size}`)
      
      try {
        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = file.type || 'image/jpeg'
        
        console.log(`[API] File converted to base64, mimeType: ${mimeType}`)

        // Process based on document type
        if (docType === 'license_disc') {
          console.log('[API] Extracting license disc data...')
          const result = await extractLicenseDisc(base64, mimeType)
          console.log('[API] License disc result:', result.success, result.error || 'OK')
          
          if (result.success && result.data) {
            licenseData = result.data
            processedDocs.push({
              type: 'license_disc',
              extractedData: result.data,
              confidence: result.data.confidence?.overall || 75
            })
            console.log('[API] License data extracted:', JSON.stringify(result.data, null, 2))
          }
        } else if (docType === 'claim_form') {
          console.log('[API] Extracting claim form data...')
          const result = await extractClaimForm(base64, mimeType)
          console.log('[API] Claim form result:', result.success, result.error || 'OK')
          
          if (result.success && result.data) {
            claimFormData = result.data
            processedDocs.push({
              type: 'claim_form',
              extractedData: result.data,
              confidence: 85
            })
            console.log('[API] Claim form data extracted:', JSON.stringify(result.data, null, 2))
          }
        } else if (docType === 'policy_schedule') {
          console.log('[API] Extracting policy schedule data...')
          const result = await extractPolicySchedule(base64, mimeType)
          console.log('[API] Policy schedule result:', result.success, result.error || 'OK')
          
          if (result.success && result.data) {
            policyData = result.data
            processedDocs.push({
              type: 'policy_schedule',
              extractedData: result.data,
              confidence: 80
            })
            console.log('[API] Policy data extracted:', JSON.stringify(result.data, null, 2))
          }
        } else {
          // Damage photo
          console.log('[API] Analyzing damage photo...')
          const result = await extractDamageInfo(base64, mimeType)
          console.log('[API] Damage analysis result:', result.success, result.error || 'OK')
          
          if (result.success && result.data) {
            damageAssessments.push(result.data)
            damagePhotos.push({ base64, mimeType })
            processedDocs.push({
              type: 'damage_photo',
              extractedData: result.data,
              confidence: 75
            })
            console.log('[API] Damage data extracted:', JSON.stringify(result.data, null, 2))
          }
        }
      } catch (fileError) {
        console.error(`[API] Error processing file ${file.name}:`, fileError)
        // Continue with other files
      }
    }

    console.log('[API] Document processing complete. Processed:', processedDocs.length)

    // Run analysis engines
    let policyMatchResult = null
    let damageAssessmentResult = null
    let writeOffResult = null
    let consistencyResult = null
    let validationResult = null

    try {
      // Policy matching
      if (licenseData && policyData) {
        console.log('[API] Running policy matching...')
        const observedInfo = damageAssessments[0]?.observedVehicleInfo
        policyMatchResult = await matchVehicleToPolicy(licenseData, policyData, observedInfo)
        console.log('[API] Policy matching complete')
      }

      // Damage assessment
      if (damageAssessments.length > 0) {
        console.log('[API] Aggregating damage assessments...')
        if (damageAssessments.length === 1) {
          damageAssessmentResult = {
            ...damageAssessments[0],
            totalEstimatedRepair: damageAssessments[0].damagedAreas?.reduce(
              (sum: number, a: any) => sum + (a.estimatedCost || 0), 0
            ) || 0
          }
        } else {
          damageAssessmentResult = await aggregateDamageAssessments(damageAssessments)
        }
        console.log('[API] Damage assessment complete')
      }

      // Write-off estimation
      if (damageAssessmentResult && policyData?.sumInsured) {
        console.log('[API] Running write-off estimation...')
        writeOffResult = await estimateWriteOff(
          damageAssessmentResult,
          policyData.sumInsured,
          policyData.excess || 0
        )
        console.log('[API] Write-off estimation complete')
      }

      // Consistency check
      if (licenseData || claimFormData || policyData || damageAssessmentResult) {
        console.log('[API] Running consistency check...')
        consistencyResult = await performConsistencyCheck(
          licenseData,
          claimFormData,
          policyData,
          damageAssessmentResult,
          policyMatchResult?.vehicleMatch || null
        )
        console.log('[API] Consistency check complete')
      }

      // Validation
      if (policyMatchResult && damageAssessmentResult && writeOffResult && consistencyResult) {
        console.log('[API] Running validation...')
        validationResult = await validateClaim(
          policyMatchResult,
          damageAssessmentResult,
          writeOffResult,
          consistencyResult
        )
        console.log('[API] Validation complete')
      }
    } catch (engineError) {
      console.error('[API] Engine error:', engineError)
    }

    // Generate final recommendation
    let finalRecommendation = 'INVESTIGATE'
    let recommendationReason = 'Manual review recommended'
    let confidence = 50

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
      }
      
      confidence = validationResult.overallConfidence || 75
    }

    console.log('[API] === Processing complete ===')
    console.log('[API] Final recommendation:', finalRecommendation, 'Confidence:', confidence)

    // Return results
    return NextResponse.json({
      success: true,
      claimId: claim.id,
      claimNumber,
      processedDocuments: processedDocs.length,
      assessorObservations: assessorObservations,
      results: {
        vehicleIdentification: licenseData,
        claimForm: claimFormData,
        policyData: policyData,
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
    console.error('[API] === CRITICAL ERROR ===')
    console.error('[API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process claim',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
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
