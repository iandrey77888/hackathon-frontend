// app/components/FixCommentModal.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Violation } from '../types';

interface FixCommentModalProps {
  visible: boolean;
  onClose: () => void;
  violation: Violation | null;
  onSubmit: (fixData: {
    comment_id: number;
    comment: string;
    geo: {
      accuracy: number;
      longitude: number;
      latitude: number;
    };
    file_ids: number[];
  }) => void;
}

const FixCommentModal: React.FC<FixCommentModalProps> = ({
  visible,
  onClose,
  violation,
  onSubmit
}) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  const [fixDescription, setFixDescription] = useState('');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      getUserLocation();
    }
  }, [visible]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на доступ к геолокации');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Ошибка', 'Не удалось получить местоположение');
    }
  };

  const handleSubmit = () => {
    if (!fixDescription.trim()) {
      Alert.alert('Ошибка', 'Введите описание исправления');
      return;
    }

    if (!userLocation) {
      Alert.alert('Ошибка', 'Не удалось определить ваше местоположение');
      return;
    }

    if (!violation) {
      Alert.alert('Ошибка', 'Нарушение не найдено');
      return;
    }

    const fixData = {
      comment_id: parseInt(violation.id),
      comment: fixDescription,
      geo: {
        accuracy: userLocation.accuracy,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude
      },
      file_ids: [] // Будет использоваться позже для работы с файлами
    };

    console.log('=== FixCommentModal: Preparing to submit fix ===');
    console.log('Violation ID (original):', violation.id);
    console.log('Comment ID (parsed):', parseInt(violation.id));
    console.log('Fix description:', fixDescription);
    console.log('User location:', userLocation);
    console.log('Complete fixData object:', JSON.stringify(fixData, null, 2));
    console.log('=== End FixCommentModal data ===');

    onSubmit(fixData);

    // Сбрасываем форму
    setFixDescription('');
  };

  const handleClose = () => {
    setFixDescription('');
    onClose();
  };

  if (!violation) return null;

  const isStopViolation = violation.requiresStop;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Шапка */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Исправление</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          <View style={styles.content}>
            {/* Замечание/Нарушение */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {violation.isViolation ? 'Нарушение' : 'Замечание'}
              </Text>
              <Text style={[
                styles.descriptionText,
                isStopViolation && styles.descriptionTextDanger
              ]}>
                {violation.comment}
              </Text>
            </View>

            {/* Категория, Вид, Тип */}
            <View style={styles.section}>
              <View style={styles.typeRow}>
                <View style={styles.typeColumn}>
                  <Text style={styles.fieldLabel}>Категория</Text>
                  <Text style={styles.fieldValue}>{violation.category}</Text>
                </View>
                <View style={styles.typeColumn}>
                  <Text style={styles.fieldLabel}>Вид</Text>
                  <Text style={styles.fieldValue}>{violation.type}</Text>
                </View>
                <View style={styles.typeColumn}>
                  <Text style={styles.fieldLabel}>Тип</Text>
                  <Text style={styles.fieldValue}>{violation.subType}</Text>
                </View>
              </View>
            </View>

            {/* Срок устранения */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Срок устранения</Text>
              <Text style={[
                styles.fieldValue,
                isStopViolation && styles.deadlineValueDanger
              ]}>
                {violation.deadline}
              </Text>
            </View>

            {/* Примечание (приложенные файлы) */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Примечание (приложенные файлы)</Text>
              <TouchableOpacity style={styles.attachmentLink}>
                <Text style={styles.attachmentLinkText}>Фото №1.jpg</Text>
                <Ionicons name="open-outline" size={16} color="#6B79ED" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Дата и Остановочное */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.fieldLabel}>Дата</Text>
                  <Text style={styles.fieldValue}>{violation.dateRecorded}</Text>
                </View>
                <View style={styles.infoColumnRight}>
                  <Text style={styles.fieldLabel}>Остановочное</Text>
                  <Text style={[
                    styles.fieldValue,
                    isStopViolation && styles.stopValueDanger
                  ]}>
                    {violation.requiresStop ? 'Да' : 'Нет'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Выдано и В присутствии */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.fieldLabel}>Выдано</Text>
                  <Text style={styles.fieldValue}>{violation.issuedBy}</Text>
                </View>
                <View style={styles.infoColumnRight}>
                  <Text style={styles.fieldLabel}>В присутствии</Text>
                  <Text style={styles.fieldValue}>{violation.presenceOf}</Text>
                </View>
              </View>
            </View>

            {/* Этап работ */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Этап работ</Text>
              <View style={styles.stageValueContainer}>
                <View style={[styles.stageCircle, { backgroundColor: themeColor }]}>
                  <Text style={styles.stageNumber}>{violation.stage.number}</Text>
                </View>
                <Text style={styles.stageDescription}>{violation.stage.description}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Исправление */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Исправление</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Введите описание исправления..."
                value={fixDescription}
                onChangeText={setFixDescription}
              />
            </View>

            {/* Примечание (приложенные файлы) - будет позже */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Примечание (приложенные файлы)</Text>
              <TouchableOpacity style={styles.addFileButton}>
                <Ionicons name="add-circle-outline" size={20} color={themeColor} />
                <Text style={[styles.addFileText, { color: themeColor }]}>Добавить файл</Text>
              </TouchableOpacity>
            </View>

            {/* Кнопка отправки */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#FF7A00' }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Отправить</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  descriptionTextDanger: {
    color: '#D32F2F',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#757575',
  },
  deadlineValueDanger: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  attachmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attachmentLinkText: {
    fontSize: 14,
    color: '#6B79ED',
    marginRight: 4,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  infoColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stopValueDanger: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  stageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stageDescription: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#424242',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addFileText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default FixCommentModal;
