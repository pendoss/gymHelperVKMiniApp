import { FC } from 'react';
import { IconButton } from '@vkontakte/vkui';
import { Icon28MoonOutline } from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';

export const ThemeToggle: FC = observer(() => {
  // Пока что просто показываем иконку, так как в RootStore нет темы
  // TODO: добавить управление темой в RootStore
  return (
    <IconButton onClick={() => console.log('Theme toggle clicked')}>
      <Icon28MoonOutline />
    </IconButton>
  );
});
