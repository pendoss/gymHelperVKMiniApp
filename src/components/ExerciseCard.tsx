import { FC } from 'react';
import { Card, Text, Div, Button, Avatar } from '@vkontakte/vkui';
import { Icon28EditOutline } from '@vkontakte/icons';
import { Exercise } from '../types';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selectable?: boolean;
  selected?: boolean;
}

export const ExerciseCard: FC<ExerciseCardProps> = ({
  exercise,
  onSelect,
  selectable = false,
  selected = false,
}) => {
  const routeNavigator = useRouteNavigator();

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(exercise);
    } else {
      routeNavigator.push('/exercise-detail');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    routeNavigator.push('/exercise-edit');
  };

  return (
    <Card
      mode={selected ? 'shadow' : 'outline'}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        border: selected ? '2px solid var(--vkui--color_accent)' : undefined,
      }}
      onClick={handleClick}
    >
      <Div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text weight="2" style={{ marginBottom: 4 }}>
              {exercise.name}
            </Text>
            <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
              {exercise.muscleGroup.join(', ')}
            </Text>
            {exercise.description && (
              <Text style={{ fontSize: 14, marginBottom: 8 }}>
                {exercise.description}
              </Text>
            )}
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {exercise.equipment.map((eq, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: 'var(--vkui--color_background_secondary)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  >
                    {eq}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {exercise.imageUrl && (
            <Avatar size={48} src={exercise.imageUrl} style={{ marginLeft: 12 }} />
          )}
        </div>

        {!selectable && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="s"
              mode="tertiary"
              before={<Icon28EditOutline />}
              onClick={handleEdit}
              aria-label="Редактировать упражнение"
            >
              Изменить
            </Button>
          </div>
        )}
      </Div>
    </Card>
  );
};
