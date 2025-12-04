import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AppointmentsScreen() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [doctorName, setDoctorName] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('/appointments');
            setAppointments(response.data);
        } catch (error) {
            console.error('Failed to fetch appointments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAppointment = async () => {
        if (!doctorName) {
            Alert.alert('Error', 'Doctor name is required');
            return;
        }

        try {
            await axios.post('/appointments', {
                doctorName,
                location,
                notes,
                dateTime: date.toISOString(),
            });
            setModalVisible(false);
            resetForm();
            fetchAppointments();
            Alert.alert('Success', 'Appointment added');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to add appointment');
        }
    };

    const resetForm = () => {
        setDoctorName('');
        setLocation('');
        setNotes('');
        setDate(new Date());
    };

    const handleDelete = async (id: number) => {
        Alert.alert('Delete Appointment', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`/appointments/${id}`);
                        fetchAppointments();
                    } catch (error) {
                        console.error('Failed to delete', error);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.doctorName}>{item.doctor_name}</Text>
                    <Text style={styles.date}>
                        {new Date(item.date_time).toLocaleDateString()} at {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef5350" />
                </TouchableOpacity>
            </View>
            {item.location && (
                <View style={styles.row}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.location}>{item.location}</Text>
                </View>
            )}
            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Appointments</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={appointments}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>No upcoming appointments</Text>}
                refreshing={loading}
                onRefresh={fetchAppointments}
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Appointment</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Doctor Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Dr. Smith"
                            value={doctorName}
                            onChangeText={setDoctorName}
                        />

                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123 Medical Center Dr"
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={styles.label}>Date & Time</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text>{date.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setDate(selectedDate);
                                }}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={date}
                                mode="time"
                                onChange={(event, selectedDate) => {
                                    setShowTimePicker(false);
                                    if (selectedDate) setDate(selectedDate);
                                }}
                            />
                        )}

                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Bring insurance card..."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity style={styles.submitButton} onPress={handleAddAppointment}>
                            <Text style={styles.submitButtonText}>Save Appointment</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
    addButton: {
        backgroundColor: '#1976d2',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    date: {
        fontSize: 14,
        color: '#1976d2',
        marginTop: 2,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
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
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        color: '#1976d2',
        fontSize: 16,
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#1976d2',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
