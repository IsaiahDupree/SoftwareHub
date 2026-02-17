# SoftwareHub Desktop Apps — Installation Guides

> Installation instructions for all SoftwareHub desktop applications.

---

## Table of Contents
- [Watermark Remover](#watermark-remover)
- [TTS Studio](#tts-studio)
- [General Troubleshooting](#general-troubleshooting)
- [License Activation](#license-activation)

---

## Watermark Remover

**Version:** 1.0.0+
**Platforms:** macOS 12+, Windows 10+, Linux (Ubuntu 20.04+)

### macOS

1. Download `Watermark-Remover-mac-arm64.dmg` (Apple Silicon) or `Watermark-Remover-mac-x64.dmg` (Intel)
2. Open the `.dmg` file
3. Drag **Watermark Remover** to your Applications folder
4. Launch the app from Applications or Spotlight

**First launch (Gatekeeper):**
If macOS says "App is from an unidentified developer":
- Right-click the app icon → **Open** → click **Open** in the dialog
- Or: System Settings → Privacy & Security → click **Open Anyway**

**Requires:**
- macOS 12 Monterey or later
- 8 GB RAM minimum (16 GB recommended for video processing)
- 2 GB free disk space

### Windows

1. Download `Watermark-Remover-Setup-1.0.0.exe`
2. Run the installer (you may see a SmartScreen warning — click **More info** → **Run anyway**)
3. Follow the installer wizard
4. Launch from Desktop shortcut or Start Menu

**Requires:**
- Windows 10 (1903) or later
- 8 GB RAM minimum
- 2 GB free disk space
- Visual C++ Redistributable 2019+ (included in installer)

### Linux

1. Download `Watermark-Remover-1.0.0.AppImage`
2. Make it executable:
   ```bash
   chmod +x Watermark-Remover-1.0.0.AppImage
   ```
3. Run:
   ```bash
   ./Watermark-Remover-1.0.0.AppImage
   ```

**Optional — install as system app:**
```bash
sudo mv Watermark-Remover-1.0.0.AppImage /opt/
sudo ln -s /opt/Watermark-Remover-1.0.0.AppImage /usr/local/bin/watermark-remover
```

**Requires:**
- Ubuntu 20.04+ / Debian 11+ / Fedora 35+
- FUSE 2 for AppImage: `sudo apt install fuse libfuse2`
- 8 GB RAM minimum

### Backend API Server

The Watermark Remover requires the Safari Automation API server running locally on port 7070.

**Start the server:**
```bash
# From the Safari Automation directory
node dist/index.js
```

The app will display a yellow banner if the API is offline.

---

## TTS Studio

**Version:** 1.0.0+
**Platforms:** macOS 12+, Windows 10+, Linux (Ubuntu 20.04+)

### macOS

1. Download `TTS-Studio-mac-arm64.dmg` (Apple Silicon) or `TTS-Studio-mac-x64.dmg` (Intel)
2. Open the `.dmg` file
3. Drag **TTS Studio** to your Applications folder
4. Launch the app from Applications or Spotlight

**First launch (Gatekeeper):**
Same process as Watermark Remover — right-click → Open if blocked.

**Requires:**
- macOS 12 Monterey or later
- Python 3.10+ (for the TTS backend server)
- 8 GB RAM minimum (16 GB for voice cloning)
- 1 GB free disk space + model storage (~2–5 GB)

### Windows

1. Download `TTS-Studio-Setup-1.0.0.exe`
2. Run the installer and follow the wizard
3. Launch from Desktop shortcut or Start Menu

**Requires:**
- Windows 10 (1903) or later
- Python 3.10+ installed and in PATH
- 8 GB RAM minimum
- 1 GB free disk space + model storage

### Linux

1. Download `TTS-Studio-1.0.0.AppImage`
2. Make executable and run:
   ```bash
   chmod +x TTS-Studio-1.0.0.AppImage
   ./TTS-Studio-1.0.0.AppImage
   ```

**Requires:**
- Ubuntu 20.04+ / Debian 11+
- Python 3.10+
- FUSE 2: `sudo apt install fuse libfuse2`

### TTS Python Backend Server

TTS Studio connects to a local Python server on port 7071.

**Install dependencies:**
```bash
cd /path/to/tts-server
pip install -r requirements.txt
```

**Start the server:**
```bash
python3 tts_server.py --port 7071
```

The app will display a warning banner if the server is offline.

**First-time model download:**
The TTS models (~2–5 GB) download automatically on first use. This may take several minutes depending on your internet connection.

---

## General Troubleshooting

### App won't open on macOS

Run this command in Terminal to remove the quarantine flag:
```bash
xattr -d com.apple.quarantine /Applications/YOUR-APP-NAME.app
```

### App crashes on startup

1. Check that you meet the minimum system requirements
2. Ensure sufficient disk space (at least 2 GB free)
3. On macOS, check Console.app for crash logs
4. On Windows, check Event Viewer → Windows Logs → Application
5. Contact support at [softwarehub.app/support](https://softwarehub.app/support) with the crash log

### API/Backend server won't start

- Ensure Node.js 18+ is installed: `node --version`
- Ensure Python 3.10+ is installed: `python3 --version`
- Check port conflicts: `lsof -i :7070` (Watermark Remover) or `lsof -i :7071` (TTS Studio)
- Kill conflicting processes: `kill -9 $(lsof -t -i:7070)`

### Auto-update failed

1. Check your internet connection
2. Manually download the latest version from your [SoftwareHub portal](https://softwarehub.app/app/downloads)
3. Install over the existing version

---

## License Activation

All SoftwareHub desktop apps require a license key on first launch.

### Getting your license key

1. Log in to [softwarehub.app](https://softwarehub.app/app/licenses)
2. Find your purchase under **My Licenses**
3. Copy the license key (format: `XXXX-XXXX-XXXX-XXXX`)

### Activating

1. Launch the app — the activation screen appears automatically
2. Paste or type your license key
3. Click **Activate License**
4. The app will validate and unlock within a few seconds

### Moving to a new computer

1. Open the app → Settings → **Deactivate**
2. Install the app on your new computer
3. Activate with the same license key

**Note:** Each license has a device limit (Personal: 1, Pro: 3, Team: 10). Contact support if you need to increase your device limit.

### Offline mode

Apps work offline for up to 7 days without an internet connection. After 7 days, connect to the internet to re-validate your license.

---

## Getting Help

- **Portal:** [softwarehub.app/app/licenses](https://softwarehub.app/app/licenses)
- **Support:** [softwarehub.app/support](https://softwarehub.app/support)
- **Docs:** [softwarehub.app/docs](https://softwarehub.app/docs)
