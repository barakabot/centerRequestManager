---
Task ID: 1
Agent: Main Agent
Task: Build comprehensive Target Management & Ad-hoc Request System

Work Log:
- Designed and implemented Prisma database schema with 8 models: Branch, ProductGroup, Salesman, Period, Target, SalesmanTarget, SalesPerformance, AdHocRequest, User
- Pushed schema to SQLite database
- Created seed script with realistic Persian demo data (5 branches, 6 product groups, 14 salesmen, 2 periods, targets with salesman allocations, sales performance, ad-hoc requests, users)
- Built 8 API routes: branches, product-groups, salesmen, periods, targets (GET + PUT), ad-hoc-requests (GET + POST + PUT), dashboard, excel-import
- Built React Query provider for data fetching
- Built main page layout with RTL sidebar, header with branch/period selectors, navigation tabs, and sticky footer
- Built DashboardSection with 4 KPI cards, sales line bar chart (Recharts), product group breakdown cards
- Built ProductGroupsSection with sales line filter, product group cards with allocation info
- Built TargetAllocationSection with two views: product group selection and salesman allocation table with editable inputs, real-time validation, save/finalize actions
- Built AdHocRequestsSection with status summary cards, search/filter, request table, create dialog, detail dialog, review actions
- Built ExcelImportSection with 3-step wizard: type selection, file upload with drag-and-drop, validation results with preview
- Built PeriodsSection with deadline tracking, active/closed period cards, info banner, period history table
- Ran lint check - passed
- Agent Browser verification - all 9 checks passed, no blank screens or errors

Stage Summary:
- Complete RTL Persian Target Management System with 6 functional sections
- All API endpoints working and serving real data from SQLite database
- Professional UI with emerald/teal color scheme, shadcn/ui components
- Responsive design with mobile sidebar (Sheet) and desktop collapsible sidebar
- Key features: KPI dashboard, product group management, salesman target allocation with validation, ad-hoc request workflow, Excel/CSV import with validation, period management with deadline tracking
