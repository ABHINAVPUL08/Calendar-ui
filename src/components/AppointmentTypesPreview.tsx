import { useState } from 'react'
import type { AppointmentType } from '../types'
import {
  formatTypeBooking,
  formatTypeBuffer,
  formatTypeDuration,
  formatTypeNotice,
} from './NewAppointmentTypeModal'

type Props = {
  types: AppointmentType[]
  /** Admin: practice globals only. Practitioner: globals + their custom types. */
  mode?: 'admin' | 'practitioner'
  onAddNew: () => void
  onEdit: (type: AppointmentType) => void
  onBack: () => void
  onManageStaffAccess?: () => void
  publicBookingLink?: string
  onOpenBookingPage?: () => void
  onOpenAuditLog?: () => void
}

export const AppointmentTypesPreview = ({
  types,
  mode = 'admin',
  onAddNew,
  onEdit,
  onBack,
  onManageStaffAccess,
  publicBookingLink,
  onOpenBookingPage,
  onOpenAuditLog,
}: Props) => {
  const listedTypes = types.filter((type) => type.id !== 'busy-external')
  const globalTypes = listedTypes.filter((type) => type.scope === 'global')
  const privateTypes = listedTypes.filter((type) => type.scope === 'private')
  const isPractitioner = mode === 'practitioner'
  const [copiedLink, setCopiedLink] = useState(false)

  const copyBookingLink = async () => {
    if (!publicBookingLink) return
    try {
      await navigator.clipboard.writeText(publicBookingLink)
      setCopiedLink(true)
      window.setTimeout(() => setCopiedLink(false), 1800)
    } catch {
      setCopiedLink(false)
    }
  }

  const renderRows = (rows: AppointmentType[], allowEdit: boolean) =>
    rows.map((type) => (
      <tr key={type.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="size-3 shrink-0 rounded-full" style={{ background: type.color }} />
            <span className="font-semibold text-slate-800">{type.name}</span>
            {type.scope === 'private' ? (
              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                My type
              </span>
            ) : isPractitioner ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Practice
              </span>
            ) : null}
          </div>
        </td>
        <td className="px-4 py-3.5 text-slate-600">{formatTypeDuration(type)}</td>
        <td className="px-4 py-3.5 text-slate-600">{formatTypeNotice(type)}</td>
        <td className="px-4 py-3.5 text-slate-600">{formatTypeBooking(type)}</td>
        <td className="px-4 py-3.5 text-slate-600">{formatTypeBuffer(type)}</td>
        <td className="px-4 py-3.5 text-right">
          {allowEdit ? (
            <button
              type="button"
              onClick={() => onEdit(type)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#0f5f92]"
              title={`Edit ${type.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit
            </button>
          ) : (
            <span className="text-[12px] text-slate-400">View only</span>
          )}
        </td>
      </tr>
    ))

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-[15px] font-semibold text-[#0f5f92] hover:underline"
          >
            ← Back to calendar
          </button>
          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">
            {isPractitioner ? 'Appointment types' : 'Preview appointment types'}
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {isPractitioner
              ? 'Practice types from Admin plus your custom types. Types you create stay on your calendar only — Admin cannot see them.'
              : 'Practice-default types. New types created here are visible across the practice.'}
          </p>
          {publicBookingLink ? (
            <div className="mt-3 space-y-2">
              <div className="flex max-w-[34rem] items-center gap-2">
                <span className="shrink-0 text-[12px] font-semibold text-slate-500">Booking page</span>
                <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <p className="min-w-0 flex-1 truncate px-3 py-2 text-[12px] text-slate-600">
                    {publicBookingLink.replace(/^https:\/\//, '')}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyBookingLink()}
                    className="shrink-0 border-l border-slate-200 bg-white px-3 text-[12px] font-semibold text-[#0f5f92] transition hover:bg-[#eef6fb]"
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {onOpenBookingPage ? (
                  <button
                    type="button"
                    onClick={onOpenBookingPage}
                    className="h-[38px] shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Open
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400">
                Patient requests stay pending. GoHighLevel workflow starts when they book (demo).
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenAuditLog ? (
            <button
              type="button"
              onClick={onOpenAuditLog}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Activity log
            </button>
          ) : null}
          {isPractitioner && onManageStaffAccess ? (
            <button
              type="button"
              onClick={onManageStaffAccess}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-[#0f5f92] shadow-sm transition hover:bg-[#eef6fb]"
            >
              Manage staff access
            </button>
          ) : null}
          <button
            type="button"
            onClick={onAddNew}
            className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(15,95,146,0.2)] transition hover:brightness-110"
          >
            + New appointment type
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-auto p-5">
        {isPractitioner ? (
          <>
            <section>
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                Practice types (from Admin)
              </h3>
              <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/90">
                <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Notice window</th>
                      <th className="px-4 py-3">Booking window</th>
                      <th className="px-4 py-3">Buffer</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalTypes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          No practice types yet.
                        </td>
                      </tr>
                    ) : (
                      renderRows(globalTypes, false)
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                My appointment types
              </h3>
              <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/90">
                <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Notice window</th>
                      <th className="px-4 py-3">Booking window</th>
                      <th className="px-4 py-3">Buffer</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {privateTypes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          No custom types yet. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      renderRows(privateTypes, true)
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/90">
            <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Notice window</th>
                  <th className="px-4 py-3">Booking window</th>
                  <th className="px-4 py-3">Buffer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {globalTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No practice-default types yet.
                    </td>
                  </tr>
                ) : (
                  renderRows(globalTypes, true)
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
