// app/screens/HomeScreen.tsx (обновленный с токеном)
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import ObjectCard from '../components/ObjectCard';
import { useAuth } from '../contexts/AuthContext';
import { ApiObjectData, apiService } from '../services/apiService';
import { ObjectData, ObjectDetails, WarehouseMaterial } from '../types';
import ObjectDetailsScreen from './ObjectDetailsScreen';

interface HomeScreenProps {

}

const gdPoint = [58.9807405, 53.378795749999995]
const gdPolygon = [[
  [58.97985, 53.379181],
  [58.979834, 53.378279],
  [58.980065, 53.378151],
  [58.982688, 53.378189],
  [58.982903, 53.378295],
  [58.983074, 53.378596],
  [58.98308, 53.378865],
  [58.982946, 53.379162],
  [58.982672, 53.3793],
  [58.980038, 53.379284],
  [58.97985, 53.379181]
],[
  [
  58.978751, 53.379469
  ],
  [
    58.978708,53.377895
  ],
  [
    58.97933,
    53.377901
  ],
  [
    58.979244,
    53.379482
  ],
  [
    58.978751,
    53.379469
  ]
]
]


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
  }
];

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<number[][]>()
  const { token } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let webWatchId: number | null = null;

    async function startLocationTracking() {
      // Для веб-версии используем нативный Geolocation API
      if (Platform.OS === 'web') {
        console.log('Using web geolocation API');

        if (!navigator.geolocation) {
          setErrorMsg('Geolocation is not supported by your browser');
          return;
        }

        // Получаем текущую позицию
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const webLocation: Location.LocationObject = {
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                accuracy: position.coords.accuracy,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              timestamp: position.timestamp,
            };
            setLocation(webLocation);
            console.log('Web location updated:', webLocation.coords);
          },
          (error) => {
            console.error('Error getting web location:', error);
            setErrorMsg(`Geolocation error: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );

        // Следим за обновлениями местоположения
        webWatchId = navigator.geolocation.watchPosition(
          (position) => {
            const webLocation: Location.LocationObject = {
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                accuracy: position.coords.accuracy,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              timestamp: position.timestamp,
            };
            setLocation(webLocation);
            console.log('Web location updated:', webLocation.coords);
          },
          (error) => {
            console.error('Error watching web location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );

        return;
      }

      // Для нативных платформ используем expo-location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Сначала получаем текущую позицию для быстрого отображения
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error getting initial location:', error);
      }

      // Затем подписываемся на обновления местоположения
      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced, // Баланс между точностью и батареей
            timeInterval: 5000, // Обновление каждые 5 секунд
            distanceInterval: 10, // Или при перемещении на 10 метров
          },
          (newLocation) => {
            setLocation(newLocation);
            console.log('Location updated:', newLocation.coords);
          }
        );
      } catch (error) {
        console.error('Error watching location:', error);
        setErrorMsg('Error tracking location');
      }
    }

    startLocationTracking();

    // Очистка подписки при размонтировании компонента
    return () => {
      if (Platform.OS === 'web' && webWatchId !== null) {
        navigator.geolocation.clearWatch(webWatchId);
      } else if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (token) {
      fetchObjects();
    } else {
      setError('Токен авторизации отсутствует');
      setLoading(false);
    }
  }, [token]);

const fetchObjects = async () => {
  if (!token) {
    setError('Токен авторизации отсутствует');
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    console.log('Fetching objects with token:', token);
    
    const apiObjects = await apiService.getAvailableObjects(token, 1, 10);
    
    console.log('API objects received:', apiObjects);
    
    // Преобразуем ApiObjectData в ObjectData
    const transformedObjects: ObjectData[] = apiObjects.map(apiObject => ({
      id: apiObject.id || 'Не пришло из запроса',
      address: apiObject.address || 'Не пришло из запроса',
      status: apiObject.status || 'Не пришло из запроса',
      statusColor: apiObject.statusColor || '#757575',
      borderColor: apiObject.borderColor || '#757575',
      responsible: apiObject.responsible || 'Ответственный: Не пришло из запроса',
      stages: apiObject.stages || [],
      errorText: apiObject.errorText,
      isPlanned: apiObject.isPlanned || false,
      jobshiftPresent: apiObject.jobshiftPresent || false,
      notesCount: apiObject.notesCount || 0,
      warnsCount: apiObject.warnsCount || 0,
      activeJobs: apiObject.activeJobs || [],
      latitude: apiObject.latitude || 0,
      longitude: apiObject.longitude || 0,
      coordinates: apiObject.coordinates
    }));

    function transformedCoordinates(objects: ApiObjectData[]){
      let coords: number[][] = []
      objects.forEach(object => {
        coords.push([object.latitude || 0, object.longitude || 0])
      });
      console.log("Coordinates: " + coords)
      return coords;
    };

    const currentLocaion = (location: Location.LocationObject): number[] => {
      if (location != null)
        return [location.coords.longitude, location.coords.latitude]
      return []
    }

    
    console.log('Transformed objects:', transformedObjects);
    
    setObjects(transformedObjects);
    setCoordinates(transformedCoordinates(apiObjects))
  } catch (err) {
    console.error('Error fetching objects:', err);
    setError('Не удалось загрузить объекты');
    Alert.alert('Ошибка', 'Не удалось загрузить список объектов');
  } finally {
    setLoading(false);
  }
};

  const handleObjectPress = (object: ObjectData) => {
    const objectDetails: ObjectDetails = {
      ...object,
      violations: [],
      inspectors: [
        { id: '1', name: 'Иванов А.А.', position: 'Главный инспектор' },
        { id: '2', name: 'Петров Б.Б.', position: 'Технический инспектор' },
        { id: '3', name: 'Сидоров В.В.', position: 'Инспектор по качеству' }
      ],
      workAct: "Акт №12345 от 01.12.2023",
      workSchedule: "График утвержден 01.12.2023",
      proposedChanges: "Изменений нет",
      fullSchedule: "График доступен в полной версии",
      warehouse: mockWarehouseMaterials,
      coordinates: []
    };
    
    setSelectedObject(objectDetails);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedObject(null);
  };

  const handleRetry = () => {
    fetchObjects();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B79ED" />
          <Text style={styles.loadingText}>Загрузка объектов...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Повторить попытку</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      {/* Уведомление о геолокации */}
      {errorMsg && (
        <View style={styles.locationWarning}>
          <Text style={styles.locationWarningText}>⚠️ {errorMsg}</Text>
        </View>
      )}

      {/* Карта с маркерами объектов */}
      <View style={styles.mapContainer}>

        <MapComponent
          points={coordinates}
          cameraCenter={[location?.coords.longitude || 0, location?.coords.latitude || 0]}
          userLocation={location ? [location?.coords.longitude || 0, location?.coords.latitude || 0] : undefined}
          zoom={15}
        />
      </View>

      {/* Секция с доступными объектами */}
      <View style={styles.objectsSection}>
        <Text style={styles.sectionTitle}>Доступные объекты</Text>
        {objects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет доступных объектов</Text>
          </View>
        ) : (
          <ScrollView style={styles.objectsList}>
            {objects.map((object) => (
              <ObjectCard
                key={object.id}
                {...object}
                onPress={() => handleObjectPress(object)}
                userLocation={location ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  accuracy: location.coords.accuracy || 0
                } : null}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <ObjectDetailsScreen
        visible={showDetails}
        onClose={handleCloseDetails}
        objectData={selectedObject}
        userLocation={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0
        } : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  locationWarning: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  locationWarningText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  objectsSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 16,
  },
  objectsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B79ED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});

export default HomeScreen;