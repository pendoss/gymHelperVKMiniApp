import { FC, useState } from 'react';
import {
  Group,
  Search,
  Card,
  Text,
  Button,
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  PanelHeaderButton,
  Header,
  Div,
  FormItem,
  Input,
  Spacing,
} from '@vkontakte/vkui';
import {
  Icon24Dismiss,
  Icon28AddCircleOutline,
  Icon28DeleteOutline,
} from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { ExerciseCard } from './ExerciseCard';
import { useRootStore } from '../store/RootStoreContext';
import { observer } from 'mobx-react-lite';
import type { Exercise, ExerciseSet } from '../store/RootStore';

export interface ExerciseSelectorProps {
  selectedExercises: { exerciseId: number; exercise: Exercise; sets: ExerciseSet[] }[];
  onExercisesChange: (exercises: { exerciseId: number; exercise: Exercise; sets: ExerciseSet[] }[]) => void;
  onClose: () => void;
}

export const ExerciseSelector: FC<ExerciseSelectorProps> = observer(({
  selectedExercises,
  onExercisesChange
}) => {
  const appStore = useRootStore();
  const routeNavigator = useRouteNavigator();
  
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showSetModal, setShowSetModal] = useState(false);
  const [selectedExerciseForSets, setSelectedExerciseForSets] = useState<Exercise | null>(null);
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingSets, setSelectedExistingSets] = useState<ExerciseSet[]>([]);
  const [newSets, setNewSets] = useState<ExerciseSet[]>([{ id: 1, reps: 10, weight: 50 }]);

  const filteredExercises = appStore.exercises.filter((exercise: Exercise) =>
    exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) &&
    !selectedExercises.find(selected => selected.exerciseId === exercise.id)
  );

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExerciseForSets(exercise);
    setShowSetModal(true);
    
    const workoutsWithExercise = appStore.workouts.filter((workout: any) => 
      workout.exercises.some((workoutExercise: any) => workoutExercise.exerciseId === exercise.id)
    );
    
    // В API типах нет defaultSets, поэтому упрощаем логику
    if (workoutsWithExercise.length > 0) {
      setSelectedMode('existing');
    } else {
      setSelectedMode('new');
    }
    
    setSelectedExistingSets([]);
    setNewSets([{ id: Date.now(), reps: 10, weight: 50}]);
  };

  const addNewSet = () => {
    const newSet: ExerciseSet = {
      id: Date.now(),
      reps: 10,
      weight: 50,
    };
    setNewSets(prev => [...prev, newSet]);
  };

  const removeNewSet = (setId: number) => {
    if (newSets.length > 1) {
      setNewSets(prev => prev.filter(set => set.id !== setId));
    }
  };

  const updateNewSet = (setId: number, field: keyof ExerciseSet, value: number | undefined) => {
    setNewSets(prev => prev.map(set =>
      set.id === setId ? { ...set, [field]: value } : set
    ));
  };

  const toggleExistingSet = (set: ExerciseSet) => {
    setSelectedExistingSets(prev => {
      const exists = prev.find(s => s.id === set.id);
      if (exists) {
        return prev.filter(s => s.id !== set.id);
      } else {
        return [...prev, set];
      }
    });
  };

  const selectAllDefaultSets = () => {
    // Метод убран, так как defaultSets больше не используется
  };  const handleSetModalConfirm = () => {
    if (!selectedExerciseForSets) return;
    
    const finalSets = selectedMode === 'existing' ? selectedExistingSets : newSets;
    
    const newExercise = {
      exerciseId: selectedExerciseForSets.id,
      exercise: selectedExerciseForSets,
      sets: finalSets
    };
    
    onExercisesChange([...selectedExercises, newExercise]);
    
    setShowSetModal(false);
    setSelectedExerciseForSets(null);
  };

  const handleSetModalClose = () => {
    setShowSetModal(false);
    setSelectedExerciseForSets(null);
    setSelectedExistingSets([]);
    setNewSets([{ id: Date.now(), reps: 10, weight: 50 }]);
    setSelectedMode('existing');
  };

  return (
    <>
      <div>
        {selectedExercises.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4>Выбранные упражнения:</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {selectedExercises.map(exercise => (
                <Card key={exercise.exerciseId} mode="outline" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{exercise.exercise.name}</Text>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, opacity: 0.7 }}>{exercise.exercise.muscleGroup.join(', ')}</Text>
                        {exercise.sets.length > 0 && (
                          <Text style={{ fontSize: 12, background: 'var(--vkui--color_accent)', color: 'white', padding: '2px 6px', borderRadius: 4 }}>
                            {exercise.sets.length} подходов
                          </Text>
                        )}
                      </div>
                    </div>
                    <Button size="s" mode="secondary" onClick={() => {
                      const updatedExercises = selectedExercises.filter(ex => ex.exerciseId !== exercise.exerciseId);
                      onExercisesChange(updatedExercises);
                    }}>
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
          {appStore.exercises.length === 0 ? (
            <Card mode="outline" style={{ 
              padding: 24, 
              textAlign: 'center',
              background: 'var(--vkui--color_background_secondary)'
            }}>
              <Text style={{ marginBottom: 16, fontSize: 16 }}>
                У вас пока нет упражнений
              </Text>
              <Text style={{ marginBottom: 20, opacity: 0.7 }}>
                Создайте первое упражнение, чтобы добавить его в тренировку
              </Text>
              <Button 
                size="m" 
                mode="primary"
                onClick={() => {
                  // Навигация к созданию упражнения
                  routeNavigator.push('/exercise-edit');
                }}
              >
                Создать упражнение
              </Button>
            </Card>
          ) : filteredExercises.length === 0 ? (
            <Card mode="outline" style={{ 
              padding: 24, 
              textAlign: 'center',
              background: 'var(--vkui--color_background_secondary)',
              opacity: 0.7
            }}>
              <Text>
                Упражнения не найдены
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
                Попробуйте изменить поисковый запрос
              </Text>
            </Card>
          ) : (
            filteredExercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                selectable
                onSelect={handleExerciseSelect}
              />
            ))
          )}
        </div>
      </div>

      <ModalRoot activeModal={showSetModal ? 'set-selector' : null}>
        <ModalPage
          id="set-selector"
          onClose={handleSetModalClose}
          settlingHeight={100}
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
                  Готовые
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
            <Group header={<Header size="s">Выберите подходы</Header>}>
              <Div>
                {(() => {
                  const workoutsWithExercise = appStore.workouts.filter((workout: any) => 
                    workout.exercises.some((workoutExercise: any) => workoutExercise.exerciseId === selectedExerciseForSets.id)
                  );
                  
                  const hasDefaultSets = selectedExerciseForSets.defaultSets && selectedExerciseForSets.defaultSets.length > 0;
                  const hasWorkoutHistory = workoutsWithExercise.length > 0;
                  
                  if (!hasDefaultSets && !hasWorkoutHistory) {
                    return (
                      <Card mode="outline" style={{ 
                        padding: 24, 
                        textAlign: 'center',
                        background: 'var(--vkui--color_background_secondary)',
                        opacity: 0.7
                      }}>
                        <Text>
                          У этого упражнения пока нет готовых подходов
                        </Text>
                      </Card>
                    );
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {hasDefaultSets && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                              Из упражнения:
                            </Text>
                            <Button
                              size="s"
                              mode="secondary"
                              onClick={selectAllDefaultSets}
                            >
                              {selectedExerciseForSets.defaultSets!.every(set => 
                                selectedExistingSets.some(s => s.id === set.id)
                              ) ? 'Убрать все' : 'Выбрать все'}
                            </Button>
                          </div>
                          <Card mode="outline" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {selectedExerciseForSets.defaultSets!.map((set, setIndex) => {
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
                        </div>
                      )}
                      
                      {hasWorkoutHistory && (
                        <div>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: 'var(--vkui--color_accent)' }}>
                            Из предыдущих тренировок:
                          </Text>
                          {workoutsWithExercise.map((workout, workoutIndex) => {
                            const workoutExercise = workout.exercises.find((ex: any) => ex.exerciseId === selectedExerciseForSets.id);
                            if (!workoutExercise) return null;
                            
                            return (
                              <Card key={workoutIndex} mode="outline" style={{ padding: 16, marginBottom: 12 }}>
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
                      )}
                    </div>
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
