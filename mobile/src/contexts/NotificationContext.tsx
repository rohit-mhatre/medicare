import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    expoPushToken: string | undefined;
    notification: Notifications.Notification | undefined;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            registerForPushNotificationsAsync().then(token => {
                setExpoPushToken(token);
                if (token) {
                    savePushToken(token);
                }
            });

            const notificationListener = Notifications.addNotificationReceivedListener(notification => {
                setNotification(notification);
            });

            const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                console.log(response);
            });

            return () => {
                notificationListener.remove();
                responseListener.remove();
            };
        }
    }, [isAuthenticated]);

    const savePushToken = async (token: string) => {
        try {
            await axios.post('/auth/push-token', { pushToken: token });
        } catch (error) {
            console.error('Failed to save push token:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ expoPushToken, notification }}>
            {children}
        </NotificationContext.Provider>
    );
};

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
    } else {
        // alert('Must use physical device for Push Notifications');
    }

    return token;
}
