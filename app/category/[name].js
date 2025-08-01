import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Enhanced Radio Button Component with animations
function ModernRadioButton({ label, selected, onPress, index }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (selected) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          tension: 200,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selected]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={[styles.radioContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.radioButton, selected && styles.radioButtonSelected]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={selected ? ['#667eea', '#764ba2'] : ['#f8f9fa', '#e9ecef']}
          style={styles.radioGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.radioContent}>
            <View style={[styles.radioOuter, selected && styles.radioSelected]}>
              {selected && (
                <Animated.View
                  style={[
                    styles.radioInner,
                    {
                      transform: [{ scale: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.3],
                      })}],
                    },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Generates question based on category & level
const getRandomInt = (max) => Math.floor(Math.random() * max) + 1;
function generateQuestion(category, level) {
  const max = level === 1 ? 10 : level === 2 ? 20 : 50;
  const a = getRandomInt(max), b = getRandomInt(max);
  let question = '', answer = 0;

  switch (category) {
    case 'addition':
      question = `${a} + ${b}`, answer = a + b; break;
    case 'subtraction':
      question = `${a} - ${b}`, answer = a - b; break;
    case 'multiplication':
      question = `${a} × ${b}`, answer = a * b; break;
    case 'division':
      answer = a; question = `${a * b} ÷ ${b}`; break;
    case 'lcm':
      const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
      question = `LCM of ${a} and ${b}`, answer = (a * b) / gcd(a, b); break;
    case 'algebra':
      answer = a; question = `x + ${b} = ${a + b}. What is x?`; break;
    case 'bodmas':
      const c = getRandomInt(max);
      question = `${a} + ${b} × ${c}`, answer = a + b * c; break;
    default:
      question = `${a} + ${b}`, answer = a + b;
  }

  const options = new Set([answer]);
  while (options.size < 3) {
    options.add(answer + getRandomInt(5) - 3);
  }

  return {
    question,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

export default function GameScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();

  // Game state
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [fails, setFails] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(300);
  const [finished, setFinished] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showPassScreen, setShowPassScreen] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showFinalCongrats, setShowFinalCongrats] = useState(false);
  const [quitModalVisible, setQuitModalVisible] = useState(false);

  // Animation refs
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;
  const timerScale = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  const sounds = useRef({
    correct: null,
    wrong: null,
    gameover: null,
    clap: null,
  }).current;

  // Load sounds
  useEffect(() => {
    async function loadSounds() {
      try {
        const [c, w, g, clap] = await Promise.all([
          Audio.Sound.createAsync(require('../../assets/sound/correct.mp3')),
          Audio.Sound.createAsync(require('../../assets/sound/wrong.mp3')),
          Audio.Sound.createAsync(require('../../assets/sound/gameover.mp3')),
          Audio.Sound.createAsync(require('../../assets/sound/clap.mp3')),
        ]);

        [sounds.correct, sounds.wrong, sounds.gameover, sounds.clap] = [c.sound, w.sound, g.sound, clap.sound];
        if (Platform.OS !== 'web') {
          Object.values(sounds).forEach(s => s.setVolumeAsync(0.5));
        }
      } catch (error) {
        console.warn('Could not load sounds:', error);
      }
    }
    loadSounds();

    return () => {
      Object.values(sounds).forEach(s => s?.unloadAsync());
    };
  }, []);

  // Generate questions and animate header
  useEffect(() => {
    const qs = Array.from({ length: 7 }, () => generateQuestion(name, level));
    setQuestions(qs);
    setIndex(0);
    setSelected(null);
    setFails(0);
    setScore(0);
    setTimer(300);
    setFinished(false);
    setShowGameOver(false);
    setShowPassScreen(false);
    setShowFinalCongrats(false);
    setQuitModalVisible(false);

    // Reset animations
    progress.setValue(0);
    fadeAnim.setValue(0);
    questionAnim.setValue(0);

    // Animate header entrance
    Animated.spring(headerAnim, {
      toValue: 0,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate question entrance
    Animated.timing(questionAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [level, name]);

  // Timer with visual feedback
  useEffect(() => {
    if (finished || showPassScreen || showGameOver || showFinalCongrats) return;

    if (timer <= 10 && timer > 0) {
      // Pulse animation for last 10 seconds
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerScale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
          Animated.timing(timerScale, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    }

    if (timer === 0) return handleSubmit();
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, finished, showPassScreen, showGameOver, showFinalCongrats]);

  // Animate question change
  useEffect(() => {
    Animated.spring(questionAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [index]);

  function startLevel(levelNumber) {
  setLevel(levelNumber);
  setQuestions(getQuestionsForLevel(levelNumber));
  setIndex(0);
  setScore(0);
  setFails(0);
  setTimer(300);          
  setFinished(false);
  setShowPassScreen(false);
  setShowFinalCongrats(false);
  setShowGameOver(false);
  setSelected(null);

  // Reset animations
  timerScale.setValue(1);
  questionAnim.setValue(1);


}

function getQuestionsForLevel(levelNumber) {
  switch(levelNumber) {
    case 1: return level1Questions;
    case 2: return level2Questions;
    case 3: return level3Questions;
    default: return level1Questions;
  }
}



  function handleSubmit() {
    if (selected === null) return;

    const q = questions[index];
    const isCorrect = selected === q.answer;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    }

    if (isCorrect) {
      setScore(s => s + 1);
      sounds.correct?.replayAsync();
    } else {
      setFails(f => f + 1);
      sounds.wrong?.replayAsync();
    }

    const nextIndex = index + 1;

    // Animate progress - Fix: Use nextIndex for accurate progress
    Animated.timing(progress, {
      toValue: nextIndex / 7,
      duration: 500,
      useNativeDriver: false
    }).start();

    // Animate question exit
    Animated.timing(questionAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (nextIndex < questions.length && fails + (!isCorrect) < 3) {
        setIndex(nextIndex);
        setSelected(null);
        setTimer(300);
        timerScale.setValue(1);
        
      } else {
        setFinished(true);
        // Fix: Use updated score for final calculation
        const finalScoreValue = score + (isCorrect ? 1 : 0);
        setFinalScore(finalScoreValue);

        if (fails + (!isCorrect) >= 3) {
          sounds.gameover?.replayAsync();
          setTimeout(() => {
            setShowGameOver(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true
            }).start();
          }, 500);
        } else {
          finishLevel();
        }
      }
    });
  }

  async function finishLevel() {
    const passed = fails < 3;

    // Save high score
    try {
      const prevHigh = await AsyncStorage.getItem(`${name}_high`);
      const intPrev = prevHigh ? +prevHigh : 0;
      const newHigh = Math.max(intPrev, score);
      if (newHigh > intPrev) {
        await AsyncStorage.setItem(`${name}_high`, newHigh.toString());
      }
    } catch (error) {
      console.warn('Could not save high score:', error);
    }

    setFinalScore(score +1);

    if (passed) {
      sounds.clap?.replayAsync();
      if (level < 3) {
        setShowPassScreen(true);
      } else {
        setShowFinalCongrats(true);
      }
      setFinished(true);
    } else {
      setShowGameOver(true);
    }
  }

  function handleStop() {
    setQuitModalVisible(true);
  }

  function confirmQuit() {
    setQuitModalVisible(false);
    router.replace('/category');
  }

  function cancelQuit() {
    setQuitModalVisible(false);
  }

  if (!questions.length) return null;

  // Success Screen
  if (showPassScreen) {
    return (
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.overlay}>
        <StatusBar barStyle="light-content" />

        {/* Floating celebration particles */}
        <View style={styles.celebrationParticles}>
          {Array.from({ length: 15 }).map((_, index) => (
            <Animatable.View
              key={index}
              animation="bounceIn"
              delay={index * 50}
              iterationCount="infinite"
              direction="alternate"
              duration={2000 + index * 100}
              style={[
                styles.particle,
                {
                  left: Math.random() * width,
                  top: Math.random() * height * 0.8,
                },
              ]}
            />
          ))}
        </View>

        <Animatable.View animation="zoomIn" duration={800} style={styles.modernSuccessContainer}>
          <BlurView intensity={20} style={styles.successBlur}>
            <Animatable.Text animation="bounceIn" delay={200} style={styles.modernSuccessEmoji}>
              🎉
            </Animatable.Text>

            <Animatable.Text animation="fadeInUp" delay={400} style={styles.modernSuccessTitle}>
              Level {level} Complete!
            </Animatable.Text>

            <View style={styles.scoreDisplayContainer}>
              <Animatable.View animation="zoomIn" delay={600} style={styles.scoreCircle}>
                <Text style={styles.scoreBigNumber}>{finalScore}</Text>
                <Text style={styles.scoreOutOf}>/ 7</Text>
              </Animatable.View>

              <Animatable.Text animation="fadeInUp" delay={800} style={styles.scoreDescription}>
                {finalScore === 7 ? 'Perfect Score! 🌟' :
                 finalScore >= 5 ? 'Great Job! 👏' :
                 'Keep Practicing! 💪'}
              </Animatable.Text>
            </View>

            <Animatable.View animation="slideInUp" delay={1000} style={styles.modernActionButtons}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => startLevel(level + 1)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#56ab2f', '#a8e6cf']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.actionButtonIcon}>🚀</Text>
                  <Text style={styles.actionButtonText}>Next Level</Text>
                  <Text style={styles.actionButtonSubtext}>Level {level + 1}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => router.replace('/category')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.actionButtonIcon}>🏠</Text>
                  <Text style={styles.actionButtonText}>Main Menu</Text>
                  <Text style={styles.actionButtonSubtext}>Choose Category</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </BlurView>
        </Animatable.View>
      </LinearGradient>
    );
  }

  // Final Congratulations Screen with Enhanced UI
  if (showFinalCongrats) {
    return (
      <LinearGradient colors={['#ffecd2', '#fcb69f']} style={styles.overlay}>
        <StatusBar barStyle="light-content" />

        {/* Golden particles */}
        <View style={styles.celebrationParticles}>
          {Array.from({ length: 20 }).map((_, index) => (
            <Animatable.View
              key={index}
              animation="fadeInDown"
              delay={index * 100}
              iterationCount="infinite"
              direction="alternate"
              duration={3000 + index * 50}
              style={[
                styles.goldenParticle,
                {
                  left: Math.random() * width,
                  top: Math.random() * height * 0.7,
                },
              ]}
            />
          ))}
        </View>

        <Animatable.View animation="zoomIn" duration={800} style={styles.modernSuccessContainer}>
          <BlurView intensity={30} style={styles.successBlur}>
            <Animatable.Text animation="bounceIn" delay={200} style={styles.championEmoji}>
              🏆
            </Animatable.Text>

            <Animatable.Text animation="fadeInUp" delay={400} style={styles.championTitle}>
              Champion!
            </Animatable.Text>

            <Animatable.Text animation="fadeInUp" delay={600} style={styles.championSubtitle}>
              All 3 Levels Conquered
            </Animatable.Text>

            <View style={styles.finalScoreContainer}>
              <Animatable.View animation="pulse" delay={800} iterationCount="infinite" style={styles.finalScoreCircle}>
                <Text style={styles.finalScoreBig}>{finalScore}</Text>
                <Text style={styles.finalScoreLabel}>Final Score</Text>
              </Animatable.View>
            </View>

            <Animatable.View animation="slideInUp" delay={1200} style={styles.championActions}>
              <TouchableOpacity
                style={styles.championButton}
                onPress={() => router.replace('/category')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ff9a9e', '#fecfef']}
                  style={styles.championButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.championButtonIcon}>🎯</Text>
                  <Text style={styles.championButtonText}>New Challenge</Text>
                  <Text style={styles.championButtonSubtext}>Master More Topics</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </BlurView>
        </Animatable.View>
      </LinearGradient>
    );
  }

  // Game Over Screen with Modern Design
  if (showGameOver) {
    return (
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <LinearGradient colors={['#ff416c', '#ff4b2b']} style={StyleSheet.absoluteFillObject} />
        <StatusBar barStyle="light-content" />

        <Animatable.View animation="shake" duration={800} style={styles.modernGameOverContainer}>
          <BlurView intensity={25} style={styles.gameOverBlur}>
            <Animatable.Text animation="bounceIn" delay={200} style={styles.modernGameOverEmoji}>
              😅
            </Animatable.Text>

            <Animatable.Text animation="fadeInUp" delay={400} style={styles.modernGameOverTitle}>
              Almost There!
            </Animatable.Text>

            <Animatable.Text animation="fadeInUp" delay={600} style={styles.modernGameOverMessage}>
              Every mistake is a step closer to mastery.{'\n'}Ready to try again?
            </Animatable.Text>

            <View style={styles.gameOverStats}>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeNumber}>{score}</Text>
                <Text style={styles.statBadgeLabel}>Correct</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeNumber}>{fails}</Text>
                <Text style={styles.statBadgeLabel}>Mistakes</Text>
              </View>
            </View>

            <Animatable.View animation="slideInUp" delay={800} style={styles.gameOverActions}>
              <TouchableOpacity
                style={styles.retryActionButton}
                onPress={() => {
                  setLevel(1);
                  setShowGameOver(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.actionButtonIcon}>🔄</Text>
                  <Text style={styles.actionButtonText}>Try Again</Text>
                  <Text style={styles.actionButtonSubtext}>Fresh Start</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuActionButton}
                onPress={() => router.replace('/category')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.actionButtonIcon}>🏠</Text>
                  <Text style={styles.actionButtonText}>Main Menu</Text>
                  <Text style={styles.actionButtonSubtext}>Choose Topic</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </BlurView>
        </Animatable.View>
      </Animated.View>
    );
  }

  // Main Game UI
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.gameContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.gameHeader,
          {
            transform: [{ translateY: headerAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.categoryTitle}>{name.toUpperCase()}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.modernProgressBar}>
          <Animated.View
            style={[
              styles.modernProgressFill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <Text style={styles.progressText}>{index + 1} / 7</Text>
        </View>
      </Animated.View>

      {/* Timer with enhanced visual feedback */}
      <Animatable.View
        animation={timer <= 10 ? "pulse" : undefined}
        iterationCount="infinite"
        style={styles.timerContainer}
      >
        <BlurView intensity={80} style={styles.timerBlur}>
          <Animated.Text
            style={[
              styles.modernTimer,
              {
                color: timer <= 10 ? '#FF6B6B' : '#ffffff',
                transform: [{ scale: timerScale }],
              },
            ]}
          >
            ⏱ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </Animated.Text>
        </BlurView>
      </Animatable.View>

      {/* Question Card */}
      <Animated.View
        style={[
          styles.questionCard,
          {
            opacity: questionAnim,
            transform: [
              {
                translateY: questionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={40} style={styles.questionBlur}>
          <Text style={styles.modernQuestion}>{questions[index]?.question}</Text>
          <Text style={styles.questionHint}>Choose the correct answer</Text>
        </BlurView>
      </Animated.View>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {questions[index]?.options.map((option, i) => (
          <ModernRadioButton
            key={option}
            label={option}
            selected={selected === option}
            onPress={() => setSelected(option)}
            index={i}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            selected === null && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selected === null}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selected !== null ? ['#4CAF50', '#45A049'] : ['#cccccc', '#999999']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitButtonText}>
              {index === 6 ? "🏁 Finish" : "✓ Submit"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quitGameButton}
          onPress={handleStop}
          activeOpacity={0.8}
        >
          <Text style={styles.quitButtonText}>⏹ Pause</Text>
        </TouchableOpacity>
      </View>

      {/* Game Stats */}
      <View style={styles.gameStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{score}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{fails}</Text>
          <Text style={styles.statLabel}>Wrong</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{3 - fails}</Text>
          <Text style={styles.statLabel}>Lives</Text>
        </View>
      </View>

      {/* Enhanced Quit Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={quitModalVisible}
        onRequestClose={cancelQuit}
      >
        <BlurView intensity={50} style={styles.modalBackground}>
          <Animatable.View
            animation="zoomIn"
            duration={300}
            style={styles.modernModalContainer}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modernModalTitle}>⏸ Pause Game</Text>
              <Text style={styles.modernModalMessage}>
                Take a break or quit to main menu?
              </Text>

              <View style={styles.modernModalButtons}>
                <TouchableOpacity
                  style={[styles.modernModalButton, styles.resumeButton]}
                  onPress={cancelQuit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modernModalButtonText}>▶ Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modernModalButton, styles.quitModalButton]}
                  onPress={confirmQuit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modernModalButtonText}>🏠 Main Menu</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animatable.View>
        </BlurView>
      </Modal>
    </LinearGradient>
  );
}

// Enhanced Styles
const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  gameHeader: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modernProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  modernProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: -20,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerBlur: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernTimer: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  questionCard: {
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  questionBlur: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  modernQuestion: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  questionHint: {
    fontSize: 14,
    color: '#f0f8ff',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  radioContainer: {
    marginVertical: 8,
  },
  radioButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  radioButtonSelected: {
    elevation: 8,
    shadowOpacity: 0.3,
  },
  radioGradient: {
    padding: 18,
    borderRadius: 15,
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  radioSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  radioLabel: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionContainer: {
    marginVertical: 20,
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  submitGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitGameButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 70,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#f0f8ff',
    fontWeight: '500',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modernModalContainer: {
    width: width * 0.85,
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  modernModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modernModalMessage: {
    fontSize: 16,
    color: '#f0f8ff',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modernModalButtons: {
    width: '100%',
  },
  modernModalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 6,
  },
  resumeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  quitModalButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  modernModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Success/Failure Screen Styles
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  successScore: {
    fontSize: 20,
    marginBottom: 25,
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  successButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modernButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  retryButton: {
    backgroundColor: '#2196F3',
  },
  quitButton: {
    backgroundColor: '#F44336',
  },
  goldButton: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  finalEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  finalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  finalSubtitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
  },
  finalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gameOverContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  gameOverEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  gameOverTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#F44336',
  },
  gameOverMessage: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  // Modern Success Screen Styles
  celebrationParticles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 3,
  },
  goldenParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  modernSuccessContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successBlur: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modernSuccessEmoji: {
    fontSize: 70,
    marginBottom: 15,
  },
  modernSuccessTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scoreDisplayContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 12,
  },
  scoreBigNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreOutOf: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modernActionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  secondaryActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actionButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // Champion Screen Styles
  championEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  championTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  championSubtitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  finalScoreContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  finalScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finalScoreBig: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  finalScoreLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  championActions: {
    width: '100%',
  },
  championButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  championButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  championButtonIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  championButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  championButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modern Game Over Styles
  modernGameOverContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gameOverBlur: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modernGameOverEmoji: {
    fontSize: 70,
    marginBottom: 15,
  },
  modernGameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  modernGameOverMessage: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    color: '#ffffff',
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameOverStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 70,
  },
  statBadgeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statBadgeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  gameOverActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  retryActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  menuActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
