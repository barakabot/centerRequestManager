'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function LoginOverlay() {
  const { setUser, setIsAuthenticated } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('ایمیل یا رمز عبور اشتباه است')
        return
      }

      // Fetch session after successful login
      const sessionRes = await fetch('/api/auth/session-info')
      if (sessionRes.ok) {
        const data = await sessionRes.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
          setIsAuthenticated(true)
        } else {
          setError('خطا در دریافت اطلاعات کاربر')
        }
      } else {
        setError('خطا در ورود به سیستم')
      }
    } catch {
      setError('خطا در ارتباط با سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // Demo credentials helper
  const fillCredentials = (em: string, pwd: string) => {
    setEmail(em)
    setPassword(pwd)
    setError('')
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 mb-4">
            <Target className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">سیستم مدیریت تارگت</h1>
          <p className="text-slate-400 mt-1 text-sm">وارد حساب کاربری خود شوید</p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn className="size-5 text-emerald-400" />
              ورود به سیستم
            </CardTitle>
            <CardDescription className="text-slate-400">
              برای دسترسی به سیستم، ایمیل و رمز عبور خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">ایمیل</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  dir="ltr"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">رمز عبور</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور"
                    dir="ltr"
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500 pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base font-medium"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin ml-2" />
                    در حال ورود...
                  </>
                ) : (
                  'ورود'
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-3 text-center">حساب‌های آزمایشی (کلیک کنید)</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => fillCredentials('admin@target.sys', 'admin123')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs cursor-pointer w-full"
                >
                  <span className="size-6 rounded bg-red-500/20 flex items-center justify-center shrink-0">
                    <span className="text-red-400 font-bold text-[10px]">ادمین</span>
                  </span>
                  <div className="text-right flex-1">
                    <p className="text-red-300 font-medium">مدیر سیستم</p>
                    <p className="text-slate-500 font-mono text-[10px]">admin@target.sys / admin123</p>
                  </div>
                </button>
                <button
                  onClick={() => fillCredentials('planning@target.sys', 'planning123')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-xs cursor-pointer w-full"
                >
                  <span className="size-6 rounded bg-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="text-violet-400 font-bold text-[10px]">ب‌ف</span>
                  </span>
                  <div className="text-right flex-1">
                    <p className="text-violet-300 font-medium">برنامه‌ریز فروش</p>
                    <p className="text-slate-500 font-mono text-[10px]">planning@target.sys / planning123</p>
                  </div>
                </button>
                <button
                  onClick={() => fillCredentials('tehran@target.sys', 'tehran123')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs cursor-pointer w-full"
                >
                  <span className="size-6 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-emerald-400 font-bold text-[10px]">شعبه</span>
                  </span>
                  <div className="text-right flex-1">
                    <p className="text-emerald-300 font-medium">مدیر شعبه تهران</p>
                    <p className="text-slate-500 font-mono text-[10px]">tehran@target.sys / tehran123</p>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
