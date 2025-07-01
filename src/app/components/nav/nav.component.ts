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
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  @Output() commandSelected = new EventEmitter<string>();

  currentDirectory = '';
  commandCategories: CommandCategory[] = [];

  constructor(private electronService: ElectronService) { }

  async ngOnInit() {
    this.initializeCommands();
    await this.updateCurrentDirectory();
  }

  private initializeCommands() {
    const isWindows = this.electronService.isWindows();

    this.commandCategories = [
      {
        name: 'Navigation',
        expanded: true,
        commands: [
          {
            name: 'Verzeichnis auflisten',
            value: isWindows ? 'dir' : 'ls -la',
            description: 'Listet alle Dateien und Ordner auf',
            icon: '📁'
          },
          {
            name: 'Aktueller Pfad',
            value: isWindows ? 'cd' : 'pwd',
            description: 'Zeigt den aktuellen Pfad an',
            icon: '📍'
          },
          {
            name: 'Home Verzeichnis',
            value: isWindows ? 'cd %USERPROFILE%' : 'cd ~',
            description: 'Wechselt zum Home-Verzeichnis',
            icon: '🏠'
          }
        ]
      },
      {
        name: 'System Info',
        expanded: true,
        commands: [
          {
            name: 'Systeminfo',
            value: isWindows ? 'systeminfo' : 'uname -a',
            description: 'Zeigt Systeminformationen',
            icon: '💻'
          },
          {
            name: 'Laufende Prozesse',
            value: isWindows ? 'tasklist' : 'ps aux',
            description: 'Zeigt laufende Prozesse',
            icon: '⚙️'
          },
          {
            name: 'Netzwerk',
            value: isWindows ? 'ipconfig' : 'ifconfig',
            description: 'Zeigt Netzwerkkonfiguration',
            icon: '🌐'
          }
        ]
      },
      {
        name: 'Terminal',
        expanded: false,
        commands: [
          {
            name: 'Hilfe',
            value: 'help',
            description: 'Zeigt verfügbare Befehle',
            icon: '❓'
          },
          {
            name: 'Terminal leeren',
            value: 'clear',
            description: 'Löscht den Terminal-Inhalt',
            icon: '🧹'
          }
        ]
      }
    ];
  }

  toggleCategory(categoryName: string) {
    const category = this.commandCategories.find(c => c.name === categoryName);
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  selectCommand(command: string) {
    this.commandSelected.emit(command);
  }

  private async updateCurrentDirectory() {
    try {
      this.currentDirectory = await this.electronService.getCurrentWorkingDirectory();
    } catch (error) {
      this.currentDirectory = 'Unbekannt';
    }
  }
}