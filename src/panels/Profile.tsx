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
    Search,
    SegmentedControl,
    NavIdProps,
    Chip,
    Spacing,
    FormItem,
    Input,
    Button,
} from "@vkontakte/vkui";
import { observer } from "mobx-react-lite";
import { FriendCard } from "../components/FriendCard";
import { Event } from "../components/Event";
import { WorkoutInvitations } from "../components/invitation/WorkoutInvitations";
import { UserLeaderboardPosition } from "../components/UserLeaderboardPosition";
import { useStore } from "../stores/StoreContext";
import { UserInfo } from "@vkontakte/vk-bridge";
import { useRouteNavigator } from "@vkontakte/vk-mini-apps-router";

export interface ProfileProps extends NavIdProps {
    fetchedUser?: UserInfo;
}

export const Profile: FC<ProfileProps> = observer(({ id, fetchedUser }) => {
    const store = useStore();
    const routeNavigator = useRouteNavigator();
    const [friendSearch, setFriendSearch] = useState("");
    const [friendFilter, setFriendFilter] = useState("all");
    const [isEditingGym, setIsEditingGym] = useState(false);
    const [newMainGym, setNewMainGym] = useState((store.currentUser as any)?.settings?.preferences?.defaultGym || "");

    const { photo_200, first_name, last_name } = { ...fetchedUser };

    const handleSaveMainGym = () => {
        if (newMainGym.trim()) {
            store.setMainGym(newMainGym.trim());
            setIsEditingGym(false);
        } else {
            alert("Введите название спортзала");
        }
    };

    const getPersonalizedGreeting = () => {
        const user = store.currentUser;
        if (!user) return "Добро пожаловать!";
        console.log(user.id);
        const timeOfDay = new Date().getHours();
        let greeting = "";

        if (timeOfDay < 12) {
            greeting = "Доброе утро";
        } else if (timeOfDay < 18) {
            greeting = "Добрый день";
        } else {
            greeting = "Добрый вечер";
        }

        return `${greeting}, ${user.firstName}!`;
    };

    const getUserLevel = () => {
        const currentUser = store.currentUser as any;

        if (currentUser?.settings?.preferences?.level) {
            switch (currentUser.settings.preferences.level) {
                case "beginner":
                    return "Новичок";
                case "amateur":
                    return "Любитель";
                case "intermediate":
                    return "Средний";
                case "advanced":
                    return "Продвинутый";
                case "expert":
                    return "Эксперт";
                default:
                    return "Новичок";
            }
        }

        const totalWorkouts = currentUser?.stats?.totalWorkouts || store.getUserWorkouts().length || 0;
        if (totalWorkouts < 10) return "Новичок";
        if (totalWorkouts < 50) return "Любитель";
        if (totalWorkouts < 100) return "Продвинутый";
        return "Эксперт";
    };

    const getMostVisitedGym = () => {
        const gymCounts = store.getUserWorkouts().reduce((acc: any, workout: any) => {
            if (workout.location) {
                acc[workout.location] = (acc[workout.location] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const mostVisited = Object.entries(gymCounts).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0];
        return mostVisited ? mostVisited[0] : "Не указан";
    };

    const getCompletedWorkoutsCount = () => {
        return store.getUserWorkouts().filter((workout: any) => workout.status === "completed" || workout.completedAt)
            .length;
    };

    const getRecentWorkouts = () => {
        return store
            .getUserWorkouts()
            .filter((workout: any) => {
                return new Date(workout.date) <= new Date();
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    };

    const filteredFriends = store.friends.filter((friend: any) => {
        const matchesSearch = `${friend.first_name} ${friend.last_name}`
            .toLowerCase()
            .includes(friendSearch.toLowerCase());

        if (!matchesSearch) return false;

        switch (friendFilter) {
            case "online":
                return friend.isOnline;
            case "by_gym":
                return friend.gym !== undefined;
            default:
                return true;
        }
    });

    const recentWorkouts = getRecentWorkouts();

    return (
        <Panel id={id}>
            <PanelHeader>Профиль</PanelHeader>
            <Group
                header={<Header className="enhanced-header">{getPersonalizedGreeting()}</Header>}
                className="enhanced-group"
            >
                <Div>
                    <Card mode="outline" className="enhanced-card">
                        <Div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                                <Avatar size={64} src={photo_200} />
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                                        {store.currentUser?.firstName || first_name}{" "}
                                        {store.currentUser?.lastName || last_name}
                                    </div>
                                    <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
                                        Основной зал:{" "}
                                        {(store.currentUser as any)?.settings?.preferences?.defaultGym || "Не выбран"}
                                    </div>
                                    <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
                                        Самый частый зал: {getMostVisitedGym()}
                                    </div>
                                    <Chip style={{ backgroundColor: "#2196F3", borderRadius: "8px" }} removable={false}>
                                        <p style={{ color: "#ffffff" }}>{getUserLevel()}</p>
                                    </Chip>
                                </div>
                            </div>
                        </Div>
                    </Card>
                </Div>
            </Group>
            <Group header={<Header className="enhanced-header">Достижения</Header>} className="enhanced-group">
                <Div>
                    <div style={{ marginBottom: 16 }}>
                        <Text weight="2" style={{ marginBottom: 8, fontSize: 16 }}>
                            Позиция в лидерборде
                        </Text>
                        <UserLeaderboardPosition isCurrentUser={true} clickable={false} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Card mode="outline" className="stats-card-individual">
                            <Div style={{ textAlign: "center", padding: "20px" }}>
                                <div
                                    style={{
                                        fontSize: 32,
                                        fontWeight: "bold",
                                        color: "var(--vkui--color_accent)",
                                        marginBottom: 8,
                                    }}
                                >
                                    {(store.currentUser as any)?.stats?.totalWorkouts || store.getUserWorkouts().length}
                                </div>
                                <div style={{ fontSize: 14, opacity: 0.7 }}>Всего тренировок</div>
                            </Div>
                        </Card>
                        <Card mode="outline" className="stats-card-individual">
                            <Div style={{ textAlign: "center", padding: "20px" }}>
                                <div
                                    style={{
                                        fontSize: 32,
                                        fontWeight: "bold",
                                        color: "var(--vkui--color_accent)",
                                        marginBottom: 8,
                                    }}
                                >
                                    {(store.currentUser as any)?.stats?.completedWorkouts ||
                                        getCompletedWorkoutsCount()}
                                </div>
                                <div style={{ fontSize: 14, opacity: 0.7 }}>Завершенных тренировок</div>
                            </Div>
                        </Card>
                    </div>
                </Div>
            </Group>
            <Group
                header={<Header className="enhanced-header">Последняя активность</Header>}
                className="enhanced-group"
            >
                <Div>
                    {recentWorkouts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 16, opacity: 0.7 }}>Нет недавних тренировок</div>
                    ) : (
                        <div>
                            {recentWorkouts.map((workout) => (
                                <div
                                    key={workout.id}
                                    className="enhanced-cell"
                                    style={{ marginBottom: "8px", padding: "12px", borderRadius: "12px" }}
                                >
                                    <Event
                                        title={workout.title}
                                        date={new Date(workout.date)}
                                        time={typeof workout.actualDuration === "number" ? workout.actualDuration : 0}
                                        location={workout.location || "Не указано"}
                                        color="#4CAF50"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </Div>
            </Group>
            <WorkoutInvitations />

            <Group header={<Header className="enhanced-header">Друзья и тренировки</Header>} className="enhanced-group">
                <Div>
                    <Search
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder="Поиск друзей..."
                        style={{ marginBottom: 16 }}
                    />

                    <SegmentedControl
                        value={friendFilter}
                        onChange={(value) => setFriendFilter(value as string)}
                        options={[
                            { label: "Все друзья", value: "all" },
                            { label: "Онлайн", value: "online" },
                            { label: "По залам", value: "by_gym" },
                        ]}
                        style={{ marginBottom: 16 }}
                    />

                    {filteredFriends.length === 0 ? (
                        <Text style={{ textAlign: "center", padding: 16, opacity: 0.7 }}>Друзья не найдены</Text>
                    ) : (
                        <div>
                            {filteredFriends.map((friend: any) => (
                                <FriendCard
                                    key={friend.id}
                                    friend={friend}
                                    onFriendClick={(friendId) => routeNavigator.push(`/user-profile/${friendId}`)}
                                />
                            ))}
                        </div>
                    )}
                </Div>
            </Group>
            <Group header={<Header className="enhanced-header">Настройки профиля</Header>} className="enhanced-group">
                <Div>
                    <Card mode="outline" className="enhanced-card">
                        <Div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Основной спортзал</div>
                                {isEditingGym ? (
                                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                                        <FormItem style={{ flex: 1 }}>
                                            <Input
                                                value={newMainGym}
                                                onChange={(e) => setNewMainGym(e.target.value)}
                                                placeholder="Название спортзала"
                                            />
                                        </FormItem>
                                        <Button mode="primary" size="s" onClick={handleSaveMainGym}>
                                            Сохранить
                                        </Button>
                                        <Button
                                            mode="secondary"
                                            size="s"
                                            onClick={() => {
                                                setIsEditingGym(false);
                                                setNewMainGym(
                                                    (store.currentUser as any)?.settings?.preferences?.defaultGym || ""
                                                );
                                            }}
                                        >
                                            Отмена
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: 14 }}>
                                            {(store.currentUser as any)?.settings?.preferences?.defaultGym ||
                                                "Не выбран"}
                                        </Text>
                                        <Button mode="secondary" size="s" onClick={() => setIsEditingGym(true)}>
                                            Изменить
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: 14, opacity: 0.7 }}>
                                Выберите ваш основной спортзал для более удобного планирования тренировок
                            </div>
                        </Div>
                    </Card>
                </Div>
            </Group>

            <Spacing size={80} />
        </Panel>
    );
});
