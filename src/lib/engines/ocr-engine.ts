/**
 * OCR & Data Extraction Engine
 * Extracts structured data from license disc, claim form, and policy schedule
 */

import { structuredAnalysis } from '../ai-client'

export interface LicenseDiscData {
  registrationNumber: string
  vin: string
  make: string
  model: string
  year: number | null
  engineNumber: string
  expiryDate: string
  confidence: {
    registrationNumber: number
    vin: number
    overall: number
  }
  unreadable: string[]
}

export interface ClaimFormData {
  claimNumber: string
  incidentDate: string
  incidentTime: string
  location: string
  description: string
  driverName: string
  driverLicense: string
  driverContact: string
  weatherConditions: string
  roadConditions: string
  thirdPartyInvolved: boolean
  thirdPartyDetails: {
    name: string
    contact: string
    vehicleReg: string
    insurer: string
  } | null
  unreadable: string[]
}

export interface PolicyScheduleData {
  policyNumber: string
  insuredName: string
  insurerName: string
  startDate: string
  endDate: string
  vehicleDetails: {
    vin: string
    registrationNumber: string
    make: string
    model: string
    year: number | null
  }
  sumInsured: number | null
  excess: number | null
  extras: Array<{
    name: string
    value: number
  }>
  conditions: string[]
  unreadable: string[]
}

const LICENSE_DISC_PROMPT = `You are a data extraction specialist. Extract structured data from this license disc image.

Extract the following fields with confidence scores (0-100):
- registrationNumber: Vehicle registration number
- vin: Vehicle Identification Number (17 characters)
- make: Vehicle manufacturer
- model: Vehicle model
- year: Year of manufacture
- engineNumber: Engine number
- expiryDate: License disc expiry date

Rules:
- Do not guess - if a field is unclear, mark it as "UNREADABLE"
- For confidence scores, estimate how certain you are about each extracted value
- VIN should be exactly 17 alphanumeric characters if visible
- Registration number format varies by country (e.g., CA 123 456 for South Africa)`

const CLAIM_FORM_PROMPT = `You are a data extraction specialist. Extract structured data from this claim form image.

Extract the following fields:
- claimNumber: The claim reference number
- incidentDate: Date of the incident (YYYY-MM-DD format)
- incidentTime: Time of the incident
- location: Where the incident occurred
- description: Brief description of what happened
- driverName: Name of the person driving
- driverLicense: Driver's license number
- driverContact: Contact phone/email
- weatherConditions: Weather at time of incident
- roadConditions: Road condition (wet, dry, etc.)
- thirdPartyInvolved: Boolean - was another party involved?
- thirdPartyDetails: If third party involved, extract their details

Rules:
- Do not guess unclear fields - mark as "UNREADABLE"
- Preserve exact wording for descriptions
- Dates should be YYYY-MM-DD format`

const POLICY_SCHEDULE_PROMPT = `You are a data extraction specialist. Extract structured data from this insurance policy schedule.

Extract the following fields:
- policyNumber: The policy reference number
- insuredName: Name of the policy holder
- insurerName: Name of the insurance company
- startDate: Policy start date (YYYY-MM-DD)
- endDate: Policy end date (YYYY-MM-DD)
- vehicleDetails: Insured vehicle information (VIN, reg, make, model, year)
- sumInsured: The insured value (numeric, no currency symbol)
- excess: The excess amount (numeric)
- extras: Array of any insured extras/accessories with their values
- conditions: Array of any policy conditions or notes

Rules:
- Do not guess unclear fields - mark as "UNREADABLE"
- Extract monetary values as numbers only
- VIN should be 17 characters if visible`

export async function extractLicenseDisc(imageBase64: string, mimeType: string): Promise<{
  success: boolean
  data?: LicenseDiscData
  error?: string
}> {
  const result = await structuredAnalysis<LicenseDiscData>(
    LICENSE_DISC_PROMPT,
    'Extract all data from this license disc image. Respond with JSON.',
    imageBase64,
    mimeType
  )

  if (result.success && result.data) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

export async function extractClaimForm(imageBase64: string, mimeType: string): Promise<{
  success: boolean
  data?: ClaimFormData
  error?: string
}> {
  const result = await structuredAnalysis<ClaimFormData>(
    CLAIM_FORM_PROMPT,
    'Extract all data from this claim form image. Respond with JSON.',
    imageBase64,
    mimeType
  )

  if (result.success && result.data) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

export async function extractPolicySchedule(imageBase64: string, mimeType: string): Promise<{
  success: boolean
  data?: PolicyScheduleData
  error?: string
}> {
  const result = await structuredAnalysis<PolicyScheduleData>(
    POLICY_SCHEDULE_PROMPT,
    'Extract all data from this policy schedule image. Respond with JSON.',
    imageBase64,
    mimeType
  )

  if (result.success && result.data) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

// Process multiple damage photos
export async function extractDamageInfo(imageBase64: string, mimeType: string): Promise<{
  success: boolean
  data?: {
    damagedAreas: string[]
    severityAssessment: 'MINOR' | 'MODERATE' | 'SEVERE' | 'TOTAL_LOSS'
    description: string
    observedVehicleInfo: {
      make?: string
      model?: string
      color?: string
      year?: number
    }
  }
  error?: string
}> {
  const DAMAGE_PROMPT = `You are a vehicle damage assessment expert. Analyze this damage photo.

Provide:
- damagedAreas: List of specific damaged parts/components
- severityAssessment: One of MINOR, MODERATE, SEVERE, or TOTAL_LOSS
- description: Detailed description of visible damage
- observedVehicleInfo: If visible, the make, model, color, and approximate year of the vehicle

Rules:
- Be specific about damage locations
- Consider repair complexity in severity assessment
- Note any safety-related damage (structural, airbags, etc.)`

  const result = await structuredAnalysis<{
    damagedAreas: string[]
    severityAssessment: 'MINOR' | 'MODERATE' | 'SEVERE' | 'TOTAL_LOSS'
    description: string
    observedVehicleInfo: {
      make?: string
      model?: string
      color?: string
      year?: number
    }
  }>(
    DAMAGE_PROMPT,
    'Analyze this vehicle damage photo. Respond with JSON.',
    imageBase64,
    mimeType
  )

  if (result.success && result.data) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}
