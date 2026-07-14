import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BatchView } from './components/BatchView'
import { HomeView } from './components/HomeView'
import { SettingsView } from './components/SettingsView'
import { Search, LayoutGrid, Settings } from 'lucide-react'

type Tab = 'browse' | 'home' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('browse')

  useEffect(() => {
    chrome.storage.local.get('darkMode').then(({ darkMode: dm }) => {
      if (dm) document.documentElement.classList.add('dark')
    })
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-3 rounded-none border-b px-0 py-0 h-auto shrink-0 bg-background gap-0">
          {[
            { value: 'browse' as Tab, icon: Search, label: 'Browse' },
            { value: 'home' as Tab, icon: LayoutGrid, label: 'Home' },
            { value: 'settings' as Tab, icon: Settings, label: 'Settings' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center justify-center gap-1.5 text-xs py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-yc-orange data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden bg-background">
          <TabsContent value="browse" className="h-full m-0 p-0 overflow-auto">
            <BatchView />
          </TabsContent>
          <TabsContent value="home" className="h-full m-0 p-0 overflow-auto">
            <HomeView />
          </TabsContent>
          <TabsContent value="settings" className="h-full m-0 p-0 overflow-auto">
            <SettingsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
