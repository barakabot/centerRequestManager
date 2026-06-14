'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import {
  FileQuestion,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Filter,
  Search,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { formatJalaliFull } from '@/lib/jalali'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Branch {
  id: string
  name: string
  code: string
}

interface AdHocRequest {
  id: string
  branchId: string
  type: string
  title: string
  description: string
  status: string
  priority: string
  createdBy: string
  reviewedBy: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  branch: Branch
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatNumber = (num: number): string => num.toLocaleString('fa-IR')

const getStatusConfig = (status: string): { label: string; className: string; icon: React.ElementType } => {
  switch (status) {
    case 'pending':
      return { label: 'در انتظار', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100', icon: Clock }
    case 'in_review':
      return { label: 'در حال بررسی', className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100', icon: Eye }
    case 'approved':
      return { label: 'تأیید شده', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100', icon: CheckCircle2 }
    case 'rejected':
      return { label: 'رد شده', className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100', icon: XCircle }
    default:
      return { label: status, className: '', icon: FileQuestion }
  }
}

const getPriorityConfig = (priority: string): { label: string; className: string } => {
  switch (priority) {
    case 'urgent':
      return { label: 'فوری', className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100' }
    case 'high':
      return { label: 'بالا', className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100' }
    case 'normal':
      return { label: 'عادی', className: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-100' }
    case 'low':
      return { label: 'پایین', className: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100' }
    default:
      return { label: priority, className: '' }
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

const formatDate = formatJalaliFull

// ─── Create Request Dialog ──────────────────────────────────────────────────

function CreateRequestDialog({ branchId }: { branchId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    type: 'correction',
    title: '',
    description: '',
    priority: 'normal',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ad-hoc-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          ...form,
          createdBy: 'مدیر شعبه',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'خطا در ثبت درخواست')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-hoc-requests'] })
      toast({ title: 'درخواست ثبت شد', description: 'درخواست شما با موفقیت ثبت گردید.' })
      setOpen(false)
      setForm({ type: 'correction', title: '', description: '', priority: 'normal' })
    },
    onError: (error: Error) => {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4" />
          ثبت درخواست جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>ثبت درخواست موردی</DialogTitle>
          <DialogDescription>درخواست اصلاحی، اضافی یا انتقال تارگت را ثبت نمایید</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع درخواست</label>
            <Select
              dir="rtl"
              value={form.type}
              onValueChange={(val) => setForm((p) => ({ ...p, type: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correction">اصلاحی</SelectItem>
                <SelectItem value="additional">اضافی</SelectItem>
                <SelectItem value="transfer">انتقال</SelectItem>
                <SelectItem value="other">سایر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">عنوان درخواست</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="عنوان درخواست را وارد کنید"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">شرح درخواست</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="توضیحات کامل درخواست را وارد کنید"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اولویت</label>
            <Select
              dir="rtl"
              value={form.priority}
              onValueChange={(val) => setForm((p) => ({ ...p, priority: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">پایین</SelectItem>
                <SelectItem value="normal">عادی</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
                <SelectItem value="urgent">فوری</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => createMutation.mutate()}
            disabled={!form.title || !form.description || createMutation.isPending}
          >
            {createMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Request Detail Dialog ──────────────────────────────────────────────────

function RequestDetailDialog({ request }: { request: AdHocRequest }) {
  const [open, setOpen] = useState(false)
  const statusConfig = getStatusConfig(request.status)
  const priorityConfig = getPriorityConfig(request.priority)
  const StatusIcon = statusConfig.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-emerald-600" />
            جزئیات درخواست
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={statusConfig.className}>
              <StatusIcon className="h-3 w-3 ml-1" />
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className={priorityConfig.className}>
              {priorityConfig.label}
            </Badge>
            <Badge variant="outline" className="bg-slate-100 text-slate-700">
              {getTypeLabel(request.type)}
            </Badge>
          </div>

          <div>
            <h4 className="font-semibold text-base">{request.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">شعبه:</span>
              <p className="font-medium">{request.branch.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ثبت‌کننده:</span>
              <p className="font-medium">{request.createdBy}</p>
            </div>
            <div>
              <span className="text-muted-foreground">تاریخ ثبت:</span>
              <p className="font-medium">{formatDate(request.createdAt)}</p>
            </div>
            {request.reviewedBy && (
              <div>
                <span className="text-muted-foreground">بررسی‌کننده:</span>
                <p className="font-medium">{request.reviewedBy}</p>
              </div>
            )}
            {request.reviewNote && (
              <div className="col-span-2">
                <span className="text-muted-foreground">یادداشت بررسی:</span>
                <p className="font-medium mt-1 p-2 bg-muted rounded text-sm">{request.reviewNote}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdHocRequestsSection() {
  const { selectedBranchId } = useAppStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch requests
  const { data: requests = [], isLoading, isError } = useQuery<AdHocRequest[]>({
    queryKey: ['ad-hoc-requests', selectedBranchId, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedBranchId) params.set('branchId', selectedBranchId)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const res = await fetch(`/api/ad-hoc-requests?${params.toString()}`)
      if (!res.ok) throw new Error('خطا در دریافت درخواست‌ها')
      return res.json()
    },
    enabled: !!selectedBranchId,
  })

  // Filter by search
  const filteredRequests = requests.filter((r) =>
    !searchQuery ||
    r.title.includes(searchQuery) ||
    r.description.includes(searchQuery) ||
    r.createdBy.includes(searchQuery)
  )

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: string; reviewNote?: string }) => {
      const res = await fetch('/api/ad-hoc-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reviewedBy: 'برنامه‌ریز فروش', reviewNote }),
      })
      if (!res.ok) throw new Error('خطا در بروزرسانی درخواست')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-hoc-requests'] })
      toast({ title: 'درخواست بروزرسانی شد' })
    },
    onError: () => {
      toast({ title: 'خطا', variant: 'destructive' })
    },
  })

  // Count by status
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const inReviewCount = requests.filter((r) => r.status === 'in_review').length
  const approvedCount = requests.filter((r) => r.status === 'approved').length
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">شعبه‌ای انتخاب نشده</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          برای مشاهده درخواست‌ها، ابتدا یک شعبه را از بالای صفحه انتخاب کنید.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold">{formatNumber(pendingCount)}</p>
            <p className="text-xs text-muted-foreground">در انتظار</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in_review')}>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{formatNumber(inReviewCount)}</p>
            <p className="text-xs text-muted-foreground">در حال بررسی</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
            <p className="text-2xl font-bold">{formatNumber(approvedCount)}</p>
            <p className="text-xs text-muted-foreground">تأیید شده</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold">{formatNumber(rejectedCount)}</p>
            <p className="text-xs text-muted-foreground">رد شده</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters & Actions ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در درخواست‌ها..."
              className="pr-9 w-56"
            />
          </div>
          <Select dir="rtl" value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="in_review">در حال بررسی</SelectItem>
              <SelectItem value="approved">تأیید شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
            </SelectContent>
          </Select>
          <Select dir="rtl" value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="نوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه انواع</SelectItem>
              <SelectItem value="correction">اصلاحی</SelectItem>
              <SelectItem value="additional">اضافی</SelectItem>
              <SelectItem value="transfer">انتقال</SelectItem>
              <SelectItem value="other">سایر</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateRequestDialog branchId={selectedBranchId} />
      </div>

      {/* ─── Requests Table ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">عنوان</TableHead>
                  <TableHead className="text-center font-semibold">نوع</TableHead>
                  <TableHead className="text-center font-semibold">اولویت</TableHead>
                  <TableHead className="text-center font-semibold">وضعیت</TableHead>
                  <TableHead className="text-center font-semibold">ثبت‌کننده</TableHead>
                  <TableHead className="text-center font-semibold">تاریخ</TableHead>
                  <TableHead className="text-center font-semibold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status)
                  const priorityConfig = getPriorityConfig(request.priority)
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[200px]">{request.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{request.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[11px]">{getTypeLabel(request.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[11px] ${priorityConfig.className}`}>
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[11px] ${statusConfig.className}`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{request.createdBy}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <RequestDetailDialog request={request} />
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                onClick={() => reviewMutation.mutate({ id: request.id, status: 'approved', reviewNote: 'تأیید شد' })}
                                title="تأیید"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => reviewMutation.mutate({ id: request.id, status: 'rejected', reviewNote: 'عدم تطابق' })}
                                title="رد"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
