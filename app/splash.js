// app/index.js (or app/splash.js if you prefer)

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Floating particles background */}
      <View style={styles.particlesContainer}>
        {Array.from({ length: 20 }).map((_, index) => (
          <Animatable.View
            key={index}
            animation="pulse"
            iterationCount="infinite"
            duration={2000 + index * 100}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: index * 200,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.brainEmoji,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          🧠
        </Animated.Text>

        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          style={styles.title}
        >
          Akili
        </Animatable.Text>

        <Animatable.Text
          animation="fadeInUp"
          delay={800}
          style={styles.subtitle}
        >
          Master Math with Fun!
        </Animatable.Text>

        <Animatable.View
          animation="bounceIn"
          delay={1200}
          style={styles.taglineContainer}
        >
          <Text style={styles.tagline}>🎮 Learn • Play • Excel 🎉</Text>
        </Animatable.View>
      </Animated.View>

      {/* Loading indicator */}
      <Animatable.View
        animation="fadeIn"
        delay={1500}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingBar}>
          <Animatable.View
            animation="slideInLeft"
            duration={2000}
            style={styles.loadingFill}
          />
        </View>
        <Text style={styles.loadingText}>Loading your adventure...</Text>
      </Animatable.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#f0f8ff',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 30,
  },
  taglineContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '80%',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  loadingFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
