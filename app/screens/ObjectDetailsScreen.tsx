// app/screens/ObjectDetailsScreen.tsx (обновленный с сворачиваемыми разделами)
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AcceptDeliveryModal from '../components/AcceptDeliveryModal';
import CreateViolationModal from '../components/CreateViolationModal';
import DeliveryHistoryCard from '../components/DeliveryHistoryCard';
import TTNPhotoModal from '../components/TTNPhotoModal';
import ViolationNoteCard from '../components/ViolationNoteCard';
import WarehouseCard from '../components/WarehouseCard';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';
import { ApiComment, ApiJobShift, ApiObjectDetails, ApiUser, DeliveryHistoryItem, ObjectDetails, PolygonPoint, Violation, WarehouseMaterial } from '../types';
import MobileMapComponent from '../components/MobileMapComponent';

interface ObjectDetailsScreenProps {
  visible: boolean;
  onClose: () => void;
  objectData: ObjectDetails | null;
}

const mockWarehouseMaterials: WarehouseMaterial[] = [
  {
    id: '1',
    name: 'Бетон',
    balance: 15.2,
    used: 32,
    total: 47.2,
    unit: 'тонн',
    history: [
      {
        id: '1',
        date: '18 августа 2025',
        workDescription: 'Установка спортивного детского комплекса 1 категории в рамках благоустройства территории',
        usedAmount: 0.5,
        deliveryAmount: 2
      },
      {
        id: '2',
        date: '20 августа 2025',
        workDescription: 'Установка спортивного детского комплекса 1 категории в рамках благоустройства территории',
        usedAmount: 0.5,
        deliveryAmount: 2
      }
    ]
  },
  {
    id: '2',
    name: 'Асфальт 8',
    balance: 5,
    used: 5,
    total: 10,
    unit: 'тонн',
    history: []
  }
];

const mockDeliveryHistory: DeliveryHistoryItem[] = [
  {
    id: '1',
    date: '18 августа 2025',
    invoiceNumber: '2131142',
    supplierCompany: 'Название компании поставщика',
    materials: [
      {
        name: 'Материал №1',
        quantity: '10 тонн',
        serialNumber: 'Серийник',
        document: 'Фото №1.jpg'
      },
      {
        name: 'Материал №2', 
        quantity: '5 единиц',
        serialNumber: 'SN12345'
      }
    ],
    packagingCondition: 'Целая',
    comment: 'Все в хорошем состоянии'
  }
];

const ObjectDetailsScreen: React.FC<ObjectDetailsScreenProps> = ({ visible, onClose, objectData }) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [activeSection, setActiveSection] = useState('object');
  const [sectionPositions, setSectionPositions] = useState<{[key: string]: number}>({});
  const [createViolationModalVisible, setCreateViolationModalVisible] = useState(false);
  const [apiDetails, setApiDetails] = useState<ApiObjectDetails | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistoryItem[]>(mockDeliveryHistory || []);
  const [ttnPhotoModalVisible, setTtnPhotoModalVisible] = useState(false);
  const [acceptDeliveryModalVisible, setAcceptDeliveryModalVisible] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // Состояния для сворачивания разделов - ТОЛЬКО для deliveryHistory
  const [expandedSections, setExpandedSections] = useState({
    deliveryHistory: true
  });
  
  const { getThemeColor, userRole } = useUser();
  const { token } = useAuth();
  const themeColor = getThemeColor();
  
  const scrollViewRef = useRef<ScrollView>(null);

  const toggleSection = (section: 'deliveryHistory') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const transformCommentsToViolations = useCallback((comments: ApiComment[]): Violation[] => {
    return comments.map(comment => {
      const isViolation = comment.rec_type === 1;
      const authorName = comment.author 
        ? `${comment.author.surname} ${comment.author.name}`
        : 'Неизвестно';
      
      return {
        id: comment.id.toString(),
        category: isViolation ? 'Нарушение' : 'Замечание',
        type: isViolation ? 'Нарушение' : 'Замечание',
        subType: 'Общее',
        deadline: comment.fix_time ? `Исправить за ${comment.fix_time} дней` : 'Срок не указан',
        comment: comment.comment,
        dateRecorded: new Date(comment.created_at).toLocaleDateString('ru-RU'),
        requiresStop: isViolation,
        issuedBy: authorName,
        presenceOf: 'Не указано',
        stage: { number: '1', description: 'Общий этап' },
        isViolation
      };
    });
  }, []);

  const transformUsersToInspectors = useCallback((users: ApiUser[]) => {
    return users.map(user => {
      let position = 'Инспектор';
      if (user.role === 1) position = 'Прораб';
      else if (user.role === 2) position = 'Госконтроль';
      
      return {
        id: user.id.toString(),
        name: `${user.surname} ${user.name}`,
        position
      };
    });
  }, []);

  const transformActiveJobsToStages = useCallback((activeJobs: any[]) => {
    if (!activeJobs || activeJobs.length === 0) {
      return [{ number: '1', description: 'Нет активных работ' }];
    }
    
    return activeJobs.map((job, index) => ({
      number: (job.seq || job.stage_seq || (index + 1)).toString(),
      description: job.name || `Работа ${index + 1}`
    }));
  }, []);

  const transformJobShiftsToProposedChanges = useCallback((jobshifts: ApiJobShift[]) => {
    if (!jobshifts || jobshifts.length === 0) {
      return "Изменений нет";
    }
    
    return jobshifts.map(shift => 
      `Сдвиг с ${new Date(shift.old_start_date).toLocaleDateString('ru-RU')} на ${new Date(shift.new_start_date).toLocaleDateString('ru-RU')}. Комментарий: ${shift.comment}`
    ).join('\n\n');
  }, []);

  const formatWorkSchedule = useCallback((startDate: string, activeJobs: any[]) => {
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    if (!activeJobs || activeJobs.length === 0) {
      return `Начало работ: ${start}`;
    }
    
    const endDates = activeJobs.map(job => new Date(job.end_date));
    const maxEndDate = new Date(Math.max(...endDates.map(date => date.getTime())));
    
    return `Период работ: с ${start} по ${maxEndDate.toLocaleDateString('ru-RU')}`;
  }, []);

  const handleAcceptViolation = useCallback((violationId: string) => {
    console.log('Принято исправление нарушения:', violationId);
  }, []);

  const handleCreateNewNote = useCallback(() => {
    setCreateViolationModalVisible(true);
  }, []);

  const handleCloseWorkDay = useCallback(() => {
    console.log('Закрыть рабочий день');
  }, []);

  const handleCreateViolation = useCallback((violationData: any) => {
    console.log('Создано новое замечание:', violationData);
    setCreateViolationModalVisible(false);
    
    const newViolation: Violation = {
      id: String(violations.length + 1),
      category: violationData.category,
      type: violationData.violationType,
      subType: violationData.subType,
      deadline: violationData.deadline,
      comment: violationData.description,
      dateRecorded: new Date().toLocaleDateString('ru-RU'),
      requiresStop: violationData.requiresStop,
      issuedBy: 'Текущий пользователь',
      presenceOf: violationData.presenceOf,
      stage: { 
        number: violationData.stage.split(' - ')[0], 
        description: violationData.stage.split(' - ')[1] || violationData.stage 
      },
      isViolation: true
    };
    
    setViolations(prev => [newViolation, ...prev]);
  }, [violations.length]);

  const handleCloseCreateViolationModal = useCallback(() => {
    setCreateViolationModalVisible(false);
  }, []);

  const handleOpenCameraForTTN = useCallback(() => {
    setTtnPhotoModalVisible(true);
  }, []);

  const handleTTNPhotoTaken = useCallback((photoUri: string) => {
    setCapturedPhoto(photoUri);
    setTtnPhotoModalVisible(false);
    setAcceptDeliveryModalVisible(true);
  }, []);

  const handleCloseTTNPhotoModal = useCallback(() => {
    setTtnPhotoModalVisible(false);
  }, []);

  const handleAcceptDeliverySubmit = useCallback((deliveryData: any) => {
    console.log('Принята поставка:', deliveryData);
    setAcceptDeliveryModalVisible(false);
    setCapturedPhoto(null);
    
    const newDelivery: DeliveryHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ru-RU'),
      invoiceNumber: deliveryData.invoiceNumber,
      supplierCompany: deliveryData.supplierCompany,
      materials: deliveryData.materials || [],
      packagingCondition: deliveryData.packagingCondition,
      comment: deliveryData.comment
    };
    
    setDeliveryHistory(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [newDelivery, ...prevArray];
    });
  }, []);

  const handleCloseAcceptDeliveryModal = useCallback(() => {
    setAcceptDeliveryModalVisible(false);
    setCapturedPhoto(null);
  }, []);

  const handleSectionLayout = (sectionName: string, event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions(prev => ({
      ...prev,
      [sectionName]: y
    }));
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    
    const position = sectionPositions[section];
    if (position !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: position - 20,
        animated: true
      });
    }
  };

  const fetchObjectDetails = useCallback(async (objectId: string) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const objectDetails = await apiService.getObjectDetails(token, objectId);
      console.log('Object details received:', objectDetails);
      setApiDetails(objectDetails);
      
      if (objectDetails.comments) {
        const apiViolations = transformCommentsToViolations(objectDetails.comments);
        setViolations(apiViolations);
      }
    } catch (error) {
      console.error('Error fetching object details:', error);
    } finally {
      setLoading(false);
    }
  }, [token, transformCommentsToViolations]);

  React.useEffect(() => {
    if (visible && objectData) {
      setSectionPositions({});
      fetchObjectDetails(objectData.id);
    } else {
      setViolations([]);
      setActiveSection('object');
      setCreateViolationModalVisible(false);
      setApiDetails(null);
      setTtnPhotoModalVisible(false);
      setAcceptDeliveryModalVisible(false);
      setCapturedPhoto(null);
      setDeliveryHistory(mockDeliveryHistory || []);
      // Сбрасываем состояния сворачивания при закрытии
      setExpandedSections({
        deliveryHistory: true
      });
    }
  }, [visible, objectData, fetchObjectDetails]);

  if (!objectData) return null;

  const isContractor = userRole === 'Подрядчик';

  const displayData = {
    ...objectData,
    inspectors: apiDetails ? transformUsersToInspectors(apiDetails.users) : objectData.inspectors,
    stages: apiDetails ? transformActiveJobsToStages(apiDetails.active_jobs) : objectData.stages,
    workSchedule: apiDetails ? formatWorkSchedule(apiDetails.start_date, apiDetails.active_jobs) : objectData.workSchedule,
    proposedChanges: apiDetails ? transformJobShiftsToProposedChanges(apiDetails.jobshifts) : objectData.proposedChanges,
    notesCount: apiDetails?.notes_count || objectData.notesCount,
    warnsCount: apiDetails?.warns_count || objectData.warnsCount,
  };

  const renderDeliveryHistory = Array.isArray(deliveryHistory) ? deliveryHistory : [];

  const polygons = (apiDetails: ApiObjectDetails) => {
    console.log("coordinates: " + apiDetails.coordinates)
    return apiDetails.coordinates
  }

    function transformedCoordinates(object: ApiObjectDetails){
        return [object.geo_data.latitude || 0, object.geo_data.longitude || 0];
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
          <View style={styles.headerContent}>
            <View style={styles.statusAddressRow}>
              <View style={[styles.statusIndicator, { backgroundColor: objectData.statusColor }]}>
                <Text style={styles.statusText}>{objectData.status}</Text>
              </View>
              <View style={styles.coordinatesContainer}>
                <Ionicons name="location-outline" size={16} color="#757575" />
                <Text style={styles.coordinates}>
                  {apiDetails?.geo_data 
                    ? `${apiDetails.geo_data.latitude.toFixed(6)}, ${apiDetails.geo_data.longitude.toFixed(6)}`
                    : objectData.id
                  }
                </Text>
              </View>
            </View>
            <Text style={styles.addressText}>
              {apiDetails?.sitename || objectData.address}
            </Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загрузка данных...</Text>
          </View>
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
        >
          <View 
            onLayout={(e) => handleSectionLayout('object', e)}
            style={styles.section}
          >
            <View style={styles.mapContainer}>
              {apiDetails?.coordinates ? (
                /* <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={48} color={themeColor} />
                  <Text style={styles.mapCoordinates}>
                    Координаты: {apiDetails.geo_data.latitude.toFixed(6)}, {apiDetails.geo_data.longitude.toFixed(6)}
                  </Text> 
                </View>*/
                <MobileMapComponent zoom={14} polygons={polygons(apiDetails)} points={[transformedCoordinates(apiDetails)]} cameraCenter={transformedCoordinates(apiDetails)}></MobileMapComponent>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={48} color="#757575" />
                  <Text style={styles.mapPlaceholderText}>Карта объекта</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>Ответственный прораб</Text>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: themeColor }]}>
                  <Text style={styles.editButtonText}>Изменить</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionValue}>
                {apiDetails?.foreman_name || objectData.responsible.split(': ')[1]}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Акт открытия работ</Text>
              <Text style={styles.sectionValue}>
                {apiDetails ? `Начало работ: ${new Date(apiDetails.start_date).toLocaleDateString('ru-RU')}` : "Акт №12345 от 01.12.2023"}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>Инспекторы объекта</Text>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: themeColor }]}>
                  <Text style={styles.editButtonText}>Изменить</Text>
                </TouchableOpacity>
              </View>
              {displayData.inspectors.map((inspector) => (
                <View key={inspector.id} style={styles.inspectorItem}>
                  <Text style={styles.inspectorName}>{inspector.name}</Text>
                  <Text style={styles.inspectorPosition}>{inspector.position}</Text>
                </View>
              ))}

              {isContractor && (
                <View style={styles.contractorButtons}>
                  <TouchableOpacity 
                    style={[styles.contractorButton, { backgroundColor: themeColor }]}
                    onPress={handleOpenCameraForTTN}
                  >
                    <Text style={styles.contractorButtonText}>Принять поставку</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.contractorButton, { backgroundColor: themeColor }]}
                    onPress={handleCloseWorkDay}
                  >
                    <Text style={styles.contractorButtonText}>Закрыть рабочий день</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View 
            onLayout={(e) => handleSectionLayout('violations', e)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Нарушения и замечания</Text>
                {apiDetails && (
                  <View style={styles.violationsCountBadge}>
                    <Text style={styles.violationsCountText}>
                      {apiDetails.warns_count} наруш. / {apiDetails.notes_count} замечаний
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {!isContractor && (
              <TouchableOpacity 
                style={styles.createNoteButton} 
                onPress={handleCreateNewNote}
              >
                <Ionicons name="add-circle-outline" size={20} color={themeColor} />
                <Text style={[styles.createNoteButtonText, { color: themeColor }]}>
                  Создать новое {userRole === 'ИКО' ? 'нарушение' : 'замечание'}
                </Text>
              </TouchableOpacity>
            )}
            
            {violations.length > 0 ? (
              violations.map((violation) => (
                <View key={violation.id} style={styles.violationCardContainer}>
                  <ViolationNoteCard
                    violation={violation}
                    onAccept={handleAcceptViolation}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.noViolationsText}>Нарушений и замечаний нет</Text>
            )}
          </View>

          <View 
            onLayout={(e) => handleSectionLayout('schedule', e)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>График работ</Text>
            </View>
            
            <View style={styles.scheduleContent}>
              <Text style={styles.sectionValue}>{displayData.workSchedule}</Text>

              <View style={styles.subSection}>
                <Text style={styles.sectionSubtitle}>Предложенные изменения графика</Text>
                <Text style={styles.sectionValue}>{displayData.proposedChanges}</Text>
              </View>

              {apiDetails?.active_jobs && apiDetails.active_jobs.length > 0 && (
                <View style={styles.subSection}>
                  <Text style={styles.sectionSubtitle}>Активные работы</Text>
                  {apiDetails.active_jobs.map((job, index) => (
                    <View key={job.id || index} style={styles.jobItem}>
                      <Text style={styles.jobName}>{job.name}</Text>
                      <Text style={styles.jobDetails}>
                        {job.start_date && `Начало: ${new Date(job.start_date).toLocaleDateString('ru-RU')}`}
                        {job.end_date && ` Окончание: ${new Date(job.end_date).toLocaleDateString('ru-RU')}`}
                        {job.volume && ` Объем: ${job.volume} ${job.measurement || 'ед.'}`}
                      </Text>
                      {job.description && (
                        <Text style={styles.jobDescription}>{job.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View 
            onLayout={(e) => handleSectionLayout('warehouse', e)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Склад</Text>
            </View>
            
            {mockWarehouseMaterials.map((material) => (
              <WarehouseCard
                key={material.id}
                material={material}
              />
            ))}
          </View>

          {isContractor && (
            <View 
              onLayout={(e) => handleSectionLayout('deliveryHistory', e)}
              style={styles.section}
            >
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => toggleSection('deliveryHistory')}
              >
                <Text style={styles.sectionTitle}>История поставок</Text>
                <Text style={styles.expandIcon}>{expandedSections.deliveryHistory ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {expandedSections.deliveryHistory && (
                renderDeliveryHistory.length > 0 ? (
                  renderDeliveryHistory.map((delivery) => (
                    <DeliveryHistoryCard
                      key={delivery.id}
                      delivery={delivery}
                    />
                  ))
                ) : (
                  <View style={styles.emptyDeliveryHistory}>
                    <Ionicons name="cube-outline" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyDeliveryHistoryText}>
                      История поставок пуста
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={[styles.navButton, activeSection === 'object' && styles.navButtonActive]}
            onPress={() => scrollToSection('object')}
          >
            <Ionicons 
              name="business-outline" 
              size={20} 
              color={activeSection === 'object' ? themeColor : '#757575'} 
            />
            <Text style={[styles.navText, activeSection === 'object' && { color: themeColor }]}>
              Объект
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navButton, activeSection === 'violations' && styles.navButtonActive]}
            onPress={() => scrollToSection('violations')}
          >
            <Ionicons 
              name="warning-outline" 
              size={20} 
              color={activeSection === 'violations' ? themeColor : '#757575'} 
            />
            <Text style={[styles.navText, activeSection === 'violations' && { color: themeColor }]}>
              Нарушения
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navButton, activeSection === 'schedule' && styles.navButtonActive]}
            onPress={() => scrollToSection('schedule')}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={activeSection === 'schedule' ? themeColor : '#757575'} 
            />
            <Text style={[styles.navText, activeSection === 'schedule' && { color: themeColor }]}>
              График
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navButton, activeSection === 'warehouse' && styles.navButtonActive]}
            onPress={() => scrollToSection('warehouse')}
          >
            <Ionicons 
              name="archive-outline" 
              size={20} 
              color={activeSection === 'warehouse' ? themeColor : '#757575'} 
            />
            <Text style={[styles.navText, activeSection === 'warehouse' && { color: themeColor }]}>
              Склад
            </Text>
          </TouchableOpacity>

          {isContractor && (
            <TouchableOpacity 
              style={[styles.navButton, activeSection === 'deliveryHistory' && styles.navButtonActive]}
              onPress={() => scrollToSection('deliveryHistory')}
            >
              <Ionicons 
                name="cube-outline" 
                size={20} 
                color={activeSection === 'deliveryHistory' ? themeColor : '#757575'} 
              />
              <Text style={[styles.navText, activeSection === 'deliveryHistory' && { color: themeColor }]}>
                Поставки
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <CreateViolationModal
          visible={createViolationModalVisible}
          onClose={handleCloseCreateViolationModal}
          onCreate={handleCreateViolation}
          stages={displayData.stages}
          siteId={parseInt(objectData?.id || '0')} // Преобразуем string id в number
          geoData={apiDetails?.geo_data}
        />

        <TTNPhotoModal
          visible={ttnPhotoModalVisible}
          onClose={handleCloseTTNPhotoModal}
          onPhotoTaken={handleTTNPhotoTaken}
        />

        <AcceptDeliveryModal
          visible={acceptDeliveryModalVisible}
          onClose={handleCloseAcceptDeliveryModal}
          onSubmit={handleAcceptDeliverySubmit}
          photoUri={capturedPhoto}
        />
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  statusAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinates: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
  },
  loadingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
  },
  mapCoordinates: {
    marginTop: 8,
    fontSize: 12,
    color: '#424242',
    textAlign: 'center',
  },
  viewOnMapButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewOnMapText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12, // Уменьшено с 24 до 12
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginRight: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  violationsCountBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  violationsCountText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 16,
    color: '#757575',
    fontWeight: 'bold',
  },
  subSection: {
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  sectionValue: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  inspectorItem: {
    marginBottom: 8,
  },
  inspectorName: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  inspectorPosition: {
    fontSize: 12,
    color: '#757575',
  },
  contractorButtons: {
    marginTop: 16,
    gap: 12,
  },
  contractorButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contractorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  createNoteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  violationCardContainer: {
    marginBottom: 12,
  },
  noViolationsText: {
    textAlign: 'center',
    color: '#757575',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  scheduleContent: {
    marginTop: 8,
  },
  jobItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  jobName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  jobDetails: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  jobDescription: {
    fontSize: 12,
    color: '#424242',
    fontStyle: 'italic',
  },
  emptyDeliveryHistory: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyDeliveryHistoryText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 90,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonActive: {
    backgroundColor: '#F0F2FF',
  },
  navText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default ObjectDetailsScreen;