import { Video } from '../types';
import { addToWatchHistoryBatch } from '../lib/db';

export const migrateWatchHistory = async () => {
  try {
    // Check if migration has already been performed
    if (localStorage.getItem('history_migrated')) {
      return;
    }

    // Get watch history from localStorage
    const watchedVideos = localStorage.getItem('watched_videos');
    if (!watchedVideos) {
      localStorage.setItem('history_migrated', 'true');
      return;
    }

    const videos: Video[] = JSON.parse(watchedVideos);

    // Migrate all videos in a single batch operation
    await addToWatchHistoryBatch(videos);

    // Mark migration as complete
    localStorage.setItem('history_migrated', 'true');
    // Clear old localStorage data
    localStorage.removeItem('watched_videos');

    console.log('Watch history migration completed successfully');
  } catch (error) {
    console.error('Error migrating watch history:', error);
    throw error;
  }
}; 