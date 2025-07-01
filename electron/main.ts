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

// IPC Handler für CMD Befehle (mit Debugging)
ipcMain.handle('execute-command', async (event, command: string, workingDir: string) => {
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
            env: process.env
        });

        let stdout = '';
        let stderr = '';

        if (childProcess.stdout) {
            childProcess.stdout.on('data', (data: Buffer) => {
                console.log('📥 RAW BUFFER:', data);
                console.log('📥 RAW BYTES:', [...data]);

                let text = data.toString('utf8');
                console.log('📝 UTF-8 TEXT:', text);
                console.log('📝 TEXT CHARS:', [...text].map(c => `${c} (${c.charCodeAt(0)})`));

                if (isWindows) {
                    const originalText = text;
                    text = fixGermanChars(text);
                    console.log('🔄 BEFORE FIX:', originalText);
                    console.log('✅ AFTER FIX:', text);
                }

                stdout += text;
            });
        }

        if (childProcess.stderr) {
            childProcess.stderr.on('data', (data: Buffer) => {
                console.log('❌ STDERR:', data.toString('utf8'));
                stderr += data.toString('utf8');
            });
        }

        childProcess.on('close', (code) => {
            console.log('🏁 PROCESS CLOSED:', code);
            console.log('📤 FINAL STDOUT:', stdout);
            console.log('📤 FINAL STDERR:', stderr);

            resolve({
                output: stdout,
                error: stderr,
                exitCode: code
            });
        });

        childProcess.on('error', (error) => {
            console.log('💥 PROCESS ERROR:', error);
            reject({
                output: '',
                error: error.message,
                exitCode: -1
            });
        });
    });
});

// Hilfsfunktion mit Logging
function fixGermanChars(text: string): string {
    console.log('🔧 FIXING GERMAN CHARS IN:', text);

    const replacements: { [key: string]: string } = {
        'Datentr�ger': 'Datenträger',
        'Gr��e': 'Größe',
        'L�nge': 'Länge',
        'Verf�gbar': 'Verfügbar',
        '�': 'ä',
        '�': 'ö',
        '�': 'ü',
        '�': 'ß',
        '�': 'Ä',
        '�': 'Ö',
        '�': 'Ü'
    };

    let result = text;
    for (const [wrong, correct] of Object.entries(replacements)) {
        if (result.includes(wrong)) {
            console.log(`🔀 REPLACING: "${wrong}" → "${correct}"`);
            result = result.replace(new RegExp(wrong, 'g'), correct);
        }
    }

    console.log('✨ FINAL RESULT:', result);
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
ipcMain.handle('execute-powershell', async (event, command: string, workingDir: string) => {
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
            `[Console]::OutputEncoding = [Text.Encoding]::UTF8; ${command}`
        ];

        const childProcess = spawn('powershell.exe', powershellArgs, {
            cwd: workingDir,
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe']
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

// Weitere IPC Handler (unverändert)
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