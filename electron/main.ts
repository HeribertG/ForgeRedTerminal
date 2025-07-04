import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Icon-Pfad bestimmen
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.png')
    : path.join(__dirname, '../../assets/icon.png');

  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: iconPath,
    title: 'ForgeRed Terminal',
    backgroundColor: '#1e1e1e',
    show: false, // Erst zeigen wenn geladen
  });

  // Zeige Fenster wenn bereit
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Production vs Development
  if (app.isPackaged) {
    // Production: Lade die gebaute Angular App
    // KORRIGIERTER PFAD: Die Angular App liegt in dist/forge-red-terminal
    const indexPath = path.join(
      __dirname,
      '../dist/forge-red-terminal/index.html'
    );

    console.log('Loading index from:', indexPath);
    console.log('__dirname:', __dirname);
    console.log('app.getAppPath():', app.getAppPath());

    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err);

      // Fallback: Versuche andere mögliche Pfade
      const fallbackPaths = [
        path.join(
          process.resourcesPath,
          'app',
          'dist',
          'forge-red-terminal',
          'index.html'
        ),
        path.join(app.getAppPath(), 'dist', 'forge-red-terminal', 'index.html'),
        path.join(__dirname, 'forge-red-terminal', 'index.html'),
      ];

      console.log('Trying fallback paths...');
      tryLoadFallbacks(fallbackPaths);
    });

    // DevTools nur auf Anfrage öffnen
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow.webContents.toggleDevTools();
      }
    });
  } else {
    // Development: Lade vom Dev-Server
    mainWindow.loadURL('http://localhost:4200').catch((err) => {
      console.error('Failed to load dev server:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// Hilfsfunktion für Fallback-Pfade
function tryLoadFallbacks(paths: string[]): void {
  if (paths.length === 0) {
    console.error('No more fallback paths to try');
    return;
  }

  const currentPath = paths.shift()!;
  console.log('Trying path:', currentPath);

  mainWindow.loadFile(currentPath).catch((err) => {
    console.error(`Failed to load ${currentPath}:`, err);
    tryLoadFallbacks(paths);
  });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Wenn eine zweite Instanz gestartet wird, fokussiere das existierende Fenster
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handler für CMD Befehle (mit Debugging)
ipcMain.handle(
  'execute-command',
  async (event, command: string, workingDir: string) => {
    console.log('🚀 ELECTRON: Executing command:', command);

    return new Promise((resolve, reject) => {
      const isWindows = os.platform() === 'win32';

      let finalCommand = command;
      let shell: string;
      let args: string[];

      if (isWindows) {
        finalCommand = mapCommandToPowerShell(command);
        shell = 'powershell.exe';
        args = ['-Command', finalCommand];
        console.log('🖥️ WINDOWS: Using PowerShell with command:', finalCommand);
      } else {
        shell = '/bin/bash';
        args = ['-c', command];
        console.log('🐧 UNIX: Using bash with command:', command);
      }

      const childProcess = spawn(shell, args, {
        cwd: workingDir,
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data: Buffer) => {
          let text = data.toString('utf8');

          if (isWindows) {
            text = fixGermanChars(text);
          }

          stdout += text;
        });
      }

      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString('utf8');
        });
      }

      childProcess.on('close', (code) => {
        resolve({
          output: stdout,
          error: stderr,
          exitCode: code,
        });
      });

      childProcess.on('error', (error) => {
        reject({
          output: '',
          error: error.message,
          exitCode: -1,
        });
      });
    });
  }
);

// Hilfsfunktion für deutsche Zeichen - vereinfachte Version
function fixGermanChars(text: string): string {
  // Ersetze bekannte fehlerhafte Patterns
  let result = text
    .replace(/Datentr�ger/g, 'Datenträger')
    .replace(/Gr��e/g, 'Größe')
    .replace(/L�nge/g, 'Länge')
    .replace(/Verf�gbar/g, 'Verfügbar');

  return result;
}

function mapCommandToPowerShell(command: string): string {
  const cmd = command.toLowerCase().trim();

  switch (cmd) {
    case 'dir':
      return 'Get-ChildItem | Format-Table Name, Mode, LastWriteTime, @{Name="Length";Expression={if($_.Length){$_.Length}else{"<DIR>"}}} -AutoSize';
    case 'systeminfo':
      return 'Get-ComputerInfo | Format-List';
    case 'tasklist':
      return 'Get-Process | Format-Table Name, Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}} -AutoSize';
    case 'ipconfig':
      return 'Get-NetIPConfiguration | Format-List';
    case 'date':
      return 'Get-Date';
    default:
      // Für unbekannte Befehle versuche CMD mit UTF-8
      return `cmd /c "chcp 65001 >nul & ${command}"`;
  }
}

// Alternative PowerShell-Implementation (für bessere Unicode-Unterstützung)
ipcMain.handle(
  'execute-powershell',
  async (event, command: string, workingDir: string) => {
    return new Promise((resolve, reject) => {
      const isWindows = os.platform() === 'win32';

      if (!isWindows) {
        reject(new Error('PowerShell nur auf Windows verfügbar'));
        return;
      }

      // PowerShell mit expliziter UTF-8 Ausgabe
      const powershellArgs = [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `[Console]::OutputEncoding = [Text.Encoding]::UTF8; ${command}`,
      ];

      const childProcess = spawn('powershell.exe', powershellArgs, {
        cwd: workingDir,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data: Buffer) => {
          const text = data.toString('utf8');
          stdout += text;
        });
      }

      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data: Buffer) => {
          const text = data.toString('utf8');
          stderr += text;
        });
      }

      childProcess.on('close', (code) => {
        resolve({
          output: stdout,
          error: stderr,
          exitCode: code,
        });
      });

      childProcess.on('error', (error) => {
        reject({
          output: '',
          error: error.message,
          exitCode: -1,
        });
      });
    });
  }
);

// Weitere IPC Handler
ipcMain.handle('get-cwd', async () => {
  return process.cwd();
});

ipcMain.handle('change-directory', async (event, newDir: string) => {
  try {
    process.chdir(newDir);
    return { success: true, cwd: process.cwd() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-system-info', async () => {
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    userInfo: os.userInfo(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
  };
});

// Window-Control Handler
ipcMain.handle('window-minimize', async () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', async () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', async () => {
  return mainWindow?.isMaximized() || false;
});

// Error Handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
