import { FC, useState } from 'react';
import {
  ModalRoot,
  ModalCard,
  Button,
  Text,
  Div,
  FormItem,
  Input,
  Spacing,
} from '@vkontakte/vkui';
import { Icon28FavoriteOutline, Icon28CancelOutline } from '@vkontakte/icons';
import { useRootStore } from '../store/RootStoreContext';
import { observer } from 'mobx-react-lite';

interface OnBoardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnBoardingModal: FC<OnBoardingModalProps> = observer(({ isOpen, onClose }) => {
  const store = useRootStore();
  const [gymName, setGymName] = useState('');

  const handleSaveGym = () => {
    if (gymName.trim() && store.user) {
      // Save gym to user profile - will need API endpoint for this
      // store.user.gym = gymName.trim();
    }
    localStorage.setItem('user_onboarded', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('user_onboarded', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalRoot activeModal="onboarding-modal">
      <ModalCard 
        id="onboarding-modal"
      >
        <Div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️‍♂️</div>
            <Text weight="2" style={{ fontSize: 20, marginBottom: 8 }}>
              Добро пожаловать в TrainSync!
            </Text>
            <Text weight="2" style={{ fontSize: 16, marginBottom: 8 }}>
              Давайте настроим ваш профиль
            </Text>
            <Text style={{ fontSize: 14, opacity: 0.7 }}>
              Укажите ваш основной спортзал для более удобного планирования тренировок
            </Text>
          </div>

          <FormItem top="Название спортзала">
            <Input
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="Например: FitnessPark, SportLife..."
            />
          </FormItem>

          <Spacing size={24} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button
              size="l"
              stretched
              mode="primary"
              before={<Icon28FavoriteOutline />}
              onClick={handleSaveGym}
              disabled={!gymName.trim()}
            >
              Сохранить основной зал
            </Button>
            
            <Button
              size="l"
              stretched
              mode="secondary"
              before={<Icon28CancelOutline />}
              onClick={handleSkip}
            >
              Пропустить
            </Button>
          </div>

          <div style={{ 
            textAlign: 'center', 
            marginTop: 16, 
            fontSize: 12, 
            opacity: 0.6 
          }}>
            Вы сможете изменить основной зал в профиле в любое время
          </div>
        </Div>
      </ModalCard>
    </ModalRoot>
  );
});
