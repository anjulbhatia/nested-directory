import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BatchView } from './components/BatchView'
import { HomeView } from './components/HomeView'
import { SettingsView } from './components/SettingsView'

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
        <TabsList className="grid grid-cols-3 rounded-none border-b px-1 py-0 h-auto shrink-0 bg-background">
          <TabsTrigger value="browse" className="text-xs py-2 data-[state=active]:shadow-none">
            Browse
          </TabsTrigger>
          <TabsTrigger value="home" className="text-xs py-2 data-[state=active]:shadow-none">
            Home
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs py-2 data-[state=active]:shadow-none">
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="browse" className="h-full m-0 p-3 overflow-auto">
            <BatchView />
          </TabsContent>
          <TabsContent value="home" className="h-full m-0 p-3 overflow-auto">
            <HomeView />
          </TabsContent>
          <TabsContent value="settings" className="h-full m-0 p-3 overflow-auto">
            <SettingsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
