import type { PropsWithChildren, ReactNode } from 'react'

type ModalProps = PropsWithChildren<{
  title: string
  onClose: () => void
  footer?: ReactNode
}>

export const Modal = ({ title, onClose, children, footer }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-[2px]">
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(16,40,70,0.22)] ring-1 ring-slate-200/80">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer ? <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">{footer}</div> : null}
    </div>
  </div>
)
