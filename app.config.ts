import { ConfigContext, ExpoConfig } from 'expo/config';
import { MAP_URL } from './app/contexts/GlobalContext';

const getEnvConfig = () => {
  if (process.env.MY_ENVIRONMENT === 'akruchinin') {
    return {
      MAP_URL: 'https://192.168.88.193:8080',
      BACK_URL: 'https://192.168.88.193:8002'
    };
  } else if (process.env.MY_ENVIRONMENT === 'deploy') {
    return {
      MAP_URL: 'http://192.168.88.193:8080',
      BACK_URL: 'http://192.168.88.193:8100/api'
    };
  } else {
    return {
      MAP_URL: 'https://genshinlohs.ru:8080',
      BACK_URL: 'https://genshinlohs.ru:8002'
    }
  }
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const envConfig = getEnvConfig()

  return {
  ...config,
  name: 'hahaton-front',
  slug: 'hahaton-front',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'hahatonfront',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app uses your location to show it on the map.',
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'INTERNET',
    ],
    package: 'com.iadnrey77888.hahatonfront',
  },
  web: {
    display: 'standalone',
    barStyle: 'default',
    output: 'static',
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    [
      '@maplibre/maplibre-react-native',
      {
        mapLibreApiKey: 'YOUR_MAPLIBRE_API_KEY',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '0870cd35-ae98-45b3-9d64-fbb39803e718',
    },
    mapUrl: envConfig.MAP_URL,
    backUrl: envConfig.BACK_URL,
  },
  }
};

