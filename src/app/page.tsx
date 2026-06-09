'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useAppStore, type ActiveTab } from '@/lib/store';
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
import DashboardSection from '@/components/sections/DashboardSection';
import ProductGroupsSection from '@/components/sections/ProductGroupsSection';
import TargetAllocationSection from '@/components/sections/TargetAllocationSection';
import AdHocRequestsSection from '@/components/sections/AdHocRequestsSection';
import ExcelImportSection from '@/components/sections/ExcelImportSection';
import PeriodsSection from '@/components/sections/PeriodsSection';
import AdminPanel from '@/components/sections/AdminPanel';

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

// --- Navigation Items ---
const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'product-groups', label: 'گروه‌های کالایی', icon: Package },
  { id: 'target-allocation', label: 'تخصیص تارگت', icon: Target },
  { id: 'ad-hoc-requests', label: 'درخواست‌های موردی', icon: FileQuestion },
  { id: 'excel-import', label: 'ورود اطلاعات', icon: Upload },
  { id: 'periods', label: 'دوره‌ها', icon: Calendar },
  { id: 'admin', label: 'پنل ادمین', icon: Shield },
];

// --- Tab Content Placeholders ---
const tabPlaceholders: Record<ActiveTab, { title: string; description: string }> = {
  dashboard: {
    title: 'داشبورد',
    description: 'نمای کلی وضعیت تارگت‌ها و عملکرد شعب',
  },
  'product-groups': {
    title: 'گروه‌های کالایی',
    description: 'مدیریت گروه‌های کالایی و خطوط فروش',
  },
  'target-allocation': {
    title: 'تخصیص تارگت',
    description: 'تخصیص تارگت فروش به بازاریابان',
  },
  'ad-hoc-requests': {
    title: 'درخواست‌های موردی',
    description: 'مدیریت درخواست‌های اصلاحی و اضافی',
  },
  'excel-import': {
    title: 'ورود اطلاعات',
    description: 'ورود اطلاعات از فایل اکسل',
  },
  periods: {
    title: 'دوره‌ها',
    description: 'مدیریت دوره‌های فروش',
  },
  admin: {
    title: 'پنل ادمین',
    description: 'مدیریت کاربران، شعب، گروه‌های کالایی و تارگت‌های انبوه',
  },
};

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    selectedBranchId,
    setSelectedBranchId,
    selectedPeriodId,
    setSelectedPeriodId,
  } = useAppStore();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch branches
  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch('/api/branches?isActive=true');
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
          if (data.length > 0 && !selectedBranchId) {
            setSelectedBranchId(data[0].id);
          }
        }
      } catch {
        console.error('Failed to fetch branches');
      } finally {
        setLoadingBranches(false);
      }
    }
    fetchBranches();
  }, [selectedBranchId, setSelectedBranchId]);

  // Fetch periods
  useEffect(() => {
    async function fetchPeriods() {
      try {
        const res = await fetch('/api/periods?status=active');
        if (res.ok) {
          const data = await res.json();
          setPeriods(data);
          if (data.length > 0 && !selectedPeriodId) {
            setSelectedPeriodId(data[0].id);
          }
        }
      } catch {
        console.error('Failed to fetch periods');
      } finally {
        setLoadingPeriods(false);
      }
    }
    fetchPeriods();
  }, [selectedPeriodId, setSelectedPeriodId]);

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab);
      setMobileMenuOpen(false);
    },
    [setActiveTab]
  );

  const currentTab = tabPlaceholders[activeTab];

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

          {/* Left: Selectors */}
          <div className="flex items-center gap-3">
            {/* Branch Selector */}
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

          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-700">
              <div className="px-2 text-xs text-slate-500 text-center">
                نسخه ۱.۰.۰
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
                  <h2 className="text-xl font-bold text-slate-800">{currentTab.title}</h2>
                  <p className="text-sm text-slate-500">{currentTab.description}</p>
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
