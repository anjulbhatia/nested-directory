import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { getCachedCount, clearCache, fullRefresh } from '../../lib/cache'
import { RefreshCw, Loader2, Download, Upload, Trash2, Moon, Sun, Database, HardDrive } from 'lucide-react'

interface SettingsViewProps {
  onRefresh?: () => void
}

export function SettingsView({ onRefresh }: SettingsViewProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [companyCount, setCompanyCount] = useState<number>(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setCompanyCount(getCachedCount())
    chrome.storage.local.get('darkMode').then(({ darkMode: dm }) => {
      setDarkMode(!!dm)
    })
  }, [])

  const toggleDarkMode = async () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    await chrome.storage.local.set({ darkMode: next })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setMessage(null)
    setError(null)
    try {
      const count = await fullRefresh()
      setCompanyCount(count)
      setMessage(`Cache refreshed: ${count} companies loaded`)
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Clear the in-memory cache? Data will be re-fetched from the API on next load.')) return
    setClearing(true)
    try {
      await clearCache()
      setCompanyCount(0)
      setMessage('Cache cleared')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache')
    } finally {
      setClearing(false)
    }
  }

  const handleExport = async () => {
    const { collections, notes, tags } = await chrome.storage.local.get(['collections', 'notes', 'tags'])
    const blob = new Blob([JSON.stringify({ collections, notes, tags, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'yc-directory-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.collections || data.notes || data.tags) {
          const toSet: Record<string, unknown> = {}
          if (data.collections) toSet.collections = data.collections
          if (data.notes) toSet.notes = data.notes
          if (data.tags) toSet.tags = data.tags
          await chrome.storage.local.set(toSet)
          setMessage('Data imported successfully!')
        } else {
          setError('Invalid backup file')
        }
      } catch {
        setError('Failed to parse backup file')
      }
    }
    input.click()
  }

  const handleClearUserData = async () => {
    if (confirm('Clear all user data (collections, notes, tags)? This cannot be undone.')) {
      await chrome.storage.local.remove(['collections', 'notes', 'tags'])
      setMessage('User data cleared')
    }
  }

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
          <Database className="h-4 w-4 text-yc-orange" /> Cache
        </h3>
        <p className="text-xs text-muted-foreground">
          In-memory cache with IndexedDB persistence.
          {companyCount > 0 ? ` ${companyCount} companies cached.` : ' No data cached.'}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs gap-2 h-9"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshing ? 'Refreshing...' : 'Refresh Company Data'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs gap-2 h-9"
          onClick={handleClearCache}
          disabled={clearing}
        >
          {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
          Clear Memory Cache
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-2">User Data</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs gap-2 h-9"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export Backup (notes, collections, tags)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs gap-2 h-9"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4" /> Import Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs gap-2 h-9 text-destructive hover:text-destructive"
            onClick={handleClearUserData}
          >
            <Trash2 className="h-4 w-4" /> Clear User Data
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-2">Appearance</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="text-xs cursor-pointer">Dark Mode</Label>
          <Button
            id="dark-mode"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs p-3 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 text-xs p-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

function Separator() {
  return <div className="border-t" />
}
