import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const VIDEO_DIR = `${FileSystem.documentDirectory}videos/`;

// Ensure directory exists
export const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
  }
};

// Generate a safe local filename from a URL
export const getLocalFileName = (url: string) => {
  // A simple hash/replace to create a safe file name
  const name = url.split('?')[0].split('/').pop() || 'video';
  return name.replace(/[^a-z0-9.]/gi, '_') + '.mp4';
};

// Check if a video is downloaded
export const isVideoDownloaded = async (url: string) => {
  await ensureDirExists();
  const filename = getLocalFileName(url);
  const fileUri = VIDEO_DIR + filename;
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  return fileInfo.exists ? fileUri : null;
};

// Download a video
export const downloadVideo = async (
  url: string, 
  onProgress?: (progress: number) => void
) => {
  await ensureDirExists();
  const filename = getLocalFileName(url);
  const fileUri = VIDEO_DIR + filename;

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (onProgress) onProgress(progress);
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    return result?.uri || null;
  } catch (e) {
    console.error("Download failed:", e);
    return null;
  }
};

// Delete a downloaded video
export const deleteVideo = async (url: string) => {
  const filename = getLocalFileName(url);
  const fileUri = VIDEO_DIR + filename;
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    return true;
  }
  return false;
};
