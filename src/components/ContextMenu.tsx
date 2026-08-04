type ContextAction = {
  label: string
  onClick: () => void
  destructive?: boolean
}

type Props = {
  x: number
  y: number
  actions: ContextAction[]
  onClose: () => void
}

export const ContextMenu = ({ x, y, actions, onClose }: Props) => (
  <>
    <button
      type="button"
      className="fixed inset-0 z-40 cursor-default bg-transparent"
      onClick={onClose}
      aria-label="Close context menu"
    />
    <div
      className="fixed z-50 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
      style={{ top: y, left: x }}
      role="menu"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => {
            action.onClick()
            onClose()
          }}
          className={`block w-full rounded px-3 py-2 text-left text-sm transition ${
            action.destructive
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          role="menuitem"
        >
          {action.label}
        </button>
      ))}
    </div>
  </>
)
