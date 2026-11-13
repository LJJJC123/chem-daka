const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconToday(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      <path d="M8 14h3" />
    </svg>
  )
}

export function IconPractice(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M4 20l1-4.2 10.6-10.6a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" />
      <path d="M14 6.5l3.5 3.5" />
    </svg>
  )
}

export function IconMistake(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M5 4.5h11.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2V4.5z" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  )
}

export function IconProgress(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M4 19.5h16" />
      <path d="M7 19.5V13M12 19.5V7M17 19.5v-4.5" />
    </svg>
  )
}

export function IconSettings(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M4 7.5h16M4 16.5h16" />
      <circle cx="9.5" cy="7.5" r="2.3" />
      <circle cx="15" cy="16.5" r="2.3" />
    </svg>
  )
}

export function IconFlask(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M9.5 3h5v5.2l4.2 9.1A2.6 2.6 0 0 1 16.3 21H7.7a2.6 2.6 0 0 1-2.4-3.7L9.5 8.2V3z" />
      <path d="M7 15.5h10" />
    </svg>
  )
}

export function IconTarget(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconCard(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="3" />
      <path d="M7.5 10.5h5M7.5 14h3" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconRight(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconSpark(props) {
  return (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  )
}
