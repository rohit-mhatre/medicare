import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/DashboardScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import PatientDetailScreen from '../screens/PatientDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MedicationStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MedicationsList" component={MedicationsScreen} options={{ title: 'Medications' }} />
            <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'Add Medication' }} />
        </Stack.Navigator>
    );
}

import CaregiverDashboardScreen from '../screens/CaregiverDashboardScreen';
import SOSScreen from '../screens/SOSScreen';
import VitalsScreen from '../screens/VitalsScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { useAuth } from '../contexts/AuthContext';

const CaregiverStack = createStackNavigator();

function CaregiverStackScreen() {
    return (
        <CaregiverStack.Navigator>
            <CaregiverStack.Screen
                name="CaregiverDashboard"
                component={CaregiverDashboardScreen}
                options={{ headerShown: false }}
            />
            <CaregiverStack.Screen
                name="PatientDetail"
                component={PatientDetailScreen}
                options={{ headerShown: false }}
            />
        </CaregiverStack.Navigator>
    );
}

export default function MainTabs() {
    const { user } = useAuth();
    const isCaregiver = user?.role === 'caregiver';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Medications') {
                        iconName = focused ? 'medical' : 'medical-outline';
                    } else if (route.name === 'Vitals') { // Added Vitals icon logic
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    // SOS and other tabs might have their own tabBarIcon defined in options

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#1976d2',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            {isCaregiver ? (
                <Tab.Screen name="Dashboard" component={CaregiverStackScreen} options={{ headerShown: false }} />
            ) : (
                <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            )}
            {!isCaregiver && (
                <Tab.Screen name="Medications" component={MedicationStack} options={{ headerShown: false }} />
            )}
            {!isCaregiver && ( // Vitals tab for patients
                <Tab.Screen
                    name="Vitals"
                    component={VitalsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="heart" size={size} color={color} />
                        ),
                    }}
                />
            )}
            {user?.role === 'patient' && ( // SOS tab for patients
                <Tab.Screen
                    name="SOS"
                    component={SOSScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="warning" size={size} color={color} />
                        ),
                        tabBarLabel: 'SOS',
                        tabBarActiveTintColor: '#d32f2f',
                    }}
                />
            )}
            <Tab.Screen
                name="Appointments"
                component={AppointmentsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
