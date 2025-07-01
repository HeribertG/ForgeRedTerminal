import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  angularVersion = '19.2.0';
  electronVersion = '';
  memoryUsage = 0;
  cpuUsage = 0;
  isOnline = navigator.onLine;

  private statsInterval: any;

  constructor(private electronService: ElectronService) { }

  ngOnInit() {
    this.loadVersions();
    this.startStatsMonitoring();
    this.setupOnlineListener();
  }

  ngOnDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  private loadVersions() {
    if (this.electronService.isElectron) {
      this.electronVersion = this.electronService.getElectronVersion();
    } else {
      this.electronVersion = 'Browser';
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startStatsMonitoring() {
    this.updateStats();

    this.statsInterval = setInterval(() => {
      this.updateStats();
    }, 2000);
  }

  private updateStats() {
    if (this.electronService.isElectron) {
      // Placeholder für echte Memory-Stats
      this.memoryUsage = Math.round(Math.random() * 20 + 15);
      this.cpuUsage = Math.round(Math.random() * 15 + 5);
    } else {
      // Browser-Fallback
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        this.memoryUsage = Math.round((memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100);
      } else {
        this.memoryUsage = Math.round(Math.random() * 10 + 5);
      }
      this.cpuUsage = Math.round(Math.random() * 8 + 2);
    }
  }

  openDocumentation() {
    if (this.electronService.isElectron) {
      // In Electron könntest du shell.openExternal verwenden
      window.open('https://angular.io/docs', '_blank');
    } else {
      window.open('https://angular.io/docs', '_blank');
    }
  }

  openSettings() {
    alert('Einstellungen werden bald verfügbar sein!');
  }

  showAbout() {
    const aboutText = `
ForgeRed Terminal
Version: 1.0.0

Entwickelt mit:
• Angular ${this.angularVersion}
• Electron ${this.electronVersion}
• TypeScript für moderne Entwicklung

Features:
• Echte Systembefehle
• Plattformübergreifend
• Terminal-Emulation
• Befehlshistorie
• IPC-Kommunikation

© 2025 ForgeRed Terminal
    `;

    alert(aboutText);
  }
}