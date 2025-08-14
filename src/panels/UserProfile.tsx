import { FC, useState } from "react";
import {
    Panel,
    PanelHeader,
    Group,
    Header,
    Avatar,
    Div,
    Text,
    Card,
    SegmentedControl,
    NavIdProps,
    Spacing,
    PanelHeaderButton,
} from "@vkontakte/vkui";
import { Icon28ArrowLeftOutline } from "@vkontakte/icons";
import { observer } from "mobx-react-lite";
import { FriendCard } from "../components/FriendCard";
import { UserLeaderboardPosition } from "../components/UserLeaderboardPosition";
import { useStore } from "../stores/StoreContext";
import { useRouteNavigator, useParams } from "@vkontakte/vk-mini-apps-router";

export interface UserProfileProps extends NavIdProps {}

export const UserProfile: FC<UserProfileProps> = observer(({ id }) => {
    const store = useStore();
    const routeNavigator = useRouteNavigator();
    const params = useParams<'userId'>();
    const userId = Number(params?.userId);
    
    const [friendFilter, setFriendFilter] = useState("all");

    // Находим пользователя среди друзей или создаем объект пользователя
    const user = store.friends.find((f: any) => f.id === userId) || 
                 (userId === Number(store.currentUser?.id) ? {
                     id: store.currentUser?.id,
                     first_name: (store.currentUser as any)?.firstName,
                     last_name: (store.currentUser as any)?.lastName,
                     photo_200: (store.currentUser as any)?.photo,
                     isOnline: true,
                     gym: (store.currentUser as any)?.settings?.preferences?.defaultGym,
                     workoutsThisWeek: 0,
                     status: 'resting' as const
                 } : null);

    if (!user) {
        return (
            <Panel id={id}>
                <PanelHeader
                    before={
                        <PanelHeaderButton onClick={() => routeNavigator.back()}>
                            <Icon28ArrowLeftOutline />
                        </PanelHeaderButton>
                    }
                >
                    Профиль
                </PanelHeader>
                <Div>
                    <Text>Пользователь не найден</Text>
                </Div>
            </Panel>
        );
    }

    const getUserWorkouts = () => {
        return store.getUserWorkouts().filter((w: any) => w.createdBy === userId.toString());
    };
    
    const getUserAchievements = () => {
        const userWorkouts = getUserWorkouts();
        const totalWorkouts = userWorkouts.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const workoutsThisMonth = userWorkouts.filter((workout: any) => {
            const workoutDate = new Date(workout.date);
            return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear;
        }).length;

        const completedWorkouts = userWorkouts.filter((w: any) => w.completed).length;

        return {
            totalWorkouts,
            workoutsThisMonth,
            completedWorkouts
        };
    };

    const getRecentWorkouts = () => {
        return getUserWorkouts()
            .filter((workout: any) => new Date(workout.date) <= new Date())
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    };

    const getUserFriends = () => {
        // В реальном приложении здесь был бы API запрос за друзьями пользователя
        // Пока возвращаем общий список друзей (кроме просматриваемого пользователя)
        return store.friends.filter((friend: any) => friend.id !== userId);
    };

    const achievements = getUserAchievements();
    const recentWorkouts = getRecentWorkouts();
    const userFriends = getUserFriends();

    const filteredFriends = userFriends.filter((friend: any) => {
        switch (friendFilter) {
            case "online":
                return friend.isOnline;
            case "in_gym":
                return friend.status === "in_gym";
            default:
                return true;
        }
    });

    return (
        <Panel id={id}>
            <PanelHeader
                before={
                    <PanelHeaderButton onClick={() => routeNavigator.back()}>
                        <Icon28ArrowLeftOutline />
                    </PanelHeaderButton>
                }
            >
                Профиль
            </PanelHeader>

            <Group className="enhanced-group">
                <Div>
                    <Card className="enhanced-card" style={{ padding: "24px", textAlign: "center" }}>
                        <Avatar src={user.photo_200} size={80} style={{ margin: "0 auto 16px" }} />
                        <Text weight="1" style={{ fontSize: 24, marginBottom: 8 }}>
                            {user.first_name} {user.last_name}
                        </Text>
                        <Text weight="2" style={{ color: "var(--vkui--color_text_secondary)", marginBottom: 16 }}>
                            {user.gym || "Зал не указан"}
                        </Text>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                backgroundColor: user.isOnline ? "#4CAF50" : "#757575",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: 500,
                            }}
                        >
                            {user.isOnline ? "🟢 Онлайн" : "⚫ Не в сети"}
                        </div>
                    </Card>
                </Div>
            </Group>

            <Group header={<Header className="enhanced-header">Статистика</Header>} className="enhanced-group">
                <Div>
                    <div style={{ marginBottom: 16 }}>
                        <UserLeaderboardPosition 
                            userId={userId} 
                            isCurrentUser={userId === Number(store.currentUser?.id)}
                            clickable={false} 
                        />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                        <div className="stats-card">
                            <div className="stats-number">{achievements.workoutsThisMonth}</div>
                            <div className="stats-label">Этот месяц</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-number">{achievements.totalWorkouts}</div>
                            <div className="stats-label">Всего</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-number">{achievements.completedWorkouts}</div>
                            <div className="stats-label">Завершено</div>
                        </div>
                    </div>
                </Div>
            </Group>

            <Group header={<Header className="enhanced-header">Последняя активность</Header>} className="enhanced-group">
                <Div>
                    {recentWorkouts.length === 0 ? (
                        <Text weight="2" style={{ color: "var(--vkui--color_text_secondary)", textAlign: "center", padding: "20px" }}>
                            Нет тренировок
                        </Text>
                    ) : (
                        recentWorkouts.map((workout) => (
                            <div 
                                key={workout.id}
                                style={{
                                    padding: '16px',
                                    backgroundColor: 'var(--vkui--color_background_secondary)',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => routeNavigator.push(`/workout-detail/${workout.id}`)}
                            >
                                <Text weight="1" style={{ fontSize: '16px', marginBottom: '4px' }}>
                                    {workout.title}
                                </Text>
                                <Text weight="2" style={{ color: 'var(--vkui--color_text_secondary)', fontSize: '14px' }}>
                                    {new Date(workout.date).toLocaleDateString('ru')} • {workout.startTime || '00:00'} • {workout.location}
                                </Text>
                            </div>
                        ))
                    )}
                </Div>
            </Group>

            <Group header={<Header className="enhanced-header">Друзья ({userFriends.length})</Header>} className="enhanced-group">
                <Div>
                    <SegmentedControl
                        size="m"
                        value={friendFilter}
                        onChange={(value) => setFriendFilter(String(value))}
                        options={[
                            { label: "Все", value: "all" },
                            { label: "Онлайн", value: "online" },
                            { label: "В зале", value: "in_gym" },
                        ]}
                        style={{ marginBottom: 16 }}
                    />

                    {filteredFriends.length === 0 ? (
                        <Text weight="2" style={{ color: "var(--vkui--color_text_secondary)", textAlign: "center", padding: "20px" }}>
                            {friendFilter === "all" ? "Нет друзей" : "Нет друзей в этой категории"}
                        </Text>
                    ) : (
                        filteredFriends.map((friend: any) => (
                            <div 
                                key={friend.id}
                                onClick={() => routeNavigator.push(`/user-profile/${friend.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <FriendCard friend={friend} />
                            </div>
                        ))
                    )}
                </Div>
            </Group>

            <Spacing size={80} />
        </Panel>
    );
});
