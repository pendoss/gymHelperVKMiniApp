import { useState, useEffect, ReactNode } from 'react';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { observer } from 'mobx-react-lite';

import { Home, Persik, ExerciseLibrary, ExerciseDetail, Profile, ExerciseEdit, WorkoutDetail, WorkoutEdit } from './panels';
import { WorkoutCreate } from './panels/WorkoutCreate';
import { WorkoutList } from './panels/WorkoutList';
import { DEFAULT_VIEW_PANELS } from './routes';
import { StoreContext, appStore } from './stores/StoreContext';
import { NavBar } from './components/NavBar';

const AppContent = observer(() => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const [fetchedUser, setUser] = useState<UserInfo | undefined>();
  const [popout, setPopout] = useState<ReactNode | null>(<ScreenSpinner />);

  useEffect(() => {
    async function fetchData() {
      try {
        const user = await bridge.send('VKWebAppGetUserInfo');
        setUser(user);
        setPopout(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        const fallbackUser: UserInfo = {
          id: 1,
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          photo_100: 'https://via.placeholder.com/100',
          photo_200: 'https://via.placeholder.com/200',
          city: { title: 'Москва', id: 1 },
          sex: 1,
          country: { title: 'Россия', id: 1 },
          bdate_visibility: 0,
          can_access_closed: false,
          is_closed: false,
        };
        setUser(fallbackUser);
        setPopout(null);
      }
    }
    fetchData();
  }, []);

  return (
    <SplitLayout>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" fetchedUser={fetchedUser} />
          <WorkoutList id="workouts" />
          <WorkoutCreate id="create" />
          <WorkoutEdit id="workout-edit" />
          <ExerciseLibrary id="exercises" />
          <ExerciseDetail id="exercise-detail" />
          <WorkoutDetail id="workout-detail" />
          <ExerciseEdit id="exercise-edit" />
          <Profile id="profile" fetchedUser={fetchedUser} />
          <Persik id="persik" />
        </View>
        <NavBar/>
      </SplitCol>
      {popout}
    </SplitLayout>
  );
});

export const App = () => {
  return (
    <StoreContext.Provider value={appStore}>
      <AppContent />
    </StoreContext.Provider>
  );
};
