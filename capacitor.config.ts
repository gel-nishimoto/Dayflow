import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'ws07_cs',
  webDir: 'www',
  server: {
    // WebView origin becomes https://localhost (must be in backend/cors.php allow-list).
    androidScheme: 'https'
  }
};

export default config;
