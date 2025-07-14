import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../services/electron.service';

interface SavedCommand {
  name: string;
  value: string;
  description: string;
  icon: string;
}

interface CommandCategory {
  name: string;
  expanded: boolean;
  commands: SavedCommand[];
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  @Output() commandSelected = new EventEmitter<string>();

  currentDirectory = '';
  commandCategories: CommandCategory[] = [];

  constructor(private electronService: ElectronService) {}

  async ngOnInit() {
    this.initializeCommands();
    await this.updateCurrentDirectory();
  }

  private initializeCommands() {
    const isWindows = this.electronService.isWindows();
    const isLinux = this.electronService.isLinux();

    this.commandCategories = [
      {
        name: 'Docker',
        expanded: false,
        commands: [
          {
            name: 'Lösche Docker',
            value: this.getDockerCleanupCommand(isWindows, isLinux),
            description: 'Löscht alle Docker Container, Images und Volumes',
            icon: '🗑️',
          },
          {
            name: 'Installiere Docker',
            value: this.getDockerInstallCommand(isWindows, isLinux),
            description: 'Startet alle Docker Services',
            icon: '▶️',
          },
          {
            name: 'Starte Docker',
            value: this.getDockerStartCommand(isWindows, isLinux),
            description: 'Startet alle Docker Services',
            icon: '🏃',
          },
        ],
      },
      {
        name: 'Install Minimum Redmine',
        expanded: false,
        commands: [
          {
            name: 'Config Database',
            value: this.getConfigDatabaseCommand(isWindows, isLinux),
            description: 'Konfiguriert die Datenbank für Redmine',
            icon: '🗄️',
          },
          {
            name: 'Setting Redmine',
            value: this.getSettingRedmineCommand(isWindows, isLinux),
            description: 'Installiere alle Settings für Redmine',
            icon: '⚙️',
          },
          {
            name: 'Redmine Admin Login',
            value: this.getRedmineLoginCommand(isWindows, isLinux),
            description: 'Öffnet Redmine mit Admin-Login',
            icon: '🔐',
          },
          {
            name: 'Öffne phpMyAdmin',
            value: this.getPhpMyAdminCommand(isWindows, isLinux),
            description: 'Öffnet phpMyAdmin',
            icon: '🗄️',
          },
        ],
      },
      {
        name: 'Navigation',
        expanded: false,
        commands: [
          {
            name: 'Verzeichnis auflisten',
            value: isWindows ? 'dir' : 'ls -la',
            description: 'Listet alle Dateien und Ordner auf',
            icon: '📁',
          },
          {
            name: 'Aktueller Pfad',
            value: isWindows ? 'cd' : 'pwd',
            description: 'Zeigt den aktuellen Pfad an',
            icon: '📍',
          },
          {
            name: 'Home Verzeichnis',
            value: isWindows ? 'cd %USERPROFILE%' : 'cd ~',
            description: 'Wechselt zum Home-Verzeichnis',
            icon: '🏠',
          },
          {
            name: 'ForgeRed Verzeichnis',
            value: isWindows ? 'cd C:\\ForgeRed' : 'cd /root/ForgeRed',
            description: 'Wechselt zum ForgeRed-Hauptverzeichnis',
            icon: '🔥',
          },
        ],
      },
      {
        name: 'System Info',
        expanded: false,
        commands: [
          {
            name: 'Systeminfo',
            value: isWindows ? 'systeminfo' : 'uname -a && lsb_release -a',
            description: 'Zeigt Systeminformationen',
            icon: '💻',
          },
          {
            name: 'Laufende Prozesse',
            value: isWindows ? 'tasklist' : 'ps aux',
            description: 'Zeigt laufende Prozesse',
            icon: '⚙️',
          },
          {
            name: 'Netzwerk',
            value: isWindows ? 'ipconfig' : 'ip addr show',
            description: 'Zeigt Netzwerkkonfiguration',
            icon: '🌐',
          },
          {
            name: 'Festplatte',
            value: isWindows ? 'dir C:\\ /s' : 'df -h',
            description: 'Zeigt Festplattenbelegung',
            icon: '💾',
          },
          {
            name: 'Memory/RAM',
            value: isWindows
              ? 'wmic computersystem get TotalPhysicalMemory'
              : 'free -h',
            description: 'Zeigt Speicherverbrauch',
            icon: '🧠',
          },
        ],
      },
      {
        name: 'Terminal',
        expanded: false,
        commands: [
          {
            name: 'Hilfe',
            value: 'help',
            description: 'Zeigt verfügbare Befehle',
            icon: '❓',
          },
          {
            name: 'Terminal leeren',
            value: 'clear',
            description: 'Löscht den Terminal-Inhalt',
            icon: '🧹',
          },
          {
            name: 'Geschichte anzeigen',
            value: isWindows ? 'doskey /history' : 'history',
            description: 'Zeigt Befehlshistorie',
            icon: '📜',
          },
        ],
      },
    ];
  }

  // 🐳 Docker-Befehle (Platform-spezifisch)
  private getDockerCleanupCommand(
    isWindows: boolean,
    isLinux: boolean
  ): string {
    if (isWindows) {
      return 'powershell -NoProfile -Command "Set-Location C:\\ForgeRed\\Docker; node docker_cleanup.js"';
    } else if (isLinux) {
      return 'cd /root/ForgeRed/Docker && node docker_cleanup.js';
    }
    return 'echo "Platform not supported"';
  }

  private getDockerInstallCommand(
    isWindows: boolean,
    isLinux: boolean
  ): string {
    if (isWindows) {
      return 'cmd /c "cd /d C:\\ForgeRed\\Docker && node docker_run.js"';
    } else if (isLinux) {
      return 'cd /root/ForgeRed/Docker && node docker_run.js';
    }
    return 'echo "Platform not supported"';
  }

  private getDockerStartCommand(isWindows: boolean, isLinux: boolean): string {
    if (isWindows) {
      return 'cmd /c "cd /d C:\\ForgeRed\\Docker && docker-compose up -d"';
    } else if (isLinux) {
      return 'cd /root/ForgeRed/Docker && docker-compose up -d';
    }
    return 'echo "Platform not supported"';
  }

  // 🗄️ Redmine-Befehle (Platform-spezifisch)
  private getConfigDatabaseCommand(
    isWindows: boolean,
    isLinux: boolean
  ): string {
    if (isWindows) {
      return 'powershell -NoProfile -Command "Set-Location C:\\ForgeRed\\TS_Scripts; npx ts-node .\\configDatabase.ts"';
    } else if (isLinux) {
      // ✅ KORRIGIERT: Linux-Pfad ohne Windows-spezifische /d Parameter
      return 'cd /root/ForgeRed/TS_Scripts && npx ts-node ./configDatabase.ts';
    }
    return 'echo "Platform not supported"';
  }

  private getSettingRedmineCommand(
    isWindows: boolean,
    isLinux: boolean
  ): string {
    if (isWindows) {
      return 'powershell -NoProfile -Command "Set-Location C:\\ForgeRed\\TS_Scripts; npx ts-node .\\settingRedmine.ts"';
    } else if (isLinux) {
      // ✅ KORRIGIERT: Linux-Pfad ohne Windows-spezifische /d Parameter
      return 'cd /root/ForgeRed/TS_Scripts && npx ts-node ./settingRedmine.ts';
    }
    return 'echo "Platform not supported"';
  }

  private getRedmineLoginCommand(isWindows: boolean, isLinux: boolean): string {
    if (isWindows) {
      return 'powershell -NoProfile -Command "Start-Process \'http://localhost:4762/login?username=admin\'"';
    } else if (isLinux) {
      // ✅ Linux-spezifisch: xdg-open oder firefox als Fallback
      return 'xdg-open http://localhost:4762/login?username=admin || firefox http://localhost:4762/login?username=admin';
    }
    return 'echo "Platform not supported"';
  }

  private getPhpMyAdminCommand(isWindows: boolean, isLinux: boolean): string {
    if (isWindows) {
      return 'powershell -NoProfile -Command "Start-Process \'http://localhost:9090\'"';
    } else if (isLinux) {
      // ✅ Linux-spezifisch: xdg-open oder firefox als Fallback
      return 'xdg-open http://localhost:9090 || firefox http://localhost:9090';
    }
    return 'echo "Platform not supported"';
  }

  toggleCategory(categoryName: string) {
    const category = this.commandCategories.find(
      (c) => c.name === categoryName
    );
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  selectCommand(command: string) {
    this.commandSelected.emit(command);
  }

  private async updateCurrentDirectory() {
    try {
      this.currentDirectory =
        await this.electronService.getCurrentWorkingDirectory();
    } catch (error) {
      this.currentDirectory = 'Unbekannt';
    }
  }
}
