'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImportResult {
  success: boolean
  message: string
  totalRows: number
  validRows: number
  headers: string[]
  data: Record<string, string>[]
  importType: string
}

interface ImportError {
  error: string
  details?: { row: number; message: string }[]
  validRows?: number
  totalRows?: number
}

// ─── Template Info ───────────────────────────────────────────────────────────

const templates = [
  {
    type: 'targets',
    label: 'تارگت‌ها',
    description: 'بارگذاری تارگت دوره‌ای گروه‌های کالایی',
    requiredColumns: ['branchCode', 'productGroupCode', 'totalTarget', 'periodName'],
  },
  {
    type: 'salesmen',
    label: 'فروشندگان',
    description: 'بارگذاری اطلاعات فروشندگان جدید',
    requiredColumns: ['name', 'code', 'branchCode'],
  },
  {
    type: 'performance',
    label: 'عملکرد فروش',
    description: 'بارگذاری داده‌های عملکرد فروش واقعی',
    requiredColumns: ['salesmanCode', 'productGroupCode', 'actualSales', 'customerCount'],
  },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ExcelImportSection() {
  const { toast } = useToast()
  const [importType, setImportType] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<ImportError | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file || !importType) throw new Error('فایل و نوع ورود اطلاعات الزامی است')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('importType', importType)

      const res = await fetch('/api/excel-import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw data
      }

      return data as ImportResult
    },
    onSuccess: (data) => {
      setResult(data)
      setError(null)
      toast({ title: 'فایل با موفقیت پردازش شد', description: data.message })
    },
    onError: (err: any) => {
      setError(err as ImportError)
      setResult(null)
      toast({
        title: 'خطا در پردازش فایل',
        description: err.error || 'لطفاً فایل را بررسی و مجدداً تلاش کنید',
        variant: 'destructive',
      })
    },
  })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setResult(null)
      setError(null)
    }
  }, [])

  const handleReset = useCallback(() => {
    setFile(null)
    setResult(null)
    setError(null)
    setImportType('')
  }, [])

  const selectedTemplate = templates.find((t) => t.type === importType)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ─── Step 1: Select Import Type ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
              ۱
            </span>
            انتخاب نوع ورود اطلاعات
          </CardTitle>
          <CardDescription>نوع داده‌هایی که قصد ورود از طریق فایل را دارید مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.map((template) => (
              <Card
                key={template.type}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  importType === template.type
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/50'
                    : 'hover:border-emerald-300'
                }`}
                onClick={() => {
                  setImportType(template.type)
                  setResult(null)
                  setError(null)
                }}
              >
                <CardContent className="p-4 text-center">
                  <FileSpreadsheet className={`h-8 w-8 mx-auto mb-2 ${
                    importType === template.type ? 'text-emerald-600' : 'text-muted-foreground'
                  }`} />
                  <p className="font-semibold text-sm">{template.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedTemplate && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">ستون‌های مورد نیاز:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.requiredColumns.map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Step 2: Upload File ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
              ۲
            </span>
            بارگذاری فایل
          </CardTitle>
          <CardDescription>
            فایل CSV خود را بارگذاری کنید (فرمت استاندارد کاما‌جداشده)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!importType ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">ابتدا نوع ورود اطلاعات را انتخاب کنید</p>
            </div>
          ) : (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : file
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-emerald-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} کیلوبایت
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف فایل
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-10 w-10 mx-auto text-slate-400" />
                    <div>
                      <p className="font-medium">فایل را اینجا رها کنید</p>
                      <p className="text-sm text-muted-foreground mt-1">یا از دکمه زیر انتخاب کنید</p>
                    </div>
                    <label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" asChild className="cursor-pointer">
                        <span>انتخاب فایل</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {/* Import Button */}
              {file && (
                <div className="mt-4 flex justify-end">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 min-w-[160px]"
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        در حال پردازش...
                      </span>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        پردازش و اعتبارسنجی
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Step 3: Results ─────────────────────────────────────────────── */}
      {(result || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                ۳
              </span>
              نتیجه اعتبارسنجی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Success */}
            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800">{result.message}</p>
                    <p className="text-sm text-emerald-600">
                      {result.validRows} ردیف معتبر از {result.totalRows} ردیف
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                {result.data.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">پیش‌نمایش داده‌ها (حداکثر ۵۰ ردیف اول)</h4>
                    <div className="max-h-96 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-center w-12">#</TableHead>
                            {result.headers.map((header) => (
                              <TableHead key={header} className="text-right text-xs">{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.data.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {(idx + 1).toLocaleString('fa-IR')}
                              </TableCell>
                              {result.headers.map((header) => (
                                <TableCell key={header} className="text-xs">
                                  {row[header] || '—'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    بارگذاری فایل جدید
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="h-4 w-4 ml-1" />
                    ثبت نهایی اطلاعات
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">{error.error}</p>
                    {error.validRows !== undefined && error.totalRows !== undefined && (
                      <p className="text-sm text-red-600 mt-1">
                        {error.validRows} ردیف معتبر از {error.totalRows} ردیف
                      </p>
                    )}
                  </div>
                </div>

                {error.details && error.details.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-red-700">لیست خطاها:</h4>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-red-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-50">
                            <TableHead className="text-center w-20">ردیف</TableHead>
                            <TableHead className="text-right">شرح خطا</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {error.details.map((detail, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-center text-xs font-mono">
                                {detail.row === 0 ? '—' : detail.row.toLocaleString('fa-IR')}
                              </TableCell>
                              <TableCell className="text-xs text-red-700">{detail.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setError(null) }}>
                    بازگشت و اصلاح
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    بارگذاری فایل جدید
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
