# Work Log

---
Task ID: 1
Agent: Main Agent
Task: Add Authentication and Role-Based Access Control to Target Management System

Work Log:
- Updated Prisma schema: added `password` (String, required) and `lastLoginAt` (DateTime, optional) fields to User model
- Force-reset database and pushed schema changes
- Created `/src/lib/auth.ts` with NextAuth.js v4 configuration:
  - CredentialsProvider with email/password authentication
  - SHA-256 password hashing (via Web Crypto API)
  - JWT session strategy (8-hour max age)
  - Custom JWT and session callbacks to include role, branchId, branchName
- Created `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- Created `/src/app/api/auth/session-info/route.ts` - Server-side session info endpoint
- Created `/src/middleware.ts` - API route protection middleware:
  - Blocks unauthenticated API requests with 401
  - Admin-only routes (/api/admin/*) require admin or planning role
  - Passes user info (id, role, branchId) via request headers
- Updated `/src/lib/store.ts` Zustand store:
  - Added AuthUser interface and auth state (user, isAuthenticated, isLoadingAuth)
  - Added `getVisibleTabs()` function for role-based tab visibility
  - Added `canSelectBranch()` function for branch selector permission
- Created `/src/components/LoginOverlay.tsx`:
  - Beautiful RTL login overlay with gradient background
  - Email/password fields with show/hide toggle
  - Demo credential quick-fill buttons (admin, planning, branch manager)
  - Loading and error states
- Updated `/src/app/page.tsx`:
  - Auth gate: shows LoginOverlay when not authenticated
  - Role-based sidebar navigation filtering
  - Branch selector only for admin/planning; branch badge for branch_manager
  - User dropdown menu with role badge and logout
  - Auto-redirects to allowed tab if current tab is not permitted
  - Auto-selects branch for branch_manager users
- Updated `/prisma/seed.ts`:
  - SHA-256 hashed passwords for all 7 demo users
  - Demo credentials printed at end of seed
- Updated `.env` with NEXTAUTH_URL and NEXTAUTH_SECRET
- Ran seed successfully with all users having hashed passwords

Stage Summary:
- Authentication system fully functional with NextAuth.js v4
- 3 roles implemented: admin, planning, branch_manager
- Role-based tab visibility:
  - Admin: all 7 tabs (dashboard, product-groups, target-allocation, ad-hoc-requests, excel-import, periods, admin)
  - Planning: 6 tabs (no admin panel)
  - Branch Manager: 4 tabs (dashboard, target-allocation, ad-hoc-requests, periods) with branch locked
- API routes protected by middleware (401 for unauthenticated, 403 for unauthorized)
- All browser tests passed (3/3 PASS)
- Demo credentials: admin@target.sys/admin123, planning@target.sys/planning123, tehran@target.sys/tehran123
---
Task ID: 1
Agent: Main
Task: Fix date display issues (timezone bugs) in the admin panel

Work Log:
- Analyzed user's uploaded screenshot showing date display problems
- Identified root cause: timezone-dependent date parsing in jalali.ts
- `moment(dateStr)` with ISO strings like "2026-06-01T00:00:00.000Z" was being interpreted in the browser's local timezone, causing dates to shift by a day for users in non-UTC timezones
- `toISOString().split('T')[0]` in AdminPanel's openEdit function also suffered from timezone conversion issues
- Fixed jalali.ts: all date formatting functions now use `momentDateOnly()` which extracts the date portion directly from ISO strings (splitting on 'T') and parses with `moment(dateOnly, 'YYYY-MM-DD')` to avoid timezone shifts
- Added `isoToDateStr()` utility function for safe date extraction
- Fixed AdminPanel.tsx: replaced `new Date(period.startDate).toISOString().split('T')[0]` with `isoToDateStr(period.startDate)`
- formatJalaliDateTime now uses `extractLocalTime()` for correct local time display
- formatJalaliRelative uses native Date diff calculations
- Pushed schema to database and seeded it (resolved the Period table not existing issue)
- Verified all date displays correct via agent-browser: 1405/03/11 for 2026-06-01, etc.
- Committed and pushed to GitHub

Stage Summary:
- Fixed critical timezone bug in jalali.ts date conversion
- Fixed AdminPanel openEdit timezone bug
- Database seeded with sample data
- All changes pushed to GitHub: commit a8c11d3
