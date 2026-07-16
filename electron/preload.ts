import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})
