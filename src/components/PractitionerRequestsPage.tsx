import { formatTime } from '../date-utils'
import { practitioners } from '../constants'
import type { AppointmentType, CalendarEvent } from '../types'

type Props = {
  requests: CalendarEvent[]
  types: AppointmentType[]
  onBack: () => void
  onOpenVisit: (event: CalendarEvent) => void
  onApprove: (event: CalendarEvent) => void
  onDecline: (event: CalendarEvent) => void
}

const visitMode = (event: CalendarEvent) => {
  const notes = event.notes.toLowerCase()
  if (notes.includes('telehealth')) return 'Telehealth'
  if (notes.includes('phone')) return 'Phone'
  if (event.location === 'Virtual') return 'Telehealth'
  return 'In-person'
}

export const PractitionerRequestsPage = ({
  requests,
  types,
  onBack,
  onOpenVisit,
  onApprove,
  onDecline,
}: Props) => {
  return (
    <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#f7fafc]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-[13px] font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Calendar
          </button>
          <h2 className="mb-1 text-[26px] font-bold tracking-tight text-slate-900">Requests</h2>
          <p className="mb-5 text-[13px] text-slate-500">
            Patient booking requests waiting for your approval.
          </p>

          {requests.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-slate-200">
              <p className="text-[15px] font-semibold text-slate-800">No pending requests</p>
              <p className="mt-1 text-[13px] text-slate-500">New patient bookings will show up here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((eventItem) => {
                const type = types.find((item) => item.id === eventItem.appointmentTypeId)
                const clinician = practitioners.find((item) => item.id === eventItem.practitionerId)
                const start = new Date(eventItem.start)
                const mode = visitMode(eventItem)
                return (
                  <article
                    key={eventItem.id}
                    className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-slate-200/80"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => onOpenVisit(eventItem)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] font-bold text-slate-900">{type?.name ?? 'Visit'}</h3>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                          Pending
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] font-semibold text-slate-700">{eventItem.patientName}</p>
                      <p className="mt-1.5 text-[13px] text-slate-600">
                        {start.toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        , {formatTime(start)}
                        {clinician ? ` · ${clinician.name}` : ''}
                        {` · ${mode}`}
                      </p>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="h-9 rounded-lg bg-[#0f5f92] px-3 text-[12px] font-semibold text-white hover:brightness-110"
                        onClick={() => onApprove(eventItem)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
                        onClick={() => onDecline(eventItem)}
                      >
                        Decline
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
