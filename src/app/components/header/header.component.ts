import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  osInfo = '';
  isElectron = false;

  constructor(private electronService: ElectronService) { }

  async ngOnInit() {
    this.isElectron = this.electronService.isElectron;
    await this.loadOSInfo();
  }

  private async loadOSInfo() {
    if (this.isElectron) {
      try {
        const systemInfo = await this.electronService.getSystemInfo();
        this.osInfo = `${systemInfo.platform} ${systemInfo.release}`;
      } catch (error) {
        this.osInfo = 'Electron App';
      }
    } else {
      this.osInfo = 'Browser Mode';
    }
  }

  async minimizeWindow() {
    await this.electronService.minimizeWindow();
  }

  async maximizeWindow() {
    await this.electronService.maximizeWindow();
  }

  async closeWindow() {
    await this.electronService.closeWindow();
  }
}