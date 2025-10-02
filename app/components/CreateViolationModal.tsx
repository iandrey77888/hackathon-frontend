// app/components/CreateViolationModal.tsx (исправленная версия)
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';

interface CreateViolationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (violationData: any) => void;
  stages: { number: string; description: string }[];
  siteId: number;
  geoData?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

interface AttachedFile {
  uri: string;
  name: string;
  type: 'document' | 'photo';
}

const CreateViolationModal: React.FC<CreateViolationModalProps> = ({
  visible,
  onClose,
  onCreate,
  stages,
  siteId,
  geoData
}) => {
  const { getThemeColor, userRole } = useUser();
  const { user, token } = useAuth();
  const themeColor = getThemeColor();

  // Автоматически определяем тип на основе роли пользователя
  const isViolation = userRole === 'ИКО'; // ИКО - нарушения, ОСК - замечания
  const modalTitle = isViolation ? 'Создание нарушения' : 'Создание замечания';
  const typeLabel = isViolation ? 'нарушение' : 'замечание';

  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState('');
  const [category, setCategory] = useState('Технология производства');
  const [violationType, setViolationType] = useState('Устранимое');
  const [subType, setSubType] = useState('Простое');
  const [deadline, setDeadline] = useState('7'); // дней по умолчанию
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [requiresStop, setRequiresStop] = useState<boolean>(false);
  const [presenceOf, setPresenceOf] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Состояния для выпадающих списков
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  // Списки опций
  const categories = [
    'Технология производства',
    'Охрана труда',
    'Экология',
    'Пожарная безопасность'
  ];

  // Преобразуем deadline в формат ISO (добавляем дни к текущей дате)
  const formatDeadlineToISO = (days: string): string => {
    const daysNum = parseInt(days) || 7;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + daysNum);
    return deadlineDate.toISOString();
  };

  const handleAddDocument = () => {
    if (newDocument.trim()) {
      setDocuments([...documents, newDocument.trim()]);
      setNewDocument('');
    }
  };

  const handleAddFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newFile: AttachedFile = {
          uri: file.uri,
          name: file.name || 'document',
          type: 'document'
        };
        setAttachedFiles([...attachedFiles, newFile]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на использование камеры');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        const newFile: AttachedFile = {
          uri: photo.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'photo'
        };
        setAttachedFiles([...attachedFiles, newFile]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(updatedFiles);
  };

  const handleCreateViolation = async () => {
    if (!description.trim()) {
      Alert.alert('Ошибка', `Введите описание ${typeLabel}`);
      return;
    }

    if (!token) {
      Alert.alert('Ошибка', 'Токен авторизации отсутствует');
      return;
    }

    try {
      setLoading(true);

      // ВАЖНО: Исправляем координаты - убедимся, что latitude и longitude не перепутаны
      const correctedGeoData = {
        accuracy: geoData?.accuracy || 0,
        latitude: geoData?.longitude || 0,  // ШИРОТА
        longitude: geoData?.latitude || 0,// ДОЛГОТА
      };

      console.log('Geo Data:', {
        original: geoData,
        corrected: correctedGeoData
      });

      // Формируем данные для API
      const violationData = {
        user_id: user?.id || 0,
        site_id: siteId,
        comment: description,
        fix_time: formatDeadlineToISO(deadline),
        docs: attachedFiles.map(file => file.name).join(', '),
        geo: correctedGeoData,
        stop_type: requiresStop ? 1 : 0,
        comm_type: isViolation ? 1 : 0, // 0 - замечание, 1 - нарушение
        witness: presenceOf
      };//job_id: 0

      console.log('Sending violation data to API:', violationData);

      // Отправляем на бэкенд
      const result = await apiService.createViolation(token, violationData);
      console.log('API Response:', result);

      // Вызываем callback для обновления UI
      onCreate({
        description,
        documents,
        category,
        violationType,
        subType,
        deadline,
        attachedFiles,
        requiresStop,
        presenceOf,
        stage: selectedStage,
        isViolation
      });

      // Сброс формы
      resetForm();
      
      Alert.alert('Успех', `${modalTitle} успешно создано`);
    } catch (error: any) {
      console.error('Error creating violation:', error);
      Alert.alert('Ошибка', `Не удалось создать ${typeLabel}: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setDocuments([]);
    setAttachedFiles([]);
    setRequiresStop(false);
    setPresenceOf('');
    setSelectedStage('');
    setDeadline('7');
    setShowCategoryDropdown(false);
    setShowStageDropdown(false);
  };

  const getFileIcon = (type: 'document' | 'photo') => {
    return type === 'document' ? "document-attach-outline" : "image-outline";
  };

  const handleSelectCategory = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryDropdown(false);
  };

  const handleSelectStage = (stageNumber: string, stageDescription: string) => {
    setSelectedStage(`${stageNumber} - ${stageDescription}`);
    setShowStageDropdown(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Шапка */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{modalTitle}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          {/* Информация о типе */}
          <View style={styles.typeInfo}>
            <Ionicons name="information-circle-outline" size={16} color={themeColor} />
            <Text style={[styles.typeInfoText, { color: themeColor }]}>
              Создается {typeLabel} ({userRole})
            </Text>
          </View>

          {/* Отладочная информация о координатах */}
          {/* {geoData && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Координаты объекта: {geoData.latitude.toFixed(6)}, {geoData.longitude.toFixed(6)}
              </Text>
            </View>
          )} */}

          {/* Описание */}
          <View style={styles.section}>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder={`Введите описание ${typeLabel}...`}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.divider} />

          {/* Нарушенные нормативные документы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Нарушенные нормативные документы</Text>
            <Text style={styles.documentExample}>
              1. П. 6.52. СП82.13330.217 «Благоустройство территории»
            </Text>
            
            <View style={styles.addDocumentContainer}>
              <TextInput
                style={styles.documentInput}
                placeholder="Введите название документа"
                value={newDocument}
                onChangeText={setNewDocument}
              />
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: themeColor }]}
                onPress={handleAddDocument}
              >
                <Text style={styles.addButtonText}>Добавить документ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Категория, Вид, Тип */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Классификация</Text>
            
            {/* Категория - выпадающий список */}
            <View style={styles.dropdownSection}>
              <Text style={styles.dropdownLabel}>Категория</Text>
              <TouchableOpacity 
                style={styles.dropdownSelector}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={styles.dropdownText}>{category}</Text>
                <Ionicons 
                  name={showCategoryDropdown ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={16} 
                  color="#757575" 
                />
              </TouchableOpacity>
              
              {showCategoryDropdown && (
                <View style={styles.dropdownList}>
                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        category === cat && { backgroundColor: `${themeColor}20` }
                      ]}
                      onPress={() => handleSelectCategory(cat)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        category === cat && { color: themeColor, fontWeight: '500' }
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Вид - RadioGroup */}
            <View style={styles.radioSection}>
              <Text style={styles.radioLabel}>Вид</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => setViolationType('Устранимое')}
                >
                  <View style={[styles.radioCircle, violationType === 'Устранимое' && { backgroundColor: themeColor }]}>
                    {violationType === 'Устранимое' && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={styles.radioText}>Устранимое</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => setViolationType('Неустранимое')}
                >
                  <View style={[styles.radioCircle, violationType === 'Неустранимое' && { backgroundColor: themeColor }]}>
                    {violationType === 'Неустранимое' && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={styles.radioText}>Неустранимое</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Тип - RadioGroup */}
            <View style={styles.radioSection}>
              <Text style={styles.radioLabel}>Тип</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => setSubType('Простое')}
                >
                  <View style={[styles.radioCircle, subType === 'Простое' && { backgroundColor: themeColor }]}>
                    {subType === 'Простое' && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={styles.radioText}>Простое</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => setSubType('Грубое')}
                >
                  <View style={[styles.radioCircle, subType === 'Грубое' && { backgroundColor: themeColor }]}>
                    {subType === 'Грубое' && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={styles.radioText}>Грубое</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Срок устранения */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Срок устранения (дней)</Text>
            <TextInput
              style={styles.dateInput}
              value={deadline}
              onChangeText={setDeadline}
              keyboardType="numeric"
              placeholder="Введите количество дней"
            />
          </View>

          <View style={styles.divider} />

          {/* Примечание и файлы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Примечание (приложенные файлы)</Text>
            
            {attachedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons name={getFileIcon(file.type)} size={16} color={themeColor} />
                <Text style={styles.fileName}>{file.name}</Text>
                <TouchableOpacity 
                  style={styles.removeFileButton}
                  onPress={() => removeFile(index)}
                >
                  <Ionicons name="close" size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.fileButtons}>
              <TouchableOpacity 
                style={[styles.fileButton, { borderColor: themeColor }]}
                onPress={handleAddFile}
              >
                <Ionicons name="document-attach-outline" size={16} color={themeColor} />
                <Text style={[styles.fileButtonText, { color: themeColor }]}>Добавить файл</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fileButton, { borderColor: themeColor }]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={16} color={themeColor} />
                <Text style={[styles.fileButtonText, { color: themeColor }]}>Сделать фото</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Остановочное */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Остановочное</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setRequiresStop(true)}
              >
                <View style={[styles.radioCircle, requiresStop && { backgroundColor: themeColor }]}>
                  {requiresStop && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioText}>Да</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setRequiresStop(false)}
              >
                <View style={[styles.radioCircle, !requiresStop && { backgroundColor: themeColor }]}>
                  {!requiresStop && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioText}>Нет</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Выдано в присутствии */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выдано в присутствии</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Введите фамилию, имя, отчество присутствующего"
              value={presenceOf}
              onChangeText={setPresenceOf}
            />
          </View>

          <View style={styles.divider} />

          {/* Этап работ - выпадающий список */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Этап работ</Text>
            <TouchableOpacity 
              style={styles.dropdownSelector}
              onPress={() => setShowStageDropdown(!showStageDropdown)}
            >
              <Text style={styles.dropdownText}>
                {selectedStage || 'Выберите этап...'}
              </Text>
              <Ionicons 
                name={showStageDropdown ? "chevron-up-outline" : "chevron-down-outline"} 
                size={16} 
                color="#757575" 
              />
            </TouchableOpacity>
            
            {showStageDropdown && (
              <View style={styles.dropdownList}>
                {stages.map((stage, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectStage(stage.number, stage.description)}
                  >
                    <Text style={styles.dropdownItemText}>
                      {stage.number} - {stage.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Кнопка создания */}
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: themeColor }]}
            onPress={handleCreateViolation}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.createButtonText}>Создание...</Text>
            ) : (
              <Text style={styles.createButtonText}>Создать {typeLabel}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
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
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F8FF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  typeInfoText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  debugInfo: {
    padding: 8,
    marginHorizontal: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
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
  documentExample: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 12,
    lineHeight: 20,
  },
  addDocumentContainer: {
    marginTop: 8,
  },
  documentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // Стили для выпадающих списков
  dropdownSection: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#424242',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#424242',
  },
  // Стили для RadioGroup
  radioSection: {
    marginBottom: 16,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  radioText: {
    fontSize: 14,
    color: '#424242',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#424242',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
  },
  removeFileButton: {
    padding: 4,
  },
  fileButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  fileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#424242',
  },
  createButton: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default CreateViolationModal;