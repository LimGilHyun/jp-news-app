import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'jp-news-app:device-user-id';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

export async function getDeviceUserId(): Promise<string> {
  if (cached) return cached;
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  const fresh = uuidv4();
  await AsyncStorage.setItem(KEY, fresh);
  cached = fresh;
  return fresh;
}
