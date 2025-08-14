/**
 * Контекст для единого RootStore
 * Заменяет старую систему сторов
 */

import React, { createContext, useContext, ReactNode } from 'react';
import RootStore from './RootStore';
import ApiService from '../api/ApiService';

// Создаем экземпляр API сервиса
const apiService = new ApiService();

// Создаем экземпляр RootStore
const rootStore = new RootStore(apiService);

// Создаем контекст
const RootStoreContext = createContext<RootStore | null>(null);

// Provider компонент
interface RootStoreProviderProps {
  children: ReactNode;
}

export const RootStoreProvider: React.FC<RootStoreProviderProps> = ({ children }) => {
  return (
    <RootStoreContext.Provider value={rootStore}>
      {children}
    </RootStoreContext.Provider>
  );
};

// Hook для использования стора
export const useRootStore = (): RootStore => {
  const store = useContext(RootStoreContext);
  
  if (!store) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }
  
  return store;
};

// Экспортируем стор для прямого использования (если нужно)
export { rootStore };

export default RootStore;
