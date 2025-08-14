import { FC, useState, useEffect } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  FormItem,
  Input,
  Button,
  Div,
  NavIdProps,
  DateInput,
  Textarea,
  Search,
  Spacing,
} from '@vkontakte/vkui';
import { ExerciseSelector } from '../components/ExerciseSelector';
import { FriendCard } from '../components/FriendCard';
import { NavBar } from '../components/NavBar';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Exercise, Friend, WorkoutExercise, WorkoutParticipant, Set } from '../types';
import { observer } from 'mobx-react-lite';

export interface WorkoutCreateProps extends NavIdProps {}

export const WorkoutCreate: FC<WorkoutCreateProps> = observer(({ id }) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();
  const initialDate = store.selectedDate ? new Date(store.selectedDate) : new Date();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [gym, setGym] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [exerciseSets, setExerciseSets] = useState<Record<string, Set[]>>({});
  const [friendSearch, setFriendSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'exercises' | 'friends'>('exercises');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (store.selectedDate) {
      setDate(new Date(store.selectedDate));
    }
  }, [store.selectedDate]);

  useEffect(() => {
    if (store.pendingExerciseForWorkout.exercise) {
      const { exercise } = store.pendingExerciseForWorkout;
      
      if (!selectedExercises.find(ex => ex.id === exercise.id)) {
        setSelectedExercises(prev => [...prev, exercise]);
      }
      
      store.clearPendingExerciseForWorkout();
    }
  }, [store.pendingExerciseForWorkout, selectedExercises]);

  const filteredFriends = store.friends.filter(friend =>
    `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(friendSearch.toLowerCase()) &&
    !selectedFriends.find(selected => selected.id === friend.id)
  );

  const handleExerciseAdd = (exercise: Exercise, sets: Set[]) => {
    setSelectedExercises(prev => [...prev, exercise]);
    setExerciseSets(prev => ({
      ...prev,
      [exercise.id]: sets
    }));
  };

  const handleExerciseRemove = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    setExerciseSets(prev => {
      const newSets = { ...prev };
      delete newSets[exerciseId];
      return newSets;
    });
  };

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriends(prev => [...prev, friend]);
  };

  const handleFriendRemove = (friendId: number) => {
    setSelectedFriends(prev => prev.filter(f => f.id !== friendId));
  };

  const handleSave = async () => {
    if (!title || !date || !time || !gym) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsCreating(true);

    try {
      const workoutExercises: WorkoutExercise[] = selectedExercises.map(exercise => ({
        exerciseId: exercise.id,
        exercise,
        sets: exerciseSets[exercise.id] || [],
        notes: '',
      }));

      const participants: WorkoutParticipant[] = selectedFriends.map(friend => ({
        userId: friend.id,
        user: {
          id: friend.id,
          first_name: friend.first_name,
          last_name: friend.last_name,
          photo_200: friend.photo_200,
          level: 'amateur',
          firstLogin: false,
        },
        status: 'pending' as const,
        invitedAt: new Date(),
      }));

      const workout = {
        title,
        description,
        date,
        time,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        gym,
        exercises: workoutExercises,
        participants,
        createdBy: store.currentUser?.id || 1,
        createdAt: new Date(),
        isTemplate: false,
      };

      store.addUserWorkout(workout);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      routeNavigator.replace('/workouts');
    } catch (error) {
      console.error('Ошибка при создании тренировки:', error);
      alert('Произошла ошибка при создании тренировки');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Panel id={id}>
        <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
          Создать тренировку
        </PanelHeader>

      <Group>
        <FormItem top="Название тренировки *" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название тренировки"
          />
        </FormItem>

        <FormItem top="Описание">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание тренировки (необязательно)"
          />
        </FormItem>

        <FormItem top="Дата *" required>
          <DateInput
            value={date}
            onChange={(value) => value && setDate(value)}
          />
        </FormItem>

        <FormItem top="Время *" required>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </FormItem>

        <FormItem top="Примерное время тренировки (мин)">
          <Input
            type="number"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="60"
          />
        </FormItem>

        <FormItem top="Зал *" required>
          <Input
            value={gym}
            onChange={(e) => setGym(e.target.value)}
            placeholder="Название зала"
          />
        </FormItem>
      </Group>

      <Group>
        <Div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Button
              size="m"
              mode={activeTab === 'exercises' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('exercises')}
            >
              Упражнения ({selectedExercises.length})
            </Button>
            <Button
              size="m"
              mode={activeTab === 'friends' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('friends')}
            >
              Друзья ({selectedFriends.length})
            </Button>
          </div>

          {activeTab === 'exercises' && (
            <ExerciseSelector
              selectedExercises={selectedExercises}
              exerciseSets={exerciseSets}
              onExerciseAdd={handleExerciseAdd}
              onExerciseRemove={handleExerciseRemove}
            />
          )}

          {activeTab === 'friends' && (
            <div>
              {selectedFriends.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4>Приглашенные друзья:</h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedFriends.map(friend => (
                      <div key={friend.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flex: 1 }}>{friend.first_name} {friend.last_name}</span>
                        <Button size="s" mode="secondary" onClick={() => handleFriendRemove(friend.id)}>
                          Удалить
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Search
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Поиск друзей..."
              />

              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {filteredFriends.map(friend => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onInvite={handleFriendSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </Div>
      </Group>

      <Group>
        <Div>
          <Button
            size="l"
            stretched
            onClick={handleSave}
            disabled={!title || !date || !time || !gym || isCreating}
            loading={isCreating}
          >
            {isCreating ? 'Создаем тренировку...' : 'Создать тренировку'}
          </Button>
        </Div>
      </Group>

      <Spacing size={80} />
      <NavBar />
    </Panel>
  </>
  );
});
