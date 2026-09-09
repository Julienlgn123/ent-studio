import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.entstudio.app',
  appName: 'ENT Studio',
  webDir: 'out/mobile',
  plugins: {
    // Route fetch()/XHR through native HTTP instead of the WebView's engine:
    // an ENT's ICS endpoint has no reason to send CORS headers for a mobile
    // app's origin, so a plain WebView fetch would be blocked. Native HTTP
    // has no such restriction.
    CapacitorHttp: {
      enabled: true
    }
  }
}

export default config
