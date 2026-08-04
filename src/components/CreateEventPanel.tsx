import { useMemo, useState } from 'react'
import {
  appointmentTypesForPractitioner,
  practitioners,
  WHOLE_DAY_END,
  WHOLE_DAY_START,
} from '../constants'
import { toDateInputValue } from '../date-utils'
import type { AppointmentType, AvailabilityFormState, AvailabilityStatus } from '../types'

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
  onCancel: () => void
  onCreateAppointment: (form: CreateAppointmentForm) => void
  onCreateAvailability: (form: CreateAvailabilityForm) => void
  onCreateAppointmentType: (name: string, ownerPractitionerId: string) => AppointmentType | null
}

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15'
const labelClass = 'mb-1.5 block text-[13px] font-semibold text-slate-700'
const required = <span className="text-rose-500"> *</span>

export const CreateEventPanel = ({
  initialKind,
  appointmentTypes,
  appointmentDefaults,
  availabilityDefaults,
  onCancel,
  onCreateAppointment,
  onCreateAvailability,
  onCreateAppointmentType,
}: Props) => {
  const kind = initialKind
  const [appointment, setAppointment] = useState(appointmentDefaults)
  const [availability, setAvailability] = useState(availabilityDefaults)
  const [newAppointmentTypeName, setNewAppointmentTypeName] = useState('')
  const [showAddAppointmentType, setShowAddAppointmentType] = useState(false)

  const bookableTypes = useMemo(
    () => appointmentTypesForPractitioner(appointmentTypes, appointment.practitionerId),
    [appointmentTypes, appointment.practitionerId],
  )

  const availabilityTypes = useMemo(
    () => appointmentTypesForPractitioner(appointmentTypes, availability.practitionerId),
    [appointmentTypes, availability.practitionerId],
  )

  const toggleAvailabilityType = (id: string) => {
    setAvailability((prev) => ({
      ...prev,
      appointmentTypeIds: prev.appointmentTypeIds.includes(id)
        ? prev.appointmentTypeIds.filter((item) => item !== id)
        : [...prev.appointmentTypeIds, id],
    }))
  }

  const addPrivateType = (practitionerId: string, forAvailability: boolean) => {
    const created = onCreateAppointmentType(
      forAvailability ? availability.newTypeName : newAppointmentTypeName,
      practitionerId,
    )
    if (!created) return false
    if (forAvailability) {
      setAvailability((prev) => ({
        ...prev,
        newTypeName: '',
        appointmentTypeIds: prev.appointmentTypeIds.includes(created.id)
          ? prev.appointmentTypeIds
          : [...prev.appointmentTypeIds, created.id],
      }))
      return true
    }
    setNewAppointmentTypeName('')
    setAppointment((prev) => ({ ...prev, appointmentTypeId: created.id }))
    return true
  }

  const canSubmitAppointment =
    !!appointment.patientName.trim() &&
    !!appointment.practitionerId &&
    !!appointment.appointmentTypeId &&
    !!appointment.appointmentName.trim()

  const canSubmitAvailability =
    !!availability.practitionerId &&
    (availability.appointmentTypeIds.length > 0 || availability.includeBlocked)

  const pageTitle = kind === 'appointment' ? 'Create Event' : 'Create Availability'
  const pageSubtitle =
    kind === 'appointment'
      ? 'Fill in the details to book a new appointment.'
      : 'Set when you are available, busy, or blocked.'

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-br from-[#e8f4f8] via-[#eef3f8] to-[#dceaf3]">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <p className="mb-4 text-[13px] font-medium text-slate-500">
          Calendar <span className="text-slate-300">›</span>{' '}
          <span className="font-semibold text-slate-700">{pageTitle}</span>
        </p>

        <div className="flex flex-1 flex-col rounded-2xl bg-white shadow-[0_20px_50px_rgba(16,40,70,0.12)] ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900">{pageTitle}</h2>
            <p className="mt-1 text-[13px] text-slate-500">{pageSubtitle}</p>
          </div>

          <div className="flex-1 px-6 py-6">
            {kind === 'appointment' ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className={labelClass}>Start Date</span>
                      <input
                        type="date"
                        className={fieldClass}
                        value={appointment.startDate}
                        onChange={(event) =>
                          setAppointment({ ...appointment, startDate: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className={labelClass}>End Date</span>
                      <input
                        type="date"
                        className={fieldClass}
                        value={appointment.endDate}
                        onChange={(event) =>
                          setAppointment({ ...appointment, endDate: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className={labelClass}>Start Time</span>
                      <input
                        className={fieldClass}
                        value={appointment.startTime}
                        onChange={(event) =>
                          setAppointment({ ...appointment, startTime: event.target.value })
                        }
                        placeholder="8:20 AM"
                      />
                    </label>
                    <label>
                      <span className={labelClass}>End Time</span>
                      <input
                        className={fieldClass}
                        value={appointment.endTime}
                        onChange={(event) =>
                          setAppointment({ ...appointment, endTime: event.target.value })
                        }
                        placeholder="9:20 AM"
                      />
                    </label>
                  </div>
                  <label>
                    <span className={labelClass}>Additional attendees only (excluding patient)</span>
                    <input
                      className={fieldClass}
                      value={appointment.attendees}
                      onChange={(event) =>
                        setAppointment({ ...appointment, attendees: event.target.value })
                      }
                      placeholder="Type to search or add email"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Location</span>
                    <select
                      className={fieldClass}
                      value={appointment.location}
                      onChange={(event) =>
                        setAppointment({ ...appointment, location: event.target.value })
                      }
                    >
                      <option value="">Select an option</option>
                      {['North Clinic', 'West Clinic', 'Virtual'].map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className={labelClass}>Meeting Type</span>
                    <div className="flex flex-wrap gap-5 pt-1">
                      {(
                        [
                          ['virtual', 'Virtual Meeting'],
                          ['in-person', 'In-Person Meeting'],
                        ] as const
                      ).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-[13px] text-slate-700">
                          <input
                            type="radio"
                            name="meetingType"
                            checked={appointment.meetingType === value}
                            onChange={() => setAppointment({ ...appointment, meetingType: value })}
                            className="size-4 accent-[#0f5f92]"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <span className={labelClass}>
                      Appointment Type
                      {required}
                    </span>
                    <select
                      className={fieldClass}
                      value={appointment.appointmentTypeId}
                      onChange={(event) => {
                        const value = event.target.value
                        if (value === '__add_appointment_type__') {
                          setShowAddAppointmentType(true)
                          setNewAppointmentTypeName('')
                          return
                        }
                        setShowAddAppointmentType(false)
                        setAppointment({ ...appointment, appointmentTypeId: value })
                      }}
                    >
                      <option value="">Select an option</option>
                      {bookableTypes
                        .filter((type) => type.scope === 'global')
                        .map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      {bookableTypes.some((type) => type.scope === 'private') ? (
                        <optgroup label="My private types">
                          {bookableTypes
                            .filter((type) => type.scope === 'private')
                            .map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                        </optgroup>
                      ) : null}
                      <option value="__add_appointment_type__" disabled={!appointment.practitionerId}>
                        + Add Appointment Type
                      </option>
                    </select>
                    {showAddAppointmentType ? (
                      <div className="mt-2 rounded-lg border border-[#0f5f92]/25 bg-[#0f5f92]/5 p-3">
                        <p className="mb-2 text-[12px] font-semibold text-[#0f5f92]">
                          Add appointment type
                        </p>
                        {!appointment.practitionerId ? (
                          <p className="text-[12px] text-slate-500">
                            Select a practitioner first, then add a private type for them.
                          </p>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              className={`${fieldClass} flex-1`}
                              value={newAppointmentTypeName}
                              onChange={(event) => setNewAppointmentTypeName(event.target.value)}
                              placeholder="Enter appointment type name"
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  if (addPrivateType(appointment.practitionerId, false)) {
                                    setShowAddAppointmentType(false)
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              disabled={!newAppointmentTypeName.trim()}
                              onClick={() => {
                                if (addPrivateType(appointment.practitionerId, false)) {
                                  setShowAddAppointmentType(false)
                                }
                              }}
                              className="h-11 shrink-0 rounded-lg bg-[#0f5f92] px-3 text-[12px] font-semibold text-white hover:brightness-110 disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddAppointmentType(false)
                                setNewAppointmentTypeName('')
                              }}
                              className="h-11 shrink-0 rounded-lg border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <p className="mt-2 text-[11px] text-slate-400">
                          New types are private to the selected practitioner only.
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <span className={labelClass}>
                      Patient Name
                      {required}
                    </span>
                    <div className="flex gap-2">
                      <input
                        className={`${fieldClass} flex-1`}
                        value={appointment.patientName}
                        onChange={(event) =>
                          setAppointment({ ...appointment, patientName: event.target.value })
                        }
                        placeholder="Enter or select patient"
                      />
                      <button
                        type="button"
                        className="h-11 shrink-0 rounded-lg bg-[#0f5f92] px-3 text-[12px] font-semibold whitespace-nowrap text-white hover:brightness-110"
                        onClick={() =>
                          setAppointment({
                            ...appointment,
                            patientName: appointment.patientName || 'New Patient',
                          })
                        }
                      >
                        + Add New Patient
                      </button>
                    </div>
                  </div>
                  <label>
                    <span className={labelClass}>
                      Practitioner Name
                      {required}
                    </span>
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
                        setAppointment({
                          ...appointment,
                          practitionerId,
                          appointmentTypeId: stillValid
                            ? appointment.appointmentTypeId
                            : nextTypes[0]?.id ?? '',
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
                  </label>
                  <label>
                    <span className={labelClass}>
                      Appointment Name
                      {required}
                    </span>
                    <input
                      className={fieldClass}
                      value={appointment.appointmentName}
                      onChange={(event) =>
                        setAppointment({ ...appointment, appointmentName: event.target.value })
                      }
                      placeholder="Enter appointment name"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Event Notes (not shared with patient)</span>
                    <textarea
                      className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-[#0f5f92]/50 focus:ring-2 focus:ring-[#0f5f92]/15"
                      value={appointment.notes}
                      onChange={(event) =>
                        setAppointment({ ...appointment, notes: event.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className={labelClass}>Start Date</span>
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
                      <span className={labelClass}>End Date</span>
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
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={availability.wholeDay}
                      onChange={(event) =>
                        setAvailability({
                          ...availability,
                          wholeDay: event.target.checked,
                          startTime: event.target.checked ? WHOLE_DAY_START : availability.startTime,
                          endTime: event.target.checked ? WHOLE_DAY_END : availability.endTime,
                        })
                      }
                      className="size-4 accent-[#0f5f92]"
                    />
                    <span className="text-[13px] font-medium text-slate-700">
                      Whole day ({WHOLE_DAY_START} – {WHOLE_DAY_END})
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className={labelClass}>Start Time</span>
                      <input
                        className={fieldClass}
                        disabled={availability.wholeDay}
                        value={availability.startTime}
                        onChange={(event) =>
                          setAvailability({ ...availability, startTime: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className={labelClass}>End Time</span>
                      <input
                        className={fieldClass}
                        disabled={availability.wholeDay}
                        value={availability.endTime}
                        onChange={(event) =>
                          setAvailability({ ...availability, endTime: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span className={labelClass}>Additional attendees only (excluding patient)</span>
                    <input
                      className={fieldClass}
                      value={availability.attendees}
                      onChange={(event) =>
                        setAvailability({ ...availability, attendees: event.target.value })
                      }
                      placeholder="Type to search or add email"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>
                      Practitioner Name
                      {required}
                    </span>
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
                  </label>
                </div>

                <div className="space-y-5">
                  <div>
                    <span className={labelClass}>
                      Appointment Types
                      {required}
                    </span>
                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                      {availabilityTypes.length === 0 ? (
                        <p className="px-1 py-2 text-[12px] text-slate-400">
                          Select a practitioner to see their appointment types.
                        </p>
                      ) : null}
                      {availabilityTypes.map((type) => (
                        <label
                          key={type.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={availability.appointmentTypeIds.includes(type.id)}
                            onChange={() => toggleAvailabilityType(type.id)}
                            className="size-4 accent-[#0f5f92]"
                          />
                          <span className="size-2.5 rounded-full" style={{ background: type.color }} />
                          <span className="text-[13px] text-slate-700">
                            {type.name}
                            {type.scope === 'private' ? ' · Private' : ''}
                          </span>
                        </label>
                      ))}
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={availability.includeBlocked}
                          onChange={(event) =>
                            setAvailability({
                              ...availability,
                              includeBlocked: event.target.checked,
                            })
                          }
                          className="size-4 accent-[#0f5f92]"
                        />
                        <span className="text-[13px] text-slate-700">Blocked</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>Add Appointment Type</span>
                    <div className="flex gap-2">
                      <input
                        className={`${fieldClass} flex-1`}
                        value={availability.newTypeName}
                        onChange={(event) =>
                          setAvailability({ ...availability, newTypeName: event.target.value })
                        }
                        placeholder="Type a new private appointment type"
                        disabled={!availability.practitionerId}
                      />
                      <button
                        type="button"
                        disabled={!availability.practitionerId || !availability.newTypeName.trim()}
                        onClick={() => addPrivateType(availability.practitionerId, true)}
                        className="h-11 shrink-0 rounded-lg bg-[#0f5f92] px-3 text-[12px] font-semibold text-white hover:brightness-110 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      New types are private to the selected practitioner.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-lg border border-[#0f5f92] px-6 text-[13px] font-semibold text-[#0f5f92] transition hover:bg-[#0f5f92]/5"
            >
              Cancel
            </button>
            {kind === 'appointment' ? (
              <button
                type="button"
                disabled={!canSubmitAppointment}
                onClick={() => onCreateAppointment(appointment)}
                className="h-11 rounded-lg bg-[#0f5f92] px-6 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                Create Event
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSubmitAvailability}
                onClick={() => onCreateAvailability(availability)}
                className="h-11 rounded-lg bg-[#0f5f92] px-6 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                Create Availability
              </button>
            )}
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
  const base: Omit<AvailabilityFormState, 'status' | 'appointmentTypeId'> = {
    startDate: form.startDate,
    startTime,
    endTime,
    wholeDay: form.wholeDay,
    repeat: 'none',
    repeatDays: [new Date(`${form.startDate}T12:00:00`).getDay()],
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
  practitionerId: string
  appointmentTypeId: string
  startTime?: string
  endTime?: string
}): CreateAppointmentForm => {
  const dateValue = toDateInputValue(args.date)
  return {
    startDate: dateValue,
    endDate: dateValue,
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
