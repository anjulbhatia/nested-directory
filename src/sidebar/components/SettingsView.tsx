import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { Card, CardContent } from '../../components/ui/card'
import { getCachedCount, clearCache, fullRefresh } from '../../lib/cache'
import { RefreshCw, Loader2, Download, Upload, Trash2, Moon, Sun, Database, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react'

interface SettingsViewProps {
  onRefresh?: () => void
}

export function SettingsView({ onRefresh }: SettingsViewProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [companyCount, setCompanyCount] = useState<number>(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setCompanyCount(getCachedCount())
    chrome.storage.local.get('darkMode').then(({ darkMode: dm }) => {
      setDarkMode(!!dm)
    })
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const toggleDarkMode = async () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    await chrome.storage.local.set({ darkMode: next })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const count = await fullRefresh()
      setCompanyCount(count)
      showMessage('success', `Cache refreshed: ${count} companies loaded`)
      onRefresh?.()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Refresh failed')
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
      showMessage('success', 'Memory cache cleared')
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to clear cache')
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
          showMessage('success', 'Data imported successfully!')
        } else {
          showMessage('error', 'Invalid backup file')
        }
      } catch {
        showMessage('error', 'Failed to parse backup file')
      }
    }
    input.click()
  }

  const handleClearUserData = async () => {
    if (confirm('Clear all user data (collections, notes, tags)? This cannot be undone.')) {
      await chrome.storage.local.remove(['collections', 'notes', 'tags'])
      showMessage('success', 'User data cleared')
    }
  }

  return (
    <div className="p-3 space-y-3">
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yc-orange/10 flex items-center justify-center">
              <Database className="h-4 w-4 text-yc-orange" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Cache</h3>
              <p className="text-xs text-muted-foreground">
                {companyCount > 0 ? `${companyCount} companies cached` : 'No data cached'}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Upload className="h-4 w-4 text-yc-orange" /> User Data
          </h3>
          <div className="space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs gap-2 h-9"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" /> Export Backup
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
              className="w-full justify-start text-xs gap-2 h-9 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
              onClick={handleClearUserData}
            >
              <Trash2 className="h-4 w-4" /> Clear All User Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            {darkMode ? <Moon className="h-4 w-4 text-yc-orange" /> : <Sun className="h-4 w-4 text-yc-orange" />}
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-xs cursor-pointer font-medium">Dark Mode</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Toggle dark color scheme</p>
            </div>
            <button
              id="dark-mode"
              role="switch"
              aria-checked={darkMode}
              onClick={toggleDarkMode}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                darkMode ? 'bg-yc-orange' : 'bg-muted-foreground/30'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {darkMode ? (
                  <Moon className="h-2.5 w-2.5 text-yc-orange" />
                ) : (
                  <Sun className="h-2.5 w-2.5 text-amber-500" />
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <div
          className={`flex items-center gap-2 text-xs p-3 rounded-lg border animate-in slide-in-from-bottom-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  )
}
