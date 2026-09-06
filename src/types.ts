export type CalendarMode = 'events' | 'availability'
export type ViewMode = 'day' | 'week' | 'month'
export type AvailabilityStatus = 'available' | 'busy' | 'blocked'
export type RepeatMode = 'none' | 'weekly'

export type Practitioner = {
  id: string
  name: string
  role: 'Practitioner' | 'Therapist' | 'Admin' | 'Staff' | 'Patient'
  location: 'North Clinic' | 'West Clinic' | 'Virtual'
  isCurrentUser?: boolean
  /** IDs of staff members who can manage events/availability on behalf of this practitioner. */
  staffIds?: string[]
  /** The one staff member assigned to this practitioner. */
  assignedStaffId?: string
  staffAccess?: StaffAccessGrant[]
  /** Patient personas only — used to badge the assigned clinician in booking. */
  primaryPractitionerId?: string
  patientClass?: 'new' | 'existing'
}

export type StaffAccessGrant = {
  staffId: string
  canCreateEvent: boolean
  canEditEvent: boolean
  canCreateAvailability: boolean
  canEditAvailability: boolean
}

export type TimeUnit = 'min' | 'hours' | 'days'

export type AppointmentType = {
  id: string
  name: string
  color: string
  textColor: string
  scope: 'global' | 'private'
  /** Private types are visible only to the owning practitioner — not Admin or other doctors. */
  ownerPractitionerId?: string
  /** Admin practice-default metadata — duration/buffers stored in minutes; notice in hours; booking in days. */
  baseDurationMin?: number
  patientClass?: 'new' | 'existing' | 'both'
  modalities?: Array<'in-person' | 'telehealth' | 'phone'>
  noticeWindowHours?: number
  bookingWindowDays?: number
  bufferBefore?: number
  bufferAfter?: number
  /** Preferred display units chosen in the type editor. */
  durationUnit?: TimeUnit
  bufferUnit?: TimeUnit
  noticeUnit?: Exclude<TimeUnit, 'min'>
  bookingUnit?: Exclude<TimeUnit, 'min'>
  /** single = one patient; multiple = group with maxLimit */
  userType?: 'single' | 'multiple'
  maxLimit?: number
}

export type BookingStatus = 'confirmed' | 'pending' | 'rejected' | 'cancelled'

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
  /** Practitioner-created = confirmed. Patient-booked (public link) = pending until approved. */
  bookingStatus?: BookingStatus
  /** Name of the staff/practitioner who approved a patient request. */
  approvedBy?: string
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
  /** When true, weekly repeats are not capped at 12 months. */
  unlimited?: boolean
}
