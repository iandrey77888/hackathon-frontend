// app/components/WarehouseCard.tsx (полностью переписанный)
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WarehouseMaterial } from '../types';

interface WarehouseCardProps {
  material: WarehouseMaterial;
}

const WarehouseCard: React.FC<WarehouseCardProps> = ({ material }) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const toggleHistory = () => {
    setIsHistoryExpanded(!isHistoryExpanded);
  };

  const formatNumber = (value: number): string => {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : value.toString();
  };

  const getChangeColor = (value: number): string => {
    return value >= 0 ? '#4CAF50' : '#F44336';
  };

  return (
    <View style={styles.card}>
      {/* Название материала */}
      <Text style={styles.materialName}>{material.name}</Text>

      {/* Остаток, Использовано, Всего */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Остаток</Text>
          <Text style={styles.statValue}>{material.balance} {material.unit}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Использовано</Text>
          <Text style={styles.statValue}>{material.used} {material.unit}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Всего</Text>
          <Text style={styles.statValue}>{material.total} {material.unit}</Text>
        </View>
      </View>

      {/* История изменений */}
      <TouchableOpacity style={styles.expandHeader} onPress={toggleHistory}>
        <Text style={styles.sectionTitle}>История изменений</Text>
        <Text style={styles.expandIcon}>{isHistoryExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isHistoryExpanded && (
        <View style={styles.historyList}>
          {material.history.map((item, index) => (
            <View key={item.id}>
              <View style={styles.historyItem}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.workDescription}>{item.workDescription}</Text>
                
                {/* Использование за день */}
                {item.usedAmount !== 0 && (
                  <View style={styles.usageRow}>
                    <Text style={[styles.usageAmount, { color: getChangeColor(-item.usedAmount) }]}>
                      {formatNumber(-item.usedAmount)} {material.unit}
                    </Text>
                  </View>
                )}
                
                {/* Ежедневная поставка */}
                {item.deliveryAmount !== 0 && (
                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Ежедневная поставка</Text>
                    <Text style={[styles.deliveryAmount, { color: getChangeColor(item.deliveryAmount) }]}>
                      {formatNumber(item.deliveryAmount)} {material.unit}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Разделитель между элементами истории (кроме последнего) */}
              {index < material.history.length - 1 && (
                <View style={styles.historyDivider} />
              )}
            </View>
          ))}
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
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  materialName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    paddingVertical: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  workDescription: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    lineHeight: 20,
  },
  usageRow: {
    marginBottom: 8,
  },
  usageAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  deliveryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
});

export default WarehouseCard;