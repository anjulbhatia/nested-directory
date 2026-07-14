import { useState, useEffect, useCallback } from 'react'
import type { Startup, Collection } from '../../lib/types'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { ScrollArea } from '../../components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet'
import { NoteEditor } from './NoteEditor'
import { Separator } from '../../components/ui/separator'
import { getCollections, saveCollections } from '../../lib/storage'
import { MapPin, Users, Building2, ExternalLink, Globe, Check } from 'lucide-react'

interface StartupDetailProps {
  startup: Startup | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartupDetail({ startup, open, onOpenChange }: StartupDetailProps) {
  const startupId = startup?.slug || startup?.id || ''

  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    if (open && startup) {
      getCollections().then(setCollections)
    }
  }, [open, startup])

  const handleToggleList = useCallback(async (collectionId: string) => {
    const current = await getCollections()
    const updated = current.map((c) => {
      if (c.id !== collectionId) return c
      const has = c.startupIds.includes(startupId)
      return { ...c, startupIds: has ? c.startupIds.filter((id) => id !== startupId) : [...c.startupIds, startupId] }
    })
    await saveCollections(updated)
    setCollections(updated)
  }, [startupId])

  if (!startup) return null

  const ycUrl = startup.url || `https://www.ycombinator.com/companies/${startup.slug}`

  const statusVariant = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'green' as const
      case 'acquired': return 'yellow' as const
      case 'public': return 'blue' as const
      default: return 'gray' as const
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-full p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-start gap-3">
              {startup.small_logo_thumb_url ? (
                <img src={startup.small_logo_thumb_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-muted shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).outerHTML =
                      `<div class="w-12 h-12 rounded-xl bg-yc-orange/10 flex items-center justify-center text-yc-orange font-bold text-lg shrink-0">${startup.name[0]}</div>`
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-yc-orange/10 flex items-center justify-center text-yc-orange font-bold text-lg shrink-0">
                  {startup.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0 pr-6">
                <SheetTitle className="text-lg">{startup.name}</SheetTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{startup.one_liner}</p>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4 pt-3">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="orange">{startup.batch}</Badge>
                {startup.status && <Badge variant={statusVariant(startup.status)}>{startup.status}</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {startup.website && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> Website</h4>
                    <a href={startup.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{new URL(startup.website).hostname}</a>
                  </div>
                )}
                {(startup.location || startup.all_locations) && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</h4>
                    <p className="text-sm">{startup.all_locations || startup.location}</p>
                  </div>
                )}
                {startup.team_size && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Team</h4>
                    <p className="text-sm">{startup.team_size}</p>
                  </div>
                )}
                {startup.year_founded && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Founded</h4>
                    <p className="text-sm">{startup.year_founded}</p>
                  </div>
                )}
              </div>

              {startup.long_description && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">About</h4>
                  <p className="text-sm text-muted-foreground">{startup.long_description}</p>
                </div>
              )}

              {startup.tags && startup.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-1">{startup.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div>
                </div>
              )}

              {startup.industries && startup.industries.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Industries</h4>
                  <div className="flex flex-wrap gap-1">{startup.industries.map((ind) => <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>)}</div>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Lists</h4>
                <div className="space-y-1">
                  {collections.map((col) => {
                    const inList = col.startupIds.includes(startupId)
                    return (
                      <div
                        key={col.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-accent select-none"
                        onClick={() => handleToggleList(col.id)}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            inList ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                          }`}
                        >
                          {inList && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <span className={`flex-1 ${inList ? 'font-medium' : ''}`}>{col.name}</span>
                        <span className="text-[10px] text-muted-foreground">{col.startupIds.length}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <NoteEditor startup={startup} />

              {startup.founders && startup.founders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Founders</h4>
                    <div className="space-y-2">
                      {startup.founders.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {f.avatar_url ? (
                            <img src={f.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover bg-muted" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{f.name[0]}</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{f.name}</p>
                            {f.title && <p className="text-xs text-muted-foreground">{f.title}</p>}
                          </div>
                          <div className="ml-auto flex gap-1 shrink-0">
                            {f.linkedin_url && (
                              <a href={f.linkedin_url} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </Button>
                              </a>
                            )}
                            {f.twitter_url && (
                              <a href={f.twitter_url} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <a href={ycUrl} target="_blank" rel="noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2"><ExternalLink className="h-4 w-4" /> View on Y Combinator</Button>
              </a>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
