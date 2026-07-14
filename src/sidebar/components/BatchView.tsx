import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Startup } from '../../lib/types'
import {
  initCache, verifyAndRefresh, fullRefresh, getPaginated,
  searchInCache, getFiltered, getCachedCount, getAllIndustries,
} from '../../lib/cache'
import { BATCHES } from '../../lib/data-fetcher'
import { StartupCard } from './StartupCard'
import { StartupDetail } from './StartupDetail'
import { MultiSelect, ActiveFilters } from './MultiSelect'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import {
  Search, Loader2, ArrowUpDown, AlertTriangle, RefreshCw, SlidersHorizontal, X, ChevronDown,
} from 'lucide-react'

const PAGE_SIZE = 100
const WIDE_BREAKPOINT = 500

export function BatchView() {
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortAlphabetical, setSortAlphabetical] = useState(false)
  const [page, setPage] = useState(0)
  const [detailStartup, setDetailStartup] = useState<Startup | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [industries, setIndustries] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isWide, setIsWide] = useState(false)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        setIsWide(containerRef.current.offsetWidth >= WIDE_BREAKPOINT)
      }
    }
    checkWidth()
    const observer = new ResizeObserver(checkWidth)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setInitError(null)
      try {
        const { fromCache, count } = await initCache()
        setTotalCount(count)

        const { needsRefresh } = await verifyAndRefresh()
        if (needsRefresh) {
          const newCount = await fullRefresh()
          setTotalCount(newCount)
        }

        setIndustries(getAllIndustries())
      } catch (err) {
        setInitError(err instanceof Error ? err.message : 'Failed to initialize')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const visibleData = useMemo(() => {
    if (loading) return []

    if (searchQuery.trim()) {
      return searchInCache(searchQuery, {
        batches: selectedBatches.length > 0 ? selectedBatches : undefined,
        industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
      })
    }

    const filtered = getFiltered(
      selectedBatches.length > 0 ? selectedBatches : undefined,
      selectedIndustries.length > 0 ? selectedIndustries : undefined,
    )

    if (sortAlphabetical) {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered
  }, [loading, searchQuery, selectedBatches, selectedIndustries, sortAlphabetical])

  const paginated = useMemo(() => {
    return visibleData.slice(0, (page + 1) * PAGE_SIZE)
  }, [visibleData, page])

  const hasMore = paginated.length < visibleData.length

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const count = await fullRefresh()
      setTotalCount(count)
      setIndustries(getAllIndustries())
      setPage(0)
    } catch (err) {
      console.error(err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedBatches([])
    setSelectedIndustries([])
    setSearchQuery('')
    setPage(0)
    searchRef.current?.focus()
  }

  const hasFilters = selectedBatches.length > 0 || selectedIndustries.length > 0 || searchQuery.trim().length > 0

  const FilterPanel = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <span className="w-1 h-3 rounded-full bg-yc-orange" />
          Batch
        </h3>
        <MultiSelect
          label="Batch"
          options={BATCHES}
          selected={selectedBatches}
          onChange={(v) => { setSelectedBatches(v); setPage(0) }}
        />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <span className="w-1 h-3 rounded-full bg-yc-orange" />
          Industry
        </h3>
        <MultiSelect
          label="Industry"
          options={industries}
          selected={selectedIndustries}
          onChange={(v) => { setSelectedIndustries(v); setPage(0) }}
        />
      </div>
      <div className="pt-3 border-t space-y-1.5">
        <Button
          variant={sortAlphabetical ? 'default' : 'outline'}
          size="sm"
          className="w-full text-xs h-8 gap-1.5"
          onClick={() => { setSortAlphabetical(!sortAlphabetical); setPage(0) }}
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortAlphabetical ? 'Sorted A–Z' : 'Sort A–Z'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8 gap-1.5"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh Data
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div ref={containerRef} className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-yc-orange" />
          <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-yc-orange/20 animate-ping" />
        </div>
        <p className="text-sm font-medium">Loading companies...</p>
        <p className="text-xs text-muted-foreground/60">Fetching YC startup data</p>
      </div>
    )
  }

  if (initError) {
    return (
      <div ref={containerRef} className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium mb-1">Failed to load</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">{initError}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex gap-0 h-full min-h-0">
      {isWide ? (
        <div className="w-52 shrink-0 overflow-y-auto border-r p-3 bg-muted/20">
          {FilterPanel}
        </div>
      ) : (
        showFilterDrawer && (
          <div className="fixed inset-0 z-50 flex transition-opacity">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilterDrawer(false)} />
            <div className="relative w-64 bg-background border-r p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-yc-orange" /> Filters
                </span>
                <button onClick={() => setShowFilterDrawer(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {FilterPanel}
            </div>
          </div>
        )
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="p-3 pb-0 space-y-2">
          <div className="flex items-center gap-2">
            {!isWide && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 shrink-0 transition-colors ${hasFilters ? 'text-yc-orange' : ''}`}
                onClick={() => setShowFilterDrawer(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search name, one-liner, tags..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                className="pl-8 pr-8 h-9 text-sm bg-muted/50 focus-visible:bg-background transition-colors"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(''); setPage(0); searchRef.current?.focus() }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <ActiveFilters
            selected={selectedBatches}
            onChange={(v) => { setSelectedBatches(v); setPage(0) }}
          />
          <ActiveFilters
            selected={selectedIndustries}
            onChange={(v) => { setSelectedIndustries(v); setPage(0) }}
          />
        </div>

        <div className="p-3 pb-0">
          <div className="flex items-center justify-between min-h-[20px]">
            <p className="text-xs text-muted-foreground">
              {visibleData.length === 0
                ? hasFilters ? 'No results' : `${totalCount} companies`
                : searchQuery
                  ? `${visibleData.length} result${visibleData.length > 1 ? 's' : ''}`
                  : `${visibleData.length} of ${totalCount} companies`}
            </p>
            <div className="flex items-center gap-2">
              {sortAlphabetical && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" /> A–Z
                </span>
              )}
              {hasFilters && (
                <button className="text-[10px] text-primary hover:underline font-medium" onClick={handleClearFilters}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {paginated.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No companies found</p>
              <p className="text-xs text-muted-foreground/60 max-w-[200px]">
                {hasFilters ? 'Try adjusting your filters or search query' : 'Data may still be loading'}
              </p>
              {hasFilters && (
                <Button variant="link" size="sm" className="text-xs mt-2" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {paginated.map((s) => (
            <StartupCard
              key={s.slug}
              startup={s}
              onViewDetail={(startup) => {
                setDetailStartup(startup)
                setDetailOpen(true)
              }}
            />
          ))}

          {hasMore && (
            <div className="pt-1 pb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-9 gap-1.5"
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronDown className="h-3 w-3" />
                Show {Math.min(PAGE_SIZE, visibleData.length - paginated.length)} more
                <span className="text-muted-foreground">({visibleData.length - paginated.length} remaining)</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <StartupDetail
        startup={detailStartup}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
