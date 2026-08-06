type Props = {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const palette = ['#0f5f92', '#0d8a7f', '#6b5cad', '#c2781a', '#3d6b8c']

export const PractitionerAvatar = ({ name, size = 'md' }: Props) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  const color = palette[name.length % palette.length]
  const dim =
    size === 'sm' ? 'size-6 text-[9px]' : size === 'lg' ? 'size-9 text-[12px]' : 'size-8 text-[10px]'

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${dim}`}
      style={{ background: color }}
      aria-hidden
    >
      {initials}
    </div>
  )
}
