'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Lucide icons
import { Shield, Users, Building2, Package, Target, FileQuestion, Plus, Pencil, Trash2, CheckCircle2, XCircle, Eye, BarChart3, TrendingUp, Clock, AlertTriangle, UserCog, Calendar, Settings2, ScrollText, Search, KeyRound, Loader2 } from 'lucide-react'
// Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
// Hooks
import { useToast } from '@/hooks/use-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatNumber = (num: number): string => num.toLocaleString('fa-IR')
const formatPercent = (num: number): string => `٪${num.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}`

const formatPersianDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const formatPersianDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getRoleConfig = (role: string): { label: string; className: string } => {
  switch (role) {
    case 'admin': return { label: 'مدیر سیستم', className: 'bg-red-100 text-red-800 border-red-300' }
    case 'planning': return { label: 'برنامه‌ریز فروش', className: 'bg-violet-100 text-violet-800 border-violet-300' }
    case 'branch_manager': return { label: 'مدیر شعبه', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    default: return { label: role, className: '' }
  }
}

const getStatusConfig = (status: string): { label: string; className: string } => {
  switch (status) {
    case 'pending': return { label: 'در انتظار', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    case 'partially_allocated': return { label: 'تخصیص جزئی', className: 'bg-orange-100 text-orange-800 border-orange-300' }
    case 'allocated': return { label: 'تخصیص‌یافته', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    case 'finalized': return { label: 'نهایی‌شده', className: 'bg-green-200 text-green-900 border-green-400' }
    case 'in_review': return { label: 'در حال بررسی', className: 'bg-blue-100 text-blue-800 border-blue-300' }
    case 'approved': return { label: 'تأیید شده', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    case 'rejected': return { label: 'رد شده', className: 'bg-red-100 text-red-800 border-red-300' }
    default: return { label: status, className: '' }
  }
}

const getPeriodStatusConfig = (status: string): { label: string; className: string } => {
  switch (status) {
    case 'active': return { label: 'فعال', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    case 'closed': return { label: 'بسته شده', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    case 'auto_allocated': return { label: 'تخصیص خودکار', className: 'bg-blue-100 text-blue-800 border-blue-300' }
    default: return { label: status, className: '' }
  }
}

const getPriorityConfig = (priority: string): { label: string; className: string } => {
  switch (priority) {
    case 'urgent': return { label: 'فوری', className: 'bg-red-100 text-red-800 border-red-300' }
    case 'high': return { label: 'بالا', className: 'bg-orange-100 text-orange-800 border-orange-300' }
    case 'normal': return { label: 'عادی', className: 'bg-slate-100 text-slate-800 border-slate-300' }
    case 'low': return { label: 'پایین', className: 'bg-gray-100 text-gray-800 border-gray-300' }
    default: return { label: priority, className: '' }
  }
}

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'correction': return 'اصلاحی'
    case 'additional': return 'اضافی'
    case 'transfer': return 'انتقال'
    case 'other': return 'سایر'
    default: return type
  }
}

const ACTION_LABELS: Record<string, string> = {
  create: 'ایجاد',
  update: 'بروزرسانی',
  delete: 'حذف',
  login: 'ورود',
  approve: 'تأیید',
  reject: 'رد',
  bulk_create: 'ایجاد انبوه',
}

const ENTITY_LABELS: Record<string, string> = {
  user: 'کاربر',
  branch: 'شعبه',
  product_group: 'گروه کالایی',
  target: 'تارگت',
  salesman: 'فروشنده',
  period: 'دوره',
  ad_hoc_request: 'درخواست موردی',
  settings: 'تنظیمات',
}

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const EMPTY_STATE = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </CardContent>
  </Card>
)

// ─── Admin Dashboard Sub-tab (Enhanced) ──────────────────────────────────────

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-recent'],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-logs?take=5')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const ov = data?.overview
  const bs = data?.branchStats ?? []
  const recentLogs = auditData?.logs ?? []

  // Chart data for branch comparison
  const barChartData = bs.slice(0, 8).map((b: any) => ({
    name: b.name.length > 10 ? b.name.substring(0, 10) + '...' : b.name,
    تارگت: b.totalTarget,
    تخصیص: b.totalAllocated,
  }))

  // Pie chart data for target status
  const pieChartData = [
    { name: 'در انتظار', value: ov?.targetStats.pendingTargets ?? 0, color: '#f59e0b' },
    { name: 'تخصیص جزئی', value: ov?.targetStats.partiallyAllocated ?? 0, color: '#f97316' },
    { name: 'تخصیص‌یافته', value: ov?.targetStats.allocatedTargets ?? 0, color: '#10b981' },
    { name: 'نهایی‌شده', value: ov?.targetStats.finalizedTargets ?? 0, color: '#059669' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">شعب فعال</p>
                <p className="text-xl font-bold">{formatNumber(ov?.totalBranches ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">فروشندگان</p>
                <p className="text-xl font-bold">{formatNumber(ov?.totalSalesmen ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مجموع تارگت</p>
                <p className="text-xl font-bold">{formatNumber(ov?.targetStats.totalTargetValue ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">درخواست‌های در انتظار</p>
                <p className="text-xl font-bold">{formatNumber(ov?.pendingRequests ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">درخواست در انتظار</p>
                <p className="text-xl font-bold text-yellow-700">{formatNumber(ov?.pendingRequests ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">در حال بررسی</p>
                <p className="text-xl font-bold text-blue-700">{formatNumber(data?.overview?.inReviewRequests ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تأیید شده</p>
                <p className="text-xl font-bold text-emerald-700">{formatNumber(ov?.approvedRequests ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">رد شده</p>
                <p className="text-xl font-bold text-red-700">{formatNumber(ov?.rejectedRequests ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">وضعیت تارگت‌ها (دوره جاری)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-lg font-bold">{formatNumber(ov?.targetStats.totalTargets ?? 0)}</p>
              <p className="text-xs text-muted-foreground">کل تارگت‌ها</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50">
              <p className="text-lg font-bold text-yellow-700">{formatNumber(ov?.targetStats.pendingTargets ?? 0)}</p>
              <p className="text-xs text-muted-foreground">در انتظار</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50">
              <p className="text-lg font-bold text-orange-700">{formatNumber(ov?.targetStats.partiallyAllocated ?? 0)}</p>
              <p className="text-xs text-muted-foreground">تخصیص جزئی</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-lg font-bold text-emerald-700">{formatNumber(ov?.targetStats.allocatedTargets ?? 0)}</p>
              <p className="text-xs text-muted-foreground">تخصیص‌یافته</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <p className="text-lg font-bold text-green-700">{formatNumber(ov?.targetStats.finalizedTargets ?? 0)}</p>
              <p className="text-xs text-muted-foreground">نهایی‌شده</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">نرخ تخصیص کل</span>
              <span className="font-semibold">{formatPercent(ov?.targetStats.totalTargetValue ? (ov.targetStats.totalAllocatedValue / ov.targetStats.totalTargetValue) * 100 : 0)}</span>
            </div>
            <Progress value={ov?.targetStats.totalTargetValue ? (ov.targetStats.totalAllocatedValue / ov.targetStats.totalTargetValue) * 100 : 0} className="h-3 [&>div]:bg-emerald-500" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Branch Target vs Allocated */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مقایسه تارگت و تخصیص شعب</CardTitle>
            <CardDescription>تارگت کل در مقابل تخصیص‌یافته</CardDescription>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="تارگت" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="تخصیص" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">داده‌ای موجود نیست</div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Target Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزیع وضعیت تارگت‌ها</CardTitle>
            <CardDescription>نسبت تارگت‌ها بر اساس وضعیت</CardDescription>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}٪)`}
                  >
                    {pieChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">داده‌ای موجود نیست</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">عملکرد شعب</CardTitle>
          <CardDescription>مقایسه تارگت و تخصیص در سطح شعب</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">شعبه</TableHead>
                <TableHead className="text-center font-semibold">فروشندگان</TableHead>
                <TableHead className="text-center font-semibold">تارگت کل</TableHead>
                <TableHead className="text-center font-semibold">تخصیص‌یافته</TableHead>
                <TableHead className="text-center font-semibold">نرخ تخصیص</TableHead>
                <TableHead className="text-center font-semibold">تکمیل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bs.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{b.code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{formatNumber(b.salesmenCount)}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{formatNumber(b.totalTarget)}</TableCell>
                  <TableCell className="text-center text-sm">{formatNumber(b.totalAllocated)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-[11px] ${
                      b.allocationRate >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      b.allocationRate >= 50 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {formatPercent(b.allocationRate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {formatNumber(b.finalizedCount)}/{formatNumber(b.targetCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">فعالیت‌های اخیر</CardTitle>
          <CardDescription>۵ فعالیت آخر سیستم</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">زمان</TableHead>
                  <TableHead className="text-center font-semibold">کاربر</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                  <TableHead className="text-center font-semibold">موجودیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatPersianDate(log.createdAt)}</TableCell>
                    <TableCell className="text-center text-sm">{log.user?.name || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[log.action] || log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{ENTITY_LABELS[log.entity] || log.entity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">فعالیتی ثبت نشده</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Users Management Sub-tab (Enhanced) ─────────────────────────────────────

function UsersManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'branch_manager', branchId: '', password: '' })
  const [resetPwDialogOpen, setResetPwDialogOpen] = useState(false)
  const [resetPwUserId, setResetPwUserId] = useState<string>('')
  const [resetPwValue, setResetPwValue] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-all'],
    queryFn: async () => {
      const res = await fetch('/api/branches')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      const body = editingUser
        ? { id: editingUser.id, name: form.name, email: form.email, role: form.role, branchId: form.branchId || null, password: form.password || undefined }
        : { name: form.name, email: form.email, role: form.role, branchId: form.branchId || null, password: form.password || '123456' }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'خطا')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({ title: editingUser ? 'کاربر بروزرسانی شد' : 'کاربر جدید ایجاد شد' })
      setDialogOpen(false)
      setEditingUser(null)
      setForm({ name: '', email: '', role: 'branch_manager', branchId: '', password: '' })
    },
    onError: (error: Error) => {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('خطا در حذف')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({ title: 'کاربر حذف شد' })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })
      if (!res.ok) throw new Error('خطا')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const resetPwMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetPwUserId, password: resetPwValue }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'خطا')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({ title: 'رمز عبور بروزرسانی شد' })
      setResetPwDialogOpen(false)
      setResetPwUserId('')
      setResetPwValue('')
    },
    onError: (error: Error) => {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' })
    },
  })

  const openEdit = (user: any) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId || '',
      password: '',
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingUser(null)
    setForm({ name: '', email: '', role: 'branch_manager', branchId: '', password: '' })
    setDialogOpen(true)
  }

  const openResetPw = (userId: string) => {
    setResetPwUserId(userId)
    setResetPwValue('')
    setResetPwDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{formatNumber(users.length)} کاربر</p>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          افزودن کاربر
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</DialogTitle>
            <DialogDescription>{editingUser ? 'اطلاعات کاربر را ویرایش کنید' : 'اطلاعات کاربر جدید را وارد کنید'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="نام و نام خانوادگی" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ایمیل</label>
              <Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">رمز عبور</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder={editingUser ? 'خالی بگذارید اگر تغییر نمی‌کند' : '123456'}
                dir="ltr"
              />
              {editingUser && <p className="text-[11px] text-muted-foreground">خالی بگذارید اگر تغییر نمی‌کند</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نقش</label>
              <Select dir="rtl" value={form.role} onValueChange={(val) => setForm(p => ({ ...p, role: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدیر سیستم</SelectItem>
                  <SelectItem value="planning">برنامه‌ریز فروش</SelectItem>
                  <SelectItem value="branch_manager">مدیر شعبه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'branch_manager' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">شعبه</label>
                <Select dir="rtl" value={form.branchId} onValueChange={(val) => setForm(p => ({ ...p, branchId: val }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveMutation.mutate()} disabled={!form.name || !form.email || saveMutation.isPending}>
              {saveMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwDialogOpen} onOpenChange={setResetPwDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>بازنشانی رمز عبور</DialogTitle>
            <DialogDescription>رمز عبور جدید را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">رمز عبور جدید</label>
              <Input
                type="password"
                value={resetPwValue}
                onChange={(e) => setResetPwValue(e.target.value)}
                placeholder="رمز عبور جدید"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => resetPwMutation.mutate()} disabled={!resetPwValue || resetPwMutation.isPending}>
              {resetPwMutation.isPending ? 'در حال ذخیره...' : 'تغییر رمز'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">نام</TableHead>
                  <TableHead className="text-center font-semibold">ایمیل</TableHead>
                  <TableHead className="text-center font-semibold">نقش</TableHead>
                  <TableHead className="text-center font-semibold">شعبه</TableHead>
                  <TableHead className="text-center font-semibold">آخرین ورود</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => {
                  const roleConfig = getRoleConfig(user.role)
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.name}</TableCell>
                      <TableCell className="text-center text-xs font-mono">{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[11px] ${roleConfig.className}`}>{roleConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{user.branch?.name || '—'}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{formatPersianDate(user.lastLoginAt)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[11px] cursor-pointer ${user.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                          onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                        >
                          {user.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)} title="ویرایش">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openResetPw(user.id)} title="بازنشانی رمز">
                            <KeyRound className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(user.id)} title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

// ─── Branches Management Sub-tab ─────────────────────────────────────────────

function BranchesManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', region: '' })

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const res = await fetch('/api/admin/branches')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editingBranch ? 'PUT' : 'POST'
      const body = editingBranch ? { id: editingBranch.id, ...form } : form
      const res = await fetch('/api/admin/branches', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] })
      toast({ title: editingBranch ? 'شعبه بروزرسانی شد' : 'شعبه جدید ایجاد شد' })
      setDialogOpen(false); setEditingBranch(null); setForm({ name: '', code: '', region: '' })
    },
    onError: (error: Error) => { toast({ title: 'خطا', description: error.message, variant: 'destructive' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/branches?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('خطا')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-branches'] }); toast({ title: 'شعبه حذف شد' }) },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/branches', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive }) })
      if (!res.ok) throw new Error('خطا')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-branches'] }) },
  })

  const openEdit = (branch: any) => {
    setEditingBranch(branch)
    setForm({ name: branch.name, code: branch.code, region: branch.region || '' })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{formatNumber(branches.length)} شعبه</p>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingBranch(null); setForm({ name: '', code: '', region: '' }); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          افزودن شعبه
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'ویرایش شعبه' : 'افزودن شعبه جدید'}</DialogTitle>
            <DialogDescription>اطلاعات شعبه را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><label className="text-sm font-medium">نام شعبه</label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">کد شعبه</label><Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="BR-XXX-01" dir="ltr" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">منطقه</label><Input value={form.region} onChange={(e) => setForm(p => ({ ...p, region: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveMutation.mutate()} disabled={!form.name || !form.code || saveMutation.isPending}>
              {saveMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : branches.length === 0 ? (
        <EMPTY_STATE icon={Building2} text="شعبه‌ای یافت نشد" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">نام</TableHead>
                  <TableHead className="text-center font-semibold">کد</TableHead>
                  <TableHead className="text-center font-semibold">منطقه</TableHead>
                  <TableHead className="text-center font-semibold">فروشندگان</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-sm">{b.name}</TableCell>
                    <TableCell className="text-center text-xs font-mono">{b.code}</TableCell>
                    <TableCell className="text-center text-sm">{b.region || '—'}</TableCell>
                    <TableCell className="text-center text-sm">{formatNumber(b._count?.salesmen ?? 0)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[11px] cursor-pointer ${b.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                        onClick={() => toggleActiveMutation.mutate({ id: b.id, isActive: !b.isActive })}
                      >
                        {b.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Product Groups Management Sub-tab ───────────────────────────────────────

function ProductGroupsManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', salesLine: 'خوراکی' })

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin-product-groups'],
    queryFn: async () => {
      const res = await fetch('/api/admin/product-groups')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editingGroup ? 'PUT' : 'POST'
      const body = editingGroup ? { id: editingGroup.id, ...form } : form
      const res = await fetch('/api/admin/product-groups', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-groups'] })
      toast({ title: editingGroup ? 'گروه کالایی بروزرسانی شد' : 'گروه کالایی جدید ایجاد شد' })
      setDialogOpen(false); setEditingGroup(null); setForm({ name: '', code: '', salesLine: 'خوراکی' })
    },
    onError: (error: Error) => { toast({ title: 'خطا', description: error.message, variant: 'destructive' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/product-groups?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('خطا')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-product-groups'] }); toast({ title: 'گروه کالایی حذف شد' }) },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/product-groups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive }) })
      if (!res.ok) throw new Error('خطا')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-product-groups'] }) },
  })

  const openEdit = (group: any) => {
    setEditingGroup(group)
    setForm({ name: group.name, code: group.code, salesLine: group.salesLine })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{formatNumber(groups.length)} گروه کالایی</p>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingGroup(null); setForm({ name: '', code: '', salesLine: 'خوراکی' }); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          افزودن گروه کالایی
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'ویرایش گروه کالایی' : 'افزودن گروه کالایی جدید'}</DialogTitle>
            <DialogDescription>اطلاعات گروه کالایی را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><label className="text-sm font-medium">نام گروه</label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">کد گروه</label><Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="PG-XXX" dir="ltr" /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">خط فروش</label>
              <Select dir="rtl" value={form.salesLine} onValueChange={(val) => setForm(p => ({ ...p, salesLine: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="خوراکی">خوراکی</SelectItem>
                  <SelectItem value="بهداشتی">بهداشتی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveMutation.mutate()} disabled={!form.name || !form.code || saveMutation.isPending}>
              {saveMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : groups.length === 0 ? (
        <EMPTY_STATE icon={Package} text="گروه کالایی یافت نشد" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">نام</TableHead>
                  <TableHead className="text-center font-semibold">کد</TableHead>
                  <TableHead className="text-center font-semibold">خط فروش</TableHead>
                  <TableHead className="text-center font-semibold">تارگت‌ها</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium text-sm">{g.name}</TableCell>
                    <TableCell className="text-center text-xs font-mono">{g.code}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[11px]">{g.salesLine}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{formatNumber(g._count?.targets ?? 0)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[11px] cursor-pointer ${g.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                        onClick={() => toggleActiveMutation.mutate({ id: g.id, isActive: !g.isActive })}
                      >
                        {g.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Salesmen Management Sub-tab (NEW) ───────────────────────────────────────

function SalesmenManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSalesman, setEditingSalesman] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', branchId: '', isActive: true })
  const [branchFilter, setBranchFilter] = useState('all')

  const { data: salesmen = [], isLoading } = useQuery({
    queryKey: ['admin-salesmen', branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branchFilter !== 'all') params.set('branchId', branchFilter)
      const res = await fetch(`/api/admin/salesmen?${params.toString()}`)
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const res = await fetch('/api/admin/branches')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editingSalesman ? 'PUT' : 'POST'
      const body = editingSalesman
        ? { id: editingSalesman.id, name: form.name, code: form.code, branchId: form.branchId, isActive: form.isActive }
        : { name: form.name, code: form.code, branchId: form.branchId, isActive: form.isActive }
      const res = await fetch('/api/admin/salesmen', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-salesmen'] })
      toast({ title: editingSalesman ? 'فروشنده بروزرسانی شد' : 'فروشنده جدید ایجاد شد' })
      setDialogOpen(false)
      setEditingSalesman(null)
      setForm({ name: '', code: '', branchId: '', isActive: true })
    },
    onError: (error: Error) => { toast({ title: 'خطا', description: error.message, variant: 'destructive' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/salesmen?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('خطا در حذف')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-salesmen'] })
      toast({ title: 'فروشنده حذف شد' })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/salesmen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })
      if (!res.ok) throw new Error('خطا')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-salesmen'] })
    },
  })

  const openEdit = (salesman: any) => {
    setEditingSalesman(salesman)
    setForm({
      name: salesman.name,
      code: salesman.code,
      branchId: salesman.branchId,
      isActive: salesman.isActive,
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingSalesman(null)
    setForm({ name: '', code: '', branchId: '', isActive: true })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select dir="rtl" value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="فیلتر شعبه" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه شعب</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{formatNumber(salesmen.length)} فروشنده</p>
        </div>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          افزودن فروشنده
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSalesman ? 'ویرایش فروشنده' : 'افزودن فروشنده جدید'}</DialogTitle>
            <DialogDescription>اطلاعات فروشنده را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام فروشنده</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="نام و نام خانوادگی" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">کد فروشنده</label>
              <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="SM-XXX" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">شعبه</label>
              <Select dir="rtl" value={form.branchId} onValueChange={(val) => setForm(p => ({ ...p, branchId: val }))}>
                <SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">وضعیت فعال</label>
              <Badge
                variant="outline"
                className={`text-[11px] cursor-pointer ${form.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              >
                {form.isActive ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveMutation.mutate()} disabled={!form.name || !form.code || !form.branchId || saveMutation.isPending}>
              {saveMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salesmen Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : salesmen.length === 0 ? (
        <EMPTY_STATE icon={UserCog} text="فروشنده‌ای یافت نشد" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">نام</TableHead>
                  <TableHead className="text-center font-semibold">کد</TableHead>
                  <TableHead className="text-center font-semibold">شعبه</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesmen.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{s.name}</TableCell>
                    <TableCell className="text-center text-xs font-mono">{s.code}</TableCell>
                    <TableCell className="text-center text-sm">{s.branch?.name || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[11px] cursor-pointer ${s.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                        onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })}
                      >
                        {s.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} title="ویرایش">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(s.id)} title="حذف">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Periods Management Sub-tab (NEW) ────────────────────────────────────────

function PeriodsManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<any>(null)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', deadlineDate: '', status: 'active' })

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['admin-periods'],
    queryFn: async () => {
      const res = await fetch('/api/admin/periods')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editingPeriod ? 'PUT' : 'POST'
      const body = editingPeriod
        ? { id: editingPeriod.id, name: form.name, startDate: form.startDate, endDate: form.endDate, deadlineDate: form.deadlineDate, status: form.status }
        : { name: form.name, startDate: form.startDate, endDate: form.endDate, deadlineDate: form.deadlineDate, status: form.status }
      const res = await fetch('/api/admin/periods', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] })
      toast({ title: editingPeriod ? 'دوره بروزرسانی شد' : 'دوره جدید ایجاد شد' })
      setDialogOpen(false)
      setEditingPeriod(null)
      setForm({ name: '', startDate: '', endDate: '', deadlineDate: '', status: 'active' })
    },
    onError: (error: Error) => { toast({ title: 'خطا', description: error.message, variant: 'destructive' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/periods?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('خطا در حذف')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] })
      toast({ title: 'دوره حذف شد' })
    },
  })

  const openEdit = (period: any) => {
    setEditingPeriod(period)
    setForm({
      name: period.name,
      startDate: period.startDate ? new Date(period.startDate).toISOString().split('T')[0] : '',
      endDate: period.endDate ? new Date(period.endDate).toISOString().split('T')[0] : '',
      deadlineDate: period.deadlineDate ? new Date(period.deadlineDate).toISOString().split('T')[0] : '',
      status: period.status,
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingPeriod(null)
    setForm({ name: '', startDate: '', endDate: '', deadlineDate: '', status: 'active' })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{formatNumber(periods.length)} دوره</p>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          افزودن دوره
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingPeriod ? 'ویرایش دوره' : 'افزودن دوره جدید'}</DialogTitle>
            <DialogDescription>اطلاعات دوره را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام دوره</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: فروردین ۱۴۰۴" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">تاریخ شروع</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">تاریخ پایان</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">مهلت تخصیص</label>
              <Input type="date" value={form.deadlineDate} onChange={(e) => setForm(p => ({ ...p, deadlineDate: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">وضعیت</label>
              <Select dir="rtl" value={form.status} onValueChange={(val) => setForm(p => ({ ...p, status: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="closed">بسته شده</SelectItem>
                  <SelectItem value="auto_allocated">تخصیص خودکار</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveMutation.mutate()} disabled={!form.name || !form.startDate || !form.endDate || !form.deadlineDate || saveMutation.isPending}>
              {saveMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Periods Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : periods.length === 0 ? (
        <EMPTY_STATE icon={Calendar} text="دوره‌ای یافت نشد" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">نام</TableHead>
                  <TableHead className="text-center font-semibold">شروع</TableHead>
                  <TableHead className="text-center font-semibold">پایان</TableHead>
                  <TableHead className="text-center font-semibold">مهلت</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                  <TableHead className="text-center font-semibold">تارگت‌ها</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((p: any) => {
                  const statusConfig = getPeriodStatusConfig(p.status)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-center text-xs">{formatPersianDateShort(p.startDate)}</TableCell>
                      <TableCell className="text-center text-xs">{formatPersianDateShort(p.endDate)}</TableCell>
                      <TableCell className="text-center text-xs">{formatPersianDateShort(p.deadlineDate)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[11px] ${statusConfig.className}`}>{statusConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{formatNumber(p._count?.targets ?? 0)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="ویرایش">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(p.id)} title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

// ─── Bulk Target Management Sub-tab ──────────────────────────────────────────

function BulkTargetManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: periods = [] } = useQuery({
    queryKey: ['periods-all'],
    queryFn: async () => { const res = await fetch('/api/periods'); if (!res.ok) throw new Error(); return res.json() },
  })

  const { data: productGroups = [] } = useQuery({
    queryKey: ['admin-product-groups'],
    queryFn: async () => { const res = await fetch('/api/admin/product-groups'); if (!res.ok) throw new Error(); return res.json() },
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => { const res = await fetch('/api/admin/branches'); if (!res.ok) throw new Error(); return res.json() },
  })

  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [targetValues, setTargetValues] = useState<Record<string, string>>({})

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const targets = Object.entries(targetValues)
        .filter(([, val]) => val && Number(val) > 0)
        .map(([branchId, val]) => ({ branchId, totalTarget: Number(val) }))

      if (!selectedPeriod || !selectedGroup || targets.length === 0) {
        throw new Error('دوره، گروه کالایی و مقادیر تارگت الزامی است')
      }

      const res = await fetch('/api/admin/targets-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodId: selectedPeriod, productGroupId: selectedGroup, targets }),
      })

      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['targets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast({ title: 'تارگت‌ها ثبت شد', description: data.message })
      setTargetValues({})
    },
    onError: (error: Error) => {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 mb-1">تخصیص تارگت انبوه</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                از این بخش می‌توانید تارگت دوره‌ای را برای تمام شعب به صورت یکجا تعیین کنید. مقادیر وارد شده به عنوان تارگت پیشنهادی واحد برنامه‌ریزی برای هر شعبه ثبت خواهد شد.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">دوره</label>
          <Select dir="rtl" value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger><SelectValue placeholder="انتخاب دوره" /></SelectTrigger>
            <SelectContent>
              {periods.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">گروه کالایی</label>
          <Select dir="rtl" value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger><SelectValue placeholder="انتخاب گروه کالایی" /></SelectTrigger>
            <SelectContent>
              {productGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name} ({g.salesLine})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPeriod && selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تعیین تارگت شعب</CardTitle>
            <CardDescription>مقدار تارگت کارتنی را برای هر شعبه وارد کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {branches.filter((b: any) => b.isActive).map((b: any) => (
              <div key={b.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{b.code} · {b.region || '—'}</p>
                </div>
                <div className="w-40">
                  <Input
                    type="number"
                    min={0}
                    placeholder="تارگت کارتنی"
                    value={targetValues[b.id] || ''}
                    onChange={(e) => setTargetValues(prev => ({ ...prev, [b.id]: e.target.value }))}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {formatNumber(Object.values(targetValues).filter(v => v && Number(v) > 0).length)} شعبه تارگت‌دهی شده
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 min-w-[180px]"
                onClick={() => bulkMutation.mutate()}
                disabled={bulkMutation.isPending}
              >
                {bulkMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ثبت...
                  </span>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    ثبت تارگت انبوه
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Request Review Sub-tab (Enhanced) ───────────────────────────────────────

function RequestReview() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')
  const [reviewRequestId, setReviewRequestId] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-requests', statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`/api/ad-hoc-requests?${params.toString()}`)
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: string; reviewNote?: string }) => {
      const res = await fetch('/api/ad-hoc-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reviewedBy: 'مدیر سیستم', reviewNote }),
      })
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      toast({ title: 'درخواست بروزرسانی شد' })
      setReviewDialogOpen(false)
      setReviewNote('')
      setReviewRequestId('')
    },
  })

  const openDetail = (req: any) => {
    setSelectedRequest(req)
    setDetailDialogOpen(true)
  }

  const openReview = (id: string, action: 'approved' | 'rejected') => {
    setReviewRequestId(id)
    setReviewAction(action)
    setReviewNote('')
    setReviewDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select dir="rtl" value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">در انتظار بررسی</SelectItem>
              <SelectItem value="in_review">در حال بررسی</SelectItem>
              <SelectItem value="approved">تأیید شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
              <SelectItem value="all">همه</SelectItem>
            </SelectContent>
          </Select>
          <Select dir="rtl" value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه انواع</SelectItem>
              <SelectItem value="correction">اصلاحی</SelectItem>
              <SelectItem value="additional">اضافی</SelectItem>
              <SelectItem value="transfer">انتقال</SelectItem>
              <SelectItem value="other">سایر</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{formatNumber(requests.length)} درخواست</p>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات درخواست</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{selectedRequest.title}</h3>
                <Badge variant="outline" className={`text-[10px] ${getStatusConfig(selectedRequest.status).className}`}>
                  {getStatusConfig(selectedRequest.status).label}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${getPriorityConfig(selectedRequest.priority).className}`}>
                  {getPriorityConfig(selectedRequest.priority).label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{getTypeLabel(selectedRequest.type)}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-muted-foreground">شعبه:</span> {selectedRequest.branch?.name || '—'}</p>
                <p><span className="font-medium text-muted-foreground">ثبت‌کننده:</span> {selectedRequest.createdBy}</p>
                <p><span className="font-medium text-muted-foreground">تاریخ ثبت:</span> {formatPersianDate(selectedRequest.createdAt)}</p>
                {selectedRequest.reviewedBy && (
                  <p><span className="font-medium text-muted-foreground">بررسی‌کننده:</span> {selectedRequest.reviewedBy}</p>
                )}
                {selectedRequest.reviewedAt && (
                  <p><span className="font-medium text-muted-foreground">تاریخ بررسی:</span> {formatPersianDate(selectedRequest.reviewedAt)}</p>
                )}
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">توضیحات:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
              {selectedRequest.reviewNote && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">یادداشت بررسی:</p>
                  <p className="text-sm text-amber-800">{selectedRequest.reviewNote}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>بستن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approved' ? 'تأیید درخواست' : 'رد درخواست'}</DialogTitle>
            <DialogDescription>
              {reviewAction === 'approved' ? 'آیا از تأیید این درخواست اطمینان دارید؟' : 'آیا از رد این درخواست اطمینان دارید؟'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">یادداشت بررسی</label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="توضیحاتی درباره تصمیم خود بنویسید..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>انصراف</Button>
            <Button
              className={reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              onClick={() => reviewMutation.mutate({ id: reviewRequestId, status: reviewAction, reviewNote })}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? 'در حال پردازش...' : reviewAction === 'approved' ? 'تأیید' : 'رد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const statusConfig = getStatusConfig(req.status)
            const priorityConfig = getPriorityConfig(req.priority)

            return (
              <Card key={req.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm">{req.title}</h4>
                        <Badge variant="outline" className={`text-[10px] ${statusConfig.className}`}>{statusConfig.label}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${priorityConfig.className}`}>{priorityConfig.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{getTypeLabel(req.type)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{req.branch?.name}</span>
                        <span>ثبت: {req.createdBy}</span>
                      </div>
                      {req.reviewNote && (
                        <p className="text-xs p-2 bg-muted rounded">یادداشت: {req.reviewNote}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(req)} title="مشاهده جزئیات">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(req.status === 'pending' || req.status === 'in_review') && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            onClick={() => openReview(req.id, 'approved')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            تأیید
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 gap-1"
                            onClick={() => openReview(req.id, 'rejected')}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            رد
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EMPTY_STATE icon={FileQuestion} text="درخواستی یافت نشد" />
      )}
    </div>
  )
}

// ─── Audit Log Sub-tab (NEW) ─────────────────────────────────────────────────

function AuditLog() {
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [skip, setSkip] = useState(0)
  const take = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', actionFilter, entityFilter, skip],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('skip', skip.toString())
      params.set('take', take.toString())
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (entityFilter !== 'all') params.set('entity', entityFilter)
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const hasMore = skip + take < total

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select dir="rtl" value={actionFilter} onValueChange={(val) => { setActionFilter(val); setSkip(0) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="نوع عملیات" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه عملیات</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select dir="rtl" value={entityFilter} onValueChange={(val) => { setEntityFilter(val); setSkip(0) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="نوع موجودیت" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه موجودیت‌ها</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{formatNumber(total)} رکورد</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : logs.length === 0 ? (
        <EMPTY_STATE icon={ScrollText} text="لاگ فعالیتی یافت نشد" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-semibold">زمان</TableHead>
                    <TableHead className="text-center font-semibold">کاربر</TableHead>
                    <TableHead className="text-center font-semibold">عملیات</TableHead>
                    <TableHead className="text-center font-semibold">موجودیت</TableHead>
                    <TableHead className="text-right font-semibold">جزئیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatPersianDate(log.createdAt)}</TableCell>
                      <TableCell className="text-center text-sm">
                        <div>
                          <p className="font-medium">{log.user?.name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{log.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] ${
                          log.action === 'create' || log.action === 'bulk_create' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          log.action === 'update' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          log.action === 'delete' ? 'bg-red-100 text-red-800 border-red-300' :
                          log.action === 'login' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                          log.action === 'approve' ? 'bg-green-100 text-green-800 border-green-300' :
                          log.action === 'reject' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                          ''
                        }`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{ENTITY_LABELS[log.entity] || log.entity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.details || ''}>
                        {log.details ? (
                          (() => {
                            try {
                              const parsed = JSON.parse(log.details)
                              return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' | ')
                            } catch {
                              return log.details
                            }
                          })()
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setSkip(prev => prev + take)}
                className="gap-2"
              >
                <ScrollText className="h-4 w-4" />
                نمایش بیشتر ({formatNumber(total - skip - take)} مورد باقیمانده)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Settings Sub-tab (NEW) ──────────────────────────────────────────────────

function SettingsManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<any>(null)
  const [editValue, setEditValue] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ key: '', value: '', label: '' })

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: editingSetting.key, value: editValue }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast({ title: 'تنظیمات بروزرسانی شد' })
      setEditDialogOpen(false)
    },
    onError: (error: Error) => { toast({ title: 'خطا', description: error.message, variant: 'destructive' }) },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'خطا') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast({ title: 'تنظیمات جدید ایجاد شد' })
      setCreateDialogOpen(false)
      setCreateForm({ key: '', value: '', label: '' })
    },
    onError: (error: Error) => { toast({ title: 'خطا', description: error.message, variant: 'destructive' }) },
  })

  const openEdit = (setting: any) => {
    setEditingSetting(setting)
    setEditValue(setting.value)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{formatNumber(settings.length)} تنظیم</p>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          افزودن تنظیم
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش تنظیمات</DialogTitle>
            <DialogDescription>{editingSetting?.label || editingSetting?.key}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">مقدار</label>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} dir={/^[a-z_]/.test(editValue) ? 'ltr' : 'rtl'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن تنظیم جدید</DialogTitle>
            <DialogDescription>تنظیمات جدید سیستم را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">کلید</label>
              <Input value={createForm.key} onChange={(e) => setCreateForm(p => ({ ...p, key: e.target.value }))} placeholder="system_name" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">برچسب</label>
              <Input value={createForm.label} onChange={(e) => setCreateForm(p => ({ ...p, label: e.target.value }))} placeholder="نام سیستم" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">مقدار</label>
              <Input value={createForm.value} onChange={(e) => setCreateForm(p => ({ ...p, value: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>انصراف</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => createMutation.mutate()} disabled={!createForm.key || !createForm.value || !createForm.label || createMutation.isPending}>
              {createMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : settings.length === 0 ? (
        <EMPTY_STATE icon={Settings2} text="تنظیماتی یافت نشد" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.map((setting: any) => (
            <Card key={setting.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm font-semibold truncate">{setting.label || setting.key}</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mb-2">{setting.key}</p>
                    <div className="bg-muted px-3 py-2 rounded-md">
                      <p className="text-sm font-medium truncate">{setting.value}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      آخرین بروزرسانی: {formatPersianDate(setting.updatedAt)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(setting)} title="ویرایش">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminPanel() {
  return (
    <Tabs defaultValue="overview" dir="rtl" className="space-y-6">
      <TabsList className="bg-slate-100 p-1 h-auto flex-wrap">
        <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
          <BarChart3 className="h-4 w-4" />
          نمای کلی
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
          <Users className="h-4 w-4" />
          کاربران
        </TabsTrigger>
        <TabsTrigger value="branches" className="gap-1.5 text-xs sm:text-sm">
          <Building2 className="h-4 w-4" />
          شعب
        </TabsTrigger>
        <TabsTrigger value="product-groups" className="gap-1.5 text-xs sm:text-sm">
          <Package className="h-4 w-4" />
          گروه‌های کالایی
        </TabsTrigger>
        <TabsTrigger value="salesmen" className="gap-1.5 text-xs sm:text-sm">
          <UserCog className="h-4 w-4" />
          فروشندگان
        </TabsTrigger>
        <TabsTrigger value="periods" className="gap-1.5 text-xs sm:text-sm">
          <Calendar className="h-4 w-4" />
          دوره‌ها
        </TabsTrigger>
        <TabsTrigger value="targets" className="gap-1.5 text-xs sm:text-sm">
          <Target className="h-4 w-4" />
          تارگت انبوه
        </TabsTrigger>
        <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
          <FileQuestion className="h-4 w-4" />
          بررسی درخواست‌ها
        </TabsTrigger>
        <TabsTrigger value="audit-log" className="gap-1.5 text-xs sm:text-sm">
          <ScrollText className="h-4 w-4" />
          لاگ فعالیت‌ها
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
          <Settings2 className="h-4 w-4" />
          تنظیمات
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><AdminOverview /></TabsContent>
      <TabsContent value="users"><UsersManagement /></TabsContent>
      <TabsContent value="branches"><BranchesManagement /></TabsContent>
      <TabsContent value="product-groups"><ProductGroupsManagement /></TabsContent>
      <TabsContent value="salesmen"><SalesmenManagement /></TabsContent>
      <TabsContent value="periods"><PeriodsManagement /></TabsContent>
      <TabsContent value="targets"><BulkTargetManagement /></TabsContent>
      <TabsContent value="requests"><RequestReview /></TabsContent>
      <TabsContent value="audit-log"><AuditLog /></TabsContent>
      <TabsContent value="settings"><SettingsManagement /></TabsContent>
    </Tabs>
  )
}
