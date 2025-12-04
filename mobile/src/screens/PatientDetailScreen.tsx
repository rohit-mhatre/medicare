import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PatientDetailScreen({ route, navigation }: any) {
    const { patient } = route.params;
    const [activeTab, setActiveTab] = useState<'medications' | 'vitals' | 'appointments'>('medications');
    const [medications, setMedications] = useState<any[]>([]);
    const [vitals, setVitals] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Appointment Form
    const [modalVisible, setModalVisible] = useState(false);
    const [doctorName, setDoctorName] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'medications') {
                const response = await axios.get(`/medications?userId=${patient.id}`);
                setMedications(response.data);
            } else if (activeTab === 'vitals') {
                const response = await axios.get(`/vitals?userId=${patient.id}`);
                setVitals(response.data);
            } else if (activeTab === 'appointments') {
                const response = await axios.get(`/appointments?userId=${patient.id}`);
                setAppointments(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMedication = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]}>
                    <Text style={[styles.statusText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
            <Text style={styles.cardDetail}>{item.dosage} • {item.frequency}</Text>
            <Text style={styles.cardDetail}>Supply: {item.current_supply} left</Text>
        </View>
    );

    const renderVital = ({ item }: any) => {
        let displayValue = '';
        if (item.type === 'blood_pressure') {
            displayValue = `${item.value.systolic}/${item.value.diastolic}`;
        } else {
            displayValue = `${item.value.value}`;
        }

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.cardDate}>{new Date(item.recorded_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.vitalValue}>{displayValue} <Text style={styles.vitalUnit}>{item.unit}</Text></Text>
            </View>
        );
    };

    const renderAppointment = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.doctor_name}</Text>
                <Text style={styles.cardDate}>
                    {new Date(item.date_time).toLocaleDateString()} {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <Text style={styles.cardDetail}>{item.location}</Text>
            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        </View>
    );

    const handleAddAppointment = async () => {
        if (!doctorName) return;
        try {
            await axios.post('/appointments', {
                doctorName,
                location,
                notes,
                dateTime: date.toISOString(),
                patientId: patient.id
            });
            setModalVisible(false);
            fetchData();
            Alert.alert('Success', 'Appointment added');
        } catch (error) {
            Alert.alert('Error', 'Failed to add appointment');
        }
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            const [medsRes, vitalsRes, apptsRes] = await Promise.all([
                axios.get(`/medications?userId=${patient.id}`),
                axios.get(`/vitals?userId=${patient.id}`),
                axios.get(`/appointments?userId=${patient.id}`)
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
                        </style>
                    </head>
                    <body>
                        <h1>Health Report: ${patient.name}</h1>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>

                        <h2>Medications</h2>
                        <table>
                            <tr><th>Name</th><th>Dosage</th><th>Frequency</th></tr>
                            ${medsRes.data.map((m: any) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td></tr>`).join('')}
                        </table>

                        <h2>Vitals (Recent)</h2>
                        <table>
                            <tr><th>Type</th><th>Value</th><th>Date</th></tr>
                            ${vitalsRes.data.slice(0, 10).map((v: any) => `
                                <tr>
                                    <td>${v.type}</td>
                                    <td>${v.type === 'blood_pressure' ? `${v.value.systolic}/${v.value.diastolic}` : v.value.value} ${v.unit}</td>
                                    <td>${new Date(v.recorded_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </table>

                        <h2>Appointments</h2>
                        <ul>
                            ${apptsRes.data.map((a: any) => `<li><strong>${a.doctor_name}</strong> - ${new Date(a.date_time).toLocaleString()}</li>`).join('')}
                        </ul>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{patient.name}</Text>
                    <Text style={styles.headerSubtitle}>{patient.email}</Text>
                </View>
                <TouchableOpacity onPress={generateReport} style={styles.reportButton}>
                    <Ionicons name="document-text-outline" size={24} color="#1976d2" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'medications' && styles.activeTab]}
                    onPress={() => setActiveTab('medications')}
                >
                    <Text style={[styles.tabText, activeTab === 'medications' && styles.activeTabText]}>Meds</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'vitals' && styles.activeTab]}
                    onPress={() => setActiveTab('vitals')}
                >
                    <Text style={[styles.tabText, activeTab === 'vitals' && styles.activeTabText]}>Vitals</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
                    onPress={() => setActiveTab('appointments')}
                >
                    <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>Appts</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === 'medications' ? medications : activeTab === 'vitals' ? vitals : appointments}
                renderItem={activeTab === 'medications' ? renderMedication : activeTab === 'vitals' ? renderVital : renderAppointment}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>No data available</Text>}
                refreshing={loading}
                onRefresh={fetchData}
            />

            {activeTab === 'appointments' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Appointment</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.form}>
                        <TextInput style={styles.input} placeholder="Doctor Name" value={doctorName} onChangeText={setDoctorName} />
                        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
                        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                            <Text>{date.toLocaleDateString()} {date.toLocaleTimeString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker value={date} mode="date" onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); setShowTimePicker(true); }} />
                        )}
                        {showTimePicker && (
                            <DateTimePicker value={date} mode="time" onChange={(e, d) => { setShowTimePicker(false); if (d) setDate(d); }} />
                        )}
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />
                        <TouchableOpacity style={styles.submitButton} onPress={handleAddAppointment}>
                            <Text style={styles.submitButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 8,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1976d2',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#1976d2',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
    },
    cardDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    vitalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    vitalUnit: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'normal',
    },
    notes: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
    },
    reportButton: {
        marginLeft: 'auto',
        padding: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1976d2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    closeText: { color: '#1976d2', fontSize: 16 },
    form: { padding: 20 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
    textArea: { height: 80, textAlignVertical: 'top' },
    submitButton: { backgroundColor: '#1976d2', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonText: { color: '#fff', fontWeight: 'bold' },
});
