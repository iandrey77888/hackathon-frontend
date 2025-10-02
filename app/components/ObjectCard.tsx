// app/components/ObjectCard.tsx (обновленный с реальными координатами)
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { ObjectData } from '../types';

interface ObjectCardProps extends ObjectData {
  onPress: () => void;
  geoData?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getThemeColor, userRole } = useUser();
  const themeColor = getThemeColor();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const hasNoActiveJobs = stages.length === 1 && stages[0].description === 'Нет активных работ';

  // Функция для форматирования координат из geo_data
  const getCoordinates = () => {
    if (geoData) {
      return `${geoData.latitude.toFixed(6)}, ${geoData.longitude.toFixed(6)}`;
    }
    // Если geo_data нет, показываем ID как есть
    return objectNumber;
  };

  // Показываем предупреждение только если есть нарушения или замечания
  const showWarning = notesCount > 0 || warnsCount > 0;

  return (
    <View style={styles.objectCard}>
      {/* Предупреждение о нарушениях и замечаниях - красный текст с иконкой */}
      {showWarning && (
        <View style={styles.warningSection}>
          <Ionicons name="alert-circle-outline" size={16} color="#F44336" />
          <Text style={styles.warningTitle}>Есть активные нарушения или замечания</Text>
        </View>
      )}

      {/* Статус объекта */}
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* Адрес объекта */}
      <Text style={styles.addressText}>{address}</Text>

      {/* Координаты с иконкой маркера */}
      <View style={styles.coordinatesRow}>
        <Ionicons name="location-outline" size={16} color="#757575" />
        <Text style={styles.coordinates}>{getCoordinates()}</Text>
      </View>

      {/* Ответственный с замечаниями справа */}
      <View style={styles.responsibleRow}>
        <View style={styles.responsibleContainer}>
          <Text style={styles.responsibleLabel}>Ответственный</Text>
          <Text style={styles.responsibleValue}>{responsible.split(': ')[1]}</Text>
        </View>
        
        {/* Замечания справа от ответственного */}
        {notesCount > 0 && (
          <View style={styles.notesBadge}>
            <Text style={styles.notesTitle}>Замечание</Text>
            <Text style={styles.notesCount}>{notesCount} активных замечаний</Text>
          </View>
        )}
      </View>

      {/* Нарушения под ответственным */}
      {warnsCount > 0 && (
        <View style={styles.warnsBadge}>
          <Text style={styles.warnsTitle}>Нарушение</Text>
          <Text style={styles.warnsCount}>{warnsCount} активных нарушений</Text>
        </View>
      )}

      {errorText && <Text style={styles.errorText}>{errorText}</Text>}

      {/* Раскрывающийся список активных этапов */}
      <TouchableOpacity style={styles.expandHeader} onPress={toggleExpand}>
        <Text style={styles.sectionTitle}>Активные этапы работ</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coordinates: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  responsibleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  responsibleContainer: {
    flex: 1,
  },
  responsibleLabel: {
    fontSize: 14,
    color: '#424242',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  responsibleValue: {
    fontSize: 14,
    color: '#757575',
  },
  notesBadge: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  notesTitle: {
    fontSize: 14,
    color: '#424242',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notesCount: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  warnsBadge: {
    marginBottom: 12,
  },
  warnsTitle: {
    fontSize: 14,
    color: '#424242',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  warnsCount: {
    fontSize: 12,
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
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#424242',
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 16,
    color: '#757575',
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
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stageDescription: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  noJobsText: {
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  objectButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  objectButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default ObjectCard;