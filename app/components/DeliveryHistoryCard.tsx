// app/components/DeliveryHistoryCard.tsx (полностью переработанный)
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeliveryHistoryItem } from '../types';

interface DeliveryHistoryCardProps {
  delivery: DeliveryHistoryItem & {
    status?: 'accepted' | 'rejected';
  };
}

const DeliveryHistoryCard: React.FC<DeliveryHistoryCardProps> = ({ delivery }) => {
  const [expandedMaterials, setExpandedMaterials] = useState<{[key: string]: boolean}>({});

  const toggleMaterial = (materialIndex: number) => {
    setExpandedMaterials(prev => ({
      ...prev,
      [materialIndex]: !prev[materialIndex]
    }));
  };

  const isRejected = delivery.status === 'rejected';

  return (
    <View style={[
      styles.card,
      isRejected && styles.rejectedCard
    ]}>
      {/* 0) Статус поставки */}
      {isRejected && (
        <View style={styles.rejectedHeader}>
          <Ionicons name="close-circle" size={16} color="#F44336" />
          <Text style={styles.rejectedText}>Поставка не принята</Text>
        </View>
      )}

      {/* 1) Дата поставки */}
      <Text style={styles.date}>{delivery.date}</Text>
      
      {/* 2-3) Номер накладной */}
      <View style={styles.invoiceRow}>
        <Text style={styles.invoiceLabel}>Номер накладной</Text>
        <Text style={styles.invoiceNumber}>{delivery.invoiceNumber}</Text>
      </View>

      {/* 4-5) Название компании поставщика */}
      <View style={styles.supplierSection}>
        <Text style={styles.supplierLabel}>Название компании поставщика</Text>
        <Text style={styles.supplierName}>{delivery.supplierCompany}</Text>
      </View>

      {/* 6) Материалы заголовок */}
      <Text style={styles.materialsTitle}>Материалы</Text>
      
      {/* 7) Карточки материалов */}
      {delivery.materials.map((material, materialIndex) => (
        <View key={materialIndex} style={styles.materialCard}>
          {/* 7.1) Заголовок карточки материала */}
          <TouchableOpacity 
            style={styles.materialHeader}
            onPress={() => toggleMaterial(materialIndex)}
          >
            <Text style={styles.materialNumber}>Материал №{materialIndex + 1}</Text>
            <Ionicons 
              name={expandedMaterials[materialIndex] ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#757575" 
            />
          </TouchableOpacity>
          
          {/* 7.2-7.5) Раскрытое содержимое карточки материала */}
          {expandedMaterials[materialIndex] && (
            <View style={styles.materialContent}>
              {/* 7.2-7.3) Название и количество */}
              <View style={styles.materialRow}>
                <View style={styles.materialColumn}>
                  <Text style={styles.materialLabel}>Название</Text>
                  <Text style={styles.materialValue}>{material.name}</Text>
                </View>
                <View style={styles.materialColumn}>
                  <Text style={styles.materialLabel}>Количество</Text>
                  <Text style={styles.materialValue}>{material.quantity}</Text>
                </View>
              </View>
              
              {/* 7.4-7.5) Серийный номер и документ */}
              <View style={styles.materialRow}>
                <View style={styles.materialColumn}>
                  <Text style={styles.materialLabel}>Серийный номер</Text>
                  <Text style={styles.materialValue}>
                    {material.serialNumber || 'Не указан'}
                  </Text>
                </View>
                <View style={styles.materialColumn}>
                  <Text style={styles.materialLabel}>Документ</Text>
                  <Text style={styles.materialValue}>
                    {material.document || 'Не прикреплен'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      ))}

      {/* 8) Дополнительные поля заголовок */}
      <Text style={styles.additionalTitle}>Дополнительные поля</Text>
      
      {/* 9-10) Состояние упаковки */}
      <View style={styles.additionalRow}>
        <Text style={styles.additionalLabel}>Состояние упаковки</Text>
        <Text style={styles.additionalValue}>{delivery.packagingCondition}</Text>
      </View>

      {/* 11-12) Комментарий (только для отклоненных поставок) */}
      {isRejected && delivery.comment && (
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Комментарий</Text>
          <Text style={styles.commentValue}>{delivery.comment}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectedCard: {
    borderLeftColor: '#F44336',
    backgroundColor: '#FFF',
  },
  rejectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  rejectedText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
    marginLeft: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  invoiceLabel: {
    fontSize: 14,
    color: '#757575',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
  },
  supplierSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  supplierLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
  },
  materialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  materialCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  materialNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
  },
  materialContent: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  materialRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  materialColumn: {
    flex: 1,
    marginRight: 12,
  },
  materialLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  materialValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 16,
    marginBottom: 12,
  },
  additionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  additionalLabel: {
    fontSize: 14,
    color: '#757575',
  },
  additionalValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  commentSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  commentLabel: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentValue: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

export default DeliveryHistoryCard;