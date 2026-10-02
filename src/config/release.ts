/**
 * Central Release Configuration for Pouse
 * Single source of truth for versions, download URLs, hashes, and platform parameters.
 * When bumping a release, update this single file.
 */
export const RELEASE_CONFIG = {
  APP_NAME: 'Pouse',
  TAGLINE: 'One phone. Multiple ways to control your PC.',
  SUBTITLE: 'Turns an Android phone into a multi-mode wireless input device for a Windows 10/11 PC.',
  VERSION: '1.0.0',
  RELEASE_DATE: '2026-10-02',
  CANONICAL_URL: 'https://pouse.app',
  GITHUB_REPO: 'https://github.com/Anikett-2310/Pouse',
  GITHUB_RELEASE_URL: 'https://github.com/Anikett-2310/Pouse/releases/tag/v1.0.0',

  WINDOWS: {
    FILENAME: 'Pouse-Setup-v1.0.0.exe',
    SIZE_BYTES: 2963169,
    SIZE_FORMATTED: '2.83 MB',
    // Exact SHA-256 matching companion Pouse-Setup-v1.0.0.exe.sha256 asset
    SHA256: '5baa43f7b90f451a19ba1d1e54edb763a66337d64e7b25dc627340d1dad6b70d',
    DOWNLOAD_URL: 'https://github.com/Anikett-2310/Pouse/releases/download/v1.0.0/Pouse-Setup-v1.0.0.exe',
    SHA256_URL: 'https://github.com/Anikett-2310/Pouse/releases/download/v1.0.0/Pouse-Setup-v1.0.0.exe.sha256',
    TARGET_OS: 'Windows 10 / 11 (64-bit)',
    DEFAULT_INSTALL_PATH: '%LOCALAPPDATA%\\Programs\\Pouse',
    PORT: 8081,
    SIGNED: false,
  },

  ANDROID: {
    APP_ID: 'com.pouse.app',
    FILENAME: 'app-release.apk',
    /**
     * Final public hosting URL for the production-signed APK.
     * Leave empty string when pending; UI renders "Coming soon / link pending" state.
     */
    ANDROID_APK_URL: 'https://github.com/Anikett-2310/Pouse/releases/download/v1.0.0/app-release.apk',
    DISTRIBUTION_METHOD: 'Direct APK download',
    GOOGLE_PLAY_STATUS: 'Not on Google Play (direct APK only)',
  },

  CLI: {
    PACKAGE_NAME: 'pouse-cli',
    NPM_URL: 'https://www.npmjs.com/package/pouse-cli',
    COMMAND: 'pouse',
    NODE_MIN_VERSION: '22.0.0',
    LATEST_TAG: 'latest',
  },

  PROTOCOL: {
    DEFAULT_WIFI_PORT: 8081,
    RFCOMM_SERVICE_UUID: '7f9b841a-3e2c-4a90-8b1b-5e6f8a9c0d1e',
  },

  NAV_LINKS: [
    { label: 'Modes', href: '/modes' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Security', href: '/security' },
    { label: 'CLI', href: '/cli' },
    { label: 'FAQ', href: '/faq' },
  ],
} as const;
