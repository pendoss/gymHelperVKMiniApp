import { useState, useEffect, ReactNode } from 'react';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { observer } from 'mobx-react-lite';

import { Home, Persik, ExerciseLibrary, ExerciseDetail, Profile, ExerciseEdit, WorkoutDetail, WorkoutEdit, UserProfile } from './panels';
import { WorkoutCreate } from './panels/WorkoutCreate';
import { WorkoutList } from './panels/WorkoutList';
import { DEFAULT_VIEW_PANELS } from './routes';
import { StoreContext, appStore, useStore } from './stores/StoreContext';
import { NavBar } from './components/NavBar';
import { OnBoardingModal } from './components/OnBoardingModal';

const AppContent = observer(() => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const [fetchedUser, setUser] = useState<UserInfo | undefined>();
  const [popout, setPopout] = useState<ReactNode | null>(<ScreenSpinner />);
  const store = useStore();

  useEffect(() => {
    async function fetchData() {
      try {
        const user = await bridge.send('VKWebAppGetUserInfo');
        setUser(user);
        
        // Сохраняем информацию о пользователе в store
        const userData = {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          photo: user.photo_200,
          city: user.city,
          settings: {
            preferences: {
              level: 'beginner' as const,
              defaultGym: undefined
            }
          },
          firstLogin: !localStorage.getItem('user_onboarded'), // проверяем был ли пользователь уже зарегистрирован
        };
        store.auth.state.user = userData as any;
        
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
        
        const fallbackUserData = {
          id: fallbackUser.id,
          firstName: fallbackUser.first_name,
          lastName: fallbackUser.last_name,
          photo: fallbackUser.photo_200,
          city: fallbackUser.city,
          settings: {
            preferences: {
              level: 'beginner' as const,
              defaultGym: undefined
            }
          },
          firstLogin: !localStorage.getItem('user_onboarded'), // проверяем был ли пользователь уже зарегистрирован
        };
        store.auth.state.user = fallbackUserData as any;
        
        setPopout(null);
      }
    }
    fetchData();
  }, [store]);

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
          <UserProfile id="user-profile" />
          <Persik id="persik" />
        </View>
        <NavBar/>
        <OnBoardingModal 
          isOpen={store.showOnBoardingModal} 
          onClose={() => {
            store.setShowOnBoardingModal(false);
            localStorage.setItem('user_onboarded', 'true'); // сохраняем что пользователь прошел онбординг
          }} 
        />
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
