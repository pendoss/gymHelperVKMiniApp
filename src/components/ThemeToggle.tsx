import { FC } from 'react';
import { IconButton } from '@vkontakte/vkui';
import { Icon28MoonOutline, Icon28SunOutline } from '@vkontakte/icons';
import { useStore } from '../stores/StoreContext';
import { observer } from 'mobx-react-lite';

export const ThemeToggle: FC = observer(() => {
  const store = useStore();

  return (
    <IconButton onClick={store.toggleTheme}>
      {store.theme === 'dark' ? <Icon28SunOutline /> : <Icon28MoonOutline />}
    </IconButton>
  );
});
