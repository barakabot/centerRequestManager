'use client'

import React, { useState, useCallback, useMemo } from 'react'
import moment from 'jalali-moment'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  getJalaliMonthGrid,
  getTodayJalali,
  toPersianDigits,
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  formatJalaliShort,
} from '@/lib/jalali'

// ─── Calendar Sub-component ─────────────────────────────────────────────────

interface JalaliCalendarProps {
  selectedGregorian?: string // YYYY-MM-DD
  onSelect: (gregorianDate: string) => void
}

function JalaliCalendar({ selectedGregorian, onSelect }: JalaliCalendarProps) {
  const today = getTodayJalali()

  // Compute initial view from selected date or today
  const initialView = useMemo(() => {
    if (selectedGregorian) {
      const m = moment(selectedGregorian, 'YYYY-MM-DD')
      if (m.isValid()) {
        return { year: m.jYear(), month: m.jMonth() + 1 }
      }
    }
    return { year: today.jYear, month: today.jMonth }
  }, [selectedGregorian, today.jYear, today.jMonth])

  const [viewYear, setViewYear] = useState(initialView.year)
  const [viewMonth, setViewMonth] = useState(initialView.month)

  const weeks = getJalaliMonthGrid(viewYear, viewMonth)

  const goToPrevMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 1) {
        setViewYear(y => y - 1)
        return 12
      }
      return prev - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 12) {
        setViewYear(y => y + 1)
        return 1
      }
      return prev + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    const t = getTodayJalali()
    setViewYear(t.jYear)
    setViewMonth(t.jMonth)
  }, [])

  const handleDayClick = (gregorianStr: string) => {
    onSelect(gregorianStr)
  }

  return (
    <div className="p-3 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <button
          className="text-sm font-bold px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
          onClick={goToToday}
          title="رفتن به امروز"
        >
          {toPersianDigits(viewYear)} {JALALI_MONTHS[viewMonth - 1]}
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {JALALI_WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className={`text-center text-xs font-medium py-1 ${
              i === 6 ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {weeks.flat().map((day, i) => {
          const isSelected = day.gregorianStr === selectedGregorian
          const isToday = day.isToday
          const isCurrentMonth = day.isCurrentMonth
          const isWeekend = day.isWeekend

          return (
            <button
              key={i}
              onClick={() => isCurrentMonth && handleDayClick(day.gregorianStr)}
              disabled={!isCurrentMonth}
              className={`
                relative h-8 w-8 text-xs rounded-md transition-all duration-150
                flex items-center justify-center mx-auto
                ${!isCurrentMonth ? 'text-muted-foreground/30 cursor-default' : 'cursor-pointer hover:bg-muted'}
                ${isCurrentMonth && isWeekend ? 'text-red-500' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-emerald-500 font-bold text-emerald-700' : ''}
                ${isSelected ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-sm' : ''}
              `}
            >
              {toPersianDigits(day.jDay)}
            </button>
          )
        })}
      </div>

      {/* Today button */}
      <div className="mt-2 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 text-emerald-600 hover:text-emerald-700"
          onClick={goToToday}
        >
          امروز
        </Button>
      </div>
    </div>
  )
}

// ─── Date Picker Input ──────────────────────────────────────────────────────

interface JalaliDatePickerProps {
  value?: string // Gregorian YYYY-MM-DD
  onChange: (gregorianDate: string) => void
  placeholder?: string
  dir?: string
  className?: string
  disabled?: boolean
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  className,
  disabled,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false)

  // Derive display value directly from prop (no useEffect + setState)
  const displayValue = value ? formatJalaliShort(value) : ''

  const handleSelect = (gregorianDate: string) => {
    onChange(gregorianDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`
            flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2
            text-sm ring-offset-background text-right
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${className || ''}
          `}
          disabled={disabled}
          dir="rtl"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className={displayValue ? '' : 'text-muted-foreground'}>
            {displayValue || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4} dir="rtl">
        <JalaliCalendar
          selectedGregorian={value}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

export default JalaliDatePicker
