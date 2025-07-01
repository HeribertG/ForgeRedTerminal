const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für Angular
contextBridge.exposeInMainWorld('electronAPI', {
  // Befehle ausführen
  executeCommand: (command, workingDir) => 
    ipcRenderer.invoke('execute-command', command, workingDir),
  
  // Verzeichnis-Operationen
  getCurrentWorkingDirectory: () => 
    ipcRenderer.invoke('get-cwd'),
  
  changeDirectory: (newDir) => 
    ipcRenderer.invoke('change-directory', newDir),
  
  // System-Informationen
  getSystemInfo: () => 
    ipcRenderer.invoke('get-system-info'),
  
  // Window-Controls
  windowMinimize: () => 
    ipcRenderer.invoke('window-minimize'),
  
  windowMaximize: () => 
    ipcRenderer.invoke('window-maximize'),
  
  windowClose: () => 
    ipcRenderer.invoke('window-close'),
  
  windowIsMaximized: () => 
    ipcRenderer.invoke('window-is-maximized'),
  
  // Platform-Detection
  platform: process.platform,
  versions: process.versions
});