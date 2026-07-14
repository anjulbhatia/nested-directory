import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { YcLogo } from '../components/YcLogo'
import { ExternalLink, Bookmark, CheckCircle2, ArrowRight } from 'lucide-react'

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
    <div className="w-72 p-3 bg-background text-foreground">
      <div className="flex items-center gap-2.5 mb-3">
        <YcLogo className="w-7 h-7" />
        <div>
          <h1 className="text-sm font-semibold leading-tight">YC Directory</h1>
          <p className="text-[10px] text-muted-foreground">Chrome Extension</p>
        </div>
      </div>

      {isYcPage && (
        <div className="bg-yc-orange/5 border border-yc-orange/20 rounded-lg p-2.5 mb-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-yc-orange" />
            <span className="text-xs font-medium">On Y Combinator</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            Viewing <span className="font-medium text-foreground">{companySlug}</span>
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {isYcPage && (
          <Button
            className="w-full text-xs gap-1.5 h-8"
            size="sm"
            variant="outline"
          >
            <Bookmark className="h-3 w-3" /> Save to Collection
          </Button>
        )}
        <Button
          className="w-full text-xs gap-1.5 h-8"
          size="sm"
          onClick={() => {
            chrome.runtime.sendMessage({ type: 'openSidebar' })
          }}
        >
          <ExternalLink className="h-3 w-3" /> Open Side Panel
          <ArrowRight className="h-3 w-3 ml-auto" />
        </Button>
      </div>

      {!isYcPage && (
        <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
          Navigate to a Y Combinator company page to save it
        </p>
      )}
    </div>
  )
}
