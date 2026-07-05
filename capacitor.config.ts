import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campora.app',
  appName: 'Campora',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
