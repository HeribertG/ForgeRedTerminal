import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI: {
      executeCommand: (command: string, workingDir: string) => Promise<any>;
      getCurrentWorkingDirectory: () => Promise<string>;
      changeDirectory: (newDir: string) => Promise<any>;
      getSystemInfo: () => Promise<any>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
      platform: string;
      versions: any;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  public isElectron: boolean;

  constructor() {
    this.isElectron = this.isElectronApp();
  }

  private isElectronApp(): boolean {
    return !!(window && window.electronAPI);
  }

  public isWindows(): boolean {
    if (this.isElectron) {
      return window.electronAPI.platform === 'win32';
    }
    return navigator.platform.toLowerCase().includes('win');
  }

  public isMac(): boolean {
    if (this.isElectron) {
      return window.electronAPI.platform === 'darwin';
    }
    return navigator.platform.toLowerCase().includes('mac');
  }

  public isLinux(): boolean {
    if (this.isElectron) {
      return window.electronAPI.platform === 'linux';
    }
    return navigator.platform.toLowerCase().includes('linux');
  }

  async executeCommand(command: string, workingDir: string): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Electron nicht verfügbar - Befehle können nur in der Desktop-App ausgeführt werden');
    }

    return await window.electronAPI.executeCommand(command, workingDir);
  }

  async getCurrentWorkingDirectory(): Promise<string> {
    if (!this.isElectron) {
      return 'Browser-Modus';
    }

    return await window.electronAPI.getCurrentWorkingDirectory();
  }

  async changeDirectory(newDir: string): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Electron nicht verfügbar');
    }

    return await window.electronAPI.changeDirectory(newDir);
  }

  async getSystemInfo(): Promise<any> {
    if (!this.isElectron) {
      return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language
      };
    }

    return await window.electronAPI.getSystemInfo();
  }

  // Window-Control Methoden
  async minimizeWindow(): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.windowMinimize();
    }
  }

  async maximizeWindow(): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.windowMaximize();
    }
  }

  async closeWindow(): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.windowClose();
    }
  }

  async isWindowMaximized(): Promise<boolean> {
    if (this.isElectron) {
      return await window.electronAPI.windowIsMaximized();
    }
    return false;
  }

  getElectronVersion(): string {
    if (this.isElectron) {
      return window.electronAPI.versions.electron;
    }
    return 'Browser';
  }
}