'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, Users, ArrowLeft, Target } from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Salesman {
  id: string
  name: string
  code: string
  branchId: string
  isActive: boolean
}

interface SalesmanTarget {
  id: string
  suggestedTarget: number
  assignedTarget: number
  stretchTarget: number | null
  minTarget: number
  avgCartonSales: number
  activeCustomers: number
  status: string
  salesman: Salesman
}

interface ProductGroup {
  id: string
  name: string
  code: string
  salesLine: string
  isActive: boolean
}

interface TargetData {
  id: string
  totalTarget: number
  allocatedTarget: number
  status: string
  productGroup: ProductGroup
  salesmanTargets: SalesmanTarget[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatNumber = (num: number): string => num.toLocaleString('fa-IR')
const formatPercent = (num: number): string =>
  `٪${num.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}`

const getStatusConfig = (status: string): { label: string; className: string } => {
  switch (status) {
    case 'pending':
      return { label: 'در انتظار', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100' }
    case 'partially_allocated':
      return { label: 'تخصیص جزئی', className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100' }
    case 'allocated':
      return { label: 'تخصیص‌یافته', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100' }
    case 'finalized':
      return { label: 'نهایی‌شده', className: 'bg-green-200 text-green-900 border-green-400 hover:bg-green-200' }
    default:
      return { label: status, className: '' }
  }
}

const getProgressClass = (rate: number): string => {
  if (rate >= 80) return '[&>div]:bg-emerald-500'
  if (rate >= 60) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

const getSalesLineBadgeClass = (line: string): string => {
  switch (line) {
    case 'خوراکی':
      return 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-100'
    case 'بهداشتی':
      return 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-100'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-100'
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ProductGroupCard({
  target,
  onAllocate,
}: {
  target: TargetData
  onAllocate: (targetId: string) => void
}) {
  const allocationRate = target.totalTarget > 0
    ? Math.round((target.allocatedTarget / target.totalTarget) * 100)
    : 0
  const statusConfig = getStatusConfig(target.status)
  const salesLineBadgeClass = getSalesLineBadgeClass(target.productGroup.salesLine)
  const progressClass = getProgressClass(allocationRate)
  const salesmanCount = target.salesmanTargets?.length ?? 0

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">
              {target.productGroup.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className="text-[11px] font-mono font-normal">
                {target.productGroup.code}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] font-normal ${salesLineBadgeClass}`}
              >
                <Package className="h-3 w-3 ml-1" />
                {target.productGroup.salesLine}
              </Badge>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[11px] ${statusConfig.className}`}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Allocation Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">نرخ تخصیص</span>
            <span className="font-semibold">{formatPercent(allocationRate)}</span>
          </div>
          <Progress value={allocationRate} className={`h-2.5 ${progressClass}`} />
        </div>

        {/* Target Numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">تارگت کل</p>
            <p className="text-sm font-bold">{formatNumber(target.totalTarget)} کارتنی</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">تخصیص‌یافته</p>
            <p className="text-sm font-bold">{formatNumber(target.allocatedTarget)} کارتنی</p>
          </div>
        </div>

        {/* Salesmen Info */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{formatNumber(salesmanCount)} فروشنده</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            <span>باقیمانده: {formatNumber(target.totalTarget - target.allocatedTarget)}</span>
          </div>
        </div>

        {/* Allocate Button */}
        <Button
          onClick={() => onAllocate(target.id)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 ml-1" />
          تخصیص تارگت
        </Button>
      </CardContent>
    </Card>
  )
}

function ProductGroupSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-4 pt-2 border-t">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">اطلاعاتی یافت نشد</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        ابتدا شعبه و دوره مورد نظر را از بالای صفحه انتخاب کنید.
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductGroupsSection() {
  const {
    selectedBranchId,
    selectedPeriodId,
    selectedSalesLine,
    setSelectedSalesLine,
    setSelectedTargetId,
    setActiveTab,
  } = useAppStore()

  // Fetch targets
  const { data: targets = [], isLoading, isError, error } = useQuery<TargetData[]>({
    queryKey: ['targets', selectedBranchId, selectedPeriodId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedBranchId) params.set('branchId', selectedBranchId)
      if (selectedPeriodId) params.set('periodId', selectedPeriodId)

      const res = await fetch(`/api/targets?${params.toString()}`)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || 'خطا در دریافت اطلاعات گروه‌های کالایی')
      }
      return res.json()
    },
    enabled: !!selectedBranchId && !!selectedPeriodId,
  })

  // Filter by sales line
  const filteredTargets = selectedSalesLine
    ? targets.filter((t) => t.productGroup.salesLine === selectedSalesLine)
    : targets

  // Get unique sales lines
  const salesLines = Array.from(new Set(targets.map((t) => t.productGroup.salesLine)))

  // Handle allocate click
  const handleAllocate = (targetId: string) => {
    setSelectedTargetId(targetId)
    setActiveTab('target-allocation')
  }

  // No branch/period selected
  if (!selectedBranchId || !selectedPeriodId) {
    return <EmptyState />
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-6">
          <Package className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">خطا در بارگذاری اطلاعات</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {error?.message || 'لطفاً دوباره تلاش کنید.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">خط فروش:</span>
          <Select
            dir="rtl"
            value={selectedSalesLine || 'all'}
            onValueChange={(val) => setSelectedSalesLine(val === 'all' ? null : val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="همه خطوط" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه خطوط</SelectItem>
              {salesLines.map((line) => (
                <SelectItem key={line} value={line}>
                  {line}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            `${formatNumber(filteredTargets.length)} گروه کالایی`
          )}
        </div>
      </div>

      {/* ─── Product Group Cards Grid ──────────────────────────────────── */}
      {isLoading ? (
        <ProductGroupSkeleton />
      ) : filteredTargets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTargets.map((target) => (
            <ProductGroupCard
              key={target.id}
              target={target}
              onAllocate={handleAllocate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              گروه کالایی برای این شعبه و دوره یافت نشد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
