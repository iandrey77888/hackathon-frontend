import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface MaterialHistory {
  date: string;
  change: number;
}

interface MaterialStats {
  req_vol: number;
  used_vol: number;
  available_vol: number;
}

interface StageMaterial {
  id: number;
  name: string;
  stats: MaterialStats;
  history: MaterialHistory[];
}

export interface StageDetails {
  seq: number;
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  volume: number;
  done_volume: number;
  measurement: string;
  status: number;
  materials: StageMaterial[];
}

interface StageDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  stageDetails: StageDetails | null;
  themeColor?: string;
}

const StageDetailsModal: React.FC<StageDetailsModalProps> = ({
  visible,
  onClose,
  stageDetails,
  themeColor = '#4A90E2',
}) => {
  if (!stageDetails) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getProgressPercentage = () => {
    if (stageDetails.volume === 0) return 0;
    return Math.round((stageDetails.done_volume / stageDetails.volume) * 100);
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return 'В работе';
      case 1:
        return 'Завершен';
      case 2:
        return 'Приостановлен';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return '#4CAF50';
      case 1:
        return '#2196F3';
      case 2:
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: themeColor }]}>
            <Text style={styles.headerTitle}>Подробности подэтапа</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stage Info */}
            <View style={styles.section}>
              <Text style={styles.stageName}>{stageDetails.name}</Text>
              <Text style={styles.stageDescription}>{stageDetails.description}</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Статус</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stageDetails.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(stageDetails.status)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Начало работ</Text>
                  <Text style={styles.infoValue}>{formatDate(stageDetails.start_date)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Окончание работ</Text>
                  <Text style={styles.infoValue}>{formatDate(stageDetails.end_date)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Объем работ</Text>
                  <Text style={styles.infoValue}>
                    {stageDetails.volume} {stageDetails.measurement}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Выполнено</Text>
                  <Text style={styles.infoValue}>
                    {stageDetails.done_volume} {stageDetails.measurement}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Прогресс</Text>
                  <Text style={styles.progressPercentage}>{getProgressPercentage()}%</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getProgressPercentage()}%`,
                        backgroundColor: themeColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Materials Section */}
            {stageDetails.materials && stageDetails.materials.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Материалы</Text>
                {stageDetails.materials.map((material, index) => (
                  <View key={material.id} style={styles.materialCard}>
                    <Text style={styles.materialName}>{material.name}</Text>

                    {/* Material Stats */}
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Требуется</Text>
                        <Text style={styles.statValue}>{material.stats.req_vol}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Использовано</Text>
                        <Text style={[styles.statValue, { color: '#F44336' }]}>
                          {material.stats.used_vol}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Доступно</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                          {material.stats.available_vol}
                        </Text>
                      </View>
                    </View>

                    {/* Material History */}
                    {material.history && material.history.length > 0 && (
                      <View style={styles.historyContainer}>
                        <Text style={styles.historyTitle}>История движения</Text>
                        {material.history.map((historyItem, histIndex) => (
                          <View key={histIndex} style={styles.historyItem}>
                            <Text style={styles.historyDate}>
                              {formatDate(historyItem.date)}
                            </Text>
                            <Text
                              style={[
                                styles.historyChange,
                                {
                                  color: historyItem.change > 0 ? '#4CAF50' : '#F44336',
                                },
                              ]}
                            >
                              {historyItem.change > 0 ? '+' : ''}
                              {historyItem.change}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  stageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  stageDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  materialCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  historyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#757575',
  },
  historyChange: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StageDetailsModal;
