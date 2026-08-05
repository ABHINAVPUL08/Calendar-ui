import { useMemo, useState } from 'react'
import {
  appointmentTypesForPractitioner,
  formsForAppointmentType,
  practitioners,
  WHOLE_DAY_END,
  WHOLE_DAY_START,
} from '../constants'
import { formatTime, parseDateInput, setTimeForDate, toDateInputValue } from '../date-utils'
import type { AppointmentType, AvailabilityFormState, AvailabilityStatus } from '../types'
import { TimePickerField } from './TimePickerField'

export type CreateEventKind = 'appointment' | 'availability'

export type CreateAppointmentForm = {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  attendees: string
  location: string
  meetingType: 'virtual' | 'in-person'
  appointmentTypeId: string
  patientName: string
  practitionerId: string
  appointmentName: string
  notes: string
  /** Form template ids the doctor assigned to the patient for this visit */
  assignedFormIds: string[]
  /** Days before visit when forms are due */
  formsDueDays: number
}

export type CreateAvailabilityForm = {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  attendees: string
  practitionerId: string
  appointmentTypeIds: string[]
  includeBlocked: boolean
  wholeDay: boolean
  newTypeName: string
}

type Props = {
  initialKind: CreateEventKind
  appointmentTypes: AppointmentType[]
  appointmentDefaults: CreateAppointmentForm
  availabilityDefaults: CreateAvailabilityForm
  /** When true, practitioner is fixed to the clicked/selected person and cannot be changed. */
  lockPractitioner?: boolean
  onCancel: () => void
  onCreateAppointment: (form: CreateAppointmentForm) => void
  onCreateAvailability: (form: CreateAvailabilityForm) => void
  onCreateAppointmentType: (name: string, ownerPractitionerId: string) => AppointmentType | null
}

type Step = 'form' | 'preview'

const fieldClass =
  'h-10 w-full rounded-[5px] border border-[#d3dce4] bg-white px-2.5 text-[13px] text-[#1c2b3a] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15'
const labelClass = 'mb-1.5 block text-[11.5px] font-semibold text-[#3c4b5a]'
const required = <span className="text-rose-500"> *</span>

const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const
const DOW_JS = [1, 2, 3, 4, 5, 6, 0] as const

const formatLongDate = (dateValue: string): string => {
  if (!dateValue) return '—'
  return parseDateInput(dateValue).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

const patientEmailFromName = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return `${slug || 'patient'}@email.com`
}

const addMinutesToTimeLabel = (timeLabel: string, minutes: number): string => {
  const base = setTimeForDate(new Date(2000, 0, 1), timeLabel)
  base.setMinutes(base.getMinutes() + minutes)
  return formatTime(base)
}

const typeDuration = (type: AppointmentType | undefined): number => type?.baseDurationMin ?? 30

export const CreateEventPanel = ({
  initialKind,
  appointmentTypes,
  appointmentDefaults,
  availabilityDefaults,
  lockPractitioner = false,
  onCancel,
  onCreateAppointment,
  onCreateAvailability,
  onCreateAppointmentType,
}: Props) => {
  const [kind, setKind] = useState<CreateEventKind>(initialKind)
  const [step, setStep] = useState<Step>('form')
  const [appointment, setAppointment] = useState(appointmentDefaults)
  const [availability, setAvailability] = useState(availabilityDefaults)
  const [repeatDays, setRepeatDays] = useState<number[]>(() => {
    const start = parseDateInput(availabilityDefaults.startDate)
    const end = parseDateInput(availabilityDefaults.endDate || availabilityDefaults.startDate)
    const days: number[] = []
    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)
    const last = new Date(end)
    last.setHours(0, 0, 0, 0)
    while (cursor <= last) {
      const day = cursor.getDay()
      if (!days.includes(day)) days.push(day)
      cursor.setDate(cursor.getDate() + 1)
    }
    return days.length ? days : [start.getDay()]
  })
  const [showAddAppointmentType, setShowAddAppointmentType] = useState(false)
  const [showAddApptPrivateType, setShowAddApptPrivateType] = useState(false)
  const [newApptPrivateTypeName, setNewApptPrivateTypeName] = useState('')
  const [assignedFormIds, setAssignedFormIds] = useState<string[]>(
    () => appointmentDefaults.assignedFormIds ?? [],
  )
  const [formsDueDays, setFormsDueDays] = useState(appointmentDefaults.formsDueDays ?? 1)

  const bookableTypes = useMemo(
    () => appointmentTypesForPractitioner(appointmentTypes, appointment.practitionerId),
    [appointmentTypes, appointment.practitionerId],
  )

  const availabilityTypes = useMemo(
    () => appointmentTypesForPractitioner(appointmentTypes, availability.practitionerId),
    [appointmentTypes, availability.practitionerId],
  )

  const globalBookable = bookableTypes.filter((type) => type.scope === 'global')
  const privateBookable = bookableTypes.filter((type) => type.scope === 'private')
  const globalAvail = availabilityTypes.filter((type) => type.scope === 'global')
  const privateAvail = availabilityTypes.filter((type) => type.scope === 'private')

  const selectedApptType = bookableTypes.find((type) => type.id === appointment.appointmentTypeId)
  const selectedPractitioner = practitioners.find((p) => p.id === appointment.practitionerId)
  const availabilityPractitioner = practitioners.find((p) => p.id === availability.practitionerId)

  const availableForms = useMemo(
    () => formsForAppointmentType(appointment.appointmentTypeId),
    [appointment.appointmentTypeId],
  )

  const assignedForms = availableForms.filter((form) => assignedFormIds.includes(form.id))

  const apptSummary = selectedApptType
    ? `${selectedApptType.name} · ${typeDuration(selectedApptType)} min with ${selectedPractitioner?.name ?? '—'} on ${
        appointment.endDate && appointment.endDate !== appointment.startDate
          ? `${formatLongDate(appointment.startDate)} – ${formatLongDate(appointment.endDate)}`
          : formatLongDate(appointment.startDate)
      } at ${appointment.startTime}. Forms bundled: ${
        assignedForms.length ? assignedForms.map((f) => f.name).join(', ') : 'None'
      }.`
    : 'Select an appointment type to see a summary.'

  const daysLabel = DOW_JS.filter((d) => repeatDays.includes(d))
    .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
    .join(', ')

  const recurrenceSummary = `Repeats ${daysLabel || '—'}, ${availability.startTime} – ${availability.endTime}, from ${formatLongDate(availability.startDate)} until ${formatLongDate(availability.endDate || availability.startDate)}.`

  const previewTo = patientEmailFromName(appointment.patientName)
  const previewSubject = `Your ${selectedApptType?.name ?? 'appointment'} with ${selectedPractitioner?.name ?? 'your practitioner'} is confirmed`
  const previewEndTime = addMinutesToTimeLabel(
    appointment.startTime,
    typeDuration(selectedApptType),
  )
  const previewRows = [
    { k: 'Type', v: selectedApptType?.name ?? '—' },
    { k: 'Date', v:
      appointment.endDate && appointment.endDate !== appointment.startDate
        ? `${formatLongDate(appointment.startDate)} – ${formatLongDate(appointment.endDate)}`
        : formatLongDate(appointment.startDate),
    },
    { k: 'Time', v: `${appointment.startTime} – ${previewEndTime} (EDT)` },
    { k: 'Practitioner', v: selectedPractitioner?.name ?? '—' },
    {
      k: 'Location',
      v:
        appointment.meetingType === 'virtual' || appointment.location === 'Virtual'
          ? 'Video visit · link in reminder'
          : appointment.location || selectedPractitioner?.location || 'North Clinic',
    },
  ]

  const reminders = [
    { when: 'Immediately', detail: 'Confirmation email · English (US)', active: true },
    { when: '48 hours before', detail: 'Reminder + intake form nudge', active: false },
    { when: '2 hours before', detail: 'Reminder with join details', active: false },
  ]

  const toggleAvailabilityType = (id: string) => {
    setAvailability((prev) => ({
      ...prev,
      appointmentTypeIds: prev.appointmentTypeIds.includes(id)
        ? prev.appointmentTypeIds.filter((item) => item !== id)
        : [...prev.appointmentTypeIds, id],
    }))
  }

  const toggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? (prev.length === 1 ? prev : prev.filter((d) => d !== day)) : [...prev, day],
    )
  }

  const pickAppointmentType = (id: string) => {
    const type = bookableTypes.find((item) => item.id === id)
    const duration = typeDuration(type)
    setAppointment((prev) => ({
      ...prev,
      appointmentTypeId: id,
      appointmentName: type?.name ?? prev.appointmentName,
      endTime: addMinutesToTimeLabel(prev.startTime, duration),
    }))
    // Forms list changes with type — clear previous assignments
    setAssignedFormIds([])
  }

  const toggleAssignedForm = (formId: string) => {
    setAssignedFormIds((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId],
    )
  }

  const assignAllVisibleForms = () => {
    setAssignedFormIds(availableForms.map((form) => form.id))
  }

  const clearAssignedForms = () => {
    setAssignedFormIds([])
  }

  const formatShortDate = (dateValue: string, dayOffset = 0): string => {
    if (!dateValue) return '—'
    const date = parseDateInput(dateValue)
    date.setDate(date.getDate() + dayOffset)
    return date.toLocaleDateString('en-US', { month: 'numeric', day: '2-digit', year: 'numeric' })
  }

  const addPrivateType = (practitionerId: string) => {
    const created = onCreateAppointmentType(availability.newTypeName, practitionerId)
    if (!created) return false
    setAvailability((prev) => ({
      ...prev,
      newTypeName: '',
      appointmentTypeIds: prev.appointmentTypeIds.includes(created.id)
        ? prev.appointmentTypeIds
        : [...prev.appointmentTypeIds, created.id],
    }))
    setShowAddAppointmentType(false)
    return true
  }

  const addApptPrivateType = () => {
    if (!appointment.practitionerId) return false
    const created = onCreateAppointmentType(newApptPrivateTypeName, appointment.practitionerId)
    if (!created) return false
    setNewApptPrivateTypeName('')
    setShowAddApptPrivateType(false)
    setAppointment((prev) => ({
      ...prev,
      appointmentTypeId: created.id,
      appointmentName: created.name,
      endTime: addMinutesToTimeLabel(prev.startTime, typeDuration(created)),
      endDate: prev.startDate,
    }))
    setAssignedFormIds([])
    return true
  }

  const canSubmitAppointment =
    !!appointment.patientName.trim() &&
    !!appointment.practitionerId &&
    !!appointment.appointmentTypeId &&
    !!appointment.startDate &&
    !!appointment.startTime

  const canSubmitAvailability = !!availability.practitionerId

  const modalTitle =
    step === 'preview'
      ? 'What the patient will receive'
      : kind === 'availability'
        ? 'Create Availability'
        : 'Create Event'
  const modalSub =
    step === 'preview'
      ? `${selectedApptType?.name ?? 'Appointment'} · ${formatLongDate(appointment.startDate)} · ${appointment.startTime}`
      : kind === 'appointment'
        ? 'You will see exactly what the patient receives before it sends.'
        : 'Create a new availability.'

  const footNote =
    step === 'preview'
      ? 'View only in this phase — content, language and timing are practice settings.'
      : kind === 'appointment'
        ? 'Nothing is sent until you confirm on the preview.'
        : 'Windows can be scheduled up to 90 days out.'

  const primaryLabel =
    step === 'preview'
      ? 'Send to patient'
      : kind === 'appointment'
        ? 'Preview patient email'
        : 'Create Availability'

  const cancelLabel = step === 'preview' ? 'Back' : 'Cancel'

  const handleCancel = () => {
    if (step === 'preview') {
      setStep('form')
      return
    }
    onCancel()
  }

  const handlePrimary = () => {
    if (step === 'preview') {
      const endTime = addMinutesToTimeLabel(
        appointment.startTime,
        typeDuration(selectedApptType),
      )
      onCreateAppointment({
        ...appointment,
        endDate: appointment.endDate || appointment.startDate,
        endTime,
        appointmentName: appointment.appointmentName || selectedApptType?.name || 'Appointment',
        location:
          appointment.meetingType === 'virtual'
            ? 'Virtual'
            : appointment.location || selectedPractitioner?.location || 'North Clinic',
        assignedFormIds,
        formsDueDays,
      })
      return
    }
    if (kind === 'appointment') {
      setStep('preview')
      return
    }
    onCreateAvailability({
      ...availability,
      endDate: availability.endDate || availability.startDate,
    })
  }

  const kindButtonStyle = (active: boolean) =>
    active
      ? 'rounded-[5px] border border-[#0e4f7c] bg-[#f2f8fc] px-3.5 py-2 text-[12.5px] font-semibold text-[#0e4f7c]'
      : 'rounded-[5px] border border-[#d3dce4] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#3c4b5a] hover:bg-slate-50'

  const typeRowClass = (checked: boolean, privateRow = false) =>
    `flex cursor-pointer items-center gap-2.5 border-b border-[#f1f4f7] px-3 py-2.5 ${
      checked ? (privateRow ? 'bg-[#faf8fd]' : 'bg-[#f6f9fb]') : privateRow ? 'bg-[#fdfcff]' : 'bg-white'
    } hover:bg-slate-50`

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(16,28,40,0.45)] p-4">
      <div
        className={`flex max-h-[min(920px,94vh)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_60px_rgba(16,28,40,0.3)] ${
          step === 'preview' ? 'max-w-[980px]' : 'max-w-[900px]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-event-title"
      >
        <div className="flex items-start gap-4 px-6 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <h2 id="create-event-title" className="text-[16px] font-semibold text-[#1c2b3a]">
              {modalTitle}
            </h2>
            <p className="mt-1 text-[12px] text-[#7c8b9a]">{modalSub}</p>
          </div>

          {step === 'form' && kind === 'appointment' ? (
            <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
              <span className="text-[12px] font-semibold text-[#3c4b5a]">Event Type:</span>
              <div className="flex gap-2">
                <button type="button" className={kindButtonStyle(true)}>
                  Appointment
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 border-none bg-transparent p-0.5 text-[20px] leading-none text-[#93a2b1] hover:text-[#3c4b5a]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === 'preview' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2.5 border-y border-[#e6ddf3] bg-[#f4f0fa] px-6 py-2.5 text-[12px] text-[#584072]">
              <span className="rounded-[3px] bg-[#7b5aa6] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                VIEW ONLY
              </span>
              <span>
                Content, language and reminder timing are set by the practice. Editing arrives in a
                later phase.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr]">
              <div className="border-r border-[#eef2f6] p-[18px_22px]">
                <div className="overflow-hidden rounded-md border border-[#e2e8ee]">
                  <div className="flex flex-col gap-1.5 border-b border-[#eef2f6] bg-[#fbfcfd] px-4 py-3">
                    <div className="flex gap-2 text-[11.5px]">
                      <span className="w-[50px] text-[#93a2b1]">From</span>
                      <span className="text-[#1c2b3a]">
                        Northline Health &lt;no-reply@northlinehealth.com&gt;
                      </span>
                    </div>
                    <div className="flex gap-2 text-[11.5px]">
                      <span className="w-[50px] text-[#93a2b1]">To</span>
                      <span className="text-[#1c2b3a]">{previewTo}</span>
                    </div>
                    <div className="flex gap-2 text-[11.5px]">
                      <span className="w-[50px] text-[#93a2b1]">Subject</span>
                      <span className="font-semibold text-[#1c2b3a]">{previewSubject}</span>
                    </div>
                  </div>
                  <div className="bg-white px-5 py-[18px] text-[12.5px] leading-[1.7] text-[#33414f]">
                    <div className="mb-3 font-semibold">Hi {appointment.patientName.trim()},</div>
                    <div className="mb-3.5">
                      Hey your appointment with {selectedPractitioner?.name} has been booked
                      <br />
                      Below are the details
                    </div>
                    <div className="mb-3.5 flex flex-col gap-1.5 rounded-[5px] border border-[#e6ecf1] px-4 py-3.5">
                      {previewRows.map((row) => (
                        <div key={row.k} className="flex gap-3 text-[12px]">
                          <span className="w-[92px] text-[#8b9aa8]">{row.k}</span>
                          <span className="font-medium text-[#1c2b3a]">{row.v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mb-3.5">
                      Please complete the attached intake forms before your visit. If you need to
                      reschedule, use the link below at least 24 hours in advance.
                    </div>
                    <div className="inline-block rounded bg-[#0e4f7c] px-[18px] py-2 text-[12px] font-semibold text-white">
                      Manage appointment
                    </div>
                    <div className="mt-4 text-[11.5px] text-[#8b9aa8]">
                      Northline Health · 24 Bay Street, Suite 300
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[18px] p-[18px_22px]">
                <div>
                  <div className="mb-2 text-[10px] font-bold tracking-wide text-[#93a2b1] uppercase">
                    Language
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[5px] border border-[#e2e8ee] bg-[#fbfcfd] px-3 py-2.5">
                    <span className="text-[12.5px] font-semibold text-[#1c2b3a]">English (US)</span>
                    <span className="text-[11px] text-[#8b9aa8]">from patient profile</span>
                    <span className="ml-auto rounded-[3px] border border-[#dde4ea] px-1.5 py-0.5 text-[9.5px] text-[#a3b0bc]">
                      LOCKED
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-bold tracking-wide text-[#93a2b1] uppercase">
                    Reminder schedule
                  </div>
                  <div className="flex flex-col">
                    {reminders.map((item, index) => (
                      <div key={item.when} className="flex gap-2.5">
                        <div className="flex w-3 flex-col items-center">
                          <span
                            className={`mt-1 size-2.5 rounded-full ${
                              item.active ? 'bg-[#0e4f7c]' : 'bg-[#c9d3dc]'
                            }`}
                          />
                          {index < reminders.length - 1 ? (
                            <span className="mt-1 w-px flex-1 bg-[#e2e8ee]" />
                          ) : null}
                        </div>
                        <div className="pb-3">
                          <div className="text-[12px] font-semibold text-[#1c2b3a]">{item.when}</div>
                          <div className="mt-0.5 text-[11px] text-[#8b9aa8]">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-bold tracking-wide text-[#93a2b1] uppercase">
                    Bundled forms
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {assignedForms.length === 0 ? (
                      <div className="flex items-center gap-2.5 rounded-[5px] border border-[#e2e8ee] px-2.5 py-2 text-[12px] text-[#33414f]">
                        <span className="size-1.5 rounded-full bg-[#3f8f6d]" />
                        <span className="flex-1">No forms bundled with this type</span>
                      </div>
                    ) : (
                      assignedForms.map((form) => (
                        <div
                          key={form.id}
                          className="flex items-center gap-2.5 rounded-[5px] border border-[#e2e8ee] px-2.5 py-2 text-[12px] text-[#33414f]"
                        >
                          <span className="size-1.5 rounded-full bg-[#3f8f6d]" />
                          <span className="flex-1">{form.name}</span>
                          <span className="text-[10.5px] text-[#93a2b1]">
                            due {formsDueDays}d before
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : kind === 'appointment' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1.5 pb-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-[15px]">
                <label>
                  <span className={labelClass}>
                    Patient
                    {required}
                  </span>
                  <input
                    className={fieldClass}
                    value={appointment.patientName}
                    onChange={(event) =>
                      setAppointment({ ...appointment, patientName: event.target.value })
                    }
                    placeholder="Enter patient name"
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Practitioner Name
                    {required}
                  </span>
                  {lockPractitioner ? (
                    <input
                      className={`${fieldClass} cursor-not-allowed bg-slate-50`}
                      value={selectedPractitioner?.name ?? ''}
                      readOnly
                      disabled
                    />
                  ) : (
                    <select
                      className={fieldClass}
                      value={appointment.practitionerId}
                      onChange={(event) => {
                        const practitionerId = event.target.value
                        const nextTypes = appointmentTypesForPractitioner(
                          appointmentTypes,
                          practitionerId,
                        )
                        const stillValid = nextTypes.some(
                          (type) => type.id === appointment.appointmentTypeId,
                        )
                        const nextTypeId = stillValid
                          ? appointment.appointmentTypeId
                          : nextTypes[0]?.id ?? ''
                        const nextType = nextTypes.find((type) => type.id === nextTypeId)
                        setAppointment({
                          ...appointment,
                          practitionerId,
                          appointmentTypeId: nextTypeId,
                          appointmentName: nextType?.name ?? appointment.appointmentName,
                          endTime: addMinutesToTimeLabel(
                            appointment.startTime,
                            typeDuration(nextType),
                          ),
                        })
                        if (nextTypeId !== appointment.appointmentTypeId) {
                          setAssignedFormIds([])
                        }
                      }}
                    >
                      <option value="">Select an option</option>
                      {practitioners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className={labelClass}>
                      Start Date
                      {required}
                    </span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={appointment.startDate}
                      onChange={(event) =>
                        setAppointment({
                          ...appointment,
                          startDate: event.target.value,
                          endDate:
                            appointment.endDate && appointment.endDate < event.target.value
                              ? event.target.value
                              : appointment.endDate || event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className={labelClass}>
                      End Date
                      {required}
                    </span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={appointment.endDate || appointment.startDate}
                      min={appointment.startDate}
                      onChange={(event) =>
                        setAppointment({
                          ...appointment,
                          endDate: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TimePickerField
                    label="Start Time"
                    required
                    value={appointment.startTime}
                    placeholder="12:00 AM"
                    onChange={(startTime) =>
                      setAppointment({
                        ...appointment,
                        startTime,
                        endTime: addMinutesToTimeLabel(
                          startTime,
                          typeDuration(selectedApptType),
                        ),
                      })
                    }
                  />
                  <TimePickerField
                    label="End Time"
                    value={appointment.endTime}
                    placeholder="9:00 AM"
                    onChange={(endTime) =>
                      setAppointment({
                        ...appointment,
                        endTime,
                      })
                    }
                  />
                </div>

                <label>
                  <span className={labelClass}>
                    Additional attendees only (excluding patient)
                  </span>
                  <input
                    className={fieldClass}
                    value={appointment.attendees}
                    onChange={(event) =>
                      setAppointment({ ...appointment, attendees: event.target.value })
                    }
                    placeholder="Type to search or add email"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-[13px]">
                <div>
                  <span className={labelClass}>
                    Appointment Type
                    {required}
                  </span>
                  <div className="overflow-hidden rounded-md border border-[#e2e8ee]">
                    {globalBookable.map((type) => (
                      <label key={type.id} className={typeRowClass(appointment.appointmentTypeId === type.id)}>
                        <input
                          type="radio"
                          name="appointmentType"
                          checked={appointment.appointmentTypeId === type.id}
                          onChange={() => pickAppointmentType(type.id)}
                          className="size-3.5 accent-[#0e4f7c]"
                        />
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ background: type.color }}
                        />
                        <span className="flex-1 text-[12.5px] text-[#1c2b3a]">{type.name}</span>
                        <span className="font-mono text-[11px] text-[#93a2b1]">
                          {typeDuration(type)} min
                        </span>
                      </label>
                    ))}

                    <div className="flex items-center gap-1.5 border-y border-[#eef2f6] bg-[#faf8fd] px-3 py-1.5">
                      <span className="text-[10px] font-bold tracking-wide text-[#7b5aa6] uppercase">
                        Private Types
                      </span>
                      <span className="text-[10px] text-[#a08cc0]">
                        visible to you, Staff and Admin only
                      </span>
                    </div>

                    {privateBookable.map((type) => (
                      <label
                        key={type.id}
                        className={typeRowClass(appointment.appointmentTypeId === type.id, true)}
                      >
                        <input
                          type="radio"
                          name="appointmentType"
                          checked={appointment.appointmentTypeId === type.id}
                          onChange={() => pickAppointmentType(type.id)}
                          className="size-3.5 accent-[#7b5aa6]"
                        />
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ background: type.color }}
                        />
                        <span className="flex-1 text-[12.5px] text-[#1c2b3a]">{type.name}</span>
                        <span className="font-mono text-[11px] text-[#93a2b1]">
                          {typeDuration(type)} min
                        </span>
                      </label>
                    ))}

                    {showAddApptPrivateType ? (
                      <div className="border-t border-dashed border-[#e2e8ee] bg-white p-3">
                        {!appointment.practitionerId ? (
                          <p className="text-[12px] text-[#8b9aa8]">
                            Select a practitioner first. The new type stays private to them only.
                          </p>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <input
                                className={`${fieldClass} flex-1`}
                                value={newApptPrivateTypeName}
                                onChange={(event) => setNewApptPrivateTypeName(event.target.value)}
                                placeholder="Private type name"
                                autoFocus
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    addApptPrivateType()
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={!newApptPrivateTypeName.trim()}
                                onClick={addApptPrivateType}
                                className="h-10 shrink-0 rounded-[5px] bg-[#0e4f7c] px-3 text-[12px] font-semibold text-white disabled:opacity-40"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddApptPrivateType(false)
                                  setNewApptPrivateTypeName('')
                                }}
                                className="h-10 shrink-0 rounded-[5px] border border-[#d3dce4] px-3 text-[12px] font-medium text-[#3c4b5a]"
                              >
                                Cancel
                              </button>
                            </div>
                            <p className="mt-2 text-[11px] text-[#8b9aa8]">
                              Only this practitioner (plus Staff/Admin) will see this type — not other
                              practitioners.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddApptPrivateType(true)}
                        className="w-full border-none border-t border-dashed border-[#e2e8ee] bg-white px-3 py-2.5 text-left text-[12px] font-semibold text-[#0f5b8f] hover:bg-[#f6f9fb]"
                      >
                        + Add Appointment Type
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-[5px] border border-[#e4ebf1] bg-[#f6f9fb] px-3.5 py-3 text-[12px] leading-[1.6] text-[#3c4b5a]">
                  {apptSummary}
                </div>
              </div>
            </div>

            {/* Forms change with appointment type — doctor assigns to patient */}
            {appointment.appointmentTypeId ? (
              <div className="mt-6 border-t border-[#e8edf2] pt-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1c2b3a]">Select Forms</h3>
                    <p className="mt-0.5 text-[12px] text-[#8b9aa8]">
                      Click the checkboxes to assign forms for{' '}
                      <span className="font-semibold text-[#3c4b5a]">
                        {selectedApptType?.name ?? 'this appointment'}
                      </span>
                      .
                    </p>
                  </div>
                  <label className="w-[160px]">
                    <span className={labelClass}>Forms Due (Days Before Visit)</span>
                    <select
                      className={fieldClass}
                      value={formsDueDays}
                      onChange={(event) => setFormsDueDays(Number(event.target.value))}
                    >
                      {[1, 2, 3, 5, 7].map((days) => (
                        <option key={days} value={days}>
                          {days}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mb-3 flex flex-wrap gap-3">
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12.5px] ${
                      assignedFormIds.length === availableForms.length && availableForms.length > 0
                        ? 'border-[#0e4f7c] bg-[#f2f8fc] text-[#0e4f7c]'
                        : 'border-[#d3dce4] bg-white text-[#3c4b5a]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 accent-[#0e4f7c]"
                      checked={
                        availableForms.length > 0 &&
                        assignedFormIds.length === availableForms.length
                      }
                      onChange={(event) => {
                        if (event.target.checked) assignAllVisibleForms()
                        else clearAssignedForms()
                      }}
                    />
                    Assign all forms for this type
                  </label>
                  {appointment.appointmentTypeId === 'initial-visit' ? (
                    <span className="self-center text-[11px] text-[#8b9aa8]">
                      Initial visit bundle · {availableForms.length} forms
                    </span>
                  ) : null}
                  {appointment.appointmentTypeId === 'follow-up' ? (
                    <span className="self-center text-[11px] text-[#8b9aa8]">
                      Follow-up bundle · {availableForms.length} forms
                    </span>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-md border border-[#e2e8ee]">
                  <div className="grid grid-cols-[40px_minmax(0,1.4fr)_110px_100px_100px] gap-2 bg-[#0e4f7c] px-3 py-2.5 text-[11px] font-semibold tracking-wide text-white uppercase max-[700px]:grid-cols-[36px_1fr_90px]">
                    <span className="text-center">Assign</span>
                    <span>Form Name</span>
                    <span>Status</span>
                    <span className="max-[700px]:hidden">Submit By</span>
                    <span className="max-[700px]:hidden">Due</span>
                  </div>

                  {availableForms.map((form) => {
                    const isAssigned = assignedFormIds.includes(form.id)
                    return (
                      <label
                        key={form.id}
                        className="grid cursor-pointer grid-cols-[40px_minmax(0,1.4fr)_110px_100px_100px] items-center gap-2 border-t border-[#eef2f6] bg-white px-3 py-2.5 hover:bg-[#f8fafc] max-[700px]:grid-cols-[36px_1fr_90px]"
                      >
                        <span className="flex justify-center">
                          <input
                            type="checkbox"
                            className="size-3.5 accent-[#0e4f7c]"
                            checked={isAssigned}
                            onChange={() => toggleAssignedForm(form.id)}
                          />
                        </span>
                        <span className="truncate text-[12.5px] font-medium text-[#1c2b3a]">
                          {form.name}
                        </span>
                        <span>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                              isAssigned
                                ? 'bg-[#fde8e8] text-[#b42318]'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isAssigned ? 'Assigned' : 'Unassigned'}
                          </span>
                        </span>
                        <span className="text-[12px] text-[#5a6b7b] max-[700px]:hidden">
                          {isAssigned
                            ? formatShortDate(appointment.startDate, -formsDueDays)
                            : '—'}
                        </span>
                        <span className="text-[12px] text-[#8b9aa8] max-[700px]:hidden">
                          {isAssigned ? `${formsDueDays} day(s) before` : '—'}
                        </span>
                      </label>
                    )
                  })}
                </div>

                <p className="mt-2 text-[11.5px] text-[#8b9aa8]">
                  {assignedFormIds.length} of {availableForms.length} form
                  {availableForms.length === 1 ? '' : 's'} assigned to the patient.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1.5 pb-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-[15px]">
                <label>
                  <span className={labelClass}>
                    Practitioner Name
                    {required}
                  </span>
                  {lockPractitioner ? (
                    <input
                      className={`${fieldClass} cursor-not-allowed bg-slate-50`}
                      value={availabilityPractitioner?.name ?? ''}
                      readOnly
                      disabled
                    />
                  ) : (
                    <select
                      className={fieldClass}
                      value={availability.practitionerId}
                      onChange={(event) => {
                        const practitionerId = event.target.value
                        const nextTypes = appointmentTypesForPractitioner(
                          appointmentTypes,
                          practitionerId,
                        )
                        const allowed = new Set(nextTypes.map((type) => type.id))
                        setAvailability({
                          ...availability,
                          practitionerId,
                          appointmentTypeIds: availability.appointmentTypeIds.filter((id) =>
                            allowed.has(id),
                          ),
                        })
                      }}
                    >
                      <option value="">Select an option</option>
                      {practitioners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <TimePickerField
                    label="Start Time"
                    required
                    value={availability.startTime}
                    onChange={(startTime) =>
                      setAvailability({ ...availability, startTime })
                    }
                  />
                  <TimePickerField
                    label="End Time"
                    required
                    value={availability.endTime}
                    onChange={(endTime) =>
                      setAvailability({ ...availability, endTime })
                    }
                  />
                </div>

                <div>
                  <span className={labelClass}>Repeats on</span>
                  <div className="flex gap-1.5">
                    {DOW_LABELS.map((label, index) => {
                      const day = DOW_JS[index]
                      const active = repeatDays.includes(day)
                      return (
                        <button
                          key={`${label}-${day}`}
                          type="button"
                          onClick={() => toggleRepeatDay(day)}
                          className={`size-8 rounded-full text-[12px] font-semibold ${
                            active
                              ? 'bg-[#0e4f7c] text-white'
                              : 'border border-[#d3dce4] bg-white text-[#3c4b5a] hover:bg-slate-50'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className={labelClass}>
                      Start Date
                      {required}
                    </span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={availability.startDate}
                      onChange={(event) =>
                        setAvailability({ ...availability, startDate: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span className={labelClass}>
                      End Date
                      {required}
                    </span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={availability.endDate}
                      onChange={(event) =>
                        setAvailability({ ...availability, endDate: event.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="rounded-[5px] border border-[#e4ebf1] bg-[#f6f9fb] px-3.5 py-3 text-[12px] leading-[1.55] text-[#3c4b5a]">
                  {recurrenceSummary}
                </div>
              </div>

              <div className="flex flex-col gap-[13px]">
                <div>
                  <span className={labelClass}>
                    Appointment Types
                    {required}
                  </span>
                  <div className="overflow-hidden rounded-md border border-[#e2e8ee]">
                    {globalAvail.map((type) => (
                      <label
                        key={type.id}
                        className={typeRowClass(availability.appointmentTypeIds.includes(type.id))}
                      >
                        <input
                          type="checkbox"
                          checked={availability.appointmentTypeIds.includes(type.id)}
                          onChange={() => toggleAvailabilityType(type.id)}
                          className="size-3.5 accent-[#0e4f7c]"
                        />
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ background: type.color }}
                        />
                        <span className="flex-1 text-[12.5px] text-[#1c2b3a]">{type.name}</span>
                        <span className="font-mono text-[11px] text-[#93a2b1]">
                          {typeDuration(type)} min
                        </span>
                      </label>
                    ))}

                    <div className="flex items-center gap-1.5 border-y border-[#eef2f6] bg-[#faf8fd] px-3 py-1.5">
                      <span className="text-[10px] font-bold tracking-wide text-[#7b5aa6] uppercase">
                        Private Types
                      </span>
                      <span className="text-[10px] text-[#a08cc0]">
                        visible to you, Staff and Admin only
                      </span>
                    </div>

                    {privateAvail.map((type) => (
                      <label
                        key={type.id}
                        className={typeRowClass(
                          availability.appointmentTypeIds.includes(type.id),
                          true,
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={availability.appointmentTypeIds.includes(type.id)}
                          onChange={() => toggleAvailabilityType(type.id)}
                          className="size-3.5 accent-[#7b5aa6]"
                        />
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ background: type.color }}
                        />
                        <span className="flex-1 text-[12.5px] text-[#1c2b3a]">{type.name}</span>
                        <span className="font-mono text-[11px] text-[#93a2b1]">
                          {typeDuration(type)} min
                        </span>
                      </label>
                    ))}

                    <label className={typeRowClass(availability.includeBlocked)}>
                      <input
                        type="checkbox"
                        checked={availability.includeBlocked}
                        onChange={(event) =>
                          setAvailability({
                            ...availability,
                            includeBlocked: event.target.checked,
                          })
                        }
                        className="size-3.5 accent-[#0e4f7c]"
                      />
                      <span className="flex-1 text-[12.5px] text-[#1c2b3a]">Blocked</span>
                    </label>

                    {showAddAppointmentType ? (
                      <div className="border-t border-dashed border-[#e2e8ee] bg-white p-3">
                        <div className="flex gap-2">
                          <input
                            className={`${fieldClass} flex-1`}
                            value={availability.newTypeName}
                            onChange={(event) =>
                              setAvailability({
                                ...availability,
                                newTypeName: event.target.value,
                              })
                            }
                            placeholder="Private type name"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={
                              !availability.practitionerId || !availability.newTypeName.trim()
                            }
                            onClick={() => addPrivateType(availability.practitionerId)}
                            className="h-10 shrink-0 rounded-[5px] bg-[#0e4f7c] px-3 text-[12px] font-semibold text-white disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddAppointmentType(false)
                              setAvailability((prev) => ({ ...prev, newTypeName: '' }))
                            }}
                            className="h-10 shrink-0 rounded-[5px] border border-[#d3dce4] px-3 text-[12px] font-medium text-[#3c4b5a]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddAppointmentType(true)}
                        className="w-full border-none border-t border-dashed border-[#e2e8ee] bg-white px-3 py-2.5 text-left text-[12px] font-semibold text-[#0f5b8f]"
                      >
                        + Add Appointment Type
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-[5px] border border-[#f0e0c4] bg-[#fff8ec] px-3.5 py-3 text-[11.5px] leading-[1.55] text-[#6b5426]">
                  Leaving all types unchecked keeps this window open to every type the practice
                  offers.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 border-t border-[#e8edf2] bg-[#fbfcfd] px-6 py-3.5">
          <div className="text-[11.5px] text-[#8b9aa8]">{footNote}</div>
          <div className="ml-auto flex gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-[5px] border border-[#d3dce4] bg-white px-[22px] py-2 text-[12.5px] font-medium text-[#3c4b5a] hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={
                step === 'preview'
                  ? false
                  : kind === 'appointment'
                    ? !canSubmitAppointment
                    : !canSubmitAvailability
              }
              onClick={handlePrimary}
              className="rounded-[5px] border-none bg-[#0e4f7c] px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#0b4066] disabled:opacity-40"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const buildAvailabilityForms = (
  form: CreateAvailabilityForm,
): Array<{ practitionerId: string; payload: AvailabilityFormState }> => {
  const startTime = form.wholeDay ? WHOLE_DAY_START : form.startTime
  const endTime = form.wholeDay ? WHOLE_DAY_END : form.endTime
  const rangeStart = parseDateInput(form.startDate)
  const rangeEnd = parseDateInput(form.endDate || form.startDate)
  const repeatDays: number[] = []
  const cursor = new Date(rangeStart)
  cursor.setHours(0, 0, 0, 0)
  const last = new Date(rangeEnd)
  last.setHours(0, 0, 0, 0)
  while (cursor <= last) {
    const day = cursor.getDay()
    if (!repeatDays.includes(day)) repeatDays.push(day)
    cursor.setDate(cursor.getDate() + 1)
  }

  const base: Omit<AvailabilityFormState, 'status' | 'appointmentTypeId'> = {
    startDate: form.startDate,
    startTime,
    endTime,
    wholeDay: form.wholeDay,
    repeat: repeatDays.length > 1 || form.startDate !== (form.endDate || form.startDate) ? 'weekly' : 'none',
    repeatDays: repeatDays.length ? repeatDays : [rangeStart.getDay()],
    repeatUntil: form.endDate || form.startDate,
  }

  const results: Array<{ practitionerId: string; payload: AvailabilityFormState }> = []

  form.appointmentTypeIds.forEach((appointmentTypeId) => {
    results.push({
      practitionerId: form.practitionerId,
      payload: {
        ...base,
        status: 'available' as AvailabilityStatus,
        appointmentTypeId,
      },
    })
  })

  if (form.includeBlocked) {
    results.push({
      practitionerId: form.practitionerId,
      payload: {
        ...base,
        status: 'blocked',
      },
    })
  }

  if (!results.length) {
    results.push({
      practitionerId: form.practitionerId,
      payload: {
        ...base,
        status: 'available',
      },
    })
  }

  return results
}

export const defaultAppointmentForm = (args: {
  date: Date
  endDate?: Date
  practitionerId: string
  appointmentTypeId: string
  startTime?: string
  endTime?: string
}): CreateAppointmentForm => {
  const dateValue = toDateInputValue(args.date)
  const endDateValue = toDateInputValue(args.endDate ?? args.date)
  return {
    startDate: dateValue,
    endDate: endDateValue,
    startTime: args.startTime ?? '8:20 AM',
    endTime: args.endTime ?? '9:20 AM',
    attendees: '',
    location: 'North Clinic',
    meetingType: 'in-person',
    appointmentTypeId: args.appointmentTypeId,
    patientName: '',
    practitionerId: args.practitionerId,
    appointmentName: '',
    notes: '',
    assignedFormIds: [],
    formsDueDays: 1,
  }
}

export const defaultAvailabilityForm = (args: {
  date: Date
  practitionerId: string
  startTime?: string
  endTime?: string
  wholeDay?: boolean
}): CreateAvailabilityForm => {
  const dateValue = toDateInputValue(args.date)
  return {
    startDate: dateValue,
    endDate: dateValue,
    startTime: args.startTime ?? '8:20 AM',
    endTime: args.endTime ?? '9:20 AM',
    attendees: '',
    practitionerId: args.practitionerId,
    appointmentTypeIds: ['initial-visit'],
    includeBlocked: false,
    wholeDay: args.wholeDay ?? false,
    newTypeName: '',
  }
}
