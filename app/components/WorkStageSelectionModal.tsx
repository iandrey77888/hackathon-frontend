// app/components/WorkStageSelectionModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

interface WorkStage {
  id: number;
  name: string;
  description?: string;
}

interface WorkStageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (stageId: number) => void;
  stages: any[]; // Принимаем active_jobs напрямую из API
}

const WorkStageSelectionModal: React.FC<WorkStageSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  stages
}) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  // Логируем stages при изменении
  React.useEffect(() => {
    if (visible && stages) {
      console.log('=== WorkStageSelectionModal: Received stages ===');
      console.log('Number of stages:', stages.length);
      stages.forEach((stage, index) => {
        console.log(`Stage ${index}:`, {
          id: stage.id,
          id_type: typeof stage.id,
          name: stage.name,
          description: stage.description
        });
      });
    }
  }, [visible, stages]);

  const handleStagePress = (stage: any) => {
    console.log('=== WorkStageSelectionModal: Stage pressed ===');
    console.log('Stage object:', stage);
    console.log('Stage job.id:', stage.id, 'Type:', typeof stage.id);
    console.log('Stage stage_id:', stage.stage_id, 'Type:', typeof stage.stage_id);

    // ВАЖНО: используем stage_id (ID этапа работ), а не id (ID работы)
    const stageId = typeof stage.stage_id === 'number' ? stage.stage_id : parseInt(stage.stage_id);
    console.log('Setting selected stage_id for sitestage_id:', stageId);
    setSelectedStageId(stageId);
  };

  const handleSelect = () => {
    if (selectedStageId !== null) {
      console.log('=== WorkStageSelectionModal: Calling onSelect with ID:', selectedStageId);
      onSelect(selectedStageId);
    }
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
          <Text style={styles.headerTitle}>Выберите этап работ</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          <View style={styles.content}>
            <Text style={styles.description}>
              Выберите активный этап работ для привязки поставки
            </Text>

            {stages.length > 0 ? (
              stages.map((stage, index) => (
                <TouchableOpacity
                  key={stage.id || index}
                  style={[
                    styles.stageCard,
                    selectedStageId === stage.stage_id && {
                      borderColor: themeColor,
                      borderWidth: 2,
                      backgroundColor: `${themeColor}10`
                    }
                  ]}
                  onPress={() => handleStagePress(stage)}
                >
                  <View style={styles.stageHeader}>
                    <View style={styles.stageInfo}>
                      <Text style={styles.stageName}>{stage.name}</Text>
                      {stage.description && (
                        <Text style={styles.stageDescription}>{stage.description}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.radioCircle,
                      selectedStageId === stage.stage_id && {
                        borderColor: themeColor,
                        backgroundColor: themeColor
                      }
                    ]}>
                      {selectedStageId === stage.stage_id && (
                        <View style={styles.radioInnerCircle} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noStagesContainer}>
                <Ionicons name="calendar-outline" size={48} color="#E0E0E0" />
                <Text style={styles.noStagesText}>Нет активных этапов работ</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: selectedStageId !== null ? themeColor : '#E0E0E0' }
            ]}
            onPress={handleSelect}
            disabled={selectedStageId === null}
          >
            <Text style={[
              styles.confirmButtonText,
              { color: selectedStageId !== null ? '#FFFFFF' : '#9E9E9E' }
            ]}>
              Продолжить
            </Text>
          </TouchableOpacity>
        </View>
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
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
    lineHeight: 20,
  },
  stageCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageInfo: {
    flex: 1,
    marginRight: 12,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 18,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  noStagesContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  noStagesText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkStageSelectionModal;
