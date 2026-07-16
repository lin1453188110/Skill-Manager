/// <reference types="vite/client" />

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  getBackendPort: () => Promise<number>
  openExternal: (url: string) => Promise<void>
}

interface Window {
  electronAPI: ElectronAPI
  __BACKEND_PORT__: number
}
