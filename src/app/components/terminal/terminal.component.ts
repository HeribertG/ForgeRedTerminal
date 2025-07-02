import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements OnInit, AfterViewInit {
  @ViewChild('terminalScroll', { static: false }) terminalScroll!: ElementRef;

  currentCommand = '';
  terminalOutput: string[] = [];
  currentWorkingDirectory = '';
  commandHistory: string[] = [];
  historyIndex = -1;
  isProcessing = false;
  commandCount = 0;
  private isUserScrolling = false;
  private scrollTimeout: any;

  constructor(private electronService: ElectronService) { }

  async ngOnInit() {
    await this.initializeTerminal();
  }

  ngAfterViewInit() {
    this.setupScrollListener();
    this.scrollToBottom(true);
  }

  private async initializeTerminal() {
    this.terminalOutput = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║            🖥️ ForgeRed Terminal gestartet                    ║',
      '╚══════════════════════════════════════════════════════════════╝',
      ''
    ];

    if (this.electronService.isElectron) {
      try {
        this.currentWorkingDirectory = await this.electronService.getCurrentWorkingDirectory();
        this.terminalOutput.push(`📁 Arbeitsverzeichnis: ${this.currentWorkingDirectory}`);

        const systemInfo = await this.electronService.getSystemInfo();
        this.terminalOutput.push(`💻 System: ${systemInfo.platform} ${systemInfo.release}`);
        this.terminalOutput.push(`🔧 Electron: ${this.electronService.getElectronVersion()}`);
      } catch (error) {
        this.terminalOutput.push(`❌ Fehler beim Laden der Systeminfo: ${error}`);
      }
    } else {
      this.terminalOutput.push('⚠️ Browser-Modus - Keine echten Systembefehle verfügbar');
      this.terminalOutput.push('💡 Starte die App mit: npm run electron-dev');
    }

    this.terminalOutput.push('');
    this.terminalOutput.push('Verfügbare Features:');
    this.terminalOutput.push('  • 💾 Systembefehle (dir, cd, systeminfo, etc.)');
    this.terminalOutput.push('  • 📂 Arbeitsverzeichnis-Management');
    this.terminalOutput.push('  • 🔄 Befehlshistorie (↑/↓ Pfeiltasten)');
    this.terminalOutput.push('  • 🚀 Schnellbefehle über Navigation');
    this.terminalOutput.push('');
    this.terminalOutput.push('Gib "help" für verfügbare Befehle ein.');
    this.terminalOutput.push('');
  }

  async executeCommand(command: string) {
    if (!command.trim()) return;

    const cmd = command.trim();
    this.addToHistory(cmd);
    this.terminalOutput.push(`${this.getPrompt()}${cmd}`);
    this.currentCommand = '';
    this.isProcessing = true;
    this.commandCount++;


    this.scrollToBottom(true);

    try {

      if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
        this.terminalOutput = [];
        this.isProcessing = false;
        return;
      }

      if (cmd.toLowerCase() === 'help') {
        this.showHelp();
        this.isProcessing = false;
        return;
      }


      if (cmd.toLowerCase().startsWith('cd ')) {
        await this.handleChangeDirectory(cmd.substring(3).trim());
        this.isProcessing = false;
        return;
      }

      if (cmd.toLowerCase() === 'cd') {
        this.terminalOutput.push(this.currentWorkingDirectory);
        this.isProcessing = false;
        return;
      }


      if (this.electronService.isElectron) {
        await this.executeSystemCommand(cmd);
      } else {
        this.terminalOutput.push('❌ Systembefehle nur in Electron verfügbar');
        this.terminalOutput.push('💡 Starte die App mit: npm run electron-dev');
      }

    } catch (error) {
      this.terminalOutput.push(`❌ Fehler: ${error}`);
    }

    this.isProcessing = false;
    this.terminalOutput.push('');
    this.scrollToBottom(true);
  }

  private async executeSystemCommand(command: string) {
    try {
      this.terminalOutput.push('⏳ Ausführung...');

      const result = await this.electronService.executeCommand(command, this.currentWorkingDirectory);

      this.terminalOutput.pop();

      if (result.output) {
        const lines = result.output.split('\n');
        lines.forEach((line: string) => {
          if (line.trim()) {
            this.terminalOutput.push(line);
          }
        });
      }

      this.scrollToBottom(true);

      if (result.error) {
        const errorLines = result.error.split('\n');
        errorLines.forEach((line: string) => {
          if (line.trim()) {
            this.terminalOutput.push(`🔴 ${line}`);
          }
        });
      }

      if (result.exitCode !== 0 && result.exitCode !== null) {
        this.terminalOutput.push(`⚠️ Exit-Code: ${result.exitCode}`);
      }

    } catch (error) {
      this.terminalOutput.push(`❌ Befehlsfehler: ${error}`);
    }
  }

  private async handleChangeDirectory(newDir: string) {
    if (!this.electronService.isElectron) {
      this.terminalOutput.push('❌ CD-Befehl nur in Electron verfügbar');
      return;
    }

    try {
      const result = await this.electronService.changeDirectory(newDir);

      if (result.success) {
        this.currentWorkingDirectory = result.cwd;
        this.terminalOutput.push(`✅ Verzeichnis gewechselt zu: ${this.currentWorkingDirectory}`);
      } else {
        this.terminalOutput.push(`❌ Fehler: ${result.error}`);
      }
    } catch (error) {
      this.terminalOutput.push(`❌ CD-Fehler: ${error}`);
    }
  }

  private showHelp() {
    this.terminalOutput.push('╔═══════════════════════════════════════════════════════════════╗');
    this.terminalOutput.push('║                        🛠️ HILFE                              ║');
    this.terminalOutput.push('╠═══════════════════════════════════════════════════════════════╣');
    this.terminalOutput.push('║ 📁 Navigation:                                               ║');
    this.terminalOutput.push('║   dir / ls        - Verzeichnisinhalt anzeigen               ║');
    this.terminalOutput.push('║   cd <pfad>       - Verzeichnis wechseln                     ║');
    this.terminalOutput.push('║   cd ..           - Eine Ebene nach oben                     ║');
    this.terminalOutput.push('║   pwd             - Aktuellen Pfad anzeigen                  ║');
    this.terminalOutput.push('║                                                               ║');
    this.terminalOutput.push('║ 💻 System:                                                   ║');
    this.terminalOutput.push('║   systeminfo      - Systeminformationen                      ║');
    this.terminalOutput.push('║   tasklist / ps   - Laufende Prozesse                        ║');
    this.terminalOutput.push('║   ipconfig        - Netzwerkkonfiguration                    ║');
    this.terminalOutput.push('║                                                               ║');
    this.terminalOutput.push('║ 🖥️ Terminal:                                                 ║');
    this.terminalOutput.push('║   clear / cls     - Bildschirm löschen                       ║');
    this.terminalOutput.push('║   help            - Diese Hilfe anzeigen                     ║');
    this.terminalOutput.push('╚═══════════════════════════════════════════════════════════════╝');
  }

  private addToHistory(command: string) {
    if (this.commandHistory[this.commandHistory.length - 1] !== command) {
      this.commandHistory.push(command);
    }
    this.historyIndex = this.commandHistory.length;
  }

  public getPrompt(): string {
    return `${this.currentWorkingDirectory}> `;
  }

  private scrollToBottom(force: boolean = false) {
    if (!this.isUserScrolling || force) {
      setTimeout(() => {
        if (this.terminalScroll?.nativeElement) {
          const element = this.terminalScroll.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      }, 50);
    }
  }

  private setupScrollListener() {
    if (this.terminalScroll?.nativeElement) {
      const element = this.terminalScroll.nativeElement;

      element.addEventListener('scroll', () => {
        this.isUserScrolling = true;
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.isUserScrolling = false;
        }, 2000);

        const isAtBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 1;
        if (isAtBottom) {
          this.isUserScrolling = false;
        }
      });
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(1);
    }
  }

  private navigateHistory(direction: number) {
    const newIndex = this.historyIndex + direction;
    if (newIndex >= 0 && newIndex < this.commandHistory.length) {
      this.historyIndex = newIndex;
      this.currentCommand = this.commandHistory[this.historyIndex];
    } else if (newIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.currentCommand = '';
    }
  }

  clearTerminal() {
    this.terminalOutput = [];
  }

  public scrollToEnd() {
    this.scrollToBottom(true);
  }
}
