// app/screens/LoginScreen.tsx (обновленный)
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      Alert.alert('Ошибка', 'Неверный логин или пароль');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Логотип над карточкой - поднят выше */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logoton.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Белая карточка с содержимым - поднята выше */}
        <View style={styles.loginCard}>
          {/* Приветственный текст */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Добро пожаловать!</Text>
            <Text style={styles.welcomeSubtitle}>Войдите в свой Аккаунт</Text>
            <Text style={styles.welcomeText}>Введите свой логин и пароль</Text>
          </View>

          {/* Форма входа */}
          <View style={styles.formContainer}>
            {/* Поле логина */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Логин</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Введите ваш логин"
                placeholderTextColor="#9E9E9E"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Поле пароля */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Пароль</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Введите ваш пароль"
                placeholderTextColor="#9E9E9E"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Кнопка входа */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Вход...' : 'Войти'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B79ED',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start', // Изменено с center на flex-start
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: screenHeight * 0.15, // Увеличен отступ сверху
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 40,
    width: Math.min(screenWidth * 0.85, 400),
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B79ED',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
    paddingLeft: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#424242',
    backgroundColor: '#FAFAFA',
  },
  loginButton: {
    backgroundColor: '#6B79ED',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#6B79ED',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;