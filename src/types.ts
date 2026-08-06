export type CalendarMode = 'events' | 'availability'
export type ViewMode = 'day' | 'week' | 'month'
export type AvailabilityStatus = 'available' | 'busy' | 'blocked'
export type RepeatMode = 'none' | 'weekly'

export type Practitioner = {
  id: string
  name: string
  role: 'Practitioner' | 'Therapist' | 'Admin'
  location: 'North Clinic' | 'West Clinic' | 'Virtual'
  isCurrentUser?: boolean
}

export type AppointmentType = {
  id: string
  name: string
  color: string
  textColor: string
  scope: 'global' | 'private'
  /** Private types are visible only to the owning practitioner and Admin staff. */
  ownerPractitionerId?: string
  /** Admin practice-default metadata */
  baseDurationMin?: number
  patientClass?: 'new' | 'existing' | 'both'
  modalities?: Array<'in-person' | 'telehealth' | 'phone'>
  noticeWindowHours?: number
  bookingWindowDays?: number
  bufferBefore?: number
  bufferAfter?: number
  /** single = one patient; multiple = group with maxLimit */
  userType?: 'single' | 'multiple'
  maxLimit?: number
}

export type CalendarEvent = {
  id: string
  practitionerId: string
  patientName: string
  appointmentTypeId: string
  start: string
  end: string
  notes: string
  location?: string
  isExternal?: boolean
}

export type AvailabilityBlock = {
  id: string
  practitionerId: string
  start: string
  end: string
  status: AvailabilityStatus
  appointmentTypeId?: string
  sourceId?: string
}

export type TeamFilters = {
  practitionerIds: string[]
  eventTypeIds: string[]
  roles: string[]
  locations: string[]
}

export type ContextMenuState =
  | { open: false }
  | {
      open: true
      x: number
      y: number
      target: 'slot' | 'availability'
      practitionerId: string
      slotIndex: number
      availabilityId?: string
      dateKey?: string
    }

export type AvailabilityFormState = {
  startDate: string
  startTime: string
  endTime: string
  wholeDay: boolean
  status: AvailabilityStatus
  appointmentTypeId?: string
  repeat: RepeatMode
  repeatDays: number[]
  repeatUntil: string
}
