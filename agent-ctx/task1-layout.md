# Task: RTL Layout with Sidebar, Header, Footer

## Summary
Created the main page layout for the Target Management System (سیستم مدیریت تارگت) with full RTL/Persian support.

## Changes Made

### 1. `src/app/layout.tsx`
- Changed `lang="en"` to `lang="fa"` and added `dir="rtl"` on the `<html>` tag
- Updated metadata to Persian title and description

### 2. `src/app/page.tsx` (complete rewrite)
- **Header**: Sticky top bar with dark slate-900 background, emerald accent logo, system name "سیستم مدیریت تارگت", branch selector and period selector dropdowns that fetch from `/api/branches` and `/api/periods`
- **Desktop Sidebar**: Right-side (RTL) navigation with emerald active state highlight, collapsible to icons only via toggle button
- **Mobile Sidebar**: Sheet-based slide-in menu for small screens
- **Main Content**: Renders placeholder for each of 6 tabs (dashboard, product-groups, target-allocation, ad-hoc-requests, excel-import, periods) with icon, title, and description
- **Footer**: Sticky bottom with "سیستم مدیریت تارگت و درخواست‌های موردی | طراحی و توسعه واحد فناوری اطلاعات"
- **Navigation**: Zustand store integration for active tab, branch, and period selection
- **Color Scheme**: Emerald/teal primary (NOT blue/indigo), slate-900 header, slate-800 sidebar
- **Responsive**: Sidebar collapses to icons on desktop, uses Sheet on mobile

## Key Design Decisions
- Used custom sidebar implementation (not shadcn Sidebar component) for simpler RTL control
- Used shadcn Select, Sheet, Tooltip, ScrollArea, Separator, Button components
- All navigation items have Lucide icons as specified
- Footer uses `mt-auto` in flex column for sticky-bottom behavior
