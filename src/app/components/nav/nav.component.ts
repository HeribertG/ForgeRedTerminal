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

    this.commandCategories = [
      {
        name: 'Docker',
        expanded: false,
        commands: [
          {
            name: 'Lösche Docker',
            value: isWindows
              ? 'powershell -NoProfile  -Command "Set-Location C:\\ForgeRed\\Docker; node docker_cleanup.js"'
              : 'cd /d C:\\ForgeRed\\Docker && node docker_cleanup.js',
            description: 'Löscht alle Docker Container, Images und Volumes',
            icon: '🗑️',
          },
          {
            name: 'Installiere Docker',
            value: isWindows
              ? 'cmd /c "cd /d C:\\ForgeRed\\Docker && node docker_run.js"'
              : 'cd /d C:\\ForgeRed\\Docker && node docker_run.js',
            description: 'Startet alle Docker Services',
            icon: '▶️', // Fallback: '[>]'
          },
          {
            name: 'Starte Docker',
            value: isWindows
              ? 'cmd /c "cd /d C:\\ForgeRed\\Docker && docker-compose up -d"'
              : 'cd /d C:\\ForgeRed\\Docker && docker-compose up -d',
            description: 'Startet alle Docker Services',
            icon: '🏃', // Fallback: '[>]'
          },
        ],
      },
      {
        name: 'Install Minimum Redmine',
        expanded: false,
        commands: [
          {
            name: 'Config Database',
            value: isWindows
              ? 'powershell  -NoProfile -Command "Set-Location C:\\ForgeRed\\TS_Scripts; npx ts-node .\\configDatabase.ts"'
              : 'cd /d C:\\ForgeRed\\TS_Scripts && npx ts-node .\\configDatabase.ts',
            description: 'Konfiguriert die Datenbank für Redmine',
            icon: '🗑️',
          },
          {
            name: 'Setting Redmine',
            value: isWindows
              ? 'powershell -NoProfile  -Command "Set-Location C:\\ForgeRed\\TS_Scripts; npx ts-node .\\settingRedmine.ts"'
              : 'cd /d C:\\ForgeRed\\TS_Scripts && npx ts-node .\\settingRedmine.ts',
            description: 'Installiere alle Setting für Redmine',
            icon: '⚙️', // Fallback: '[>]'
          },
          {
            name: 'Redmine Admin Login',
            value: isWindows
              ? 'powershell -NoProfile  -Command "Start-Process \'http://localhost:4762/login?username=admin\'"'
              : 'xdg-open http://localhost:4762/login?username=admin',
            description: 'Öffnet Redmine mit Admin-Login',
            icon: '🔐',
          },
          {
            name: 'Öffne phpMyAdmin',
            value: isWindows
              ? 'powershell -NoProfile  -Command "Start-Process \'http://localhost:9090\'"'
              : 'xdg-open http://localhost:9090',
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
            icon: '📁', // Fallback: '[DIR]'
          },
          {
            name: 'Aktueller Pfad',
            value: isWindows ? 'cd' : 'pwd',
            description: 'Zeigt den aktuellen Pfad an',
            icon: '📍', // Fallback: '[LOC]'
          },
          {
            name: 'Home Verzeichnis',
            value: isWindows ? 'cd %USERPROFILE%' : 'cd ~',
            description: 'Wechselt zum Home-Verzeichnis',
            icon: '🏠', // Fallback: '[HOME]'
          },
        ],
      },
      {
        name: 'System Info',
        expanded: false,
        commands: [
          {
            name: 'Systeminfo',
            value: isWindows ? 'systeminfo' : 'uname -a',
            description: 'Zeigt Systeminformationen',
            icon: '💻', // Fallback: '[SYS]'
          },
          {
            name: 'Laufende Prozesse',
            value: isWindows ? 'tasklist' : 'ps aux',
            description: 'Zeigt laufende Prozesse',
            icon: '⚙️', // Fallback: '[PROC]'
          },
          {
            name: 'Netzwerk',
            value: isWindows ? 'ipconfig' : 'ip addr show',
            description: 'Zeigt Netzwerkkonfiguration',
            icon: '🌐', // Fallback: '[NET]'
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
            icon: '❓', // Fallback: '[?]'
          },
          {
            name: 'Terminal leeren',
            value: 'clear',
            description: 'Löscht den Terminal-Inhalt',
            icon: '🧹', // Fallback: '[CLR]'
          },
        ],
      },
    ];
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
