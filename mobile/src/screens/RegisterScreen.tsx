import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await register(email, password, name, role);
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join Medicare today</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <View style={styles.roleContainer}>
                        <Text style={styles.roleLabel}>I am a:</Text>
                        <View style={styles.roleButtons}>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                                onPress={() => setRole('patient')}
                            >
                                <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
                                    Patient
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'caregiver' && styles.roleButtonActive]}
                                onPress={() => setRole('caregiver')}
                            >
                                <Text style={[styles.roleButtonText, role === 'caregiver' && styles.roleButtonTextActive]}>
                                    Caregiver
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Register</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.link}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1976d2',
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },
    form: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    roleContainer: {
        marginBottom: 24,
    },
    roleLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: '#666',
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#e3f2fd',
        borderColor: '#1976d2',
    },
    roleButtonText: {
        fontSize: 16,
        color: '#666',
    },
    roleButtonTextActive: {
        color: '#1976d2',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    link: {
        textAlign: 'center',
        color: '#1976d2',
        fontSize: 16,
        marginTop: 24,
    },
});
