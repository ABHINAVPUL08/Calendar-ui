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
/** How far ahead availability can be scheduled (client review: 12 months, not 60/90 days). */
export const AVAILABILITY_HORIZON_DAYS = 365

export const practitioners: Practitioner[] = [
  {
    id: 'p1',
    name: 'Dr. Thomas Reed',
    role: 'Practitioner',
    location: 'North Clinic',
    isCurrentUser: true,
    assignedStaffId: 's1',
    staffIds: ['s1'],
    staffAccess: [
      {
        staffId: 's1',
        canCreateEvent: true,
        canEditEvent: true,
        canCreateAvailability: true,
        canEditAvailability: true,
      },
    ],
  },
  {
    id: 'p2',
    name: 'Mr. Chitraksha Sharma',
    role: 'Therapist',
    location: 'West Clinic',
    assignedStaffId: 's2',
    staffIds: ['s2'],
    staffAccess: [],
  },
  {
    id: 'p3',
    name: 'Dr. Om Sharma',
    role: 'Practitioner',
    location: 'North Clinic',
    assignedStaffId: 's3',
    staffIds: ['s3'],
    staffAccess: [],
  },
  { id: 'p4', name: 'Mr. Kapish Sharma', role: 'Therapist', location: 'Virtual' },
  { id: 'p5', name: 'Mr. Madhan Rangaswamy', role: 'Admin', location: 'West Clinic' },
  { id: 's1', name: 'Abhinav', role: 'Staff', location: 'North Clinic' },
  { id: 's2', name: 'Mayank', role: 'Staff', location: 'West Clinic' },
  { id: 's3', name: 'Mayank Sinha', role: 'Staff', location: 'North Clinic' },
]

export const demoPatients: Practitioner[] = [
  {
    id: 'pt1',
    name: 'Rosa Marin',
    role: 'Patient',
    location: 'North Clinic',
    primaryPractitionerId: 'p1',
    patientClass: 'new',
  },
  {
    id: 'pt2',
    name: 'Devon Wells',
    role: 'Patient',
    location: 'North Clinic',
    primaryPractitionerId: 'p1',
    patientClass: 'new',
  },
  {
    id: 'pt3',
    name: 'Priya Shah',
    role: 'Patient',
    location: 'West Clinic',
    primaryPractitionerId: 'p3',
    patientClass: 'existing',
  },
  {
    id: 'pt4',
    name: 'Tom Becker',
    role: 'Patient',
    location: 'West Clinic',
    primaryPractitionerId: 'p2',
    patientClass: 'existing',
  },
]

export const patientPersona = demoPatients[0]

export const personas: Practitioner[] = [...practitioners, ...demoPatients]

export const patientOptionLabel = (patient: Practitioner) =>
  `${patient.name} (${patient.patientClass === 'existing' ? 'existing' : 'new'})`

export const bookablePractitioners = practitioners.filter(
  (member) => member.role === 'Practitioner' || member.role === 'Therapist',
)

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
  {
    id: 'annual-wellness',
    name: 'Annual Wellness',
    color: '#2a9d8f',
    textColor: '#ffffff',
    scope: 'global',
    baseDurationMin: 45,
    patientClass: 'both',
    modalities: ['in-person', 'telehealth'],
    noticeWindowHours: 24,
    bookingWindowDays: 90,
    bufferBefore: 10,
    bufferAfter: 10,
  },
  {
    id: 'medication-review',
    name: 'Medication Review',
    color: '#3d5a80',
    textColor: '#ffffff',
    scope: 'global',
    baseDurationMin: 20,
    patientClass: 'existing',
    modalities: ['telehealth', 'phone'],
    noticeWindowHours: 6,
    bookingWindowDays: 45,
    bufferBefore: 0,
    bufferAfter: 5,
  },
  {
    id: 'same-day-urgent',
    name: 'Same-day Urgent',
    color: '#c44536',
    textColor: '#ffffff',
    scope: 'global',
    baseDurationMin: 15,
    patientClass: 'both',
    modalities: ['in-person', 'phone'],
    noticeWindowHours: 1,
    bookingWindowDays: 7,
    bufferBefore: 0,
    bufferAfter: 5,
  },
  { id: 'busy-external', name: 'Busy - External', color: '#d9e0e6', textColor: '#3e5569', scope: 'global' },
  {
    id: 'lab-review-private',
    name: 'Lab Review',
    color: '#006b67',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p1',
    baseDurationMin: 30,
    patientClass: 'existing',
    modalities: ['in-person', 'telehealth'],
    noticeWindowHours: 12,
    bookingWindowDays: 30,
    bufferBefore: 5,
    bufferAfter: 5,
  },
  {
    id: 'sports-physical-private',
    name: 'Sports Physical',
    color: '#1d6f42',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p1',
    baseDurationMin: 45,
    patientClass: 'both',
    modalities: ['in-person'],
    noticeWindowHours: 24,
    bookingWindowDays: 60,
    bufferBefore: 10,
    bufferAfter: 10,
  },
  {
    id: 'therapy-intake-private',
    name: 'Therapy Intake',
    color: '#8b4d6b',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p2',
    baseDurationMin: 60,
    patientClass: 'new',
    modalities: ['in-person', 'telehealth'],
    noticeWindowHours: 24,
    bookingWindowDays: 45,
    bufferBefore: 10,
    bufferAfter: 10,
  },
  {
    id: 'counseling-session-private',
    name: 'Counseling Session',
    color: '#6b4f2a',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p2',
    baseDurationMin: 50,
    patientClass: 'existing',
    modalities: ['in-person', 'telehealth'],
    noticeWindowHours: 12,
    bookingWindowDays: 60,
    bufferBefore: 0,
    bufferAfter: 10,
  },
  {
    id: 'procedure-consult-private',
    name: 'Procedure Consult',
    color: '#264653',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p3',
    baseDurationMin: 40,
    patientClass: 'both',
    modalities: ['in-person'],
    noticeWindowHours: 24,
    bookingWindowDays: 45,
    bufferBefore: 10,
    bufferAfter: 15,
  },
  {
    id: 'therapy-follow-up-private',
    name: 'Therapy Follow-up',
    color: '#7a3e5d',
    textColor: '#ffffff',
    scope: 'private',
    ownerPractitionerId: 'p4',
    baseDurationMin: 45,
    patientClass: 'existing',
    modalities: ['telehealth', 'phone'],
    noticeWindowHours: 12,
    bookingWindowDays: 60,
    bufferBefore: 0,
    bufferAfter: 5,
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
  durationUnit?: AppointmentType['durationUnit']
  bufferUnit?: AppointmentType['bufferUnit']
  noticeUnit?: AppointmentType['noticeUnit']
  bookingUnit?: AppointmentType['bookingUnit']
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
  durationUnit: input.durationUnit ?? 'min',
  bufferUnit: input.bufferUnit ?? 'min',
  noticeUnit: input.noticeUnit ?? 'hours',
  bookingUnit: input.bookingUnit ?? 'days',
  userType: input.userType ?? 'single',
  maxLimit: input.userType === 'multiple' ? Math.max(1, input.maxLimit ?? 1) : 1,
})

export const canAccessAppointmentType = (type: AppointmentType, viewer: Practitioner = currentUser): boolean => {
  if (type.scope === 'global') return true
  // Private types stay with the individual doctor who owns them.
  return type.ownerPractitionerId === viewer.id
}

/** Types available when booking for a practitioner.
 * Globals for everyone; private types only when the viewer is that owning doctor (not Admin/others).
 */
export const appointmentTypesForPractitioner = (
  types: AppointmentType[],
  practitionerId: string,
  viewer: Practitioner = currentUser,
): AppointmentType[] =>
  types.filter((type) => {
    if (type.id === 'busy-external') return false
    if (type.scope === 'global') return true
    if (type.ownerPractitionerId !== practitionerId) return false
    // Private types stay with the individual doctor — Admin and other doctors never see them.
    return viewer.id === type.ownerPractitionerId
  })

/** Patient booking: practice-wide types plus that clinician's private types. */
export const patientVisitTypesForPractitioner = (
  types: AppointmentType[],
  practitionerId: string,
): AppointmentType[] =>
  types.filter((type) => {
    if (type.id === 'busy-external') return false
    if (type.scope === 'global') return true
    return type.ownerPractitionerId === practitionerId
  })

export const accessibleAppointmentTypes = (
  viewer: Practitioner = currentUser,
  types: AppointmentType[] = appointmentTypes,
): AppointmentType[] => types.filter((type) => canAccessAppointmentType(type, viewer))

const privateTypeColors = ['#006b67', '#8b4d6b', '#2f6f4e', '#6b4f2a', '#3d5a80', '#7a3e5d']

export const buildPrivateAppointmentType = (
  name: string,
  ownerPractitionerId: string,
  extras?: {
    color?: string
    textColor?: string
    baseDurationMin?: number
    patientClass?: 'new' | 'existing' | 'both'
    modalities?: Array<'in-person' | 'telehealth' | 'phone'>
    bufferBefore?: number
    bufferAfter?: number
    noticeWindowHours?: number
    bookingWindowDays?: number
    durationUnit?: AppointmentType['durationUnit']
    bufferUnit?: AppointmentType['bufferUnit']
    noticeUnit?: AppointmentType['noticeUnit']
    bookingUnit?: AppointmentType['bookingUnit']
    userType?: 'single' | 'multiple'
    maxLimit?: number
  },
): AppointmentType => {
  const color = extras?.color ?? privateTypeColors[name.length % privateTypeColors.length]
  const userType = extras?.userType ?? 'single'
  return {
    id: `private-${ownerPractitionerId}-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    color,
    textColor: extras?.textColor ?? '#ffffff',
    scope: 'private',
    ownerPractitionerId,
    baseDurationMin: extras?.baseDurationMin ?? 35,
    patientClass: extras?.patientClass ?? 'both',
    modalities: extras?.modalities?.length ? extras.modalities : ['in-person'],
    noticeWindowHours: extras?.noticeWindowHours ?? 24,
    bookingWindowDays: extras?.bookingWindowDays ?? 60,
    bufferBefore: extras?.bufferBefore ?? 0,
    bufferAfter: extras?.bufferAfter ?? 0,
    durationUnit: extras?.durationUnit ?? 'min',
    bufferUnit: extras?.bufferUnit ?? 'min',
    noticeUnit: extras?.noticeUnit ?? 'hours',
    bookingUnit: extras?.bookingUnit ?? 'days',
    userType,
    maxLimit: userType === 'multiple' ? Math.max(1, extras?.maxLimit ?? 1) : 1,
  }
}

export const availabilityColors: Record<AvailabilityStatus, string> = {
  /** Events calendar overlay — lighter than booked appointments so they stay distinct. */
  available: 'rgba(190, 245, 214, 0.34)',
  busy: 'rgba(209, 217, 224, 0.72)',
  blocked: 'rgba(209, 217, 224, 0.72)',
}

/** Slightly stronger green on the availability editor so slots are easy to paint, still lighter than events. */
export const availabilityEditorColor = 'rgba(154, 228, 180, 0.55)'

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
  'annual-wellness': [
    { id: 'wellness-screen', name: 'Wellness Screening', defaultStatus: 'Unassigned' },
    { id: 'lifestyle', name: 'Lifestyle', defaultStatus: 'Unassigned' },
    { id: 'history', name: 'History', defaultStatus: 'Unassigned' },
  ],
  'medication-review': [
    { id: 'med-list', name: 'Current Medications', defaultStatus: 'Unassigned' },
    { id: 'symptoms', name: 'Symptoms', defaultStatus: 'Unassigned' },
  ],
  'same-day-urgent': [
    { id: 'urgent-reason', name: 'Reason for Visit', defaultStatus: 'Unassigned' },
    { id: 'symptoms', name: 'Symptoms', defaultStatus: 'Unassigned' },
  ],
  'sports-physical-private': [
    { id: 'activity-history', name: 'Activity History', defaultStatus: 'Unassigned' },
    { id: 'injury-screen', name: 'Injury Screen', defaultStatus: 'Unassigned' },
  ],
  'counseling-session-private': [
    { id: 'session-focus', name: 'Session Focus', defaultStatus: 'Unassigned' },
    { id: 'progress-since-last', name: 'Progress Since Last Visit', defaultStatus: 'Unassigned' },
  ],
  'procedure-consult-private': [
    { id: 'procedure-questions', name: 'Procedure Questions', defaultStatus: 'Unassigned' },
    { id: 'history', name: 'History', defaultStatus: 'Unassigned' },
  ],
  'therapy-follow-up-private': [
    { id: 'session-focus', name: 'Session Focus', defaultStatus: 'Unassigned' },
    { id: 'goals-readiness', name: 'Goals, Readiness & Support', defaultStatus: 'Unassigned' },
  ],
}

/** Extra forms a doctor can assign by hand — these need a due date (PDF). */
export const MANUAL_EXTRA_FORMS: PatientFormTemplate[] = [
  { id: 'photo-consent-extra', name: 'Photo consent', defaultStatus: 'Unassigned' },
  { id: 'insurance-update-extra', name: 'Insurance update', defaultStatus: 'Unassigned' },
]

export const DEFAULT_PATIENT_FORMS: PatientFormTemplate[] = [
  { id: 'about-you', name: 'About You Form', defaultStatus: 'Unassigned' },
  { id: 'symptoms', name: 'Symptoms', defaultStatus: 'Unassigned' },
  { id: 'lifestyle', name: 'Lifestyle', defaultStatus: 'Unassigned' },
]

export const formsForAppointmentType = (appointmentTypeId: string): PatientFormTemplate[] =>
  FORMS_BY_APPOINTMENT_TYPE[appointmentTypeId] ?? DEFAULT_PATIENT_FORMS

