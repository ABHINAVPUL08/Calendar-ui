import { useState } from 'react'
import { formatTime } from '../date-utils'
import { practitioners } from '../constants'
import type { AppointmentType, CalendarEvent } from '../types'

type Props = {
  appointments: CalendarEvent[]
  types: AppointmentType[]
  onClose: () => void
  onSchedule: () => void
  onOpenVisit: (event: CalendarEvent) => void
  onCancelVisit: (eventId: string, label: string) => void
}

const visitMode = (event: CalendarEvent) => {
  const notes = event.notes.toLowerCase()
  if (notes.includes('telehealth')) return 'Telehealth'
  if (notes.includes('phone')) return 'Phone'
  if (event.location === 'Virtual') return 'Telehealth'
  return 'In-person'
}

const iconClass = 'size-4 shrink-0 text-slate-400'

const CalendarIcon = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V7M16 3.5V7M3.5 10h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

const PersonIcon = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M5.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
)

const VideoIcon = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="7" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M15 10.5 20.5 7v10L15 13.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)

const PhoneIcon = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 3.5h3.2l1.2 3.2-2 1.6a12 12 0 0 0 6.3 6.3l1.6-2 3.2 1.2V17a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 5.7 2 2 0 0 1 7 3.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
)

const PinIcon = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10.8" r="2.1" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

const ModeIcon = ({ mode }: { mode: string }) => {
  if (mode === 'Telehealth') return <VideoIcon />
  if (mode === 'Phone') return <PhoneIcon />
  return <PinIcon />
}

export const PatientAppointmentsPage = ({
  appointments,
  types,
  onClose,
  onSchedule,
  onOpenVisit,
  onCancelVisit,
}: Props) => {
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; label: string } | null>(null)

  return (
    <>
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(16,28,40,0.45)] p-4">
      <div
        className="flex h-[min(720px,90vh)] w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_60px_rgba(16,28,40,0.3)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-appointments-title"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 pt-5 pb-3">
          <div className="relative mb-1 flex items-center justify-center">
            <h2 id="my-appointments-title" className="text-center text-[16px] font-semibold text-[#1c2b3a]">
              My appointments
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[22px] leading-none text-[#93a2b1] hover:bg-slate-50 hover:text-[#3c4b5a]"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={onSchedule}
              className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(15,95,146,0.22)] hover:brightness-110"
            >
              + Schedule a visit
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-slate-200">
              <p className="text-[15px] font-semibold text-slate-800">No appointments yet</p>
              <p className="mt-1 text-[13px] text-slate-500">Book a visit to send a request to the practice.</p>
              <button
                type="button"
                onClick={onSchedule}
                className="mt-4 h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white"
              >
                Book appointment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((eventItem) => {
                const type = types.find((item) => item.id === eventItem.appointmentTypeId)
                const pending = eventItem.bookingStatus === 'pending'
                const rejected = eventItem.bookingStatus === 'rejected'
                const cancelled = eventItem.bookingStatus === 'cancelled'
                const clinician = practitioners.find((item) => item.id === eventItem.practitionerId)
                const start = new Date(eventItem.start)
                const mode = visitMode(eventItem)
                const label = `${type?.name ?? 'Visit'} · ${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                const canCancel = !cancelled && !rejected
                return (
                  <article
                    key={eventItem.id}
                    className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl bg-[#f3f6f9] px-4 py-3.5 ring-1 ring-slate-200/80 transition hover:bg-white hover:ring-[#0f5f92]/30"
                    onClick={() => onOpenVisit(eventItem)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenVisit(eventItem)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] font-bold text-slate-900">{type?.name ?? 'Visit'}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            cancelled
                              ? 'bg-slate-200 text-slate-700'
                              : pending
                                ? 'bg-amber-100 text-amber-800'
                                : rejected
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cancelled
                            ? 'Cancelled'
                            : pending
                              ? 'Pending'
                              : rejected
                                ? 'Rejected'
                                : 'Approved'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarIcon />
                          {start.toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          , {formatTime(start)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <PersonIcon />
                          {clinician?.name ?? 'Practitioner'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <ModeIcon mode={mode} />
                          {mode}
                        </span>
                      </div>
                    </div>
                    {canCancel ? (
                      <button
                        type="button"
                        className="h-9 shrink-0 rounded-lg border border-rose-200 bg-white px-3 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
                        onClick={(event) => {
                          event.stopPropagation()
                          setConfirmCancel({ id: eventItem.id, label })
                        }}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>

      {confirmCancel ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4">
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-visit-title"
          >
            <h3 id="cancel-visit-title" className="text-[16px] font-bold text-slate-900">
              Cancel this appointment?
            </h3>
            <p className="mt-2 text-[13px] text-slate-600">
              {confirmCancel.label} will be marked cancelled. It will not be deleted.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600"
                onClick={() => setConfirmCancel(null)}
              >
                Keep appointment
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-rose-600 px-4 text-[13px] font-semibold text-white hover:brightness-110"
                onClick={() => {
                  onCancelVisit(confirmCancel.id, confirmCancel.label)
                  setConfirmCancel(null)
                }}
              >
                Cancel appointment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
