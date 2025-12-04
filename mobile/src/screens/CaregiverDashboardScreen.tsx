import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Patient {
    id: number;
    name: string;
    email: string;
    adherence?: number; // Calculated on frontend or backend
}

export default function CaregiverDashboardScreen({ navigation }: any) {
    const { user, logout } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [patientsRes, notificationsRes] = await Promise.all([
                axios.get('/auth/linked-patients'),
                axios.get('/notifications')
            ]);
            setPatients(patientsRes.data);
            setNotifications(notificationsRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const sosAlerts = notifications.filter(n => n.type === 'sos' && !n.read_at);

    const handleDismissAlert = async (id: number) => {
        try {
            await axios.post(`/notifications/${id}/read`);
            fetchData();
        } catch (error) {
            console.error('Failed to dismiss alert', error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Caregiver Portal</Text>
                        <Text style={styles.name}>{user?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {sosAlerts.length > 0 && (
                    <View style={styles.alertSection}>
                        <Text style={styles.alertTitle}>🚨 EMERGENCY ALERTS</Text>
                        {sosAlerts.map(alert => (
                            <View key={alert.id} style={styles.alertCard}>
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertBody}>{alert.body}</Text>
                                    <Text style={styles.alertTime}>{new Date(alert.sent_at).toLocaleString()}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.dismissButton}
                                    onPress={() => handleDismissAlert(alert.id)}
                                >
                                    <Text style={styles.dismissText}>Dismiss</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Patients</Text>
                    {patients.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No patients linked yet</Text>
                            <Text style={styles.emptySubtext}>Link a patient to see their status</Text>
                        </View>
                    ) : (
                        patients.map((patient, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.card}
                                onPress={() => (navigation as any).navigate('PatientDetail', { patient })}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.patientName}>{patient.name}</Text>
                                        <Text style={styles.patientEmail}>{patient.email}</Text>
                                    </View>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>95%</Text>
                                        <Text style={styles.statLabel}>Adherence</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>0</Text>
                                        <Text style={styles.statLabel}>Missed</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    greeting: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    patientName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    patientEmail: {
        fontSize: 14,
        color: '#666',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 16,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
    },
    alertSection: {
        marginBottom: 24,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 12,
    },
    alertCard: {
        backgroundColor: '#ffebee',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#d32f2f',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    alertContent: {
        flex: 1,
        marginRight: 12,
    },
    alertBody: {
        fontSize: 16,
        color: '#c62828',
        fontWeight: '600',
        marginBottom: 4,
    },
    alertTime: {
        fontSize: 12,
        color: '#ef5350',
    },
    dismissButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ef5350',
    },
    dismissText: {
        fontSize: 12,
        color: '#d32f2f',
        fontWeight: '600',
    },
});
