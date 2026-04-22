'use client'

import { useState, useCallback, useEffect } from 'react'
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
  Database
} from 'lucide-react'

// Types
interface UploadedDocument {
  id: string
  name: string
  type: 'license_disc' | 'claim_form' | 'policy_schedule' | 'damage_photo'
  size: number
  preview?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
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

  const [dragActive, setDragActive] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(0)

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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = (files: File[]) => {
    const newDocs: UploadedDocument[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: detectDocumentType(file.name),
      size: file.size,
      status: 'pending'
    }))

    setClaim(prev => ({
      ...prev,
      documents: [...prev.documents, ...newDocs]
    }))
  }

  const detectDocumentType = (filename: string): UploadedDocument['type'] => {
    const lower = filename.toLowerCase()
    if (lower.includes('license') || lower.includes('disc')) return 'license_disc'
    if (lower.includes('claim') || lower.includes('form')) return 'claim_form'
    if (lower.includes('policy') || lower.includes('schedule')) return 'policy_schedule'
    return 'damage_photo'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const removeDocument = (id: string) => {
    setClaim(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id)
    }))
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
      // Simulate pipeline steps with realistic timing
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        const step = PIPELINE_STEPS[i]
        
        setClaim(prev => ({ 
          ...prev, 
          currentStep: i + 1, 
          stepName: step.name,
          stepProgress: 0,
          status: i < 2 ? 'processing' : i < 5 ? 'analyzing' : 'validating'
        }))

        // Simulate progress within each step
        for (let p = 0; p <= 100; p += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setClaim(prev => ({ ...prev, stepProgress: p }))
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Set mock results
      const now = new Date()
      setClaim(prev => ({
        ...prev,
        status: 'completed',
        stepProgress: 100,
        results: {
          ...getMockResults(),
          claimNumber: `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          processedAt: now.toLocaleString()
        }
      }))
    } catch (error) {
      setClaim(prev => ({
        ...prev,
        status: 'error',
        error: 'An error occurred during processing'
      }))
    }
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

  const exportPDF = () => {
    if (!claim.results) return
    
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
  
  <div class="section" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
    <h2 style="color: white; border: none;">Final Recommendation</h2>
    <p style="font-size: 24px; font-weight: bold;">${claim.results.finalRecommendation.decision}</p>
    <p style="opacity: 0.9;">${claim.results.finalRecommendation.reason}</p>
    <p style="opacity: 0.8; font-size: 14px;">Confidence: ${claim.results.finalRecommendation.confidence}%</p>
  </div>
  
  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
    Generated by Z.ai Claim Intelligence System v2.0
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

  // Document type card component
  const DocumentTypeCard = ({ type, icon: Icon, title, desc, count }: { 
    type: string
    icon: React.ElementType
    title: string
    desc: string
    count: number 
  }) => (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${count > 0 ? 'ring-2 ring-emerald-200' : ''}`}>
      <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 opacity-50" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${count > 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gray-100'}`}>
            <Icon className={`w-5 h-5 ${count > 0 ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-500 mb-2">{desc}</p>
        <div className="flex items-center gap-2">
          {count > 0 ? (
            <>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {count} uploaded
              </Badge>
            </>
          ) : (
            <Badge variant="outline" className="text-gray-400 border-dashed">
              Pending
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )

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
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Analysis
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Insurance Claim Intelligence
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Upload your claim documents and let our AI-powered system extract, analyze, 
                and validate your claim with insurer-grade precision.
              </p>
            </div>

            {/* Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { type: 'license_disc', icon: Car, title: 'License Disc', desc: 'Vehicle registration & VIN' },
                { type: 'claim_form', icon: FileText, title: 'Claim Form', desc: 'Incident details & driver info' },
                { type: 'policy_schedule', icon: Shield, title: 'Policy Schedule', desc: 'Coverage & insured value' },
                { type: 'damage_photo', icon: AlertTriangle, title: 'Damage Photos', desc: 'Vehicle damage evidence' }
              ].map(({ type, icon, title, desc }) => (
                <DocumentTypeCard 
                  key={type}
                  type={type}
                  icon={icon}
                  title={title}
                  desc={desc}
                  count={claim.documents.filter(d => d.type === type).length}
                />
              ))}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300
                ${dragActive 
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-emerald-400 bg-white hover:bg-gray-50'
                }
              `}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Upload className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Drop documents here or click to browse
              </h3>
              <p className="text-gray-500">
                Supported: PDF, JPG, PNG • Max 10MB per file
              </p>
            </div>

            {/* Uploaded Documents List */}
            {claim.documents.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    Uploaded Documents ({claim.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {claim.documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            doc.type === 'license_disc' ? 'bg-blue-100' :
                            doc.type === 'claim_form' ? 'bg-purple-100' :
                            doc.type === 'policy_schedule' ? 'bg-emerald-100' :
                            'bg-amber-100'
                          }`}>
                            {doc.type === 'license_disc' && <Car className="w-6 h-6 text-blue-600" />}
                            {doc.type === 'claim_form' && <FileText className="w-6 h-6 text-purple-600" />}
                            {doc.type === 'policy_schedule' && <Shield className="w-6 h-6 text-emerald-600" />}
                            {doc.type === 'damage_photo' && <AlertTriangle className="w-6 h-6 text-amber-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {doc.type.replace('_', ' ')}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeDocument(doc.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Button */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={startProcessing}
                disabled={claim.documents.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-12 py-7 text-lg rounded-2xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                <Zap className="w-6 h-6 mr-2" />
                Start AI Analysis
              </Button>
            </div>
            
            {/* Processing Info */}
            <div className="text-center text-sm text-gray-500 max-w-xl mx-auto">
              <p className="flex items-center justify-center gap-2">
                <Cpu className="w-4 h-4" />
                6 specialized AI engines will process your documents
              </p>
            </div>
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
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1 bg-white rounded-xl shadow-sm">
                <TabsTrigger value="vehicle" className="text-xs rounded-lg">Vehicle</TabsTrigger>
                <TabsTrigger value="policy" className="text-xs rounded-lg">Policy</TabsTrigger>
                <TabsTrigger value="incident" className="text-xs rounded-lg">Incident</TabsTrigger>
                <TabsTrigger value="damage" className="text-xs rounded-lg">Damage</TabsTrigger>
                <TabsTrigger value="writeoff" className="text-xs rounded-lg">Write-Off</TabsTrigger>
                <TabsTrigger value="consistency" className="text-xs rounded-lg">Consistency</TabsTrigger>
                <TabsTrigger value="risk" className="text-xs rounded-lg">Risk</TabsTrigger>
                <TabsTrigger value="report" className="text-xs rounded-lg">Report</TabsTrigger>
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
