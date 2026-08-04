import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  accessibleAppointmentTypes,
  availabilityColors,
  currentUser,
  GRID_START_MINUTES,
  practitioners,
  SLOT_COUNT,
  SLOT_MINUTES,
  WHOLE_DAY_END,
  WHOLE_DAY_START,
} from './constants'
import {
  endOfDay,
  formatTime,
  isSameDay,
  minutesToSlotIndex,
  parseDateInput,
  setTimeForDate,
  slotIndexToLabel,
  startOfWeek,
  toDateInputValue,
} from './date-utils'
import { CreateEventPanel, buildAvailabilityForms, defaultAppointmentForm, defaultAvailabilityForm } from './components/CreateEventPanel'
import { ContextMenu } from './components/ContextMenu'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Modal } from './components/Modal'
import { PractitionerAvatar } from './components/PractitionerAvatar'
import { PractitionerDaySchedule } from './components/PractitionerDaySchedule'
import { useCalendarState } from './hooks/useCalendarState'
import type { AppointmentType, AvailabilityFormState, CalendarEvent } from './types'

const rowHeight = 48
const timeColumnWidth = 78
const headerRowHeight = 104

type DragAction =
  | { kind: 'availability'; type: 'move' | 'resize-start' | 'resize-end'; id: string; startY: number }
  | { kind: 'event'; type: 'move' | 'resize-start' | 'resize-end'; id: string; startY: number }

const App = () => {
  const {
    calendarMode,
    viewMode,
    selectedDate,
    isLoading,
    events,
    availabilityBlocks,
    allAvailabilityBlocks,
    appointmentTypeCatalog,
    visiblePractitioners,
    filters,
    selectedEvent,
    selectedAvailability,
    availabilityDraft,
    contextMenu,
    pendingAvailabilityIds,
    pendingEventIds,
    recentlyCreatedAvailabilityIds,
    setFilters,
    setSelectedEventId,
    setAvailabilityDraft,
    setAvailabilityEditingId,
    setContextMenu,
    shiftDate,
    goToToday,
    selectDate,
    changeMode,
    changeView,
    deleteEvent,
    updateEvent,
    createEvent,
    createAppointmentType,
    moveEvent,
    resizeEvent,
    deleteAvailability,
    upsertAvailabilityFromForm,
    moveAvailability,
    resizeAvailability,
    openAvailabilityDraft,
  } = useCalendarState()

  const [now, setNow] = useState(() => new Date())
  const [activePractitionerForDraft, setActivePractitionerForDraft] = useState<string | null>(null)
  const [dragSelection, setDragSelection] = useState<{
    practitionerId: string
    startSlot: number
    endSlot: number
    dateKey: string
  } | null>(null)
  const dragSelectionRef = useRef(dragSelection)
  const [dragAction, setDragAction] = useState<DragAction | null>(null)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [createEventKind, setCreateEventKind] = useState<'appointment' | 'availability'>('appointment')
  const [scheduleFocusId, setScheduleFocusId] = useState<string | null>(null)
  const [schedulePreviewId, setSchedulePreviewId] = useState<string | null>(null)
  const visibleTypes = useMemo(
    () => accessibleAppointmentTypes(currentUser, appointmentTypeCatalog),
    [appointmentTypeCatalog],
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<
    | { type: 'event'; id: string; label: string }
    | { type: 'availability'; id: string; label: string }
    | null
  >(null)
  const [openFilters, setOpenFilters] = useState({
    team: false,
    types: false,
    roles: false,
    locations: false,
  })
  const [eventEditDraft, setEventEditDraft] = useState<{
    patientName: string
    notes: string
    startTime: string
    endTime: string
    appointmentTypeId: string
  } | null>(null)

  const updateDragSelection = (
    next: { practitionerId: string; startSlot: number; endSlot: number; dateKey: string } | null,
  ) => {
    dragSelectionRef.current = next
    setDragSelection(next)
  }

  const beginAvailabilityDrag = (practitionerId: string, slotIndex: number, dateKey: string) => {
    updateDragSelection({ practitionerId, startSlot: slotIndex, endSlot: slotIndex, dateKey })
    const finish = () => {
      window.removeEventListener('mouseup', finish)
      const selection = dragSelectionRef.current
      updateDragSelection(null)
      if (!selection) return
      const start = Math.min(selection.startSlot, selection.endSlot)
      const end = Math.max(selection.startSlot, selection.endSlot)
      const onDate = parseDateInput(selection.dateKey)
      const draftPractitionerId = openAvailabilityDraft(
        selection.practitionerId,
        start,
        end,
        onDate,
      )
      setActivePractitionerForDraft(draftPractitionerId)
      setCreateEventKind('availability')
      setIsCreatingEvent(true)
    }
    window.addEventListener('mouseup', finish)
  }

  const closeCreatePanel = () => {
    setIsCreatingEvent(false)
    setAvailabilityDraft(null)
  }

  const dateTitle = selectedDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const shortDateTitle = selectedDate.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const appointmentTypeMap = useMemo(
    () => new Map(appointmentTypeCatalog.map((type) => [type.id, type])),
    [appointmentTypeCatalog],
  )

  const visibleRange = useMemo(() => {
    if (viewMode === 'day') return { start: new Date(selectedDate), end: endOfDay(selectedDate) }
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      return { start: weekStart, end: weekEnd }
    }
    return {
      start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      end: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  }, [selectedDate, viewMode])

  const scopedEvents = useMemo(
    () =>
      events.filter((event) => {
        const start = new Date(event.start)
        if (start < visibleRange.start || start > visibleRange.end) return false
        if (viewMode === 'day' && !isSameDay(start, selectedDate)) return false
        if (!searchQuery.trim()) return true
        const type = appointmentTypeMap.get(event.appointmentTypeId)?.name ?? ''
        const haystack = `${event.patientName} ${type} ${event.notes}`.toLowerCase()
        return haystack.includes(searchQuery.toLowerCase())
      }),
    [events, visibleRange, searchQuery, appointmentTypeMap, viewMode, selectedDate],
  )

  const scopedAvailability = useMemo(
    () =>
      availabilityBlocks.filter((item) => {
        const start = new Date(item.start)
        if (start < visibleRange.start || start > visibleRange.end) return false
        if (viewMode === 'day' && !isSameDay(start, selectedDate)) return false
        return true
      }),
    [availabilityBlocks, visibleRange, viewMode, selectedDate],
  )

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate)
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [selectedDate])

  const focusPractitioner = useMemo(() => {
    if (scheduleFocusId) {
      return (
        visiblePractitioners.find((item) => item.id === scheduleFocusId) ??
        practitioners.find((item) => item.id === scheduleFocusId) ??
        currentUser
      )
    }
    return (
      visiblePractitioners.find((item) => item.isCurrentUser) ??
      visiblePractitioners[0] ??
      currentUser
    )
  }, [visiblePractitioners, scheduleFocusId])

  const dayPractitioners = useMemo(() => {
    if (!scheduleFocusId) return visiblePractitioners
    const focused = visiblePractitioners.find((item) => item.id === scheduleFocusId)
    if (focused) return [focused]
    const fromAll = practitioners.find((item) => item.id === scheduleFocusId)
    return fromAll ? [fromAll] : visiblePractitioners
  }, [visiblePractitioners, scheduleFocusId])

  const gridColumns = useMemo(() => {
    if (viewMode === 'week') {
      return weekDays.map((date) => ({
        kind: 'day' as const,
        id: toDateInputValue(date),
        date,
        practitionerId: focusPractitioner.id,
      }))
    }
    return dayPractitioners.map((practitioner) => ({
      kind: 'practitioner' as const,
      id: practitioner.id,
      date: selectedDate,
      practitionerId: practitioner.id,
      practitioner,
    }))
  }, [viewMode, weekDays, dayPractitioners, focusPractitioner.id, selectedDate])

  const schedulePreviewPractitioner = useMemo(
    () =>
      schedulePreviewId
        ? practitioners.find((item) => item.id === schedulePreviewId) ?? null
        : null,
    [schedulePreviewId],
  )

  const weekScopedEvents = useMemo(() => {
    if (viewMode !== 'week') return scopedEvents
    return scopedEvents.filter((event) => event.practitionerId === focusPractitioner.id)
  }, [viewMode, scopedEvents, focusPractitioner.id])

  const weekScopedAvailability = useMemo(() => {
    if (viewMode !== 'week') return scopedAvailability
    return scopedAvailability.filter((item) => item.practitionerId === focusPractitioner.id)
  }, [viewMode, scopedAvailability, focusPractitioner.id])

  const renderedEvents =
    calendarMode === 'events'
      ? viewMode === 'week'
        ? weekScopedEvents
        : scopedEvents
      : []

  const renderedAvailability =
    calendarMode === 'availability'
      ? viewMode === 'week'
        ? weekScopedAvailability
        : scopedAvailability
      : []

  const showCurrentLine =
    (viewMode === 'day' && isSameDay(selectedDate, now)) ||
    (viewMode === 'week' && weekDays.some((day) => isSameDay(day, now)))

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!dragAction) return
    const onMove = (event: MouseEvent) => {
      const pixels = event.clientY - dragAction.startY
      const slotsMoved = Math.round(pixels / rowHeight)
      if (!slotsMoved) return
      if (dragAction.kind === 'availability') {
        if (dragAction.type === 'move') void moveAvailability(dragAction.id, slotsMoved * 30)
        if (dragAction.type === 'resize-start') void resizeAvailability(dragAction.id, 'start', slotsMoved * 30)
        if (dragAction.type === 'resize-end') void resizeAvailability(dragAction.id, 'end', slotsMoved * 30)
      } else {
        if (dragAction.type === 'move') void moveEvent(dragAction.id, slotsMoved * 30)
        if (dragAction.type === 'resize-start') void resizeEvent(dragAction.id, 'start', slotsMoved * 30)
        if (dragAction.type === 'resize-end') void resizeEvent(dragAction.id, 'end', slotsMoved * 30)
      }
      setDragAction({ ...dragAction, startY: event.clientY })
    }
    const onUp = () => setDragAction(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragAction, moveAvailability, resizeAvailability, moveEvent, resizeEvent])

  useEffect(() => {
    updateDragSelection(null)
    setIsCreatingEvent(false)
    setIsEditingEvent(false)
    setDragAction(null)
  }, [calendarMode])

  useEffect(() => {
    if (!selectedEvent) {
      setIsEditingEvent(false)
      setEventEditDraft(null)
      return
    }
    setEventEditDraft({
      patientName: selectedEvent.patientName,
      notes: selectedEvent.notes,
      startTime: formatTime(new Date(selectedEvent.start)),
      endTime: formatTime(new Date(selectedEvent.end)),
      appointmentTypeId: selectedEvent.appointmentTypeId,
    })
  }, [selectedEvent])

  const contextActions =
    contextMenu.open && contextMenu.target === 'availability' && contextMenu.availabilityId
      ? [
          {
            label: 'Edit availability',
            onClick: () => setAvailabilityEditingId(contextMenu.availabilityId!),
          },
          {
            label: 'Delete availability',
            onClick: () =>
              setPendingDelete({
                type: 'availability',
                id: contextMenu.availabilityId!,
                label: 'this availability block',
              }),
            destructive: true,
          },
        ]
      : contextMenu.open && calendarMode === 'availability'
        ? [
            {
              label: 'Create availability',
              onClick: () => {
                const onDate = contextMenu.dateKey
                  ? parseDateInput(contextMenu.dateKey)
                  : selectedDate
                const practitionerId = openAvailabilityDraft(
                  contextMenu.practitionerId,
                  contextMenu.slotIndex,
                  contextMenu.slotIndex + 1,
                  onDate,
                )
                setActivePractitionerForDraft(practitionerId)
                setCreateEventKind('availability')
                setIsCreatingEvent(true)
              },
            },
          ]
        : []

  const handleAvailabilitySave = (form: AvailabilityFormState, editingId?: string) => {
    const practitionerId =
      activePractitionerForDraft ?? selectedAvailability?.practitionerId ?? visiblePractitioners[0]?.id
    if (!practitionerId) return
    void upsertAvailabilityFromForm(form, practitionerId, editingId)
  }

  const toggleInFilter = (group: 'practitionerIds' | 'eventTypeIds' | 'roles' | 'locations', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((item) => item !== value)
        : [...prev[group], value],
    }))
  }

  const currentTimeTop = (() => {
    const minutes = now.getHours() * 60 + now.getMinutes()
    return ((minutes - GRID_START_MINUTES) / SLOT_MINUTES) * rowHeight
  })()

  const monthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const firstWeekday = first.getDay() === 0 ? 6 : first.getDay() - 1
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
    const cells: Array<Date | null> = Array.from({ length: firstWeekday }, () => null)
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [selectedDate])

  const miniMonthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const offset = first.getDay() === 0 ? 6 : first.getDay() - 1
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
    const cells: Array<Date | null> = Array.from({ length: offset }, () => null)
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d))
    }
    return cells
  }, [selectedDate])

  const practitionerAvailabilityStatus = useMemo(() => {
    const map = new Map<string, 'Available' | 'Busy' | 'Blocked' | 'No hours'>()
    visiblePractitioners.forEach((p) => {
      const dayBlocks = availabilityBlocks
        .filter((block) => block.practitionerId === p.id && isSameDay(new Date(block.start), selectedDate))
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))
      if (!dayBlocks.length) {
        map.set(p.id, 'No hours')
        return
      }
      if (dayBlocks.some((block) => block.status === 'available')) map.set(p.id, 'Available')
      else if (dayBlocks.some((block) => block.status === 'busy')) map.set(p.id, 'Busy')
      else map.set(p.id, 'Blocked')
    })
    return map
  }, [visiblePractitioners, availabilityBlocks, selectedDate])

  const segmentClass = (active: boolean) =>
    `h-10 rounded-md px-4 text-[13px] font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92] ${
      active
        ? 'bg-[#0f5f92] text-white shadow-[0_1px_2px_rgba(15,95,146,0.35)]'
        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
    }`

  const statusTone = (status: string) => {
    if (status === 'Available') return 'text-emerald-600'
    if (status === 'Busy') return 'text-slate-500'
    if (status === 'Blocked') return 'text-slate-700'
    return 'text-slate-400'
  }

  const statusDot = (status: string) => {
    if (status === 'Available') return 'bg-emerald-500'
    if (status === 'Busy') return 'bg-slate-400'
    if (status === 'Blocked') return 'bg-slate-700'
    return 'bg-slate-300'
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#eef3f8] text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
        <div className="flex h-[60px] items-center gap-3 px-4 min-[1440px]:px-6">
          <div className="mr-1 hidden items-center gap-2 lg:flex">
            <div className="grid size-7 place-items-center rounded-md bg-[#0f5f92] text-[11px] font-bold text-white">
              R
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-0.5 ring-1 ring-slate-200/80">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92]"
              title="Previous period"
              aria-label="Previous period"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="h-8 rounded-md px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92]"
              title="Next period"
              aria-label="Next period"
            >
              →
            </button>
          </div>

          <div className="min-w-0 flex-1 pl-1">
            <h1 className="truncate text-[20px] font-bold tracking-tight text-slate-900 min-[1440px]:text-[22px]">
              {viewMode === 'day' ? dateTitle : shortDateTitle}
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-slate-400">Timezone · GMT-4</p>
          </div>

          <div
            className="hidden items-center rounded-lg bg-slate-100/90 p-1 lg:grid lg:grid-cols-2 lg:flex-none"
            role="group"
            aria-label="Calendar mode"
          >
            <button
              type="button"
              onClick={() => changeMode('events')}
              aria-pressed={calendarMode === 'events'}
              className={`${segmentClass(calendarMode === 'events')} min-w-[8.5rem]`}
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => changeMode('availability')}
              aria-pressed={calendarMode === 'availability'}
              className={`${segmentClass(calendarMode === 'availability')} min-w-[8.5rem]`}
            >
              Availability
            </button>
          </div>

          <div className="hidden items-center rounded-lg bg-slate-100/90 p-1 md:flex" role="group" aria-label="Calendar view">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeView(mode)}
                aria-pressed={viewMode === mode}
                className={segmentClass(viewMode === mode)}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative hidden w-56 xl:block">
            <label htmlFor="appointment-search" className="sr-only">
              Search appointments
            </label>
            <input
              id="appointment-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search appointments"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              ⌕
            </span>
          </div>

          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92]"
            title="Notifications"
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
              <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
            </svg>
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-[#e8f2f8] text-[12px] font-bold text-[#0f5f92] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92]"
            aria-label="Thomas Reed profile"
          >
            TR
          </button>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-2 lg:hidden">
          <div className="flex flex-1 items-center rounded-lg bg-slate-100 p-1">
            <button type="button" onClick={() => changeMode('events')} className={`${segmentClass(calendarMode === 'events')} flex-1`}>
              Events
            </button>
            <button
              type="button"
              onClick={() => changeMode('availability')}
              className={`${segmentClass(calendarMode === 'availability')} flex-1`}
            >
              Availability
            </button>
          </div>
          <div className="flex flex-1 items-center rounded-lg bg-slate-100 p-1">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeView(mode)}
                className={`${segmentClass(viewMode === mode)} flex-1`}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[300px_minmax(0,1fr)] min-[1440px]:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex max-h-[calc(100vh-60px)] flex-col gap-3 overflow-y-auto border-r border-slate-200/80 bg-white p-3.5">
          <div className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-200/90">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => selectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                className="grid size-10 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-white"
                aria-label="Previous month"
              >
                ‹
              </button>
              <strong className="text-[18px] font-bold tracking-tight text-slate-900">
                {selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </strong>
              <button
                type="button"
                onClick={() => selectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                className="grid size-10 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-white"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className="mb-2 grid grid-cols-7 text-center text-[13px] font-bold uppercase tracking-wide text-slate-500">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={`${d}-${i}`} className={`py-1.5 ${i === 6 ? 'text-rose-400' : ''}`}>
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2">
              {miniMonthDays.map((day, idx) =>
                day ? (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => selectDate(day)}
                    className={`mx-auto flex size-10 items-center justify-center rounded-full text-[14px] font-bold transition ${
                      isSameDay(day, selectedDate)
                        ? 'bg-[#0f5f92] text-white shadow-md'
                        : isSameDay(day, now)
                          ? 'bg-[#d9ecf7] text-[#0f5f92]'
                          : day.getDay() === 0
                            ? 'text-rose-500 hover:bg-rose-50'
                            : 'text-slate-800 hover:bg-white'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <span key={`empty-${idx}`} className="size-10" />
                ),
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const practitionerId = visiblePractitioners[0]?.id ?? practitioners[0].id
              // Prefill around 8:00–9:00 AM
              const eightAmSlot = Math.max(
                0,
                Math.floor((8 * 60 - GRID_START_MINUTES) / SLOT_MINUTES),
              )
              if (calendarMode === 'availability') {
                openAvailabilityDraft(practitionerId, eightAmSlot, eightAmSlot + 1)
                setActivePractitionerForDraft(practitionerId)
                setCreateEventKind('availability')
              } else {
                setCreateEventKind('appointment')
                setAvailabilityDraft(null)
              }
              setIsCreatingEvent(true)
            }}
            className="btn-press flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-[#0f5f92] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15,95,146,0.22)] transition hover:brightness-110"
            aria-label={calendarMode === 'availability' ? 'Create availability' : 'Create event'}
          >
            {calendarMode === 'availability' ? 'Create Availability' : 'Create Event'}
          </button>

          <div className="flex flex-col gap-2.5">
          <FilterCard
            title="Team Members"
            open={openFilters.team}
            onToggle={() => setOpenFilters((prev) => ({ ...prev, team: !prev.team }))}
          >
            {practitioners.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-2 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={filters.practitionerIds.includes(member.id)}
                  onChange={() => toggleInFilter('practitionerIds', member.id)}
                  className="size-4 accent-[#0f5f92]"
                />
                <PractitionerAvatar name={member.name} size="sm" />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left text-[13px] leading-snug font-medium text-slate-700 hover:text-[#0f5f92]"
                  onClick={(event) => {
                    event.preventDefault()
                    setSchedulePreviewId(member.id)
                  }}
                  title={`View ${member.name}'s day schedule`}
                >
                  <span className="line-clamp-2 break-words">{member.name}</span>
                </button>
                <span className="size-2 rounded-full bg-[#2bb7e8]" aria-hidden />
              </label>
            ))}
          </FilterCard>

          <FilterCard
            title="Event Types"
            open={openFilters.types}
            onToggle={() => setOpenFilters((prev) => ({ ...prev, types: !prev.types }))}
          >
            <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Global</p>
            {visibleTypes
              .filter((item) => item.scope === 'global')
              .map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={filters.eventTypeIds.includes(item.id)}
                    onChange={() => toggleInFilter('eventTypeIds', item.id)}
                    className="size-4 accent-[#0f5f92]"
                  />
                  <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[13px] text-slate-700">{item.name}</span>
                </label>
              ))}
            <p className="mb-1 mt-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Private (you & admin)
            </p>
            {visibleTypes
              .filter((item) => item.scope === 'private')
              .map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={filters.eventTypeIds.includes(item.id)}
                    onChange={() => toggleInFilter('eventTypeIds', item.id)}
                    className="size-4 accent-[#0f5f92]"
                  />
                  <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[13px] text-slate-700">{item.name}</span>
                </label>
              ))}
            {visibleTypes.every((item) => item.scope !== 'private') ? (
              <p className="px-1 text-[12px] text-slate-400">No private types for your account.</p>
            ) : null}
          </FilterCard>

          <FilterCard
            title="User Roles"
            open={openFilters.roles}
            onToggle={() => setOpenFilters((prev) => ({ ...prev, roles: !prev.roles }))}
          >
            {['Practitioner', 'Therapist', 'Admin'].map((role) => (
              <label key={role} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filters.roles.includes(role)}
                  onChange={() => toggleInFilter('roles', role)}
                  className="size-4 accent-[#0f5f92]"
                />
                <span className="text-[13px] text-slate-700">{role}</span>
              </label>
            ))}
          </FilterCard>

          <FilterCard
            title="Locations"
            open={openFilters.locations}
            onToggle={() => setOpenFilters((prev) => ({ ...prev, locations: !prev.locations }))}
          >
            {['North Clinic', 'West Clinic', 'Virtual'].map((location) => (
              <label key={location} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filters.locations.includes(location)}
                  onChange={() => toggleInFilter('locations', location)}
                  className="size-4 accent-[#0f5f92]"
                />
                <span className="text-[13px] text-slate-700">{location}</span>
              </label>
            ))}
          </FilterCard>
          </div>

          {calendarMode === 'availability' ? (
            <div className="rounded-xl bg-white p-3 text-[11px] ring-1 ring-emerald-200/60">
              <p className="mb-2 font-semibold text-slate-700">Availability legend</p>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-5 rounded" style={{ background: availabilityColors.available }} /> Available
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-5 rounded" style={{ background: availabilityColors.busy }} /> Busy
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-5 rounded"
                    style={{
                      background:
                        'repeating-linear-gradient(-45deg, #3d4953, #3d4953 3px, #566471 3px, #566471 6px)',
                    }}
                  />{' '}
                  Blocked
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <main
          className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-white transition-colors duration-300 ${
            calendarMode === 'availability' ? 'bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_120px)]' : ''
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 min-[1440px]:px-5 ${
              calendarMode === 'availability'
                ? 'border-b border-emerald-100 bg-emerald-50/40'
                : 'border-b border-slate-100'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {scheduleFocusId
                  ? `${focusPractitioner.name}'s day`
                  : calendarMode === 'events'
                    ? 'Schedule'
                    : 'Set availability'}
              </p>
              <p className="text-[13px] text-slate-600">
                {scheduleFocusId
                  ? 'Full-day free, busy, blocked, and booked times for this staff member'
                  : calendarMode === 'events'
                    ? 'Only booked appointments and external busy time'
                    : 'Only availability, busy, and blocked blocks — click and drag to create'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {scheduleFocusId ? (
                <button
                  type="button"
                  onClick={() => setScheduleFocusId(null)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Show all team
                </button>
              ) : null}
              {calendarMode === 'availability' ? (
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  Availability editor
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Events view
                </span>
              )}
            </div>
          </div>

          {viewMode === 'month' ? (
            <div key={`month-${calendarMode}`} className="min-h-0 flex-1 animate-[viewFade_.22s_ease-out] overflow-auto p-3">
              <div className="grid grid-cols-7 border-b border-slate-200 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="px-3 py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((day, idx) => {
                  const dayEvents =
                    day && calendarMode === 'events'
                      ? scopedEvents.filter((e) => isSameDay(new Date(e.start), day))
                      : []
                  const dayAvailability =
                    day && calendarMode === 'availability'
                      ? allAvailabilityBlocks.filter((a) => isSameDay(new Date(a.start), day)).length
                      : 0
                  return (
                    <button
                      key={`${day?.toISOString() ?? idx}`}
                      type="button"
                      disabled={!day}
                      onClick={() => {
                        if (!day) return
                        selectDate(day)
                        changeView('day')
                      }}
                      className="min-h-32 border-b border-r border-slate-200 p-2 text-left transition hover:bg-[#f7fbfe] disabled:hover:bg-transparent"
                    >
                      {day ? (
                        <>
                          <div
                            className={`mb-1.5 inline-flex size-7 items-center justify-center rounded-lg text-[13px] font-bold ${
                              isSameDay(day, selectedDate)
                                ? 'bg-[#0f5f92] text-white'
                                : isSameDay(day, now)
                                  ? 'bg-red-50 text-red-600'
                                  : 'text-slate-700'
                            }`}
                          >
                            {day.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((eventItem) => {
                              const type = appointmentTypeMap.get(eventItem.appointmentTypeId)
                              return (
                                <div
                                  key={eventItem.id}
                                  className="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                  style={{ background: type?.color ?? '#0f5f92' }}
                                  title={`${eventItem.patientName} · ${type?.name ?? ''}`}
                                >
                                  {formatTime(new Date(eventItem.start))}{' '}
                                  {eventItem.isExternal ? 'Busy' : eventItem.patientName}
                                </div>
                              )
                            })}
                            {dayEvents.length > 3 ? (
                              <p className="text-[10px] font-semibold text-slate-500">
                                +{dayEvents.length - 3} more
                              </p>
                            ) : null}
                            {calendarMode === 'availability' ? (
                              <p className="text-[10px] text-emerald-700">
                                {dayAvailability > 0 ? `${dayAvailability} availability` : 'No hours'}
                              </p>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div
              key={`${viewMode}-${calendarMode}`}
              className="relative min-h-0 flex-1 animate-[viewFade_.22s_ease-out] overflow-auto scroll-smooth"
            >
              {viewMode === 'week' ? (
                <div className="border-b border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600">
                  Week for {focusPractitioner.name} · {focusPractitioner.role} · {focusPractitioner.location}
                </div>
              ) : null}
              <div
                className="grid min-w-[960px]"
                style={{
                  gridTemplateColumns: `${timeColumnWidth}px repeat(${Math.max(gridColumns.length, 1)}, minmax(140px, 1fr))`,
                }}
              >
                <div
                  className="sticky left-0 top-0 z-30 flex items-end justify-end border-b border-r border-slate-200 bg-white/95 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 backdrop-blur"
                  style={{ height: headerRowHeight }}
                >
                  Time
                </div>
                {gridColumns.map((column) => {
                  if (column.kind === 'day') {
                    const status =
                      practitionerAvailabilityStatus.get(focusPractitioner.id) &&
                      isSameDay(column.date, selectedDate)
                        ? practitionerAvailabilityStatus.get(focusPractitioner.id)!
                        : (() => {
                            const dayBlocks = availabilityBlocks.filter(
                              (block) =>
                                block.practitionerId === focusPractitioner.id &&
                                isSameDay(new Date(block.start), column.date),
                            )
                            if (!dayBlocks.length) return 'No hours'
                            if (dayBlocks.some((block) => block.status === 'available')) return 'Available'
                            if (dayBlocks.some((block) => block.status === 'busy')) return 'Busy'
                            return 'Blocked'
                          })()
                    return (
                      <button
                        key={column.id}
                        type="button"
                        onClick={() => selectDate(column.date)}
                        className={`sticky top-0 z-20 flex flex-col justify-center gap-0.5 border-b border-r border-slate-200 bg-white/95 px-3 text-left backdrop-blur transition hover:bg-slate-50 ${
                          isSameDay(column.date, selectedDate) ? 'ring-1 ring-inset ring-[#0f5f92]/30' : ''
                        }`}
                        style={{ height: headerRowHeight }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {column.date.toLocaleDateString([], { weekday: 'short' })}
                        </p>
                        <p className="text-[18px] font-bold text-slate-800">{column.date.getDate()}</p>
                        <p className={`text-[10px] font-semibold ${statusTone(status)}`}>{status}</p>
                      </button>
                    )
                  }
                  const p = column.practitioner
                  const status = practitionerAvailabilityStatus.get(p.id) ?? 'No hours'
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSchedulePreviewId(p.id)}
                      title={`View ${p.name}'s full day schedule`}
                      className="sticky top-0 z-20 flex items-center gap-3 border-b border-r border-slate-200 bg-white/95 px-3 text-left backdrop-blur transition hover:bg-[#eef6fb]"
                      style={{ height: headerRowHeight }}
                    >
                      <PractitionerAvatar name={p.name} size="lg" />
                      <div className="min-w-0 flex-1 leading-snug">
                        <p className="flex items-start gap-1.5 text-[15px] font-bold tracking-tight text-slate-900">
                          <span
                            className={`mt-1.5 size-2 shrink-0 rounded-full ${statusDot(status)}`}
                            aria-hidden
                          />
                          <span className="line-clamp-2 break-words hyphens-auto">{p.name}</span>
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-600">{p.role}</p>
                        <p className="truncate text-[12px] font-medium text-slate-500">{p.location}</p>
                        <p className={`mt-0.5 truncate text-[11px] font-bold ${statusTone(status)}`}>{status}</p>
                      </div>
                    </button>
                  )
                })}

                {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => (
                  <div key={slotIndex} className="contents">
                    <div
                      className="sticky left-0 z-10 flex items-start justify-end border-b border-r border-slate-200 bg-white pr-2 pt-1 text-[11px] font-bold leading-none text-slate-600"
                      style={{ height: rowHeight }}
                    >
                      {slotIndexToLabel(slotIndex)}
                    </div>
                    {gridColumns.map((column) => {
                      const dateKey = toDateInputValue(column.date)
                      const isSelected =
                        !!dragSelection &&
                        dragSelection.practitionerId === column.practitionerId &&
                        dragSelection.dateKey === dateKey &&
                        slotIndex >= Math.min(dragSelection.startSlot, dragSelection.endSlot) &&
                        slotIndex <= Math.max(dragSelection.startSlot, dragSelection.endSlot)
                      return (
                        <button
                          key={`${column.id}-${slotIndex}`}
                          type="button"
                          className={`relative cursor-pointer border-b border-r border-slate-200/90 transition-colors duration-150 ${
                            isSelected
                              ? calendarMode === 'availability'
                                ? 'bg-emerald-100/90 ring-1 ring-inset ring-emerald-300/70'
                                : 'bg-[#d7ebf8]'
                              : 'hover:bg-[#dceef8]'
                          }`}
                          style={{ height: rowHeight }}
                          onMouseDown={(event) => {
                            if (calendarMode !== 'availability') return
                            event.preventDefault()
                            beginAvailabilityDrag(column.practitionerId, slotIndex, dateKey)
                          }}
                          onMouseEnter={() => {
                            const selection = dragSelectionRef.current
                            if (
                              !selection ||
                              selection.practitionerId !== column.practitionerId ||
                              selection.dateKey !== dateKey
                            ) {
                              return
                            }
                            updateDragSelection({ ...selection, endSlot: slotIndex })
                          }}
                          onContextMenu={(event) => {
                            if (calendarMode !== 'availability') return
                            event.preventDefault()
                            setContextMenu({
                              open: true,
                              x: event.clientX,
                              y: event.clientY,
                              target: 'slot',
                              practitionerId: column.practitionerId,
                              slotIndex,
                              dateKey,
                            })
                          }}
                          title={
                            calendarMode === 'availability'
                              ? 'Click and drag to set availability'
                              : 'Calendar slot'
                          }
                          aria-label={`${column.kind === 'day' ? column.date.toDateString() : column.practitioner.name} at ${slotIndexToLabel(slotIndex)}`}
                        />
                      )
                    })}
                  </div>
                ))}

                {renderedAvailability.map((availability) => {
                    const type = appointmentTypeMap.get(availability.appointmentTypeId || '')
                    const start = new Date(availability.start)
                    const end = new Date(availability.end)
                    const startSlot = minutesToSlotIndex(start.getHours() * 60 + start.getMinutes())
                    const endSlot = minutesToSlotIndex(end.getHours() * 60 + end.getMinutes()) + 1
                    const column = gridColumns.findIndex((item) =>
                      item.kind === 'day'
                        ? isSameDay(item.date, start)
                        : item.practitionerId === availability.practitionerId,
                    )
                    if (column < 0) return null
                    const editable = calendarMode === 'availability'
                    return (
                      <div
                        key={availability.id}
                        className={`group relative z-[5] m-1 rounded-lg transition-all duration-200 ${
                          editable ? 'cursor-pointer hover:brightness-[0.98]' : 'pointer-events-none'
                        } ${
                          recentlyCreatedAvailabilityIds.has(availability.id)
                            ? 'animate-[blockIn_.2s_ease-out]'
                            : ''
                        } ${pendingAvailabilityIds.has(availability.id) ? 'opacity-70' : ''}`}
                        style={{
                          gridColumn: `${column + 2}`,
                          gridRow: `${startSlot + 2} / ${Math.max(startSlot + 3, endSlot + 1)}`,
                          background:
                            availability.status === 'blocked'
                              ? 'repeating-linear-gradient(-45deg, #3d4953, #3d4953 4px, #566471 4px, #566471 8px)'
                              : availabilityColors[availability.status],
                        }}
                        onContextMenu={(event) => {
                          if (!editable) return
                          event.preventDefault()
                          setContextMenu({
                            open: true,
                            x: event.clientX,
                            y: event.clientY,
                            target: 'availability',
                            availabilityId: availability.id,
                            practitionerId: availability.practitionerId,
                            slotIndex: startSlot,
                          })
                        }}
                        onClick={() => {
                          if (editable) setAvailabilityEditingId(availability.id)
                        }}
                        onKeyDown={(event) => {
                          if (!editable) return
                          if (event.key === 'Enter') setAvailabilityEditingId(availability.id)
                          if (event.key === 'Delete' || event.key === 'Backspace') {
                            setPendingDelete({
                              type: 'availability',
                              id: availability.id,
                              label: `${availability.status} block`,
                            })
                          }
                        }}
                        tabIndex={editable ? 0 : -1}
                        title={`${availability.status.toUpperCase()} · ${formatTime(start)} - ${formatTime(end)}`}
                        aria-label={`${availability.status} from ${formatTime(start)} to ${formatTime(end)}`}
                      >
                        <div
                          className={`pointer-events-none flex h-full flex-col justify-start gap-0.5 px-2.5 py-1.5 text-[11px] font-bold ${
                            availability.status === 'blocked' ? 'text-white' : 'text-slate-700'
                          }`}
                        >
                          <span>{availability.status.toUpperCase()}</span>
                          {type ? (
                            <span
                              className={`w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                availability.status === 'blocked'
                                  ? 'bg-white/20 text-white'
                                  : 'bg-white/75 text-slate-600'
                              }`}
                            >
                              {type.name}
                            </span>
                          ) : null}
                          <span
                            className={`text-[10px] font-semibold ${
                              availability.status === 'blocked' ? 'text-white/85' : 'text-slate-600/90'
                            }`}
                          >
                            {formatTime(start)} – {formatTime(end)}
                          </span>
                        </div>
                        {editable ? (
                          <>
                            <div
                              className="absolute inset-x-0 top-0 hidden h-1.5 cursor-ns-resize rounded-t-lg bg-slate-700/30 group-hover:block"
                              onMouseDown={(event) => {
                                event.stopPropagation()
                                setDragAction({
                                  kind: 'availability',
                                  type: 'resize-start',
                                  id: availability.id,
                                  startY: event.clientY,
                                })
                              }}
                            />
                            <div
                              className="absolute inset-x-0 bottom-0 hidden h-1.5 cursor-ns-resize rounded-b-lg bg-slate-700/30 group-hover:block"
                              onMouseDown={(event) => {
                                event.stopPropagation()
                                setDragAction({
                                  kind: 'availability',
                                  type: 'resize-end',
                                  id: availability.id,
                                  startY: event.clientY,
                                })
                              }}
                            />
                            <button
                              type="button"
                              className="absolute inset-0"
                              onMouseDown={(event) => {
                                event.stopPropagation()
                                setDragAction({
                                  kind: 'availability',
                                  type: 'move',
                                  id: availability.id,
                                  startY: event.clientY,
                                })
                              }}
                              aria-label="Move availability"
                            />
                          </>
                        ) : null}
                      </div>
                    )
                  })}

                {renderedEvents.map((eventItem) => {
                    const type = appointmentTypeMap.get(eventItem.appointmentTypeId)
                    if (!type) return null
                    const start = new Date(eventItem.start)
                    const end = new Date(eventItem.end)
                    const startSlot = minutesToSlotIndex(start.getHours() * 60 + start.getMinutes())
                    const endSlot = minutesToSlotIndex(end.getHours() * 60 + end.getMinutes()) + 1
                    const column = gridColumns.findIndex((item) =>
                      item.kind === 'day'
                        ? isSameDay(item.date, start)
                        : item.practitionerId === eventItem.practitionerId,
                    )
                    if (column < 0) return null
                    const interactive = calendarMode === 'events' && !eventItem.isExternal
                    const statusLabel = eventItem.isExternal ? 'External' : 'Confirmed'
                    return (
                      <div
                        key={eventItem.id}
                        role="button"
                        tabIndex={0}
                        className={`group relative z-20 m-1 flex flex-col justify-start gap-0.5 overflow-hidden rounded-lg border border-white/35 px-2.5 py-1.5 text-left shadow-[0_2px_8px_rgba(16,40,70,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(16,40,70,0.2)] active:scale-[0.99] ${
                          interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${pendingEventIds.has(eventItem.id) ? 'opacity-70' : ''}`}
                        style={{
                          gridColumn: `${column + 2}`,
                          gridRow: `${startSlot + 2} / ${Math.max(startSlot + 3, endSlot + 1)}`,
                          background: type.color,
                          color: type.textColor,
                        }}
                        onMouseDown={(mouseEvent) => {
                          if (!interactive) return
                          if ((mouseEvent.target as HTMLElement).dataset.resize) return
                          setDragAction({ kind: 'event', type: 'move', id: eventItem.id, startY: mouseEvent.clientY })
                        }}
                        onClick={(mouseEvent) => {
                          if (Math.abs(mouseEvent.movementY) > 4) return
                          setSelectedEventId(eventItem.id)
                        }}
                        onKeyDown={(keyboardEvent) => {
                          if (keyboardEvent.key === 'Enter') setSelectedEventId(eventItem.id)
                          if ((keyboardEvent.key === 'Delete' || keyboardEvent.key === 'Backspace') && interactive) {
                            setPendingDelete({
                              type: 'event',
                              id: eventItem.id,
                              label: eventItem.patientName,
                            })
                          }
                        }}
                        title={`${eventItem.isExternal ? 'Busy — External' : eventItem.patientName} · ${type.name} · ${formatTime(start)} - ${formatTime(end)} · ${eventItem.location ?? 'No location'} · ${statusLabel}`}
                        aria-label={`${eventItem.isExternal ? 'Busy External' : eventItem.patientName}, ${type.name}, ${formatTime(start)} to ${formatTime(end)}, ${eventItem.location ?? 'no location'}, ${statusLabel}`}
                      >
                        <div className="pointer-events-none flex items-start justify-between gap-1">
                          <span className="truncate text-[13px] font-bold leading-tight">
                            {eventItem.isExternal ? 'Busy — External' : eventItem.patientName}
                          </span>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                              eventItem.isExternal ? 'bg-slate-500/25 text-slate-700' : 'bg-white/25'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <span className="pointer-events-none truncate text-[11px] font-semibold leading-tight opacity-95">
                          {formatTime(start)} – {formatTime(end)}
                        </span>
                        <span className="pointer-events-none truncate text-[10px] font-medium leading-tight opacity-90">
                          {type.name}
                        </span>
                        <span className="pointer-events-none truncate text-[10px] leading-tight opacity-85">
                          {eventItem.location ?? '—'}
                        </span>
                        {interactive ? (
                          <>
                            <div
                              data-resize="start"
                              className="absolute inset-x-0 top-0 z-10 hidden h-1.5 cursor-ns-resize rounded-t-lg bg-black/20 group-hover:block"
                              onMouseDown={(mouseEvent) => {
                                mouseEvent.stopPropagation()
                                setDragAction({
                                  kind: 'event',
                                  type: 'resize-start',
                                  id: eventItem.id,
                                  startY: mouseEvent.clientY,
                                })
                              }}
                            />
                            <div
                              data-resize="end"
                              className="absolute inset-x-0 bottom-0 z-10 hidden h-1.5 cursor-ns-resize rounded-b-lg bg-black/20 group-hover:block"
                              onMouseDown={(mouseEvent) => {
                                mouseEvent.stopPropagation()
                                setDragAction({
                                  kind: 'event',
                                  type: 'resize-end',
                                  id: eventItem.id,
                                  startY: mouseEvent.clientY,
                                })
                              }}
                            />
                          </>
                        ) : null}
                      </div>
                    )
                  })}
              </div>

              {showCurrentLine && currentTimeTop >= 0 && currentTimeTop <= SLOT_COUNT * rowHeight ? (
                <div
                  className="pointer-events-none absolute right-0 z-40"
                  style={{ left: timeColumnWidth, top: currentTimeTop + headerRowHeight }}
                >
                  <div className="relative border-t-2 border-red-500">
                    <span className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-red-500 ring-2 ring-white" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {schedulePreviewPractitioner ? (
        <PractitionerDaySchedule
          practitioner={schedulePreviewPractitioner}
          date={selectedDate}
          events={events}
          availability={allAvailabilityBlocks}
          appointmentTypes={appointmentTypeCatalog}
          onClose={() => setSchedulePreviewId(null)}
          onOpenInCalendar={() => {
            setScheduleFocusId(schedulePreviewPractitioner.id)
            setSchedulePreviewId(null)
            if (viewMode !== 'day') changeView('day')
          }}
        />
      ) : null}

      {contextMenu.open ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextActions}
          onClose={() => setContextMenu({ open: false })}
        />
      ) : null}

      {selectedEvent && eventEditDraft ? (
        <Modal
          title={isEditingEvent ? 'Edit Appointment' : 'Appointment Details'}
          onClose={() => {
            setSelectedEventId(null)
            setIsEditingEvent(false)
          }}
          footer={
            <div className="flex justify-end gap-2">
              {isEditingEvent ? (
                <>
                  <button
                    className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50"
                    onClick={() => setIsEditingEvent(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="h-10 rounded-lg bg-[#0f5f92] px-4 text-sm font-semibold text-white hover:brightness-110"
                    onClick={() => {
                      const day = new Date(selectedEvent.start)
                      const start = setTimeForDate(day, eventEditDraft.startTime)
                      const end = setTimeForDate(day, eventEditDraft.endTime)
                      if (end <= start) return
                      const patch: Partial<CalendarEvent> = {
                        patientName: eventEditDraft.patientName,
                        notes: eventEditDraft.notes,
                        appointmentTypeId: eventEditDraft.appointmentTypeId,
                        start: start.toISOString(),
                        end: end.toISOString(),
                      }
                      void updateEvent(selectedEvent.id, patch)
                      setIsEditingEvent(false)
                      setSelectedEventId(null)
                    }}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                    onClick={() => setIsEditingEvent(true)}
                    disabled={calendarMode !== 'events' || !!selectedEvent.isExternal}
                  >
                    Edit
                  </button>
                  <button
                    className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
                    onClick={() =>
                      setPendingDelete({
                        type: 'event',
                        id: selectedEvent.id,
                        label: selectedEvent.patientName,
                      })
                    }
                    disabled={calendarMode !== 'events' || !!selectedEvent.isExternal}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          }
        >
          {isEditingEvent ? (
            <div className="grid grid-cols-2 gap-4 text-sm max-[700px]:grid-cols-1">
              <label className="flex flex-col gap-1">
                Patient Name
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  value={eventEditDraft.patientName}
                  onChange={(event) => setEventEditDraft({ ...eventEditDraft, patientName: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                Appointment Type
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  value={eventEditDraft.appointmentTypeId}
                  onChange={(event) =>
                    setEventEditDraft({ ...eventEditDraft, appointmentTypeId: event.target.value })
                  }
                >
                  {visibleTypes
                    .filter((type) => type.id !== 'busy-external')
                    .map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                Start Time
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  value={eventEditDraft.startTime}
                  onChange={(event) => setEventEditDraft({ ...eventEditDraft, startTime: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                End Time
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  value={eventEditDraft.endTime}
                  onChange={(event) => setEventEditDraft({ ...eventEditDraft, endTime: event.target.value })}
                />
              </label>
              <label className="col-span-full flex flex-col gap-1">
                Notes
                <textarea
                  className="min-h-24 rounded-lg border border-slate-200 px-3 py-2"
                  value={eventEditDraft.notes}
                  onChange={(event) => setEventEditDraft({ ...eventEditDraft, notes: event.target.value })}
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm max-[700px]:grid-cols-1">
              <Field label="Patient Name" value={selectedEvent.patientName} />
              <Field
                label="Appointment Type"
                value={appointmentTypeMap.get(selectedEvent.appointmentTypeId)?.name ?? '-'}
              />
              <Field
                label="Practitioner"
                value={practitioners.find((p) => p.id === selectedEvent.practitionerId)?.name ?? '-'}
              />
              <Field label="Start Time" value={formatTime(new Date(selectedEvent.start))} />
              <Field label="End Time" value={formatTime(new Date(selectedEvent.end))} />
              <Field label="Location" value={selectedEvent.location ?? '—'} />
              <Field label="Notes" value={selectedEvent.notes} />
            </div>
          )}
        </Modal>
      ) : null}

      {isCreatingEvent ? (
        <CreateEventPanel
          key={`create-${createEventKind}-${availabilityDraft?.startDate ?? 'new'}-${availabilityDraft?.startTime ?? 'default'}`}
          initialKind={createEventKind}
          appointmentTypes={appointmentTypeCatalog}
          appointmentDefaults={defaultAppointmentForm({
            date: selectedDate,
            practitionerId: visiblePractitioners[0]?.id ?? practitioners[0].id,
            appointmentTypeId:
              visibleTypes.find((type) => type.id !== 'busy-external')?.id ?? 'initial-visit',
          })}
          availabilityDefaults={
            availabilityDraft
              ? {
                  startDate: availabilityDraft.startDate,
                  endDate: availabilityDraft.startDate,
                  startTime: availabilityDraft.startTime,
                  endTime: availabilityDraft.endTime,
                  attendees: '',
                  practitionerId:
                    activePractitionerForDraft ?? visiblePractitioners[0]?.id ?? practitioners[0].id,
                  appointmentTypeIds: availabilityDraft.appointmentTypeId
                    ? [availabilityDraft.appointmentTypeId]
                    : ['initial-visit'],
                  includeBlocked: availabilityDraft.status === 'blocked',
                  wholeDay: availabilityDraft.wholeDay,
                  newTypeName: '',
                }
              : defaultAvailabilityForm({
                  date: selectedDate,
                  practitionerId:
                    activePractitionerForDraft ?? visiblePractitioners[0]?.id ?? practitioners[0].id,
                })
          }
          onCancel={closeCreatePanel}
          onCreateAppointmentType={createAppointmentType}
          onCreateAppointment={(form) => {
            const location =
              form.meetingType === 'virtual' ? 'Virtual' : form.location || 'North Clinic'
            void createEvent({
              practitionerId: form.practitionerId,
              patientName: form.patientName.trim(),
              appointmentTypeId: form.appointmentTypeId,
              startTime: form.startTime,
              endTime: form.endTime,
              notes: [form.appointmentName, form.notes, form.attendees && `Attendees: ${form.attendees}`]
                .filter(Boolean)
                .join('\n'),
              location,
              date: form.startDate,
            })
            closeCreatePanel()
          }}
          onCreateAvailability={(form) => {
            setActivePractitionerForDraft(form.practitionerId)
            buildAvailabilityForms(form).forEach(({ practitionerId, payload }) => {
              void upsertAvailabilityFromForm(payload, practitionerId)
            })
            closeCreatePanel()
          }}
        />
      ) : null}

      {selectedAvailability && !isCreatingEvent ? (
        <AvailabilityModal
          initialForm={{
            startDate: toDateInputValue(new Date(selectedAvailability.start)),
            startTime: formatTime(new Date(selectedAvailability.start)),
            endTime: formatTime(new Date(selectedAvailability.end)),
            status: selectedAvailability.status,
            appointmentTypeId: selectedAvailability.appointmentTypeId,
            repeat: 'none',
            repeatDays: [new Date(selectedAvailability.start).getDay()],
            repeatUntil: toDateInputValue(new Date(selectedAvailability.end)),
            wholeDay:
              formatTime(new Date(selectedAvailability.start)) === WHOLE_DAY_START &&
              formatTime(new Date(selectedAvailability.end)) === WHOLE_DAY_END,
          }}
          appointmentTypesForForm={visibleTypes}
          onCancel={() => {
            setAvailabilityDraft(null)
            setAvailabilityEditingId(null)
          }}
          onSave={(form) => handleAvailabilitySave(form, selectedAvailability.id)}
          onDelete={() => {
            setPendingDelete({
              type: 'availability',
              id: selectedAvailability.id,
              label: `${selectedAvailability.status} block`,
            })
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.type === 'event' ? 'Delete appointment?' : 'Delete availability?'}
        message={
          pendingDelete
            ? `This will permanently remove ${pendingDelete.label}. This action cannot be undone.`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          if (pendingDelete.type === 'event') void deleteEvent(pendingDelete.id)
          else void deleteAvailability(pendingDelete.id)
          setPendingDelete(null)
        }}
      />

      {isLoading ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-white/40 pt-28 backdrop-blur-[1px]">
          <div className="w-[420px] space-y-3 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

const FilterCard = ({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) => (
  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/90">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0f5f92]"
    >
      <span className="text-[14px] font-semibold text-slate-800">{title}</span>
      <span className="text-[12px] text-slate-400" aria-hidden>
        {open ? '▴' : '▾'}
      </span>
    </button>
    {open ? <div className="border-t border-slate-100 px-3 pb-3 pt-1">{children}</div> : null}
  </div>
)

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800 ring-1 ring-slate-100">{value}</p>
  </div>
)

const AvailabilityModal = ({
  initialForm,
  onSave,
  onCancel,
  onDelete,
  appointmentTypesForForm,
}: {
  initialForm: AvailabilityFormState
  onSave: (form: AvailabilityFormState) => void
  onCancel: () => void
  onDelete?: () => void
  appointmentTypesForForm: AppointmentType[]
}) => {
  const [form, setForm] = useState<AvailabilityFormState>(initialForm)
  const maxRepeatDate = toDateInputValue(
    new Date(parseDateInput(form.startDate).getTime() + 90 * 24 * 60 * 60 * 1000),
  )

  useEffect(() => setForm(initialForm), [initialForm])

  const toggleRepeatDay = (value: number) => {
    setForm((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(value)
        ? prev.repeatDays.filter((day) => day !== value)
        : [...prev.repeatDays, value],
    }))
  }

  return (
    <Modal
      title={onDelete ? 'Edit Availability' : 'Create Availability'}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="h-10 rounded-lg border border-rose-200 px-4 text-sm font-medium text-rose-600"
            >
              Delete
            </button>
          ) : null}
          <button onClick={onCancel} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="h-10 rounded-lg bg-[#0f5f92] px-4 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 text-sm max-[700px]:grid-cols-1">
        <label className="flex flex-col gap-1">
          Start Date
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2">
          <input
            type="checkbox"
            checked={form.wholeDay}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                wholeDay: event.target.checked,
                startTime: event.target.checked ? WHOLE_DAY_START : prev.startTime,
                endTime: event.target.checked ? WHOLE_DAY_END : prev.endTime,
              }))
            }
            className="size-4 accent-[#0f5f92]"
          />
          <span className="font-medium text-slate-700">Whole day ({WHOLE_DAY_START} – {WHOLE_DAY_END})</span>
        </label>
        <label className="flex flex-col gap-1">
          Start Time
          <input
            type="text"
            value={form.startTime}
            disabled={form.wholeDay}
            onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          End Time
          <input
            type="text"
            value={form.endTime}
            disabled={form.wholeDay}
            onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                status: event.target.value as AvailabilityFormState['status'],
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Appointment Type (optional)
          <select
            value={form.appointmentTypeId ?? ''}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, appointmentTypeId: event.target.value || undefined }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">None (general availability)</option>
            {appointmentTypesForForm
              .filter((type) => type.id !== 'busy-external')
              .map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.scope === 'private' ? ' · Private' : ''}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Repeat
          <select
            value={form.repeat}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, repeat: event.target.value as 'none' | 'weekly' }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="none">None</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
      </div>

      {form.repeat === 'weekly' ? (
        <>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Repeat Days</p>
            <div className="flex flex-wrap gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleRepeatDay(idx)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    form.repeatDays.includes(idx)
                      ? 'border-[#0f5f92] bg-[#0f5f92] text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <label className="mt-4 flex flex-col gap-1 text-sm">
            Repeat Until (max 90 days)
            <input
              type="date"
              min={form.startDate}
              max={maxRepeatDate}
              value={form.repeatUntil}
              onChange={(event) => setForm((prev) => ({ ...prev, repeatUntil: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </>
      ) : null}
    </Modal>
  )
}

export default App
