// app/components/ViolationNoteCard.tsx (обновленная)
import { Ionicons } from '@expo/vector-icons';
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

  // Определяем, является ли это остановочным нарушением или остановочным замечанием
  const isStopViolation = violation.requiresStop;

  // Проверяем статус исправления
  const isAccepted = violation.state === 1; // Принято
  const hasPendingFix = violation.hasPendingFix && violation.state !== 1; // Отправлено на проверку

  return (
    <View style={[
      styles.card,
      isStopViolation && styles.stopViolationCard,
      isAccepted && styles.acceptedCard // Зеленый фон для принятых
    ]}>
      {/* Зеленый алерт для принятых нарушений/замечаний */}
      {isAccepted && (
        <View style={styles.acceptedBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.acceptedBannerText}>Исправление принято</Text>
        </View>
      )}

      {/* Желтый алерт для нарушений с непросмотренным исправлением */}
      {hasPendingFix && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time-outline" size={16} color="#FF9800" />
          <Text style={styles.pendingBannerText}>Отправлено на проверку</Text>
        </View>
      )}

      {/* Заголовок */}
      <Text style={[
        styles.headerTitle,
        isStopViolation && styles.headerTitleDanger
      ]}>
        {violation.isViolation ? 'Нарушение' : 'Замечание'}
      </Text>

      {/* Описание нарушения/замечания */}
      <Text style={[
        styles.descriptionText,
        isStopViolation && styles.descriptionTextDanger
      ]}>
        {violation.comment}
      </Text>

      {/* Три колонки: Категория, Вид, Тип */}
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

      {/* Срок устранения */}
      <View style={styles.deadlineContainer}>
        <Text style={styles.sectionLabel}>Срок устранения</Text>
        <Text style={[
          styles.deadlineValue,
          isStopViolation && styles.deadlineValueDanger
        ]}>
          {violation.deadline}
        </Text>
      </View>

      {/* Примечание (приложенные файлы) */}
      <View style={styles.attachmentContainer}>
        <Text style={styles.sectionLabel}>Примечание (приложенные файлы)</Text>
        <TouchableOpacity style={styles.attachmentLink}>
          <Text style={styles.attachmentLinkText}>Фото №1.jpg</Text>
          <Ionicons name="open-outline" size={16} color="#6B79ED" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Дата и Остановочное */}
      <View style={styles.dateStopRow}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>Дата</Text>
          <Text style={styles.infoValue}>{violation.dateRecorded}</Text>
        </View>
        <View style={styles.infoColumnRight}>
          <Text style={styles.infoLabel}>Остановочное</Text>
          <Text style={[
            styles.infoValue,
            isStopViolation && styles.infoValueDanger
          ]}>
            {violation.requiresStop ? 'Да' : 'Нет'}
          </Text>
        </View>
      </View>

      {/* Выдано и В присутствии */}
      <View style={styles.issuedPresenceRow}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>Выдано</Text>
          <Text style={styles.infoValue}>{violation.issuedBy}</Text>
        </View>
        <View style={styles.infoColumnRight}>
          <Text style={styles.infoLabel}>В присутствии</Text>
          <Text style={styles.infoValue}>{violation.presenceOf}</Text>
        </View>
      </View>

      {/* Этап работ */}
      <View style={styles.stageContainer}>
        <Text style={styles.sectionLabel}>Этап работ</Text>
        <View style={styles.stageValueContainer}>
          <View style={[styles.stageCircle, { backgroundColor: themeColor }]}>
            <Text style={styles.stageNumber}>{violation.stage.number}</Text>
          </View>
          <Text style={styles.stageDescription}>{violation.stage.description}</Text>
        </View>
      </View>

      {/* Кнопка "Подробнее" */}
      <TouchableOpacity
        style={[styles.detailsButton, { backgroundColor: themeColor }]}
        onPress={() => onAccept(violation.id)}
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
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stopViolationCard: {
    backgroundColor: '#FFEBEE',
  },
  acceptedCard: {
    backgroundColor: '#E8F5E9', // Зеленый фон для принятых
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 16,
    padding: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
  },
  acceptedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 6,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0B2',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 16,
    padding: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FF9800',
  },
  pendingBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
    marginLeft: 6,
  },
  fixedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 16,
    padding: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fixedBannerText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4CAF50',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  headerTitleDanger: {
    color: '#D32F2F',
  },
  descriptionText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 16,
  },
  descriptionTextDanger: {
    color: '#D32F2F',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeColumn: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  typeValue: {
    fontSize: 14,
    color: '#757575',
  },
  deadlineContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  deadlineValue: {
    fontSize: 14,
    color: '#757575',
  },
  deadlineValueDanger: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  attachmentContainer: {
    marginBottom: 16,
  },
  attachmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attachmentLinkText: {
    fontSize: 14,
    color: '#6B79ED',
    marginRight: 4,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  dateStopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoColumn: {
    flex: 1,
  },
  infoColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#757575',
  },
  infoValueDanger: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  issuedPresenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stageContainer: {
    marginBottom: 16,
  },
  stageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stageDescription: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  detailsButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ViolationNoteCard;