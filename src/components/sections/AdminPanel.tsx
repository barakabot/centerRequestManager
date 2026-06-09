'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Users,
  Building2,
  Package,
  Target,
  FileQuestion,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatNumber = (num: number): string => num.toLocaleString('fa-IR')
const formatPercent = (num: number): string => `٪${num.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}`

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

// ─── Admin Dashboard Sub-tab ─────────────────────────────────────────────────

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard')
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
    </div>
  )
}

// ─── Users Management Sub-tab ────────────────────────────────────────────────

function UsersManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'branch_manager', branchId: '' })

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
        ? { id: editingUser.id, ...form, branchId: form.branchId || null }
        : { ...form, branchId: form.branchId || null }

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
      setForm({ name: '', email: '', role: 'branch_manager', branchId: '' })
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

  const openEdit = (user: any) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId || '',
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingUser(null)
    setForm({ name: '', email: '', role: 'branch_manager', branchId: '' })
    setDialogOpen(true)
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
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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

// ─── Request Review Sub-tab ──────────────────────────────────────────────────

function RequestReview() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
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
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <p className="text-sm text-muted-foreground">{formatNumber(requests.length)} درخواست</p>
      </div>

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
                    {(req.status === 'pending' || req.status === 'in_review') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          onClick={() => reviewMutation.mutate({ id: req.id, status: 'approved', reviewNote: 'تأیید شد توسط مدیر سیستم' })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 gap-1"
                          onClick={() => reviewMutation.mutate({ id: req.id, status: 'rejected', reviewNote: 'عدم تطابق با شرایط' })}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          رد
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">درخواستی یافت نشد</p>
          </CardContent>
        </Card>
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
        <TabsTrigger value="targets" className="gap-1.5 text-xs sm:text-sm">
          <Target className="h-4 w-4" />
          تارگت انبوه
        </TabsTrigger>
        <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
          <FileQuestion className="h-4 w-4" />
          بررسی درخواست‌ها
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><AdminOverview /></TabsContent>
      <TabsContent value="users"><UsersManagement /></TabsContent>
      <TabsContent value="branches"><BranchesManagement /></TabsContent>
      <TabsContent value="product-groups"><ProductGroupsManagement /></TabsContent>
      <TabsContent value="targets"><BulkTargetManagement /></TabsContent>
      <TabsContent value="requests"><RequestReview /></TabsContent>
    </Tabs>
  )
}
