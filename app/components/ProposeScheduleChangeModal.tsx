// app/components/ProposeScheduleChangeModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useUser } from '../contexts/UserContext';

interface ProposeScheduleChangeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (changeData: any) => void;
  activeJobs: any[];
}

const ProposeScheduleChangeModal: React.FC<ProposeScheduleChangeModalProps> = ({
  visible,
  onClose,
  onSubmit,
  activeJobs = []
}) => {
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  const [selectedJob, setSelectedJob] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Форматируем дату для отображения
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Получаем информацию о выбранной работе
  const getSelectedJobInfo = () => {
    if (!selectedJob) return null;
    const job = activeJobs.find(j =>
      `${j.stage_seq || j.seq || ''}.${j.seq || ''} - ${j.name}` === selectedJob ||
      j.name === selectedJob
    );
    return job;
  };

  const handleSubmit = () => {
    if (!selectedJob) {
      Alert.alert('Ошибка', 'Выберите этап работ');
      return;
    }

    if (!newEndDate.trim()) {
      Alert.alert('Ошибка', 'Введите новую дату окончания');
      return;
    }

    const selectedJobInfo = getSelectedJobInfo();

    onSubmit({
      job: selectedJobInfo,
      newEndDate,
      comment,
    });

    // Сбрасываем форму
    setSelectedJob('');
    setNewEndDate('');
    setComment('');
    setShowJobDropdown(false);
  };

  const handleClose = () => {
    setSelectedJob('');
    setNewEndDate('');
    setComment('');
    setShowJobDropdown(false);
    setShowCalendar(false);
    onClose();
  };

  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    const formatted = formatDateForDisplay(selectedDate.toISOString());
    setNewEndDate(formatted);
    setShowCalendar(false);
  };

  const selectedJobInfo = getSelectedJobInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Шапка */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Ionicons name="arrow-back" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Предложение изменения графика</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          {/* Выбор этапа работ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Этап работ</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowJobDropdown(!showJobDropdown)}
            >
              <Text style={[styles.dropdownText, !selectedJob && styles.placeholderText]}>
                {selectedJob || 'Выберите этап работ...'}
              </Text>
              <Ionicons
                name={showJobDropdown ? "chevron-up-outline" : "chevron-down-outline"}
                size={16}
                color="#757575"
              />
            </TouchableOpacity>

            {showJobDropdown && (
              <View style={styles.dropdownList}>
                {activeJobs.map((job, index) => {
                  const jobLabel = `${job.stage_seq || job.seq || (index + 1)}.${job.seq || (index + 1)} - ${job.name}`;
                  return (
                    <TouchableOpacity
                      key={job.id || index}
                      style={[
                        styles.dropdownItem,
                        selectedJob === jobLabel && { backgroundColor: `${themeColor}20` }
                      ]}
                      onPress={() => {
                        setSelectedJob(jobLabel);
                        setShowJobDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedJob === jobLabel && { color: themeColor, fontWeight: '500' }
                      ]}>
                        {jobLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Отображение текущей даты начала и окончания */}
          {selectedJobInfo && (
            <View style={styles.section}>
              <View style={styles.dateRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Дата начала</Text>
                  <Text style={styles.dateValue}>
                    {formatDateForDisplay(selectedJobInfo.start_date)}
                  </Text>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Дата окончания</Text>
                  <Text style={[styles.dateValue, styles.strikethrough]}>
                    {formatDateForDisplay(selectedJobInfo.end_date)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Новая дата окончания */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Дата окончания</Text>
            <TouchableOpacity
              style={styles.dateInputContainer}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <View style={styles.dateInput}>
                <Text style={[styles.dateInputText, !newEndDate && styles.placeholderText]}>
                  {newEndDate || '27 августа 2025'}
                </Text>
              </View>
              <View style={styles.calendarButton}>
                <Ionicons name="calendar-outline" size={20} color={themeColor} />
              </View>
            </TouchableOpacity>
            {newEndDate && (
              <Text style={[styles.newDatePreview, { color: '#FF7A00' }]}>
                {newEndDate}
              </Text>
            )}

            {/* Календарь */}
            {showCalendar && selectedJobInfo && (
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={handleDateSelect}
                  markedDates={{
                    [newEndDate]: { selected: true, selectedColor: themeColor }
                  }}
                  minDate={selectedJobInfo.start_date}
                  theme={{
                    selectedDayBackgroundColor: themeColor,
                    todayTextColor: themeColor,
                    arrowColor: themeColor,
                  }}
                />
              </View>
            )}
          </View>

          {/* Комментарий */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Комментарий</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Добавьте комментарий к предложению изменения графика ..."
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Кнопка отправки */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#FF7A00' }]}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Предложить изменение</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  placeholderText: {
    color: '#9E9E9E',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#424242',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 14,
    color: '#424242',
  },
  calendarButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  calendarContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  newDatePreview: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#424242',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ProposeScheduleChangeModal;
