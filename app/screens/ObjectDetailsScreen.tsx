// app/screens/ObjectDetailsScreen.tsx (обновленный с сворачиваемыми разделами)
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AcceptDeliveryModal from '../components/AcceptDeliveryModal';
import CommentDetailsModal from '../components/CommentDetailsModal';
import CreateViolationModal from '../components/CreateViolationModal';
import DeliveryHistoryCard from '../components/DeliveryHistoryCard';
import FixCommentModal from '../components/FixCommentModal';
import MapComponent from '../components/MapComponent';
import ProcessFixModal from '../components/ProcessFixModal';
import ProposeScheduleChangeModal from '../components/ProposeScheduleChangeModal';
import StageDetailsModal, { StageDetails } from '../components/StageDetailsModal';
import TTNPhotoModal from '../components/TTNPhotoModal';
import ViolationNoteCard from '../components/ViolationNoteCard';
import WarehouseCard from '../components/WarehouseCard';
import WorkScheduleCard from '../components/WorkScheduleCard';
import WorkStageSelectionModal from '../components/WorkStageSelectionModal';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';
import { ApiComment, ApiJobShift, ApiObjectDetails, ApiUser, DeliveryHistoryItem, ObjectDetails, Violation, WarehouseMaterial } from '../types';
import { isUserOnSite } from '../utils/locationUtils';

interface ObjectDetailsScreenProps {
  visible: boolean;
  onClose: () => void;
  objectData: ObjectDetails | null;
  userLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
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


const ObjectDetailsScreen: React.FC<ObjectDetailsScreenProps> = ({ visible, onClose, objectData, userLocation }) => {
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
  const [proposeScheduleChangeModalVisible, setProposeScheduleChangeModalVisible] = useState(false);
  const [commentDetailsModalVisible, setCommentDetailsModalVisible] = useState(false);
  const [fixCommentModalVisible, setFixCommentModalVisible] = useState(false);
  const [processFixModalVisible, setProcessFixModalVisible] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [showFixSuccessAlert, setShowFixSuccessAlert] = useState(false);
  const [fixedCommentId, setFixedCommentId] = useState<string | null>(null);

  // Состояния для нового flow приема поставки с OCR
  const [workStageSelectionModalVisible, setWorkStageSelectionModalVisible] = useState(false);
  const [selectedWorkStageId, setSelectedWorkStageId] = useState<number | null>(null);
  const [currentShipmentId, setCurrentShipmentId] = useState<number | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Состояния для сворачивания разделов
  const [expandedSections, setExpandedSections] = useState({
    deliveryHistory: true,
    activeWorks: true
  });

  // Состояния для модального окна подробностей этапа
  const [stageDetailsModalVisible, setStageDetailsModalVisible] = useState(false);
  const [selectedStageDetails, setSelectedStageDetails] = useState<StageDetails | null>(null);
  const [loadingStageDetails, setLoadingStageDetails] = useState(false);

  const getViolationMarkers = useCallback((comments: ApiComment[]) => {
  if (!comments || !Array.isArray(comments)) return [];

  const markers = comments
    .filter(comment => comment.geo) // только комментарии с geo данными
    .map(comment => ({
      id: comment.id,
      coordinate: [comment.geo!.longitude, comment.geo!.latitude],
      type: comment.type, // 0 = замечание, 1 = нарушение
      rec_type: comment.rec_type, // 0 = обычное, 1 = остановочное
    }));

  console.log('Violation markers:', markers);
  return markers;
}, []);

// Получим violationMarkers из apiDetails
const violationMarkers = apiDetails?.comments
  ? getViolationMarkers(apiDetails.comments)
  : [];
  
  const { getThemeColor, userRole } = useUser();
  const { token } = useAuth();
  const themeColor = getThemeColor();

  const scrollViewRef = useRef<ScrollView>(null);

  // Проверяем, находится ли пользователь на объекте
  const userIsOnSite = apiDetails
    ? isUserOnSite(
        userLocation || null,
        apiDetails.coordinates, // Передаем полигоны объекта
        apiDetails.geo_data // Центр для фолбэка
      )
    : false;

  // Обработчик для заблокированных кнопок
  const handleOffSiteInteraction = () => {
    Alert.alert(
      'Недоступно',
      'Вы должны находиться на объекте для выполнения этого действия',
      [{ text: 'OK' }]
    );
  };

  const toggleSection = (section: 'deliveryHistory' | 'activeWorks') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const transformCommentsToViolations = useCallback((comments: ApiComment[]): Violation[] => {
    console.log('=== transformCommentsToViolations: Processing comments ===');
    console.log('Total comments received:', comments.length);

    return comments.map((comment, index) => {
      console.log(`Processing comment ${index + 1}/${comments.length}:`, {
        id: comment.id,
        type: comment.type,
        rec_type: comment.rec_type,
        state: comment.state,
        commentfix: comment.commentfix ? {
          id: comment.commentfix.id,
          comment: comment.commentfix.comment,
          created_at: comment.commentfix.created_at
        } : null
      });

      // type: 1 = нарушение, 0 = замечание
      const isViolation = comment.type === 1;
      const authorName = comment.author
        ? `${comment.author.surname} ${comment.author.name}`
        : 'Неизвестно';

      // Определяем, является ли это остановочным нарушением/замечанием
      // rec_type: 1 = остановочное, 0 = обычное
      const requiresStop = comment.rec_type === 1;

      console.log(`Comment ${comment.id}: type=${comment.type} -> ${isViolation ? 'Нарушение' : 'Замечание'}, rec_type=${comment.rec_type} -> ${requiresStop ? 'Остановочное' : 'Обычное'}`);

      // Проверяем наличие активного непросмотренного исправления
      const hasPendingFix = !!comment.commentfix;

      return {
        id: comment.id.toString(),
        category: isViolation ? 'Нарушение' : 'Замечание',
        type: isViolation ? 'Нарушение' : 'Замечание',
        subType: 'Общее',
        deadline: comment.fix_time ? `${comment.fix_time} августа 2025` : 'Срок не указан',
        comment: comment.comment,
        dateRecorded: new Date(comment.created_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        requiresStop: requiresStop,
        issuedBy: authorName,
        presenceOf: 'Не указано',
        stage: { number: '1', description: 'Общий этап' },
        isViolation,
        state: comment.state, // 0 = новое, 1 = принято, другие значения - в процессе
        hasPendingFix: hasPendingFix, // Есть активное непросмотренное исправление
        commentFixId: comment.commentfix?.id, // ID исправления для принятия/отклонения
        fixComment: comment.commentfix?.comment, // Комментарий исправления от прораба
        fixDate: comment.commentfix?.created_at ? new Date(comment.commentfix.created_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : undefined
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
    console.log('Открытие деталей нарушения:', violationId);
    const violation = violations.find(v => v.id === violationId);
    if (violation) {
      setSelectedViolation(violation);

      // Проверяем, является ли пользователь ССК или ИКО и есть ли непросмотренное исправление
      const isInspector = userRole === 'ССК' || userRole === 'ИКО';
      const hasPendingFix = violation.hasPendingFix && violation.commentFixId;

      console.log('Opening modal for violation:', {
        violationId: violation.id,
        userRole,
        isInspector,
        hasPendingFix,
        state: violation.state
      });

      if (isInspector && hasPendingFix) {
        // Для ССК/ИКО с непросмотренными исправлениями открываем ProcessFixModal
        console.log('Opening ProcessFixModal for inspector');
        setProcessFixModalVisible(true);
      } else {
        // Для всех остальных случаев открываем CommentDetailsModal
        // (включая подрядчика и ССК/ИКО без исправлений)
        console.log('Opening CommentDetailsModal');
        setCommentDetailsModalVisible(true);
      }
    }
  }, [violations, userRole]);

  const handleFixPress = useCallback(() => {
    setCommentDetailsModalVisible(false);
    setFixCommentModalVisible(true);
  }, []);

  const handleFixCommentSubmit = useCallback(async (fixData: any) => {
    if (!token) {
      Alert.alert('Ошибка', 'Необходима авторизация');
      return;
    }

    try {
      console.log('=== ObjectDetailsScreen: handleFixCommentSubmit called ===');
      console.log('Token present:', !!token);
      console.log('Fix data received from modal:', JSON.stringify(fixData, null, 2));
      console.log('Calling apiService.fixComment...');

      const result = await apiService.fixComment(token, fixData);

      console.log('API response received:', JSON.stringify(result, null, 2));
      console.log('=== Fix submission successful ===');

      setFixCommentModalVisible(false);
      setFixedCommentId(fixData.comment_id.toString());
      setShowFixSuccessAlert(true);

      // Обновляем данные объекта
      if (objectData && token) {
        console.log('Refreshing object details...');
        setLoading(true);
        try {
          const objectDetails = await apiService.getObjectDetails(token, objectData.id);
          console.log('Object details refreshed, comments count:', objectDetails.comments?.length || 0);
          setApiDetails(objectDetails);

          if (objectDetails.comments) {
            const apiViolations = transformCommentsToViolations(objectDetails.comments);
            console.log('Violations updated, count:', apiViolations.length);
            setViolations(apiViolations);
          }
        } catch (error) {
          console.error('Error fetching object details:', error);
        } finally {
          setLoading(false);
        }
      }

      // Скрываем алерт через 5 секунд
      setTimeout(() => {
        setShowFixSuccessAlert(false);
        setFixedCommentId(null);
      }, 5000);
    } catch (error) {
      console.error('=== Error in handleFixCommentSubmit ===');
      console.error('Error type:', error instanceof Error ? error.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      console.error('=== End error log ===');
      Alert.alert('Ошибка', 'Не удалось отправить исправление');
    }
  }, [token, objectData, transformCommentsToViolations]);

  const handleProcessFixAccept = useCallback(async () => {
    if (!token || !selectedViolation?.commentFixId) {
      Alert.alert('Ошибка', 'Необходима авторизация или отсутствует ID исправления');
      return;
    }

    try {
      console.log('=== ObjectDetailsScreen: handleProcessFixAccept called ===');
      console.log('Token present:', !!token);
      console.log('Selected violation:', {
        id: selectedViolation.id,
        commentFixId: selectedViolation.commentFixId,
        state: selectedViolation.state
      });
      console.log('Process data:', JSON.stringify({
        comment_fix_id: selectedViolation.commentFixId,
        do_accept: true
      }, null, 2));
      console.log('Calling apiService.processCommentFix...');

      const result = await apiService.processCommentFix(token, {
        comment_fix_id: selectedViolation.commentFixId,
        do_accept: true
      });

      console.log('API response received:', JSON.stringify(result, null, 2));
      console.log('=== Fix accepted successfully ===');

      setProcessFixModalVisible(false);
      Alert.alert('Успех', 'Исправление принято');

      // Обновляем данные объекта
      if (objectData && token) {
        console.log('Refreshing object details after accept...');
        setLoading(true);
        try {
          const objectDetails = await apiService.getObjectDetails(token, objectData.id);
          console.log('Object details refreshed, comments count:', objectDetails.comments?.length || 0);
          setApiDetails(objectDetails);

          if (objectDetails.comments) {
            const apiViolations = transformCommentsToViolations(objectDetails.comments);
            console.log('Violations updated, count:', apiViolations.length);
            setViolations(apiViolations);
          }
        } catch (error) {
          console.error('Error fetching object details:', error);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('=== Error in handleProcessFixAccept ===');
      console.error('Error type:', error instanceof Error ? error.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      console.error('=== End error log ===');
      Alert.alert('Ошибка', 'Не удалось принять исправление');
    }
  }, [token, selectedViolation, objectData, transformCommentsToViolations]);

  const handleProcessFixReject = useCallback(async () => {
    if (!token || !selectedViolation?.commentFixId) {
      Alert.alert('Ошибка', 'Необходима авторизация или отсутствует ID исправления');
      return;
    }

    try {
      console.log('=== ObjectDetailsScreen: handleProcessFixReject called ===');
      console.log('Token present:', !!token);
      console.log('Selected violation:', {
        id: selectedViolation.id,
        commentFixId: selectedViolation.commentFixId,
        state: selectedViolation.state
      });
      console.log('Process data:', JSON.stringify({
        comment_fix_id: selectedViolation.commentFixId,
        do_accept: false
      }, null, 2));
      console.log('Calling apiService.processCommentFix...');

      const result = await apiService.processCommentFix(token, {
        comment_fix_id: selectedViolation.commentFixId,
        do_accept: false
      });

      console.log('API response received:', JSON.stringify(result, null, 2));
      console.log('=== Fix rejected successfully ===');

      setProcessFixModalVisible(false);
      Alert.alert('Успех', 'Исправление отклонено');

      // Обновляем данные объекта
      if (objectData && token) {
        console.log('Refreshing object details after reject...');
        setLoading(true);
        try {
          const objectDetails = await apiService.getObjectDetails(token, objectData.id);
          console.log('Object details refreshed, comments count:', objectDetails.comments?.length || 0);
          setApiDetails(objectDetails);

          if (objectDetails.comments) {
            const apiViolations = transformCommentsToViolations(objectDetails.comments);
            console.log('Violations updated, count:', apiViolations.length);
            setViolations(apiViolations);
          }
        } catch (error) {
          console.error('Error fetching object details:', error);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('=== Error in handleProcessFixReject ===');
      console.error('Error type:', error instanceof Error ? error.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      console.error('=== End error log ===');
      Alert.alert('Ошибка', 'Не удалось отклонить исправление');
    }
  }, [token, selectedViolation, objectData, transformCommentsToViolations]);

  const handleCreateNewNote = useCallback(() => {
    if (!userIsOnSite) {
      handleOffSiteInteraction();
      return;
    }
    setCreateViolationModalVisible(true);
  }, [userIsOnSite]);

  const handleCloseWorkDay = useCallback(() => {
    if (!userIsOnSite) {
      handleOffSiteInteraction();
      return;
    }
    console.log('Закрыть рабочий день');
  }, [userIsOnSite]);

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
    if (!userIsOnSite) {
      handleOffSiteInteraction();
      return;
    }
    // Новый flow: сначала выбираем этап работ
    setWorkStageSelectionModalVisible(true);
  }, [userIsOnSite]);

  const handleTTNPhotoTaken = useCallback(async (photoUri: string) => {
    if (!token || !selectedWorkStageId) {
      Alert.alert('Ошибка', 'Отсутствует токен или этап работ');
      return;
    }

    setCapturedPhoto(photoUri);
    setTtnPhotoModalVisible(false);
    setIsProcessingOcr(true);

    try {
      console.log('=== Starting OCR processing ===');
      console.log('Photo URI:', photoUri);
      console.log('Selected work stage ID:', selectedWorkStageId);

      // Создаем объект файла для отправки
      const fileObj = {
        uri: photoUri,
        type: 'image/jpeg',
        name: `ttn_${Date.now()}.jpg`
      };

      // 1. Отправляем фото на обработку
      const shipmentResponse = await apiService.shipmentStart(token, fileObj, selectedWorkStageId);
      const shipmentId = shipmentResponse.shipment_id;
      setCurrentShipmentId(shipmentId);

      console.log('Shipment started, ID:', shipmentId);
      Alert.alert('Обработка', 'ТТН отправлена на обработку. Пожалуйста, подождите...');

      // 2. Опрашиваем статус обработки каждую секунду
      let attempts = 0;
      const maxAttempts = 125; // Максимум 60 секунд ожидания

      const pollOcrStatus = async (): Promise<any> => {
        attempts++;
        console.log(`OCR status check attempt ${attempts}/${maxAttempts}`);

        const statusResponse = await apiService.getOcrStatus(token, shipmentId);
        console.log('OCR status:', statusResponse.status);

        if (statusResponse.status === 1) {
          // Обработка завершена
          console.log('OCR processing completed!');
          console.log('OCR result:', JSON.stringify(statusResponse.result, null, 2));
          return statusResponse.result;
        } else if (statusResponse.status === 0) {
          // Еще обрабатывается
          if (attempts >= maxAttempts) {
            throw new Error('Превышено время ожидания обработки');
          }
          // Ждем 1 секунду и проверяем снова
          await new Promise(resolve => setTimeout(resolve, 1000));
          return pollOcrStatus();
        } else {
          throw new Error(`Неизвестный статус: ${statusResponse.status}`);
        }
      };

      const ocrResult = await pollOcrStatus();
      setOcrData(ocrResult);

      // 3. Получаем список доступных материалов для этого этапа
      const materialsFromApi = await apiService.getMaterialsRequired(token, selectedWorkStageId);
      console.log('Available materials:', materialsFromApi);
      setAvailableMaterials(materialsFromApi);

      setIsProcessingOcr(false);

      // 4. Открываем форму приема поставки с заполненными данными
      setAcceptDeliveryModalVisible(true);

      Alert.alert('Успех', 'ТТН успешно обработана!');
    } catch (error) {
      console.error('=== Error in OCR processing ===');
      console.error('Error:', error);
      setIsProcessingOcr(false);

      // Даже если OCR не удался, загружаем список доступных материалов для этапа
      try {
        console.log('Loading available materials despite OCR failure...');
        const materialsFromApi = await apiService.getMaterialsRequired(token, selectedWorkStageId);
        console.log('Available materials loaded:', materialsFromApi);
        setAvailableMaterials(materialsFromApi);
      } catch (materialsError) {
        console.error('Error loading materials:', materialsError);
      }

      Alert.alert('Ошибка', 'Не удалось обработать ТТН. Вы можете ввести данные вручную.');
      // В случае ошибки все равно открываем форму, но без данных OCR
      setAcceptDeliveryModalVisible(true);
    }
  }, [token, selectedWorkStageId]);

  const handleCloseTTNPhotoModal = useCallback(() => {
    setTtnPhotoModalVisible(false);
  }, []);

  const handleWorkStageSelected = useCallback((stageId: number) => {
    console.log('=== Work stage selected ===');
    console.log('Selected stage ID:', stageId);
    console.log('Type of stage ID:', typeof stageId);

    // Находим выбранный job в apiDetails для проверки
    const selectedJob = apiDetails?.active_jobs?.find((job: any) => job.id === stageId);
    console.log('Selected job from apiDetails:', JSON.stringify(selectedJob, null, 2));
    console.log('All active_jobs:', JSON.stringify(apiDetails?.active_jobs, null, 2));

    setSelectedWorkStageId(stageId);
    setWorkStageSelectionModalVisible(false);
    // После выбора этапа открываем камеру для фото ТТН
    setTtnPhotoModalVisible(true);
  }, [apiDetails]);

  const handleCloseWorkStageModal = useCallback(() => {
    setWorkStageSelectionModalVisible(false);
    setSelectedWorkStageId(null);
  }, []);

  const handleAcceptDeliverySubmit = useCallback(async (deliveryData: any) => {
    console.log('=== handleAcceptDeliverySubmit called ===');
    console.log('Delivery data:', JSON.stringify(deliveryData, null, 2));

    // Вызываем API для обновления поставки
    if (token && deliveryData.shipment_id) {
      try {
        console.log('Calling shipmentUpdate API...');
        const result = await apiService.shipmentUpdate(token, {
          shipment_id: deliveryData.shipment_id,
          doc_serial: deliveryData.doc_serial,
          supplier_name: deliveryData.supplier_name,
          package_state: deliveryData.package_state,
          production_tech: deliveryData.production_tech,
          materials: deliveryData.materials
        });

        console.log('Shipment update response:', JSON.stringify(result, null, 2));
        console.log('=== Shipment accepted successfully ===');

        Alert.alert('Успех', 'Поставка успешно принята');
      } catch (error) {
        console.error('=== Error updating shipment ===');
        console.error('Error:', error);
        Alert.alert('Ошибка', 'Не удалось принять поставку');
        return; // Не продолжаем, если API упал
      }
    }

    setAcceptDeliveryModalVisible(false);
    setCapturedPhoto(null);

    // Обновляем локальную историю поставок
    const newDelivery: DeliveryHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ru-RU'),
      invoiceNumber: deliveryData.doc_serial || deliveryData.invoiceNumber || '',
      supplierCompany: deliveryData.supplier_name || deliveryData.supplierCompany || '',
      materials: deliveryData.materials || [],
      packagingCondition: deliveryData.package_state || deliveryData.packagingCondition || '',
      comment: deliveryData.comment || ''
    };

    setDeliveryHistory(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [newDelivery, ...prevArray];
    });
  }, [token]);

  const handleCloseAcceptDeliveryModal = useCallback(() => {
    setAcceptDeliveryModalVisible(false);
    setCapturedPhoto(null);
  }, []);

  const handleProposeScheduleChange = useCallback((changeData: any) => {
    console.log('Предложено изменение графика:', changeData);
    setProposeScheduleChangeModalVisible(false);
    Alert.alert('Успех', 'Предложение изменения графика отправлено');
  }, []);

  const handleCloseProposeScheduleChangeModal = useCallback(() => {
    setProposeScheduleChangeModalVisible(false);
  }, []);

  const handleStageDetailsPress = useCallback(async (jobId: number) => {
    if (!token || !objectData) {
      Alert.alert('Ошибка', 'Необходима авторизация');
      return;
    }

    try {
      console.log('=== handleStageDetailsPress called ===');
      console.log('Job ID:', jobId);

      setLoadingStageDetails(true);

      // Получаем детали объекта с параметром details=true
      const detailedData: any = await apiService.getObjectDetails(token, objectData.id, true);
      console.log('=== Full detailed data received ===');
      console.log('Keys in response:', Object.keys(detailedData));

      // sitestage - это массив, внутри каждого элемента есть job2stage (тоже массив)
      if (detailedData.sitestage && Array.isArray(detailedData.sitestage)) {
        console.log('=== sitestage array found ===');
        console.log('Number of sitestages:', detailedData.sitestage.length);

        // Проходим по всем sitestage и ищем нужный этап во всех job2stage
        let stageDetail = null;

        for (const sitestage of detailedData.sitestage) {
          console.log('Checking sitestage:', sitestage);

          if (sitestage.job2stage && Array.isArray(sitestage.job2stage)) {
            console.log('Found job2stage array with', sitestage.job2stage.length, 'items');
            console.log('IDs in this job2stage:', sitestage.job2stage.map((s: any) => s.id));

            stageDetail = sitestage.job2stage.find((stage: any) => stage.id === jobId);

            if (stageDetail) {
              console.log('=== Stage details found! ===');
              break; // Нашли, выходим из цикла
            }
          }
        }

        if (stageDetail) {
          console.log('=== Stage details found ===');
          console.log('Stage detail:', JSON.stringify(stageDetail, null, 2));
          setSelectedStageDetails(stageDetail);
          setStageDetailsModalVisible(true);
        } else {
          console.error(`No stage found with id=${jobId}`);
          // Соберём все доступные ID из всех job2stage
          const allIds: number[] = [];
          detailedData.sitestage.forEach((ss: any) => {
            if (ss.job2stage && Array.isArray(ss.job2stage)) {
              allIds.push(...ss.job2stage.map((s: any) => s.id));
            }
          });
          console.error('All available IDs across all sitestages:', allIds);
          Alert.alert('Ошибка', `Не удалось найти подробности этапа с ID ${jobId}`);
        }
      } else {
        console.error('=== sitestage not found or not an array ===');
        console.error('sitestage exists:', !!detailedData.sitestage);
        console.error('sitestage is array:', Array.isArray(detailedData.sitestage));
        Alert.alert('Ошибка', 'Подробности этапа недоступны');
      }
    } catch (error) {
      console.error('=== Error fetching stage details ===');
      console.error('Error:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить подробности этапа');
    } finally {
      setLoadingStageDetails(false);
    }
  }, [token, objectData]);

  const handleCloseStageDetailsModal = useCallback(() => {
    setStageDetailsModalVisible(false);
    setSelectedStageDetails(null);
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
        deliveryHistory: true,
        activeWorks: true
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
                <MapComponent
                  zoom={14}
                  polygons={polygons(apiDetails)}
                  points={[transformedCoordinates(apiDetails)]}
                  cameraCenter={transformedCoordinates(apiDetails)}
                  violationMarkers={violationMarkers}
                  polygonColor={themeColor}
                />
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
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: userIsOnSite ? themeColor : '#BDBDBD' }
                  ]}
                  disabled={!userIsOnSite}
                  onPress={() => {
                    if (!userIsOnSite) {
                      handleOffSiteInteraction();
                    }
                  }}
                >
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
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: userIsOnSite ? themeColor : '#BDBDBD' }
                  ]}
                  disabled={!userIsOnSite}
                  onPress={() => {
                    if (!userIsOnSite) {
                      handleOffSiteInteraction();
                    }
                  }}
                >
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
                    style={[
                      styles.contractorButton,
                      { backgroundColor: userIsOnSite ? themeColor : '#E0E0E0' }
                    ]}
                    onPress={handleOpenCameraForTTN}
                  >
                    <Text style={[
                      styles.contractorButtonText,
                      { color: userIsOnSite ? '#FFFFFF' : '#9E9E9E' }
                    ]}>
                      Принять поставку
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.contractorButton,
                      { backgroundColor: userIsOnSite ? themeColor : '#E0E0E0' }
                    ]}
                    onPress={handleCloseWorkDay}
                  >
                    <Text style={[
                      styles.contractorButtonText,
                      { color: userIsOnSite ? '#FFFFFF' : '#9E9E9E' }
                    ]}>
                      Закрыть рабочий день
                    </Text>
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
              <Text style={styles.sectionTitle}>Нарушения и замечания</Text>
            </View>

            {/* Бейдж с количеством нарушений и замечаний на отдельной строке */}
            {apiDetails && (
              <View style={styles.violationsCountBadge}>
                <Text style={styles.violationsCountText}>
                  {apiDetails.warns_count} наруш. / {apiDetails.notes_count} замечаний
                </Text>
              </View>
            )}

            {/* Success alert for fix submission */}
            {showFixSuccessAlert && (
              <View style={styles.fixSuccessAlert}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.fixSuccessAlertText}>
                  Исправление отправлено на проверку
                </Text>
              </View>
            )}

            {!isContractor && (
              <TouchableOpacity
                style={[
                  styles.createNoteButton,
                  !userIsOnSite && styles.disabledButton
                ]}
                onPress={handleCreateNewNote}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={userIsOnSite ? themeColor : '#9E9E9E'}
                />
                <Text style={[
                  styles.createNoteButtonText,
                  { color: userIsOnSite ? themeColor : '#9E9E9E' }
                ]}>
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

            {/* Кнопка "Предложить изменение графика" - только для Подрядчика и ССК */}
            {(userRole === 'Подрядчик' || userRole === 'ССК') && (
              <TouchableOpacity
                style={[
                  styles.proposeChangeButton,
                  { backgroundColor: userIsOnSite ? themeColor : '#E0E0E0' }
                ]}
                onPress={() => {
                  if (!userIsOnSite) {
                    handleOffSiteInteraction();
                    return;
                  }
                  setProposeScheduleChangeModalVisible(true);
                }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={userIsOnSite ? "#FFFFFF" : "#9E9E9E"}
                />
                <Text style={[
                  styles.proposeChangeButtonText,
                  { color: userIsOnSite ? "#FFFFFF" : "#9E9E9E" }
                ]}>
                  Предложить изменение
                </Text>
              </TouchableOpacity>
            )}

            {/* Активные работы */}
            <TouchableOpacity
              style={styles.activeWorksHeader}
              onPress={() => toggleSection('activeWorks')}
            >
              <Text style={styles.activeWorksTitle}>Активные виды работ</Text>
              <Text style={styles.expandIcon}>{expandedSections.activeWorks ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expandedSections.activeWorks && (
              <View style={styles.scheduleContent}>
                {apiDetails?.active_jobs && apiDetails.active_jobs.length > 0 ? (
                  <>
                    {apiDetails.active_jobs.map((job, index) => (
                      <React.Fragment key={job.id || index}>
                        <WorkScheduleCard
                          job={job}
                          index={index}
                          onDetailsPress={handleStageDetailsPress}
                        />
                        {/* Разделитель между карточками */}
                        {index < apiDetails.active_jobs.length - 1 && (
                          <View style={styles.workDivider} />
                        )}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <View style={styles.noJobsContainer}>
                    <Ionicons name="calendar-outline" size={48} color="#E0E0E0" />
                    <Text style={styles.noJobsText}>Нет активных работ</Text>
                  </View>
                )}
              </View>
            )}
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
          activeJobs={apiDetails?.active_jobs}
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
          ocrData={ocrData}
          availableMaterials={availableMaterials}
          shipmentId={currentShipmentId}
        />

        <ProposeScheduleChangeModal
          visible={proposeScheduleChangeModalVisible}
          onClose={handleCloseProposeScheduleChangeModal}
          onSubmit={handleProposeScheduleChange}
          activeJobs={apiDetails?.active_jobs || []}
        />

        <CommentDetailsModal
          visible={commentDetailsModalVisible}
          onClose={() => setCommentDetailsModalVisible(false)}
          violation={selectedViolation}
          onFixPress={handleFixPress}
          userIsOnSite={userIsOnSite}
        />

        <FixCommentModal
          visible={fixCommentModalVisible}
          onClose={() => setFixCommentModalVisible(false)}
          violation={selectedViolation}
          onSubmit={handleFixCommentSubmit}
        />

        <ProcessFixModal
          visible={processFixModalVisible}
          onClose={() => setProcessFixModalVisible(false)}
          violation={selectedViolation}
          onAccept={handleProcessFixAccept}
          onReject={handleProcessFixReject}
        />

        <StageDetailsModal
          visible={stageDetailsModalVisible}
          onClose={handleCloseStageDetailsModal}
          stageDetails={selectedStageDetails}
          themeColor={themeColor}
        />

        <WorkStageSelectionModal
          visible={workStageSelectionModalVisible}
          onClose={handleCloseWorkStageModal}
          onSelect={handleWorkStageSelected}
          stages={apiDetails?.active_jobs || []}
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
    marginTop: 16,
    marginBottom: 16,
  },
  createNoteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#FAFAFA',
    opacity: 0.6,
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
  fixSuccessAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  fixSuccessAlertText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  fixPendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  fixPendingAlertText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  fixAcceptedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  fixAcceptedAlertText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  scheduleContent: {
    marginTop: 8,
  },
  noJobsContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  noJobsText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
  workDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  proposeChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  proposeChangeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeWorksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  activeWorksTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#424242',
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