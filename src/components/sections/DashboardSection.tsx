'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  Package,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  branch: {
    id: string
    name: string
    code: string
    region: string
  } | null
  period: {
    id: string
    name: string
    startDate: string
    endDate: string
    deadlineDate: string
    status: string
  } | null
  kpis: {
    totalTarget: number
    totalAllocated: number
    allocationRate: number
    confirmedTargets: number
    totalTargets: number
    salesmenCount: number
    pendingRequests: number
    totalActualSales: number
    achievementRate: number
  }
  productGroupBreakdown: Array<{
    id: string
    name: string
    salesLine: string
    totalTarget: number
    allocatedTarget: number
    allocationRate: number
    status: string
    salesmanCount: number
    confirmedCount: number
  }>
  salesLineData: Array<{
    salesLine: string
    totalTarget: number
    allocatedTarget: number
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatNumber = (num: number): string => num.toLocaleString('fa-IR')
const formatPercent = (num: number): string => `٪${num.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}`

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

const getAchievementColorClass = (rate: number): string => {
  if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (rate >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const getAchievementBgClass = (rate: number): string => {
  if (rate >= 80) return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
  if (rate >= 60) return 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
  return 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800'
}

const getProgressClass = (rate: number): string => {
  if (rate >= 80) return '[&>div]:bg-emerald-500'
  if (rate >= 60) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

// ─── Chart Config ────────────────────────────────────────────────────────────

const chartConfig: ChartConfig = {
  totalTarget: {
    label: 'تارگت کل',
    color: 'oklch(0.6 0.15 165)', // teal
  },
  allocatedTarget: {
    label: 'تارگت تخصیص‌یافته',
    color: 'oklch(0.7 0.17 155)', // emerald
  },
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  trend,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  iconBg: string
  trend?: { value: string; positive: boolean }
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={`text-xs font-medium ${
                  trend.positive ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ProductGroupCard({
  group,
  onClick,
}: {
  group: DashboardData['productGroupBreakdown'][number]
  onClick: () => void
}) {
  const statusConfig = getStatusConfig(group.status)
  const progressClass = getProgressClass(group.allocationRate)

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-[0.98]"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{group.name}</CardTitle>
            <Badge variant="outline" className="mt-1.5 text-[11px] font-normal">
              <Package className="h-3 w-3 ml-1" />
              {group.salesLine}
            </Badge>
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
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">نرخ تخصیص</span>
            <span className="font-semibold">{formatPercent(group.allocationRate)}</span>
          </div>
          <Progress value={group.allocationRate} className={`h-2.5 ${progressClass}`} />
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">تارگت کل</p>
            <p className="text-sm font-bold">{formatNumber(group.totalTarget)} کارتنی</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">تخصیص‌یافته</p>
            <p className="text-sm font-bold">{formatNumber(group.allocatedTarget)} کارتنی</p>
          </div>
        </div>

        {/* People */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{formatNumber(group.salesmanCount)} فروشنده</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{formatNumber(group.confirmedCount)} تأییدشده</span>
          </div>
        </div>
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
                <Skeleton className="h-5 w-16 rounded-full" />
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
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
        <Target className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">شعبه‌ای انتخاب نشده است</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        برای مشاهده داشبورد، ابتدا یک شعبه را از منوی بالا انتخاب کنید.
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface DashboardSectionProps {
  branchId: string | null
}

export default function DashboardSection({ branchId }: DashboardSectionProps) {
  const { setSelectedProductGroupId, setActiveTab } = useAppStore()

  const { data, isLoading, isError, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', branchId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?branchId=${branchId}`)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || 'خطا در دریافت اطلاعات داشبورد')
      }
      return res.json()
    },
    enabled: !!branchId,
  })

  // Handle product group click -> navigate to target allocation
  const handleProductGroupClick = (productGroupId: string) => {
    setSelectedProductGroupId(productGroupId)
    setActiveTab('target-allocation')
  }

  // Empty state
  if (!branchId) {
    return <EmptyState />
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-6">
          <BarChart3 className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">خطا در بارگذاری اطلاعات</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {error?.message || 'لطفاً دوباره تلاش کنید.'}
        </p>
      </div>
    )
  }

  const kpis = data?.kpis
  const productGroups = data?.productGroupBreakdown ?? []
  const salesLineData = data?.salesLineData ?? []

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <KpiCardsSkeleton />
      ) : kpis ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="مجموع تارگت"
            value={`${formatNumber(kpis.totalTarget)} کارتنی`}
            subtitle={`${formatNumber(kpis.confirmedTargets)} از ${formatNumber(kpis.totalTargets)} تارگت تأییدشده`}
            icon={Target}
            iconBg="bg-teal-600"
          />
          <KpiCard
            title="تارگت تخصیص‌یافته"
            value={`${formatNumber(kpis.totalAllocated)} کارتنی`}
            subtitle={`نرخ تخصیص: ${formatPercent(kpis.allocationRate)}`}
            icon={TrendingUp}
            iconBg="bg-emerald-600"
            trend={
              kpis.allocationRate >= 70
                ? { value: formatPercent(kpis.allocationRate), positive: true }
                : { value: 'نیاز به تخصیص بیشتر', positive: false }
            }
          />
          <KpiCard
            title="نرخ تحقق"
            value={formatPercent(kpis.achievementRate)}
            subtitle={`${formatNumber(kpis.totalActualSales)} کارتنی فروش واقعی`}
            icon={BarChart3}
            iconBg="bg-cyan-600"
          />
          <KpiCard
            title="درخواست‌های در انتظار"
            value={formatNumber(kpis.pendingRequests)}
            subtitle={`${formatNumber(kpis.salesmenCount)} فروشنده فعال`}
            icon={Clock}
            iconBg="bg-amber-600"
          />
        </div>
      ) : null}

      {/* ─── Achievement Rate Highlight ──────────────────────────────────── */}
      {!isLoading && kpis && (
        <div
          className={`rounded-xl border p-4 flex items-center gap-4 ${getAchievementBgClass(
            kpis.achievementRate
          )}`}
        >
          <BarChart3
            className={`h-8 w-8 shrink-0 ${getAchievementColorClass(kpis.achievementRate)}`}
          />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              وضعیت تحقق فروش دوره قبل
            </p>
            <p
              className={`text-xl font-bold ${getAchievementColorClass(
                kpis.achievementRate
              )}`}
            >
              {formatPercent(kpis.achievementRate)}
              {kpis.achievementRate >= 80 && ' — مطلوب'}
              {kpis.achievementRate >= 60 && kpis.achievementRate < 80 && ' — نیاز به بهبود'}
              {kpis.achievementRate < 60 && ' — هشدار'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Sales Line Chart ───────────────────────────────────────────── */}
      {isLoading ? (
        <ChartSkeleton />
      ) : salesLineData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">مقایسه خط فروش</CardTitle>
            <CardDescription>
              تارگت کل در مقابل تارگت تخصیص‌یافته به تفکیک خط فروش
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 sm:h-72 w-full">
              <BarChart
                data={salesLineData}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => v.toLocaleString('fa-IR')}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="salesLine"
                  width={70}
                  fontSize={13}
                  tickLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        const num = Number(value)
                        return (
                          <span className="font-mono font-medium">
                            {num.toLocaleString('fa-IR')} کارتنی
                          </span>
                        )
                      }}
                    />
                  }
                />
                <ChartLegend
                  content={<ChartLegendContent />}
                />
                <Bar
                  dataKey="totalTarget"
                  fill="var(--color-totalTarget)"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="allocatedTarget"
                  fill="var(--color-allocatedTarget)"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Product Group Breakdown ────────────────────────────────────── */}
      {isLoading ? (
        <ProductGroupSkeleton />
      ) : productGroups.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">گروه‌های محصولی</h2>
            <p className="text-sm text-muted-foreground">
              {formatNumber(productGroups.length)} گروه
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productGroups.map((group) => (
              <ProductGroupCard
                key={group.id}
                group={group}
                onClick={() => handleProductGroupClick(group.id)}
              />
            ))}
          </div>
        </div>
      ) : !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              گروه محصولی برای این شعبه یافت نشد
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
