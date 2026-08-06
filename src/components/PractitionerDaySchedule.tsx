import { formatTime, isSameDay } from '../date-utils'
import { GRID_END_MINUTES, GRID_START_MINUTES, SLOT_MINUTES, availabilityColors } from '../constants'
import type { AppointmentType, AvailabilityBlock, CalendarEvent, Practitioner } from '../types'
import { PractitionerAvatar } from './PractitionerAvatar'

type TimelineItem = {
  id: string
  kind: 'available' | 'busy' | 'blocked' | 'appointment' | 'free'
  title: string
  subtitle?: string
  start: Date
  end: Date
}

type Props = {
  practitioner: Practitioner
  date: Date
  events: CalendarEvent[]
  availability: AvailabilityBlock[]
  appointmentTypes: AppointmentType[]
  onClose: () => void
  onOpenInCalendar: () => void
}

const buildTimeline = (
  practitionerId: string,
  date: Date,
  events: CalendarEvent[],
  availability: AvailabilityBlock[],
  appointmentTypes: AppointmentType[],
): TimelineItem[] => {
  const dayEvents = events.filter(
    (item) => item.practitionerId === practitionerId && isSameDay(new Date(item.start), date),
  )
  const dayAvailability = availability.filter(
    (item) => item.practitionerId === practitionerId && isSameDay(new Date(item.start), date),
  )

  const items: TimelineItem[] = [
    ...dayAvailability.map((block) => ({
      id: block.id,
      kind: block.status,
      title: block.status.toUpperCase(),
      subtitle: block.appointmentTypeId
        ? appointmentTypes.find((type) => type.id === block.appointmentTypeId)?.name
        : undefined,
      start: new Date(block.start),
      end: new Date(block.end),
    })),
    ...dayEvents.map((event) => {
      const type = appointmentTypes.find((item) => item.id === event.appointmentTypeId)
      return {
        id: event.id,
        kind: 'appointment' as const,
        title: event.isExternal ? 'Busy — External' : event.patientName,
        subtitle: type?.name,
        start: new Date(event.start),
        end: new Date(event.end),
      }
    }),
  ].sort((a, b) => +a.start - +b.start)

  // Derive uncovered free gaps inside the visible grid
  const occupied = items
    .map((item) => ({ start: +item.start, end: +item.end }))
    .sort((a, b) => a.start - b.start)

  const freeGaps: TimelineItem[] = []
  let cursor = new Date(date)
  cursor.setHours(0, 0, 0, 0)
  cursor = new Date(+cursor + GRID_START_MINUTES * 60_000)
  const dayEnd = new Date(date)
  dayEnd.setHours(0, 0, 0, 0)
  const endMs = +dayEnd + GRID_END_MINUTES * 60_000 + SLOT_MINUTES * 60_000

  for (const block of occupied) {
    if (block.start > +cursor + 14 * 60_000) {
      freeGaps.push({
        id: `free-${+cursor}`,
        kind: 'free',
        title: 'FREE',
        subtitle: 'No availability marked · open time',
        start: new Date(cursor),
        end: new Date(block.start),
      })
    }
    cursor = new Date(Math.max(+cursor, block.end))
  }
  if (+cursor < endMs - 14 * 60_000) {
    freeGaps.push({
      id: `free-end-${+cursor}`,
      kind: 'free',
      title: 'FREE',
      subtitle: 'No availability marked · open time',
      start: new Date(cursor),
      end: new Date(endMs),
    })
  }

  return [...items, ...freeGaps].sort((a, b) => +a.start - +b.start)
}

const tone = (kind: TimelineItem['kind']) => {
  if (kind === 'available') return { bg: availabilityColors.available, text: 'text-emerald-900' }
  if (kind === 'busy') return { bg: availabilityColors.busy, text: 'text-slate-700' }
  if (kind === 'blocked') return { bg: availabilityColors.blocked, text: 'text-slate-700' }
  if (kind === 'appointment') return { bg: '#0f5f92', text: 'text-white' }
  return { bg: '#eef6fb', text: 'text-slate-600' }
}

export const PractitionerDaySchedule = ({
  practitioner,
  date,
  events,
  availability,
  appointmentTypes,
  onClose,
  onOpenInCalendar,
}: Props) => {
  const timeline = buildTimeline(practitioner.id, date, events, availability, appointmentTypes)
  const booked = timeline.filter((item) => item.kind === 'appointment').length
  const available = timeline.filter((item) => item.kind === 'available').length
  const busy = timeline.filter((item) => item.kind === 'busy' || item.kind === 'blocked').length

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(16,40,70,0.22)] ring-1 ring-slate-200/80">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <PractitionerAvatar name={practitioner.name} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{practitioner.name}</h2>
              <p className="text-[13px] text-slate-500">
                {practitioner.role} · {practitioner.location}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-slate-400">
                {date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-5 py-3 text-center">
          <div className="rounded-xl bg-emerald-50 px-2 py-2">
            <p className="text-[11px] font-semibold uppercase text-emerald-700">Available</p>
            <p className="text-lg font-bold text-emerald-900">{available}</p>
          </div>
          <div className="rounded-xl bg-slate-100 px-2 py-2">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Busy / Blocked</p>
            <p className="text-lg font-bold text-slate-800">{busy}</p>
          </div>
          <div className="rounded-xl bg-[#e8f1f8] px-2 py-2">
            <p className="text-[11px] font-semibold uppercase text-[#0f5f92]">Appointments</p>
            <p className="text-lg font-bold text-[#0f5f92]">{booked}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            Full day timeline
          </p>
          {timeline.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No schedule blocks for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {timeline.map((item) => {
                const style = tone(item.kind)
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl px-3 py-2.5 ${style.text}`}
                    style={{ background: style.bg }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-bold">{item.title}</p>
                        {item.subtitle ? (
                          <p className="text-[12px] opacity-90">{item.subtitle}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-[12px] font-semibold opacity-90">
                        {formatTime(item.start)} – {formatTime(item.end)}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] opacity-75">
                      {Math.round((+item.end - +item.start) / 60000)} minutes
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onOpenInCalendar}
            className="h-10 rounded-lg bg-[#0f5f92] px-4 text-sm font-semibold text-white hover:brightness-110"
          >
            Open in calendar
          </button>
        </div>
      </div>
    </div>
  )
}
