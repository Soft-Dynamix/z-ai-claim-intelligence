# Z.ai Claim Intelligence System

<div align="center">

![Z.ai Claims](https://img.shields.io/badge/Z.ai-Claims-10b981?style=for-the-badge&labelColor=1f2937)
![Next.js](https://img.shields.io/badge/Next.js-16.1.3-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)

**AI-Powered Insurance Claim Validation System**

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [API](#api)

</div>

---

## Overview

Z.ai Claim Intelligence System is a production-ready, AI-powered insurance claim validation platform that processes claim documents through 6 specialized AI engines. It uses Vision Language Models (VLM) for document analysis and Large Language Models (LLM) for reasoning tasks.

## Features

### 🤖 6 AI Engines Pipeline

| Engine | Purpose |
|--------|---------|
| **OCR Extraction** | Extracts data from license disc, claim form, policy schedule, and damage photos using VLM |
| **Policy Matching** | Matches vehicle to policy, detects under/over insurance |
| **Damage Assessment** | Analyzes damage severity from photos |
| **Write-Off Estimation** | Calculates repair vs insured value ratios |
| **Consistency Check** | Detects fraud indicators and inconsistencies |
| **Validation Engine** | Challenges all agent outputs for accuracy |

### 📊 Document Analysis Quality Score

- Circular progress indicator showing overall extraction quality
- Individual quality scores for each document type
- Color-coded quality levels (Excellent, Good, Fair, Poor)

### 📋 Processing Timeline

- Visual timeline showing all 7 processing steps
- Animated checkmarks for completed steps
- Timestamps for each completed step
- Gradient progress line connecting all steps

### ⚡ Key Decision Factors

- Supporting Factors section highlighting positive indicators
- Risk Factors section highlighting potential issues
- Color-coded cards for easy identification

### 📝 Recommended Actions

- Decision-specific action items based on AI recommendation:
  - **APPROVE**: Verify repair estimates, process payment
  - **INVESTIGATE**: Request docs, schedule inspection, review history
  - **REJECT**: Document reasons, notify policyholder
  - **WRITE_OFF**: Obtain salvage quotes, prepare settlement

### 🎨 Modern UI/UX

- Gradient backgrounds and modern card designs
- Icon containers with rounded backgrounds
- Hover effects and smooth animations
- Responsive design for all screen sizes
- Print-friendly styles for reports
- Keyboard shortcuts for power users

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 16)                     │
├─────────────────────────────────────────────────────────────────┤
│  Upload UI  │  Processing Viz  │  Results Tabs  │  Assessment   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (/api/claims)                    │
├─────────────────────────────────────────────────────────────────┤
│  /process  │  /report (PDF)  │  VLM Integration  │  LLM Calls   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Engines Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│  OCR  →  Policy Match  →  Damage  →  Write-Off  →  Consistency  │
│                                                        ↓         │
│                                                Validation Engine  │
│                                                        ↓         │
│                                              Report Generator     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database (Prisma + SQLite)                   │
├─────────────────────────────────────────────────────────────────┤
│  Claim  │  Vehicle  │  Policy  │  Incident  │  Document  │  Risk │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Soft-Dynamix/z-ai-claim-intelligence.git
cd z-ai-claim-intelligence

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize the database
bun run db:push

# Start development server
bun run dev
```

### Environment Variables

```env
# AI Gateway (required for VLM/LLM)
AI_GATEWAY_URL=https://ai-gateway.example.com
AI_GATEWAY_API_KEY=your-api-key

# Database (optional, defaults to SQLite)
DATABASE_URL="file:./db/custom.db"
```

## Usage

### Document Upload

1. Upload required documents:
   - **License Disc** - Vehicle registration & VIN number
   - **Claim Form** - Incident details & driver information
   - **Policy Schedule** - Coverage details & insured value

2. Optionally upload supporting documents:
   - **Damage Photos** - Multiple photos showing vehicle damage

3. Add assessor observations (optional)

4. Click "Start AI Analysis"

### Results Review

After processing (~60 seconds), review results in multiple tabs:

| Tab | Content |
|-----|---------|
| **Vehicle** | VIN, registration, make/model, match status |
| **Policy** | Policy number, insurer, sum insured, coverage |
| **Incident** | Date, location, description, driver info |
| **Damage** | Severity, damaged areas, repair cost |
| **Write-Off** | Repair ratio, classification, recommendation |
| **Consistency** | All validation checks with pass/fail status |
| **Risk** | Detected risk indicators with severity levels |
| **Notes** | Assessor observations and decisions |
| **Report** | Full assessment summary |
| **Assessment** | Insurer-ready report with recommendations |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Start AI Analysis |
| `Ctrl + N` | New Claim (after completion) |
| `Escape` | Cancel observation form |

## API

### POST /api/claims/process

Process claim documents through the AI pipeline.

**Request:**
```typescript
FormData {
  files: File[]
  documentTypes: ('license_disc' | 'claim_form' | 'policy_schedule' | 'damage_photo')[]
  assessorObservations: AssessorObservation[]
}
```

**Response:**
```typescript
{
  claimNumber: string
  results: {
    vehicleIdentification: VehicleData
    policyMatch: PolicyMatch
    damageAssessment: DamageData
    writeOffEstimation: WriteOffData
    consistencyCheck: ConsistencyData
    finalRecommendation: string
    confidence: number
  }
}
```

### POST /api/claims/report

Generate PDF report for a processed claim.

**Request:**
```typescript
{
  claimData: ClaimResults
  observations: AssessorObservation[]
  assessorSummary: AssessorSummary
}
```

**Response:**
```typescript
{
  success: boolean
  filePath: string
  fileName: string
}
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.3 (Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York style) |
| Icons | Lucide React |
| Database | Prisma ORM + SQLite |
| AI | VLM for vision, LLM for reasoning |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── claims/
│   │       ├── process/route.ts    # Main processing endpoint
│   │       └── report/route.ts     # PDF generation endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Main UI component
├── components/ui/                   # shadcn/ui components
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── lib/
    ├── ai-client.ts                # VLM/LLM integration
    ├── db.ts                       # Prisma client
    ├── utils.ts
    └── engines/
        ├── ocr-engine.ts           # Document extraction
        ├── policy-matching-engine.ts
        ├── damage-assessment-engine.ts
        ├── writeoff-estimation-engine.ts
        ├── consistency-engine.ts   # Fraud detection
        ├── validation-engine.ts
        └── report-generator.ts
```

## Development

```bash
# Run development server
bun run dev

# Run linting
bun run lint

# Push database schema changes
bun run db:push

# Build for production
bun run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Lucide](https://lucide.dev/) - Beautiful icons

---

<div align="center">

**Built with ❤️ by Z.ai**

[⬆ Back to Top](#zai-claim-intelligence-system)

</div>
