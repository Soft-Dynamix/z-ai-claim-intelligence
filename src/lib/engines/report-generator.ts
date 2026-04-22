/**
 * Report Generator
 * Generates professional insurance-grade PDF reports
 */

import type { DamageAssessmentResult } from './damage-assessment-engine'
import type { WriteOffEstimationResult } from './writeoff-estimation-engine'
import type { ConsistencyCheckResult } from './consistency-engine'
import type { PolicyMatchResult } from './policy-matching-engine'
import type { LicenseDiscData, ClaimFormData, PolicyScheduleData } from './ocr-engine'
import type { ValidationResult } from './validation-engine'

export interface ReportData {
  claimNumber: string
  processedAt: string
  
  vehicleIdentification: LicenseDiscData | null
  policySchedule: PolicyScheduleData | null
  claimForm: ClaimFormData | null
  policyMatch: PolicyMatchResult | null
  damageAssessment: DamageAssessmentResult | null
  writeOffEstimation: WriteOffEstimationResult | null
  consistencyCheck: ConsistencyCheckResult | null
  validation: ValidationResult | null
  
  finalRecommendation: string
  recommendationReason: string
  confidence: number
}

export interface GeneratedReport {
  success: boolean
  pdfPath?: string
  htmlPath?: string
  error?: string
}

const REPORT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Intelligence Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    @page { margin: 20mm; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; }
  </style>
</head>
<body class="bg-white text-gray-900">
  <!-- Cover Page -->
  <div class="min-h-screen flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
    <div>
      <div class="flex items-center gap-3 mb-8">
        <div class="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
          </svg>
        </div>
        <span class="text-xl font-bold">Z.ai Claims</span>
      </div>
      <h1 class="text-5xl font-bold mb-4">Claim Intelligence Report</h1>
      <p class="text-xl text-gray-300 mb-2">Comprehensive AI-Powered Analysis</p>
    </div>
    
    <div class="grid grid-cols-2 gap-8 mb-8">
      <div>
        <p class="text-gray-400 text-sm mb-1">Claim Number</p>
        <p class="text-2xl font-bold">{{claimNumber}}</p>
      </div>
      <div>
        <p class="text-gray-400 text-sm mb-1">Report Date</p>
        <p class="text-2xl font-bold">{{processedAt}}</p>
      </div>
    </div>
    
    <div class="bg-white/10 rounded-lg p-6">
      <p class="text-gray-400 text-sm mb-2">Final Recommendation</p>
      <div class="flex items-center gap-4">
        <span class="px-4 py-2 rounded-lg font-bold text-xl {{recommendationClass}}">{{finalRecommendation}}</span>
        <span class="text-gray-300">{{confidence}}% confidence</span>
      </div>
      <p class="mt-4 text-gray-300">{{recommendationReason}}</p>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">Executive Summary</h2>
    <div class="bg-gray-50 rounded-lg p-6 mb-8">
      <p class="text-gray-700 leading-relaxed">{{executiveSummary}}</p>
    </div>
    
    <!-- Key Metrics -->
    <div class="grid grid-cols-4 gap-4 mb-8">
      <div class="bg-emerald-50 rounded-lg p-4 text-center">
        <p class="text-sm text-emerald-600 mb-1">Vehicle Match</p>
        <p class="text-2xl font-bold text-emerald-700">{{vehicleMatchStatus}}</p>
      </div>
      <div class="bg-blue-50 rounded-lg p-4 text-center">
        <p class="text-sm text-blue-600 mb-1">Damage Severity</p>
        <p class="text-2xl font-bold text-blue-700">{{damageSeverity}}</p>
      </div>
      <div class="bg-purple-50 rounded-lg p-4 text-center">
        <p class="text-sm text-purple-600 mb-1">Write-Off %</p>
        <p class="text-2xl font-bold text-purple-700">{{writeOffPercentage}}%</p>
      </div>
      <div class="bg-amber-50 rounded-lg p-4 text-center">
        <p class="text-sm text-amber-600 mb-1">Risk Level</p>
        <p class="text-2xl font-bold text-amber-700">{{riskLevel}}</p>
      </div>
    </div>
  </div>

  <!-- Vehicle Identification -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">1. Vehicle Identification</h2>
    {{vehicleSection}}
  </div>

  <!-- Policy & Coverage -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">2. Policy & Coverage Analysis</h2>
    {{policySection}}
  </div>

  <!-- Incident Summary -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">3. Incident Summary</h2>
    {{incidentSection}}
  </div>

  <!-- Damage Assessment -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">4. Damage Assessment</h2>
    {{damageSection}}
  </div>

  <!-- Write-Off Evaluation -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">5. Write-Off Evaluation</h2>
    {{writeOffSection}}
  </div>

  <!-- Consistency & Risk -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">6. Consistency & Risk Analysis</h2>
    {{consistencySection}}
  </div>

  <!-- Final Recommendation -->
  <div class="page-break p-12">
    <h2 class="text-3xl font-bold mb-6 text-slate-800">7. Final Recommendation</h2>
    <div class="bg-slate-900 text-white rounded-lg p-8">
      <div class="flex items-center justify-between mb-6">
        <span class="text-3xl font-bold">{{finalRecommendation}}</span>
        <span class="text-xl text-gray-300">{{confidence}}% Confidence</span>
      </div>
      <p class="text-gray-300 text-lg">{{recommendationReason}}</p>
      
      {{#if actionItems}}
      <div class="mt-6 border-t border-gray-700 pt-6">
        <h4 class="font-bold mb-3">Action Items</h4>
        <ul class="space-y-2">
          {{#each actionItems}}
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
            {{this}}
          </li>
          {{/each}}
        </ul>
      </div>
      {{/if}}
    </div>
  </div>

  <!-- Footer -->
  <div class="p-8 border-t text-center text-gray-500 text-sm">
    <p>Generated by Z.ai Claim Intelligence System</p>
    <p>This report is AI-generated and should be reviewed by a qualified claims assessor.</p>
  </div>
</body>
</html>
`

export function generateReportHTML(data: ReportData): string {
  const getRecommendationClass = (rec: string) => {
    switch (rec) {
      case 'APPROVE': return 'bg-green-500 text-white'
      case 'INVESTIGATE': return 'bg-amber-500 text-white'
      case 'REJECT': return 'bg-red-500 text-white'
      case 'WRITE_OFF': return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const vehicleMatchStatus = data.policyMatch?.vehicleMatch?.matchStatus || 'N/A'
  const damageSeverity = data.damageAssessment?.overallSeverity || 'N/A'
  const writeOffPercentage = data.writeOffEstimation?.writeOffPercentage?.toFixed(1) || '0'
  const riskLevel = data.consistencyCheck?.riskLevel || 'LOW'

  // Generate sections
  const vehicleSection = generateVehicleSection(data.vehicleIdentification, data.policyMatch)
  const policySection = generatePolicySection(data.policySchedule, data.policyMatch)
  const incidentSection = generateIncidentSection(data.claimForm)
  const damageSection = generateDamageSection(data.damageAssessment)
  const writeOffSection = generateWriteOffSection(data.writeOffEstimation)
  const consistencySection = generateConsistencySection(data.consistencyCheck, data.validation)

  const executiveSummary = generateExecutiveSummary(data)

  // Simple template replacement
  let html = REPORT_TEMPLATE
    .replace('{{claimNumber}}', data.claimNumber)
    .replace('{{processedAt}}', data.processedAt)
    .replace('{{finalRecommendation}}', data.finalRecommendation.replace('_', ' '))
    .replace(/{{finalRecommendation}}/g, data.finalRecommendation.replace('_', ' '))
    .replace('{{recommendationClass}}', getRecommendationClass(data.finalRecommendation))
    .replace(/{{confidence}}/g, data.confidence.toString())
    .replace('{{recommendationReason}}', data.recommendationReason)
    .replace('{{vehicleMatchStatus}}', vehicleMatchStatus)
    .replace('{{damageSeverity}}', damageSeverity)
    .replace('{{writeOffPercentage}}', writeOffPercentage)
    .replace('{{riskLevel}}', riskLevel)
    .replace('{{executiveSummary}}', executiveSummary)
    .replace('{{vehicleSection}}', vehicleSection)
    .replace('{{policySection}}', policySection)
    .replace('{{incidentSection}}', incidentSection)
    .replace('{{damageSection}}', damageSection)
    .replace('{{writeOffSection}}', writeOffSection)
    .replace('{{consistencySection}}', consistencySection)

  return html
}

function generateExecutiveSummary(data: ReportData): string {
  const parts: string[] = []
  
  parts.push(`This report presents a comprehensive AI-powered analysis of claim ${data.claimNumber}.`)
  
  if (data.vehicleIdentification) {
    parts.push(`The vehicle under claim is a ${data.vehicleIdentification.year || ''} ${data.vehicleIdentification.make || ''} ${data.vehicleIdentification.model || ''} with registration ${data.vehicleIdentification.registrationNumber || 'unknown'}.`)
  }
  
  if (data.policyMatch) {
    if (data.policyMatch.vehicleMatch.matchStatus === 'MATCH') {
      parts.push(`Vehicle identity has been verified and matches the policy schedule.`)
    } else {
      parts.push(`Vehicle identity verification returned: ${data.policyMatch.vehicleMatch.matchStatus}.`)
    }
  }
  
  if (data.damageAssessment) {
    parts.push(`Damage assessment indicates ${data.damageAssessment.overallSeverity} severity with an estimated repair cost of R${data.damageAssessment.totalEstimatedRepair?.toLocaleString() || 0}.`)
  }
  
  if (data.writeOffEstimation) {
    parts.push(`The write-off ratio is ${data.writeOffEstimation.writeOffPercentage?.toFixed(1) || 0}%, classified as ${data.writeOffEstimation.classification?.replace('_', ' ')}.`)
  }
  
  parts.push(`Final recommendation: ${data.finalRecommendation.replace('_', ' ')} with ${data.confidence}% confidence.`)
  
  return parts.join(' ')
}

function generateVehicleSection(vehicleData: LicenseDiscData | null, policyMatch: PolicyMatchResult | null): string {
  if (!vehicleData) {
    return '<p class="text-gray-500">No vehicle data available.</p>'
  }

  return `
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold text-lg mb-4">Vehicle Details</h3>
        <table class="w-full">
          <tr><td class="text-gray-500 py-2">VIN</td><td class="font-mono">${vehicleData.vin || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Registration</td><td class="font-semibold">${vehicleData.registrationNumber || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Make</td><td>${vehicleData.make || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Model</td><td>${vehicleData.model || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Year</td><td>${vehicleData.year || 'N/A'}</td></tr>
        </table>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold text-lg mb-4">Match Status</h3>
        <div class="flex items-center gap-2 mb-4">
          <span class="px-3 py-1 rounded-full text-sm font-bold ${(policyMatch?.vehicleMatch?.matchStatus === 'MATCH') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}">
            ${policyMatch?.vehicleMatch?.matchStatus || 'PENDING'}
          </span>
        </div>
        <p class="text-gray-600">${policyMatch?.vehicleMatch?.matchDetails || 'No match analysis available.'}</p>
      </div>
    </div>
  `
}

function generatePolicySection(policyData: PolicyScheduleData | null, policyMatch: PolicyMatchResult | null): string {
  if (!policyData) {
    return '<p class="text-gray-500">No policy data available.</p>'
  }

  return `
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold text-lg mb-4">Policy Details</h3>
        <table class="w-full">
          <tr><td class="text-gray-500 py-2">Policy Number</td><td class="font-mono">${policyData.policyNumber || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Insurer</td><td>${policyData.insurerName || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Insured Name</td><td>${policyData.insuredName || 'N/A'}</td></tr>
          <tr><td class="text-gray-500 py-2">Period</td><td>${policyData.startDate || ''} to ${policyData.endDate || ''}</td></tr>
        </table>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold text-lg mb-4">Coverage</h3>
        <table class="w-full">
          <tr><td class="text-gray-500 py-2">Sum Insured</td><td class="font-bold">R ${policyData.sumInsured?.toLocaleString() || 0}</td></tr>
          <tr><td class="text-gray-500 py-2">Excess</td><td>R ${policyData.excess?.toLocaleString() || 0}</td></tr>
        </table>
        ${policyData.extras?.length ? `
        <h4 class="font-semibold mt-4 mb-2">Insured Extras</h4>
        <ul class="space-y-1">
          ${policyData.extras.map(e => `<li class="text-sm text-gray-600">${e.name}: R${e.value?.toLocaleString() || 0}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
    </div>
    
    ${policyMatch?.insuranceAnalysis ? `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-bold text-blue-800 mb-2">Insurance Analysis</h3>
      <p class="text-blue-700">Status: ${policyMatch.insuranceAnalysis.insuranceStatus}</p>
      <p class="text-blue-600 text-sm mt-2">${policyMatch.insuranceAnalysis.recommendation}</p>
    </div>
    ` : ''}
  `
}

function generateIncidentSection(claimForm: ClaimFormData | null): string {
  if (!claimForm) {
    return '<p class="text-gray-500">No incident data available.</p>'
  }

  return `
    <div class="bg-gray-50 rounded-lg p-6">
      <table class="w-full mb-6">
        <tr><td class="text-gray-500 py-2 w-1/4">Date</td><td class="font-semibold">${claimForm.incidentDate || 'N/A'}</td></tr>
        <tr><td class="text-gray-500 py-2">Time</td><td>${claimForm.incidentTime || 'N/A'}</td></tr>
        <tr><td class="text-gray-500 py-2">Location</td><td>${claimForm.location || 'N/A'}</td></tr>
        <tr><td class="text-gray-500 py-2">Driver</td><td>${claimForm.driverName || 'N/A'}</td></tr>
        <tr><td class="text-gray-500 py-2">Weather</td><td>${claimForm.weatherConditions || 'N/A'}</td></tr>
        <tr><td class="text-gray-500 py-2">Third Party</td><td>${claimForm.thirdPartyInvolved ? 'Yes' : 'No'}</td></tr>
      </table>
      
      <h3 class="font-bold mb-2">Description</h3>
      <p class="text-gray-700 bg-white rounded p-4 border">${claimForm.description || 'No description provided.'}</p>
    </div>
  `
}

function generateDamageSection(damage: DamageAssessmentResult | null): string {
  if (!damage) {
    return '<p class="text-gray-500">No damage assessment available.</p>'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MINOR': return 'bg-green-100 text-green-800'
      case 'MODERATE': return 'bg-amber-100 text-amber-800'
      case 'SEVERE': return 'bg-orange-100 text-orange-800'
      case 'TOTAL_LOSS': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return `
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <span class="px-4 py-2 rounded-lg font-bold ${getSeverityColor(damage.overallSeverity)}">${damage.overallSeverity}</span>
        <span class="text-gray-600">Severity Score: ${damage.severityScore}%</span>
      </div>
      
      <div class="mb-4">
        <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500" style="width: ${damage.severityScore}%"></div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold mb-3">Damaged Areas</h3>
        <div class="flex flex-wrap gap-2">
          ${(damage.damagedAreas || []).map((area: any) => `
            <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">${area.area || area}</span>
          `).join('')}
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold mb-3">Financial Impact</h3>
        <p class="text-3xl font-bold text-gray-900">R ${damage.totalEstimatedRepair?.toLocaleString() || 0}</p>
        <p class="text-gray-500 text-sm">Estimated Repair Cost</p>
        ${damage.structuralDamage ? '<p class="text-red-600 mt-2">⚠️ Structural damage detected</p>' : ''}
      </div>
    </div>
    
    ${damage.AssessorNotes ? `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-bold text-blue-800 mb-2">Assessor Notes</h3>
      <p class="text-blue-700">${damage.AssessorNotes}</p>
    </div>
    ` : ''}
  `
}

function generateWriteOffSection(writeOff: WriteOffEstimationResult | null): string {
  if (!writeOff) {
    return '<p class="text-gray-500">No write-off estimation available.</p>'
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'REPAIR': return 'bg-green-100 text-green-800'
      case 'BORDERLINE': return 'bg-amber-100 text-amber-800'
      case 'LIKELY_WRITE_OFF': return 'bg-orange-100 text-orange-800'
      case 'TOTAL_LOSS': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return `
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <p class="text-gray-500 text-sm">Insured Value</p>
        <p class="text-2xl font-bold">R ${writeOff.insuredValue?.toLocaleString() || 0}</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <p class="text-gray-500 text-sm">Repair Cost</p>
        <p class="text-2xl font-bold">R ${writeOff.estimatedRepairCost?.toLocaleString() || 0}</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <p class="text-gray-500 text-sm">Write-Off %</p>
        <p class="text-2xl font-bold">${writeOff.writeOffPercentage?.toFixed(1) || 0}%</p>
      </div>
    </div>
    
    <div class="mb-6">
      <div class="relative h-6 bg-gray-200 rounded-full overflow-hidden">
        <div class="absolute h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500" style="width: ${Math.min(writeOff.writeOffPercentage, 100)}%"></div>
        <div class="absolute top-0 h-full w-0.5 bg-amber-600" style="left: 50%"></div>
        <div class="absolute top-0 h-full w-0.5 bg-red-600" style="left: 70%"></div>
      </div>
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span>0%</span>
        <span class="text-amber-600">50% Threshold</span>
        <span class="text-red-600">70% Write-Off</span>
        <span>100%</span>
      </div>
    </div>
    
    <div class="bg-slate-800 text-white rounded-lg p-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-4 py-2 rounded-lg font-bold ${getClassificationColor(writeOff.classification)}">${writeOff.classification?.replace('_', ' ')}</span>
      </div>
      <p class="text-gray-300">${writeOff.recommendation}</p>
    </div>
    
    ${writeOff.assumptions?.length ? `
    <div class="mt-4 bg-gray-50 rounded-lg p-4">
      <h4 class="font-semibold mb-2">Assumptions</h4>
      <ul class="text-sm text-gray-600 space-y-1">
        ${writeOff.assumptions.map(a => `<li>• ${a}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  `
}

function generateConsistencySection(consistency: ConsistencyCheckResult | null, validation: ValidationResult | null): string {
  if (!consistency && !validation) {
    return '<p class="text-gray-500">No consistency check data available.</p>'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return `
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold mb-4">Consistency Checks</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            ${consistency?.vehicleMatch ? '<span class="text-green-600">✓</span>' : '<span class="text-red-600">✗</span>'}
            <span>Vehicle Match</span>
          </div>
          <div class="flex items-center gap-2">
            ${consistency?.policyValid ? '<span class="text-green-600">✓</span>' : '<span class="text-red-600">✗</span>'}
            <span>Policy Valid</span>
          </div>
          <div class="flex items-center gap-2">
            ${consistency?.damageConsistent ? '<span class="text-green-600">✓</span>' : '<span class="text-red-600">✗</span>'}
            <span>Damage Consistent</span>
          </div>
          <div class="flex items-center gap-2">
            ${consistency?.incidentPlausible ? '<span class="text-green-600">✓</span>' : '<span class="text-red-600">✗</span>'}
            <span>Incident Plausible</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-bold mb-4">Risk Assessment</h3>
        <div class="flex items-center gap-2 mb-4">
          <span class="px-3 py-1 rounded-full font-bold ${getRiskColor(consistency?.riskLevel || 'LOW')}">${consistency?.riskLevel || 'LOW'} RISK</span>
          <span class="text-gray-600">Score: ${consistency?.overallRiskScore || 0}</span>
        </div>
        <p class="text-gray-600 text-sm">${consistency?.summary || 'No issues detected.'}</p>
      </div>
    </div>
    
    ${(consistency?.fraudIndicators?.length || 0) > 0 ? `
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <h3 class="font-bold text-amber-800 mb-3">Risk Indicators</h3>
      <div class="space-y-2">
        ${consistency?.fraudIndicators?.map((indicator: any) => `
          <div class="flex items-start gap-2">
            <span class="px-2 py-1 rounded text-xs font-bold ${getRiskColor(indicator.level)}">${indicator.level}</span>
            <div>
              <p class="font-medium">${indicator.type}</p>
              <p class="text-sm text-gray-600">${indicator.description}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${validation ? `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-bold text-blue-800 mb-3">Validation Summary</h3>
      <p class="text-blue-700 mb-3">${validation.summary}</p>
      <p class="text-sm text-blue-600">Overall Confidence: ${validation.overallConfidence}%</p>
    </div>
    ` : ''}
  `
}

export function downloadReport(html: string, filename: string = 'claim-report.html') {
  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
