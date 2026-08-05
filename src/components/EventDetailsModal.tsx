import { useState } from 'react'
import type { AppointmentType, CalendarEvent, Practitioner } from '../types'
import { formatTime } from '../date-utils'

type EventEditDraft = {
  patientName: string
  notes: string
  startTime: string
  endTime: string
  appointmentTypeId: string
}

type Props = {
  event: CalendarEvent
  draft: EventEditDraft
  isEditing: boolean
  appointmentType?: AppointmentType
  practitioner?: Practitioner
  bookableTypes: AppointmentType[]
  updatedByName: string
  canModify: boolean
  onClose: () => void
  onDraftChange: (draft: EventEditDraft) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
  onGoToVisit: () => void
  onGoToPatientProfile: () => void
  onSendFormReminder: () => void
  onEmailPatient: () => void
  onSaveNotes: (notes: string) => void
}

const actionBtnClass =
  'flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#0f5f92]/35 hover:bg-[#f3f8fc] hover:text-[#0f5f92] hover:shadow-[0_10px_22px_rgba(15,95,146,0.14)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:shadow-sm'

const infoCardClass =
  'rounded-xl bg-[#f6f9fb] px-3.5 py-3 ring-1 ring-slate-200/70 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:ring-[#0f5f92]/25 hover:shadow-[0_12px_28px_rgba(15,95,146,0.12)]'

export const EventDetailsModal = ({
  event,
  draft,
  isEditing,
  appointmentType,
  practitioner,
  bookableTypes,
  updatedByName,
  canModify,
  onClose,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onGoToVisit,
  onGoToPatientProfile,
  onSendFormReminder,
  onEmailPatient,
  onSaveNotes,
}: Props) => {
  const [notesDraft, setNotesDraft] = useState(event.notes)
  const start = new Date(event.start)
  const end = new Date(event.end)
  const dateLabel = start.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
  })
  const timeRange = `${formatTime(start)} – ${formatTime(end)}`
  const title = event.isExternal
    ? 'Busy — External'
    : appointmentType?.name || event.patientName || 'Appointment'
  const updatedAt = end.toLocaleString('en-US', {
    month: 'numeric',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[3px]">
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-[0_28px_70px_rgba(16,28,40,0.28)] ring-1 ring-slate-200/80"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-details-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">
              {isEditing ? 'Edit appointment' : 'Appointment'}
            </p>
            <h2
              id="event-details-title"
              className="mt-1 truncate text-[20px] font-bold tracking-tight text-slate-900"
            >
              {isEditing ? draft.patientName || title : title}
            </h2>
            {!isEditing && !event.isExternal ? (
              <p className="mt-0.5 truncate text-[13px] text-slate-500">{event.patientName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[min(70vh,640px)] overflow-y-auto px-5 py-4">
          {isEditing ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-slate-600">
                Patient Name
                <input
                  className="h-11 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-800 outline-none focus:border-[#0f5f92]/40 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={draft.patientName}
                  onChange={(e) => onDraftChange({ ...draft, patientName: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-slate-600">
                Appointment Type
                <select
                  className="h-11 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-800 outline-none focus:border-[#0f5f92]/40 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={draft.appointmentTypeId}
                  onChange={(e) => onDraftChange({ ...draft, appointmentTypeId: e.target.value })}
                >
                  {bookableTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-slate-600">
                Start Time
                <input
                  className="h-11 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-800 outline-none focus:border-[#0f5f92]/40 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={draft.startTime}
                  onChange={(e) => onDraftChange({ ...draft, startTime: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-slate-600">
                End Time
                <input
                  className="h-11 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-800 outline-none focus:border-[#0f5f92]/40 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={draft.endTime}
                  onChange={(e) => onDraftChange({ ...draft, endTime: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-slate-600 sm:col-span-2">
                Notes
                <textarea
                  className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-[#0f5f92]/40 focus:ring-2 focus:ring-[#0f5f92]/15"
                  value={draft.notes}
                  onChange={(e) => onDraftChange({ ...draft, notes: e.target.value })}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex gap-3 ${infoCardClass}`}>
                <span
                  className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-[#e8f3f9] text-[#0f5f92] ring-1 ring-[#0f5f92]/15"
                  aria-hidden
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 2v2" />
                    <path d="M5 2v2" />
                    <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
                    <path d="M8 15a6 6 0 0 0 12 0v-3" />
                    <circle cx="20" cy="10" r="2" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    Practitioner
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold text-slate-800">
                    {practitioner?.name ?? '—'}
                  </p>
                  {practitioner ? (
                    <p className="text-[12px] text-slate-500">
                      {practitioner.role} · {practitioner.location}
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={onGoToVisit}
                className="group flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[#eef6fb] to-[#f6f9fb] px-3.5 py-3 text-left ring-1 ring-[#0f5f92]/20 shadow-sm transition duration-200 hover:-translate-y-1 hover:from-[#e4f1f9] hover:to-[#eef6fb] hover:ring-[#0f5f92]/40 hover:shadow-[0_12px_28px_rgba(15,95,146,0.16)]"
              >
                <span
                  className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#0f5f92] ring-1 ring-[#0f5f92]/15 transition group-hover:bg-[#0f5f92] group-hover:text-white"
                  aria-hidden
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    Date & time
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold text-slate-800">
                    {dateLabel}, {timeRange}
                  </p>
                  <p className="text-[12px] text-slate-500">{event.location ?? 'No location set'}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0f5f92]">
                    Click here to open on calendar
                    <span aria-hidden className="transition group-hover:translate-x-0.5">
                      →
                    </span>
                  </p>
                </div>
              </button>

              <div className={infoCardClass}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[14px] text-[#0f5f92] ring-1 ring-slate-200/80">
                    ≡
                  </span>
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    Notes
                  </p>
                </div>
                {canModify ? (
                  <textarea
                    className="min-h-[72px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#0f5f92]/40 focus:ring-2 focus:ring-[#0f5f92]/15"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    onBlur={() => {
                      if (notesDraft !== event.notes) {
                        onSaveNotes(notesDraft)
                      }
                    }}
                    placeholder="Add notes (not shared with patient)"
                  />
                ) : (
                  <p className="text-[13px] leading-relaxed text-slate-700">
                    {event.notes?.trim() || 'No notes'}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[14px] text-slate-600">
                    ⚙
                  </span>
                  <p className="text-[13px] font-bold text-slate-800">Actions</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" className={actionBtnClass} onClick={onGoToVisit}>
                    Go to Visit
                  </button>
                  <button
                    type="button"
                    className={actionBtnClass}
                    onClick={onGoToPatientProfile}
                    disabled={event.isExternal || !event.patientName.trim()}
                  >
                    Go to Patient Profile
                  </button>
                  <button
                    type="button"
                    className={actionBtnClass}
                    onClick={onStartEdit}
                    disabled={!canModify}
                  >
                    Edit Event
                  </button>
                  <button
                    type="button"
                    className={actionBtnClass}
                    onClick={onSendFormReminder}
                    disabled={event.isExternal || !event.patientName.trim()}
                  >
                    Send Form Reminder
                  </button>
                  <button
                    type="button"
                    className={actionBtnClass}
                    onClick={onEmailPatient}
                    disabled={event.isExternal || !event.patientName.trim()}
                  >
                    Email Patient
                  </button>
                  <button
                    type="button"
                    className={`${actionBtnClass} border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-[0_10px_22px_rgba(225,29,72,0.16)]`}
                    onClick={onDelete}
                    disabled={!canModify}
                  >
                    Delete event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
            <button
              type="button"
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-10 rounded-xl bg-[#0f5f92] px-4 text-[13px] font-semibold text-white hover:brightness-110"
              onClick={onSave}
            >
              Save changes
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <p className="text-[11.5px] text-slate-400">
              Event last updated by {updatedByName} at {updatedAt}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
