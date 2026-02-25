import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-toast-notifications';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import LiveStreamScreen from './src/screens/LiveStreamScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Components
import TabBarIcon from './src/components/navigation/TabBarIcon';
import Header from './src/components/layout/Header';
import LoadingSpinner from './src/components/ui/LoadingSpinner';

// Context
import { CartProvider } from './src/contexts/CartContext';
import { WishlistProvider } from './src/contexts/WishlistContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Hooks
import { useAuth } from './src/hooks/useAuth';
import { useNotifications } from './src/hooks/useNotifications';

// Constants
import { CLERK_PUBLISHABLE_KEY } from './src/constants/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            routeName={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: '#f43f5e',
        tabBarInactiveTintColor: '#8b5cf6',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          header: () => <Header title="Marketplace" showSearch={true} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoryScreen}
        options={{
          header: () => <Header title="Categories" />,
          tabBarLabel: 'Categories',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          header: () => <Header title="Cart" />,
          tabBarLabel: 'Cart',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          header: () => <Header title="Orders" />,
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          header: () => <Header title="Profile" />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isSignedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ThemeProvider>
              <LanguageProvider>
                <NotificationProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <ToastProvider>
                        <ClerkLoaded>
                          <AppContent />
                        </ClerkLoaded>
                      </ToastProvider>
                    </WishlistProvider>
                  </CartProvider>
                </NotificationProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}