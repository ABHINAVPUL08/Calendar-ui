import type { AppointmentType, AvailabilityStatus, Practitioner } from './types'

/** First slot label: 12:00 AM (midnight) — hospital runs 24 hours */
export const GRID_START_MINUTES = 0
/** Last slot label: 11:30 PM */
export const GRID_END_MINUTES = 23 * 60 + 30
export const SLOT_MINUTES = 30
export const SLOT_COUNT = (GRID_END_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES + 1

/** @deprecated Prefer GRID_START_MINUTES — kept for callers expecting an hour */
export const START_HOUR = Math.floor(GRID_START_MINUTES / 60)
export const END_HOUR = 23

export const practitioners: Practitioner[] = [
  { id: 'p1', name: 'Dr. Thomas Reed', role: 'Practitioner', location: 'North Clinic', isCurrentUser: true },
  { id: 'p2', name: 'Mr. Chitraksha Sharma', role: 'Therapist', location: 'West Clinic' },
  { id: 'p3', name: 'Dr. Om Sharma', role: 'Practitioner', location: 'North Clinic' },
  { id: 'p4', name: 'Mr. Kapish Sharma', role: 'Therapist', location: 'Virtual' },
  { id: 'p5', name: 'Mr. Madhan Rangaswamy', role: 'Admin', location: 'West Clinic' },
]

export const currentUser =
  practitioners.find((item) => item.isCurrentUser) ?? practitioners[0]

export const appointmentTypes: AppointmentType[] = [
  {
    id: 'initial-visit',
    name: 'Initial Visit',
    color: '#0f5f92',
    textColor: '#ffffff',
    scope: 'global',
    baseDurationMin: 60,
    patientClass: 'both',
    modalities: ['in-person', 'telehealth'],
    noticeWindowHours: 24,
    bookingWindowDays: 60,
    bufferBefore: 15,
    bufferAfter: 15,
  },
  {
    id: 'follow-up',
    name: 'Follow-up',
    color: '#7e57c2',
    textColor: '#ffffff',
    scope: 'global',
    baseDurationMin: 30,
    patientClass: 'existing',
    modalities: ['in-person', 'telehealth', 'phone'],
    noticeWindowHours: 12,
    bookingWindowDays: 60,
    bufferBefore: 0,
    bufferAfter: 5,
  },
  {
    id: 'discovery-call',
    name: 'Discovery Call',
    color: '#ef8f25',
    textColor: '#ffffff',
    scope: 'global',
    baseDurationMin: 30,
    patientClass: 'new',
    modalities: ['telehealth', 'phone'],
    noticeWindowHours: 2,
    bookingWindowDays: 30,
    bufferBefore: 0,
    bufferAfter: 0,
  },
  { id: 'busy-external', name: 'Busy - External', color: '#d9e0e6', textColor: '#3e5569', scope: 'global' },
  {
    id: 'lab-review-private',
    name: 'Lab Review (Private)',
    color: '#006b67',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p1',
  },
  {
    id: 'therapy-intake-private',
    name: 'Therapy Intake (Private)',
    color: '#8b4d6b',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p2',
  },
]

export const PRACTICE_TYPE_COLORS = [
  { color: '#0f5f92', textColor: '#ffffff' },
  { color: '#006b67', textColor: '#ffffff' },
  { color: '#2a9d8f', textColor: '#ffffff' },
  { color: '#7e57c2', textColor: '#ffffff' },
  { color: '#ef8f25', textColor: '#ffffff' },
  { color: '#6b7280', textColor: '#ffffff' },
]

export const buildGlobalAppointmentType = (input: {
  name: string
  color: string
  textColor: string
  baseDurationMin: number
  patientClass?: 'new' | 'existing' | 'both'
  modalities: Array<'in-person' | 'telehealth' | 'phone'>
  bufferBefore?: number
  bufferAfter?: number
  noticeWindowHours?: number
  bookingWindowDays?: number
  userType?: 'single' | 'multiple'
  maxLimit?: number
}): AppointmentType => ({
  id: `global-${crypto.randomUUID().slice(0, 8)}`,
  name: input.name.trim(),
  color: input.color,
  textColor: input.textColor,
  scope: 'global',
  baseDurationMin: input.baseDurationMin,
  patientClass: input.patientClass ?? 'both',
  modalities: input.modalities,
  noticeWindowHours: input.noticeWindowHours ?? 24,
  bookingWindowDays: input.bookingWindowDays ?? 60,
  bufferBefore: input.bufferBefore ?? 0,
  bufferAfter: input.bufferAfter ?? 0,
  userType: input.userType ?? 'single',
  maxLimit: input.userType === 'multiple' ? Math.max(1, input.maxLimit ?? 1) : 1,
})

export const canAccessAppointmentType = (type: AppointmentType, viewer: Practitioner = currentUser): boolean => {
  if (type.scope === 'global') return true
  if (viewer.role === 'Admin') return true
  return type.ownerPractitionerId === viewer.id
}

/** Types a practitioner can assign when booking: globals + their own private types. */
export const appointmentTypesForPractitioner = (
  types: AppointmentType[],
  practitionerId: string,
  viewer: Practitioner = currentUser,
): AppointmentType[] =>
  types.filter((type) => {
    if (type.id === 'busy-external') return false
    if (type.scope === 'global') return true
    if (!type.ownerPractitionerId) return false
    // Owner always sees their private types; Admin can assign any private type for that doctor
    if (type.ownerPractitionerId === practitionerId) return true
    if (viewer.role === 'Admin' && type.ownerPractitionerId === practitionerId) return true
    return false
  })

export const accessibleAppointmentTypes = (
  viewer: Practitioner = currentUser,
  types: AppointmentType[] = appointmentTypes,
): AppointmentType[] => types.filter((type) => canAccessAppointmentType(type, viewer))

const privateTypeColors = ['#006b67', '#8b4d6b', '#2f6f4e', '#6b4f2a', '#3d5a80', '#7a3e5d']

export const buildPrivateAppointmentType = (
  name: string,
  ownerPractitionerId: string,
): AppointmentType => {
  const color = privateTypeColors[name.length % privateTypeColors.length]
  return {
    id: `private-${ownerPractitionerId}-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    color,
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId,
  }
}

export const availabilityColors: Record<AvailabilityStatus, string> = {
  available: 'rgba(166, 234, 185, 0.72)',
  busy: 'rgba(209, 217, 224, 0.92)',
  blocked: 'rgba(209, 217, 224, 0.92)',
}

export const WHOLE_DAY_START = '12:00 AM'
export const WHOLE_DAY_END = '11:30 PM'

/** Intake / questionnaire forms a doctor can assign when booking an appointment. */
export type PatientFormTemplate = {
  id: string
  name: string
  /** Used for status badge demos in the assign table */
  defaultStatus: 'Unassigned' | 'Assigned' | 'Report Generated'
}

/**
 * 2–3 forms per appointment type. Private / unknown types fall back to DEFAULT_PATIENT_FORMS.
 */
export const FORMS_BY_APPOINTMENT_TYPE: Record<string, PatientFormTemplate[]> = {
  'initial-visit': [
    { id: 'about-you', name: 'About You Form', defaultStatus: 'Unassigned' },
    { id: 'diagnoses', name: 'Diagnoses', defaultStatus: 'Unassigned' },
    { id: 'new-patient-intake', name: 'New Patient Intake', defaultStatus: 'Unassigned' },
  ],
  'follow-up': [
    { id: 'follow-up-focus', name: 'Follow Up Focus', defaultStatus: 'Unassigned' },
    { id: 'progress-since-last', name: 'Progress Since Last Visit', defaultStatus: 'Unassigned' },
    { id: 'symptoms', name: 'Symptoms', defaultStatus: 'Unassigned' },
  ],
  'discovery-call': [
    { id: 'goals-readiness', name: 'Goals, Readiness & Support', defaultStatus: 'Unassigned' },
    { id: 'about-you', name: 'About You Form', defaultStatus: 'Unassigned' },
    { id: 'lifestyle', name: 'Lifestyle', defaultStatus: 'Unassigned' },
  ],
  'lab-review-private': [
    { id: 'lab-results', name: 'Lab Results Review', defaultStatus: 'Unassigned' },
    { id: 'symptoms', name: 'Symptoms', defaultStatus: 'Unassigned' },
    { id: 'history', name: 'History', defaultStatus: 'Unassigned' },
  ],
  'therapy-intake-private': [
    { id: 'therapy-intake', name: 'Therapy Intake Questionnaire', defaultStatus: 'Unassigned' },
    { id: 'significant-life', name: 'Significant Life Events', defaultStatus: 'Unassigned' },
    { id: 'goals-readiness', name: 'Goals, Readiness & Support', defaultStatus: 'Unassigned' },
  ],
}

export const DEFAULT_PATIENT_FORMS: PatientFormTemplate[] = [
  { id: 'about-you', name: 'About You Form', defaultStatus: 'Unassigned' },
  { id: 'symptoms', name: 'Symptoms', defaultStatus: 'Unassigned' },
  { id: 'lifestyle', name: 'Lifestyle', defaultStatus: 'Unassigned' },
]

export const formsForAppointmentType = (appointmentTypeId: string): PatientFormTemplate[] =>
  FORMS_BY_APPOINTMENT_TYPE[appointmentTypeId] ?? DEFAULT_PATIENT_FORMS

