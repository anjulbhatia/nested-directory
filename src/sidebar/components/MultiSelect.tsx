import { useState } from 'react'
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
  const isAll = selected.length === 0

  return (
    <div className="text-xs">
      <button
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border bg-background hover:bg-accent text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className={isAll ? 'text-muted-foreground' : 'text-foreground font-medium'}>
          {isAll ? `All ${label}s` : `${selected.length} ${label}${selected.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 border rounded bg-popover max-h-52 overflow-y-auto">
          <label className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-accent border-b">
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isAll ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {isAll && <Check className="h-2.5 w-2.5" />}
            </div>
            <span className="font-medium">All {label}s</span>
          </label>
          {options.map((option) => {
            const isSelected = selected.includes(option)
            return (
              <label
                key={option}
                className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-accent"
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                  }`}
                  onClick={() => {
                    onChange(isSelected ? selected.filter((s) => s !== option) : [...selected, option])
                  }}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                </div>
                <span
                  className={`truncate ${isSelected ? 'font-medium' : ''}`}
                  onClick={() => {
                    onChange(isSelected ? selected.filter((s) => s !== option) : [...selected, option])
                  }}
                >
                  {option}
                </span>
              </label>
            )
          })}
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
    <div className="flex flex-wrap gap-1">
      {selected.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          className="text-[10px] gap-1 pr-1 max-w-[160px]"
        >
          <span className="truncate">{item}</span>
          <button onClick={() => onChange(selected.filter((s) => s !== item))} className="hover:text-foreground shrink-0">
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      {selected.length > 1 && (
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground px-1"
          onClick={() => onChange([])}
        >
          Clear all
        </button>
      )}
    </div>
  )
}
