// app/components/AcceptDeliveryModal.tsx
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

interface MaterialFile {
  uri: string;
  name: string;
  type: 'document' | 'photo';
}

interface Material {
  name: string;
  quantity: string;
  serialNumber?: string;
  file?: MaterialFile;
  isExpanded: boolean;
  selectedMaterialId?: number; // ID выбранного материала из базы
  suggestedMaterials?: SuggestedMaterial[]; // Предложенные материалы от OCR
  ocrRecognizedName?: string; // Распознанное имя из OCR
}

interface SuggestedMaterial {
  id: number;
  name: string;
  properties: string;
  measurement: string;
}

interface OcrMaterialData {
  seq: number;
  name: string;
  id: number;
  volume: string;
  suggested_materials: SuggestedMaterial[];
}

interface OcrData {
  doc_serial: string;
  supplier_name: string;
  materials: OcrMaterialData[];
}

interface AcceptDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (deliveryData: any) => void;
  photoUri: string | null;
  ocrData?: OcrData | null;
  availableMaterials?: SuggestedMaterial[];
  shipmentId?: number | null;
}

const AcceptDeliveryModal: React.FC<AcceptDeliveryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  photoUri,
  ocrData,
  availableMaterials,
  shipmentId
}) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierCompany, setSupplierCompany] = useState('');
  const [materials, setMaterials] = useState<Material[]>([
    { name: '', quantity: '', serialNumber: '', isExpanded: true }
  ]);
  const [packagingCondition, setPackagingCondition] = useState('Целая');
  const [productionTech, setProductionTech] = useState('');
  const [comment, setComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Автозаполнение формы из OCR данных
  React.useEffect(() => {
    if (ocrData && visible) {
      console.log('=== Auto-filling form with OCR data ===');
      console.log('OCR data:', JSON.stringify(ocrData, null, 2));

      // Заполняем основные поля
      setInvoiceNumber(ocrData.doc_serial || '');
      setSupplierCompany(ocrData.supplier_name || '');

      // Заполняем материалы из OCR
      if (ocrData.materials && ocrData.materials.length > 0) {
        const ocrMaterials: Material[] = ocrData.materials.map((ocrMat) => ({
          name: ocrMat.name || '',
          quantity: ocrMat.volume || '',
          serialNumber: '',
          isExpanded: true,
          suggestedMaterials: ocrMat.suggested_materials || [],
          ocrRecognizedName: ocrMat.name,
          // Если есть только один предложенный материал, автоматически выбираем его
          selectedMaterialId: ocrMat.suggested_materials?.length === 1
            ? ocrMat.suggested_materials[0].id
            : undefined
        }));
        setMaterials(ocrMaterials);
        console.log('Materials auto-filled:', ocrMaterials.length);
      }
    } else if (!ocrData && visible && availableMaterials && availableMaterials.length > 0) {
      // Если OCR не сработал, но есть доступные материалы, инициализируем форму с ними
      console.log('=== No OCR data, but availableMaterials present ===');
      setMaterials([{
        name: '',
        quantity: '',
        serialNumber: '',
        isExpanded: true,
        suggestedMaterials: availableMaterials
      }]);
    }
  }, [ocrData, visible, availableMaterials]);

  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        name: '',
        quantity: '',
        serialNumber: '',
        isExpanded: true,
        suggestedMaterials: availableMaterials || [] // Добавляем доступные материалы для выбора
      }
    ]);
  };

  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setMaterials(updatedMaterials);
  };

  const selectMaterialFromList = (index: number, materialId: number) => {
    const selectedMat = availableMaterials?.find(m => m.id === materialId);
    if (selectedMat) {
      const updatedMaterials = [...materials];
      updatedMaterials[index] = {
        ...updatedMaterials[index],
        selectedMaterialId: materialId,
        name: `${selectedMat.name} ${selectedMat.properties}`.trim()
      };
      setMaterials(updatedMaterials);
    }
  };

  const toggleMaterialExpanded = (index: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { 
      ...updatedMaterials[index], 
      isExpanded: !updatedMaterials[index].isExpanded 
    };
    setMaterials(updatedMaterials);
  };

  const removeMaterial = (index: number) => {
    if (materials.length > 1) {
      const updatedMaterials = materials.filter((_, i) => i !== index);
      setMaterials(updatedMaterials);
    }
  };

  const handleAddFile = async (materialIndex: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      // Новая версия expo-document-picker использует canceled вместо type
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const updatedMaterials = [...materials];
        updatedMaterials[materialIndex] = { 
          ...updatedMaterials[materialIndex], 
          file: {
            uri: file.uri,
            name: file.name || 'document',
            type: 'document'
          }
        };
        setMaterials(updatedMaterials);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  const handleTakePhoto = async (materialIndex: number) => {
    try {
      // Запрашиваем разрешения на камеру
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

      // Новая версия expo-image-picker также использует canceled
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        const updatedMaterials = [...materials];
        updatedMaterials[materialIndex] = { 
          ...updatedMaterials[materialIndex], 
          file: {
            uri: photo.uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'photo'
          }
        };
        setMaterials(updatedMaterials);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const removeFile = (materialIndex: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials[materialIndex] = { 
      ...updatedMaterials[materialIndex], 
      file: undefined
    };
    setMaterials(updatedMaterials);
  };

  const handleSubmit = (isAccepted: boolean) => {
    if (isRejecting && !comment.trim()) {
      Alert.alert('Ошибка', 'Для отказа в принятии необходимо указать комментарий');
      return;
    }

    if (!shipmentId) {
      Alert.alert('Ошибка', 'Отсутствует ID поставки');
      return;
    }

    // Формируем данные в формате API /shipment/update
    const shipmentData = {
      shipment_id: shipmentId,
      doc_serial: invoiceNumber,
      supplier_name: supplierCompany,
      package_state: packagingCondition,
      production_tech: productionTech,
      materials: materials
        .filter(m => m.name && m.quantity)
        .map((m, index) => ({
          seq: index,
          type_id: m.selectedMaterialId?.toString() || '',
          volume: parseFloat(m.quantity) || 0,
          serial: m.serialNumber || '',
          files: [] // TODO: добавить загрузку файлов
        }))
    };

    console.log('=== Submitting shipment data ===');
    console.log('Shipment data:', JSON.stringify(shipmentData, null, 2));

    onSubmit({
      ...shipmentData,
      isAccepted,
      comment: isAccepted ? comment : `ОТКАЗ: ${comment}`,
      status: isAccepted ? 'accepted' : 'rejected'
    });

    // Сброс формы
    setInvoiceNumber('');
    setSupplierCompany('');
    setMaterials([{ name: '', quantity: '', serialNumber: '', isExpanded: true }]);
    setPackagingCondition('Целая');
    setProductionTech('');
    setComment('');
    setIsRejecting(false);
  };

  const handleReject = () => {
    setIsRejecting(true);
  };

  const handleCancelReject = () => {
    setIsRejecting(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Прием поставки</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          {/* Фото ТТН */}
          {photoUri && (
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Фото ТТН</Text>
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photo} />
                <Text style={styles.photoLabel}>ТТН документация</Text>
              </View>
            </View>
          )}

          {/* Основные поля */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Основные поля</Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Номер накладной *</Text>
              <TextInput
                style={styles.textInput}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="Введите номер накладной"
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Название компании поставщика *</Text>
              <TextInput
                style={styles.textInput}
                value={supplierCompany}
                onChangeText={setSupplierCompany}
                placeholder="Введите название компании"
              />
            </View>
          </View>

          {/* Материалы */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Материалы</Text>
              <TouchableOpacity 
                style={[styles.addMaterialButton, { backgroundColor: themeColor }]}
                onPress={addMaterial}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addMaterialButtonText}>Добавить материал</Text>
              </TouchableOpacity>
            </View>
            
            {materials.map((material, index) => (
              <View key={index} style={styles.materialCard}>
                <TouchableOpacity 
                  style={styles.materialHeader}
                  onPress={() => toggleMaterialExpanded(index)}
                >
                  <Text style={styles.materialTitle}>Материал №{index + 1}</Text>
                  <Ionicons 
                    name={material.isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#757575" 
                  />
                </TouchableOpacity>
                
                {material.isExpanded && (
                  <View style={styles.materialFields}>
                    {/* Информация OCR и выбор материала */}
                    {material.ocrRecognizedName && (
                      <View style={styles.ocrInfo}>
                        <Ionicons name="scan" size={16} color="#4CAF50" />
                        <Text style={styles.ocrLabel}>Распознано: {material.ocrRecognizedName}</Text>
                      </View>
                    )}

                    {/* Предложенные материалы от OCR */}
                    {material.suggestedMaterials && material.suggestedMaterials.length > 0 && (
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Предложенные материалы</Text>
                        <View style={styles.suggestedMaterialsList}>
                          {material.suggestedMaterials.map((sugMat) => (
                            <TouchableOpacity
                              key={sugMat.id}
                              style={[
                                styles.suggestedMaterialItem,
                                material.selectedMaterialId === sugMat.id && {
                                  borderColor: themeColor,
                                  backgroundColor: `${themeColor}15`
                                }
                              ]}
                              onPress={() => selectMaterialFromList(index, sugMat.id)}
                            >
                              <View style={styles.suggestedMaterialContent}>
                                <Text style={styles.suggestedMaterialName}>
                                  {sugMat.name}
                                </Text>
                                <Text style={styles.suggestedMaterialProps}>
                                  {sugMat.properties} • {sugMat.measurement}
                                </Text>
                              </View>
                              {material.selectedMaterialId === sugMat.id && (
                                <Ionicons name="checkmark-circle" size={20} color={themeColor} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Выбор из полного списка материалов */}
                    {availableMaterials && availableMaterials.length > 0 && (
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>
                          {material.suggestedMaterials && material.suggestedMaterials.length > 0
                            ? 'Или выберите из списка материалов'
                            : 'Выберите материал из списка'}
                        </Text>
                        <ScrollView
                          style={styles.allMaterialsList}
                          nestedScrollEnabled={true}
                        >
                          {availableMaterials.map((avMat) => (
                            <TouchableOpacity
                              key={avMat.id}
                              style={[
                                styles.materialListItem,
                                material.selectedMaterialId === avMat.id && {
                                  borderColor: themeColor,
                                  backgroundColor: `${themeColor}10`
                                }
                              ]}
                              onPress={() => selectMaterialFromList(index, avMat.id)}
                            >
                              <View style={styles.materialListContent}>
                                <Text style={styles.materialListName}>{avMat.name}</Text>
                                <Text style={styles.materialListProps}>
                                  {avMat.properties} • {avMat.measurement}
                                </Text>
                              </View>
                              {material.selectedMaterialId === avMat.id && (
                                <Ionicons name="checkmark-circle" size={18} color={themeColor} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Название *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={material.name}
                        onChangeText={(value) => updateMaterial(index, 'name', value)}
                        placeholder="Введите название материала"
                      />
                    </View>
                    
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Количество *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={material.quantity}
                        onChangeText={(value) => updateMaterial(index, 'quantity', value)}
                        placeholder="Введите количество"
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Серийный номер</Text>
                      <TextInput
                        style={styles.textInput}
                        value={material.serialNumber}
                        onChangeText={(value) => updateMaterial(index, 'serialNumber', value)}
                        placeholder="Введите серийный номер"
                      />
                    </View>
                    
                    {/* Файлы и фото */}
                    <View style={styles.fileSection}>
                      <Text style={styles.fieldLabel}>Прикрепленный файл</Text>
                      
                      {material.file && (
                        <View style={styles.fileItem}>
                          <Ionicons 
                            name={material.file.type === 'document' ? "document-attach" : "image"} 
                            size={16} 
                            color={themeColor} 
                          />
                          <Text style={styles.fileName}>{material.file.name}</Text>
                          <TouchableOpacity 
                            style={styles.removeFileButton}
                            onPress={() => removeFile(index)}
                          >
                            <Ionicons name="close" size={16} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      <View style={styles.fileButtons}>
                        <TouchableOpacity 
                          style={[styles.fileButton, { borderColor: themeColor }]}
                          onPress={() => handleAddFile(index)}
                        >
                          <Ionicons name="document-attach-outline" size={16} color={themeColor} />
                          <Text style={[styles.fileButtonText, { color: themeColor }]}>
                            Прикрепить документ
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.fileButton, { borderColor: themeColor }]}
                          onPress={() => handleTakePhoto(index)}
                        >
                          <Ionicons name="camera-outline" size={16} color={themeColor} />
                          <Text style={[styles.fileButtonText, { color: themeColor }]}>
                            Сделать фото
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {materials.length > 1 && (
                      <TouchableOpacity 
                        style={styles.removeMaterialButton}
                        onPress={() => removeMaterial(index)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#F44336" />
                        <Text style={styles.removeMaterialText}>Удалить материал</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Дополнительные поля */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Дополнительные поля</Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Состояние упаковки</Text>
              <View style={styles.radioGroup}>
                {['Целая', 'Повреждена', 'Отсутствует'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={styles.radioOption}
                    onPress={() => setPackagingCondition(condition)}
                  >
                    <View style={[styles.radioCircle, packagingCondition === condition && { backgroundColor: themeColor }]}>
                      {packagingCondition === condition && <View style={styles.radioInnerCircle} />}
                    </View>
                    <Text style={styles.radioText}>{condition}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Технология производства</Text>
              <TextInput
                style={styles.textInput}
                value={productionTech}
                onChangeText={setProductionTech}
                placeholder="Введите технологию производства"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Комментарий {isRejecting && '*'}
                {isRejecting && <Text style={styles.requiredStar}> *</Text>}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
                placeholder={isRejecting ? "Обязательно укажите причину отказа..." : "Введите комментарий..."}
              />
              {isRejecting && (
                <Text style={styles.requiredText}>
                  Для отказа в принятии поставки необходимо указать комментарий
                </Text>
              )}
            </View>
          </View>

          {/* Кнопки действий */}
          <View style={styles.actions}>
            {!isRejecting ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={handleReject}
                >
                  <Text style={styles.rejectButtonText}>Отказать в принятии</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: themeColor }]}
                  onPress={() => handleSubmit(true)}
                >
                  <Text style={styles.acceptButtonText}>Принять поставку</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelReject}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.confirmRejectButton]}
                  onPress={() => handleSubmit(false)}
                >
                  <Text style={styles.confirmRejectText}>Подтвердить отказ</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

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
  photoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#F44336',
  },
  requiredText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#424242',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addMaterialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addMaterialButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  materialCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
  },
  materialFields: {
    gap: 12,
  },
  fileSection: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: '#424242',
    marginLeft: 8,
  },
  removeFileButton: {
    padding: 4,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  fileButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  removeMaterialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginTop: 8,
  },
  removeMaterialText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rejectButtonText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmRejectButton: {
    backgroundColor: '#F44336',
  },
  confirmRejectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  ocrInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  ocrLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },
  suggestedMaterialsList: {
    gap: 8,
  },
  suggestedMaterialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestedMaterialContent: {
    flex: 1,
    marginRight: 8,
  },
  suggestedMaterialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 2,
  },
  suggestedMaterialProps: {
    fontSize: 12,
    color: '#757575',
  },
  allMaterialsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  materialListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  materialListContent: {
    flex: 1,
    marginRight: 8,
  },
  materialListName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 2,
  },
  materialListProps: {
    fontSize: 11,
    color: '#757575',
  },
});

export default AcceptDeliveryModal;