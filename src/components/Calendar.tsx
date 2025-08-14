import { FC, useState } from 'react';
import { Div, Text, Card, IconButton } from '@vkontakte/vkui';
import { Icon28ChevronLeftOutline, Icon28ChevronRightOutline } from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';
import { DayModal } from './DayModal';
import { Workout } from '../types/api';
import './Calendar.css';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
}

export const Calendar: FC<CalendarProps> = observer(({ onDateSelect }) => {
  const appStore = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const hasWorkoutOnDate = (date: Date) => {
    return appStore.getUserWorkouts().some((workout: Workout) => {
      const workoutDate = new Date(workout.date);
      return workoutDate.toDateString() === date.toDateString();
    });
  };

  const getWorkoutsForDate = (date: Date) => {
    return appStore.getUserWorkouts().filter((workout: Workout) => {
      const workoutDate = new Date(workout.date);
      return workoutDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDateForModal(date);
    setShowDayModal(true);
    onDateSelect?.(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('ru', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <Card mode="outline">
      <Div>

        <div className="calendar-header">
          <IconButton onClick={handlePrevMonth} aria-label="Предыдущий месяц">
            <Icon28ChevronLeftOutline />
          </IconButton>
          <Text weight="1" style={{ textTransform: 'capitalize' }}>
            {monthName}
          </Text>
          <IconButton onClick={handleNextMonth} aria-label="Следующий месяц">
            <Icon28ChevronRightOutline />
          </IconButton>
        </div>


        <div className="calendar-weekdays">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="calendar-weekday">
              <Text weight="2" style={{ fontSize: 14 }}>{day}</Text>
            </div>
          ))}
        </div>


        <div className="calendar-grid">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            const hasWorkout = hasWorkoutOnDate(date);

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} 
                          ${isToday ? 'today' : ''} ${hasWorkout ? 'calendar-day--has-workout' : ''}`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
              >
                <Text 
                  style={{ 
                    fontSize: 14, 
                    color: isToday ? 'white' : undefined 
                  }} 
                  weight={isToday ? '2' : undefined}
                >
                  {date.getDate()}
                </Text>
                {hasWorkout && <div className="workout-indicator" />}
              </div>
            );
          })}
        </div>

        {showDayModal && selectedDateForModal && (
          <DayModal
            date={selectedDateForModal}
            workouts={getWorkoutsForDate(selectedDateForModal)}
            onClose={() => setShowDayModal(false)}
          />
        )}
      </Div>
    </Card>
  );
});


