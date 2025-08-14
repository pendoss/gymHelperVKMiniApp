import { FC, useState, useEffect } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  Header,
  FormItem,
  Input,
  Button,
  Div,
  NavIdProps,
  Textarea,
  Select,
  Card,
  Text,
  IconButton,
  Spacing,
  Chip,
} from '@vkontakte/vkui';
import {
  Icon28AddOutline,
  Icon28DeleteOutline,
  Icon28AddCircleOutline,
  Icon28VideoOutline,
} from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { Exercise, ExerciseSet, ExerciseStep, ExerciseRecommendation } from '../types/api';

export interface ExerciseEditProps extends NavIdProps {}

export const ExerciseEdit: FC<ExerciseEditProps> = observer(({ id }) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();
  const params = useParams<'exerciseId'>();

  // Получаем ID упражнения из параметров роута (если редактируем)
  const exerciseId = params?.exerciseId;
  const existingExercise: Exercise | undefined = exerciseId ? store.exercises.exercises.find((e: Exercise) => e.id === parseInt(exerciseId)) : undefined;
  const isEditing = !!existingExercise;

  const [exerciseName, setExerciseName] = useState(existingExercise?.name || '');
  const [categories, setCategories] = useState<string[]>(existingExercise?.muscleGroup || []);
  const [description, setDescription] = useState(existingExercise?.description || '');
  const [equipment, setEquipment] = useState<string[]>(existingExercise?.equipment || []);
  const [restTime, setRestTime] = useState(existingExercise?.restTime?.toString() || '');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<ExerciseStep[]>(existingExercise?.steps || []);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>(existingExercise?.recommendations || []);
  const [sets, setSets] = useState<ExerciseSet[]>([]);

  // Инициализация данных при редактировании
  useEffect(() => {
    if (existingExercise) {
      setExerciseName(existingExercise.name);
      setCategories(existingExercise.muscleGroup || []);
      setDescription(existingExercise.description || '');
      setEquipment(existingExercise.equipment || []);
      setRestTime(existingExercise.restTime?.toString() || '');
      setVideoUrl(existingExercise.videoUrl || '');
      setSteps(existingExercise.steps || []);
      setRecommendations(existingExercise.recommendations || []);
      setSets([]);
    }
  }, [existingExercise]);
  
  const existingCategories = [...new Set(store.exercises.exercises.map((ex: Exercise) => ex.muscleGroup).flat())];
  const defaultCategories = [
    'Грудь',
    'Спина', 
    'Ноги',
    'Плечи',
    'Руки',
    'Пресс',
    'Кардио',
    'Ягодицы',
    'Икры',
    'Предплечья',
  ];
  const uniqueCategories = [...new Set([...existingCategories, ...defaultCategories])].sort();
  
  const existingEquipment = [...new Set(store.exercises.exercises.flatMap((ex: Exercise) => ex.equipment || []))];
  const defaultEquipment = [
    'Штанга',
    'Гантели',
    'Тренажер',
    'Собственный вес',
    'Турник',
    'Брусья',
    'Эспандер',
    'Скамья',
    'Коврик',
    'Беговая дорожка',
  ];
  const uniqueEquipment = [...new Set([...existingEquipment, ...defaultEquipment])].sort();

  const [customCategory, setCustomCategory] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');

  const addCategory = (categoryName: string) => {
    if (categoryName && !categories.includes(categoryName)) {
      setCategories([...categories, categoryName]);
    }
  };

  const removeCategory = (categoryName: string) => {
    setCategories(categories.filter(cat => cat !== categoryName));
  };

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      addCategory(customCategory.trim());
      setCustomCategory('');
    }
  };

  const addEquipment = (equipmentName: string) => {
    if (equipmentName && !equipment.includes(equipmentName)) {
      setEquipment([...equipment, equipmentName]);
    }
  };

  const removeEquipment = (equipmentName: string) => {
    setEquipment(equipment.filter(eq => eq !== equipmentName));
  };

  const addCustomEquipment = () => {
    if (customEquipment.trim()) {
      addEquipment(customEquipment.trim());
      setCustomEquipment('');
    }
  };

  const addSet = () => {
    const newSet: ExerciseSet = {
      id: Date.now(),
      reps: 10,
      weight: 80,
    };
    setSets([...sets, newSet]);
  };

  const removeSet = (setId: number) => {
    setSets(sets.filter((set) => set.id !== setId));
  };

  const updateSet = (setId: number, field: keyof ExerciseSet, value: number) => {
    setSets(sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)));
  };

  const addStep = () => {
    const newStep: ExerciseStep = {
      id: Date.now(),
      stepNumber: steps.length + 1,
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: number) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const updateStep = (stepId: number, description: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, description } : step
    ));
  };

  const addRecommendation = () => {
    const newRecommendation: ExerciseRecommendation = {
      id: Date.now(),
      text: '',
    };
    setRecommendations([...recommendations, newRecommendation]);
  };

  const removeRecommendation = (recommendationId: number) => {
    setRecommendations(recommendations.filter(rec => rec.id !== recommendationId));
  };

  const updateRecommendation = (recommendationId: number, text: string) => {
    setRecommendations(recommendations.map(rec => 
      rec.id === recommendationId ? { ...rec, text } : rec
    ));
  };

  const handleVideoFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl('');
    }
  };

  const handleSave = () => {
    if (!exerciseName.trim()) {
      alert('Введите название упражнения');
      return;
    }
    
    if (categories.length === 0) {
      alert('Выберите хотя бы одну категорию');
      return;
    }

    const weights = sets.map(set => set.weight).filter(weight => weight && weight > 0) as number[];
    const minWeight = weights.length > 0 ? Math.min(...weights) : undefined;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : undefined;

    const exerciseData = {
      name: exerciseName,
      description,
      muscleGroup: categories,
      equipment,
      instructions: '',
      restTime: restTime ? parseInt(restTime) : undefined,
      minWeight,
      maxWeight,
      videoUrl: videoUrl || undefined,
      videoFile: videoFile || undefined,
      steps: steps.filter(step => step.description.trim() !== ''),
      recommendations: recommendations.filter(rec => rec.text.trim() !== ''),
      defaultSets: sets.length > 0 ? sets.map(set => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight,
        duration: set.duration,
        distance: set.distance
      })) : undefined,
      createdBy: 1,
      createdAt: existingExercise?.createdAt || new Date(),
    };

    if (isEditing && exerciseId) {
      store.updateExercise(exerciseId, exerciseData);
    } else {
      const newExercise = {
        id: Date.now().toString(),
        ...exerciseData,
      };
      store.addExercise(newExercise);
    }

    routeNavigator.back();
  };

  const handleCancel = () => {
    routeNavigator.back();
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        <span className="train-sync-gradient-text">
          {isEditing ? 'Редактировать упражнение' : 'Создать упражнение'}
        </span>
      </PanelHeader>

      <Group header={<Header size="s">Информация об упражнении</Header>}>
        <FormItem top="Название упражнения">
          <Input
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Введите название упражнения"
          />
        </FormItem>

        <FormItem top="Категории">
          <div style={{ marginBottom: 12 }}>
            <Select
              placeholder="Выберите категорию"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addCategory(e.target.value);
                }
              }}
              options={[
                { label: 'Выберите из списка...', value: '' },
                ...uniqueCategories
                  .filter(cat => !categories.includes(cat))
                  .map(cat => ({ label: cat, value: cat }))
              ]}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Или введите новую..."
              style={{ flex: 1 }}
            />
            <Button
              size="s"
              onClick={addCustomCategory}
              disabled={!customCategory.trim()}
            >
              Добавить
            </Button>
          </div>

          {categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map((cat, index) => (
                <Chip
                  key={index}
                  removable={true}
                  onRemove={() => removeCategory(cat)}
                  style={{ fontSize: 12 }}
                >
                  {cat}
                </Chip>
              ))}
            </div>
          )}
        </FormItem>

        <FormItem top="Описание">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание упражнения"
            rows={3}
          />
        </FormItem>

        <FormItem top="Оборудование">
          <div style={{ marginBottom: 12 }}>
            <Select
              placeholder="Выберите оборудование"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addEquipment(e.target.value);
                }
              }}
              options={[
                { label: 'Выберите из списка...', value: '' },
                ...uniqueEquipment
                  .filter(eq => !equipment.includes(eq))
                  .map(eq => ({ label: eq, value: eq }))
              ]}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              value={customEquipment}
              onChange={(e) => setCustomEquipment(e.target.value)}
              placeholder="Или введите новое..."
              style={{ flex: 1 }}
            />
            <Button
              size="s"
              onClick={addCustomEquipment}
              disabled={!customEquipment.trim()}
            >
              Добавить
            </Button>
          </div>

          {equipment.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {equipment.map((eq, index) => (
                <Chip
                  key={index}
                  removable={true}
                  onRemove={() => removeEquipment(eq)}
                  style={{ fontSize: 12 }}
                >
                  {eq}
                </Chip>
              ))}
            </div>
          )}
        </FormItem>



        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <FormItem top="Время отдыха между подходами (сек)">
            <Input
              type="number"
              value={restTime}
              onChange={(e) => setRestTime(e.target.value)}
              placeholder="60"
            />
          </FormItem>
        </div>
      </Group>

      <Group header={<Header size="s">Видео демонстрация</Header>}>
        <FormItem top="Ссылка на видео">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            disabled={!!videoFile}
          />
        </FormItem>

        <FormItem top="Или загрузите файл">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileUpload}
              style={{ display: 'none' }}
              id="video-upload"
            />
            <Button
              mode="secondary"
              before={<Icon28VideoOutline />}
              onClick={() => document.getElementById('video-upload')?.click()}
            >
              {videoFile ? videoFile.name : 'Выбрать видео'}
            </Button>
            {videoFile && (
              <Button
                mode="tertiary"
                onClick={() => {
                  setVideoFile(null);
                  const input = document.getElementById('video-upload') as HTMLInputElement;
                  if (input) input.value = '';
                }}
              >
                Удалить
              </Button>
            )}
          </div>
        </FormItem>
      </Group>

      <Group 
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
            <Header size="s">Пошаговая техника</Header>
            
          </div>
        }
      >
        {steps.length === 0 ? (
          <Div>
            <Card mode="outline" style={{ 
              padding: 24, 
              textAlign: 'center',
              background: 'var(--vkui--color_background_secondary)',
              opacity: 0.7
            }}>
              <Text>
                Пока нет шагов. Добавьте первый шаг техники выполнения
              </Text>
            </Card>
          </Div>
        ) : (
          steps.map((step, index) => (
            <Card key={step.id} mode="outline" style={{ margin: '8px 16px' }}>
              <Div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text weight="2">Шаг {index + 1}</Text>
                  <IconButton
                    onClick={() => removeStep(step.id)}
                    style={{ color: '#F44336' }}
                    aria-label={`Удалить шаг ${index + 1}`}
                  >
                    <Icon28DeleteOutline />
                  </IconButton>
                </div>
                <FormItem>
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(step.id, e.target.value)}
                    placeholder="Описание шага..."
                    rows={3}
                  />
                </FormItem>
              </Div>
            </Card>
          ))
        )}
        <div style={{display:"flex", justifyContent:"center"}}>
          <IconButton
              onClick={addStep}
              style={{ 
                background: 'var(--vkui--color_accent)', 
                borderRadius: '50%',
                width: 32,
                height: 32,
              }}
              aria-label="Добавить шаг"
            >
              <Icon28AddCircleOutline color="#5181b8" />
              
            </IconButton>
        </div>
        
      </Group>

      <Group 
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
            <Header size="s">Рекомендации</Header>
          </div>
        }
      >
        {recommendations.length === 0 ? (
          <Div>
            <Card mode="outline" style={{ 
              padding: 24, 
              textAlign: 'center',
              background: 'var(--vkui--color_background_secondary)',
              opacity: 0.7
            }}>
              <Text>
                Пока нет рекомендаций. Добавьте первую рекомендацию
              </Text>
            </Card>
          </Div>
        ) : (
          recommendations.map((recommendation, index) => (
            <Card key={recommendation.id} mode="outline" style={{ margin: '8px 16px' }}>
              <Div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text weight="2">Рекомендация {index + 1}</Text>
                  <IconButton
                    onClick={() => removeRecommendation(recommendation.id)}
                    style={{ color: '#F44336' }}
                    aria-label={`Удалить рекомендацию ${index + 1}`}
                  >
                    <Icon28DeleteOutline />
                  </IconButton>
                </div>
                <FormItem>
                  <Textarea
                    value={recommendation.text}
                    onChange={(e) => updateRecommendation(recommendation.id, e.target.value)}
                    placeholder="Текст рекомендации..."
                    rows={2}
                  />
                </FormItem>
              </Div>
            </Card>
          ))
        )}
        <div style={{display:"flex", justifyContent:"center"}}>
          <IconButton
              onClick={addRecommendation}
              style={{ 
                background: 'var(--vkui--color_accent)', 
                borderRadius: '50%',
                width: 32,
                height: 32,
              }}
              aria-label="Добавить рекомендацию"
            >
              <Icon28AddCircleOutline color="#5181b8" />
              
            </IconButton>
        </div>
      </Group>

      <Group 
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
            <Header size="s">Подходы</Header>
            <Button 
              size="s" 
              onClick={addSet}
              className="train-sync-accent-bg"
              before={<Icon28AddOutline />}
            >
              Добавить
            </Button>
          </div>
        }
      >
        {sets.map((set, index) => (
          <Card key={set.id} mode="outline" style={{ margin: '8px 16px' }}>
            <Div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text weight="2">Подход {index + 1}</Text>
                <IconButton
                  onClick={() => removeSet(set.id)}
                  style={{ color: '#F44336' }}
                  aria-label={`Удалить подход ${index + 1}`}
                >
                  <Icon28DeleteOutline />
                </IconButton>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <FormItem top="Повторения">
                  <Input
                    type="number"
                    value={set.reps?.toString() || ''}
                    onChange={(e) => updateSet(set.id, 'reps', Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </FormItem>

                <FormItem top="Вес (кг)">
                  <Input
                    type="number"
                    value={set.weight?.toString() || ''}
                    onChange={(e) => updateSet(set.id, 'weight', Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </FormItem>

                <FormItem top="Время (сек)">
                  <Input
                    type="number"
                    value={set.duration?.toString() || ''}
                    onChange={(e) => updateSet(set.id, 'duration', Number(e.target.value) || 0)}
                    placeholder="Опционально"
                  />
                </FormItem>

                <FormItem top="Дистанция (м)">
                  <Input
                    type="number"
                    value={set.distance?.toString() || ''}
                    onChange={(e) => updateSet(set.id, 'distance', Number(e.target.value) || 0)}
                    placeholder="Опционально"
                  />
                </FormItem>
              </div>
            </Div>
          </Card>
        ))}
      </Group>

      <Group>
        <Div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button 
              size="l" 
              stretched 
              mode="outline"
              onClick={handleCancel}
            >
              Отмена
            </Button>
            <Button 
              size="l" 
              stretched 
              className="train-sync-accent-bg"
              onClick={handleSave}
            >
              Сохранить
            </Button>
          </div>
        </Div>
      </Group>

      <Spacing size={80} />
    </Panel>
  );
});
