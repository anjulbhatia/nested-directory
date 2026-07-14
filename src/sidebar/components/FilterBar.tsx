import { useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Check, ChevronDown, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover'
import { Input } from '../../components/ui/input'
import { ScrollArea } from '../../components/ui/scroll-area'

interface FilterBarProps {
  industries: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function FilterBar({ industries, selected, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = search
    ? industries.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
    : industries

  const toggle = (industry: string) => {
    if (selected.includes(industry)) {
      onChange(selected.filter((s) => s !== industry))
    } else {
      onChange([...selected, industry])
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            Industries <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <Input
            placeholder="Filter industries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs mb-2"
          />
          <ScrollArea className="h-48">
            <div className="space-y-0.5">
              {filtered.map((ind) => (
                <button
                  key={ind}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent text-left"
                  onClick={() => toggle(ind)}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selected.includes(ind) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {selected.includes(ind) && <Check className="h-2.5 w-2.5" />}
                  </div>
                  {ind}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">No industries found</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selected.map((ind) => (
        <Badge key={ind} variant="secondary" className="text-[10px] gap-1 pr-1">
          {ind}
          <button onClick={() => toggle(ind)} className="hover:text-foreground">
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}

      {selected.length > 0 && (
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => onChange([])}>
          Clear
        </Button>
      )}
    </div>
  )
}
