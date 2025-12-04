import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

export default function AddMedicationScreen({ navigation }: any) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [instructions, setInstructions] = useState('');
    const [currentSupply, setCurrentSupply] = useState('30');
    const [scheduledTime, setScheduledTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

    React.useEffect(() => {
        if (user?.role === 'caregiver') {
            fetchPatients();
        }
    }, [user]);

    const fetchPatients = async () => {
        try {
            const response = await axios.get('/auth/linked-patients');
            setPatients(response.data);
            if (response.data.length > 0) {
                setSelectedPatientId(response.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch patients', error);
        }
    };

    const handleSave = async () => {
        if (!name || !dosage || !frequency) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }

        const patientId = user?.role === 'patient' ? user.id : selectedPatientId;

        if (!patientId) {
            Alert.alert('Error', 'Please select a patient');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Medication
            const medResponse = await axios.post('/medications', {
                patientId,
                name,
                dosage,
                frequency,
                instructions,
                startDate: new Date().toISOString(),
                currentSupply: parseInt(currentSupply),
                refillThreshold: 5,
            });

            const medicationId = medResponse.data.id;

            // 2. Create Schedule (Default to daily at selected time)
            await axios.post(`/medications/${medicationId}/schedule`, {
                scheduledTime: scheduledTime.toLocaleTimeString('en-US', { hour12: false }),
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily
            });

            // 3. Schedule Local Notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Medication Reminder",
                    body: `Time to take your ${name} (${dosage})`,
                    data: { medicationId },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: scheduledTime.getHours(),
                    minute: scheduledTime.getMinutes(),
                    repeats: true,
                },
            });

            Alert.alert('Success', 'Medication added and reminder set!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to save medication');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                {user?.role === 'caregiver' && (
                    <View style={styles.patientSelector}>
                        <Text style={styles.label}>Select Patient *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientList}>
                            {patients.map(patient => (
                                <TouchableOpacity
                                    key={patient.id}
                                    style={[
                                        styles.patientChip,
                                        selectedPatientId === patient.id && styles.patientChipSelected
                                    ]}
                                    onPress={() => setSelectedPatientId(patient.id)}
                                >
                                    <Text style={[
                                        styles.patientChipText,
                                        selectedPatientId === patient.id && styles.patientChipTextSelected
                                    ]}>
                                        {patient.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                <Text style={styles.label}>Medication Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Lisinopril"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>Dosage *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 10mg"
                    value={dosage}
                    onChangeText={setDosage}
                />

                <Text style={styles.label}>Frequency *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Daily"
                    value={frequency}
                    onChangeText={setFrequency}
                />

                <Text style={styles.label}>Current Supply</Text>
                <TextInput
                    style={styles.input}
                    placeholder="30"
                    value={currentSupply}
                    onChangeText={setCurrentSupply}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Instructions</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. Take with food"
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline
                    numberOfLines={3}
                />

                <Text style={styles.sectionTitle}>Schedule</Text>

                <View style={styles.timeContainer}>
                    <Text style={styles.label}>Reminder Time</Text>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.timeText}>
                            {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showTimePicker && (
                    <DateTimePicker
                        value={scheduledTime}
                        mode="time"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowTimePicker(false);
                            if (selectedDate) setScheduledTime(selectedDate);
                        }}
                    />
                )}

                <TouchableOpacity
                    style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    <Text style={styles.saveButtonText}>
                        {isSubmitting ? 'Saving...' : 'Save Medication'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 20,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    timeButton: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 18,
        color: '#1976d2',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#1976d2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    patientSelector: {
        marginBottom: 20,
    },
    patientList: {
        flexDirection: 'row',
    },
    patientChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    patientChipSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#1976d2',
    },
    patientChipText: {
        color: '#666',
    },
    patientChipTextSelected: {
        color: '#1976d2',
        fontWeight: '600',
    },
});
