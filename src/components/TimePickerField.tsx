import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5) // 0, 5, 10 ... 55

const parseTimeParts = (value: string): { hour: number; minute: number; meridian: 'AM' | 'PM' } => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return { hour: 8, minute: 0, meridian: 'AM' }
  let hour = Number(match[1])
  const minute = Number(match[2])
  const meridian = match[3].toUpperCase() as 'AM' | 'PM'
  if (hour < 1 || hour > 12) hour = 8
  return {
    hour,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
    meridian,
  }
}

const formatTimeValue = (hour: number, minute: number, meridian: 'AM' | 'PM') =>
  `${hour}:${`${minute}`.padStart(2, '0')} ${meridian}`

const labelClass = 'mb-1.5 block text-[11.5px] font-semibold text-[#3c4b5a]'

export const TimePickerField = ({ label, required, value, onChange, placeholder }: Props) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const parts = useMemo(() => parseTimeParts(value), [value])
  const [hour, setHour] = useState(parts.hour)
  const [minute, setMinute] = useState(parts.minute)
  const [meridian, setMeridian] = useState<'AM' | 'PM'>(parts.meridian)

  useEffect(() => {
    setHour(parts.hour)
    setMinute(parts.minute)
    setMeridian(parts.meridian)
  }, [parts.hour, parts.minute, parts.meridian])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const commit = (nextHour: number, nextMinute: number, nextMeridian: 'AM' | 'PM') => {
    onChange(formatTimeValue(nextHour, nextMinute, nextMeridian))
  }

  return (
    <div ref={rootRef} className="relative">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center gap-2 rounded-[5px] border border-[#d3dce4] bg-white px-2.5 text-left text-[13px] text-[#1c2b3a] outline-none transition hover:border-[#0f5f92]/40 focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{value || placeholder || 'Select time'}</span>
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#eef6fb] text-[#0f5f92]" aria-hidden>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(16,28,40,0.18)]">
          <div className="border-b border-slate-100 bg-[#f8fafc] px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Select time
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 p-3">
            <div>
              <p className="mb-1.5 text-center text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Hour
              </p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-1">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setHour(h)
                      commit(h, minute, meridian)
                    }}
                    className={`flex h-8 w-full items-center justify-center rounded-md text-[13px] font-semibold transition ${
                      hour === h
                        ? 'bg-[#0f5f92] text-white'
                        : 'text-slate-700 hover:bg-[#eef6fb] hover:text-[#0f5f92]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-center text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Min
              </p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-1">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinute(m)
                      commit(hour, m, meridian)
                    }}
                    className={`flex h-8 w-full items-center justify-center rounded-md text-[13px] font-semibold transition ${
                      minute === m
                        ? 'bg-[#0f5f92] text-white'
                        : 'text-slate-700 hover:bg-[#eef6fb] hover:text-[#0f5f92]'
                    }`}
                  >
                    {`${m}`.padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-center text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                AM/PM
              </p>
              <div className="flex flex-col gap-1.5">
                {(['AM', 'PM'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMeridian(item)
                      commit(hour, minute, item)
                    }}
                    className={`h-11 w-14 rounded-lg text-[13px] font-bold transition ${
                      meridian === item
                        ? 'bg-[#0f5f92] text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-[#0f5f92]/35 hover:bg-[#eef6fb]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-[#fbfcfd] px-3 py-2">
            <span className="text-[12px] font-semibold text-[#0f5f92]">
              {formatTimeValue(hour, minute, meridian)}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 rounded-lg bg-[#0f5f92] px-3 text-[12px] font-semibold text-white hover:brightness-110"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
