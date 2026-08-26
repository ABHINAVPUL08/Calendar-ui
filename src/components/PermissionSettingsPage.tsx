import { useState } from 'react'
import type { Practitioner, StaffAccessGrant } from '../types'
import { PractitionerAvatar } from './PractitionerAvatar'
import { ConfirmDialog } from './ConfirmDialog'

const formatNameList = (names: string[]) => {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

type Props = {
  owner: Practitioner
  ownerOptions: Practitioner[]
  teamMembers: Practitioner[]
  grants: StaffAccessGrant[]
  onSelectOwner: (practitionerId: string) => void
  onToggleMember: (memberId: string) => void
  onSave: () => void
  onBack: () => void
}

export const PermissionSettingsPage = ({
  owner,
  ownerOptions,
  teamMembers,
  grants,
  onSelectOwner,
  onToggleMember,
  onSave,
  onBack,
}: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const staff = teamMembers.filter((member) => member.role === 'Staff')
  const clinicians = teamMembers.filter((member) => member.role !== 'Staff')
  const enabledCount = grants.length
  const grantedNames = teamMembers
    .filter((member) => grants.some((item) => item.staffId === member.id))
    .map((member) => member.name)

  const requestSave = () => {
    if (grantedNames.length === 0) {
      onSave()
      return
    }
    setConfirmOpen(true)
  }

  const renderMember = (member: Practitioner) => {
    const enabled = grants.some((item) => item.staffId === member.id)
    const assigned = owner.assignedStaffId === member.id

    return (
      <article
        key={member.id}
        className={`rounded-2xl border bg-white p-4 transition ${
          enabled ? 'border-[#0f5f92]/25 shadow-[0_4px_16px_rgba(15,95,146,0.06)]' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PractitionerAvatar name={member.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[14px] font-bold text-slate-900">{member.name}</h3>
                {assigned ? (
                  <span className="rounded-md bg-[#eef6fb] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0f5f92]">
                    Assigned to this calendar
                  </span>
                ) : null}
                {enabled ? (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Full access
                  </span>
                ) : null}
              </div>
              <p className="text-[12px] text-slate-500">
                {member.role} · {member.location}
              </p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700">
            <input
              type="checkbox"
              className="size-4 accent-[#0f5f92]"
              checked={enabled}
              onChange={() => onToggleMember(member.id)}
            />
            Act on my behalf
          </label>
        </div>
        <p className="mt-3 text-[12px] text-slate-400">
          {enabled
            ? `${member.name} can create and edit events and availability on ${owner.name}'s calendar.`
            : `Turn this on so ${member.name} can work on ${owner.name}'s calendar.`}
        </p>
      </article>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-[15px] font-semibold text-[#0f5f92] hover:underline"
          >
            ← Back
          </button>
          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Permission settings</h2>
          <p className="mt-0.5 max-w-xl text-[13px] text-slate-500">
            Choose who can take actions on this practitioner&apos;s calendar. Access is only for the
            selected person — not the whole practice.
          </p>
          <label className="mt-3 block max-w-sm">
            <span className="mb-1 block text-[12px] font-semibold text-slate-500">Practitioner</span>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-[#0f5f92]/45 focus:ring-2 focus:ring-[#0f5f92]/12"
              value={owner.id}
              onChange={(event) => onSelectOwner(event.target.value)}
              aria-label="Choose practitioner"
            >
              {ownerOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={requestSave}
          className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(15,95,146,0.2)] transition hover:brightness-110"
        >
          Save permissions
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-auto p-5">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-600 ring-1 ring-slate-200/80">
          <p>
            <span className="font-semibold text-slate-800">{enabledCount}</span> team member
            {enabledCount === 1 ? '' : 's'} can act on {owner.name}&apos;s behalf. Admin already has
            access to every calendar and is not listed here.
          </p>
        </div>

        <section>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">Staff</h3>
          <div className="space-y-3">
            {staff.length ? staff.map(renderMember) : (
              <p className="text-[13px] text-slate-400">No staff members in this practice.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
            Other clinicians
          </h3>
          <div className="space-y-3">
            {clinicians.length ? clinicians.map(renderMember) : (
              <p className="text-[13px] text-slate-400">No other clinicians to share with.</p>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Give full calendar access?"
        message={`You are giving full access of ${owner.name}'s calendar to ${formatNameList(grantedNames)}. They will be able to create and edit events and availability. Do you want to continue?`}
        confirmLabel="Yes, continue"
        cancelLabel="Cancel"
        tone="primary"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onSave()
        }}
      />
    </div>
  )
}
