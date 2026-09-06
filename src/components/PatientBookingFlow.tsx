import { useEffect, useMemo, useRef, useState } from 'react'
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
  { id: 'visit', label: 'Type' },
  { id: 'time', label: 'Date & time' },
  { id: 'mode', label: 'Mode' },
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

const monthGridFrom = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const bookingToday = startOfDay(
  new Date(Math.min(Date.now(), new Date(2026, 6, 28).getTime())),
)

const isPastDay = (date: Date) => startOfDay(date) < bookingToday

const slotPeriod = (slot: SlotOption): 'Morning' | 'Afternoon' | 'Evening' => {
  const hour = slot.start.getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

const groupSlotsByPeriod = (slots: SlotOption[]) =>
  (['Morning', 'Afternoon', 'Evening'] as const)
    .map((label) => ({ label, slots: slots.filter((slot) => slotPeriod(slot) === label) }))
    .filter((group) => group.slots.length > 0)

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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  )
  const pickerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (step !== 'time') setPickerOpen(false)
  }, [step])

  useEffect(() => {
    if (step === 'time' && isPastDay(selectedDate)) {
      onSelectDate(bookingToday)
      setSlotStartIso('')
    }
  }, [onSelectDate, selectedDate, step])

  useEffect(() => {
    if (!pickerOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && pickerRef.current?.contains(target)) return
      setPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [pickerOpen])

  useEffect(() => {
    setPickerMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [selectedDate])

  const pickerDays = useMemo(() => monthGridFrom(pickerMonth), [pickerMonth])

  const daysWithSlots = useMemo(() => {
    if (!practitionerId || !visitTypeId) return new Set<string>()
    const keys = new Set<string>()
    monthDaysFrom(pickerMonth).forEach((day) => {
      const slots = buildSlotsForDay({
        day,
        durationMin,
        practitionerId,
        typeId: visitTypeId,
        availability,
        events,
      })
      if (slots.length) keys.add(toDateKey(day))
    })
    return keys
  }, [availability, durationMin, events, pickerMonth, practitionerId, visitTypeId])

  const jumpToDate = (day: Date, closePicker = true) => {
    if (isPastDay(day)) return
    onSelectDate(day)
    setSlotStartIso('')
    if (closePicker) setPickerOpen(false)
  }

  const shiftPeriod = (direction: number) => {
    const next = new Date(selectedDate)
    if (slotView === 'week') next.setDate(next.getDate() + 7 * direction)
    else if (slotView === 'month') next.setMonth(next.getMonth() + direction)
    else next.setDate(next.getDate() + direction)
    if (isPastDay(next)) {
      jumpToDate(bookingToday, false)
      return
    }
    jumpToDate(next, false)
  }

  const periodLabel =
    slotView === 'month'
      ? selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
      : slotView === 'week'
        ? `Week of ${startOfWeek(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
        : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

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
    (step === 'time' && !!selectedSlot && !isPastDay(selectedSlot.start)) ||
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
    if (step === 'practitioner') return
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
        {formatTime(slot.start)}
      </button>
    )
  }

  const headerIcon =
    'grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35'

  const stepHeading = (title: string) => (
    <div className="relative flex min-h-9 items-center justify-center">
      <button
        type="button"
        className={`${headerIcon} absolute left-0 top-1/2 -translate-y-1/2`}
        title="Back"
        aria-label="Previous step"
        disabled={step === 'practitioner'}
        onClick={goBack}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h3 className="px-12 text-center text-[22px] font-bold tracking-tight text-slate-900">{title}</h3>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(16,28,40,0.45)] p-4">
      <div
      className="flex h-[min(720px,90vh)] w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_60px_rgba(16,28,40,0.3)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-appointment-title"
      >
      <div className="shrink-0 border-b border-slate-100 px-5 pt-5 pb-3">
        <div className="relative mb-3 flex items-center justify-center">
          <h2 id="book-appointment-title" className="text-center text-[16px] font-semibold text-[#1c2b3a]">
            Book appointment
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[22px] leading-none text-[#93a2b1] hover:bg-slate-50 hover:text-[#3c4b5a]"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>
        <ol className="flex flex-wrap items-center justify-center gap-2">
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

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4">
        <div className="mx-auto w-full max-w-2xl">
          {step === 'practitioner' ? (
            <>
              {stepHeading('Choose a practitioner')}
              <div className="mt-5 space-y-2">
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
              {stepHeading('Type')}
              <div className="mt-5 space-y-2">
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
              <div className="mb-4">
                {stepHeading('Select date & time')}
                <div className="mt-3 flex justify-start">
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
              </div>

              <div className="relative mb-4" ref={pickerRef}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                    aria-label={
                      slotView === 'week' ? 'Previous week' : slotView === 'month' ? 'Previous month' : 'Previous day'
                    }
                    disabled={isPastDay(
                      slotView === 'week'
                        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 7)
                        : slotView === 'month'
                          ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, selectedDate.getDate())
                          : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1),
                    )}
                    onClick={() => shiftPeriod(-1)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#0f5f92]/40"
                    aria-expanded={pickerOpen}
                    aria-label="Open calendar"
                    onClick={() => setPickerOpen((open) => !open)}
                  >
                    <span className="truncate text-center text-[13px] font-semibold text-slate-800">{periodLabel}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#0f5f92]" aria-hidden>
                      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    aria-label={slotView === 'week' ? 'Next week' : slotView === 'month' ? 'Next month' : 'Next day'}
                    onClick={() => shiftPeriod(1)}
                  >
                    ›
                  </button>
                </div>

                {pickerOpen ? (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
                    <div className="mb-2 flex items-center justify-between">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-lg text-lg text-slate-500 hover:bg-slate-50"
                        aria-label="Previous month"
                        onClick={() =>
                          setPickerMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                        }
                      >
                        ‹
                      </button>
                      <strong className="text-[13px] font-bold text-slate-900">
                        {pickerMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                      </strong>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-lg text-lg text-slate-500 hover:bg-slate-50"
                        aria-label="Next month"
                        onClick={() =>
                          setPickerMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                        }
                      >
                        ›
                      </button>
                    </div>
                    <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                        <span key={`${label}-${index}`}>{label}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                      {pickerDays.map((day) => {
                        const inMonth = day.getMonth() === pickerMonth.getMonth()
                        const selected = isSameDay(day, selectedDate)
                        const hasSlots = daysWithSlots.has(toDateKey(day))
                        const past = isPastDay(day)
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={past}
                            onClick={() => jumpToDate(day)}
                            className={`relative mx-auto flex size-8 items-center justify-center rounded-full text-[12px] font-semibold ${
                              past
                                ? 'cursor-not-allowed text-slate-300 line-through'
                                : selected
                                  ? 'bg-[#0f5f92] text-white'
                                  : inMonth
                                    ? 'text-slate-800 hover:bg-[#eef6fb]'
                                    : 'text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {day.getDate()}
                            {hasSlots && !selected && !past ? (
                              <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-500" />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Green dots have open slots for this visit type.</p>
                  </div>
                ) : null}
              </div>

              {slotView === 'day' ? (
                <div>
                  {isPastDay(selectedDate) ? (
                    <p className="rounded-xl bg-white px-4 py-6 text-center text-[13px] text-slate-500 ring-1 ring-slate-200">
                      Past dates cannot be booked. Choose today or a later day.
                    </p>
                  ) : daySlots.length ? (
                    <div className="space-y-4">
                      {groupSlotsByPeriod(daySlots).map((group) => (
                        <div key={group.label}>
                          <p className="mb-2 text-center text-[13px] font-bold text-slate-800">{group.label}</p>
                          <div className="flex flex-wrap justify-center gap-2">{group.slots.map(renderSlotButton)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-white px-4 py-6 text-center text-[13px] text-slate-500 ring-1 ring-slate-200">
                      No open times on this date. Pick another day on the calendar.
                    </p>
                  )}
                </div>
              ) : slotView === 'week' ? (
                <div className="space-y-4">
                  {weekSlotGroups.filter((group) => !isPastDay(group.day)).map((group) => (
                    <div key={group.day.toISOString()}>
                      <p className="mb-2 text-center text-[13px] font-semibold text-slate-700">
                        {group.day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      {group.slots.length ? (
                        <div className="space-y-3">
                          {groupSlotsByPeriod(group.slots).map((period) => (
                            <div key={period.label}>
                              <p className="mb-1.5 text-center text-[12px] font-bold text-slate-600">{period.label}</p>
                              <div className="flex flex-wrap justify-center gap-2">
                                {period.slots.map(renderSlotButton)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-[12px] text-slate-400">No open slots</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {monthSlotGroups.some((group) => group.slots.length > 0 && !isPastDay(group.day)) ? (
                    monthSlotGroups
                      .filter((group) => group.slots.length > 0 && !isPastDay(group.day))
                      .map((group) => (
                        <div key={group.day.toISOString()}>
                          <p
                            className={`mb-2 text-center text-[13px] font-semibold ${
                              isSameDay(group.day, selectedDate) ? 'text-[#0f5f92]' : 'text-slate-700'
                            }`}
                          >
                            {group.day.toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <div className="space-y-3">
                            {groupSlotsByPeriod(group.slots).map((period) => (
                              <div key={period.label}>
                                <p className="mb-1.5 text-center text-[12px] font-bold text-slate-600">{period.label}</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                  {period.slots.map(renderSlotButton)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="rounded-xl bg-white px-4 py-6 text-center text-[13px] text-slate-500 ring-1 ring-slate-200">
                      No open times this month. Try another month on the calendar.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}

          {step === 'mode' ? (
            <>
              {stepHeading('Mode of appointment')}
              <div className="mt-5 space-y-2">
                {modes.map((option) => {
                  const active = mode === option
                  return (
                    <div
                      key={option}
                      className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5 ${
                        active ? 'border-[#0f5f92] bg-[#eef6fb]' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMode(option)
                          if (option !== 'in-person') setLocation('')
                        }}
                        className="flex min-w-0 flex-1 items-center justify-between text-left"
                      >
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">{MODE_COPY[option].title}</p>
                          <p className="text-[12px] text-slate-500">{MODE_COPY[option].detail}</p>
                        </div>
                        {option === 'in-person' && active ? null : active ? (
                          <span className="text-[#0f5f92]">✓</span>
                        ) : (
                          <span className="text-slate-300">›</span>
                        )}
                      </button>
                      {option === 'in-person' && active ? (
                        <label className="flex min-w-[200px] flex-1 items-center gap-2">
                          <span className="shrink-0 text-[12px] font-semibold text-slate-600">Location</span>
                          <select
                            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
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
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}

          {step === 'preview' ? (
            <>
              {stepHeading('Review your request')}
              <div className="mt-5 space-y-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200">
                <Row label="Practitioner" value={selectedPractitioner?.name ?? '—'} />
                <Row label="Appointment type" value={selectedVisit?.name ?? '—'} />
                <Row
                  label="Timing"
                  value={
                    selectedSlot
                      ? `${selectedSlot.start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${formatTime(selectedSlot.start)} to ${formatTime(selectedSlot.end)}`
                      : '—'
                  }
                />
                <Row label="Mode" value={mode ? MODE_COPY[mode].title : '—'} />
                {needsLocation ? <Row label="Location" value={location} /> : null}
              </div>
              <p className="mt-4 rounded-xl px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200/80" style={{ background: '#FFF7E6' }}>
                Your appointment request will be sent to the practice for confirmation.
              </p>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={goBack}
          className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600"
        >
          Back
        </button>
        {step === 'preview' ? (
          <button
            type="button"
            onClick={send}
            className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white hover:brightness-110"
          >
            Request appointment
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue}
            onClick={goNext}
            className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-40"
          >
            {step === 'mode' ? 'Review request' : 'Next'}
          </button>
        )}
      </div>
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
