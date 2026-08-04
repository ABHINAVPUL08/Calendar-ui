import type { AppointmentType, AvailabilityStatus, Practitioner } from './types'

/** First slot label: 8:00 AM */
export const GRID_START_MINUTES = 8 * 60
/** Last slot label: 11:00 PM */
export const GRID_END_MINUTES = 23 * 60
export const SLOT_MINUTES = 30
export const SLOT_COUNT = (GRID_END_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES + 1

/** @deprecated Prefer GRID_START_MINUTES — kept for callers expecting an hour */
export const START_HOUR = Math.floor(GRID_START_MINUTES / 60)
export const END_HOUR = Math.floor(GRID_END_MINUTES / 60)

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
  { id: 'initial-visit', name: 'Initial Visit', color: '#0f5f92', textColor: '#ffffff', scope: 'global' },
  { id: 'follow-up', name: 'Follow-up', color: '#7e57c2', textColor: '#ffffff', scope: 'global' },
  { id: 'discovery-call', name: 'Discovery Call', color: '#ef8f25', textColor: '#ffffff', scope: 'global' },
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
  blocked: 'rgba(72, 84, 95, 0.97)',
}

export const WHOLE_DAY_START = '8:00 AM'
export const WHOLE_DAY_END = '6:00 PM'
