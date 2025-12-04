import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function ReportsScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            // Fetch data
            const [medications, vitals, appointments] = await Promise.all([
                axios.get('/medications'),
                axios.get('/vitals'),
                axios.get('/appointments')
            ]);

            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: Helvetica, sans-serif; padding: 20px; }
                            h1 { color: #1976d2; }
                            h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .header { margin-bottom: 30px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Medicare Health Report</h1>
                            <p><strong>Patient:</strong> ${user?.name}</p>
                            <p><strong>Email:</strong> ${user?.email}</p>
                            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>

                        <h2>Active Medications</h2>
                        <table>
                            <tr>
                                <th>Name</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                            </tr>
                            ${medications.data.map((m: any) => `
                                <tr>
                                    <td>${m.name}</td>
                                    <td>${m.dosage}</td>
                                    <td>${m.frequency}</td>
                                </tr>
                            `).join('')}
                        </table>

                        <h2>Recent Vitals</h2>
                        <table>
                            <tr>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Date</th>
                            </tr>
                            ${vitals.data.slice(0, 10).map((v: any) => `
                                <tr>
                                    <td>${v.type}</td>
                                    <td>${v.type === 'blood_pressure' ? `${v.value.systolic}/${v.value.diastolic}` : v.value.value} ${v.unit}</td>
                                    <td>${new Date(v.recorded_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </table>

                        <h2>Upcoming Appointments</h2>
                        <ul>
                            ${appointments.data.map((a: any) => `
                                <li><strong>${a.doctor_name}</strong> - ${new Date(a.date_time).toLocaleString()}</li>
                            `).join('')}
                        </ul>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error('Failed to generate report', error);
            Alert.alert('Error', 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Reports</Text>
            </View>

            <View style={styles.content}>
                <Ionicons name="document-text-outline" size={100} color="#1976d2" />
                <Text style={styles.description}>
                    Generate a comprehensive health report including your medications, recent vitals, and upcoming appointments.
                    Perfect for sharing with your doctor.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={generateReport}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Generate PDF Report</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 40,
        lineHeight: 24,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#1976d2',
        paddingHorizontal: 30,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
