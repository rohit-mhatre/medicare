import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function SOSScreen() {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    const handleSOS = async () => {
        Alert.alert(
            'Emergency SOS',
            'Are you sure you want to alert your caregivers?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'SEND ALERT',
                    style: 'destructive',
                    onPress: sendAlert
                }
            ]
        );
    };

    const sendAlert = async () => {
        setSending(true);
        try {
            // Refresh location for accuracy
            let currentLocation = location;
            try {
                currentLocation = await Location.getCurrentPositionAsync({});
            } catch (e) {
                console.log('Using cached location');
            }

            await axios.post('/notifications/sos', {
                latitude: currentLocation?.coords.latitude,
                longitude: currentLocation?.coords.longitude,
            });

            Alert.alert('SOS Sent', 'Your caregivers have been notified with your location.');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to send SOS. Please call emergency services directly.');
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#ff5252', '#d32f2f', '#b71c1c']}
                style={styles.background}
            />
            <SafeAreaView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>EMERGENCY SOS</Text>
                    <Text style={styles.subtitle}>
                        Press the button below to alert your caregivers immediately.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={handleSOS}
                    disabled={sending}
                >
                    <View style={styles.sosInner}>
                        {sending ? (
                            <ActivityIndicator size="large" color="#d32f2f" />
                        ) : (
                            <Text style={styles.sosText}>SOS</Text>
                        )}
                    </View>
                </TouchableOpacity>

                {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                <View style={styles.infoContainer}>
                    <Ionicons name="location" size={24} color="#fff" />
                    <Text style={styles.infoText}>
                        {location ? 'Location Active' : 'Locating...'}
                    </Text>
                </View>
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
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        maxWidth: 300,
    },
    sosButton: {
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 20,
    },
    sosInner: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    sosText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#d32f2f',
    },
    errorText: {
        color: '#ffcc80',
        marginTop: 10,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 40,
    },
    infoText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '600',
    },
});
