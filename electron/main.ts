import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';

let mainWindow: BrowserWindow;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        height: 800,
        width: 1200,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // IMMER Development-URL laden, nie lokale Dateien
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null as any;
    });
}

app.whenReady().then(createWindow);

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

// IPC Handler für CMD Befehle
ipcMain.handle('execute-command', async (event, command: string, workingDir: string) => {
    return new Promise((resolve, reject) => {
        const isWindows = os.platform() === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/bash';
        const args = isWindows ? ['/c', command] : ['-c', command];

        const childProcess = spawn(shell, args, {
            cwd: workingDir,
            env: process.env
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        childProcess.on('close', (code) => {
            resolve({
                output: stdout,
                error: stderr,
                exitCode: code
            });
        });

        childProcess.on('error', (error) => {
            reject({
                output: '',
                error: error.message,
                exitCode: -1
            });
        });
    });
});

// IPC Handler für aktuelles Arbeitsverzeichnis
ipcMain.handle('get-cwd', async () => {
    return process.cwd();
});

// IPC Handler für Verzeichnis wechseln
ipcMain.handle('change-directory', async (event, newDir: string) => {
    try {
        process.chdir(newDir);
        return { success: true, cwd: process.cwd() };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
});

// IPC Handler für Systeminfo
ipcMain.handle('get-system-info', async () => {
    return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        userInfo: os.userInfo(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length
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