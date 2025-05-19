// Keys for different sections
const STORAGE_KEYS = {
  PLAYLIST: 'youtube_playlist_state',
  SUBSCRIPTIONS: 'youtube_subscriptions_state',
  TRENDING: 'youtube_trending_state',
  PEOPLE: 'youtube_people_state',
  LISTS: 'youtube_lists_state'
};

// Generic function to save state
export const saveState = (key: string, state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error('Error saving state:', err);
  }
};

// Generic function to load state
export const loadState = (key: string) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading state:', err);
    return undefined;
  }
};

// Function to clear specific state
export const clearState = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Error clearing state:', err);
  }
};

export { STORAGE_KEYS }; 