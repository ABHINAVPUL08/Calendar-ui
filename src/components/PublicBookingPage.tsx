import { useMemo, useState } from 'react'
import type { AppointmentType } from '../types'
import { formatTime, setTimeForDate, toDateInputValue } from '../date-utils'

type Props = {
  practitionerName: string
  types: AppointmentType[]
  defaultDate: Date
  onClose: () => void
  onRequest: (input: {
    patientName: string
    appointmentTypeId: string
    date: string
    startTime: string
    endTime: string
  }) => void
}

const SLOT_LABELS = ['9:00 AM', '9:30 AM', '10:00 AM', '2:00 PM', '2:30 PM', '4:00 PM']

const addMinutesToTimeLabel = (timeLabel: string, minutes: number): string => {
  const base = setTimeForDate(new Date(2000, 0, 1), timeLabel)
  base.setMinutes(base.getMinutes() + minutes)
  return formatTime(base)
}

export const PublicBookingPage = ({
  practitionerName,
  types,
  defaultDate,
  onClose,
  onRequest,
}: Props) => {
  const bookable = types.filter((type) => type.id !== 'busy-external')
  const [typeId, setTypeId] = useState(bookable[0]?.id ?? '')
  const [date, setDate] = useState(toDateInputValue(defaultDate))
  const [slot, setSlot] = useState(SLOT_LABELS[0])
  const [patientName, setPatientName] = useState('')
  const selected = bookable.find((type) => type.id === typeId)
  const duration = selected?.baseDurationMin ?? 30
  const canSubmit = patientName.trim().length > 1 && !!typeId && !!slot

  const endTime = useMemo(() => addMinutesToTimeLabel(slot, duration), [slot, duration])

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#eef3f8]">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(16,40,70,0.16)] ring-1 ring-slate-200/80">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Book a visit
            </p>
            <h2 className="mt-1 text-[20px] font-bold tracking-tight text-slate-900">
              {practitionerName}
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Pick a type and time. Your request stays pending until the practice confirms it.
            </p>
            <p className="mt-2 inline-flex rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/80">
              GoHighLevel workflow will start when this is requested
            </p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Visit type</span>
              <div className="space-y-1.5">
                {bookable.map((type) => {
                  const active = type.id === typeId
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setTypeId(type.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-[#0f5f92] bg-[#eef6fb]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: type.color }} />
                      <span className="flex-1 text-[13px] font-semibold text-slate-800">{type.name}</span>
                      <span className="text-[12px] text-slate-500">{type.baseDurationMin ?? 30} min</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Date</span>
              <input
                type="date"
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Open times</span>
              <div className="flex flex-wrap gap-2">
                {SLOT_LABELS.map((label) => {
                  const active = slot === label
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSlot(label)}
                      className={`h-9 rounded-lg px-3 text-[12px] font-semibold transition ${
                        active
                          ? 'bg-[#0f5f92] text-white'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-white'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Your name</span>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="First and last name"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg px-4 text-[13px] font-semibold text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return
                onRequest({
                  patientName: patientName.trim(),
                  appointmentTypeId: typeId,
                  date,
                  startTime: slot,
                  endTime,
                })
              }}
              className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              Request {endTime ? `${slot} – ${endTime}` : 'appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
