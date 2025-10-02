// app/index.tsx
import * as Font from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';

if (Platform.OS === 'android') {
  NavigationBar.setVisibilityAsync('hidden');
  NavigationBar.setBehaviorAsync('overlay-swipe');
  NavigationBar.setPositionAsync('absolute');
}

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, marginTop: 0 }}>
      {user ? (
        <HomeScreen />
      ) : (
        <LoginScreen />
      )}
    </View>
  );
};

const App: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Lato': require('./assets/fonts/Lato-Regular.ttf'),
        'Lato-Bold': require('./assets/fonts/Lato-Bold.ttf'),
        // Добавьте другие начертания Lato если нужно
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Или компонент загрузки
  }

  return (
    <AuthProvider>
      <UserProvider>
        <StatusBar hidden={true} />
        <AppContent />
      </UserProvider>
    </AuthProvider>
  );
};

export default App;