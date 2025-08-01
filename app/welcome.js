import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Animated Math Character Component
function AnimatedMathCharacter() {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous bouncing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.characterContainer}>
      {/* Main character */}
      <Animated.View
        style={[
          styles.mainCharacter,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.characterEmoji}>🤖</Text>
      </Animated.View>

      {/* Floating math symbols */}
      <Animated.View
        style={[
          styles.floatingSymbol,
          styles.symbol1,
          {
            transform: [{ rotate }],
          },
        ]}
      >
        <Text style={styles.symbolText}>+</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingSymbol,
          styles.symbol2,
          {
            transform: [{ rotate: rotate }],
          },
        ]}
      >
        <Text style={styles.symbolText}>×</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingSymbol,
          styles.symbol3,
          {
            transform: [{ rotate }],
          },
        ]}
      >
        <Text style={styles.symbolText}>÷</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingSymbol,
          styles.symbol4,
          {
            transform: [{ rotate }],
          },
        ]}
      >
        <Text style={styles.symbolText}>−</Text>
      </Animated.View>
    </View>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay }) {
  return (
    <Animatable.View
      animation="slideInUp"
      delay={delay}
      duration={600}
      style={styles.featureCard}
    >
      <BlurView intensity={30} style={styles.featureBlur}>
        <Text style={styles.featureIcon}>{icon}</Text>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </BlurView>
    </Animatable.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleGetStarted = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/category');
    });
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#ffecd2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      {/* Background particles */}
      <View style={styles.backgroundParticles}>
        {Array.from({ length: 25 }).map((_, index) => (
          <Animatable.View
            key={index}
            animation="fadeInDown"
            delay={index * 100}
            iterationCount="infinite"
            direction="alternate"
            duration={3000 + index * 50}
            style={[
              styles.backgroundParticle,
              {
                left: Math.random() * width,
                top: Math.random() * height * 0.8,
              },
            ]}
          />
        ))}
      </View>

      {/* Header Section */}
      <Animatable.View animation="fadeInDown" delay={300} style={styles.headerSection}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appTitle}>Akili</Text>
        <Text style={styles.tagline}>🎯 Master Math with Fun & Games! 🎮</Text>
      </Animatable.View>

      {/* Animated Character */}
      <Animatable.View animation="zoomIn" delay={600} style={styles.characterSection}>
        <AnimatedMathCharacter />
      </Animatable.View>

      {/* Description Section */}
      <Animatable.View animation="fadeInUp" delay={900} style={styles.descriptionSection}>
        <Text style={styles.descriptionTitle}>🚀 Your Math Adventure Awaits!</Text>
        <Text style={styles.description}>
          Challenge yourself with exciting math problems, level up your skills,
          and become a math champion! Practice addition, subtraction, multiplication,
          division, and much more in a fun, interactive way.
        </Text>
      </Animatable.View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <FeatureCard
          icon="🎯"
          title="8 Categories"
          description="Master different math topics"
          delay={1200}
        />
        <FeatureCard
          icon="⚡"
          title="3 Levels Each"
          description="Progressive difficulty"
          delay={1300}
        />
        <FeatureCard
          icon="🏆"
          title="Track Progress"
          description="Monitor your improvement"
          delay={1400}
        />
      </View>

      {/* Get Started Button */}
      <Animatable.View animation="bounceIn" delay={1600} style={styles.buttonSection}>
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonIcon}>🎮</Text>
              <Text style={styles.buttonText}>Get Started</Text>
              <Text style={styles.buttonSubtext}>Let's Play!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animatable.View>

      {/* Footer */}
      <Animatable.View animation="fadeIn" delay={2000} style={styles.footer}>
        <Text style={styles.footerText}>✨ Learn • Practice • Excel ✨</Text>
      </Animatable.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backgroundParticles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginVertical: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#f0f8ff',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 5,
  },
  characterSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  characterContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCharacter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterEmoji: {
    fontSize: 80,
  },
  floatingSymbol: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  symbol1: {
    top: 10,
    left: 20,
  },
  symbol2: {
    top: 10,
    right: 20,
  },
  symbol3: {
    bottom: 10,
    left: 20,
  },
  symbol4: {
    bottom: 10,
    right: 20,
  },
  symbolText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  descriptionSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  descriptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: '#f0f8ff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  featureCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  featureBlur: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 11,
    color: '#f0f8ff',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  getStartedButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 50,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
