POUSE MEDIA DIRECTORY
======================================================================
Drop your real screenshots and video recordings into this folder (public/media/).
The Pouse website will automatically detect them at build time, wrap them in clean CSS device frames, and display them on the appropriate pages with zero code changes.

If a file is missing, a clean, labeled placeholder will be shown instead.
Never fabricate fake UI or mock screenshots.

STANDARD FILE NAMES AND SPECIFICATIONS
======================================================================
1. touchpad-mode.webp
   - Description: Android Touchpad mode showing the 85% touch surface and 15% scroll zone divider.
   - Device: Android smartphone (portrait).
   - Recommended Size: 1080x2400 (or phone native resolution). Aspect ratio ~9:19.5 or 9:16.
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: / (Homepage), /modes

2. motion-mode.webp
   - Description: Android Motion mode showing the center trigger hold button and steering indicators.
   - Device: Android smartphone (portrait).
   - Recommended Size: 1080x2400. Aspect ratio ~9:19.5 or 9:16.
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: /modes

3. touchless-mode.webp
   - Description: Android Touchless mode showing front camera preview with MediaPipe hand landmark skeleton overlay.
   - Device: Android smartphone (portrait).
   - Recommended Size: 1080x2400. Aspect ratio ~9:19.5 or 9:16.
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: /modes

4. gaming-mode.webp
   - Description: Android Virtual Gamepad interface with virtual analog stick, D-pad, and action buttons.
   - Device: Android smartphone (landscape).
   - Recommended Size: 2400x1080 (landscape). Aspect ratio 16:9 or 20:9.
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: /modes

5. remote-screen.webp (or remote-screen-demo.mp4 / remote-screen-demo.webm)
   - Description: Remote Screen streaming Windows desktop to Android phone at up to 60 FPS with touch interaction.
   - Device: Android smartphone (landscape or portrait).
   - Recommended Size: 1920x1080 or phone native. For video: <= 8 seconds, <= 5 MB, H.264/WebM, muted.
   - Formats: WebP, AVIF, PNG, MP4, WebM.
   - Appears on: /modes

6. utilities-dock.webp
   - Description: Expanded utility dock showing quick PC controls (volume, brightness, Task View, soft keyboard).
   - Device: Android smartphone (portrait).
   - Recommended Size: 1080x2400. Aspect ratio ~9:19.5 or 9:16.
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: / (Homepage), /modes

7. connect-qr.webp
   - Description: Pairing flow showing the phone scanning the QR code or PC displaying the QR code / local IP.
   - Device: Android smartphone or Windows desktop.
   - Recommended Size: 1080x1920 (portrait) or 1920x1080 (desktop).
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: /download/android, /download/windows

8. bluetooth-discovery.webp
   - Description: Bluetooth pairing screen and Trust-On-First-Use (TOFU) authorization dialog.
   - Device: Android smartphone (portrait).
   - Recommended Size: 1080x2400. Aspect ratio ~9:19.5 or 9:16.
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: /download/android

9. pc-tray-menu.webp
   - Description: Windows system tray context menu showing "Pouse PC Client v1.0.0", IP address, and status.
   - Device: Windows 10/11 PC.
   - Recommended Size: 1920x1080 (or window crop 800x600 / 1200x800).
   - Formats: WebP, AVIF, PNG, JPG.
   - Appears on: /download/windows

10. pc-preferences.webp
    - Description: Windows Preferences dialog showing auto-start, custom port, and Wi-Fi password settings.
    - Device: Windows 10/11 PC.
    - Recommended Size: 800x600 or 1200x800. Aspect ratio 4:3 or 16:9.
    - Formats: WebP, AVIF, PNG, JPG.
    - Appears on: /download/windows

11. hero-phone.webp (optional)
    - Description: Clean hero screenshot of the phone running Pouse for hero showcase.
    - Device: Android smartphone (portrait).
    - Recommended Size: 1080x2400. Aspect ratio ~9:19.5 or 9:16.
    - Formats: WebP, AVIF, PNG, JPG.
    - Appears on: / (Homepage Hero)

FILE SIZE & PERFORMANCE GUIDELINES
======================================================================
- Keep still screenshots under 500 KB (recommended 100 KB - 300 KB).
- The build process will automatically warn if any file exceeds 500 KB.
- Videos must be <= 8 seconds, muted, and under 5 MB.
