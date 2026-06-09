# Task: Create DashboardSection Component

## Agent: Main Developer

## Summary

Created the comprehensive DashboardSection component at `/home/z/my-project/src/components/sections/DashboardSection.tsx` with the following features:

### Files Created/Modified:
1. **`/home/z/my-project/src/components/providers/react-query-provider.tsx`** — New file: React Query provider with client-side QueryClient configuration (30s stale time, no refetch on window focus, 1 retry).
2. **`/home/z/my-project/src/components/sections/DashboardSection.tsx`** — New file: Main dashboard component (567 lines).
3. **`/home/z/my-project/src/app/layout.tsx`** — Modified: Added ReactQueryProvider wrapper and RTL/Persian language setup.
4. **`/home/z/my-project/src/app/page.tsx`** — Modified: Updated to render DashboardSection when dashboard tab is active.

### Component Structure:

1. **KPI Cards** (4-card responsive grid: 1→2→4 columns)
   - مجموع تارگت (Total Target) — Target icon, teal background
   - تارگت تخصیص‌یافته (Allocated Target) — TrendingUp icon, emerald background, trend indicator
   - نرخ تحقق (Achievement Rate) — BarChart3 icon, cyan background
   - درخواست‌های در انتظار (Pending Requests) — Clock icon, amber background

2. **Achievement Rate Highlight** — Color-coded banner (green ≥80%, amber ≥60%, red <60%) with Persian status text

3. **Sales Line Chart** — Horizontal bar chart using Recharts with ChartContainer
   - Compares total target vs allocated target per sales line
   - Persian tick labels, tooltips, and legend
   - Teal/emerald color scheme

4. **Product Group Breakdown Cards** — Grid (1→2→3 columns)
   - Product group name + sales line badge
   - Progress bar with color-coded allocation rate
   - Target numbers with "کارتنی" suffix
   - Salesman count and confirmed count
   - Status badge (pending=yellow, partially_allocated=orange, allocated=emerald, finalized=dark green)
   - Clickable cards → navigate to target allocation tab

### Key Implementation Details:
- **TanStack Query** for data fetching with `queryKey: ['dashboard', branchId]`
- **Persian number formatting** via `toLocaleString('fa-IR')`
- **Loading states** with Skeleton components matching card layout
- **Empty state** when no branch is selected
- **Error state** with retry guidance
- **Emerald/teal primary colors** (no blue/indigo)
- **RTL-aware** layout
- **Responsive design** across mobile/tablet/desktop

### Lint: Passed (no errors)
