import { useState, type ReactNode } from 'react'

type NavItem = {
  id: string
  label: string
  active?: boolean
  icon: ReactNode
}

const iconClass = 'size-[18px] shrink-0'

const icons = {
  chevronRight: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronLeft: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  home: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  ),
  calendar: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" strokeLinecap="round" />
    </svg>
  ),
  document: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" strokeLinejoin="round" />
      <path d="M14 3.5V9h5.5M8.5 13h7M8.5 16.5h5" strokeLinecap="round" />
    </svg>
  ),
  media: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m7.5 16.5 3.2-3.2a1 1 0 0 1 1.3 0l1.5 1.5 2.4-2.4a1 1 0 0 1 1.4 0l2.2 2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clipboard: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <path d="M9 5.5V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v1M9.5 12h5M9.5 15.5h5" strokeLinecap="round" />
    </svg>
  ),
  message: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M5 18.5 6.4 15A7.5 7.5 0 1 1 9 19.2L5 18.5Z" strokeLinejoin="round" />
    </svg>
  ),
  mic: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5M9 20.5h6" strokeLinecap="round" />
    </svg>
  ),
  headset: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" strokeLinecap="round" />
      <path d="M4.5 13.5v4a1.5 1.5 0 0 0 1.5 1.5H8v-6H6a1.5 1.5 0 0 0-1.5 1.5ZM19.5 13.5v4a1.5 1.5 0 0 1-1.5 1.5H16v-6h2a1.5 1.5 0 0 1 1.5 1.5Z" strokeLinejoin="round" />
      <path d="M16 19v1a2 2 0 0 1-2 2h-2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.9 7.1l1.9 1.1M17.2 15.8l1.9 1.1M3.5 12h2.2M18.3 12h2.2M4.9 16.9l1.9-1.1M17.2 8.2l1.9-1.1"
        strokeLinecap="round"
      />
    </svg>
  ),
}

const primaryItems: NavItem[] = [
  { id: 'patient-panel', label: 'Patient panel', icon: icons.home },
  { id: 'calendar', label: 'Calendar', active: true, icon: icons.calendar },
  { id: 'forms', label: 'Forms', icon: icons.document },
  { id: 'media', label: 'Media', icon: icons.media },
  { id: 'plans', label: 'Plans', icon: icons.clipboard },
  { id: 'chat', label: 'Chat', icon: icons.message },
  { id: 'mic-check', label: 'Mic check', icon: icons.mic },
  { id: 'support', label: 'Support', icon: icons.headset },
]

/** Far-left nav rail matching the Revelia shell — expands to show labels. */
export const AppNavRail = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <nav
      className={`relative z-40 flex h-full shrink-0 flex-col overflow-visible bg-[#0b2f4a] py-2 text-white/85 transition-[width] duration-200 ease-out ${
        expanded ? 'w-[196px] px-2.5' : 'w-[56px] items-center px-0'
      }`}
      aria-label="Main navigation"
      aria-expanded={expanded}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={`grid place-items-center rounded-full bg-[#1a6fa8] text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition hover:brightness-110 ${
          expanded
            ? 'absolute top-4 right-0 z-50 size-7 translate-x-1/2'
            : 'relative z-50 mb-1.5 size-8'
        }`}
        title={expanded ? 'Collapse navigation' : 'Expand navigation'}
        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
      >
        {expanded ? icons.chevronLeft : icons.chevronRight}
      </button>

      <div className={`flex flex-1 flex-col gap-1 ${expanded ? 'mt-0.5' : 'items-center'}`}>
        {primaryItems.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg transition ${
              expanded ? 'h-9 w-full px-2.5' : 'size-9 justify-center'
            } ${
              item.active
                ? 'bg-[#1a6fa8] text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {expanded ? (
              <span className="truncate text-[12px] font-semibold tracking-tight">{item.label}</span>
            ) : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        title="Settings"
        aria-label="Settings"
        className={`mt-1.5 flex items-center gap-2.5 rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white ${
          expanded ? 'h-9 w-full px-2.5' : 'size-9 justify-center'
        }`}
      >
        {icons.settings}
        {expanded ? <span className="truncate text-[12px] font-semibold tracking-tight">Settings</span> : null}
      </button>
    </nav>
  )
}
