declare module 'jalali-moment' {
  interface JalaliMoment {
    locale(locale: string): JalaliMoment
    format(format: string): string
    jYear(): number
    jMonth(): number
    jDate(): number
    jDaysInMonth(): number
    weekday(): number
    isValid(): boolean
    clone(): JalaliMoment
    add(amount: number, unit: string): JalaliMoment
    subtract(amount: number, unit: string): JalaliMoment
    diff(other: JalaliMoment, unit: string): number
    toDate(): Date
  }

  function moment(input?: string | Date | number, format?: string, strict?: boolean): JalaliMoment

  export = moment
}
