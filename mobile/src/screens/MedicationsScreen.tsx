import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Medication {
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    is_active: boolean;
    current_supply: number;
}

export default function MedicationsScreen({ navigation }: any) {
    const { user } = useAuth();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMedications = async () => {
        try {
            const patientId = user?.role === 'patient' ? user.id : 1; // TODO: Handle caregiver view
            const response = await axios.get(`/medications/patient/${patientId}`);
            setMedications(response.data);
        } catch (error) {
            console.error('Failed to load medications:', error);
            Alert.alert('Error', 'Failed to load medications');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMedications();
        }, [])
    );

    const toggleActive = async (id: number, currentStatus: boolean) => {
        try {
            await axios.patch(`/medications/${id}`, { is_active: !currentStatus });
            fetchMedications();
        } catch (error) {
            Alert.alert('Error', 'Failed to update medication');
        }
    };

    const renderMedication = ({ item }: { item: Medication }) => (
        <View style={[styles.card, !item.is_active && styles.inactive]}>
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.medicationName}>{item.name}</Text>
                    {item.current_supply <= 5 && (
                        <View style={styles.lowSupplyBadge}>
                            <Text style={styles.lowSupplyText}>Low Supply</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.medicationDetail}>{item.dosage} • {item.frequency}</Text>
                <Text style={styles.supplyText}>Supply: {item.current_supply} remaining</Text>
            </View>

            <TouchableOpacity
                style={[styles.toggle, item.is_active ? styles.toggleActive : styles.toggleInactive]}
                onPress={() => toggleActive(item.id, item.is_active)}
            >
                <Ionicons
                    name={item.is_active ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={item.is_active ? "#4caf50" : "#9e9e9e"}
                />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#f0f4ff', '#ffffff']}
                style={styles.background}
            />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Medications</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddMedication')}
                    >
                        <LinearGradient
                            colors={['#4c669f', '#3b5998']}
                            style={styles.addButtonGradient}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b5998" />
                    </View>
                ) : (
                    <FlatList
                        data={medications}
                        renderItem={renderMedication}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="medkit-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>No medications added yet</Text>
                                <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#192f6a',
        letterSpacing: -0.5,
    },
    addButton: {
        shadowColor: '#3b5998',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    inactive: {
        opacity: 0.6,
        backgroundColor: '#f8f9fa',
    },
    cardContent: {
        flex: 1,
        marginRight: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    medicationName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginRight: 8,
    },
    medicationDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        fontWeight: '500',
    },
    supplyText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    lowSupplyBadge: {
        backgroundColor: '#ffebee',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    lowSupplyText: {
        color: '#d32f2f',
        fontSize: 10,
        fontWeight: '700',
    },
    toggle: {
        padding: 8,
        borderRadius: 20,
    },
    toggleActive: {
        // handled by icon color
    },
    toggleInactive: {
        // handled by icon color
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
    },
});
