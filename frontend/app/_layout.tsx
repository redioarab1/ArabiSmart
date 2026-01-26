import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, I18nManager } from 'react-native';
import { useAuthStore } from '../stores/authStore';

// Enable RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const loadToken = useAuthStore((state) => state.loadToken);

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          },
          headerTintColor: isDark ? '#ffffff' : '#1a1a2e',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: isDark ? '#0f0f1a' : '#f5f5f5',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'ArabiSmart',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="breaking-news"
          options={{
            title: 'الأخبار العاجلة',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'البحث',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            title: 'المفضلة',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'الملف الشخصي',
          }}
        />
        <Stack.Screen
          name="article/[id]"
          options={{
            title: 'تفاصيل الخبر',
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            title: 'تسجيل الدخول',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: 'إنشاء حساب',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
