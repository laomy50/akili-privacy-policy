import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const videos = [
  { id: '1', title: 'Addition Basics', videoId: 'x1xXuzYV4EM' },
  { id: '2', title: 'Multiplication Trick', videoId: 'Vb_JpC-v-uY' },
  { id: '3', title: 'Algebra Simplified', videoId: '4lEdNlT-_80' },
];

export default function Videos() {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <View style={styles.container}>
      {!selectedVideo ? (
        <>
          <Text style={styles.title}>📺 Educational Videos</Text>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setSelectedVideo(item.videoId)}
              >
                <Text style={styles.buttonText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => setSelectedVideo(null)} style={styles.back}>
            <Text style={{ color: '#4c8bf5', fontSize: 16 }}>← Back to list</Text>
          </TouchableOpacity>
          <WebView
            source={{ uri: `https://www.youtube.com/embed/${selectedVideo}` }}
            style={{ flex: 1 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#4c8bf5',
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 18 },
  back: { marginBottom: 10 },
});
