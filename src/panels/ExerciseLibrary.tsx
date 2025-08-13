import { FC, useState } from 'react';
import {
  Panel,
  Search,
  Group,
  Div,
  Button,
  NavIdProps,
  Card,
  Text,
  Badge,
  Spacing,
  Tabs,
  TabsItem,
  HorizontalScroll,
  Chip,
} from '@vkontakte/vkui';
import { 
  Icon28AddOutline, 
  Icon28HashtagOutline,
} from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

export interface ExerciseLibraryProps extends NavIdProps {}

export const ExerciseLibrary: FC<ExerciseLibraryProps> = observer(({ id }) => {
  const store = useStore();
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const routeNavigator = useRouteNavigator();

  // Получаем уникальные категории из существующих упражнений
  const dynamicCategories = store.getUniqueCategories();
  const categories = dynamicCategories.length > 0 ? ['Все', ...dynamicCategories] : ['Все'];

    const filteredExercises = store.exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         exercise.muscleGroup.some(group => group.toLowerCase().includes(searchValue.toLowerCase())) ||
                         (exercise.equipment && exercise.equipment.some(eq => eq.toLowerCase().includes(searchValue.toLowerCase())));
    const matchesCategory = selectedCategory === 'Все' || exercise.muscleGroup.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAddExercise = () => {
    routeNavigator.push('/exercise-edit');
  };

  const handleExerciseClick = (exerciseId: string) => {
    routeNavigator.push(`/exercise-detail/${exerciseId}`);
  };

  return (
    <Panel id={id}>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text weight="1" style={{ fontSize: 24 }}>
            <span className="train-sync-gradient-text">Библиотека упражнений</span>
          </Text>
        </div>
      </div>
      <Group>
        <Div>
          <Search
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Поиск упражнений..."
          />
        </Div>
      </Group>

      <Group>
        <Tabs withScrollToSelectedTab={true} >
          <HorizontalScroll>
            {categories.map((category) => (
            <TabsItem
              key={category}
              id={`tab-${category.toLowerCase()}`}
              selected={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              aria-controls={`exercises-content-${selectedCategory.toLowerCase()}`}
            >
              {category}
            </TabsItem>
          ))}
          </HorizontalScroll>
          
        </Tabs>
      </Group>

      <Group>
        <Div>
          <div 
            id={`exercises-content-${selectedCategory.toLowerCase()}`}
            aria-labelledby={`tab-${selectedCategory.toLowerCase()}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
              marginBottom: 16
            }}
          >
            {filteredExercises.map((exercise) => {
              return (
                <Card 
                  key={exercise.id} 
                  mode="outline" 
                  className="enhanced-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleExerciseClick(exercise.id)}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      height: 120,
                      background: 'var(--train-sync-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      borderTopLeftRadius: '16px',
                      borderTopRightRadius: '16px'
                    }}>
                      <div style={{ 
                        color: 'white', 
                        fontSize: 14, 
                        fontWeight: 600,
                        textAlign: 'center',
                        padding: '0 16px'
                      }}>
                        {exercise.name}
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                      }}>
                        <Badge
                          style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontSize: 11
                          }}
                        >
                          {exercise.muscleGroup[0]}
                        </Badge>
                      </div>
                    </div>

                    <Div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.4 }}>
                          {exercise.description}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 16, 
                        marginBottom: 12, 
                        fontSize: 12, 
                        color: 'var(--vkui--color_text_secondary)' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon28HashtagOutline style={{ width: 14, height: 14, color: 'var(--vkui--color_accent)' }} />
                          <span>Целевая группа</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {exercise.muscleGroup.map((group, index) => (
                          <Chip key={index} removable={false} style={{ fontSize: 11 , backgroundColor: 'var(--vkui--color_background_secondary)'}}>
                            {group}
                          </Chip>
                        ))}
                        {exercise.equipment && exercise.equipment.length > 0 && (
                          exercise.equipment.map((eq, index) => (
                            <Chip key={`eq-${index}`} removable={false} style={{ fontSize: 11, backgroundColor: 'var(--vkui--color_background_secondary)' }}>
                              {eq}
                            </Chip>
                          ))
                        )}
                      </div>
                    </Div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredExercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Text style={{ marginBottom: 16, opacity: 0.7 }}>
                {searchValue ? 'Упражнения не найдены' : 'Нет упражнений в этой категории'}
              </Text>
            </div>
          )}
        </Div>
      </Group>

      <Group>
        <Div>
          <Button 
            size="l"
            stretched
            onClick={handleAddExercise}
            className="train-sync-accent-bg enhanced-button"
            before={<Icon28AddOutline />}
          >
            Создать упражнение
          </Button>
        </Div>
      </Group>

      <Spacing size={80} />
    </Panel>
  );
});