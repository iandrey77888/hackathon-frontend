// app/components/ViolationNoteCard.tsx (обновленная)
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Violation } from '../types';

interface ViolationNoteCardProps {
  violation: Violation;
  onAccept: (violationId: string) => void;
}

const ViolationNoteCard: React.FC<ViolationNoteCardProps> = ({ violation, onAccept }) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  return (
    <View style={[
      styles.card,
      violation.requiresStop && styles.stopViolationCard // Изменяем условие на requiresStop
    ]}>
      <Text style={styles.title}>
        {violation.isViolation ? 'Нарушение' : 'Замечание'}
      </Text>
      
      <View style={styles.typeRow}>
        <View style={styles.typeColumn}>
          <Text style={styles.typeLabel}>Категория</Text>
          <Text style={styles.typeValue}>{violation.category}</Text>
        </View>
        <View style={styles.typeColumn}>
          <Text style={styles.typeLabel}>Вид</Text>
          <Text style={styles.typeValue}>{violation.type}</Text>
        </View>
        <View style={styles.typeColumn}>
          <Text style={styles.typeLabel}>Тип</Text>
          <Text style={styles.typeValue}>{violation.subType}</Text>
        </View>
      </View>

      <View style={styles.deadlineContainer}>
        <Text style={styles.deadlineLabel}>Срок устранения</Text>
        <Text style={styles.deadlineValue}>{violation.deadline}</Text>
      </View>

      <View style={styles.commentContainer}>
        <Text style={styles.commentLabel}>Примечание</Text>
        <Text style={styles.commentValue}>{violation.comment}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.dateStopRow}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Дата</Text>
          <Text style={styles.dateValue}>{violation.dateRecorded}</Text>
        </View>
        <View style={styles.stopColumn}>
          <Text style={styles.stopLabel}>Остановочное</Text>
          <Text style={[
            styles.stopValue,
            violation.requiresStop && styles.stopValueHighlight // Выделяем красным если остановочное
          ]}>
            {violation.requiresStop ? 'Да' : 'Нет'}
          </Text>
        </View>
      </View>

      <View style={styles.issuedPresenceRow}>
        <View style={styles.issuedColumn}>
          <Text style={styles.issuedLabel}>Выдано</Text>
          <Text style={styles.issuedValue}>{violation.issuedBy}</Text>
        </View>
        <View style={styles.presenceColumn}>
          <Text style={styles.presenceLabel}>В присутствии</Text>
          <Text style={styles.presenceValue}>{violation.presenceOf}</Text>
        </View>
      </View>

      <View style={styles.stageContainer}>
        <Text style={styles.stageLabel}>Этап работ</Text>
        <Text style={styles.stageValue}>
          {violation.stage.number}. {violation.stage.description}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.acceptButton, { backgroundColor: themeColor }]}
        onPress={() => onAccept(violation.id)}
      >
        <Text style={styles.acceptButtonText}>Принять исправление</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  stopViolationCard: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  typeValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  deadlineContainer: {
    marginBottom: 12,
  },
  deadlineLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  deadlineValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  commentContainer: {
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  commentValue: {
    fontSize: 14,
    color: '#424242',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  dateStopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  stopColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stopLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  stopValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  stopValueHighlight: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  issuedPresenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  issuedColumn: {
    flex: 1,
  },
  issuedLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  issuedValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  presenceColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  presenceLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  presenceValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  stageContainer: {
    marginBottom: 16,
  },
  stageLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  stageValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ViolationNoteCard;