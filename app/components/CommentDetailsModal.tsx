// app/components/CommentDetailsModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Violation } from '../types';

interface CommentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  violation: Violation | null;
  onFixPress?: () => void;
  userIsOnSite?: boolean;
}

const CommentDetailsModal: React.FC<CommentDetailsModalProps> = ({
  visible,
  onClose,
  violation,
  onFixPress,
  userIsOnSite = false
}) => {
  const { getThemeColor, userRole } = useUser();
  const themeColor = getThemeColor();

  if (!violation) return null;

  const isContractor = userRole === 'Подрядчик';
  const isStopViolation = violation.requiresStop;

  // Кнопка "Исправить" активна только если пользователь на объекте
  const canFix = userIsOnSite;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Шапка */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {violation.isViolation ? 'Нарушение' : 'Замечание'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          <View style={styles.content}>
            {/* Замечание/Нарушение */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {violation.isViolation ? 'Нарушение' : 'Замечание'}
              </Text>
              <Text style={[
                styles.descriptionText,
                isStopViolation && styles.descriptionTextDanger
              ]}>
                {violation.comment}
              </Text>
            </View>

            {/* Категория, Вид, Тип */}
            <View style={styles.section}>
              <View style={styles.typeRow}>
                <View style={styles.typeColumn}>
                  <Text style={styles.fieldLabel}>Категория</Text>
                  <Text style={styles.fieldValue}>{violation.category}</Text>
                </View>
                <View style={styles.typeColumn}>
                  <Text style={styles.fieldLabel}>Вид</Text>
                  <Text style={styles.fieldValue}>{violation.type}</Text>
                </View>
                <View style={styles.typeColumn}>
                  <Text style={styles.fieldLabel}>Тип</Text>
                  <Text style={styles.fieldValue}>{violation.subType}</Text>
                </View>
              </View>
            </View>

            {/* Срок устранения */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Срок устранения</Text>
              <Text style={[
                styles.fieldValue,
                isStopViolation && styles.deadlineValueDanger
              ]}>
                {violation.deadline}
              </Text>
            </View>

            {/* Примечание (приложенные файлы) */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Примечание (приложенные файлы)</Text>
              <TouchableOpacity style={styles.attachmentLink}>
                <Text style={styles.attachmentLinkText}>Фото №1.jpg</Text>
                <Ionicons name="open-outline" size={16} color="#6B79ED" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Дата и Остановочное */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.fieldLabel}>Дата</Text>
                  <Text style={styles.fieldValue}>{violation.dateRecorded}</Text>
                </View>
                <View style={styles.infoColumnRight}>
                  <Text style={styles.fieldLabel}>Остановочное</Text>
                  <Text style={[
                    styles.fieldValue,
                    isStopViolation && styles.stopValueDanger
                  ]}>
                    {violation.requiresStop ? 'Да' : 'Нет'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Выдано и В присутствии */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.fieldLabel}>Выдано</Text>
                  <Text style={styles.fieldValue}>{violation.issuedBy}</Text>
                </View>
                <View style={styles.infoColumnRight}>
                  <Text style={styles.fieldLabel}>В присутствии</Text>
                  <Text style={styles.fieldValue}>{violation.presenceOf}</Text>
                </View>
              </View>
            </View>

            {/* Этап работ */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Этап работ</Text>
              <View style={styles.stageValueContainer}>
                <View style={[styles.stageCircle, { backgroundColor: themeColor }]}>
                  <Text style={styles.stageNumber}>{violation.stage.number}</Text>
                </View>
                <Text style={styles.stageDescription}>{violation.stage.description}</Text>
              </View>
            </View>

            {/* Кнопка "Исправить" для подрядчика */}
            {isContractor && onFixPress && (
              <>
                <TouchableOpacity
                  style={[
                    styles.fixButton,
                    { backgroundColor: canFix ? '#FF7A00' : '#BDBDBD' }
                  ]}
                  onPress={canFix ? onFixPress : undefined}
                  disabled={!canFix}
                >
                  <Text style={styles.fixButtonText}>
                    {canFix ? 'Исправить' : 'Недоступно (не на объекте)'}
                  </Text>
                </TouchableOpacity>
                {!canFix && (
                  <Text style={styles.locationWarning}>
                    Для исправления необходимо находиться на объекте
                  </Text>
                )}
              </>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
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
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  descriptionTextDanger: {
    color: '#D32F2F',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#757575',
  },
  deadlineValueDanger: {
    color: '#D32F2F',
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  infoColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stopValueDanger: {
    color: '#D32F2F',
    fontWeight: '600',
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
  fixButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  fixButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationWarning: {
    color: '#F44336',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default CommentDetailsModal;
