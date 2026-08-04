import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { calendarApi } from '../api/calendarApi'
import {
  accessibleAppointmentTypes,
  appointmentTypes as seedAppointmentTypes,
  buildPrivateAppointmentType,
  canAccessAppointmentType,
  currentUser,
  practitioners,
  GRID_START_MINUTES,
  SLOT_COUNT,
  SLOT_MINUTES,
  WHOLE_DAY_END,
  WHOLE_DAY_START,
} from '../constants'
import { formatTime, parseDateInput, setTimeForDate, toDateInputValue } from '../date-utils'
import type {
  AppointmentType,
  AvailabilityBlock,
  AvailabilityFormState,
  CalendarEvent,
  CalendarMode,
  ContextMenuState,
  TeamFilters,
  ViewMode,
} from '../types'

const visibleTypeIds = accessibleAppointmentTypes(currentUser, seedAppointmentTypes).map((item) => item.id)

const defaultFilters: TeamFilters = {
  practitionerIds: practitioners.map((item) => item.id),
  eventTypeIds: visibleTypeIds,
  roles: ['Practitioner', 'Therapist', 'Admin'],
  locations: ['North Clinic', 'West Clinic', 'Virtual'],
}

const createInitialEvents = (): CalendarEvent[] => [
  {
    id: 'ev-1',
    practitionerId: 'p4',
    patientName: 'Ava Johnson',
    appointmentTypeId: 'initial-visit',
    start: new Date(2026, 6, 28, 11, 30).toISOString(),
    end: new Date(2026, 6, 28, 12, 0).toISOString(),
    notes: 'Intake and first consultation.',
    location: 'Virtual',
  },
  {
    id: 'ev-2',
    practitionerId: 'p1',
    patientName: 'External Calendar',
    appointmentTypeId: 'busy-external',
    start: new Date(2026, 6, 28, 9, 30).toISOString(),
    end: new Date(2026, 6, 28, 10, 0).toISOString(),
    notes: 'Busy from synced Outlook calendar.',
    isExternal: true,
  },
  {
    id: 'ev-3',
    practitionerId: 'p2',
    patientName: 'Morgan Lee',
    appointmentTypeId: 'follow-up',
    start: new Date(2026, 6, 28, 10, 0).toISOString(),
    end: new Date(2026, 6, 28, 10, 30).toISOString(),
    notes: 'Review progress and next steps.',
    location: 'West Clinic',
  },
  {
    id: 'ev-4',
    practitionerId: 'p3',
    patientName: 'Noah Patel',
    appointmentTypeId: 'discovery-call',
    start: new Date(2026, 6, 28, 12, 0).toISOString(),
    end: new Date(2026, 6, 28, 12, 30).toISOString(),
    notes: 'Intro call for new patient pathway.',
    location: 'North Clinic',
  },
  {
    id: 'ev-5',
    practitionerId: 'p1',
    patientName: 'Sofia Martinez',
    appointmentTypeId: 'initial-visit',
    start: new Date(2026, 6, 28, 14, 0).toISOString(),
    end: new Date(2026, 6, 28, 14, 30).toISOString(),
    notes: 'New patient evaluation.',
    location: 'North Clinic',
  },
  {
    id: 'ev-6',
    practitionerId: 'p4',
    patientName: 'Liam Chen',
    appointmentTypeId: 'follow-up',
    start: new Date(2026, 6, 28, 15, 0).toISOString(),
    end: new Date(2026, 6, 28, 15, 30).toISOString(),
    notes: 'Medication check-in.',
    location: 'Virtual',
  },
  {
    id: 'ev-7',
    practitionerId: 'p2',
    patientName: 'Emma Brooks',
    appointmentTypeId: 'discovery-call',
    start: new Date(2026, 6, 28, 13, 30).toISOString(),
    end: new Date(2026, 6, 28, 14, 0).toISOString(),
    notes: 'Therapy discovery session.',
    location: 'West Clinic',
  },
  {
    id: 'ev-8',
    practitionerId: 'p5',
    patientName: 'Jordan Blake',
    appointmentTypeId: 'follow-up',
    start: new Date(2026, 6, 28, 9, 0).toISOString(),
    end: new Date(2026, 6, 28, 9, 30).toISOString(),
    notes: 'Admin-supported follow-up visit.',
    location: 'West Clinic',
  },
  {
    id: 'ev-9',
    practitionerId: 'p3',
    patientName: 'Priya Nair',
    appointmentTypeId: 'initial-visit',
    start: new Date(2026, 6, 28, 15, 30).toISOString(),
    end: new Date(2026, 6, 28, 16, 0).toISOString(),
    notes: 'Initial clinical assessment.',
    location: 'North Clinic',
  },
  {
    id: 'ev-11',
    practitionerId: 'p1',
    patientName: 'Helen Park',
    appointmentTypeId: 'lab-review-private',
    start: new Date(2026, 6, 28, 16, 0).toISOString(),
    end: new Date(2026, 6, 28, 16, 30).toISOString(),
    notes: 'Private lab results review for Dr. Reed only.',
    location: 'North Clinic',
  },
  {
    id: 'ev-12',
    practitionerId: 'p2',
    patientName: 'Chris Adams',
    appointmentTypeId: 'therapy-intake-private',
    start: new Date(2026, 6, 28, 16, 30).toISOString(),
    end: new Date(2026, 6, 28, 17, 0).toISOString(),
    notes: 'Private therapy intake — visible to owner and Admin only.',
    location: 'West Clinic',
  },
  {
    id: 'ev-13',
    practitionerId: 'p1',
    patientName: 'Daniel Ruiz',
    appointmentTypeId: 'follow-up',
    start: new Date(2026, 6, 27, 11, 0).toISOString(),
    end: new Date(2026, 6, 27, 11, 30).toISOString(),
    notes: 'Monday follow-up in week view.',
    location: 'North Clinic',
  },
  {
    id: 'ev-14',
    practitionerId: 'p1',
    patientName: 'Grace Kim',
    appointmentTypeId: 'discovery-call',
    start: new Date(2026, 6, 29, 9, 0).toISOString(),
    end: new Date(2026, 6, 29, 9, 30).toISOString(),
    notes: 'Wednesday discovery call.',
    location: 'North Clinic',
  },
  {
    id: 'ev-15',
    practitionerId: 'p1',
    patientName: 'External Calendar',
    appointmentTypeId: 'busy-external',
    start: new Date(2026, 6, 31, 13, 0).toISOString(),
    end: new Date(2026, 6, 31, 14, 0).toISOString(),
    notes: 'Friday external busy block.',
    isExternal: true,
  },
  {
    id: 'ev-10',
    practitionerId: 'p2',
    patientName: 'Morgan Lee',
    appointmentTypeId: 'follow-up',
    start: new Date(2026, 6, 30, 10, 0).toISOString(),
    end: new Date(2026, 6, 30, 10, 30).toISOString(),
    notes: 'Follow-up later in the week.',
    location: 'West Clinic',
  },
]

const createInitialAvailability = (): AvailabilityBlock[] => [
  {
    id: 'av-1',
    practitionerId: 'p3',
    start: new Date(2026, 6, 28, 12, 0).toISOString(),
    end: new Date(2026, 6, 28, 16, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'discovery-call',
  },
  {
    id: 'av-2',
    practitionerId: 'p1',
    start: new Date(2026, 6, 28, 8, 0).toISOString(),
    end: new Date(2026, 6, 28, 12, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'initial-visit',
  },
  {
    id: 'av-3',
    practitionerId: 'p1',
    start: new Date(2026, 6, 28, 13, 0).toISOString(),
    end: new Date(2026, 6, 28, 17, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'initial-visit',
  },
  {
    id: 'av-4',
    practitionerId: 'p2',
    start: new Date(2026, 6, 28, 8, 0).toISOString(),
    end: new Date(2026, 6, 28, 10, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'follow-up',
  },
  {
    id: 'av-5',
    practitionerId: 'p2',
    start: new Date(2026, 6, 28, 10, 0).toISOString(),
    end: new Date(2026, 6, 28, 11, 0).toISOString(),
    status: 'busy',
  },
  {
    id: 'av-6',
    practitionerId: 'p2',
    start: new Date(2026, 6, 28, 12, 0).toISOString(),
    end: new Date(2026, 6, 28, 16, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'discovery-call',
  },
  {
    id: 'av-7',
    practitionerId: 'p4',
    start: new Date(2026, 6, 28, 10, 0).toISOString(),
    end: new Date(2026, 6, 28, 16, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'initial-visit',
  },
  {
    id: 'av-8',
    practitionerId: 'p5',
    start: new Date(2026, 6, 28, 8, 0).toISOString(),
    end: new Date(2026, 6, 28, 12, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'follow-up',
  },
  {
    id: 'av-9',
    practitionerId: 'p5',
    start: new Date(2026, 6, 28, 13, 0).toISOString(),
    end: new Date(2026, 6, 28, 15, 0).toISOString(),
    status: 'blocked',
  },
  {
    id: 'av-10',
    practitionerId: 'p3',
    start: new Date(2026, 6, 28, 8, 0).toISOString(),
    end: new Date(2026, 6, 28, 10, 0).toISOString(),
    status: 'busy',
  },
  {
    id: 'av-11',
    practitionerId: 'p1',
    start: new Date(2026, 6, 27, 8, 0).toISOString(),
    end: new Date(2026, 6, 27, 17, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'follow-up',
  },
  {
    id: 'av-12',
    practitionerId: 'p1',
    start: new Date(2026, 6, 29, 8, 0).toISOString(),
    end: new Date(2026, 6, 29, 12, 0).toISOString(),
    status: 'available',
    appointmentTypeId: 'discovery-call',
  },
  {
    id: 'av-13',
    practitionerId: 'p1',
    start: new Date(2026, 6, 31, 8, 0).toISOString(),
    end: new Date(2026, 6, 31, 18, 0).toISOString(),
    status: 'available',
  },
]

const rollForwardCreated = (
  setter: Dispatch<SetStateAction<Set<string>>>,
  ids: string[],
): void => {
  setter((prev) => new Set([...prev, ...ids]))
  window.setTimeout(() => {
    setter((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }, 420)
}

export const useCalendarState = () => {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('events')
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 28))
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<TeamFilters>(defaultFilters)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ open: false })
  const [availabilityEditingId, setAvailabilityEditingId] = useState<string | null>(null)

  const [events, setEvents] = useState<CalendarEvent[]>(createInitialEvents)
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>(createInitialAvailability)
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityFormState | null>(null)
  const [appointmentTypeCatalog, setAppointmentTypeCatalog] =
    useState<AppointmentType[]>(seedAppointmentTypes)

  const [pendingAvailabilityIds, setPendingAvailabilityIds] = useState<Set<string>>(new Set())
  const [pendingEventIds, setPendingEventIds] = useState<Set<string>>(new Set())
  const [recentlyCreatedAvailabilityIds, setRecentlyCreatedAvailabilityIds] = useState<Set<string>>(new Set())

  const visiblePractitioners = useMemo(
    () =>
      practitioners.filter(
        (item) =>
          filters.practitionerIds.includes(item.id) &&
          filters.roles.includes(item.role) &&
          filters.locations.includes(item.location),
      ),
    [filters],
  )

  const visibleEvents = useMemo(() => {
    const eventTypeSet = new Set(filters.eventTypeIds)
    return events.filter((event) => {
      if (!filters.practitionerIds.includes(event.practitionerId)) return false
      if (!eventTypeSet.has(event.appointmentTypeId)) return false
      const appointmentType = appointmentTypeCatalog.find((item) => item.id === event.appointmentTypeId)
      if (!appointmentType || !canAccessAppointmentType(appointmentType, currentUser)) return false
      const practitioner = practitioners.find((p) => p.id === event.practitionerId)
      if (!practitioner) return false
      return filters.roles.includes(practitioner.role) && filters.locations.includes(practitioner.location)
    })
  }, [events, filters, appointmentTypeCatalog])

  const visibleAvailability = useMemo(() => {
    const eventTypeSet = new Set(filters.eventTypeIds)
    return availabilityBlocks.filter((item) => {
      if (!filters.practitionerIds.includes(item.practitionerId)) return false
      if (item.appointmentTypeId) {
        if (!eventTypeSet.has(item.appointmentTypeId)) return false
        const appointmentType = appointmentTypeCatalog.find((type) => type.id === item.appointmentTypeId)
        if (appointmentType && !canAccessAppointmentType(appointmentType, currentUser)) return false
      }
      return true
    })
  }, [availabilityBlocks, filters, appointmentTypeCatalog])

  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId, visibleEvents],
  )

  const selectedAvailability = useMemo(
    () => availabilityBlocks.find((item) => item.id === availabilityEditingId) ?? null,
    [availabilityBlocks, availabilityEditingId],
  )

  const triggerLoading = () => {
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 450)
  }

  const shiftDate = (direction: -1 | 1) => {
    const next = new Date(selectedDate)
    if (viewMode === 'day') next.setDate(next.getDate() + direction)
    if (viewMode === 'week') next.setDate(next.getDate() + direction * 7)
    if (viewMode === 'month') next.setMonth(next.getMonth() + direction)
    setSelectedDate(next)
    triggerLoading()
  }

  const changeMode = (mode: CalendarMode) => {
    setCalendarMode(mode)
    setContextMenu({ open: false })
    setSelectedEventId(null)
    setAvailabilityEditingId(null)
    setAvailabilityDraft(null)
    triggerLoading()
  }

  const changeView = (mode: ViewMode) => {
    setViewMode(mode)
    triggerLoading()
  }

  const deleteEvent = async (eventId: string) => {
    const existing = events.find((item) => item.id === eventId)
    if (!existing) return
    setPendingEventIds((prev) => new Set([...prev, eventId]))
    setEvents((prev) => prev.filter((item) => item.id !== eventId))
    setSelectedEventId(null)
    try {
      await calendarApi.deleteEvent(existing)
    } catch {
      setEvents((prev) => [...prev, existing].sort((a, b) => +new Date(a.start) - +new Date(b.start)))
    } finally {
      setPendingEventIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  const updateEvent = async (eventId: string, patch: Partial<CalendarEvent>) => {
    const existing = events.find((item) => item.id === eventId)
    if (!existing) return
    const updated = { ...existing, ...patch, id: existing.id }
    setPendingEventIds((prev) => new Set([...prev, eventId]))
    setEvents((prev) => prev.map((item) => (item.id === eventId ? updated : item)))
    try {
      await calendarApi.updateEvent(updated)
    } catch {
      setEvents((prev) => prev.map((item) => (item.id === eventId ? existing : item)))
    } finally {
      setPendingEventIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  const moveEvent = async (id: string, minutesDelta: number) => {
    const existing = events.find((item) => item.id === id)
    if (!existing || existing.isExternal || minutesDelta === 0) return
    const start = new Date(existing.start)
    const end = new Date(existing.end)
    start.setMinutes(start.getMinutes() + minutesDelta)
    end.setMinutes(end.getMinutes() + minutesDelta)
    await updateEvent(id, { start: start.toISOString(), end: end.toISOString() })
  }

  const resizeEvent = async (id: string, edge: 'start' | 'end', minutesDelta: number) => {
    const existing = events.find((item) => item.id === id)
    if (!existing || existing.isExternal || minutesDelta === 0) return
    const start = new Date(existing.start)
    const end = new Date(existing.end)
    if (edge === 'start') start.setMinutes(start.getMinutes() + minutesDelta)
    else end.setMinutes(end.getMinutes() + minutesDelta)
    if (end <= start) return
    await updateEvent(id, { start: start.toISOString(), end: end.toISOString() })
  }

  const upsertAvailabilityFromForm = async (
    form: AvailabilityFormState,
    practitionerId: string,
    editingId?: string,
  ) => {
    const baseDate = parseDateInput(form.startDate)
    const startTime = form.wholeDay ? WHOLE_DAY_START : form.startTime
    const endTime = form.wholeDay ? WHOLE_DAY_END : form.endTime
    const start = setTimeForDate(baseDate, startTime)
    const end = setTimeForDate(baseDate, endTime)
    if (end <= start) return

    const maxDate = new Date(baseDate)
    maxDate.setDate(maxDate.getDate() + 90)
    const requestedUntil = parseDateInput(form.repeatUntil)
    const repeatUntil = requestedUntil > maxDate ? maxDate : requestedUntil

    const generated: AvailabilityBlock[] = []
    if (form.repeat === 'none') {
      generated.push({
        id: editingId ?? crypto.randomUUID(),
        practitionerId,
        start: start.toISOString(),
        end: end.toISOString(),
        status: form.status,
        appointmentTypeId: form.appointmentTypeId || undefined,
      })
    } else {
      const sourceId = editingId ?? crypto.randomUUID()
      const cursor = new Date(baseDate)
      while (cursor <= repeatUntil) {
        if (form.repeatDays.includes(cursor.getDay())) {
          generated.push({
            id: crypto.randomUUID(),
            sourceId,
            practitionerId,
            start: setTimeForDate(cursor, startTime).toISOString(),
            end: setTimeForDate(cursor, endTime).toISOString(),
            status: form.status,
            appointmentTypeId: form.appointmentTypeId || undefined,
          })
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    const previous = availabilityBlocks
    const generatedIds = generated.map((item) => item.id)

    setPendingAvailabilityIds((prev) => new Set([...prev, ...generatedIds]))
    setAvailabilityBlocks((prev) => {
      const base = editingId ? prev.filter((item) => item.id !== editingId && item.sourceId !== editingId) : prev
      return [...base, ...generated]
    })
    rollForwardCreated(setRecentlyCreatedAvailabilityIds, generatedIds)

    setAvailabilityDraft(null)
    setAvailabilityEditingId(null)

    try {
      if (editingId && generated.length === 1) {
        await calendarApi.updateAvailability(generated[0])
      } else {
        await calendarApi.createAvailability(generated)
      }
    } catch {
      setAvailabilityBlocks(previous)
    } finally {
      setPendingAvailabilityIds((prev) => {
        const next = new Set(prev)
        generatedIds.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const moveAvailability = async (id: string, minutesDelta: number) => {
    const existing = availabilityBlocks.find((item) => item.id === id)
    if (!existing || minutesDelta === 0) return
    const updated: AvailabilityBlock = (() => {
      const start = new Date(existing.start)
      const end = new Date(existing.end)
      start.setMinutes(start.getMinutes() + minutesDelta)
      end.setMinutes(end.getMinutes() + minutesDelta)
      return { ...existing, start: start.toISOString(), end: end.toISOString() }
    })()

    setPendingAvailabilityIds((prev) => new Set([...prev, id]))
    setAvailabilityBlocks((prev) => prev.map((item) => (item.id === id ? updated : item)))
    try {
      await calendarApi.updateAvailability(updated)
    } catch {
      setAvailabilityBlocks((prev) => prev.map((item) => (item.id === id ? existing : item)))
    } finally {
      setPendingAvailabilityIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const resizeAvailability = async (id: string, edge: 'start' | 'end', minutesDelta: number) => {
    const existing = availabilityBlocks.find((item) => item.id === id)
    if (!existing || minutesDelta === 0) return

    const updated: AvailabilityBlock | null = (() => {
      const start = new Date(existing.start)
      const end = new Date(existing.end)
      if (edge === 'start') start.setMinutes(start.getMinutes() + minutesDelta)
      else end.setMinutes(end.getMinutes() + minutesDelta)
      if (end <= start) return null
      return { ...existing, start: start.toISOString(), end: end.toISOString() }
    })()
    if (!updated) return

    setPendingAvailabilityIds((prev) => new Set([...prev, id]))
    setAvailabilityBlocks((prev) => prev.map((item) => (item.id === id ? updated : item)))
    try {
      await calendarApi.updateAvailability(updated)
    } catch {
      setAvailabilityBlocks((prev) => prev.map((item) => (item.id === id ? existing : item)))
    } finally {
      setPendingAvailabilityIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const deleteAvailability = async (id: string) => {
    const toDelete = availabilityBlocks.filter((item) => item.id === id || item.sourceId === id)
    if (!toDelete.length) return
    const ids = toDelete.map((item) => item.id)
    const previous = availabilityBlocks
    setPendingAvailabilityIds((prev) => new Set([...prev, ...ids]))
    setAvailabilityBlocks((prev) => prev.filter((item) => item.id !== id && item.sourceId !== id))
    setAvailabilityEditingId(null)
    setAvailabilityDraft(null)
    try {
      await calendarApi.deleteAvailability(ids)
    } catch {
      setAvailabilityBlocks(previous)
    } finally {
      setPendingAvailabilityIds((prev) => {
        const next = new Set(prev)
        ids.forEach((itemId) => next.delete(itemId))
        return next
      })
    }
  }

  const openAvailabilityDraft = (
    practitionerId: string,
    startSlot: number,
    endSlot: number,
    onDate: Date = selectedDate,
    wholeDay = false,
  ) => {
    const startMinutes = GRID_START_MINUTES + startSlot * SLOT_MINUTES
    const endMinutes = GRID_START_MINUTES + (endSlot + 1) * SLOT_MINUTES
    const startDate = new Date(onDate)
    startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
    const endDate = new Date(onDate)
    endDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)
    const isWholeDay = wholeDay || (startSlot === 0 && endSlot >= SLOT_COUNT - 1)
    setAvailabilityDraft({
      startDate: toDateInputValue(onDate),
      startTime: isWholeDay ? WHOLE_DAY_START : formatTime(startDate),
      endTime: isWholeDay ? WHOLE_DAY_END : formatTime(endDate),
      wholeDay: isWholeDay,
      status: 'available',
      repeat: 'none',
      repeatDays: [onDate.getDay()],
      repeatUntil: toDateInputValue(
        new Date(onDate.getFullYear(), onDate.getMonth(), onDate.getDate() + 30),
      ),
    })
    setContextMenu({ open: false })
    return practitionerId
  }

  const createEvent = async (input: {
    practitionerId: string
    patientName: string
    appointmentTypeId: string
    startTime: string
    endTime: string
    notes: string
    location?: string
    date?: string
  }) => {
    const day = input.date ? parseDateInput(input.date) : selectedDate
    const start = setTimeForDate(day, input.startTime)
    const end = setTimeForDate(day, input.endTime)
    if (end <= start) return
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      practitionerId: input.practitionerId,
      patientName: input.patientName,
      appointmentTypeId: input.appointmentTypeId,
      start: start.toISOString(),
      end: end.toISOString(),
      notes: input.notes,
      location: input.location,
    }
    setPendingEventIds((prev) => new Set([...prev, event.id]))
    setEvents((prev) => [...prev, event])
    setSelectedEventId(event.id)
    try {
      await calendarApi.createEvent(event)
    } catch {
      setEvents((prev) => prev.filter((item) => item.id !== event.id))
      setSelectedEventId(null)
    } finally {
      setPendingEventIds((prev) => {
        const next = new Set(prev)
        next.delete(event.id)
        return next
      })
    }
  }

  const createAppointmentType = (name: string, ownerPractitionerId: string) => {
    const trimmed = name.trim()
    if (!trimmed || !ownerPractitionerId) return null
    const existing = appointmentTypeCatalog.find(
      (type) =>
        type.ownerPractitionerId === ownerPractitionerId &&
        type.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) return existing
    const created = buildPrivateAppointmentType(trimmed, ownerPractitionerId)
    setAppointmentTypeCatalog((prev) => [...prev, created])
    setFilters((prev) =>
      prev.eventTypeIds.includes(created.id)
        ? prev
        : { ...prev, eventTypeIds: [...prev.eventTypeIds, created.id] },
    )
    return created
  }

  const goToToday = () => {
    setSelectedDate(new Date())
    triggerLoading()
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    triggerLoading()
  }

  return {
    calendarMode,
    viewMode,
    selectedDate,
    isLoading,
    events: visibleEvents,
    availabilityBlocks: visibleAvailability,
    allAvailabilityBlocks: availabilityBlocks,
    appointmentTypeCatalog,
    filters,
    visiblePractitioners,
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
  }
}
