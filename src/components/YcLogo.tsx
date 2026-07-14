import type { SVGProps } from 'react'

export function YcLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="48" height="48" rx="8" fill="#ff6600" />
      <path d="M14 12h6l4 8 4-8h6L26 26v10h-4V26L14 12Z" fill="#fff" />
    </svg>
  )
}
