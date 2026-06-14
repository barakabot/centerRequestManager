# Center Request Manager

<p align="center">
  <strong>سیستم مدیریت درخواست و تارگت‌گذاری مرکزی</strong>
</p>

---

## Overview

Center Request Manager is a comprehensive **Target Management & Request Tracking System** designed for distribution and sales organizations. It enables HQ planning teams to allocate sales targets across branches, branch managers to distribute targets among salesmen, and provides a complete workflow for ad-hoc target adjustment requests.

The system is built with a **RTL (Right-to-Left)** Persian interface and role-based access control.

## Features

### Dashboard
- Overview of branch targets vs allocations with visual charts
- Sales performance tracking across periods
- Request status summaries (pending, in-review, approved, rejected)
- Period comparison analytics

### Target Allocation
- Planning department sets total targets per branch per product group per period
- Branch managers allocate targets to individual salesmen
- Suggested, assigned, minimum, and stretch target levels
- Target status tracking (pending → partially allocated → allocated → finalized)

### Ad-Hoc Requests
- Branch managers can submit correction, additional, transfer, and other requests
- Full review workflow with approve/reject by planning
- Priority levels (low, normal, high, urgent)
- Review notes and status tracking

### Excel Import
- Bulk import targets and sales data from Excel files
- Validation and error reporting

### Periods Management
- Define sales periods with start/end dates and deadlines
- Period status tracking (active, closed, auto-allocated)

### Admin Panel (10 Sub-tabs)
| Tab | Description |
|-----|-------------|
| **Overview** | Charts & statistics dashboard with Recharts |
| **Users** | Create, edit, delete users with password management |
| **Branches** | Manage branches and regions |
| **Product Groups** | Manage product groups and sales lines |
| **Salesmen** | Full CRUD for salesmen per branch |
| **Periods** | Manage sales periods and deadlines |
| **Bulk Targets** | Mass target creation and updates |
| **Request Review** | Review and approve/reject ad-hoc requests |
| **Audit Log** | Track all system activities with filters |
| **Settings** | System configuration management |

### Authentication & Authorization
- NextAuth.js v4 with credentials provider
- Role-based access control with 3 roles:
  - **Admin** — Full access to all features including admin panel
  - **Planning** — Target allocation, request review (no admin panel)
  - **Branch Manager** — Own branch targets, ad-hoc requests (branch locked)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js v4 |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/barakabot/centerRequestManager.git
cd centerRequestManager

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npm run db:push
# or
bun run db:push

# Seed the database with demo data
npm run db:seed
# or
bun run db:seed

# Start the development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## Demo Credentials

After seeding the database, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@target.sys` | `admin123` |
| Planning | `planning@target.sys` | `planning123` |
| Branch Manager (Tehran) | `tehran@target.sys` | `tehran123` |
| Branch Manager (Isfahan) | `isfahan@target.sys` | `isfahan123` |
| Branch Manager (Shiraz) | `shiraz@target.sys` | `shiraz123` |
| Branch Manager (Mashhad) | `mashhad@target.sys` | `mashhad123` |
| Branch Manager (Tabriz) | `tabriz@target.sys` | `tabriz123` |

## Database Schema

The system uses the following models:

- **Branch** — Sales branches with region and status
- **ProductGroup** — Product categories with sales lines
- **Salesman** — Sales representatives linked to branches
- **Period** — Sales periods with deadlines
- **Target** — Branch-level targets per product group per period
- **SalesmanTarget** — Individual salesman targets within a branch target
- **SalesPerformance** — Actual sales tracking
- **AdHocRequest** — Target adjustment requests
- **User** — System users with roles and hashed passwords
- **AuditLog** — Activity tracking
- **Settings** — System configuration key-value store

## API Routes

### Public API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/periods` | List periods |
| GET | `/api/branches` | List branches |
| GET | `/api/product-groups` | List product groups |
| GET | `/api/salesmen` | List salesmen |
| GET/POST | `/api/targets` | List/create targets |
| GET/POST | `/api/ad-hoc-requests` | List/create ad-hoc requests |
| POST | `/api/excel-import` | Import from Excel |

### Admin API (`/api/admin/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | List/create users |
| GET/POST | `/api/admin/branches` | List/create branches |
| GET/POST | `/api/admin/product-groups` | List/create product groups |
| GET/POST | `/api/admin/salesmen` | List/create salesmen |
| GET/POST | `/api/admin/periods` | List/create periods |
| POST | `/api/admin/targets-bulk` | Bulk target operations |
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/audit-logs` | List audit logs |
| GET/POST | `/api/admin/settings` | List/create settings |

All admin routes require admin or planning role authentication.

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
├── public/                   # Static assets
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── admin/       # Admin-only routes
│   │   │   ├── auth/        # NextAuth routes
│   │   │   └── ...          # Public API routes
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main application page
│   ├── components/
│   │   ├── sections/        # Main feature sections
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── DashboardSection.tsx
│   │   │   ├── TargetAllocationSection.tsx
│   │   │   ├── AdHocRequestsSection.tsx
│   │   │   ├── ExcelImportSection.tsx
│   │   │   ├── PeriodsSection.tsx
│   │   │   └── ProductGroupsSection.tsx
│   │   ├── ui/              # shadcn/ui components
│   │   ├── LoginOverlay.tsx  # Authentication overlay
│   │   └── providers/       # React Query provider
│   ├── hooks/               # Custom React hooks
│   └── lib/
│       ├── auth.ts          # NextAuth configuration
│       ├── audit.ts         # Audit log helper
│       ├── db.ts            # Prisma client
│       ├── store.ts         # Zustand store
│       └── utils.ts         # Utility functions
├── .env                      # Environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema changes to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |
| `bun run db:seed` | Seed database with demo data |

## License

This project is proprietary and confidential.
