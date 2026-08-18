import { useState } from 'react'
import { PRACTICE_TYPE_COLORS } from '../constants'
import type { AppointmentType, TimeUnit } from '../types'

type Modality = 'in-person' | 'telehealth' | 'phone'
type LeadUnit = Exclude<TimeUnit, 'min'>

export type AppointmentTypeForm = {
  name: string
  baseDurationMin: number
  patientClass: 'new' | 'existing' | 'both'
  modalities: Modality[]
  color: string
  textColor: string
  bufferBefore: number
  bufferAfter: number
  noticeWindowHours: number
  bookingWindowDays: number
  durationUnit: TimeUnit
  bufferUnit: TimeUnit
  noticeUnit: LeadUnit
  bookingUnit: LeadUnit
  userType: 'single' | 'multiple'
  maxLimit: number
}

type Props = {
  initialType?: AppointmentType | null
  /** Controls helper copy — practitioners create private types. */
  scopeHint?: 'global' | 'private'
  onCancel: () => void
  onSave: (form: AppointmentTypeForm) => void
  onDelete?: () => void
}

const modalityOptions: { id: Modality; label: string }[] = [
  { id: 'in-person', label: 'In-person' },
  { id: 'telehealth', label: 'Telehealth' },
  { id: 'phone', label: 'Phone' },
]

const ALL_UNITS: { id: TimeUnit; label: string }[] = [
  { id: 'min', label: 'Minutes' },
  { id: 'hours', label: 'Hours' },
  { id: 'days', label: 'Days' },
]

const LEAD_UNITS: { id: LeadUnit; label: string }[] = [
  { id: 'hours', label: 'Hours' },
  { id: 'days', label: 'Days' },
]

const MINUTES_PER: Record<TimeUnit, number> = {
  min: 1,
  hours: 60,
  days: 60 * 24,
}

const toDisplay = (canonicalMinutes: number, unit: TimeUnit): number => {
  const value = canonicalMinutes / MINUTES_PER[unit]
  return Number.isInteger(value) ? value : Math.round(value * 100) / 100
}

const toMinutes = (display: number, unit: TimeUnit): number =>
  Math.max(0, Math.round(display * MINUTES_PER[unit]))

const noticeToDisplay = (hours: number, unit: LeadUnit): number => {
  if (unit === 'hours') return hours
  const value = hours / 24
  return Number.isInteger(value) ? value : Math.round(value * 100) / 100
}

const noticeToHours = (display: number, unit: LeadUnit): number =>
  Math.max(0, Math.round(unit === 'hours' ? display : display * 24))

const contrastText = (hex: string) => {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return '#ffffff'
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 160 ? '#0b2f4a' : '#ffffff'
}

const bookingToDisplay = (days: number, unit: LeadUnit): number => {
  if (unit === 'days') return days
  const value = days * 24
  return Number.isInteger(value) ? value : Math.round(value * 100) / 100
}

const bookingToDays = (display: number, unit: LeadUnit): number =>
  Math.max(1, Math.round(unit === 'days' ? display : display / 24) || 1)

const unitSelectClass =
  'h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15'
const numberInputClass =
  'h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15'

const ValueWithUnit = ({
  label,
  value,
  unit,
  units,
  min = 0,
  step = 1,
  onValueChange,
  onUnitChange,
  hint,
}: {
  label: string
  value: number
  unit: string
  units: { id: string; label: string }[]
  min?: number
  step?: number
  onValueChange: (value: number) => void
  onUnitChange: (unit: string) => void
  hint?: string
}) => (
  <label className="block">
    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</span>
    <div className="flex gap-2">
      <input
        type="number"
        min={min}
        step={step}
        className={numberInputClass}
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
      />
      <select
        className={unitSelectClass}
        value={unit}
        onChange={(event) => onUnitChange(event.target.value)}
        aria-label={`${label} unit`}
      >
        {units.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
    {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
  </label>
)

export const NewAppointmentTypeModal = ({
  initialType = null,
  scopeHint = 'global',
  onCancel,
  onSave,
  onDelete,
}: Props) => {
  const isEditing = !!initialType
  const effectiveScope = initialType?.scope ?? scopeHint

  const initialDurationUnit: TimeUnit = initialType?.durationUnit ?? 'min'
  const initialBufferUnit: TimeUnit = initialType?.bufferUnit ?? 'min'
  const initialNoticeUnit: LeadUnit = initialType?.noticeUnit ?? 'hours'
  const initialBookingUnit: LeadUnit = initialType?.bookingUnit ?? 'days'

  const [name, setName] = useState(initialType?.name ?? '')
  const [durationUnit, setDurationUnit] = useState<TimeUnit>(initialDurationUnit)
  const [durationValue, setDurationValue] = useState(
    toDisplay(initialType?.baseDurationMin ?? 35, initialDurationUnit),
  )
  const [bufferUnit, setBufferUnit] = useState<TimeUnit>(initialBufferUnit)
  const [bufferBeforeValue, setBufferBeforeValue] = useState(
    toDisplay(initialType?.bufferBefore ?? 0, initialBufferUnit),
  )
  const [bufferAfterValue, setBufferAfterValue] = useState(
    toDisplay(initialType?.bufferAfter ?? 0, initialBufferUnit),
  )
  const [noticeUnit, setNoticeUnit] = useState<LeadUnit>(initialNoticeUnit)
  const [noticeValue, setNoticeValue] = useState(
    noticeToDisplay(initialType?.noticeWindowHours ?? 24, initialNoticeUnit),
  )
  const [bookingUnit, setBookingUnit] = useState<LeadUnit>(initialBookingUnit)
  const [bookingValue, setBookingValue] = useState(
    bookingToDisplay(initialType?.bookingWindowDays ?? 60, initialBookingUnit),
  )
  const [modalities, setModalities] = useState<Modality[]>(
    initialType?.modalities?.length ? [...initialType.modalities] : ['in-person'],
  )
  const [userType, setUserType] = useState<'single' | 'multiple' | null>(
    initialType?.userType ?? null,
  )
  const [maxLimitInput, setMaxLimitInput] = useState(
    initialType?.userType === 'multiple' && initialType.maxLimit != null
      ? String(initialType.maxLimit)
      : '',
  )
  const [color, setColor] = useState(initialType?.color ?? PRACTICE_TYPE_COLORS[0].color)

  const selectedPalette = PRACTICE_TYPE_COLORS.find((item) => item.color === color) ?? {
    color,
    textColor: contrastText(color),
  }
  const parsedMaxLimit = Number(maxLimitInput)
  const durationMinutes = toMinutes(durationValue, durationUnit)
  const canSave =
    name.trim().length > 0 &&
    modalities.length > 0 &&
    durationMinutes >= 10 &&
    userType !== null &&
    (userType === 'single' || (maxLimitInput.trim() !== '' && parsedMaxLimit >= 1))

  const toggleModality = (id: Modality) => {
    setModalities((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const changeDurationUnit = (next: TimeUnit) => {
    const minutes = toMinutes(durationValue, durationUnit)
    setDurationUnit(next)
    setDurationValue(toDisplay(minutes, next))
  }

  const changeBufferUnit = (next: TimeUnit) => {
    const beforeMin = toMinutes(bufferBeforeValue, bufferUnit)
    const afterMin = toMinutes(bufferAfterValue, bufferUnit)
    setBufferUnit(next)
    setBufferBeforeValue(toDisplay(beforeMin, next))
    setBufferAfterValue(toDisplay(afterMin, next))
  }

  const changeNoticeUnit = (next: LeadUnit) => {
    const hours = noticeToHours(noticeValue, noticeUnit)
    setNoticeUnit(next)
    setNoticeValue(noticeToDisplay(hours, next))
  }

  const changeBookingUnit = (next: LeadUnit) => {
    const days = bookingToDays(bookingValue, bookingUnit)
    setBookingUnit(next)
    setBookingValue(bookingToDisplay(days, next))
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-900/35 backdrop-blur-[2px]">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[min(92dvh,920px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(16,40,70,0.22)] ring-1 ring-slate-200/80">
          <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {isEditing ? 'Edit appointment type' : 'New appointment type'}
              </h2>
              <p className="mt-1 text-[12px] text-slate-500">
                {effectiveScope === 'private'
                  ? 'My appointment type — only on this practitioner\'s calendar. Admin and other doctors will not see it in their lists.'
                  : 'Practice-default type available across the practice.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Name</span>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Follow Up Visit"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ValueWithUnit
                label="Base duration"
                value={durationValue}
                unit={durationUnit}
                units={ALL_UNITS}
                min={durationUnit === 'min' ? 10 : durationUnit === 'hours' ? 0.25 : 1 / 24}
                step={durationUnit === 'min' ? 5 : durationUnit === 'hours' ? 0.25 : 0.05}
                onValueChange={(value) => setDurationValue(Math.max(0, value || 0))}
                onUnitChange={(unit) => changeDurationUnit(unit as TimeUnit)}
                hint="Choose minutes, hours, or days."
              />

              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Buffer</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step={bufferUnit === 'min' ? 5 : bufferUnit === 'hours' ? 0.25 : 0.05}
                    className={numberInputClass}
                    value={bufferBeforeValue}
                    onChange={(event) =>
                      setBufferBeforeValue(Math.max(0, Number(event.target.value) || 0))
                    }
                    placeholder="Before"
                    title="Buffer before"
                  />
                  <input
                    type="number"
                    min={0}
                    step={bufferUnit === 'min' ? 5 : bufferUnit === 'hours' ? 0.25 : 0.05}
                    className={numberInputClass}
                    value={bufferAfterValue}
                    onChange={(event) =>
                      setBufferAfterValue(Math.max(0, Number(event.target.value) || 0))
                    }
                    placeholder="After"
                    title="Buffer after"
                  />
                  <select
                    className={unitSelectClass}
                    value={bufferUnit}
                    onChange={(event) => changeBufferUnit(event.target.value as TimeUnit)}
                    aria-label="Buffer unit"
                  >
                    {ALL_UNITS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="mt-1 block text-[11px] text-slate-400">Before / after the visit.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Notice window</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step={noticeUnit === 'hours' ? 1 : 0.5}
                    className={numberInputClass}
                    value={noticeValue}
                    onChange={(event) => setNoticeValue(Math.max(0, Number(event.target.value) || 0))}
                  />
                  <div className="inline-flex h-11 shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                    {LEAD_UNITS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => changeNoticeUnit(item.id)}
                        className={`min-w-[68px] rounded-md px-2.5 text-[12px] font-semibold transition ${
                          noticeUnit === item.id
                            ? 'bg-white text-[#0f5f92] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="mt-1 block text-[11px] text-slate-400">
                  Minimum lead time. Use hours (e.g. 24) or days (e.g. 7).
                </span>
              </div>
              <ValueWithUnit
                label="Booking window"
                value={bookingValue}
                unit={bookingUnit}
                units={LEAD_UNITS}
                min={bookingUnit === 'days' ? 1 : 1}
                step={bookingUnit === 'days' ? 1 : 1}
                onValueChange={(value) => setBookingValue(Math.max(0, value || 0))}
                onUnitChange={(unit) => changeBookingUnit(unit as LeadUnit)}
                hint="How far ahead patients can book. 1 month = 30 days."
              />
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Eligible modality
              </span>
              <div className="flex flex-wrap gap-2">
                {modalityOptions.map((option) => {
                  const active = modalities.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleModality(option.id)}
                      className={`h-9 rounded-full px-3.5 text-[12px] font-semibold transition ${
                        active
                          ? 'bg-[#e8f2f8] text-[#0f5f92] ring-2 ring-[#0f5f92]/40'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                User type <span className="text-rose-500">*</span>
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#0f5f92]"
                    checked={userType === 'single'}
                    onChange={() => setUserType('single')}
                  />
                  Single user type
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#0f5f92]"
                    checked={userType === 'multiple'}
                    onChange={() => {
                      setUserType('multiple')
                      if (!maxLimitInput.trim()) setMaxLimitInput('')
                    }}
                  />
                  Multiple user type
                </label>
                {userType === 'multiple' ? (
                  <label className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-slate-700">
                    Max limit
                    <input
                      type="number"
                      min={1}
                      max={100}
                      inputMode="numeric"
                      placeholder="e.g. 5"
                      className="h-9 w-[88px] rounded-lg border border-slate-200 bg-white px-2 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                      value={maxLimitInput}
                      onChange={(event) => setMaxLimitInput(event.target.value)}
                    />
                  </label>
                ) : null}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Color</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRACTICE_TYPE_COLORS.map((swatch) => {
                  const active = color === swatch.color
                  return (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => setColor(swatch.color)}
                      className={`grid size-8 place-items-center rounded-full transition ${
                        active ? 'ring-2 ring-[#0f5f92] ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ background: swatch.color }}
                      aria-label={`Color ${swatch.color}`}
                    >
                      {active ? <span className="text-[12px] font-bold text-white">✓</span> : null}
                    </button>
                  )
                })}
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Custom color"
                  />
                  <span className="text-[12px] font-semibold text-slate-600">Custom</span>
                </label>
              </div>
              <span className="mt-1.5 block text-[11px] text-slate-400">
                Pick a practice color or a custom RGB for branding.
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="h-10 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="h-10 rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  if (!userType) return
                  onSave({
                    name: name.trim(),
                    baseDurationMin: Math.max(10, durationMinutes),
                    patientClass: initialType?.patientClass ?? 'both',
                    modalities,
                    color: selectedPalette.color,
                    textColor: selectedPalette.textColor,
                    bufferBefore: toMinutes(bufferBeforeValue, bufferUnit),
                    bufferAfter: toMinutes(bufferAfterValue, bufferUnit),
                    noticeWindowHours: noticeToHours(noticeValue, noticeUnit),
                    bookingWindowDays: bookingToDays(bookingValue, bookingUnit),
                    durationUnit,
                    bufferUnit,
                    noticeUnit,
                    bookingUnit,
                    userType,
                    maxLimit: userType === 'multiple' ? Math.max(1, parsedMaxLimit || 1) : 1,
                  })
                }}
                className="h-10 rounded-lg bg-[#3d4f5f] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                {isEditing ? 'Save changes' : 'Create type'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** @deprecated Use AppointmentTypeForm */
export type NewAppointmentTypeForm = AppointmentTypeForm

/** Format stored appointment-type timing for lists and previews. */
export const formatTypeDuration = (type: AppointmentType): string => {
  if (type.baseDurationMin == null) return '—'
  const unit = type.durationUnit ?? 'min'
  const value = toDisplay(type.baseDurationMin, unit)
  if (unit === 'min') return `${value} min`
  if (unit === 'hours') return `${value} ${value === 1 ? 'hour' : 'hours'}`
  return `${value} ${value === 1 ? 'day' : 'days'}`
}

export const formatTypeNotice = (type: AppointmentType): string => {
  if (type.noticeWindowHours == null) return '—'
  const unit = type.noticeUnit ?? 'hours'
  const value = noticeToDisplay(type.noticeWindowHours, unit)
  return unit === 'hours' ? `${value}h` : `${value} ${value === 1 ? 'day' : 'days'}`
}

export const formatTypeBooking = (type: AppointmentType): string => {
  if (type.bookingWindowDays == null) return '—'
  const unit = type.bookingUnit ?? 'days'
  const value = bookingToDisplay(type.bookingWindowDays, unit)
  return unit === 'days'
    ? `${value} ${value === 1 ? 'day' : 'days'} ahead`
    : `${value} ${value === 1 ? 'hour' : 'hours'} ahead`
}

export const formatTypeBuffer = (type: AppointmentType): string => {
  const unit = type.bufferUnit ?? 'min'
  const before = toDisplay(type.bufferBefore ?? 0, unit)
  const after = toDisplay(type.bufferAfter ?? 0, unit)
  const suffix = unit === 'min' ? 'min' : unit === 'hours' ? 'h' : 'd'
  return `Buffer ${before}/${after} ${suffix}`
}
