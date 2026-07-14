import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { YcLogo } from '../components/YcLogo'
import { ExternalLink, Bookmark } from 'lucide-react'

export default function App() {
  const [isYcPage, setIsYcPage] = useState(false)
  const [companySlug, setCompanySlug] = useState('')

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab?.url) {
        const match = tab.url.match(/ycombinator\.com\/companies\/([^/?]+)/)
        if (match) {
          setIsYcPage(true)
          setCompanySlug(match[1])
        }
      }
    })
  }, [])

  return (
    <div className="w-72 p-3 space-y-2 bg-background text-foreground">
      <div className="flex items-center gap-2">
        <YcLogo className="w-5 h-5" />
        <h1 className="text-sm font-semibold">YC Directory</h1>
      </div>

      <p className="text-xs text-muted-foreground">
        {isYcPage
          ? `Viewing "${companySlug}" on Y Combinator`
          : 'Browse and organize YC startups in the side panel.'}
      </p>

      <div className="space-y-1.5">
        {isYcPage && (
          <Button
            className="w-full text-xs gap-1"
            size="sm"
            variant="outline"
          >
            <Bookmark className="h-3 w-3" /> Save to Collection
          </Button>
        )}
        <Button
          className="w-full text-xs gap-1"
          size="sm"
          onClick={() => {
            chrome.runtime.sendMessage({ type: 'openSidebar' })
          }}
        >
          <ExternalLink className="h-3 w-3" /> Open Side Panel
        </Button>
      </div>
    </div>
  )
}
