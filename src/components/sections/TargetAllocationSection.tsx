'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  ArrowRight,
  Package,
  Users,
  Target,
  CheckCircle2,
  AlertTriangle,
  Save,
  CheckCheck,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

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

interface EditableSalesmanTarget {
  id: string
  assignedTarget: number
  stretchTarget: number
  minTarget: number
  salesmanName: string
  originalAssigned: number
  originalStretch: number
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
    case 'confirmed':
      return { label: 'تأییدشده', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100' }
    default:
      return { label: status, className: '' }
  }
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

// ─── View 1: Product Group Selection ─────────────────────────────────────────

function ProductGroupSelection({
  targets,
  isLoading,
  onSelectTarget,
}: {
  targets: TargetData[]
  isLoading: boolean
  onSelectTarget: (targetId: string) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 w-48">
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
          <Target className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">تارگتی یافت نشد</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          ابتدا شعبه و دوره مورد نظر را از بالای صفحه انتخاب کنید.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        گروه کالایی مورد نظر را برای تخصیص تارگت انتخاب کنید:
      </p>
      {targets.map((target) => {
        const allocationRate = target.totalTarget > 0
          ? Math.round((target.allocatedTarget / target.totalTarget) * 100)
          : 0
        const statusConfig = getStatusConfig(target.status)
        const salesLineBadgeClass = getSalesLineBadgeClass(target.productGroup.salesLine)
        const remaining = target.totalTarget - target.allocatedTarget
        const progressClass =
          allocationRate >= 80 ? '[&>div]:bg-emerald-500' :
          allocationRate >= 60 ? '[&>div]:bg-amber-500' :
          '[&>div]:bg-red-500'

        return (
          <Card
            key={target.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-[0.995]"
            onClick={() => onSelectTarget(target.id)}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                {/* Right: Info */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Package className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-base truncate">
                        {target.productGroup.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-normal ${salesLineBadgeClass}`}
                      >
                        {target.productGroup.salesLine}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-normal ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{target.productGroup.code}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatNumber(target.salesmanTargets.length)} فروشنده
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left: Progress & Numbers */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-40 sm:w-52 space-y-1.5 hidden sm:block">
                    <Progress value={allocationRate} className={`h-2.5 ${progressClass}`} />
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        تخصیص {formatPercent(allocationRate)}
                      </span>
                      <span className={remaining > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                        باقیمانده: {formatNumber(remaining)}
                      </span>
                    </div>
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-muted-foreground">تارگت کل</p>
                    <p className="text-sm font-bold">{formatNumber(target.totalTarget)}</p>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </div>

              {/* Mobile: Progress bar below */}
              <div className="sm:hidden mt-3 space-y-1.5">
                <Progress value={allocationRate} className={`h-2 ${progressClass}`} />
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    تخصیص {formatPercent(allocationRate)}
                  </span>
                  <span className={remaining > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                    باقیمانده: {formatNumber(remaining)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── View 2: Salesman Target Allocation ──────────────────────────────────────

function SalesmanAllocation({
  target,
  onBack,
}: {
  target: TargetData
  onBack: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Local editable state for salesman targets - initialized from fetched data
  const [editableTargets, setEditableTargets] = useState<EditableSalesmanTarget[]>(() =>
    target.salesmanTargets.map((st) => ({
      id: st.id,
      assignedTarget: st.assignedTarget,
      stretchTarget: st.stretchTarget ?? 0,
      minTarget: st.minTarget,
      salesmanName: st.salesman.name,
      originalAssigned: st.assignedTarget,
      originalStretch: st.stretchTarget ?? 0,
    }))
  )

  // Computed values
  const totalAllocated = useMemo(
    () => editableTargets.reduce((sum, st) => sum + st.assignedTarget, 0),
    [editableTargets]
  )

  const remaining = target.totalTarget - totalAllocated
  const allocationRate = target.totalTarget > 0
    ? Math.round((totalAllocated / target.totalTarget) * 100)
    : 0

  // Summary bar color
  const summaryColorClass =
    remaining === 0
      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300'
      : remaining > 0
        ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-300'
        : 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-300'

  const summaryIconClass =
    remaining === 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : remaining > 0
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  // Validation
  const belowMinimumErrors = useMemo(
    () => editableTargets.filter((st) => st.assignedTarget < st.minTarget),
    [editableTargets]
  )

  const hasUnsavedChanges = useMemo(
    () =>
      editableTargets.some(
        (st) =>
          st.assignedTarget !== st.originalAssigned ||
          st.stretchTarget !== st.originalStretch
      ),
    [editableTargets]
  )

  // All allocated check (for finalize)
  const allAllocated = remaining === 0 && belowMinimumErrors.length === 0

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        targetId: target.id,
        salesmanTargets: editableTargets.map((st) => ({
          id: st.id,
          assignedTarget: st.assignedTarget,
          stretchTarget: st.stretchTarget || null,
          salesmanName: st.salesmanName,
          minTarget: st.minTarget,
        })),
      }
      const res = await fetch('/api/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        if (errBody.details && Array.isArray(errBody.details)) {
          throw new Error(errBody.details.join('\n'))
        }
        throw new Error(errBody.error || 'خطا در ذخیره تارگت‌ها')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] })
      // Update original values
      setEditableTargets((prev) =>
        prev.map((st) => ({
          ...st,
          originalAssigned: st.assignedTarget,
          originalStretch: st.stretchTarget,
        }))
      )
      toast({
        title: 'ذخیره موفق',
        description: 'تارگت‌ها با موفقیت ذخیره شدند.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'خطا در ذخیره',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Handle save
  const handleSave = useCallback(() => {
    // Validate: below minimum
    if (belowMinimumErrors.length > 0) {
      toast({
        title: 'خطای اعتبارسنجی',
        description: `تارگت اختصاص‌یافته ${belowMinimumErrors.length} فروشنده کمتر از کف تارگت است.`,
        variant: 'destructive',
      })
      return
    }

    // Validate: total must equal group target
    if (Math.abs(remaining) > 1) {
      toast({
        title: 'خطای اعتبارسنجی',
        description: `مجموع تارگت‌های اختصاص‌یافته (${formatNumber(totalAllocated)}) با تارگت کل گروه (${formatNumber(target.totalTarget)}) برابر نیست. اختلاف: ${formatNumber(Math.abs(remaining))}`,
        variant: 'destructive',
      })
      return
    }

    saveMutation.mutate()
  }, [belowMinimumErrors, remaining, totalAllocated, target.totalTarget, saveMutation, toast])

  // Handle finalize
  const handleFinalize = useCallback(() => {
    if (!allAllocated) return
    saveMutation.mutate()
  }, [allAllocated, saveMutation])

  // Input change handlers
  const handleAssignedChange = useCallback((id: string, value: string) => {
    const numVal = value === '' ? 0 : Number(value)
    if (!isNaN(numVal) && numVal >= 0) {
      setEditableTargets((prev) =>
        prev.map((st) => (st.id === id ? { ...st, assignedTarget: numVal } : st))
      )
    }
  }, [])

  const handleStretchChange = useCallback((id: string, value: string) => {
    const numVal = value === '' ? 0 : Number(value)
    if (!isNaN(numVal) && numVal >= 0) {
      setEditableTargets((prev) =>
        prev.map((st) => (st.id === id ? { ...st, stretchTarget: numVal } : st))
      )
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{target.productGroup.name}</h3>
              <Badge
                variant="outline"
                className={`text-[11px] font-normal ${getSalesLineBadgeClass(target.productGroup.salesLine)}`}
              >
                {target.productGroup.salesLine}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {target.productGroup.code}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${getStatusConfig(target.status).className}`}
        >
          {getStatusConfig(target.status).label}
        </Badge>
      </div>

      {/* ─── Summary Bar ───────────────────────────────────────────────── */}
      <div className={`rounded-xl border p-4 ${summaryColorClass}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Group Target */}
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/50 dark:bg-black/20`}>
              <Target className={`h-5 w-5 ${summaryIconClass}`} />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">مجموع تارگت گروه</p>
              <p className="text-lg font-bold">{formatNumber(target.totalTarget)} کارتنی</p>
            </div>
          </div>

          {/* Total Allocated */}
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/50 dark:bg-black/20`}>
              <TrendingUp className={`h-5 w-5 ${summaryIconClass}`} />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">مجموع تخصیص‌یافته</p>
              <p className="text-lg font-bold">{formatNumber(totalAllocated)} کارتنی</p>
            </div>
          </div>

          {/* Remaining */}
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/50 dark:bg-black/20`}>
              {remaining === 0 ? (
                <CheckCircle2 className={`h-5 w-5 ${summaryIconClass}`} />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${summaryIconClass}`} />
              )}
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">باقیمانده</p>
              <p className="text-lg font-bold">
                {remaining === 0
                  ? 'تکمیل شده ✓'
                  : `${formatNumber(Math.abs(remaining))} کارتنی ${remaining < 0 ? '(اضافی)' : ''}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar in summary */}
        <div className="mt-3 space-y-1">
          <Progress
            value={Math.min(allocationRate, 100)}
            className={`h-2 ${
              remaining === 0
                ? '[&>div]:bg-emerald-500'
                : remaining > 0
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-red-500'
            }`}
          />
          <p className="text-xs font-medium opacity-70 text-right">
            نرخ تخصیص: {formatPercent(allocationRate)}
          </p>
        </div>
      </div>

      {/* ─── Validation Warnings ───────────────────────────────────────── */}
      {belowMinimumErrors.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-2">
            <AlertTriangle className="h-4 w-4" />
            هشدار اعتبارسنجی
          </div>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 pr-6 list-disc">
            {belowMinimumErrors.map((st) => (
              <li key={st.id}>
                {st.salesmanName}: تارگت اختصاص‌یافته ({formatNumber(st.assignedTarget)}) کمتر از کف تارگت ({formatNumber(st.minTarget)}) است
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Allocation Table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">جدول تخصیص تارگت فروشندگان</CardTitle>
          <CardDescription>
            مقادیر تارگت اختصاص‌یافته و تارگت انگیزشی قابل ویرایش هستند
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">نام فروشنده</TableHead>
                <TableHead className="text-center font-semibold">میانگین فروش کارتنی</TableHead>
                <TableHead className="text-center font-semibold">تعداد مشتریان فعال</TableHead>
                <TableHead className="text-center font-semibold">تارگت پیشنهادی</TableHead>
                <TableHead className="text-center font-semibold">کف تارگت</TableHead>
                <TableHead className="text-center font-semibold">تارگت اختصاص‌یافته</TableHead>
                <TableHead className="text-center font-semibold">تارگت انگیزشی</TableHead>
                <TableHead className="text-center font-semibold">وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {target.salesmanTargets.map((st) => {
                const editable = editableTargets.find((e) => e.id === st.id)
                if (!editable) return null

                const isBelowMin = editable.assignedTarget < editable.minTarget

                return (
                  <TableRow key={st.id} className={isBelowMin ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                    {/* Salesman Name */}
                    <TableCell className="font-medium">
                      <div>
                        <p className="text-sm">{st.salesman.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {st.salesman.code}
                        </p>
                      </div>
                    </TableCell>

                    {/* Avg Carton Sales - read only */}
                    <TableCell className="text-center text-sm">
                      {formatNumber(st.avgCartonSales)}
                    </TableCell>

                    {/* Active Customers - read only */}
                    <TableCell className="text-center text-sm">
                      {formatNumber(st.activeCustomers)}
                    </TableCell>

                    {/* Suggested Target - read only */}
                    <TableCell className="text-center text-sm font-medium text-teal-700 dark:text-teal-400">
                      {formatNumber(st.suggestedTarget)}
                    </TableCell>

                    {/* Min Target - read only */}
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatNumber(st.minTarget)}
                    </TableCell>

                    {/* Assigned Target - EDITABLE */}
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        value={editable.assignedTarget || ''}
                        onChange={(e) => handleAssignedChange(st.id, e.target.value)}
                        className={`w-28 text-center text-sm mx-auto ${
                          isBelowMin
                            ? 'border-red-400 bg-red-50 focus-visible:border-red-500 focus-visible:ring-red-200 dark:bg-red-950/30 dark:border-red-700'
                            : 'border-emerald-300 bg-emerald-50/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-700'
                        }`}
                        aria-invalid={isBelowMin}
                      />
                      {isBelowMin && (
                        <p className="text-[10px] text-red-500 mt-1">
                          حداقل: {formatNumber(st.minTarget)}
                        </p>
                      )}
                    </TableCell>

                    {/* Stretch Target - EDITABLE */}
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        value={editable.stretchTarget || ''}
                        onChange={(e) => handleStretchChange(st.id, e.target.value)}
                        className="w-28 text-center text-sm mx-auto border-amber-300 bg-amber-50/50 focus-visible:border-amber-500 focus-visible:ring-amber-200 dark:bg-amber-950/20 dark:border-amber-700"
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${getStatusConfig(st.status).className}`}
                      >
                        {getStatusConfig(st.status).label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell className="text-sm">مجموع</TableCell>
                <TableCell className="text-center text-sm">—</TableCell>
                <TableCell className="text-center text-sm">—</TableCell>
                <TableCell className="text-center text-sm text-teal-700 dark:text-teal-400">
                  {formatNumber(target.salesmanTargets.reduce((sum, st) => sum + st.suggestedTarget, 0))}
                </TableCell>
                <TableCell className="text-center text-sm">—</TableCell>
                <TableCell className="text-center text-sm">
                  <span className={remaining === 0 ? 'text-emerald-600' : remaining < 0 ? 'text-red-600' : 'text-amber-600'}>
                    {formatNumber(totalAllocated)}
                  </span>
                </TableCell>
                <TableCell className="text-center text-sm">
                  {formatNumber(editableTargets.reduce((sum, st) => sum + st.stretchTarget, 0))}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Action Buttons ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {hasUnsavedChanges && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              تغییرات ذخیره نشده دارید
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-1.5"
          >
            بازگشت به لیست
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasUnsavedChanges}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                در حال ذخیره...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                ذخیره تارگت‌ها
              </>
            )}
          </Button>
          {allAllocated && target.status !== 'finalized' && (
            <Button
              onClick={handleFinalize}
              disabled={saveMutation.isPending}
              className="gap-1.5 bg-green-700 hover:bg-green-800 text-white"
              variant="default"
            >
              <CheckCheck className="h-4 w-4" />
              تأیید نهایی
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TargetAllocationSection() {
  const {
    selectedBranchId,
    selectedPeriodId,
    selectedTargetId,
    setSelectedTargetId,
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
        throw new Error(errBody.error || 'خطا در دریافت اطلاعات')
      }
      return res.json()
    },
    enabled: !!selectedBranchId && !!selectedPeriodId,
  })

  // Find the selected target
  const selectedTarget = selectedTargetId
    ? targets.find((t) => t.id === selectedTargetId)
    : null

  // Handle target selection (View 1 → View 2)
  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetId(targetId)
  }

  // Handle back (View 2 → View 1)
  const handleBack = () => {
    setSelectedTargetId(null)
  }

  // No branch/period
  if (!selectedBranchId || !selectedPeriodId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
          <Target className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">شعبه و دوره انتخاب نشده</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          برای مشاهده تارگت‌ها، ابتدا شعبه و دوره مورد نظر را از بالای صفحه انتخاب کنید.
        </p>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-6">
          <Target className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">خطا در بارگذاری اطلاعات</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {error?.message || 'لطفاً دوباره تلاش کنید.'}
        </p>
      </div>
    )
  }

  // Conditional rendering based on selected target
  if (selectedTargetId && selectedTarget) {
    return <SalesmanAllocation key={selectedTarget.id} target={selectedTarget} onBack={handleBack} />
  }

  // If a target ID is set but not found in the list, show loading or go back
  if (selectedTargetId && !selectedTarget && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (selectedTargetId && !selectedTarget && !isLoading) {
    // Target not found, reset
    setSelectedTargetId(null)
  }

  // View 1: Product Group Selection
  return <ProductGroupSelection targets={targets} isLoading={isLoading} onSelectTarget={handleSelectTarget} />
}
