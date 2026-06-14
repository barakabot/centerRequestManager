'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  Target,
  FileQuestion,
  Upload,
  Calendar,
  Menu,
  Building2,
  CalendarDays,
  Shield,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAppStore, type ActiveTab, getVisibleTabs, canSelectBranch, type AuthUser } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import DashboardSection from '@/components/sections/DashboardSection';
import ProductGroupsSection from '@/components/sections/ProductGroupsSection';
import TargetAllocationSection from '@/components/sections/TargetAllocationSection';
import AdHocRequestsSection from '@/components/sections/AdHocRequestsSection';
import ExcelImportSection from '@/components/sections/ExcelImportSection';
import PeriodsSection from '@/components/sections/PeriodsSection';
import AdminPanel from '@/components/sections/AdminPanel';
import LoginOverlay from '@/components/LoginOverlay';

// --- Types ---
interface Branch {
  id: string;
  name: string;
  code: string;
  region: string | null;
  isActive: boolean;
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deadlineDate: string;
  status: string;
}

// --- All Navigation Items ---
const allNavItems: { id: ActiveTab; label: string; icon: React.ElementType; minRole: string[] }[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, minRole: ['admin', 'planning', 'branch_manager'] },
  { id: 'product-groups', label: 'گروه‌های کالایی', icon: Package, minRole: ['admin', 'planning'] },
  { id: 'target-allocation', label: 'تخصیص تارگت', icon: Target, minRole: ['admin', 'planning', 'branch_manager'] },
  { id: 'ad-hoc-requests', label: 'درخواست‌های موردی', icon: FileQuestion, minRole: ['admin', 'planning', 'branch_manager'] },
  { id: 'excel-import', label: 'ورود اطلاعات', icon: Upload, minRole: ['admin', 'planning'] },
  { id: 'periods', label: 'دوره‌ها', icon: Calendar, minRole: ['admin', 'planning', 'branch_manager'] },
  { id: 'admin', label: 'پنل ادمین', icon: Shield, minRole: ['admin'] },
];

// --- Tab Content Labels ---
const tabPlaceholders: Record<ActiveTab, { title: string; description: string }> = {
  dashboard: { title: 'داشبورد', description: 'نمای کلی وضعیت تارگت‌ها و عملکرد شعب' },
  'product-groups': { title: 'گروه‌های کالایی', description: 'مدیریت گروه‌های کالایی و خطوط فروش' },
  'target-allocation': { title: 'تخصیص تارگت', description: 'تخصیص تارگت فروش به بازاریابان' },
  'ad-hoc-requests': { title: 'درخواست‌های موردی', description: 'مدیریت درخواست‌های اصلاحی و اضافی' },
  'excel-import': { title: 'ورود اطلاعات', description: 'ورود اطلاعات از فایل اکسل' },
  periods: { title: 'دوره‌ها', description: 'مدیریت دوره‌های فروش' },
  admin: { title: 'پنل ادمین', description: 'مدیریت کاربران، شعب، گروه‌های کالایی و تارگت‌های انبوه' },
};

// --- Role helpers ---
const getRoleConfig = (role: string): { label: string; className: string } => {
  switch (role) {
    case 'admin': return { label: 'مدیر سیستم', className: 'bg-red-100 text-red-800 border-red-300' }
    case 'planning': return { label: 'برنامه‌ریز فروش', className: 'bg-violet-100 text-violet-800 border-violet-300' }
    case 'branch_manager': return { label: 'مدیر شعبه', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    default: return { label: role, className: '' }
  }
}

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    selectedBranchId,
    setSelectedBranchId,
    selectedPeriodId,
    setSelectedPeriodId,
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoadingAuth,
    setIsLoadingAuth,
  } = useAppStore();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Check auth on mount ---
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session-info')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
          } else {
            setUser(null)
            setIsAuthenticated(false)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch {
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoadingAuth(false)
      }
    }
    checkAuth()
  }, [setUser, setIsAuthenticated, setIsLoadingAuth])

  // --- Auto-select branch for branch_manager ---
  useEffect(() => {
    if (user && user.role === 'branch_manager' && user.branchId) {
      setSelectedBranchId(user.branchId)
    }
  }, [user, setSelectedBranchId])

  // Fetch branches
  useEffect(() => {
    if (!isAuthenticated) return
    async function fetchBranches() {
      try {
        const res = await fetch('/api/branches?isActive=true')
        if (res.ok) {
          const data = await res.json()
          setBranches(data)
          if (data.length > 0 && !selectedBranchId) {
            // For admin/planning, select first branch. For branch_manager, it's auto-set above.
            setSelectedBranchId(data[0].id)
          }
        }
      } catch {
        console.error('Failed to fetch branches')
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
  }, [isAuthenticated, selectedBranchId, setSelectedBranchId])

  // Fetch periods
  useEffect(() => {
    if (!isAuthenticated) return
    async function fetchPeriods() {
      try {
        const res = await fetch('/api/periods?status=active')
        if (res.ok) {
          const data = await res.json()
          setPeriods(data)
          if (data.length > 0 && !selectedPeriodId) {
            setSelectedPeriodId(data[0].id)
          }
        }
      } catch {
        console.error('Failed to fetch periods')
      } finally {
        setLoadingPeriods(false)
      }
    }
    fetchPeriods()
  }, [isAuthenticated, selectedPeriodId, setSelectedPeriodId])

  // --- Redirect tab if not allowed ---
  useEffect(() => {
    if (!user) return
    const visibleTabs = getVisibleTabs(user.role)
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0])
    }
  }, [user, activeTab, setActiveTab])

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab)
      setMobileMenuOpen(false)
    },
    [setActiveTab]
  )

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirect: false })
    } catch {
      // ignore
    }
    setUser(null)
    setIsAuthenticated(false)
    setActiveTab('dashboard')
  }, [setUser, setIsAuthenticated, setActiveTab])

  // --- Loading auth state ---
  if (isLoadingAuth) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
            <Target className="size-6 text-white" />
          </div>
          <p className="text-slate-400 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  // --- Not authenticated: show login overlay ---
  if (!isAuthenticated || !user) {
    return <LoginOverlay />
  }

  // --- Authenticated: show main app ---
  const visibleTabs = getVisibleTabs(user.role)
  const navItems = allNavItems.filter(item => item.minRole.includes(user.role))
  const currentTab = tabPlaceholders[activeTab]
  const userCanSelectBranch = canSelectBranch(user.role)
  const roleConfig = getRoleConfig(user.role)

  // --- Sidebar Navigation ---
  const SidebarNav = ({ collapsed = false }: { collapsed?: boolean }) => (
    <nav className="flex flex-col gap-1 px-2 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleTabChange(item.id)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 w-full cursor-pointer
                  ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="left" sideOffset={8}>
                <p>{item.label}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </nav>
  );

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          {/* Right: Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="باز کردن منو"
            >
              <Menu className="size-5" />
            </Button>
            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="باز/بستن منوی کناری"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Target className="size-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white hidden sm:block">
                سیستم مدیریت تارگت
              </h1>
            </div>
          </div>

          {/* Left: Selectors + User Menu */}
          <div className="flex items-center gap-3">
            {/* Branch Selector - only for admin/planning */}
            {userCanSelectBranch && (
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-slate-400 hidden sm:block" />
                <Select
                  dir="rtl"
                  value={selectedBranchId || ''}
                  onValueChange={(val) => setSelectedBranchId(val)}
                >
                  <SelectTrigger className="w-[180px] sm:w-[200px] bg-slate-800 border-slate-600 text-white text-sm hover:bg-slate-700 focus:ring-emerald-500">
                    <SelectValue placeholder={loadingBranches ? 'در حال بارگذاری...' : 'انتخاب شعبه'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {branches.map((branch) => (
                      <SelectItem
                        key={branch.id}
                        value={branch.id}
                        className="text-white focus:bg-emerald-600 focus:text-white"
                      >
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch badge for branch_manager */}
            {!userCanSelectBranch && user.branchName && (
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
                <Building2 className="size-4 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">{user.branchName}</span>
              </div>
            )}

            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-slate-400 hidden sm:block" />
              <Select
                dir="rtl"
                value={selectedPeriodId || ''}
                onValueChange={(val) => setSelectedPeriodId(val)}
              >
                <SelectTrigger className="w-[160px] sm:w-[180px] bg-slate-800 border-slate-600 text-white text-sm hover:bg-slate-700 focus:ring-emerald-500">
                  <SelectValue placeholder={loadingPeriods ? 'در حال بارگذاری...' : 'انتخاب دوره'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  {periods.map((period) => (
                    <SelectItem
                      key={period.id}
                      value={period.id}
                      className="text-white focus:bg-emerald-600 focus:text-white"
                    >
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Menu */}
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-2">
                  <div className="size-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                    <User className="size-4 text-emerald-400" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium text-white leading-tight">{user.name}</span>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${roleConfig.className}`}>
                      {roleConfig.label}
                    </Badge>
                  </div>
                  <ChevronDown className="size-3 text-slate-400 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700 text-white">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${roleConfig.className}`}>
                    {roleConfig.label}
                  </Badge>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4 ml-2" />
                  خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside
          className={`
            hidden md:flex flex-col bg-slate-800 border-l border-slate-700
            transition-all duration-300 ease-in-out shrink-0
            ${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'}
          `}
        >
          {/* Sidebar Header */}
          <div className={`p-3 border-b border-slate-700 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2 px-2">
                <div className="size-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <Target className="size-4 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-emerald-400">منوی اصلی</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="size-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <Target className="size-4 text-emerald-400" />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Navigation */}
          <ScrollArea className="flex-1">
            <SidebarNav collapsed={sidebarCollapsed} />
          </ScrollArea>

          {/* Sidebar Footer - User info */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-700">
              <div className="px-2 flex items-center gap-2">
                <div className="size-7 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0">
                  <User className="size-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 ${roleConfig.className}`}>
                    {roleConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ===== MOBILE SIDEBAR (Sheet) ===== */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="bg-slate-800 border-slate-700 p-0 w-[260px]">
            <SheetHeader className="p-4 border-b border-slate-700">
              <SheetTitle className="text-emerald-400 flex items-center gap-2">
                <div className="size-7 rounded bg-emerald-500/20 flex items-center justify-center">
                  <Target className="size-4 text-emerald-400" />
                </div>
                منوی اصلی
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <SidebarNav collapsed={false} />
            </ScrollArea>
            <div className="p-3 border-t border-slate-700">
              <div className="px-2 flex items-center gap-2">
                <div className="size-7 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0">
                  <User className="size-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 ${roleConfig.className}`}>
                    {roleConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ===== CONTENT AREA ===== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Tab Title Bar */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const Icon = navItems.find((i) => i.id === activeTab)?.icon || LayoutDashboard;
                  return (
                    <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Icon className="size-5 text-emerald-700" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{currentTab?.title || 'داشبورد'}</h2>
                  <p className="text-sm text-slate-500">{currentTab?.description || ''}</p>
                </div>
              </div>
              <Separator className="mt-4" />
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && (
              <DashboardSection branchId={selectedBranchId} />
            )}
            {activeTab === 'product-groups' && (
              <ProductGroupsSection />
            )}
            {activeTab === 'target-allocation' && (
              <TargetAllocationSection />
            )}
            {activeTab === 'ad-hoc-requests' && (
              <AdHocRequestsSection />
            )}
            {activeTab === 'excel-import' && (
              <ExcelImportSection />
            )}
            {activeTab === 'periods' && (
              <PeriodsSection />
            )}
            {activeTab === 'admin' && (
              <AdminPanel />
            )}
          </main>

          {/* ===== FOOTER ===== */}
          <footer className="bg-slate-900 border-t border-slate-700 px-4 py-3 mt-auto">
            <p className="text-center text-xs text-slate-400">
              سیستم مدیریت تارگت و درخواست‌های موردی | طراحی و توسعه واحد فناوری اطلاعات
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
