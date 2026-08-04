import { END_HOUR, GRID_START_MINUTES, SLOT_COUNT, SLOT_MINUTES } from './constants'

export const toDateInputValue = (date: Date): string => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const parseDateInput = (value: string): Date => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)
}

export const setTimeForDate = (date: Date, time: string): Date => {
  const [hourStr, minuteMeridian] = time.split(':')
  const [minuteStr, meridian] = minuteMeridian.split(' ')
  let hour = Number(hourStr)
  if (meridian === 'PM' && hour !== 12) hour += 12
  if (meridian === 'AM' && hour === 12) hour = 0
  const minute = Number(minuteStr)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0)
}

export const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
  return date.toLocaleTimeString('en-US', options)
}

export const slotIndexToMinutes = (slotIndex: number): number =>
  GRID_START_MINUTES + slotIndex * SLOT_MINUTES

export const minutesToSlotIndex = (minutes: number): number =>
  Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor((minutes - GRID_START_MINUTES) / SLOT_MINUTES)))

export const slotIndexToLabel = (slotIndex: number): string => {
  const total = slotIndexToMinutes(slotIndex)
  const hour = Math.floor(total / 60)
  const minute = total % 60
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12
  return `${twelveHour}:${`${minute}`.padStart(2, '0')} ${suffix}`
}

export const atLocalDate = (date: Date, minutes: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minutes / 60), minutes % 60, 0, 0)

export const startOfWeek = (date: Date): Date => {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), END_HOUR, 0, 0, 0)

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
