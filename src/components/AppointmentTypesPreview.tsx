import type { AppointmentType } from '../types'

type Props = {
  types: AppointmentType[]
  /** Admin: practice globals only. Practitioner: globals + their private types. */
  mode?: 'admin' | 'practitioner'
  onAddNew: () => void
  onEdit: (type: AppointmentType) => void
  onBack: () => void
}

export const AppointmentTypesPreview = ({
  types,
  mode = 'admin',
  onAddNew,
  onEdit,
  onBack,
}: Props) => {
  const listedTypes = types.filter((type) => type.id !== 'busy-external')
  const globalTypes = listedTypes.filter((type) => type.scope === 'global')
  const privateTypes = listedTypes.filter((type) => type.scope === 'private')
  const isPractitioner = mode === 'practitioner'

  const renderRows = (rows: AppointmentType[], allowEdit: boolean) =>
    rows.map((type) => (
      <tr key={type.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="size-3 shrink-0 rounded-full" style={{ background: type.color }} />
            <span className="font-semibold text-slate-800">{type.name}</span>
            {type.scope === 'private' ? (
              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                Private
              </span>
            ) : isPractitioner ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Practice
              </span>
            ) : null}
          </div>
        </td>
        <td className="px-4 py-3.5 text-slate-600">
          {type.baseDurationMin ? `${type.baseDurationMin} min` : '—'}
        </td>
        <td className="px-4 py-3.5 text-slate-600">
          {type.noticeWindowHours != null ? `${type.noticeWindowHours}h` : '—'}
        </td>
        <td className="px-4 py-3.5 text-slate-600">
          {type.bookingWindowDays != null ? `${type.bookingWindowDays} days ahead` : '—'}
        </td>
        <td className="px-4 py-3.5 text-slate-600">
          Buffer {type.bufferBefore ?? 0}/{type.bufferAfter ?? 0}
        </td>
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
              ? 'Practice types from Admin plus your private types. New types you create stay private — Admin cannot see them.'
              : 'Practice-default types. New types created here are visible across the practice.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="h-10 rounded-lg bg-[#0f5f92] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(15,95,146,0.2)] transition hover:brightness-110"
        >
          + New appointment type
        </button>
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
                Your private types
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
                          No private types yet. Create one to get started.
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
