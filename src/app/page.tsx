'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Car, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  FileCheck,
  Search,
  BarChart3,
  FileOutput,
  Brain,
  AlertCircle,
  Loader2,
  ChevronRight,
  Scan,
  Scale,
  Calculator,
  ShieldAlert,
  FileSpreadsheet,
  History,
  TrendingUp,
  Activity,
  Zap,
  Sparkles,
  Download,
  Eye,
  FileSearch,
  Cpu,
  Database,
  PenLine,
  MessageSquarePlus,
  User,
  Flag,
  CheckSquare,
  Trash2,
  Edit3,
  Save,
  Plus,
  StickyNote,
  MessageCircle
} from 'lucide-react'

// Types
interface UploadedDocument {
  id: string
  name: string
  type: 'license_disc' | 'claim_form' | 'policy_schedule' | 'damage_photo'
  size: number
  preview?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  file?: File // Store actual file for API upload
}

interface ClaimState {
  status: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'validating' | 'completed' | 'error'
  currentStep: number
  totalSteps: number
  stepName: string
  stepProgress: number
  documents: UploadedDocument[]
  results: ClaimResults | null
  error?: string
}

interface ClaimResults {
  claimNumber: string
  processedAt: string
  vehicleId: VehicleIdentification
  policyAnalysis: PolicyAnalysis
  incidentSummary: IncidentSummary
  damageAssessment: DamageAssessment
  consistencyCheck: ConsistencyCheck
  writeOffEstimation: WriteOffEstimation
  riskIndicators: RiskIndicator[]
  finalRecommendation: FinalRecommendation
}

interface VehicleIdentification {
  vin: string
  registrationNumber: string
  make: string
  model: string
  year: number
  matchStatus: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'PENDING'
  matchDetails: string
}

interface PolicyAnalysis {
  policyNumber: string
  insurerName: string
  sumInsured: number
  excess: number
  coverageValid: boolean
  extrasInsured: string[]
  missingItems: string[]
}

interface IncidentSummary {
  date: string
  location: string
  description: string
  driverName: string
}

interface DamageAssessment {
  severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'TOTAL_LOSS'
  severityScore: number
  damagedAreas: string[]
  estimatedRepairCost: number
}

interface ConsistencyCheck {
  vehicleMatch: boolean
  policyValid: boolean
  damageConsistent: boolean
  incidentPlausible: boolean
  summary: string
}

interface WriteOffEstimation {
  insuredValue: number
  repairCost: number
  writeOffPercentage: number
  classification: 'REPAIR' | 'BORDERLINE' | 'LIKELY_WRITE_OFF' | 'TOTAL_LOSS'
  recommendation: string
}

interface RiskIndicator {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  type: string
  description: string
  details: string
}

interface FinalRecommendation {
  decision: 'APPROVE' | 'INVESTIGATE' | 'REJECT' | 'WRITE_OFF'
  reason: string
  confidence: number
}

interface ClaimHistoryItem {
  id: string
  claimNumber: string
  date: string
  vehicle: string
  status: 'approved' | 'pending' | 'investigating' | 'rejected'
  amount: number
}

// Assessor Observation Types
interface AssessorObservation {
  id: string
  category: ObservationCategory
  title: string
  observation: string
  severity: ObservationSeverity
  relatedSection: string
  requiresFollowUp: boolean
  followUpAction: string
  followUpResolved: boolean
  assessorName: string
  createdAt: string
}

type ObservationCategory = 
  | 'VEHICLE_IDENTIFICATION'
  | 'POLICY_COVERAGE'
  | 'DAMAGE_ASSESSMENT'
  | 'INCIDENT_DETAILS'
  | 'FRAUD_INDICATOR'
  | 'DOCUMENT_QUALITY'
  | 'REPAIR_ESTIMATE'
  | 'GENERAL_NOTE'
  | 'FOLLOW_UP'
  | 'RECOMMENDATION'

type ObservationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'POSITIVE'

interface AssessorSummary {
  overallNotes: string
  assessorDecision: 'APPROVE' | 'INVESTIGATE' | 'REJECT' | 'WRITE_OFF' | null
  assessorDecisionReason: string
  reviewedBy: string
  reviewCompletedAt: string | null
}

// Observation category labels
const OBSERVATION_CATEGORIES: { value: ObservationCategory; label: string; icon: React.ElementType }[] = [
  { value: 'VEHICLE_IDENTIFICATION', label: 'Vehicle ID', icon: Car },
  { value: 'POLICY_COVERAGE', label: 'Policy/Coverage', icon: Shield },
  { value: 'DAMAGE_ASSESSMENT', label: 'Damage', icon: AlertTriangle },
  { value: 'INCIDENT_DETAILS', label: 'Incident', icon: FileText },
  { value: 'FRAUD_INDICATOR', label: 'Fraud Indicator', icon: ShieldAlert },
  { value: 'DOCUMENT_QUALITY', label: 'Doc Quality', icon: FileCheck },
  { value: 'REPAIR_ESTIMATE', label: 'Repair Estimate', icon: Calculator },
  { value: 'GENERAL_NOTE', label: 'General Note', icon: StickyNote },
  { value: 'FOLLOW_UP', label: 'Follow-up', icon: CheckSquare },
  { value: 'RECOMMENDATION', label: 'Recommendation', icon: Flag },
]

const SEVERITY_COLORS: Record<ObservationSeverity, string> = {
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
  WARNING: 'bg-amber-100 text-amber-800 border-amber-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  POSITIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

const SEVERITY_ICONS: Record<ObservationSeverity, React.ElementType> = {
  INFO: AlertCircle,
  WARNING: AlertTriangle,
  CRITICAL: XCircle,
  POSITIVE: CheckCircle2,
}

// Pipeline steps configuration with detailed descriptions
const PIPELINE_STEPS = [
  { id: 'ocr', name: 'OCR Extraction', icon: Scan, description: 'Extracting data from documents', detail: 'Scanning documents with Vision AI...' },
  { id: 'policy', name: 'Policy Matching', icon: Shield, description: 'Matching vehicle to policy', detail: 'Cross-referencing VIN and registration...' },
  { id: 'damage', name: 'Damage Analysis', icon: AlertTriangle, description: 'Assessing damage severity', detail: 'Analyzing damage patterns and severity...' },
  { id: 'writeoff', name: 'Write-Off Estimation', icon: Calculator, description: 'Calculating repair vs value', detail: 'Computing financial metrics...' },
  { id: 'consistency', name: 'Consistency Check', icon: Scale, description: 'Detecting fraud indicators', detail: 'Running fraud detection algorithms...' },
  { id: 'validation', name: 'Validation Engine', icon: ShieldAlert, description: 'Challenging all findings', detail: 'Cross-validating all agent outputs...' },
  { id: 'report', name: 'Report Generation', icon: FileSpreadsheet, description: 'Creating final report', detail: 'Generating comprehensive report...' },
]

// Mock claim history
const CLAIM_HISTORY: ClaimHistoryItem[] = [
  { id: '1', claimNumber: 'CLM-2024-001', date: '2024-01-15', vehicle: 'Toyota Corolla 2021', status: 'approved', amount: 48000 },
  { id: '2', claimNumber: 'CLM-2024-002', date: '2024-01-14', vehicle: 'BMW 320i 2020', status: 'investigating', amount: 125000 },
  { id: '3', claimNumber: 'CLM-2024-003', date: '2024-01-13', vehicle: 'VW Polo 2022', status: 'approved', amount: 22000 },
  { id: '4', claimNumber: 'CLM-2024-004', date: '2024-01-12', vehicle: 'Mercedes C200 2019', status: 'rejected', amount: 185000 },
]

export default function Home() {
  const [claim, setClaim] = useState<ClaimState>({
    status: 'idle',
    currentStep: 0,
    totalSteps: PIPELINE_STEPS.length,
    stepName: '',
    stepProgress: 0,
    documents: [],
    results: null
  })

  const [showHistory, setShowHistory] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  // Assessor Notes State
  const [observations, setObservations] = useState<AssessorObservation[]>([])
  const [assessorSummary, setAssessorSummary] = useState<AssessorSummary>({
    overallNotes: '',
    assessorDecision: null,
    assessorDecisionReason: '',
    reviewedBy: '',
    reviewCompletedAt: null
  })
  const [isAddingObservation, setIsAddingObservation] = useState(false)
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null)
  
  // New observation form state
  const [newObservation, setNewObservation] = useState<Partial<AssessorObservation>>({
    category: 'GENERAL_NOTE',
    severity: 'INFO',
    title: '',
    observation: '',
    relatedSection: '',
    requiresFollowUp: false,
    followUpAction: '',
    assessorName: ''
  })

  // Animate progress bar
  useEffect(() => {
    if (claim.status === 'processing' || claim.status === 'analyzing' || claim.status === 'validating') {
      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          if (prev >= 100) return 0
          return prev + 2
        })
      }, 50)
      return () => clearInterval(interval)
    }
  }, [claim.status])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const startProcessing = async () => {
    if (claim.documents.length === 0) return

    setClaim(prev => ({ 
      ...prev, 
      status: 'processing', 
      currentStep: 1, 
      stepName: PIPELINE_STEPS[0].name,
      stepProgress: 0
    }))

    try {
      // Prepare FormData for real API call
      const formData = new FormData()
      
      // Add files and document types to FormData
      let fileCount = 0
      claim.documents.forEach(doc => {
        if (doc.file) {
          console.log(`[Frontend] Adding file: ${doc.name}, type: ${doc.type}, size: ${doc.file.size}`)
          formData.append('files', doc.file)
          formData.append('documentTypes', doc.type)
          fileCount++
        }
      })
      
      console.log(`[Frontend] Total files to upload: ${fileCount}`)
      
      // Add assessor observations
      formData.append('assessorObservations', JSON.stringify(observations))

      // Simulate pipeline steps for visual feedback while processing
      const progressInterval = setInterval(() => {
        setClaim(prev => {
          const newStep = prev.currentStep < PIPELINE_STEPS.length ? prev.currentStep + 1 : prev.currentStep
          const step = PIPELINE_STEPS[newStep - 1]
          return {
            ...prev,
            currentStep: newStep,
            stepName: step?.name || prev.stepName,
            status: newStep < 3 ? 'processing' : newStep < 6 ? 'analyzing' : 'validating'
          }
        })
      }, 1500) // Slower progress since VLM takes time

      console.log('[Frontend] Calling API...')
      
      // Call the real API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 250000) // 4 min timeout
      
      const response = await fetch('/api/claims/process', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      
      console.log('[Frontend] API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Frontend] API error response:', errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const apiResult = await response.json()
      console.log('[Frontend] API result:', apiResult)
      
      // Transform API results to match our ClaimResults interface
      const processedResults = transformApiResults(apiResult)

      setClaim(prev => ({
        ...prev,
        status: 'completed',
        stepProgress: 100,
        currentStep: PIPELINE_STEPS.length,
        results: processedResults
      }))
    } catch (error) {
      console.error('[Frontend] Processing error:', error)
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The analysis is taking too long. Please try with smaller images.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setClaim(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))
    }
  }

  // Transform API results to match frontend ClaimResults interface
  const transformApiResults = (apiResult: any): ClaimResults => {
    console.log('[Transform] Input:', apiResult)
    
    const results = apiResult.results || {}
    const vehicle = results.vehicleIdentification || {}
    const policyMatch = results.policyMatch || {}
    const policyData = results.policyData || {}
    const claimForm = results.claimForm || {}
    const damage = results.damageAssessment || {}
    const writeOff = results.writeOffEstimation || {}
    const consistency = results.consistencyCheck || {}
    
    const transformed = {
      claimNumber: apiResult.claimNumber || `CLM-${Date.now()}`,
      processedAt: new Date().toLocaleString(),
      vehicleId: {
        vin: vehicle.vin || 'Not extracted',
        registrationNumber: vehicle.registrationNumber || 'Not extracted',
        make: vehicle.make || damage.observedVehicleInfo?.make || 'Unknown',
        model: vehicle.model || damage.observedVehicleInfo?.model || 'Unknown',
        year: vehicle.year || damage.observedVehicleInfo?.approximateYear || null,
        matchStatus: policyMatch.vehicleMatch?.matchStatus || 'PENDING',
        matchDetails: policyMatch.vehicleMatch?.matchDetails || policyMatch.summary || 'Vehicle identification pending'
      },
      policyAnalysis: {
        policyNumber: policyData.policyNumber || policyMatch.insuranceAnalysis?.policyNumber || 'Not extracted',
        insurerName: policyData.insurerName || 'Not extracted',
        sumInsured: policyData.sumInsured || policyMatch.insuranceAnalysis?.sumInsured || 0,
        excess: policyData.excess || 0,
        coverageValid: consistency.policyValid ?? true,
        extrasInsured: policyData.extras?.map((e: any) => e.name) || policyMatch.extrasAnalysis?.insuredExtras || [],
        missingItems: policyMatch.extrasAnalysis?.notInsuredButObserved || []
      },
      incidentSummary: {
        date: claimForm.incidentDate || 'Not provided',
        location: claimForm.location || 'Not provided',
        description: claimForm.description || damage.description || 'No description available',
        driverName: claimForm.driverName || 'Not provided'
      },
      damageAssessment: {
        severity: damage.overallSeverity || damage.severityAssessment || 'MODERATE',
        severityScore: damage.severityScore || 50,
        damagedAreas: damage.damagedAreas?.map((a: any) => typeof a === 'string' ? a : a.area || a.name) || [],
        estimatedRepairCost: damage.totalEstimatedRepair || damage.estimatedRepairCost || 0
      },
      consistencyCheck: {
        vehicleMatch: consistency.vehicleMatch ?? (policyMatch.vehicleMatch?.matchStatus === 'MATCH'),
        policyValid: consistency.policyValid ?? true,
        damageConsistent: consistency.damageConsistent ?? true,
        incidentPlausible: consistency.incidentPlausible ?? true,
        summary: consistency.summary || 'Consistency analysis pending'
      },
      writeOffEstimation: {
        insuredValue: writeOff.insuredValue || policyData.sumInsured || 0,
        repairCost: writeOff.estimatedRepairCost || damage.totalEstimatedRepair || 0,
        writeOffPercentage: writeOff.writeOffPercentage || 0,
        classification: writeOff.classification || 'REPAIR',
        recommendation: writeOff.recommendation || 'Repair cost analysis pending'
      },
      riskIndicators: consistency.fraudIndicators?.map((fi: any) => ({
        level: fi.severity || fi.level || 'LOW',
        type: fi.type || 'General',
        description: fi.description || '',
        details: fi.details || ''
      })) || [],
      finalRecommendation: {
        decision: results.finalRecommendation || 'INVESTIGATE',
        reason: results.recommendationReason || 'Manual review recommended',
        confidence: results.confidence || 50
      }
    }
    
    console.log('[Transform] Output:', transformed)
    return transformed
  }

  const getMockResults = (): Omit<ClaimResults, 'claimNumber' | 'processedAt'> => ({
    vehicleId: {
      vin: '1HGBH41JXMN109186',
      registrationNumber: 'CA 123 456',
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      matchStatus: 'MATCH',
      matchDetails: 'VIN matches policy schedule. Registration confirmed.'
    },
    policyAnalysis: {
      policyNumber: 'POL-2024-789456',
      insurerName: 'SafeGuard Insurance Ltd',
      sumInsured: 285000,
      excess: 5000,
      coverageValid: true,
      extrasInsured: ['Alloy Wheels', 'Tow Bar', 'Sound System'],
      missingItems: []
    },
    incidentSummary: {
      date: '2024-01-15',
      location: 'Johannesburg, Gauteng',
      description: 'Rear-end collision at traffic light',
      driverName: 'John Smith'
    },
    damageAssessment: {
      severity: 'MODERATE',
      severityScore: 45,
      damagedAreas: ['Rear Bumper', 'Rear Panel', 'Tail Lights', 'Trunk Lid'],
      estimatedRepairCost: 48000
    },
    consistencyCheck: {
      vehicleMatch: true,
      policyValid: true,
      damageConsistent: true,
      incidentPlausible: true,
      summary: 'All consistency checks passed. No fraud indicators detected.'
    },
    writeOffEstimation: {
      insuredValue: 285000,
      repairCost: 48000,
      writeOffPercentage: 16.8,
      classification: 'REPAIR',
      recommendation: 'Repair recommended. Repair cost is 16.8% of insured value, well below write-off threshold.'
    },
    riskIndicators: [
      { level: 'LOW', type: 'Vehicle Identity', description: 'VIN verified', details: 'VIN matches all documents' },
      { level: 'LOW', type: 'Policy Status', description: 'Policy active', details: 'Coverage valid at time of incident' }
    ],
    finalRecommendation: {
      decision: 'APPROVE',
      reason: 'All checks passed. Damage assessment consistent with incident description. Repair cost within acceptable limits.',
      confidence: 94
    }
  })

  const resetClaim = () => {
    setClaim({
      status: 'idle',
      currentStep: 0,
      totalSteps: PIPELINE_STEPS.length,
      stepName: '',
      stepProgress: 0,
      documents: [],
      results: null
    })
    setShowHistory(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MINOR': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'MODERATE': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'SEVERE': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'TOTAL_LOSS': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-emerald-100 text-emerald-800'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'APPROVE': return 'from-emerald-500 to-green-600'
      case 'INVESTIGATE': return 'from-amber-500 to-orange-600'
      case 'REJECT': return 'from-red-500 to-rose-600'
      case 'WRITE_OFF': return 'from-purple-500 to-violet-600'
      default: return 'from-gray-500 to-slate-600'
    }
  }

  // Assessor Observation Management Functions
  const addObservation = () => {
    if (!newObservation.observation || !newObservation.title) return
    
    const observation: AssessorObservation = {
      id: Math.random().toString(36).substr(2, 9),
      category: newObservation.category || 'GENERAL_NOTE',
      title: newObservation.title,
      observation: newObservation.observation,
      severity: newObservation.severity || 'INFO',
      relatedSection: newObservation.relatedSection || '',
      requiresFollowUp: newObservation.requiresFollowUp || false,
      followUpAction: newObservation.followUpAction || '',
      followUpResolved: false,
      assessorName: newObservation.assessorName || 'Assessor',
      createdAt: new Date().toLocaleString()
    }
    
    setObservations(prev => [...prev, observation])
    setNewObservation({
      category: 'GENERAL_NOTE',
      severity: 'INFO',
      title: '',
      observation: '',
      relatedSection: '',
      requiresFollowUp: false,
      followUpAction: '',
      assessorName: newObservation.assessorName
    })
    setIsAddingObservation(false)
  }

  const updateObservation = (id: string, updates: Partial<AssessorObservation>) => {
    setObservations(prev => prev.map(obs => 
      obs.id === id ? { ...obs, ...updates } : obs
    ))
  }

  const deleteObservation = (id: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== id))
  }

  const toggleFollowUpResolved = (id: string) => {
    setObservations(prev => prev.map(obs => 
      obs.id === id ? { ...obs, followUpResolved: !obs.followUpResolved } : obs
    ))
  }

  const getCategoryLabel = (category: ObservationCategory) => {
    return OBSERVATION_CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getCategoryIcon = (category: ObservationCategory) => {
    return OBSERVATION_CATEGORIES.find(c => c.value === category)?.icon || StickyNote
  }

  const exportPDF = () => {
    if (!claim.results) return
    
    // Generate observations HTML
    const observationsHTML = observations.length > 0 ? `
    <div class="section" style="background: #fef3c7; border: 1px solid #f59e0b;">
      <h2>📋 Assessor Observations (${observations.length})</h2>
      ${observations.map(obs => `
        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid ${
          obs.severity === 'CRITICAL' ? '#ef4444' : 
          obs.severity === 'WARNING' ? '#f59e0b' : 
          obs.severity === 'POSITIVE' ? '#10b981' : '#3b82f6'
        };">
          <p style="margin: 0; font-weight: 600;">${obs.title}</p>
          <p style="margin: 5px 0; color: #6b7280;">${obs.observation}</p>
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            <span class="badge" style="background: ${
              obs.severity === 'CRITICAL' ? '#fee2e2' : 
              obs.severity === 'WARNING' ? '#fef3c7' : 
              obs.severity === 'POSITIVE' ? '#d1fae5' : '#dbeafe'
            }; color: ${
              obs.severity === 'CRITICAL' ? '#991b1b' : 
              obs.severity === 'WARNING' ? '#92400e' : 
              obs.severity === 'POSITIVE' ? '#065f46' : '#1e40af'
            };">${obs.severity}</span>
            | ${obs.category.replace(/_/g, ' ')} | By: ${obs.assessorName} | ${obs.createdAt}
            ${obs.requiresFollowUp ? ` | <strong style="color: #d97706;">Follow-up: ${obs.followUpAction}</strong>` : ''}
          </p>
        </div>
      `).join('')}
    </div>
    ` : ''
    
    // Generate assessor summary HTML
    const assessorSummaryHTML = assessorSummary.reviewCompletedAt ? `
    <div class="section" style="background: #ecfdf5; border: 1px solid #10b981;">
      <h2>✅ Assessor Review</h2>
      <p><span class="label">Reviewed By:</span> <span class="value">${assessorSummary.reviewedBy}</span></p>
      <p><span class="label">Review Completed:</span> <span class="value">${assessorSummary.reviewCompletedAt}</span></p>
      ${assessorSummary.assessorDecision ? `
        <p><span class="label">Assessor Decision:</span> <span class="badge ${assessorSummary.assessorDecision === 'APPROVE' ? 'approved' : ''}">${assessorSummary.assessorDecision}</span></p>
        <p>${assessorSummary.assessorDecisionReason}</p>
      ` : ''}
      ${assessorSummary.overallNotes ? `
        <p><span class="label">Overall Notes:</span></p>
        <p style="white-space: pre-wrap;">${assessorSummary.overallNotes}</p>
      ` : ''}
    </div>
    ` : ''
    
    // Create a simple HTML report and download it
    const reportContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Claim Report - ${claim.results.claimNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .value { font-weight: 600; color: #1f2937; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .approved { background: #d1fae5; color: #065f46; }
    .match { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <h1>🧠 Z.ai Claim Intelligence Report</h1>
  <p><strong>Claim Number:</strong> ${claim.results.claimNumber}</p>
  <p><strong>Processed At:</strong> ${claim.results.processedAt}</p>
  
  <div class="section">
    <h2>Vehicle Identification</h2>
    <p><span class="label">VIN:</span> <span class="value">${claim.results.vehicleId.vin}</span></p>
    <p><span class="label">Registration:</span> <span class="value">${claim.results.vehicleId.registrationNumber}</span></p>
    <p><span class="label">Vehicle:</span> <span class="value">${claim.results.vehicleId.make} ${claim.results.vehicleId.model} (${claim.results.vehicleId.year})</span></p>
    <p><span class="badge match">${claim.results.vehicleId.matchStatus}</span></p>
  </div>
  
  <div class="section">
    <h2>Policy Analysis</h2>
    <p><span class="label">Policy Number:</span> <span class="value">${claim.results.policyAnalysis.policyNumber}</span></p>
    <p><span class="label">Insurer:</span> <span class="value">${claim.results.policyAnalysis.insurerName}</span></p>
    <p><span class="label">Sum Insured:</span> <span class="value">R ${claim.results.policyAnalysis.sumInsured.toLocaleString()}</span></p>
  </div>
  
  <div class="section">
    <h2>Damage Assessment</h2>
    <p><span class="label">Severity:</span> <span class="badge">${claim.results.damageAssessment.severity}</span></p>
    <p><span class="label">Estimated Repair Cost:</span> <span class="value">R ${claim.results.damageAssessment.estimatedRepairCost.toLocaleString()}</span></p>
    <p><span class="label">Damaged Areas:</span> <span class="value">${claim.results.damageAssessment.damagedAreas.join(', ')}</span></p>
  </div>
  
  <div class="section">
    <h2>Write-Off Estimation</h2>
    <p><span class="label">Write-Off Percentage:</span> <span class="value">${claim.results.writeOffEstimation.writeOffPercentage}%</span></p>
    <p><span class="label">Classification:</span> <span class="badge">${claim.results.writeOffEstimation.classification}</span></p>
    <p>${claim.results.writeOffEstimation.recommendation}</p>
  </div>
  
  ${observationsHTML}
  
  ${assessorSummaryHTML}
  
  <div class="section" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
    <h2 style="color: white; border: none;">AI Final Recommendation</h2>
    <p style="font-size: 24px; font-weight: bold;">${claim.results.finalRecommendation.decision}</p>
    <p style="opacity: 0.9;">${claim.results.finalRecommendation.reason}</p>
    <p style="opacity: 0.8; font-size: 14px;">Confidence: ${claim.results.finalRecommendation.confidence}%</p>
  </div>
  
  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
    Generated by Z.ai Claim Intelligence System v2.0<br>
    ${observations.length > 0 ? `Includes ${observations.length} assessor observation(s)` : ''}<br>
    ${assessorSummary.reviewCompletedAt ? `Reviewed by ${assessorSummary.reviewedBy}` : ''}
  </footer>
</body>
</html>
    `
    
    const blob = new Blob([reportContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claim-report-${claim.results.claimNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Document upload card component - separate upload zone for each type
  const DocumentUploadCard = ({ 
    docType, 
    icon: Icon, 
    title, 
    desc, 
    required,
    bgColor,
    iconColor 
  }: { 
    docType: UploadedDocument['type']
    icon: React.ElementType
    title: string
    desc: string
    required: boolean
    bgColor: string
    iconColor: string
  }) => {
    const docs = claim.documents.filter(d => d.type === docType)
    const [isDragOver, setIsDragOver] = useState(false)
    
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }
    
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
    }
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const files = Array.from(e.dataTransfer.files)
        const newDocs: UploadedDocument[] = files.map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: docType,
          size: file.size,
          status: 'pending',
          file: file // Store actual file for API upload
        }))
        setClaim(prev => ({
          ...prev,
          documents: [...prev.documents, ...newDocs]
        }))
      }
    }
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files)
        const newDocs: UploadedDocument[] = files.map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: docType,
          size: file.size,
          status: 'pending',
          file: file // Store actual file for API upload
        }))
        setClaim(prev => ({
          ...prev,
          documents: [...prev.documents, ...newDocs]
        }))
      }
    }
    
    const removeDoc = (id: string) => {
      setClaim(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== id)
      }))
    }
    
    return (
      <Card className={`relative overflow-hidden transition-all duration-300 ${docs.length > 0 ? 'ring-2 ring-emerald-400 shadow-lg' : isDragOver ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-md'}`}>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {title}
                  {required && <span className="text-red-500 text-sm">*</span>}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
            {docs.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {docs.length} file{docs.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 cursor-pointer
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : docs.length > 0
                  ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }
            `}
          >
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center gap-2">
              <Upload className={`w-4 h-4 ${docs.length > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${docs.length > 0 ? 'text-emerald-700' : 'text-gray-600'}`}>
                {docs.length > 0 ? 'Add more files' : 'Click or drag files here'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG • Max 10MB</p>
          </div>
          
          {/* Uploaded Files List */}
          {docs.length > 0 && (
            <div className="mt-3 space-y-2">
              {docs.map(doc => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">({formatFileSize(doc.size)})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                    onClick={() => removeDoc(doc.id)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Z.ai Claims</h1>
                <p className="text-xs text-gray-500">Intelligent Claim Validation System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {claim.status !== 'idle' && claim.status !== 'completed' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span className="text-sm text-amber-700 font-medium">{claim.stepName}</span>
                </div>
              )}
              
              {claim.status === 'idle' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistory(!showHistory)}
                  className="gap-2"
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
              )}
              
              {claim.status === 'completed' && (
                <Button variant="outline" onClick={resetClaim} className="gap-2">
                  <Upload className="w-4 h-4" />
                  New Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {showHistory && claim.status === 'idle' ? (
          /* Claims History Dashboard */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Claims History</h2>
                <p className="text-gray-600">Recent claims processed by the system</p>
              </div>
              <Button onClick={() => setShowHistory(false)} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Process New Claim
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Total Claims</p>
                      <p className="text-3xl font-bold">247</p>
                    </div>
                    <Activity className="w-8 h-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Approved</p>
                      <p className="text-3xl font-bold">189</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Investigating</p>
                      <p className="text-3xl font-bold">23</p>
                    </div>
                    <Search className="w-8 h-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Value</p>
                      <p className="text-2xl font-bold">R 4.2M</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Claims Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {CLAIM_HISTORY.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                          <Car className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.claimNumber}</p>
                          <p className="text-sm text-gray-500">{item.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">R {item.amount.toLocaleString()}</p>
                        <Badge className={
                          item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'investigating' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : claim.status === 'idle' ? (
          /* Upload Section */
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Analysis
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Upload Claim Documents
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload each document type separately. All required documents must be uploaded before analysis can begin.
              </p>
            </div>

            {/* Required Documents Section */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="w-5 h-5 text-slate-600" />
                  Required Documents
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({claim.documents.filter(d => ['license_disc', 'claim_form', 'policy_schedule'].includes(d.type)).length}/3 uploaded)
                  </span>
                </CardTitle>
                <CardDescription>These documents are required for claim processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DocumentUploadCard
                    docType="license_disc"
                    icon={Car}
                    title="License Disc"
                    desc="Vehicle registration & VIN number"
                    required={true}
                    bgColor="bg-blue-100"
                    iconColor="text-blue-600"
                  />
                  <DocumentUploadCard
                    docType="claim_form"
                    icon={FileText}
                    title="Claim Form"
                    desc="Incident details & driver information"
                    required={true}
                    bgColor="bg-purple-100"
                    iconColor="text-purple-600"
                  />
                  <DocumentUploadCard
                    docType="policy_schedule"
                    icon={Shield}
                    title="Policy Schedule"
                    desc="Coverage details & insured value"
                    required={true}
                    bgColor="bg-emerald-100"
                    iconColor="text-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Supporting Documents Section */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Supporting Documents
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({claim.documents.filter(d => d.type === 'damage_photo').length} uploaded)
                  </span>
                </CardTitle>
                <CardDescription>Upload damage photos to help assess the claim</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUploadCard
                  docType="damage_photo"
                  icon={AlertTriangle}
                  title="Damage Photos"
                  desc="Upload multiple photos showing vehicle damage from different angles"
                  required={false}
                  bgColor="bg-amber-100"
                  iconColor="text-amber-600"
                />
              </CardContent>
            </Card>

            {/* Assessor Observations & Notes - Before Analysis */}
            <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PenLine className="w-5 h-5 text-rose-600" />
                      Assessor Observations & Notes
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({observations.length} recorded)
                      </span>
                    </CardTitle>
                    <CardDescription>Record your initial observations before AI analysis. These will be included in the AI processing.</CardDescription>
                  </div>
                  {!isAddingObservation && (
                    <Button 
                      onClick={() => setIsAddingObservation(true)}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Observation
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Observation Form */}
                {isAddingObservation && (
                  <Card className="border-rose-300 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 border-b py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="w-4 h-4 text-rose-600" />
                        New Observation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {/* Category and Severity Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                          <select 
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            value={newObservation.category}
                            onChange={(e) => setNewObservation(prev => ({ ...prev, category: e.target.value as ObservationCategory }))}
                          >
                            {OBSERVATION_CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Severity</label>
                          <select 
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            value={newObservation.severity}
                            onChange={(e) => setNewObservation(prev => ({ ...prev, severity: e.target.value as ObservationSeverity }))}
                          >
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="POSITIVE">Positive</option>
                          </select>
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Title</label>
                        <input
                          type="text"
                          placeholder="Brief title for this observation..."
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                          value={newObservation.title || ''}
                          onChange={(e) => setNewObservation(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      {/* Observation */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Observation Details</label>
                        <textarea
                          placeholder="Describe your observation in detail..."
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 min-h-[80px]"
                          value={newObservation.observation || ''}
                          onChange={(e) => setNewObservation(prev => ({ ...prev, observation: e.target.value }))}
                        />
                      </div>

                      {/* Assessor Name */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Assessor Name</label>
                        <input
                          type="text"
                          placeholder="Your name"
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                          value={newObservation.assessorName || ''}
                          onChange={(e) => setNewObservation(prev => ({ ...prev, assessorName: e.target.value }))}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => setIsAddingObservation(false)}>
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={addObservation}
                          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 gap-1"
                          disabled={!newObservation.title || !newObservation.observation}
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Observations List */}
                {observations.length > 0 ? (
                  <div className="space-y-2">
                    {observations.map((obs) => {
                      const CategoryIcon = getCategoryIcon(obs.category)
                      const SeverityIcon = SEVERITY_ICONS[obs.severity]
                      
                      return (
                        <div 
                          key={obs.id} 
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 hover:border-rose-200 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${SEVERITY_COLORS[obs.severity]}`}>
                            <SeverityIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className="gap-1 text-xs">
                                <CategoryIcon className="w-3 h-3" />
                                {getCategoryLabel(obs.category)}
                              </Badge>
                              <Badge className={`${SEVERITY_COLORS[obs.severity]} text-xs`}>
                                {obs.severity}
                              </Badge>
                            </div>
                            <p className="font-medium text-gray-900 text-sm">{obs.title}</p>
                            <p className="text-gray-600 text-xs mt-0.5">{obs.observation}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {obs.assessorName}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                            onClick={() => deleteObservation(obs.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  !isAddingObservation && (
                    <div className="text-center py-6 text-gray-500">
                      <StickyNote className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No observations recorded yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add your initial observations before starting AI analysis</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Upload Summary & Process Button */}
            <Card className={`transition-all duration-300 ${
              claim.documents.filter(d => ['license_disc', 'claim_form', 'policy_schedule'].includes(d.type)).length >= 3 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 ring-2 ring-emerald-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {claim.documents.filter(d => ['license_disc', 'claim_form', 'policy_schedule'].includes(d.type)).length >= 3 ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          Ready for Analysis
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 text-amber-600" />
                          Upload Required Documents
                        </>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {claim.documents.filter(d => ['license_disc', 'claim_form', 'policy_schedule'].includes(d.type)).length >= 3 
                        ? `All ${claim.documents.length} documents uploaded. Ready to start AI analysis.`
                        : `Upload ${3 - claim.documents.filter(d => ['license_disc', 'claim_form', 'policy_schedule'].includes(d.type)).length} more required document(s) to proceed.`
                      }
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={startProcessing}
                    disabled={claim.documents.filter(d => ['license_disc', 'claim_form', 'policy_schedule'].includes(d.type)).length < 3}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start AI Analysis
                  </Button>
                </div>
                
                {/* Processing Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-4 h-4" />
                      6 AI Engines
                    </span>
                    <span className="flex items-center gap-1">
                      <Scan className="w-4 h-4" />
                      OCR Extraction
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" />
                      Fraud Detection
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      Report Generation
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : claim.status === 'error' ? (
          /* Error Section */
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-300 bg-red-50">
              <CardHeader className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Processing Error</CardTitle>
                    <CardDescription className="text-red-100">
                      An error occurred during claim processing
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Alert className="border-red-200 bg-white">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertTitle className="text-red-800">Error Details</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {claim.error || 'An unknown error occurred'}
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6 flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={resetClaim}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Start Over
                  </Button>
                  <Button 
                    onClick={startProcessing}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <Zap className="w-4 h-4" />
                    Retry Analysis
                  </Button>
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>If the problem persists, please check:</p>
                  <ul className="mt-2 text-left max-w-md mx-auto space-y-1">
                    <li>• Document images are clear and readable</li>
                    <li>• File formats are supported (JPG, PNG, PDF)</li>
                    <li>• File sizes are under 10MB</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : claim.status === 'completed' && claim.results ? (
          /* Results Section */
          <div className="space-y-6">
            {/* Summary Header */}
            <Card className={`bg-gradient-to-r ${getRecommendationColor(claim.results.finalRecommendation.decision)} text-white overflow-hidden`}>
              <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full bg-white/10" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Claim Analysis Complete</p>
                    <p className="text-sm text-white/60">{claim.results.claimNumber} • {claim.results.processedAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm mb-1">Final Recommendation</p>
                    <p className="text-3xl font-bold">
                      {claim.results.finalRecommendation.decision.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Confidence Level</span>
                    <span className="font-bold">{claim.results.finalRecommendation.confidence}%</span>
                  </div>
                  <Progress value={claim.results.finalRecommendation.confidence} className="h-3 bg-white/20" />
                  <p className="text-sm text-white/80 mt-3">
                    {claim.results.finalRecommendation.reason}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Car className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{claim.results.vehicleId.matchStatus}</p>
                  <p className="text-xs text-gray-500">Vehicle Match</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-2xl font-bold text-gray-900">{claim.results.policyAnalysis.coverageValid ? 'Valid' : 'Invalid'}</p>
                  <p className="text-xs text-gray-500">Coverage Status</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                  <p className="text-2xl font-bold text-gray-900">{claim.results.damageAssessment.severity}</p>
                  <p className="text-xs text-gray-500">Damage Severity</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900">{claim.results.writeOffEstimation.writeOffPercentage}%</p>
                  <p className="text-xs text-gray-500">Write-Off Ratio</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results Tabs */}
            <Tabs defaultValue="vehicle" className="space-y-4">
              <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1 bg-white rounded-xl shadow-sm">
                <TabsTrigger value="vehicle" className="text-xs rounded-lg">Vehicle</TabsTrigger>
                <TabsTrigger value="policy" className="text-xs rounded-lg">Policy</TabsTrigger>
                <TabsTrigger value="incident" className="text-xs rounded-lg">Incident</TabsTrigger>
                <TabsTrigger value="damage" className="text-xs rounded-lg">Damage</TabsTrigger>
                <TabsTrigger value="writeoff" className="text-xs rounded-lg">Write-Off</TabsTrigger>
                <TabsTrigger value="consistency" className="text-xs rounded-lg">Consistency</TabsTrigger>
                <TabsTrigger value="risk" className="text-xs rounded-lg">Risk</TabsTrigger>
                <TabsTrigger value="assessor" className="text-xs rounded-lg bg-amber-50 data-[state=active]:bg-amber-100">
                  <PenLine className="w-3 h-3 mr-1" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="report" className="text-xs rounded-lg">Report</TabsTrigger>
                <TabsTrigger value="assessment" className="text-xs rounded-lg bg-emerald-50 data-[state=active]:bg-emerald-100">
                  <FileCheck className="w-3 h-3 mr-1" />
                  Assessment
                </TabsTrigger>
              </TabsList>

              {/* Vehicle Identification */}
              <TabsContent value="vehicle">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-blue-600" />
                        Vehicle Identification
                      </CardTitle>
                      <Badge className={claim.results.vehicleId.matchStatus === 'MATCH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                        {claim.results.vehicleId.matchStatus}
                      </Badge>
                    </div>
                    <CardDescription>Extracted from license disc and verified against policy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">VIN</p>
                        <p className="font-mono text-sm font-semibold">{claim.results.vehicleId.vin}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Registration</p>
                        <p className="font-semibold text-lg">{claim.results.vehicleId.registrationNumber}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Make / Model</p>
                        <p className="font-semibold">{claim.results.vehicleId.make} {claim.results.vehicleId.model}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Year</p>
                        <p className="font-semibold text-lg">{claim.results.vehicleId.year}</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <p className="text-emerald-800">{claim.results.vehicleId.matchDetails}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Policy Analysis */}
              <TabsContent value="policy">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Policy & Coverage Analysis
                      </CardTitle>
                      <Badge className={claim.results.policyAnalysis.coverageValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                        {claim.results.policyAnalysis.coverageValid ? 'Valid Coverage' : 'Invalid'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Policy Number</p>
                        <p className="font-mono text-sm font-semibold">{claim.results.policyAnalysis.policyNumber}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Insurer</p>
                        <p className="font-semibold">{claim.results.policyAnalysis.insurerName}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                        <p className="text-xs text-emerald-600 uppercase tracking-wide">Sum Insured</p>
                        <p className="font-bold text-xl text-emerald-700">R {claim.results.policyAnalysis.sumInsured.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Excess</p>
                        <p className="font-semibold">R {claim.results.policyAnalysis.excess.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-3 font-medium">Insured Extras</p>
                        <div className="flex flex-wrap gap-2">
                          {claim.results.policyAnalysis.extrasInsured.map((extra, i) => (
                            <Badge key={i} variant="secondary" className="py-1.5">{extra}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      {claim.results.policyAnalysis.missingItems.length > 0 && (
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <AlertTitle className="text-amber-800">Missing Items</AlertTitle>
                          <AlertDescription className="text-amber-700">
                            {claim.results.policyAnalysis.missingItems.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Incident Summary */}
              <TabsContent value="incident">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Incident Summary
                    </CardTitle>
                    <CardDescription>Details extracted from claim form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                        <p className="font-semibold">{claim.results.incidentSummary.date}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="font-semibold">{claim.results.incidentSummary.location}</p>
                      </div>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Driver</p>
                        <p className="font-semibold">{claim.results.incidentSummary.driverName}</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>
                      <p className="text-gray-700">{claim.results.incidentSummary.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Damage Assessment */}
              <TabsContent value="damage">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Damage Assessment
                      </CardTitle>
                      <Badge className={`${getSeverityColor(claim.results.damageAssessment.severity)} px-4 py-1`}>
                        {claim.results.damageAssessment.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-8">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-500 font-medium">Severity Score</span>
                        <span className="font-bold text-lg">{claim.results.damageAssessment.severityScore}%</span>
                      </div>
                      <Progress 
                        value={claim.results.damageAssessment.severityScore} 
                        className="h-4"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>Minor</span>
                        <span>Moderate</span>
                        <span>Severe</span>
                        <span>Total Loss</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-3 font-medium">Damaged Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {claim.results.damageAssessment.damagedAreas.map((area, i) => (
                            <Badge key={i} variant="outline" className="border-red-200 text-red-700 py-1.5 px-3">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl text-center">
                        <p className="text-xs text-red-500 uppercase tracking-wide mb-2">Estimated Repair Cost</p>
                        <p className="text-3xl font-bold text-red-700">
                          R {claim.results.damageAssessment.estimatedRepairCost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Write-Off Estimation */}
              <TabsContent value="writeoff">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-purple-600" />
                        Write-Off Estimation
                      </CardTitle>
                      <Badge className={
                        claim.results.writeOffEstimation.classification === 'REPAIR' ? 'bg-emerald-100 text-emerald-800' :
                        claim.results.writeOffEstimation.classification === 'BORDERLINE' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {claim.results.writeOffEstimation.classification.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl text-center">
                        <p className="text-xs text-emerald-600 uppercase tracking-wide mb-2">Insured Value</p>
                        <p className="text-2xl font-bold text-emerald-700">R {claim.results.writeOffEstimation.insuredValue.toLocaleString()}</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl text-center">
                        <p className="text-xs text-red-600 uppercase tracking-wide mb-2">Repair Cost</p>
                        <p className="text-2xl font-bold text-red-700">R {claim.results.writeOffEstimation.repairCost.toLocaleString()}</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl text-center">
                        <p className="text-xs text-purple-600 uppercase tracking-wide mb-2">Write-Off %</p>
                        <p className="text-2xl font-bold text-purple-700">{claim.results.writeOffEstimation.writeOffPercentage}%</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Progress 
                        value={claim.results.writeOffEstimation.writeOffPercentage} 
                        className="h-5"
                      />
                      <div className="relative mt-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span className="text-amber-600 font-medium">50% Threshold</span>
                          <span className="text-red-600 font-medium">70% Write-Off</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Recommendation</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        {claim.results.writeOffEstimation.recommendation}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Consistency Check */}
              <TabsContent value="consistency">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-600" />
                      Consistency & Fraud Detection
                    </CardTitle>
                    <CardDescription>Multi-source validation and anomaly detection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: 'Vehicle Match', value: claim.results.consistencyCheck.vehicleMatch },
                        { label: 'Policy Valid', value: claim.results.consistencyCheck.policyValid },
                        { label: 'Damage Consistent', value: claim.results.consistencyCheck.damageConsistent },
                        { label: 'Incident Plausible', value: claim.results.consistencyCheck.incidentPlausible }
                      ].map(({ label, value }) => (
                        <div 
                          key={label} 
                          className={`p-4 rounded-xl flex items-center gap-3 ${value ? 'bg-emerald-50' : 'bg-red-50'}`}
                        >
                          {value ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <span className={`font-medium ${value ? 'text-emerald-800' : 'text-red-800'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Alert className="bg-emerald-50 border-emerald-200">
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-800">All Checks Passed</AlertTitle>
                      <AlertDescription className="text-emerald-700">
                        {claim.results.consistencyCheck.summary}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Risk Indicators */}
              <TabsContent value="risk">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      Risk Indicators
                    </CardTitle>
                    <CardDescription>Identified risks and flags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {claim.results.riskIndicators.map((risk, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <Badge className={`${getRiskColor(risk.level)} px-3 py-1`}>{risk.level}</Badge>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{risk.type}</p>
                            <p className="text-gray-600">{risk.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{risk.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assessor Notes - Post Analysis Review */}
              <TabsContent value="assessor" className="space-y-4">
                {/* Pre-Analysis Observations (Read-only) */}
                {observations.length > 0 && (
                  <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PenLine className="w-5 h-5 text-rose-600" />
                        Pre-Analysis Observations
                        <Badge variant="outline" className="bg-white ml-2">
                          {observations.length} submitted
                        </Badge>
                      </CardTitle>
                      <CardDescription>These observations were entered before AI analysis and were included in the processing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {observations.map((obs) => {
                          const CategoryIcon = getCategoryIcon(obs.category)
                          const SeverityIcon = SEVERITY_ICONS[obs.severity]
                          
                          return (
                            <div 
                              key={obs.id} 
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${SEVERITY_COLORS[obs.severity]}`}>
                                <SeverityIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    <CategoryIcon className="w-3 h-3" />
                                    {getCategoryLabel(obs.category)}
                                  </Badge>
                                  <Badge className={`${SEVERITY_COLORS[obs.severity]} text-xs`}>
                                    {obs.severity}
                                  </Badge>
                                </div>
                                <p className="font-medium text-gray-900 text-sm">{obs.title}</p>
                                <p className="text-gray-600 text-xs mt-0.5">{obs.observation}</p>
                                <p className="text-xs text-gray-400 mt-1">By: {obs.assessorName}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assessor Summary & Decision */}
                <Card>
                  <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      Assessor Review & Decision
                    </CardTitle>
                    <CardDescription>Provide your final review and decision based on AI analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Review Notes</label>
                      <textarea
                        placeholder="Add your review notes based on the AI analysis results..."
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
                        value={assessorSummary.overallNotes}
                        onChange={(e) => setAssessorSummary(prev => ({ ...prev, overallNotes: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Your Decision</label>
                        <select 
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={assessorSummary.assessorDecision || ''}
                          onChange={(e) => setAssessorSummary(prev => ({ 
                            ...prev, 
                            assessorDecision: e.target.value as AssessorSummary['assessorDecision'] 
                          }))}
                        >
                          <option value="">Select decision...</option>
                          <option value="APPROVE">Approve Claim</option>
                          <option value="INVESTIGATE">Requires Investigation</option>
                          <option value="REJECT">Reject Claim</option>
                          <option value="WRITE_OFF">Write-Off Vehicle</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Reviewer Name</label>
                        <input
                          type="text"
                          placeholder="Your name"
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={assessorSummary.reviewedBy}
                          onChange={(e) => setAssessorSummary(prev => ({ ...prev, reviewedBy: e.target.value }))}
                        />
                      </div>
                    </div>

                    {assessorSummary.assessorDecision && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Decision Reason</label>
                        <textarea
                          placeholder="Explain your decision reasoning..."
                          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[80px]"
                          value={assessorSummary.assessorDecisionReason}
                          onChange={(e) => setAssessorSummary(prev => ({ ...prev, assessorDecisionReason: e.target.value }))}
                        />
                      </div>
                    )}

                    {assessorSummary.assessorDecision && assessorSummary.reviewedBy && (
                      <Button 
                        onClick={() => setAssessorSummary(prev => ({ 
                          ...prev, 
                          reviewCompletedAt: new Date().toLocaleString() 
                        }))}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Review
                      </Button>
                    )}

                    {assessorSummary.reviewCompletedAt && (
                      <Alert className="bg-emerald-50 border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800">Review Completed</AlertTitle>
                        <AlertDescription className="text-emerald-700">
                          Reviewed by {assessorSummary.reviewedBy} at {assessorSummary.reviewCompletedAt}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Full Report */}
              <TabsContent value="report">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                        Final Report
                      </CardTitle>
                      <Button onClick={exportPDF} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                        <Download className="w-4 h-4" />
                        Export Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-8 p-6 bg-white rounded-xl border">
                        <div className="flex items-center gap-3 pb-4 border-b">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl">Z.ai Claim Intelligence Report</h3>
                            <p className="text-sm text-gray-500">{claim.results.claimNumber}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-lg mb-3 text-gray-800">1. Vehicle Identification</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm"><span className="text-gray-500">VIN:</span> <span className="font-medium">{claim.results.vehicleId.vin}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Registration:</span> <span className="font-medium">{claim.results.vehicleId.registrationNumber}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Vehicle:</span> <span className="font-medium">{claim.results.vehicleId.make} {claim.results.vehicleId.model} ({claim.results.vehicleId.year})</span></p>
                            <p className="text-sm"><span className="text-gray-500">Match Status:</span> <Badge className="ml-1">{claim.results.vehicleId.matchStatus}</Badge></p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-bold text-lg mb-3 text-gray-800">2. Policy & Coverage Analysis</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm"><span className="text-gray-500">Policy:</span> <span className="font-medium">{claim.results.policyAnalysis.policyNumber}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Sum Insured:</span> <span className="font-bold text-emerald-700">R {claim.results.policyAnalysis.sumInsured.toLocaleString()}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Coverage Valid:</span> <Badge className="ml-1">{claim.results.policyAnalysis.coverageValid ? 'Yes' : 'No'}</Badge></p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-bold text-lg mb-3 text-gray-800">3. Incident Summary</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm"><span className="text-gray-500">Date:</span> <span className="font-medium">{claim.results.incidentSummary.date}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Location:</span> <span className="font-medium">{claim.results.incidentSummary.location}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Description:</span> <span className="font-medium">{claim.results.incidentSummary.description}</span></p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-bold text-lg mb-3 text-gray-800">4. Damage Assessment</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm"><span className="text-gray-500">Severity:</span> <Badge className="ml-1">{claim.results.damageAssessment.severity}</Badge></p>
                            <p className="text-sm"><span className="text-gray-500">Damaged Areas:</span> <span className="font-medium">{claim.results.damageAssessment.damagedAreas.join(', ')}</span></p>
                            <p className="text-sm"><span className="text-gray-500">Estimated Repair Cost:</span> <span className="font-bold text-red-700">R {claim.results.damageAssessment.estimatedRepairCost.toLocaleString()}</span></p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-bold text-lg mb-3 text-gray-800">5. Write-Off Evaluation</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm"><span className="text-gray-500">Write-Off Percentage:</span> <span className="font-bold text-purple-700">{claim.results.writeOffEstimation.writeOffPercentage}%</span></p>
                            <p className="text-sm"><span className="text-gray-500">Classification:</span> <Badge className="ml-1">{claim.results.writeOffEstimation.classification}</Badge></p>
                            <p className="text-sm text-gray-600 mt-2">{claim.results.writeOffEstimation.recommendation}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-xl">
                          <h4 className="font-bold text-lg mb-3">6. Final Recommendation</h4>
                          <p className="text-2xl font-bold mb-2">{claim.results.finalRecommendation.decision}</p>
                          <p className="text-white/90">{claim.results.finalRecommendation.reason}</p>
                          <p className="text-white/70 text-sm mt-3">Confidence: {claim.results.finalRecommendation.confidence}%</p>
                        </div>
                        
                        <div className="text-center text-xs text-gray-400 pt-4 border-t">
                          Generated by Z.ai Claim Intelligence System v2.0<br/>
                          {claim.results.processedAt}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assessment Report for Insurer */}
              <TabsContent value="assessment">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <FileCheck className="w-6 h-6" />
                          Assessment Report for Insurer
                        </CardTitle>
                        <CardDescription className="text-emerald-100">
                          Comprehensive assessment summary for claim decision
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={exportPDF} 
                        variant="secondary"
                        className="gap-2 bg-white text-emerald-700 hover:bg-emerald-50"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Claim Summary Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Claim Number</p>
                          <p className="text-xl font-bold text-gray-900">{claim.results.claimNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Processed</p>
                          <p className="font-semibold">{claim.results.processedAt}</p>
                        </div>
                      </div>
                    </div>

                    {/* Decision Summary */}
                    <Card className={`border-2 ${
                      claim.results.finalRecommendation.decision === 'APPROVE' ? 'border-emerald-300 bg-emerald-50' :
                      claim.results.finalRecommendation.decision === 'INVESTIGATE' ? 'border-amber-300 bg-amber-50' :
                      claim.results.finalRecommendation.decision === 'REJECT' ? 'border-red-300 bg-red-50' :
                      'border-purple-300 bg-purple-50'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold">AI Recommendation</h3>
                          <Badge className={`text-lg px-4 py-2 ${
                            claim.results.finalRecommendation.decision === 'APPROVE' ? 'bg-emerald-600' :
                            claim.results.finalRecommendation.decision === 'INVESTIGATE' ? 'bg-amber-600' :
                            claim.results.finalRecommendation.decision === 'REJECT' ? 'bg-red-600' :
                            'bg-purple-600'
                          } text-white`}>
                            {claim.results.finalRecommendation.decision.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{claim.results.finalRecommendation.reason}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Confidence:</span>
                          <Progress value={claim.results.finalRecommendation.confidence} className="flex-1 h-2" />
                          <span className="font-bold">{claim.results.finalRecommendation.confidence}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vehicle & Policy Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Car className="w-4 h-4 text-blue-600" />
                            Vehicle Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Registration:</span>
                              <span className="font-semibold">{claim.results.vehicleId.registrationNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">VIN:</span>
                              <span className="font-mono text-sm">{claim.results.vehicleId.vin}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Make/Model:</span>
                              <span className="font-semibold">{claim.results.vehicleId.make} {claim.results.vehicleId.model}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Match Status:</span>
                              <Badge className={claim.results.vehicleId.matchStatus === 'MATCH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                {claim.results.vehicleId.matchStatus}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            Policy Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Policy Number:</span>
                              <span className="font-semibold">{claim.results.policyAnalysis.policyNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Insurer:</span>
                              <span className="font-semibold">{claim.results.policyAnalysis.insurerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sum Insured:</span>
                              <span className="font-bold text-emerald-700">R {claim.results.policyAnalysis.sumInsured.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Coverage:</span>
                              <Badge className={claim.results.policyAnalysis.coverageValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                                {claim.results.policyAnalysis.coverageValid ? 'Valid' : 'Invalid'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Damage & Financial Summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-purple-600" />
                          Financial Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Damage Severity</p>
                            <Badge className={getSeverityColor(claim.results.damageAssessment.severity)}>
                              {claim.results.damageAssessment.severity}
                            </Badge>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Repair Cost</p>
                            <p className="font-bold text-red-700">R {claim.results.damageAssessment.estimatedRepairCost.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Write-Off %</p>
                            <p className="font-bold text-purple-700">{claim.results.writeOffEstimation.writeOffPercentage}%</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Classification</p>
                            <Badge variant="outline">{claim.results.writeOffEstimation.classification}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risk Indicators */}
                    {claim.results.riskIndicators.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            Risk Indicators
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {claim.results.riskIndicators.map((risk, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                <Badge className={getRiskColor(risk.level)}>{risk.level}</Badge>
                                <div>
                                  <p className="font-medium text-sm">{risk.type}</p>
                                  <p className="text-xs text-gray-500">{risk.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Consistency Check Summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Scale className="w-4 h-4 text-gray-600" />
                          Consistency Check Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${claim.results.consistencyCheck.vehicleMatch ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {claim.results.consistencyCheck.vehicleMatch ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">Vehicle Match</span>
                          </div>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${claim.results.consistencyCheck.policyValid ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {claim.results.consistencyCheck.policyValid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">Policy Valid</span>
                          </div>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${claim.results.consistencyCheck.damageConsistent ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {claim.results.consistencyCheck.damageConsistent ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">Damage Consistent</span>
                          </div>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${claim.results.consistencyCheck.incidentPlausible ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {claim.results.consistencyCheck.incidentPlausible ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">Incident Plausible</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                          {claim.results.consistencyCheck.summary}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Assessor Notes Summary */}
                    {(observations.length > 0 || assessorSummary.reviewCompletedAt) && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PenLine className="w-4 h-4 text-amber-600" />
                            Assessor Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {observations.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Pre-Analysis Observations ({observations.length})</p>
                              <div className="space-y-2">
                                {observations.map(obs => (
                                  <div key={obs.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                    <Badge className={`${SEVERITY_COLORS[obs.severity]} text-xs`}>{obs.severity}</Badge>
                                    <div>
                                      <p className="font-medium text-sm">{obs.title}</p>
                                      <p className="text-xs text-gray-500">{obs.observation}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {assessorSummary.reviewCompletedAt && (
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <p className="text-sm font-medium text-emerald-800">Assessor Decision: {assessorSummary.assessorDecision}</p>
                              <p className="text-xs text-emerald-600 mt-1">Reviewed by {assessorSummary.reviewedBy} at {assessorSummary.reviewCompletedAt}</p>
                              {assessorSummary.assessorDecisionReason && (
                                <p className="text-sm text-gray-700 mt-2">{assessorSummary.assessorDecisionReason}</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 pt-4 border-t">
                      <p>This assessment report was generated by Z.ai Claim Intelligence System v2.0</p>
                      <p className="mt-1">For internal use by insurer only. All AI recommendations should be reviewed by qualified assessors.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Processing Section */
          <div className="max-w-3xl mx-auto">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Processing Claim</CardTitle>
                    <CardDescription className="text-slate-300">
                      AI agents are analyzing your documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Current Step Progress */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-semibold text-gray-700">{claim.stepName}</span>
                    <span className="text-gray-500">{claim.currentStep} of {claim.totalSteps}</span>
                  </div>
                  <Progress value={(claim.currentStep / claim.totalSteps) * 100} className="h-2" />
                </div>
                
                {/* Pipeline Steps */}
                <div className="space-y-2">
                  {PIPELINE_STEPS.map((step, index) => {
                    const isActive = index + 1 === claim.currentStep
                    const isCompleted = index + 1 < claim.currentStep
                    const Icon = step.icon
                    
                    return (
                      <div 
                        key={step.id}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                          ${isActive ? 'bg-gradient-to-r from-emerald-50 to-teal-50 ring-2 ring-emerald-200' : ''}
                          ${isCompleted ? 'bg-gray-50' : ''}
                        `}
                      >
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                          ${isCompleted ? 'bg-emerald-600 text-white' : ''}
                          ${isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? 'text-emerald-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                            {step.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isActive ? step.detail : step.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-2">
                            <Progress value={animatedProgress} className="w-20 h-1.5" />
                            <ChevronRight className="w-5 h-5 text-emerald-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-600" />
              <span>Z.ai Claim Intelligence System v2.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                6 AI Engines
              </span>
              <span>•</span>
              <span>Insurer-Grade Validation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
