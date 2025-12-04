import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    const [patientEmail, setPatientEmail] = React.useState('');
    const [linking, setLinking] = React.useState(false);

    const handleLinkPatient = async () => {
        if (!patientEmail) {
            Alert.alert('Error', 'Please enter patient email');
            return;
        }

        setLinking(true);
        try {
            await axios.post('/auth/link-patient', { patientEmail });
            Alert.alert('Success', 'Patient linked successfully');
            setPatientEmail('');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to link patient');
        } finally {
            setLinking(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.role.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.section}>
                {user?.role === 'caregiver' && (
                    <View style={styles.caregiverSection}>
                        <Text style={styles.sectionHeader}>Caregiver Tools</Text>
                        <Text style={styles.label}>Link New Patient</Text>
                        <View style={styles.linkContainer}>
                            <TextInput
                                style={styles.linkInput}
                                placeholder="Patient Email"
                                value={patientEmail}
                                onChangeText={setPatientEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={handleLinkPatient}
                                disabled={linking}
                            >
                                {linking ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.linkButtonText}>Link</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="settings-outline" size={24} color="#333" />
                    <Text style={styles.menuText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                    <Text style={styles.menuText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="help-circle-outline" size={24} color="#333" />
                    <Text style={styles.menuText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 32,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    roleBadge: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    section: {
        marginTop: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 16,
        color: '#333',
    },
    logoutButton: {
        margin: 24,
        padding: 16,
        backgroundColor: '#ffebee',
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutText: {
        color: '#d32f2f',
        fontSize: 16,
        fontWeight: '600',
    },
    caregiverSection: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    linkContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    linkInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    linkButton: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
