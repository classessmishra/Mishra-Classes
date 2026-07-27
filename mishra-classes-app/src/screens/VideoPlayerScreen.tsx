import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Download, Check, Play, Pause, Trash2 } from 'lucide-react-native';
import { downloadVideo, isVideoDownloaded, deleteVideo } from '../utils/DownloadManager';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VideoPlayerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { url, title } = (route.params as any) || { url: '', title: 'Video Lesson' };

  const video = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    checkLocalVideo();
  }, [url]);

  const checkLocalVideo = async () => {
    if (!url) return;
    const uri = await isVideoDownloaded(url);
    if (uri) {
      setLocalUri(uri);
    } else {
      setLocalUri(null);
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    const resultUri = await downloadVideo(url, (progress) => {
      setDownloadProgress(progress);
    });
    if (resultUri) {
      setLocalUri(resultUri);
    }
    setIsDownloading(false);
  };

  const handleDelete = async () => {
    if (!url) return;
    const deleted = await deleteVideo(url);
    if (deleted) {
      setLocalUri(null);
    }
  };

  const playSource = localUri ? { uri: localUri } : { uri: url };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.videoContainer}>
        {url ? (
          <Video
            ref={video}
            style={styles.video}
            source={playSource}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={(status) => setStatus(status)}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Invalid Video URL</Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.sectionTitle}>Lecture Options</Text>
        
        <View style={styles.optionsRow}>
          {localUri ? (
            <View style={styles.downloadedCard}>
              <View style={styles.downloadedRow}>
                <Check color="#10b981" size={20} />
                <Text style={styles.downloadedText}>Available Offline</Text>
              </View>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Trash2 color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.downloadButton, isDownloading && styles.downloadingButton]} 
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.downloadButtonText}>
                    Downloading {Math.round(downloadProgress * 100)}%
                  </Text>
                </>
              ) : (
                <>
                  <Download color="#fff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.downloadButtonText}>Download for Offline</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  controlsContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadingButton: {
    backgroundColor: '#3b82f6',
    opacity: 0.8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
  },
  downloadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  }
});
