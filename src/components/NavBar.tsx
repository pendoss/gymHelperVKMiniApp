import { FC } from 'react';
import { Tabbar, TabbarItem } from '@vkontakte/vkui';
import {
  Icon28HomeOutline,
  Icon28CalendarOutline,
  Icon28AddOutline,
  Icon28ListOutline,
  Icon28UserOutline,
} from '@vkontakte/icons';
import { useRouteNavigator, useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';

export const NavBar: FC = () => {
  const routeNavigator = useRouteNavigator();
  const { panel } = useActiveVkuiLocation();

  const tabs = [
    {
      id: 'home',
      text: 'Главная',
      icon: <Icon28HomeOutline />,
    },
    {
      id: 'workouts',
      text: 'Тренировки',
      icon: <Icon28CalendarOutline />,
    },
    {
      id: 'create',
      text: 'Создать',
      icon: <Icon28AddOutline />,
    },
    {
      id: 'exercises',
      text: 'Упражнения',
      icon: <Icon28ListOutline />,
    },
    {
      id: 'profile',
      text: 'Профиль',
      icon: <Icon28UserOutline />,
    },
  ];

  return (
    <Tabbar>
      {tabs.map(tab => (
        <TabbarItem
          key={tab.id}
          selected={panel === tab.id}
          onClick={() => routeNavigator.push(tab.id === 'home' ? '/' : `/${tab.id}`)}
          aria-label={tab.text}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {tab.icon}
            <span style={{ fontSize: 10 }}>{tab.text}</span>
          </div>
        </TabbarItem>
      ))}
    </Tabbar>
  );
};
