echo "# 🖥️ ForgeRed Terminal

Eine moderne Terminal-Anwendung mit echten Systembefehlen, entwickelt mit Angular und Electron.

## ✨ Features

- 🔥 **Echte Systembefehle** - Keine Simulation, sondern echte CMD/Terminal-Integration
- 🖥️ **Cross-Platform** - Funktioniert auf Windows, Mac und Linux  
- 🎨 **Moderne UI** - Professionelles Design mit dunklem Theme
- ⚡ **Electron-powered** - Desktop-App mit nativen Fenster-Controls
- 📂 **Arbeitsverzeichnis-Management** - CD-Befehle funktionieren wirklich
- 🔄 **Befehlshistorie** - ↑/↓ Pfeiltasten für vorherige Befehle
- 🚀 **Schnellbefehle** - Kategorisierte Buttons für häufige Befehle
- 📊 **Live-Monitoring** - System-Stats im Footer

## 🛠️ Technologien

- **Frontend:** Angular 19 + TypeScript
- **Desktop:** Electron 37
- **Styling:** SCSS + CSS Grid/Flexbox
- **IPC:** Sichere Kommunikation zwischen Renderer und Main Process

## 🚀 Installation & Start

\`\`\`bash
# Repository klonen
git clone https://github.com/DEIN-USERNAME/ForgeRedTerminal.git
cd ForgeRedTerminal

# Dependencies installieren
npm install

# Development starten
npm run electron-dev
\`\`\`

## 📝 Verfügbare Befehle

### Navigation
- \`dir\` / \`ls\` - Verzeichnisinhalt anzeigen
- \`cd <pfad>\` - Verzeichnis wechseln
- \`pwd\` - Aktuellen Pfad anzeigen

### System
- \`systeminfo\` - Systeminformationen
- \`tasklist\` / \`ps\` - Laufende Prozesse
- \`ipconfig\` / \`ifconfig\` - Netzwerkkonfiguration

### Terminal
- \`help\` - Hilfe anzeigen
- \`clear\` / \`cls\` - Terminal leeren

## 📦 Build

\`\`\`bash
# Electron App builden
npm run build-electron

# Für Produktion
npm run electron
\`\`\`

## 🎯 Projektstruktur

\`\`\`
ForgeRedTerminal/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   ├── nav/
│   │   │   ├── terminal/
│   │   │   └── footer/
│   │   └── services/
│   │       └── electron.service.ts
├── electron/
│   ├── main.ts
│   └── preload.js
└── dist/
    └── electron/
\`\`\`

## 🤝 Contributing

Contributions sind willkommen! Bitte:
1. Fork das Repository
2. Erstelle einen Feature Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei

## 👨‍💻 Autor

Entwickelt mit ❤️ für die Developer-Community

---

⭐ **Star das Repository**, wenn es dir gefällt!" > README.md