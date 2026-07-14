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
  Search, Loader2, ArrowUpDown, AlertTriangle, RefreshCw, SlidersHorizontal, X,
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
  }

  const hasFilters = selectedBatches.length > 0 || selectedIndustries.length > 0 || searchQuery.trim().length > 0

  const FilterPanel = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Batch</h3>
        <MultiSelect
          label="Batch"
          options={BATCHES}
          selected={selectedBatches}
          onChange={(v) => { setSelectedBatches(v); setPage(0) }}
        />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Industry</h3>
        <MultiSelect
          label="Industry"
          options={industries}
          selected={selectedIndustries}
          onChange={(v) => { setSelectedIndustries(v); setPage(0) }}
        />
      </div>
      <div className="pt-1.5 border-t space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-7 gap-1"
          onClick={() => { setSortAlphabetical(!sortAlphabetical); setPage(0) }}
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortAlphabetical ? 'Batch Order' : 'A–Z'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-7 gap-1"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div ref={containerRef} className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  if (initError) {
    return (
      <div ref={containerRef} className="text-center py-12 space-y-3">
        <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load</p>
        <p className="text-xs text-destructive">{initError}</p>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button size="sm" className="text-xs" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex gap-3 h-full min-h-0">
      {isWide ? (
        <div className="w-48 shrink-0 overflow-y-auto">
          {FilterPanel}
        </div>
      ) : (
        showFilterDrawer && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilterDrawer(false)} />
            <div className="relative w-64 bg-background border-r p-3 overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold">Filters</span>
                <button onClick={() => setShowFilterDrawer(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {FilterPanel}
            </div>
          </div>
        )
      )}

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          {!isWide && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setShowFilterDrawer(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, one-liner, tags..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
              className="pl-8 h-8 text-xs"
            />
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

        <div className="flex items-center justify-between min-h-[18px]">
          <p className="text-[11px] text-muted-foreground">
            {visibleData.length === 0
              ? hasFilters ? 'No results' : `${totalCount} companies`
              : searchQuery
                ? `${visibleData.length} result${visibleData.length > 1 ? 's' : ''}`
                : `${visibleData.length} of ${totalCount}`}
          </p>
          <div className="flex items-center gap-2">
            {sortAlphabetical && <span className="text-[10px] text-muted-foreground">Sorted A–Z</span>}
            {hasFilters && (
              <button className="text-[10px] text-primary hover:underline" onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
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
        </div>

        {visibleData.length > 0 && paginated.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No matches with current filters
          </div>
        )}

        {hasMore && (
          <div className="text-center py-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setPage((p) => p + 1)}
            >
              Show {Math.min(PAGE_SIZE, visibleData.length - paginated.length)} more
              ({visibleData.length - paginated.length} remaining)
            </Button>
          </div>
        )}
      </div>

      <StartupDetail
        startup={detailStartup}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
