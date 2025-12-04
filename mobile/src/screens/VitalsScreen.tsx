import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const VITAL_TYPES = [
    { id: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg' },
    { id: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
    { id: 'glucose', label: 'Blood Glucose', unit: 'mg/dL' },
    { id: 'weight', label: 'Weight', unit: 'kg' },
];

export default function VitalsScreen() {
    const { user } = useAuth();
    const [selectedType, setSelectedType] = useState(VITAL_TYPES[0]);
    const [value1, setValue1] = useState(''); // Systolic or Value
    const [value2, setValue2] = useState(''); // Diastolic (only for BP)
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [selectedType]);

    const fetchLogs = async () => {
        try {
            const response = await axios.get(`/vitals?type=${selectedType.id}`);
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch vitals', error);
        }
    };

    const handleSave = async () => {
        if (!value1) {
            Alert.alert('Error', 'Please enter a value');
            return;
        }

        let value: any = parseFloat(value1);
        if (selectedType.id === 'blood_pressure') {
            if (!value2) {
                Alert.alert('Error', 'Please enter diastolic value');
                return;
            }
            value = { systolic: parseFloat(value1), diastolic: parseFloat(value2) };
        } else {
            value = { value: parseFloat(value1) };
        }

        setLoading(true);
        try {
            await axios.post('/vitals', {
                type: selectedType.id,
                value,
                unit: selectedType.unit,
            });
            setValue1('');
            setValue2('');
            fetchLogs();
            Alert.alert('Success', 'Vital logged successfully');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to log vital');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => {
        let displayValue = '';
        if (selectedType.id === 'blood_pressure') {
            displayValue = `${item.value.systolic}/${item.value.diastolic}`;
        } else {
            displayValue = `${item.value.value}`;
        }

        return (
            <View style={styles.logItem}>
                <View>
                    <Text style={styles.logValue}>{displayValue} <Text style={styles.logUnit}>{item.unit}</Text></Text>
                    <Text style={styles.logDate}>{new Date(item.recorded_at).toLocaleString()}</Text>
                </View>
                <Ionicons name="stats-chart" size={20} color="#1976d2" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Health Vitals</Text>
            </View>

            <View style={styles.typeSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {VITAL_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.typeChip, selectedType.id === type.id && styles.typeChipSelected]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[styles.typeText, selectedType.id === type.id && styles.typeTextSelected]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>New Reading ({selectedType.unit})</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={selectedType.id === 'blood_pressure' ? 'Systolic (120)' : 'Value'}
                        value={value1}
                        onChangeText={setValue1}
                        keyboardType="numeric"
                    />
                    {selectedType.id === 'blood_pressure' && (
                        <>
                            <Text style={styles.separator}>/</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Diastolic (80)"
                                value={value2}
                                onChangeText={setValue2}
                                keyboardType="numeric"
                            />
                        </>
                    )}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>No readings yet</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    typeSelector: {
        paddingVertical: 16,
        paddingHorizontal: 10,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    typeChipSelected: {
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
    },
    typeText: {
        color: '#666',
        fontWeight: '600',
    },
    typeTextSelected: {
        color: '#fff',
    },
    inputSection: {
        padding: 20,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    separator: {
        fontSize: 24,
        color: '#999',
        marginHorizontal: 10,
    },
    addButton: {
        backgroundColor: '#4caf50',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    list: {
        padding: 16,
    },
    logItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    logValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    logUnit: {
        fontSize: 14,
        color: '#666',
        fontWeight: 'normal',
    },
    logDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
    },
});
