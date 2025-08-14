import { FC } from "react";
import {
    Panel,
    PanelHeader,
    PanelHeaderButton,
    Header,
    Group,
    Cell,
    Div,
    Avatar,
    NavIdProps,
    Spacing,
    Text,
    Button,
    Chip,
} from "@vkontakte/vkui";
import { Icon28AddOutline, Icon28MoonOutline, Icon28SunOutline } from "@vkontakte/icons";
import { UserInfo } from "@vkontakte/vk-bridge";
import { observer } from "mobx-react-lite";
import { Calendar } from "../components/Calendar";
import { Leaderboard } from "../components/Leaderboard";
import { useStore } from "../stores/StoreContext";
import { useRouteNavigator } from "@vkontakte/vk-mini-apps-router";

export interface HomeProps extends NavIdProps {
    fetchedUser?: UserInfo;
}

export const Home: FC<HomeProps> = observer(({ id, fetchedUser }) => {
    const store = useStore();
    const { photo_200, city, first_name, last_name } = { ...fetchedUser };
    const routeNavigator = useRouteNavigator();
    const upcomingWorkouts = store.getUserWorkouts()
        .filter((workout) => {
            // Показываем только будущие тренировки
            return new Date(workout.date) >= new Date();
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    const handleCreateWorkout = () => {
        routeNavigator.push("/create");
    };

    const handleProfileClick = () => {
        routeNavigator.push("/profile");
    };

    const handleWorkoutClick = (workoutId: string) => {
        routeNavigator.push(`/workout-detail/${workoutId}`);
    };
    return (
        <Panel id={id}>
            <PanelHeader
                after={
                    <PanelHeaderButton onClick={store.toggleTheme} aria-label="Переключить тему">
                        {store.theme.mode === "dark" ? <Icon28SunOutline /> : <Icon28MoonOutline />}
                    </PanelHeaderButton>
                }
            >
                <span className="train-sync-gradient-text">TrainSync</span>
            </PanelHeader>

            {fetchedUser && (
                <Group
                    header={<Header className="enhanced-header">Добро пожаловать!</Header>}
                    className="group"
                    onClick={handleProfileClick}
                >
                    <Div>
                        <Cell
                            className="enhanced-cell"
                            before={photo_200 && <Avatar src={photo_200} size={48} />}
                            subtitle={city?.title}
                            multiline
                            style={{
                                padding: "8px",
                                borderRadius: "12px",
                            }}
                        >
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{`${first_name} ${last_name}`}</div>
                        </Cell>
                    </Div>
                </Group>
            )}

            {upcomingWorkouts.length > 0 && (
                <Group
                    header={<Header className="enhanced-header">Предстоящие тренировки</Header>}
                    className="enhanced-group"
                >
                    <Div>
                        {upcomingWorkouts.map((workout) => (
                            <div
                              key={workout.id}
                              className="enhanced-cell"
                              style={{
                              padding: "16px",
                              marginBottom: "8px",
                              cursor: "pointer",
                              }}
                              onClick={() => handleWorkoutClick(workout.id)}
                            >
                              <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                              >
                              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{workout.title}</h3>
                              <Chip
                                removable={false}
                                style={{backgroundColor: "#66BB6A", color: "white", padding: "1px"}}
                              ><p style={{color: "white", fontWeight: "bold", margin: 0}}>{workout.time}</p></Chip>
                              </div>
                              <div style={{ fontSize: 14, color: "var(--vkui--color_text_secondary)", marginTop: 4 }}>
                              {`${new Date(workout.date).toLocaleDateString("ru")} • ${
                                workout.gym
                              } • ${workout.exercises.length} упражнений`}
                              </div>
                            </div>
                        ))}
                    </Div>
                </Group>
            )}

            {upcomingWorkouts.length == 0 && (
                <Group
                    header={<Header className="enhanced-header">Предстоящие тренировки</Header>}
                    className="enhanced-group"
                >
                    <Div>
                        <div style={{ display: "flex", flexDirection: "column", paddingInline: "1rem" }}>
                            <Text weight="2">Нет запланированных тренировок</Text>
                            <Button
                                size="l"
                                stretched={false}
                                before={<Icon28AddOutline />}
                                onClick={handleCreateWorkout}
                                style={{ marginTop: "1rem" }}
                            >
                                Создать тренировку
                            </Button>
                        </div>
                    </Div>
                </Group>
            )}

            <Group
                header={<Header className="enhanced-header">Календарь тренировок</Header>}
                className="enhanced-group"
            >
                <Div>
                    <div className="enhanced-card calendar-container" style={{ padding: "16px" }}>
                        <Calendar onDateSelect={(date) => store.setSelectedDate(date)} />
                    </div>
                </Div>
            </Group>

            <Group header={<Header className="enhanced-header">Статистика</Header>} className="enhanced-group">
                <Div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                        <div className="stats-card">
                            <div className="stats-number">{store.achievements.totalWorkouts}</div>
                            <div className="stats-label">Всего тренировок</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-number">{upcomingWorkouts.length}</div>
                            <div className="stats-label">Предстоящих</div>
                        </div>
                    </div>
                </Div>
            </Group>

            <Leaderboard />

            {/* <Group header={<Header className="enhanced-header">Настройки</Header>} className="enhanced-group">
        <Div>
          <Cell
            className="enhanced-cell"
            after={
              <Switch
                checked={store.theme.mode === 'dark'}
                onChange={store.toggleTheme}
              />
            }
            style={{ 
              padding: '16px',
              borderRadius: '12px'
            }}
          >
            <div style={{ fontWeight: 600 }}>Темная тема</div>
          </Cell>
        </Div>
      </Group> */}

            <Spacing size={80} />
        </Panel>
    );
});
