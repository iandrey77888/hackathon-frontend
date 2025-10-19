// app/components/ProcessFixModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Violation } from '../types';

interface ProcessFixModalProps {
  visible: boolean;
  onClose: () => void;
  violation: Violation | null;
  onAccept: () => void;
  onReject: () => void;
}

const ProcessFixModal: React.FC<ProcessFixModalProps> = ({
  visible,
  onClose,
  violation,
  onAccept,
  onReject
}) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  if (!violation) return null;

  // Определяем, является ли это нарушением
  const isViolation = violation.isViolation || violation.category === 'Нарушение';
  const title = isViolation ? 'Исправление' : 'Исправление';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Комментарий исправления */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Комментарий</Text>
            <Text style={styles.sectionValue}>
              {violation.fixComment || 'Устранены указанные проблемы'}
            </Text>
          </View>

          {/* Примечание (приложенные файлы) */}
          {violation.fixDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Примечание (приложенные файлы)</Text>
              <TouchableOpacity style={styles.fileLink}>
                <Ionicons name="image-outline" size={20} color={themeColor} />
                <Text style={[styles.fileLinkText, { color: themeColor }]}>
                  Фото №1.jpg
                </Text>
                <Ionicons name="open-outline" size={16} color={themeColor} />
              </TouchableOpacity>
            </View>
          )}

          {/* Замечание - развернуто */}
          <View style={styles.remarksSection}>
            <TouchableOpacity style={styles.remarksSectionHeader}>
              <Text style={styles.remarksSectionTitle}>Замечание</Text>
              <Ionicons name="chevron-up" size={20} color="#424242" />
            </TouchableOpacity>

            <View style={styles.remarksContent}>
              {/* Категория, Вид, Тип */}
              <View style={styles.threeColumnRow}>
                <View style={styles.threeColumnItem}>
                  <Text style={styles.fieldLabel}>Категория</Text>
                  <Text style={styles.fieldValue}>
                    {violation.category || 'Технология производства'}
                  </Text>
                </View>
                <View style={styles.threeColumnItem}>
                  <Text style={styles.fieldLabel}>Вид</Text>
                  <Text style={styles.fieldValue}>
                    {violation.type || 'Устранимое'}
                  </Text>
                </View>
                <View style={styles.threeColumnItem}>
                  <Text style={styles.fieldLabel}>Тип</Text>
                  <Text style={styles.fieldValue}>
                    {violation.subType || 'Простое'}
                  </Text>
                </View>
              </View>

              {/* Срок устранения */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Срок устранения</Text>
                <Text style={styles.fieldValue}>{violation.deadline}</Text>
              </View>

              {/* Примечание */}
              {violation.fixDate && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Примечание (приложенные файлы)</Text>
                  <TouchableOpacity style={styles.fileLink}>
                    <Ionicons name="image-outline" size={20} color={themeColor} />
                    <Text style={[styles.fileLinkText, { color: themeColor }]}>
                      Фото №1.jpg
                    </Text>
                    <Ionicons name="open-outline" size={16} color={themeColor} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Дата и Остановочное */}
              <View style={styles.twoColumnRow}>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.fieldLabel}>Дата</Text>
                  <Text style={styles.fieldValue}>{violation.fixDate || violation.dateRecorded}</Text>
                </View>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.fieldLabel}>Остановочное</Text>
                  <Text style={styles.fieldValue}>
                    {violation.requiresStop ? 'Нет' : 'Нет'}
                  </Text>
                </View>
              </View>

              {/* Выдано и В присутствии */}
              <View style={styles.twoColumnRow}>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.fieldLabel}>Выдано</Text>
                  <Text style={styles.fieldValue}>
                    {violation.issuedBy}
                  </Text>
                </View>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.fieldLabel}>В присутствии</Text>
                  <Text style={styles.fieldValue}>
                    {violation.presenceOf || 'Нет'}
                  </Text>
                </View>
              </View>

              {/* Этап прораб */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Этап прораб</Text>
                <Text style={styles.fieldValue}>
                  {violation.stage.number} - {violation.stage.description}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: '#4CAF50' }]}
            onPress={onAccept}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Принять</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, { backgroundColor: '#F44336' }]}
            onPress={onReject}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>Отклонить</Text>
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  fileLinkText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  remarksSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  remarksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  remarksSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  remarksContent: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  threeColumnRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  threeColumnItem: {
    flex: 1,
  },
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  twoColumnItem: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProcessFixModal;
