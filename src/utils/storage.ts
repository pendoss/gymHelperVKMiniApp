import { STORAGE_KEYS } from '../config/api';

export class LocalStorage {
  static set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue || null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  static exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}

export class AppStorage {
  static setAccessToken(token: string): void {
    LocalStorage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static getAccessToken(): string | null {
    return LocalStorage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static removeAccessToken(): void {
    LocalStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static setUserData(userData: any): void {
    LocalStorage.set(STORAGE_KEYS.USER_DATA, userData);
  }

  static getUserData(): any | null {
    return LocalStorage.get(STORAGE_KEYS.USER_DATA);
  }

  static removeUserData(): void {
    LocalStorage.remove(STORAGE_KEYS.USER_DATA);
  }

  static setTheme(theme: 'light' | 'dark'): void {
    LocalStorage.set(STORAGE_KEYS.THEME, theme);
  }

  static getTheme(): 'light' | 'dark' {
    return LocalStorage.get<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light')!;
  }

  static setLastSync(timestamp: number): void {
    LocalStorage.set(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  static getLastSync(): number | null {
    return LocalStorage.get<number>(STORAGE_KEYS.LAST_SYNC);
  }

  static clearAppData(): void {
    LocalStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    LocalStorage.remove(STORAGE_KEYS.USER_DATA);
    LocalStorage.remove(STORAGE_KEYS.LAST_SYNC);
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export class CacheManager {
  private static CACHE_PREFIX = 'gym_helper_cache_';
  private static DEFAULT_TTL = 1000 * 60 * 5; // 5 минут

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    LocalStorage.set(this.CACHE_PREFIX + key, cacheItem);
  }

  static get<T>(key: string): T | null {
    const cacheItem = LocalStorage.get<{
      data: T;
      timestamp: number;
      ttl: number;
    }>(this.CACHE_PREFIX + key);

    if (!cacheItem) {
      return null;
    }

    const now = Date.now();
    if (now - cacheItem.timestamp > cacheItem.ttl) {
      // Кэш истек
      this.remove(key);
      return null;
    }

    return cacheItem.data;
  }

  static remove(key: string): void {
    LocalStorage.remove(this.CACHE_PREFIX + key);
  }

  static clear(): void {
    // Удаляем все ключи с префиксом кэша
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_PREFIX)
    );
    keys.forEach(key => localStorage.removeItem(key));
  }

  static isValid(key: string): boolean {
    return this.get(key) !== null;
  }

  static KEYS = {
    EXERCISES: 'exercises',
    WORKOUTS: 'workouts',
    FRIENDS: 'friends',
    USER_STATS: 'user_stats',
    CALENDAR: (month: string, year: string) => `calendar_${year}_${month}`,
  } as const;
}

export class FileUtils {
  static readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static validateImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Неподдерживаемый формат изображения');
    }

    if (file.size > maxSize) {
      throw new Error('Размер файла не должен превышать 5MB');
    }

    return true;
  }

  static validateVideoFile(file: File): boolean {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Неподдерживаемый формат видео');
    }

    if (file.size > maxSize) {
      throw new Error('Размер видео не должен превышать 50MB');
    }

    return true;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export class DateUtils {
  static formatForAPI(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  static formatTimeForAPI(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
  }

  static parseAPIDate(dateString: string): Date {
    return new Date(dateString);
  }

  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  static isThisWeek(date: Date): boolean {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return date >= weekStart && date <= weekEnd;
  }

  static formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`;
    
    return `${Math.floor(diffDays / 365)} г. назад`;
  }
}
