'use client'

import { useState, useCallback } from 'react'
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
  FileSpreadsheet
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
  documents: UploadedDocument[]
  results: ClaimResults | null
  error?: string
}

interface ClaimResults {
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

// Pipeline steps configuration
const PIPELINE_STEPS = [
  { id: 'ocr', name: 'OCR Extraction', icon: Scan, description: 'Extracting data from documents' },
  { id: 'policy', name: 'Policy Matching', icon: Shield, description: 'Matching vehicle to policy' },
  { id: 'damage', name: 'Damage Analysis', icon: AlertTriangle, description: 'Assessing damage severity' },
  { id: 'writeoff', name: 'Write-Off Estimation', icon: Calculator, description: 'Calculating repair vs value' },
  { id: 'consistency', name: 'Consistency Check', icon: Scale, description: 'Detecting fraud indicators' },
  { id: 'validation', name: 'Validation Engine', icon: ShieldAlert, description: 'Challenging all findings' },
  { id: 'report', name: 'Report Generation', icon: FileSpreadsheet, description: 'Creating final report' },
]

export default function Home() {
  const [claim, setClaim] = useState<ClaimState>({
    status: 'idle',
    currentStep: 0,
    totalSteps: PIPELINE_STEPS.length,
    stepName: '',
    documents: [],
    results: null
  })

  const [dragActive, setDragActive] = useState(false)

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

    setClaim(prev => ({ ...prev, status: 'processing', currentStep: 1, stepName: PIPELINE_STEPS[0].name }))

    try {
      // Create FormData and append files
      const formData = new FormData()
      
      // We'll simulate the processing for now since we need to handle file uploads
      // In a real implementation, we would upload files to the server

      // Simulate pipeline steps
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        const step = PIPELINE_STEPS[i]
        setClaim(prev => ({ 
          ...prev, 
          currentStep: i + 1, 
          stepName: step.name,
          status: i < 2 ? 'processing' : i < 4 ? 'analyzing' : 'validating'
        }))
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Set mock results
      setClaim(prev => ({
        ...prev,
        status: 'completed',
        results: getMockResults()
      }))
    } catch (error) {
      setClaim(prev => ({
        ...prev,
        status: 'error',
        error: 'An error occurred during processing'
      }))
    }
  }

  const getMockResults = (): ClaimResults => ({
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
      documents: [],
      results: null
    })
  }

  const getStatusColor = (status: ClaimState['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'processing':
      case 'analyzing':
      case 'validating': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MINOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'MODERATE': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'SEVERE': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'TOTAL_LOSS': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'APPROVE': return 'bg-green-600'
      case 'INVESTIGATE': return 'bg-amber-600'
      case 'REJECT': return 'bg-red-600'
      case 'WRITE_OFF': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Z.ai Claims</h1>
                <p className="text-xs text-gray-500">Intelligent Claim Validation System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {claim.status !== 'idle' && claim.status !== 'completed' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
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
        {claim.status === 'idle' ? (
          /* Upload Section */
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Insurance Claim Intelligence
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload your claim documents and let our AI-powered system extract, analyze, 
                and validate your claim with insurer-grade precision.
              </p>
            </div>

            {/* Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { type: 'license_disc', icon: Car, title: 'License Disc', desc: 'Vehicle registration' },
                { type: 'claim_form', icon: FileText, title: 'Claim Form', desc: 'Incident details' },
                { type: 'policy_schedule', icon: Shield, title: 'Policy Schedule', desc: 'Coverage details' },
                { type: 'damage_photo', icon: AlertTriangle, title: 'Damage Photos', desc: 'Vehicle damage' }
              ].map(({ type, icon: Icon, title, desc }) => (
                <Card key={type} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <CardTitle className="text-sm">{title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">{desc}</p>
                    <div className="mt-2">
                      {claim.documents.filter(d => d.type === type).length > 0 ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          {claim.documents.filter(d => d.type === type).length} uploaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">
                          Not uploaded
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${dragActive 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
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
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Drop documents here or click to browse
              </h3>
              <p className="text-sm text-gray-500">
                Supported: PDF, JPG, PNG • Max 10MB per file
              </p>
            </div>

            {/* Uploaded Documents List */}
            {claim.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Documents ({claim.documents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {claim.documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            {doc.type === 'license_disc' && <Car className="w-5 h-5 text-gray-600" />}
                            {doc.type === 'claim_form' && <FileText className="w-5 h-5 text-gray-600" />}
                            {doc.type === 'policy_schedule' && <Shield className="w-5 h-5 text-gray-600" />}
                            {doc.type === 'damage_photo' && <AlertTriangle className="w-5 h-5 text-gray-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={startProcessing}
                disabled={claim.documents.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-6 text-lg"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start AI Analysis
              </Button>
            </div>
          </div>
        ) : claim.status === 'completed' && claim.results ? (
          /* Results Section */
          <div className="space-y-6">
            {/* Summary Header */}
            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Claim Analysis Complete</p>
                    <h2 className="text-2xl font-bold">Final Recommendation</h2>
                  </div>
                  <div className={`${getRecommendationColor(claim.results.finalRecommendation.decision)} px-6 py-3 rounded-lg`}>
                    <p className="text-white font-bold text-xl">
                      {claim.results.finalRecommendation.decision.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={claim.results.finalRecommendation.confidence} className="h-2 bg-gray-700" />
                  <p className="text-sm text-gray-400 mt-2">
                    {claim.results.finalRecommendation.confidence}% confidence • {claim.results.finalRecommendation.reason}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results Tabs */}
            <Tabs defaultValue="vehicle" className="space-y-4">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1 bg-white">
                <TabsTrigger value="vehicle" className="text-xs">Vehicle</TabsTrigger>
                <TabsTrigger value="policy" className="text-xs">Policy</TabsTrigger>
                <TabsTrigger value="incident" className="text-xs">Incident</TabsTrigger>
                <TabsTrigger value="damage" className="text-xs">Damage</TabsTrigger>
                <TabsTrigger value="writeoff" className="text-xs">Write-Off</TabsTrigger>
                <TabsTrigger value="consistency" className="text-xs">Consistency</TabsTrigger>
                <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
                <TabsTrigger value="report" className="text-xs">Report</TabsTrigger>
              </TabsList>

              {/* Vehicle Identification */}
              <TabsContent value="vehicle">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Vehicle Identification</CardTitle>
                      <Badge className={claim.results.vehicleId.matchStatus === 'MATCH' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {claim.results.vehicleId.matchStatus}
                      </Badge>
                    </div>
                    <CardDescription>Extracted from license disc and verified against policy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">VIN</p>
                        <p className="font-mono text-sm">{claim.results.vehicleId.vin}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Registration</p>
                        <p className="font-semibold">{claim.results.vehicleId.registrationNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Make / Model</p>
                        <p className="font-semibold">{claim.results.vehicleId.make} {claim.results.vehicleId.model}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Year</p>
                        <p className="font-semibold">{claim.results.vehicleId.year}</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <p>{claim.results.vehicleId.matchDetails}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Policy Analysis */}
              <TabsContent value="policy">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Policy & Coverage Analysis</CardTitle>
                      <Badge className={claim.results.policyAnalysis.coverageValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {claim.results.policyAnalysis.coverageValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Policy Number</p>
                        <p className="font-mono text-sm">{claim.results.policyAnalysis.policyNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Insurer</p>
                        <p className="font-semibold">{claim.results.policyAnalysis.insurerName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Sum Insured</p>
                        <p className="font-semibold">R {claim.results.policyAnalysis.sumInsured.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Excess</p>
                        <p className="font-semibold">R {claim.results.policyAnalysis.excess.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Insured Extras</p>
                        <div className="flex flex-wrap gap-2">
                          {claim.results.policyAnalysis.extrasInsured.map((extra, i) => (
                            <Badge key={i} variant="secondary">{extra}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      {claim.results.policyAnalysis.missingItems.length > 0 && (
                        <Alert>
                          <AlertCircle className="w-4 h-4" />
                          <AlertTitle>Missing Items</AlertTitle>
                          <AlertDescription>
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
                    <CardTitle>Incident Summary</CardTitle>
                    <CardDescription>Details extracted from claim form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold">{claim.results.incidentSummary.date}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-semibold">{claim.results.incidentSummary.location}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Driver</p>
                        <p className="font-semibold">{claim.results.incidentSummary.driverName}</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Description</p>
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
                      <CardTitle>Damage Assessment</CardTitle>
                      <Badge className={getSeverityColor(claim.results.damageAssessment.severity)}>
                        {claim.results.damageAssessment.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Severity Score</span>
                        <span className="font-semibold">{claim.results.damageAssessment.severityScore}%</span>
                      </div>
                      <Progress value={claim.results.damageAssessment.severityScore} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Damaged Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {claim.results.damageAssessment.damagedAreas.map((area, i) => (
                            <Badge key={i} variant="outline" className="border-red-200 text-red-700">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estimated Repair Cost</p>
                        <p className="text-2xl font-bold text-gray-900">
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
                      <CardTitle>Write-Off Estimation</CardTitle>
                      <Badge className={
                        claim.results.writeOffEstimation.classification === 'REPAIR' ? 'bg-green-100 text-green-800' :
                        claim.results.writeOffEstimation.classification === 'BORDERLINE' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {claim.results.writeOffEstimation.classification.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">Insured Value</p>
                        <p className="text-xl font-bold">R {claim.results.writeOffEstimation.insuredValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">Repair Cost</p>
                        <p className="text-xl font-bold">R {claim.results.writeOffEstimation.repairCost.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">Write-Off %</p>
                        <p className="text-xl font-bold">{claim.results.writeOffEstimation.writeOffPercentage}%</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <Progress 
                        value={claim.results.writeOffEstimation.writeOffPercentage} 
                        className="h-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="text-amber-600">50% Threshold</span>
                        <span className="text-red-600">70% Write-Off</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    <Alert>
                      <Calculator className="w-4 h-4" />
                      <AlertTitle>Recommendation</AlertTitle>
                      <AlertDescription>
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
                    <CardTitle>Consistency & Fraud Detection</CardTitle>
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
                        <div key={label} className="flex items-center gap-2">
                          {value ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Alert className="bg-green-50 border-green-200">
                      <ShieldAlert className="w-4 h-4 text-green-600" />
                      <AlertTitle className="text-green-800">All Checks Passed</AlertTitle>
                      <AlertDescription className="text-green-700">
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
                    <CardTitle>Risk Indicators</CardTitle>
                    <CardDescription>Identified risks and flags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claim.results.riskIndicators.map((risk, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Badge className={getRiskColor(risk.level)}>{risk.level}</Badge>
                          <div>
                            <p className="font-medium text-sm">{risk.type}</p>
                            <p className="text-sm text-gray-600">{risk.description}</p>
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
                      <CardTitle>Final Report</CardTitle>
                      <Button className="gap-2">
                        <FileOutput className="w-4 h-4" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-6 p-4 bg-white rounded-lg border">
                        <div>
                          <h3 className="font-bold text-lg mb-2">1. Vehicle Identification</h3>
                          <p className="text-sm text-gray-600">VIN verified: {claim.results.vehicleId.vin}</p>
                          <p className="text-sm text-gray-600">Registration: {claim.results.vehicleId.registrationNumber}</p>
                          <p className="text-sm text-gray-600">Match Status: {claim.results.vehicleId.matchStatus}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">2. Policy & Coverage Analysis</h3>
                          <p className="text-sm text-gray-600">Policy: {claim.results.policyAnalysis.policyNumber}</p>
                          <p className="text-sm text-gray-600">Sum Insured: R {claim.results.policyAnalysis.sumInsured.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Coverage Valid: {claim.results.policyAnalysis.coverageValid ? 'Yes' : 'No'}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">3. Incident Summary</h3>
                          <p className="text-sm text-gray-600">Date: {claim.results.incidentSummary.date}</p>
                          <p className="text-sm text-gray-600">Location: {claim.results.incidentSummary.location}</p>
                          <p className="text-sm text-gray-600">Description: {claim.results.incidentSummary.description}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">4. Damage Assessment</h3>
                          <p className="text-sm text-gray-600">Severity: {claim.results.damageAssessment.severity}</p>
                          <p className="text-sm text-gray-600">Damaged Areas: {claim.results.damageAssessment.damagedAreas.join(', ')}</p>
                          <p className="text-sm text-gray-600">Estimated Repair Cost: R {claim.results.damageAssessment.estimatedRepairCost.toLocaleString()}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">5. Write-Off Evaluation</h3>
                          <p className="text-sm text-gray-600">Write-Off Percentage: {claim.results.writeOffEstimation.writeOffPercentage}%</p>
                          <p className="text-sm text-gray-600">Classification: {claim.results.writeOffEstimation.classification}</p>
                          <p className="text-sm text-gray-600">{claim.results.writeOffEstimation.recommendation}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">6. Final Recommendation</h3>
                          <p className="text-sm text-gray-600 font-semibold">
                            Decision: {claim.results.finalRecommendation.decision}
                          </p>
                          <p className="text-sm text-gray-600">{claim.results.finalRecommendation.reason}</p>
                          <p className="text-sm text-gray-600">Confidence: {claim.results.finalRecommendation.confidence}%</p>
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
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Processing Claim</CardTitle>
                <CardDescription>
                  Our AI agents are analyzing your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{claim.stepName}</span>
                    <span>{claim.currentStep} of {claim.totalSteps}</span>
                  </div>
                  <Progress value={(claim.currentStep / claim.totalSteps) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  {PIPELINE_STEPS.map((step, index) => {
                    const isActive = index + 1 === claim.currentStep
                    const isCompleted = index + 1 < claim.currentStep
                    const Icon = step.icon
                    
                    return (
                      <div 
                        key={step.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition-all
                          ${isActive ? 'bg-emerald-50 border border-emerald-200' : ''}
                          ${isCompleted ? 'bg-gray-50' : ''}
                        `}
                      >
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${isCompleted ? 'bg-green-600 text-white' : ''}
                          ${isActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? 'text-emerald-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                            {step.name}
                          </p>
                          <p className="text-xs text-gray-500">{step.description}</p>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-5 h-5 text-emerald-600 animate-pulse" />
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
              <span>Powered by AI</span>
              <span>•</span>
              <span>Insurer-Grade Validation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
