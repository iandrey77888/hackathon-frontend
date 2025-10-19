// app/components/ObjectCard.tsx (обновленный с реальными координатами)
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { ObjectData, PolygonPoint } from '../types';
import { isUserOnSite } from '../utils/locationUtils';
import MapComponent from './MapComponent';

interface ObjectCardProps extends ObjectData {
  onPress: () => void;
  geoData?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  coordinates?: PolygonPoint[][][];
  userLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
}

const ObjectCard: React.FC<ObjectCardProps> = ({
  statusColor,
  status: statusText,
  id: objectNumber,
  address,
  responsible,
  stages,
  errorText,
  isPlanned = false,
  jobshiftPresent = false,
  notesCount = 0,
  warnsCount = 0,
  onPress,
  geoData,
  coordinates,
  latitude,
  longitude,
  userLocation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const hasNoActiveJobs = stages.length === 1 && stages[0].description === 'Нет активных работ';

  // Проверяем, находится ли пользователь на объекте
  console.log('ObjectCard - checking location for object:', objectNumber);
  console.log('ObjectCard - coordinates available:', !!coordinates);
  console.log('ObjectCard - userLocation:', userLocation);

  const userIsOnSite = isUserOnSite(
    userLocation || null,
    coordinates, // Передаем полигоны объекта
    geoData || (latitude && longitude ? { latitude, longitude } : null) // Центр для фолбэка
  );

  // Функция для форматирования координат из geo_data
  const getCoordinates = () => {
    if (geoData) {
      return `${geoData.latitude.toFixed(5)} ${geoData.longitude.toFixed(5)}`;
    }
    if (latitude && longitude) {
      return `${latitude.toFixed(5)} ${longitude.toFixed(5)}`;
    }
    return objectNumber;
  };

  // Получаем центр объекта для камеры - используем geo_data напрямую
  const getCameraCenter = (): [number, number] | undefined => {
    // Приоритет: geoData (это координаты центра объекта с бэкенда)
    if (geoData && geoData.latitude && geoData.longitude) {
      return [geoData.latitude, geoData.longitude];
    }

    // Запасной вариант: используем latitude/longitude напрямую
    if (latitude && longitude) {
      return [latitude, longitude];
    }

    return undefined;
  };

  return (
    <View style={styles.objectCard}>
      {/* Предупреждение о том, что пользователь на объекте */}
      {userIsOnSite && (
        <View style={styles.onSiteWarning}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.onSiteWarningText}>Вы находитесь на объекте</Text>
        </View>
      )}

      {/* Предупреждение о нарушениях и замечаниях - красный текст с иконкой */}
      {errorText && (
        <View style={styles.warningSection}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.warningTitle}>{errorText}</Text>
        </View>
      )}

      {/* Статус объекта и координаты в одной строке */}
      <View style={styles.topRow}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <View style={styles.coordinatesRow}>
          <Ionicons name="location-outline" size={14} color="#757575" />
          <Text style={styles.coordinates}>{getCoordinates()}</Text>
        </View>
      </View>

      {/* Адрес объекта */}
      <Text style={styles.addressText}>{address}</Text>

      {/* Ответственный и Замечания в одной строке */}
      <View style={styles.infoRow}>
        <View style={styles.responsibleContainer}>
          <Text style={styles.label}>Ответственный</Text>
          <Text style={styles.value}>{responsible.split(': ')[1] || 'Имя Фамилия'}</Text>
        </View>

        {notesCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.label}>Замечаний</Text>
            <Text style={styles.notesCount}>{notesCount} активных замечания</Text>
          </View>
        )}
      </View>

      {/* Нарушения */}
      {warnsCount > 0 && (
        <View style={styles.warningsContainer}>
          <Text style={styles.label}>Нарушений</Text>
          <Text style={styles.warnsCount}>{warnsCount} активное нарушение</Text>
        </View>
      )}

      {/* Раскрывающийся список активных этапов */}
      <TouchableOpacity style={styles.expandHeader} onPress={toggleExpand}>
        <Text style={styles.sectionTitle}>Активные виды работ</Text>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#424242" />
      </TouchableOpacity>

      {isExpanded && stages.map((stage, index) => (
        <View key={index} style={[
          styles.stageItem,
          hasNoActiveJobs && styles.noJobsItem
        ]}>
          {!hasNoActiveJobs && (
            <View style={[styles.stageNumberCircle, { backgroundColor: themeColor }]}>
              <Text style={styles.stageNumber}>{stage.number}</Text>
            </View>
          )}
          <Text style={[
            styles.stageDescription,
            hasNoActiveJobs && styles.noJobsText
          ]}>
            {stage.description}
          </Text>
        </View>
      ))}

      {/* Карта с полигоном объекта */}
      {coordinates && coordinates.length > 0 && (
        <View style={styles.mapContainer}>
          <MapComponent
            polygons={coordinates}
            zoom={16}
            cameraCenter={getCameraCenter()}
            polygonColor={themeColor}
          />
        </View>
      )}

      {/* Кнопка с динамическим цветом */}
      <TouchableOpacity
        style={[styles.objectButton, { backgroundColor: themeColor }]}
        onPress={onPress}
      >
        <Text style={styles.objectButtonText}>Перейти к объекту</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  objectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  onSiteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  onSiteWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 6,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinates: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  addressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  responsibleContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#757575',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  notesCount: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
  },
  warningsContainer: {
    marginBottom: 12,
  },
  warnsCount: {
    fontSize: 13,
    color: '#F44336',
    fontWeight: '500',
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#424242',
    fontWeight: '600',
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  noJobsItem: {
    justifyContent: 'center',
    paddingVertical: 12,
  },
  stageNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageNumber: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stageDescription: {
    fontSize: 13,
    color: '#424242',
    flex: 1,
    lineHeight: 18,
  },
  noJobsText: {
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 13,
  },
  mapContainer: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  objectButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  objectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ObjectCard;