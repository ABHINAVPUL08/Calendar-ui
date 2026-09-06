import { useMemo, useState } from 'react'
import { SLOT_MINUTES, bookablePractitioners, patientVisitTypesForPractitioner } from '../constants'
import { endOfDay, formatTime, isSameDay, startOfWeek } from '../date-utils'
import type { AppointmentType, AvailabilityBlock, CalendarEvent, Practitioner } from '../types'
import { PractitionerAvatar } from './PractitionerAvatar'

type Step = 'practitioner' | 'visit' | 'time' | 'mode' | 'preview'
type SlotView = 'day' | 'week' | 'month'
type VisitMode = 'in-person' | 'telehealth' | 'phone'

type SlotOption = {
  start: Date
  end: Date
}

type Props = {
  patient: Practitioner
  types: AppointmentType[]
  events: CalendarEvent[]
  availability: AvailabilityBlock[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onCancel: () => void
  onSend: (input: {
    practitionerId: string
    appointmentTypeId: string
    startTime: string
    endTime: string
    date: string
    location?: string
    mode: VisitMode
  }) => void
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'practitioner', label: 'Practitioner' },
  { id: 'visit', label: 'Visit type' },
  { id: 'time', label: 'Time' },
  { id: 'mode', label: 'How' },
  { id: 'preview', label: 'Confirm' },
]

const MODE_COPY: Record<VisitMode, { title: string; detail: string }> = {
  'in-person': { title: 'In-person', detail: 'At a clinic location.' },
  telehealth: { title: 'Telehealth', detail: 'Secure video visit.' },
  phone: { title: 'Phone', detail: 'Voice call with the practice.' },
}

const PRACTICE_LOCATIONS = ['North Clinic', 'West Clinic'] as const

const rangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) => startA < endB && endA > startB

const formatDuration = (minutes: number) => {
  if (minutes % 60 === 0) return `${minutes / 60}h`
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes} min`
}

const toDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const snapToStep = (date: Date) => {
  const next = new Date(date)
  const minutes = next.getMinutes()
  next.setMinutes(Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES, 0, 0)
  return next
}

const buildSlotsForDay = ({
  day,
  durationMin,
  practitionerId,
  typeId,
  availability,
  events,
}: {
  day: Date
  durationMin: number
  practitionerId: string
  typeId: string
  availability: AvailabilityBlock[]
  events: CalendarEvent[]
}): SlotOption[] => {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const dayEnd = endOfDay(day)
  const opens = availability.filter((block) => {
    if (block.practitionerId !== practitionerId || block.status !== 'available') return false
    if (block.appointmentTypeId && block.appointmentTypeId !== typeId) return false
    return rangesOverlap(new Date(block.start), new Date(block.end), dayStart, dayEnd)
  })
  const busyStarts = [
    ...events
      .filter((event) => event.practitionerId === practitionerId)
      .map((event) => ({ start: new Date(event.start), end: new Date(event.end) })),
    ...availability
      .filter(
        (block) =>
          block.practitionerId === practitionerId && (block.status === 'busy' || block.status === 'blocked'),
      )
      .map((block) => ({ start: new Date(block.start), end: new Date(block.end) })),
  ]

  const durationMs = durationMin * 60 * 1000
  const stepMs = SLOT_MINUTES * 60 * 1000
  const slots: SlotOption[] = []

  opens.forEach((block) => {
    let cursor = snapToStep(new Date(Math.max(new Date(block.start).getTime(), dayStart.getTime())))
    if (cursor.getTime() < new Date(block.start).getTime()) {
      cursor = new Date(cursor.getTime() + stepMs)
    }
    const blockEnd = new Date(Math.min(new Date(block.end).getTime(), dayEnd.getTime()))
    while (cursor.getTime() + durationMs <= blockEnd.getTime()) {
      const end = new Date(cursor.getTime() + durationMs)
      const taken = busyStarts.some((busy) => rangesOverlap(cursor, end, busy.start, busy.end))
      if (!taken) slots.push({ start: new Date(cursor), end })
      cursor = new Date(cursor.getTime() + stepMs)
    }
  })

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime())
}

const weekDaysFrom = (date: Date) => {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

const monthDaysFrom = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const last = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: last }, (_, index) => new Date(year, month, index + 1))
}

export const PatientBookingFlow = ({
  patient,
  types,
  events,
  availability,
  selectedDate,
  onSelectDate,
  onCancel,
  onSend,
}: Props) => {
  const [step, setStep] = useState<Step>('practitioner')
  const [practitionerId, setPractitionerId] = useState(patient.primaryPractitionerId ?? '')
  const [visitTypeId, setVisitTypeId] = useState('')
  const [slotView, setSlotView] = useState<SlotView>('day')
  const [slotStartIso, setSlotStartIso] = useState('')
  const [mode, setMode] = useState<VisitMode | ''>('')
  const [location, setLocation] = useState('')

  const clinicians = bookablePractitioners
  const visitTypes = patientVisitTypesForPractitioner(types, practitionerId)
  const selectedPractitioner = clinicians.find((item) => item.id === practitionerId)
  const selectedVisit = visitTypes.find((item) => item.id === visitTypeId)
  const durationMin = selectedVisit?.baseDurationMin ?? 30
  const modes = (selectedVisit?.modalities?.length ? selectedVisit.modalities : ['in-person']) as VisitMode[]
  const needsLocation = mode === 'in-person'
  const locationOptions = Array.from(
    new Set(
      [selectedPractitioner?.location, ...PRACTICE_LOCATIONS].filter(
        (item) => item && item !== 'Virtual',
      ),
    ),
  )

  const daySlots = useMemo(() => {
    if (!practitionerId || !visitTypeId) return []
    return buildSlotsForDay({
      day: selectedDate,
      durationMin,
      practitionerId,
      typeId: visitTypeId,
      availability,
      events,
    })
  }, [availability, durationMin, events, practitionerId, selectedDate, visitTypeId])

  const weekSlotGroups = useMemo(() => {
    if (!practitionerId || !visitTypeId) return []
    return weekDaysFrom(selectedDate).map((day) => ({
      day,
      slots: buildSlotsForDay({
        day,
        durationMin,
        practitionerId,
        typeId: visitTypeId,
        availability,
        events,
      }),
    }))
  }, [availability, durationMin, events, practitionerId, selectedDate, visitTypeId])

  const monthSlotGroups = useMemo(() => {
    if (!practitionerId || !visitTypeId) return []
    return monthDaysFrom(selectedDate).map((day) => ({
      day,
      slots: buildSlotsForDay({
        day,
        durationMin,
        practitionerId,
        typeId: visitTypeId,
        availability,
        events,
      }),
    }))
  }, [availability, durationMin, events, practitionerId, selectedDate, visitTypeId])

  const selectedSlot = useMemo(() => {
    const pool =
      slotView === 'week'
        ? weekSlotGroups.flatMap((group) => group.slots)
        : slotView === 'month'
          ? monthSlotGroups.flatMap((group) => group.slots)
          : daySlots
    return pool.find((slot) => slot.start.toISOString() === slotStartIso) ?? null
  }, [daySlots, monthSlotGroups, slotStartIso, slotView, weekSlotGroups])

  const openCounts = useMemo(() => {
    const horizon = new Date(selectedDate)
    horizon.setDate(horizon.getDate() + 14)
    const counts: Record<string, number> = {}
    clinicians.forEach((person) => {
      let count = 0
      const cursor = new Date(selectedDate)
      cursor.setHours(0, 0, 0, 0)
      while (cursor <= horizon) {
        count += buildSlotsForDay({
          day: cursor,
          durationMin: 30,
          practitionerId: person.id,
          typeId: visitTypes[0]?.id ?? 'follow-up',
          availability,
          events,
        }).length
        cursor.setDate(cursor.getDate() + 1)
      }
      counts[person.id] = count
    })
    return counts
  }, [availability, clinicians, events, selectedDate, visitTypes])

  const stepIndex = STEPS.findIndex((item) => item.id === step)
  const canContinue =
    (step === 'practitioner' && !!practitionerId) ||
    (step === 'visit' && !!visitTypeId) ||
    (step === 'time' && !!selectedSlot) ||
    (step === 'mode' && !!mode && (!needsLocation || !!location)) ||
    step === 'preview'

  const goNext = () => {
    if (step === 'practitioner' && practitionerId) setStep('visit')
    else if (step === 'visit' && visitTypeId) setStep('time')
    else if (step === 'time' && selectedSlot) {
      setMode('')
      setLocation('')
      setStep('mode')
    } else if (step === 'mode' && mode && (!needsLocation || location)) setStep('preview')
  }

  const goBack = () => {
    if (step === 'practitioner') onCancel()
    else if (step === 'visit') setStep('practitioner')
    else if (step === 'time') setStep('visit')
    else if (step === 'mode') setStep('time')
    else setStep('mode')
  }

  const send = () => {
    if (!selectedPractitioner || !selectedVisit || !selectedSlot || !mode) return
    if (needsLocation && !location) return
    onSend({
      practitionerId: selectedPractitioner.id,
      appointmentTypeId: selectedVisit.id,
      startTime: formatTime(selectedSlot.start),
      endTime: formatTime(selectedSlot.end),
      date: toDateKey(selectedSlot.start),
      location: needsLocation ? location : undefined,
      mode,
    })
  }

  const renderSlotButton = (slot: SlotOption) => {
    const active = slot.start.toISOString() === slotStartIso
    return (
      <button
        key={slot.start.toISOString()}
        type="button"
        onClick={() => {
          setSlotStartIso(slot.start.toISOString())
          onSelectDate(slot.start)
        }}
        className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
          active
            ? 'bg-[#0f5f92] text-white shadow-[0_1px_2px_rgba(15,95,146,0.35)]'
            : 'bg-[#eef6fb] text-[#0f5f92] ring-1 ring-[#0f5f92]/15 hover:bg-white'
        }`}
      >
        {formatTime(slot.start)} – {formatTime(slot.end)}
      </button>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7fafc]">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={goBack}
          className="mb-3 text-[12px] font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Back
        </button>
        <ol className="flex flex-wrap items-center gap-2">
          {STEPS.map((item, index) => {
            const done = index < stepIndex
            const active = item.id === step
            return (
              <li key={item.id} className="flex items-center gap-2">
                <span
                  className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-[#0f5f92] text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? '✓' : index + 1}
                </span>
                <span
                  className={`text-[12px] font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 ? <span className="mx-1 h-px w-6 bg-slate-200" /> : null}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          {step === 'practitioner' ? (
            <>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Choose a practitioner</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Your primary practitioner is marked when the practice has assigned one.
              </p>
              <div className="space-y-2">
                {clinicians.map((person) => {
                  const active = person.id === practitionerId
                  const isPrimary = person.id === patient.primaryPractitionerId
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        setPractitionerId(person.id)
                        setVisitTypeId('')
                        setSlotStartIso('')
                        setMode('')
                        setLocation('')
                        setStep('visit')
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                        active
                          ? 'border-[#0f5f92] bg-[#eef6fb]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <PractitionerAvatar name={person.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-bold text-slate-900">{person.name}</p>
                          {isPrimary ? (
                            <span className="rounded-full bg-[#0f5f92] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                              Primary
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {person.role}
                          {(openCounts[person.id] ?? 0) > 0
                            ? ` · ${openCounts[person.id]} open times in the next 2 weeks`
                            : ' · Check upcoming availability'}
                        </p>
                      </div>
                      <span className="text-slate-300">›</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          {step === 'visit' ? (
            <>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">What kind of visit?</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Types offered by {selectedPractitioner?.name ?? 'this clinician'}. Duration sets the length of each
                time slot on the next step.
              </p>
              <div className="space-y-2">
                {visitTypes.map((type) => {
                  const active = type.id === visitTypeId
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setVisitTypeId(type.id)
                        setSlotStartIso('')
                        setMode('')
                        setLocation('')
                        setStep('time')
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                        active
                          ? 'border-[#0f5f92] bg-[#eef6fb]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: type.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-bold text-slate-900">{type.name}</p>
                          {type.scope === 'private' ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              This clinician
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[12px] text-slate-500">
                          {formatDuration(type.baseDurationMin ?? 30)}
                          {type.modalities?.length ? ` · ${type.modalities.map((item) => MODE_COPY[item].title).join(' / ')}` : ''}
                        </p>
                      </div>
                      <span className="text-slate-300">›</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          {step === 'time' ? (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Pick a time</h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    {selectedVisit?.name} is {formatDuration(durationMin)}, so each slot is that long
                    {selectedSlot ? '' : '.'} Open times only — booked, pending, and blocked time is removed.
                  </p>
                </div>
                <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Slot view">
                  {(['day', 'week', 'month'] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setSlotView(view)}
                      className={`h-8 rounded-md px-3 text-[12px] font-semibold ${
                        slotView === view ? 'bg-[#0f5f92] text-white' : 'text-slate-600'
                      }`}
                    >
                      {view === 'day' ? 'Day' : view === 'week' ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
              </div>

              {slotView === 'day' ? (
                <div>
                  <p className="mb-3 text-[13px] font-semibold text-slate-700">
                    {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  {daySlots.length ? (
                    <div className="flex flex-wrap gap-2">{daySlots.map(renderSlotButton)}</div>
                  ) : (
                    <p className="rounded-xl bg-white px-4 py-6 text-[13px] text-slate-500 ring-1 ring-slate-200">
                      No open {formatDuration(durationMin)} slots on this date. Pick another day on the calendar.
                    </p>
                  )}
                </div>
              ) : slotView === 'week' ? (
                <div className="space-y-4">
                  {weekSlotGroups.map((group) => (
                    <div key={group.day.toISOString()}>
                      <p className="mb-2 text-[13px] font-semibold text-slate-700">
                        {group.day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      {group.slots.length ? (
                        <div className="flex flex-wrap gap-2">{group.slots.map(renderSlotButton)}</div>
                      ) : (
                        <p className="text-[12px] text-slate-400">No open slots</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[13px] font-semibold text-slate-700">
                    {selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </p>
                  {monthSlotGroups.some((group) => group.slots.length > 0) ? (
                    monthSlotGroups
                      .filter((group) => group.slots.length > 0)
                      .map((group) => (
                        <div key={group.day.toISOString()}>
                          <p
                            className={`mb-2 text-[13px] font-semibold ${
                              isSameDay(group.day, selectedDate) ? 'text-[#0f5f92]' : 'text-slate-700'
                            }`}
                          >
                            {group.day.toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <div className="flex flex-wrap gap-2">{group.slots.map(renderSlotButton)}</div>
                        </div>
                      ))
                  ) : (
                    <p className="rounded-xl bg-white px-4 py-6 text-[13px] text-slate-500 ring-1 ring-slate-200">
                      No open {formatDuration(durationMin)} slots this month. Try another month on the calendar.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}

          {step === 'mode' ? (
            <>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">How would you like to meet?</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Options come from this visit type. Location is only asked for in-person visits.
              </p>
              <div className="space-y-2">
                {modes.map((option) => {
                  const active = mode === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setMode(option)
                        if (option !== 'in-person') setLocation('')
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition ${
                        active ? 'border-[#0f5f92] bg-[#eef6fb]' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-[15px] font-bold text-slate-900">{MODE_COPY[option].title}</p>
                        <p className="text-[12px] text-slate-500">{MODE_COPY[option].detail}</p>
                      </div>
                      {active ? <span className="text-[#0f5f92]">✓</span> : <span className="text-slate-300">›</span>}
                    </button>
                  )
                })}
              </div>
              {needsLocation ? (
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Location</span>
                  <select
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  >
                    <option value="">Choose a clinic location</option>
                    {locationOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </>
          ) : null}

          {step === 'preview' ? (
            <>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Review your request</h2>
              <div className="mt-4 space-y-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200">
                <Row label="Visit type" value={selectedVisit?.name ?? '—'} />
                <Row label="Practitioner" value={selectedPractitioner?.name ?? '—'} />
                <Row
                  label="When"
                  value={
                    selectedSlot
                      ? `${selectedSlot.start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${formatTime(selectedSlot.start)}`
                      : '—'
                  }
                />
                <Row label="Duration" value={formatDuration(durationMin)} />
                <Row label="How" value={mode ? MODE_COPY[mode].title : '—'} />
                {needsLocation ? <Row label="Location" value={location} /> : null}
                <Row label="Patient" value={patient.name} />
              </div>
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800 ring-1 ring-amber-200">
                This sends a request. Your time is held as pending until the practice confirms — it is not booked yet.
              </p>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
        {step === 'preview' ? (
          <>
            <button
              type="button"
              onClick={goBack}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600"
            >
              Back
            </button>
            <button
              type="button"
              onClick={send}
              className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white hover:brightness-110"
            >
              Send request
            </button>
          </>
        ) : step === 'practitioner' || step === 'visit' ? null : (
          <button
            type="button"
            disabled={!canContinue}
            onClick={goNext}
            className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-40"
          >
            {step === 'mode' ? 'Review request →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
    <span className="text-[12px] font-semibold text-slate-400">{label}</span>
    <span className="text-right text-[13px] font-semibold text-slate-800">{value}</span>
  </div>
)
