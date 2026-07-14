/// <reference types="vite/client" />

interface ImportMetaEnv {
  EXTENSION_PUBLIC_BROWSER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface BrowserRuntimeMessageEvent {
  addListener(callback: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => void): void
}

declare namespace browser {
  namespace browserAction {
    var onClicked: { addListener(callback: (tab: browser.tabs.Tab) => void): void }
  }
  namespace sidebarAction {
    var open: () => void
  }
  namespace runtime {
    function sendMessage(message: unknown): Promise<unknown>
    const onMessage: BrowserRuntimeMessageEvent
    function connect(params?: { name?: string }): {
      onMessage: { addListener: (cb: (msg: unknown) => void) => void }
      postMessage: (msg: unknown) => void
    }
  }
  namespace tabs {
    function query(queryInfo: Record<string, unknown>): Promise<browser.tabs.Tab[]>
    interface Tab {
      id?: number
      url?: string
      title?: string
    }
  }
}

declare module '*.css' {}
