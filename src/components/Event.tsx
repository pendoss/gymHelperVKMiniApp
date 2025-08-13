import { FC } from 'react';
import { Text, Div } from '@vkontakte/vkui';

interface EventProps {
  title: string;
  date: Date;
  time: string;
  location?: string;
  color?: string;
}

export const Event: FC<EventProps> = ({ title, time, location, color = '#2196F3' }) => {
  return (
    <Div
      style={{
        padding: 8,
        borderLeft: `4px solid ${color}`,
        background: 'var(--vkui--color_background_secondary)',
        borderRadius: '0 8px 8px 0',
        marginBottom: 8,
      }}
    >
      <Text weight="2" style={{ marginBottom: 2, fontSize: 14 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        {time}
        {location && ` • ${location}`}
      </Text>
    </Div>
  );
};
