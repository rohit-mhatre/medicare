import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface ScheduleItem {
    medication_id: number;
    name: string;
    dosage: string;
    scheduled_time: string;
    schedule_id: number;
    status: 'taken' | 'missed' | 'skipped' | 'upcoming' | null;
    actual_datetime: string | null;
}

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSchedule = async () => {
        try {
            const patientId = user?.role === 'patient' ? user.id : 1; // TODO: Handle caregiver view
            const response = await axios.get(`/medications/patient/${patientId}/schedule/today`);
            setSchedule(response.data);
        } catch (error) {
            console.error('Failed to load schedule:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSchedule();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchedule();
    };

    const handleLogDose = async (item: ScheduleItem, status: 'taken' | 'skipped') => {
        try {
            await axios.post('/dose-logs', {
                medicationId: item.medication_id,
                scheduleId: item.schedule_id,
                scheduledDatetime: new Date().toISOString(), // Simplified for demo
                status,
            });
            fetchSchedule();
        } catch (error) {
            console.error('Failed to log dose:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#f0f4ff', '#ffffff']}
                style={styles.background}
            />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.name}>{user?.name}</Text>
                        </View>
                        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                            <Ionicons name="log-out-outline" size={24} color="#192f6a" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        {schedule.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>No medications scheduled</Text>
                            </View>
                        ) : (
                            schedule.map((item, index) => (
                                <View key={index} style={styles.card}>
                                    <View style={styles.timeContainer}>
                                        <Text style={styles.time}>{item.scheduled_time.slice(0, 5)}</Text>
                                        <View style={styles.timelineLine} />
                                    </View>

                                    <View style={styles.cardContent}>
                                        <View style={styles.medHeader}>
                                            <Text style={styles.medName}>{item.name}</Text>
                                            <Text style={styles.medDosage}>{item.dosage}</Text>
                                        </View>

                                        {item.status ? (
                                            <View style={[styles.statusBadge,
                                            item.status === 'taken' ? styles.statusTaken :
                                                item.status === 'skipped' ? styles.statusSkipped : styles.statusMissed
                                            ]}>
                                                <Ionicons
                                                    name={item.status === 'taken' ? "checkmark" : item.status === 'skipped' ? "remove" : "alert"}
                                                    size={14}
                                                    color={item.status === 'taken' ? "#2e7d32" : item.status === 'skipped' ? "#ef6c00" : "#c62828"}
                                                />
                                                <Text style={[styles.statusText,
                                                item.status === 'taken' ? styles.textTaken :
                                                    item.status === 'skipped' ? styles.textSkipped : styles.textMissed
                                                ]}>
                                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                </Text>
                                            </View>
                                        ) : (
                                            <View style={styles.actions}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.skipButton]}
                                                    onPress={() => handleLogDose(item, 'skipped')}
                                                >
                                                    <Text style={styles.skipButtonText}>Skip</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.takeButton]}
                                                    onPress={() => handleLogDose(item, 'taken')}
                                                >
                                                    <LinearGradient
                                                        colors={['#4c669f', '#3b5998']}
                                                        style={styles.gradientButton}
                                                    >
                                                        <Text style={styles.takeButtonText}>Take</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
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
    content: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    greeting: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500',
    },
    name: {
        fontSize: 32,
        fontWeight: '800',
        color: '#192f6a',
        letterSpacing: -0.5,
    },
    logoutButton: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        color: '#333',
    },
    card: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timeContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 50,
    },
    time: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3b5998',
        marginBottom: 8,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#e0e0e0',
        borderRadius: 1,
    },
    cardContent: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    medHeader: {
        marginBottom: 12,
    },
    medName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    medDosage: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionButton: {
        borderRadius: 12,
        minWidth: 80,
        overflow: 'hidden',
    },
    skipButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 10,
        alignItems: 'center',
    },
    takeButton: {
        // Gradient handled inside
    },
    gradientButton: {
        paddingVertical: 10,
        alignItems: 'center',
        width: '100%',
    },
    takeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    skipButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    statusTaken: { backgroundColor: '#e8f5e9' },
    statusSkipped: { backgroundColor: '#fff3e0' },
    statusMissed: { backgroundColor: '#ffebee' },
    textTaken: { color: '#2e7d32' },
    textSkipped: { color: '#ef6c00' },
    textMissed: { color: '#c62828' },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#eee',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginTop: 12,
    },
});
