import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

export default function SplashScreen() {
  const [fontsLoaded] = useFonts({
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f43f5e', '#e11d48']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Shop Everything You Need</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    fontFamily: 'Inter-Regular',
  },
});