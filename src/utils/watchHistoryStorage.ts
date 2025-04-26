import { Video } from '../types';

const WATCH_HISTORY_KEY = 'youtube_watch_history';

export const getLocalWatchHistory = (): Video[] => {
  const history = localStorage.getItem(WATCH_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
};

export const setLocalWatchHistory = (videos: Video[]) => {
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(videos));
};

export const isVideoWatched = (videoId: string): boolean => {
  const history = getLocalWatchHistory();
  return history.some(video => video.id === videoId);
};

export const addToLocalWatchHistory = (video: Video) => {
  const history = getLocalWatchHistory();
  if (!history.some(v => v.id === video.id)) {
    history.unshift(video);
    setLocalWatchHistory(history);
  }
};

export const removeFromLocalWatchHistory = (videoIds: string[]) => {
  const history = getLocalWatchHistory();
  const updatedHistory = history.filter(video => !videoIds.includes(video.id));
  setLocalWatchHistory(updatedHistory);
}; 