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
  Card,
  Text,
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  PanelHeaderButton,
  Header,
} from '@vkontakte/vkui';
import {
  Icon24Dismiss,
  Icon28AddCircleOutline,
  Icon28DeleteOutline,
} from '@vkontakte/icons';
import { ExerciseCard } from '../components/ExerciseCard';
import { FriendCard } from '../components/FriendCard';
import { NavBar } from '../components/NavBar';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Exercise, Friend, Workout, WorkoutExercise, WorkoutParticipant, Set } from '../types';
import { observer } from 'mobx-react-lite';

export interface WorkoutCreateProps extends NavIdProps {}

export const WorkoutCreate: FC<WorkoutCreateProps> = observer(({ id }) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();
  
  // Используем выбранную дату из календаря, если есть, иначе сегодняшняя дата
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
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'exercises' | 'friends'>('exercises');
  const [isCreating, setIsCreating] = useState(false);
  
  // Состояние для модального окна выбора подходов
  const [showSetModal, setShowSetModal] = useState(false);
  const [selectedExerciseForSets, setSelectedExerciseForSets] = useState<Exercise | null>(null);
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingSets, setSelectedExistingSets] = useState<Set[]>([]);
  const [newSets, setNewSets] = useState<Set[]>([{ id: '1', reps: 10, weight: 50 }]);

  // Обновляем дату, если изменилась выбранная дата в календаре
  useEffect(() => {
    if (store.selectedDate) {
      setDate(new Date(store.selectedDate));
    }
  }, [store.selectedDate]);

  // Проверяем, есть ли предварительно выбранное упражнение
  useEffect(() => {
    if (store.pendingExerciseForWorkout.exercise) {
      const { exercise } = store.pendingExerciseForWorkout;
      
      // Добавляем упражнение если его еще нет в списке
      if (!selectedExercises.find(ex => ex.id === exercise.id)) {
        setSelectedExercises(prev => [...prev, exercise]);
      }
      
      // Очищаем временное хранилище
      store.clearPendingExerciseForWorkout();
    }
  }, [store.pendingExerciseForWorkout, selectedExercises]);

  const filteredExercises = store.exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) &&
    !selectedExercises.find(selected => selected.id === exercise.id)
  );

  const filteredFriends = store.friends.filter(friend =>
    `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(friendSearch.toLowerCase()) &&
    !selectedFriends.find(selected => selected.id === friend.id)
  );

  const handleExerciseSelect = (exercise: Exercise) => {
    // Открываем модальное окно для выбора подходов
    setSelectedExerciseForSets(exercise);
    setShowSetModal(true);
    
    // Получаем существующие подходы для этого упражнения
    const workoutsWithExercise = store.workouts.filter(workout => 
      workout.exercises.some(workoutExercise => workoutExercise.exerciseId === exercise.id)
    );
    
    if (workoutsWithExercise.length > 0) {
      setSelectedMode('existing');
    } else {
      setSelectedMode('new');
    }
    
    // Сбрасываем выбранные подходы
    setSelectedExistingSets([]);
    setNewSets([{ id: Date.now().toString(), reps: 10, weight: 50 }]);
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

  // Функции для работы с подходами
  const addNewSet = () => {
    const newSet: Set = {
      id: Date.now().toString(),
      reps: 10,
      weight: 50,
    };
    setNewSets(prev => [...prev, newSet]);
  };

  const removeNewSet = (setId: string) => {
    if (newSets.length > 1) {
      setNewSets(prev => prev.filter(set => set.id !== setId));
    }
  };

  const updateNewSet = (setId: string, field: keyof Set, value: number | undefined) => {
    setNewSets(prev => prev.map(set => 
      set.id === setId ? { ...set, [field]: value } : set
    ));
  };

  const toggleExistingSet = (set: Set) => {
    setSelectedExistingSets(prev => {
      const isSelected = prev.some(s => s.id === set.id);
      if (isSelected) {
        return prev.filter(s => s.id !== set.id);
      } else {
        return [...prev, set];
      }
    });
  };

  const handleSetModalConfirm = () => {
    if (!selectedExerciseForSets) return;
    
    const finalSets = selectedMode === 'existing' ? selectedExistingSets : newSets;
    
    // Добавляем упражнение с выбранными подходами
    setSelectedExercises(prev => [...prev, selectedExerciseForSets]);
    setExerciseSets(prev => ({
      ...prev,
      [selectedExerciseForSets.id]: finalSets
    }));
    
    // Закрываем модальное окно
    setShowSetModal(false);
    setSelectedExerciseForSets(null);
  };

  const handleSetModalClose = () => {
    setShowSetModal(false);
    setSelectedExerciseForSets(null);
    setSelectedExistingSets([]);
    setNewSets([{ id: Date.now().toString(), reps: 10, weight: 50 }]);
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
        },
        status: 'pending' as const,
        invitedAt: new Date(),
      }));

      const workout: Workout = {
        id: Date.now().toString(),
        title,
        description,
        date,
        time,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        gym,
        exercises: workoutExercises,
        participants,
        createdBy: 1, // Текущий пользователь
        createdAt: new Date(),
        isTemplate: false,
      };

      store.addWorkout(workout);
      
      // Небольшая задержка для показа состояния загрузки
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Перенаправляем на страницу списка тренировок
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
            <div>
              {selectedExercises.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4>Выбранные упражнения:</h4>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {selectedExercises.map(exercise => (
                      <Card key={exercise.id} mode="outline" style={{ padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{exercise.name}</Text>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <Text style={{ fontSize: 14, opacity: 0.7 }}>{exercise.muscleGroup}</Text>
                              {exerciseSets[exercise.id] && (
                                <Text style={{ fontSize: 12, background: 'var(--vkui--color_accent)', color: 'white', padding: '2px 6px', borderRadius: 4 }}>
                                  {exerciseSets[exercise.id].length} подходов
                                </Text>
                              )}
                            </div>
                          </div>
                          <Button size="s" mode="secondary" onClick={() => handleExerciseRemove(exercise.id)}>
                            Удалить
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Search
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Поиск упражнений..."
              />

              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {filteredExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    selectable
                    onSelect={handleExerciseSelect}
                  />
                ))}
              </div>
            </div>
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
    <ModalRoot activeModal={showSetModal ? 'set-selector' : null}>
      <ModalPage
        id="set-selector"
        onClose={handleSetModalClose}
        header={
          <ModalPageHeader
            before={
              <PanelHeaderButton onClick={handleSetModalClose} aria-label="Закрыть">
                <Icon24Dismiss />
              </PanelHeaderButton>
            }
          >
            Подходы для "{selectedExerciseForSets?.name}"
          </ModalPageHeader>
        }
      >
        <Group>
          <Div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button
                size="m"
                mode={selectedMode === 'existing' ? 'primary' : 'secondary'}
                onClick={() => setSelectedMode('existing')}
                stretched
              >
                Использовать готовые
              </Button>
              <Button
                size="m"
                mode={selectedMode === 'new' ? 'primary' : 'secondary'}
                onClick={() => setSelectedMode('new')}
                stretched
              >
                Создать новые
              </Button>
            </div>
          </Div>
        </Group>

        {selectedMode === 'existing' && selectedExerciseForSets && (
          <Group header={<Header size="s">Выберите подходы из предыдущих тренировок</Header>}>
            <Div>
              {(() => {
                const workoutsWithExercise = store.workouts.filter(workout => 
                  workout.exercises.some(workoutExercise => workoutExercise.exerciseId === selectedExerciseForSets.id)
                );
                
                return workoutsWithExercise.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {workoutsWithExercise.map((workout, workoutIndex) => {
                      const workoutExercise = workout.exercises.find(ex => ex.exerciseId === selectedExerciseForSets.id);
                      if (!workoutExercise) return null;
                      
                      return (
                        <Card key={workoutIndex} mode="outline" style={{ padding: 16 }}>
                          <div style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                              {workout.title}
                            </Text>
                            <Text style={{ fontSize: 14, opacity: 0.7 }}>
                              {new Date(workout.date).toLocaleDateString('ru-RU')}
                            </Text>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {workoutExercise.sets.map((set, setIndex) => {
                              const isSelected = selectedExistingSets.some(s => s.id === set.id);
                              return (
                                <div
                                  key={set.id}
                                  onClick={() => toggleExistingSet(set)}
                                  style={{
                                    padding: 12,
                                    background: isSelected 
                                      ? 'var(--vkui--color_accent_alpha)'
                                      : 'var(--vkui--color_background_secondary)',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    border: isSelected 
                                      ? '2px solid var(--vkui--color_accent)'
                                      : '1px solid var(--vkui--color_separator_primary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Text style={{ fontWeight: 'bold' }}>
                                    Подход #{setIndex + 1}
                                  </Text>
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    {set.reps && (
                                      <Text style={{ fontSize: 14 }}>
                                        {set.reps} повт.
                                      </Text>
                                    )}
                                    {set.weight && (
                                      <Text style={{ fontSize: 14 }}>
                                        {set.weight} кг
                                      </Text>
                                    )}
                                    {set.duration && (
                                      <Text style={{ fontSize: 14 }}>
                                        {Math.floor(set.duration / 60)}:{(set.duration % 60).toString().padStart(2, '0')}
                                      </Text>
                                    )}
                                    {set.distance && (
                                      <Text style={{ fontSize: 14 }}>
                                        {set.distance} м
                                      </Text>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card mode="outline" style={{ 
                    padding: 24, 
                    textAlign: 'center',
                    background: 'var(--vkui--color_background_secondary)',
                    opacity: 0.7
                  }}>
                    <Text>
                      У этого упражнения пока нет истории выполнения
                    </Text>
                  </Card>
                );
              })()}
            </Div>
          </Group>
        )}

        {selectedMode === 'new' && (
          <Group header={<Header size="s">Создайте новые подходы</Header>}>
            <Div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {newSets.map((set, index) => (
                  <Card key={set.id} mode="outline" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                        Подход #{index + 1}
                      </Text>
                      {newSets.length > 1 && (
                        <Button
                          size="s"
                          mode="tertiary"
                          before={<Icon28DeleteOutline />}
                          onClick={() => removeNewSet(set.id)}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                      <FormItem top="Повторения">
                        <Input
                          type="number"
                          value={set.reps?.toString() || ''}
                          onChange={(e) => updateNewSet(set.id, 'reps', parseInt(e.target.value) || undefined)}
                          placeholder="10"
                        />
                      </FormItem>
                      
                      <FormItem top="Вес (кг)">
                        <Input
                          type="number"
                          value={set.weight?.toString() || ''}
                          onChange={(e) => updateNewSet(set.id, 'weight', parseInt(e.target.value) || undefined)}
                          placeholder="50"
                        />
                      </FormItem>
                      
                      <FormItem top="Время (сек)">
                        <Input
                          type="number"
                          value={set.duration?.toString() || ''}
                          onChange={(e) => updateNewSet(set.id, 'duration', parseInt(e.target.value) || undefined)}
                          placeholder="60"
                        />
                      </FormItem>
                      
                      <FormItem top="Расстояние (м)">
                        <Input
                          type="number"
                          value={set.distance?.toString() || ''}
                          onChange={(e) => updateNewSet(set.id, 'distance', parseInt(e.target.value) || undefined)}
                          placeholder="1000"
                        />
                      </FormItem>
                    </div>
                  </Card>
                ))}
                
                <Button
                  size="m"
                  mode="secondary"
                  before={<Icon28AddCircleOutline />}
                  onClick={addNewSet}
                  stretched
                >
                  Добавить подход
                </Button>
              </div>
            </Div>
          </Group>
        )}

        <Group>
          <Div>
            <Button
              size="l"
              stretched
              onClick={handleSetModalConfirm}
              disabled={
                selectedMode === 'existing' 
                  ? selectedExistingSets.length === 0
                  : newSets.length === 0
              }
            >
              Добавить в тренировку ({
                selectedMode === 'existing' 
                  ? selectedExistingSets.length
                  : newSets.length
              } подходов)
            </Button>
          </Div>
        </Group>

        <Spacing size={80} />
      </ModalPage>
    </ModalRoot>
  </>
  );
});
