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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Timer,
} from 'lucide-react'
import { formatJalaliFull, formatJalaliShort, toPersianDigits } from '@/lib/jalali'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  deadlineDate: string
  status: string
  createdAt: string
  updatedAt: string
  _count: { targets: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = formatJalaliFull

const getDaysRemaining = (deadlineStr: string): number => {
  const now = new Date()
  const deadline = new Date(deadlineStr)
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getStatusConfig = (status: string): { label: string; className: string; icon: React.ElementType } => {
  switch (status) {
    case 'active':
      return { label: 'فعال', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100', icon: CheckCircle2 }
    case 'closed':
      return { label: 'بسته شده', className: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-100', icon: Lock }
    case 'auto_allocated':
      return { label: 'تخصیص خودکار', className: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100', icon: AlertTriangle }
    default:
      return { label: status, className: '', icon: Calendar }
  }
}

const formatNumber = (num: number): string => num.toLocaleString('fa-IR')

// ─── Period Card ─────────────────────────────────────────────────────────────

function PeriodCard({ period }: { period: Period }) {
  const statusConfig = getStatusConfig(period.status)
  const StatusIcon = statusConfig.icon
  const daysRemaining = getDaysRemaining(period.deadlineDate)
  const isActive = period.status === 'active'
  const deadlineProgress = isActive
    ? Math.max(0, Math.min(100, ((6 - daysRemaining) / 6) * 100)) // Assuming ~6 day allocation window
    : 100

  return (
    <Card className={`transition-all duration-200 ${
      isActive ? 'ring-1 ring-emerald-300 shadow-md' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isActive ? 'bg-emerald-100' : 'bg-slate-100'
            }`}>
              <Calendar className={`h-5 w-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
            </div>
            <div>
              <CardTitle className="text-base">{period.name}</CardTitle>
              <CardDescription className="text-xs">
                {formatDate(period.startDate)} تا {formatDate(period.endDate)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-[11px] ${statusConfig.className}`}>
            <StatusIcon className="h-3 w-3 ml-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deadline Info */}
        {isActive && (
          <div className={`p-3 rounded-lg border ${
            daysRemaining <= 1
              ? 'bg-red-50 border-red-200'
              : daysRemaining <= 3
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className={`h-4 w-4 ${
                daysRemaining <= 1 ? 'text-red-600' : daysRemaining <= 3 ? 'text-amber-600' : 'text-emerald-600'
              }`} />
              <span className={`text-sm font-medium ${
                daysRemaining <= 1 ? 'text-red-800' : daysRemaining <= 3 ? 'text-amber-800' : 'text-emerald-800'
              }`}>
                مهلت تخصیص تارگت
              </span>
            </div>
            <p className={`text-lg font-bold ${
              daysRemaining <= 1 ? 'text-red-700' : daysRemaining <= 3 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {daysRemaining > 0
                ? `${formatNumber(daysRemaining)} روز مانده`
                : daysRemaining === 0
                  ? 'آخرین روز!'
                  : 'مهلت گذشته'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              مهلت: {formatDate(period.deadlineDate)}
            </p>
            <Progress
              value={deadlineProgress}
              className={`h-1.5 mt-2 ${
                daysRemaining <= 1
                  ? '[&>div]:bg-red-500'
                  : daysRemaining <= 3
                    ? '[&>div]:bg-amber-500'
                    : '[&>div]:bg-emerald-500'
              }`}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">تعداد تارگت‌ها</p>
            <p className="text-sm font-bold">{formatNumber(period._count.targets)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">وضعیت</p>
            <p className="text-sm font-bold">
              {isActive ? 'باز برای تخصیص' : 'بسته شده'}
            </p>
          </div>
        </div>

        {/* Auto-allocation warning */}
        {isActive && daysRemaining <= 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>مهلت تخصیص گذشته است. تارگت‌های تخصیص‌نیافته به صورت خودکار تخصیص خواهند یافت.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PeriodsSection() {
  const { data: periods = [], isLoading } = useQuery<Period[]>({
    queryKey: ['periods'],
    queryFn: async () => {
      const res = await fetch('/api/periods')
      if (!res.ok) throw new Error('خطا در دریافت دوره‌ها')
      return res.json()
    },
  })

  const activePeriods = periods.filter((p) => p.status === 'active')
  const closedPeriods = periods.filter((p) => p.status !== 'active')

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ─── Info Banner ────────────────────────────────────────────────── */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 mb-1">
                زمان‌بندی تخصیص تارگت
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                برای هر دوره زمانی، بازه مشخصی جهت ثبت و تأیید تارگت‌ها تعریف شده است. مدیران شعب موظفند در این بازه زمانی نسبت به بررسی، اصلاح و نهایی‌سازی تارگت‌های فروشندگان خود اقدام نمایند. در صورت عدم اقدام در مهلت تعیین‌شده، سامانه به صورت خودکار فرآیند تخصیص تارگت را بر اساس اطلاعات تاریخی فروش انجام خواهد داد.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Active Periods ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          دوره‌های فعال
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activePeriods.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activePeriods.map((period) => (
              <PeriodCard key={period.id} period={period} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">دوره فعالی یافت نشد</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Closed Periods ─────────────────────────────────────────────── */}
      {closedPeriods.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-slate-500" />
            دوره‌های بسته شده
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {closedPeriods.map((period) => (
              <PeriodCard key={period.id} period={period} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Period History Table ────────────────────────────────────────── */}
      {periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">جدول دوره‌ها</CardTitle>
            <CardDescription>لیست کامل دوره‌های زمانی سیستم</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">نام دوره</TableHead>
                  <TableHead className="text-center font-semibold">تاریخ شروع</TableHead>
                  <TableHead className="text-center font-semibold">تاریخ پایان</TableHead>
                  <TableHead className="text-center font-semibold">مهلت تخصیص</TableHead>
                  <TableHead className="text-center font-semibold">تعداد تارگت</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => {
                  const statusConfig = getStatusConfig(period.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.name}</TableCell>
                      <TableCell className="text-center text-sm">{formatDate(period.startDate)}</TableCell>
                      <TableCell className="text-center text-sm">{formatDate(period.endDate)}</TableCell>
                      <TableCell className="text-center text-sm">{formatDate(period.deadlineDate)}</TableCell>
                      <TableCell className="text-center text-sm">{formatNumber(period._count.targets)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[11px] ${statusConfig.className}`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
