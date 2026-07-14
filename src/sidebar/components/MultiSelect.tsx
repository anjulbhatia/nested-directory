import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isAll = selected.length === 0

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="text-xs relative" ref={ref}>
      <button
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border bg-background hover:bg-accent text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className={isAll ? 'text-muted-foreground' : 'text-foreground font-medium truncate'}>
          {isAll ? `All ${label}s` : `${selected.length} ${label}${selected.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full border rounded-md bg-popover shadow-lg max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1">
          <label className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-accent border-b transition-colors">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                isAll ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 hover:border-foreground'
              }`}
              onClick={() => onChange([])}
            >
              {isAll && <Check className="h-2.5 w-2.5" />}
            </div>
            <span className="font-medium text-foreground">All {label}s</span>
          </label>
          {options.map((option) => {
            const isSelected = selected.includes(option)
            return (
              <label
                key={option}
                className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  onChange(isSelected ? selected.filter((s) => s !== option) : [...selected, option])
                }}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 hover:border-foreground'
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className={`truncate ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {option}
                </span>
              </label>
            )
          })}
          {options.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No options</p>
          )}
        </div>
      )}
    </div>
  )
}

export function ActiveFilters({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (selected: string[]) => void
}) {
  if (selected.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {selected.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          className="text-[10px] gap-1 pr-1 max-w-[180px] h-5"
        >
          <span className="truncate">{item}</span>
          <button
            onClick={() => onChange(selected.filter((s) => s !== item))}
            className="hover:text-foreground shrink-0 flex items-center justify-center rounded-full hover:bg-muted-foreground/20 w-3.5 h-3.5 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      {selected.length > 1 && (
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 font-medium transition-colors"
          onClick={() => onChange([])}
        >
          Clear all
        </button>
      )}
    </div>
  )
}
