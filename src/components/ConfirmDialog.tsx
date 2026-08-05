type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Yes, delete',
  onConfirm,
  onCancel,
}: Props) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_24px_60px_rgba(16,40,70,0.28)] ring-1 ring-slate-200/80"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f92]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
