import { Modal } from './Modal'

type Props = {
  onClose: () => void
}

const rows = [
  { when: 'Jul 28, 2026 · 2:02 PM', who: 'Dr. Thomas Reed', action: 'Created availability block', area: 'Calendar' },
  { when: 'Jul 28, 2026 · 2:05 PM', who: 'Sofia Martinez (patient)', action: 'Requested Initial Visit via booking page', area: 'Booking' },
  { when: 'Jul 28, 2026 · 2:08 PM', who: 'Abhinav (staff)', action: 'Viewed pending request', area: 'Events' },
  { when: 'Jul 28, 2026 · 2:11 PM', who: 'Dr. Thomas Reed', action: 'Approved pending booking', area: 'Events' },
  { when: 'Jul 28, 2026 · 3:40 PM', who: 'Dr. Thomas Reed', action: 'Updated staff calendar access', area: 'Permissions' },
]

export const AuditLogModal = ({ onClose }: Props) => (
  <Modal
    title="Activity log"
    onClose={onClose}
    footer={
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-slate-500">
          Demo log for HIPAA review. Real retention and export are backend work.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg bg-[#0f5f92] px-4 text-sm font-semibold text-white hover:brightness-110"
        >
          Close
        </button>
      </div>
    }
  >
    <p className="mb-3 text-[13px] text-slate-600">
      Who changed the calendar, when, and from where. Staff do not see billing in this log.
    </p>
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200/90">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5">When</th>
            <th className="px-3 py-2.5">Who</th>
            <th className="px-3 py-2.5">Action</th>
            <th className="px-3 py-2.5">Area</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.when}-${row.action}`} className="border-t border-slate-100">
              <td className="px-3 py-2.5 text-slate-500">{row.when}</td>
              <td className="px-3 py-2.5 font-semibold text-slate-800">{row.who}</td>
              <td className="px-3 py-2.5 text-slate-700">{row.action}</td>
              <td className="px-3 py-2.5 text-slate-500">{row.area}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Modal>
)
