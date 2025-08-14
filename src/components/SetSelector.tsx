import { FC, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  Header,
  Button,
  Div,
  Card,
  Text,
  FormItem,
  Input,
  Spacing,
  NavIdProps,
} from '@vkontakte/vkui';
import {
  Icon28AddCircleOutline,
  Icon28DeleteOutline,
} from '@vkontakte/icons';
import { ExerciseSet } from '../types/api';

interface SetSelectorProps extends NavIdProps {
  exerciseName: string;
  existingSets: Array<{
    workoutTitle: string;
    workoutDate: Date;
    sets: ExerciseSet[];
  }>;
  onConfirm: (selectedSets: ExerciseSet[]) => void;
  onBack: () => void;
}

export const SetSelector: FC<SetSelectorProps> = ({
  id,
  exerciseName,
  existingSets,
  onConfirm,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingSets, setSelectedExistingSets] = useState<ExerciseSet[]>([]);
  const [newSets, setNewSets] = useState<ExerciseSet[]>([
    { id: 1, reps: 10, weight: 50 }
  ]);

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

  const toggleExistingSet = (set: ExerciseSet) => {    setSelectedExistingSets(prev => {
      const isSelected = prev.some(s => s.id === set.id);
      if (isSelected) {
        return prev.filter(s => s.id !== set.id);
      } else {
        return [...prev, set];
      }
    });
  };

  const handleConfirm = () => {
    const finalSets = selectedMode === 'existing' ? selectedExistingSets : newSets;
    onConfirm(finalSets);
    onBack();
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={onBack} />}>
        Подходы для "{exerciseName}"
      </PanelHeader>
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

        {selectedMode === 'existing' && (
          <Group header={<Header size="s">Выберите подходы из предыдущих тренировок</Header>}>
            <Div>
              {existingSets.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {existingSets.map((workoutGroup, workoutIndex) => (
                    <Card key={workoutIndex} mode="outline" style={{ padding: 16 }}>
                      <div style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                          {workoutGroup.workoutTitle}
                        </Text>
                        <Text style={{ fontSize: 14, opacity: 0.7 }}>
                          {new Date(workoutGroup.workoutDate).toLocaleDateString('ru-RU')}
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {workoutGroup.sets.map((set, setIndex) => {
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
                  ))}
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
              )}
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
              onClick={handleConfirm}
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
    </Panel>
  );
};
