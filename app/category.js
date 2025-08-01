import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FlatGrid } from 'react-native-super-grid';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const categories = [
  { title: 'Addition', key: 'addition', emoji: '➕', color: ['#FF6B6B', '#FF8E53'], description: 'Master basic addition' },
  { title: 'Subtraction', key: 'subtraction', emoji: '➖', color: ['#4ECDC4', '#44A08D'], description: 'Learn subtraction skills' },
  { title: 'Multiplication', key: 'multiplication', emoji: '✖️', color: ['#45B7D1', '#96C93D'], description: 'Times tables mastery' },
  { title: 'Division', key: 'division', emoji: '➗', color: ['#F093FB', '#F5576C'], description: 'Division made easy' },
  { title: 'BODMAS', key: 'bodmas', emoji: '🧮', color: ['#FFECD2', '#FCB69F'], description: 'Order of operations' },
  { title: 'Algebra', key: 'algebra', emoji: '📐', color: ['#A8EDEA', '#FED6E3'], description: 'Solve for X' },
  { title: 'LCM', key: 'lcm', emoji: '🔢', color: ['#D299C2', '#FEF9D7'], description: 'Least Common Multiple' },
  { title: 'Learning', key: 'youtube', emoji: '📺', color: ['#667eea', '#764ba2'], description: 'Video tutorials', isYouTube: true },
];

export default function CategoryPage() {
  const router = useRouter();
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = (item) => {
    if (item.isYouTube) {
      Linking.openURL('https://www.youtube.com/@TechUniverse-tz');
    } else {
      router.push(`/category/${item.key}`);
    }
  };

  const renderCategory = ({ item, index }) => (
    <Animatable.View
      animation="zoomIn"
      delay={index * 100}
      duration={600}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handlePress(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={item.color}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BlurView intensity={20} style={styles.cardBlur}>
            <Animatable.Text
              animation="bounceIn"
              delay={index * 150 + 200}
              style={styles.emoji}
            >
              {item.emoji}
            </Animatable.Text>

            <Text style={styles.categoryTitle}>{item.title}</Text>
            <Text style={styles.categoryDescription}>{item.description}</Text>

            {item.isYouTube && (
              <View style={styles.youtubeBadge}>
                <Text style={styles.youtubeBadgeText}>WATCH</Text>
              </View>
            )}

            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.mainTitle}>🧠 Akili</Text>
        <Text style={styles.subtitle}>Choose Your Math Adventure</Text>
      </Animated.View>

      {/* Categories Grid */}
      <Animated.View style={[styles.gridContainer, { opacity: fadeAnim }]}>
        <FlatGrid
          itemDimension={width * 0.4}
          data={categories}
          style={styles.gridList}
          spacing={15}
          renderItem={renderCategory}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* Floating Stats Card */}
      <Animatable.View
        animation="slideInUp"
        delay={1000}
        style={styles.statsCard}
      >
        <BlurView intensity={80} style={styles.statsBlur}>
          <Text style={styles.statsTitle}>🏆 Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Levels Each</Text>
            </View>
          </View>
        </BlurView>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#f0f8ff',
    textAlign: 'center',
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gridList: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    height: 160,
    borderRadius: 20,
  },
  cardBlur: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#f0f8ff',
    textAlign: 'center',
    fontWeight: '500',
  },
  youtubeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  youtubeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statsBlur: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#f0f8ff',
    fontWeight: '500',
  },
});
