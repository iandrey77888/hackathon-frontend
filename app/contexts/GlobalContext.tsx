import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const MAP_URL = Constants.expoConfig?.extra?.mapUrl;

// Для веб-версии используем локальный API прокси, для мобильных - прямой URL
export const BACK_URL = Constants.expoConfig?.extra?.backUrl;