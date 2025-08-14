import { createContext, useContext } from 'react';
import AppStore from './AppStore';
import bridge from '@vkontakte/vk-bridge';

const appStore = new AppStore(bridge);
const StoreContext = createContext(appStore);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export { StoreContext, appStore };
