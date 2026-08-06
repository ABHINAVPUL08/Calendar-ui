import { useState } from 'react'
import { PRACTICE_TYPE_COLORS } from '../constants'
import type { AppointmentType } from '../types'

type Modality = 'in-person' | 'telehealth' | 'phone'

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
  userType: 'single' | 'multiple'
  maxLimit: number
}

type Props = {
  initialType?: AppointmentType | null
  onCancel: () => void
  onSave: (form: AppointmentTypeForm) => void
  onDelete?: () => void
}

const modalityOptions: { id: Modality; label: string }[] = [
  { id: 'in-person', label: 'In-person' },
  { id: 'telehealth', label: 'Telehealth' },
  { id: 'phone', label: 'Phone' },
]

export const NewAppointmentTypeModal = ({
  initialType = null,
  onCancel,
  onSave,
  onDelete,
}: Props) => {
  const isEditing = !!initialType
  const [name, setName] = useState(initialType?.name ?? '')
  const [baseDurationMin, setBaseDurationMin] = useState(initialType?.baseDurationMin ?? 35)
  const [bufferBefore, setBufferBefore] = useState(initialType?.bufferBefore ?? 0)
  const [bufferAfter, setBufferAfter] = useState(initialType?.bufferAfter ?? 0)
  const [noticeWindowHours, setNoticeWindowHours] = useState(initialType?.noticeWindowHours ?? 24)
  const [bookingWindowDays, setBookingWindowDays] = useState(initialType?.bookingWindowDays ?? 60)
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
    textColor: initialType?.textColor ?? '#ffffff',
  }
  const parsedMaxLimit = Number(maxLimitInput)
  const canSave =
    name.trim().length > 0 &&
    modalities.length > 0 &&
    baseDurationMin >= 10 &&
    userType !== null &&
    (userType === 'single' || (maxLimitInput.trim() !== '' && parsedMaxLimit >= 1))

  const toggleModality = (id: Modality) => {
    setModalities((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(16,40,70,0.22)] ring-1 ring-slate-200/80">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {isEditing ? 'Edit appointment type' : 'New appointment type'}
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Practice-default type available across the practice.
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

        <div className="space-y-4 px-5 py-4">
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
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Base duration (min)</span>
              <input
                type="number"
                min={10}
                max={240}
                step={5}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                value={baseDurationMin}
                onChange={(event) => setBaseDurationMin(Number(event.target.value) || 10)}
              />
              <span className="mt-1 block text-[11px] text-slate-400">5-min steps, 10 min – 4 hrs.</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Buffer before</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={5}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={bufferBefore}
                  onChange={(event) => setBufferBefore(Math.max(0, Number(event.target.value) || 0))}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Buffer after</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={5}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={bufferAfter}
                  onChange={(event) => setBufferAfter(Math.max(0, Number(event.target.value) || 0))}
                />
              </label>
              <span className="col-span-2 text-[11px] text-slate-400">Minutes before / after the visit.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Notice window (hours)</span>
              <input
                type="number"
                min={0}
                max={168}
                step={1}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                value={noticeWindowHours}
                onChange={(event) =>
                  setNoticeWindowHours(Math.max(0, Number(event.target.value) || 0))
                }
              />
              <span className="mt-1 block text-[11px] text-slate-400">Minimum lead time before booking.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Booking window (days)</span>
              <input
                type="number"
                min={1}
                max={365}
                step={1}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                value={bookingWindowDays}
                onChange={(event) =>
                  setBookingWindowDays(Math.max(1, Number(event.target.value) || 1))
                }
              />
              <span className="mt-1 block text-[11px] text-slate-400">How far ahead patients can book.</span>
            </label>
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
            <div className="flex flex-wrap gap-2.5">
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
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
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
                  baseDurationMin,
                  patientClass: initialType?.patientClass ?? 'both',
                  modalities,
                  color: selectedPalette.color,
                  textColor: selectedPalette.textColor,
                  bufferBefore,
                  bufferAfter,
                  noticeWindowHours,
                  bookingWindowDays,
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
  )
}

/** @deprecated Use AppointmentTypeForm */
export type NewAppointmentTypeForm = AppointmentTypeForm
