// app/components/WorkScheduleCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

interface WorkScheduleCardProps {
  job: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    stage_seq?: number;
    seq?: number;
    kpgz?: string;
    volume?: number;
    measurement?: string;
  };
  index: number;
  onDetailsPress?: (jobId: number) => void;
}

const WorkScheduleCard: React.FC<WorkScheduleCardProps> = ({ job, index, onDetailsPress }) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  // Форматируем даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Получаем номер работы
  const getJobNumber = () => {
    if (job.stage_seq && job.seq) {
      return `${job.stage_seq}.${job.seq}`;
    }
    return job.seq || index + 1;
  };

  return (
    <View style={styles.card}>
      {/* Заголовок с номером работы */}
      <View style={styles.headerRow}>
        <View style={[styles.numberBadge, { backgroundColor: themeColor }]}>
          <Text style={styles.numberText}>{getJobNumber()}</Text>
        </View>
        <Text style={styles.categoryText}>Ремонт АБП</Text>
      </View>

      {/* Название работы */}
      <Text style={styles.jobTitle}>{job.name}</Text>

      {/* Даты начала и окончания */}
      <View style={styles.datesRow}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Дата начала</Text>
          <Text style={styles.dateValue}>{formatDate(job.start_date)}</Text>
        </View>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Дата окончания</Text>
          <Text style={styles.dateValue}>{formatDate(job.end_date)}</Text>
        </View>
      </View>

      {/* КПГЗ */}
      {job.kpgz && (
        <View style={styles.kpgzRow}>
          <Text style={styles.kpgzLabel}>КПГЗ</Text>
          <Text style={styles.kpgzValue}>{job.kpgz}</Text>
        </View>
      )}

      {/* Кнопка "Подробнее" */}
      <TouchableOpacity
        style={[styles.detailsButton, { backgroundColor: themeColor }]}
        onPress={() => onDetailsPress?.(job.id)}
      >
        <Text style={styles.detailsButtonText}>Подробнее</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 16,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
  },
  kpgzRow: {
    marginBottom: 16,
  },
  kpgzLabel: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  kpgzValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
  },
  detailsButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default WorkScheduleCard;
