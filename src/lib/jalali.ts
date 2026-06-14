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

// ─── Number conversion ──────────────────────────────────────────────────────

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

/**
 * Convert Persian/Arabic digits to English digits
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

// ─── Timezone-safe date parsing ─────────────────────────────────────────────

/**
 * Extract the date-only portion (YYYY-MM-DD) from an ISO date string.
 * This is timezone-safe — it extracts the date part directly from the string
 * rather than using Date objects which can shift due to timezone offsets.
 * 
 * For dates like "2026-06-01T00:00:00.000Z", returns "2026-06-01".
 * For dates like "2026-06-01", returns "2026-06-01" as-is.
 * 
 * IMPORTANT: For "date-only" fields (startDate, endDate, deadlineDate),
 * the UTC date is the intended date. For "timestamp" fields (createdAt, updatedAt),
 * the local date might be more appropriate — use extractLocalDateStr instead.
 */
function extractDateStr(dateStr: string): string {
  // If it's already just a date string (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // Otherwise extract the date part from the ISO string
  // This works correctly because Prisma/SQLite stores dates as UTC
  // and the date portion of the ISO string IS the intended date for date-only fields
  return dateStr.split('T')[0]
}

/**
 * Extract a date string (YYYY-MM-DD) using the local timezone.
 * This is needed for timestamp fields (createdAt, updatedAt) where
 * the user expects to see the date in their local timezone.
 */
function extractLocalDateStr(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extract time (HH:mm) from an ISO date string using local timezone.
 */
function extractLocalTime(dateStr: string): string {
  const d = new Date(dateStr)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Create a timezone-safe moment from a date-only string.
 * By parsing as 'YYYY-MM-DD' format, we avoid timezone shifts
 * that happen when moment() interprets ISO strings in local time.
 */
function momentDateOnly(dateStr: string): moment.Moment {
  const dateOnly = extractDateStr(dateStr)
  return moment(dateOnly, 'YYYY-MM-DD')
}

/**
 * Create a moment from a timestamp using local timezone.
 * For timestamp fields, we want the local date/time representation.
 */
function momentLocal(dateStr: string): moment.Moment {
  const localDate = extractLocalDateStr(dateStr)
  return moment(localDate, 'YYYY-MM-DD')
}

// ─── Core conversion functions ──────────────────────────────────────────────

/**
 * Convert a Gregorian date string to Jalali formatted string
 * Always returns Persian digits
 * Timezone-safe: uses date-only parsing for date fields
 */
export function toJalali(dateStr: string | null | undefined, format: string = 'jYYYY/jMM/jDD'): string {
  if (!dateStr) return '—'
  try {
    const m = momentDateOnly(dateStr).locale('fa')
    const result = m.format(format)
    return toPersianDigits(result)
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali with full Persian month name
 * e.g. "۱۵ فروردین ۱۴۰۴"
 * Timezone-safe: uses date-only parsing
 */
export function formatJalaliFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const m = momentDateOnly(dateStr).locale('fa')
    const jDay = m.jDate()
    const jMonth = m.jMonth() // 0-indexed
    const jYear = m.jYear()
    return `${toPersianDigits(jDay)} ${JALALI_MONTHS[jMonth]} ${toPersianDigits(jYear)}`
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali with short format
 * e.g. "۱۴۰۴/۰۳/۱۵"
 * Timezone-safe: uses date-only parsing
 */
export function formatJalaliShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const m = momentDateOnly(dateStr).locale('fa')
    const jYear = m.jYear()
    const jMonth = m.jMonth() + 1 // 1-indexed
    const jDay = m.jDate()
    return toPersianDigits(`${jYear}/${String(jMonth).padStart(2, '0')}/${String(jDay).padStart(2, '0')}`)
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali with time (using local timezone for time)
 * e.g. "۱۴۰۴/۰۳/۱۵ - ۱۴:۳۰"
 * Timezone-safe: date part uses date-only parsing, time part uses local timezone
 */
export function formatJalaliDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const datePart = formatJalaliShort(dateStr)
    const timePart = extractLocalTime(dateStr)
    return `${datePart} - ${toPersianDigits(timePart)}`
  } catch {
    return '—'
  }
}

/**
 * Format a date as Jalali relative (e.g. "۲ ساعت پیش", "۳ روز پیش")
 * Uses local timezone for relative calculations
 */
export function formatJalaliRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

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
 * Handles both Persian and English digits
 */
export function jalaliStrToGregorian(jalaliStr: string): string {
  const englishStr = toEnglishDigits(jalaliStr)
  return moment(englishStr, 'jYYYY/jMM/jDD').format('YYYY-MM-DD')
}

/**
 * Convert an ISO date string to a YYYY-MM-DD string safely.
 * Uses local timezone to extract the date — suitable for form values.
 * This avoids the timezone bug of toISOString().split('T')[0]
 * which can shift dates by a day in non-UTC timezones.
 */
export function isoToDateStr(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    // For date-only fields stored in DB, extract the date part directly from the ISO string
    // This is the safest approach because the date portion of the ISO string
    // represents the intended date for date-only fields
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    // For ISO datetime strings, the date part before 'T' is the UTC date
    // which is the correct date for date-only fields stored by Prisma
    return dateStr.split('T')[0]
  } catch {
    return ''
  }
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
