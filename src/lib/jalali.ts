import moment from 'jalali-moment'

// ─── Persian month names ────────────────────────────────────────────────────

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
] as const

export const JALALI_WEEKDAYS = [
  'ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج',
] as const

export const JALALI_WEEKDAYS_FULL = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه',
] as const

// ─── Core conversion functions ──────────────────────────────────────────────

/**
 * Convert a Gregorian date string to Jalali formatted string
 * @param dateStr - ISO date string or any parsable date
 * @param format - jalali-moment format string
 */
export function toJalali(dateStr: string | null | undefined, format: string = 'jYYYY/jMM/jDD'): string {
  if (!dateStr) return '—'
  try {
    return moment(dateStr).locale('fa').format(format)
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali with full Persian month name
 * e.g. "۱۴۰۴ فروردین ۱۵"
 */
export function formatJalaliFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const m = moment(dateStr).locale('fa')
    const day = m.jDate().toLocaleString('fa-IR')
    const month = JALALI_MONTHS[m.jMonth()]
    const year = m.jYear().toLocaleString('fa-IR')
    return `${day} ${month} ${year}`
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali with short format
 * e.g. "۱۴۰۴/۰۳/۱۵"
 */
export function formatJalaliShort(dateStr: string | null | undefined): string {
  return toJalali(dateStr, 'jYYYY/jMM/jDD')
}

/**
 * Format a date as Jalali with time
 * e.g. "۱۴۰۴/۰۳/۱۵ ۱۴:۳۰"
 */
export function formatJalaliDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const m = moment(dateStr).locale('fa')
    const datePart = m.format('jYYYY/jMM/jDD')
    const timePart = m.format('HH:mm')
    // Convert digits to Persian
    return `${toPersianDigits(datePart)} ${toPersianDigits(timePart)}`
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali relative (e.g. "۲ ساعت پیش", "۳ روز پیش")
 */
export function formatJalaliRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const now = moment()
    const date = moment(dateStr)
    const diffMinutes = now.diff(date, 'minutes')
    const diffHours = now.diff(date, 'hours')
    const diffDays = now.diff(date, 'days')

    if (diffMinutes < 1) return 'همین الان'
    if (diffMinutes < 60) return `${toPersianDigits(String(diffMinutes))} دقیقه پیش`
    if (diffHours < 24) return `${toPersianDigits(String(diffHours))} ساعت پیش`
    if (diffDays < 7) return `${toPersianDigits(String(diffDays))} روز پیش`
    return formatJalaliFull(dateStr)
  } catch {
    return '—'
  }
}

// ─── Jalali to Gregorian conversion ─────────────────────────────────────────

/**
 * Convert a Jalali date to Gregorian ISO string
 * @param jYear - Jalali year (e.g. 1404)
 * @param jMonth - Jalali month 1-12
 * @param jDay - Jalali day 1-31
 * @returns ISO date string (YYYY-MM-DD)
 */
export function jalaliToGregorian(jYear: number, jMonth: number, jDay: number): string {
  return moment(`${jYear}/${jMonth}/${jDay}`, 'jYYYY/jM/jD').format('YYYY-MM-DD')
}

/**
 * Convert a Jalali formatted string (1404/03/15) to Gregorian ISO
 */
export function jalaliStrToGregorian(jalaliStr: string): string {
  return moment(jalaliStr, 'jYYYY/jMM/jDD').format('YYYY-MM-DD')
}

// ─── Calendar helper functions ──────────────────────────────────────────────

export interface JalaliDay {
  date: moment.Moment
  jYear: number
  jMonth: number
  jDay: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean // Friday in Iran
  gregorianStr: string // YYYY-MM-DD format
}

/**
 * Get calendar grid for a given Jalali month
 */
export function getJalaliMonthGrid(jYear: number, jMonth: number): JalaliDay[][] {
  const firstDay = moment(`${jYear}/${jMonth}/1`, 'jYYYY/jM/jD')
  const today = moment().locale('fa')
  const todayStr = today.format('jYYYY/jMM/jDD')

  // Day of week for first day (0=Saturday in Iranian calendar)
  const firstDayOfWeek = firstDay.locale('fa').weekday() // 0=Saturday

  const days: JalaliDay[] = []

  // Previous month days
  const daysInPrevMonth = moment(`${jYear}/${jMonth}/1`, 'jYYYY/jM/jD').subtract(1, 'jMonth').jDaysInMonth()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = firstDay.clone().subtract(i + 1, 'days')
    days.push({
      date: day,
      jYear: day.jYear(),
      jMonth: day.jMonth() + 1,
      jDay: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: day.locale('fa').format('jYYYY/jMM/jDD') === todayStr,
      isWeekend: day.locale('fa').weekday() === 6, // Friday
      gregorianStr: day.format('YYYY-MM-DD'),
    })
  }

  // Current month days
  const daysInMonth = firstDay.jDaysInMonth()
  for (let d = 1; d <= daysInMonth; d++) {
    const day = moment(`${jYear}/${jMonth}/${d}`, 'jYYYY/jM/jD')
    days.push({
      date: day,
      jYear,
      jMonth,
      jDay: d,
      isCurrentMonth: true,
      isToday: day.locale('fa').format('jYYYY/jMM/jDD') === todayStr,
      isWeekend: day.locale('fa').weekday() === 6, // Friday
      gregorianStr: day.format('YYYY-MM-DD'),
    })
  }

  // Next month days to fill the grid (complete to 6 rows × 7 = 42)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const day = moment(`${jYear}/${jMonth}/1`, 'jYYYY/jM/jD').add(1, 'jMonth').add(d - 1, 'days')
    days.push({
      date: day,
      jYear: day.jYear(),
      jMonth: day.jMonth() + 1,
      jDay: d,
      isCurrentMonth: false,
      isToday: day.locale('fa').format('jYYYY/jMM/jDD') === todayStr,
      isWeekend: day.locale('fa').weekday() === 6, // Friday
      gregorianStr: day.format('YYYY-MM-DD'),
    })
  }

  // Split into weeks (rows)
  const weeks: JalaliDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return weeks
}

/**
 * Get number of days in a Jalali month
 */
export function jalaliMonthDays(jYear: number, jMonth: number): number {
  return moment(`${jYear}/${jMonth}/1`, 'jYYYY/jM/jD').jDaysInMonth()
}

/**
 * Get today's Jalali date info
 */
export function getTodayJalali(): { jYear: number; jMonth: number; jDay: number } {
  const m = moment().locale('fa')
  return { jYear: m.jYear(), jMonth: m.jMonth() + 1, jDay: m.jDate() }
}

// ─── Number conversion ──────────────────────────────────────────────────────

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

/**
 * Convert Persian digits to English digits
 */
export function toEnglishDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  let result = str
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), String(i))
    result = result.replace(new RegExp(arabicDigits[i], 'g'), String(i))
  }
  return result
}
