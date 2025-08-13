import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig.tsx';

// Инициализация VK Bridge с обработкой ошибок
try {
  vkBridge.send('VKWebAppInit');
} catch (error) {
  console.error('VK Bridge initialization error:', error);
}

createRoot(document.getElementById('root')!).render(<AppConfig />);

if (import.meta.env.MODE === 'development') {
  import('./eruda.ts');
}
