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
} from "@vkontakte/vkui";
import { observer } from "mobx-react-lite";
import { FriendCard } from "../components/FriendCard";
import { Event } from "../components/Event";
import { useStore } from "../stores/StoreContext";
import { UserInfo } from "@vkontakte/vk-bridge";

export interface ProfileProps extends NavIdProps {
    fetchedUser?: UserInfo;
}

export const Profile: FC<ProfileProps> = observer(({ id, fetchedUser }) => {
    const store = useStore();
    const [friendSearch, setFriendSearch] = useState("");
    const [friendFilter, setFriendFilter] = useState("all");

    const { photo_200, first_name, last_name } = { ...fetchedUser };

    const getUserLevel = () => {
        const totalWorkouts = store.achievements.totalWorkouts;
        if (totalWorkouts < 10) return "Новичок";
        if (totalWorkouts < 50) return "Любитель";
        if (totalWorkouts < 100) return "Продвинутый";
        return "Эксперт";
    };

    const getMostVisitedGym = () => {
        const gymCounts = store.workouts.reduce((acc, workout) => {
            acc[workout.gym] = (acc[workout.gym] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostVisited = Object.entries(gymCounts).sort((a, b) => b[1] - a[1])[0];
        return mostVisited ? mostVisited[0] : "Не указан";
    };

    const getRecentWorkouts = () => {
        return store.workouts
            .filter((workout) => new Date(workout.date) <= new Date())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    };

    const filteredFriends = store.friends.filter((friend) => {
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
            <Group header={<Header className="enhanced-header">Профиль</Header>} className="enhanced-group">
                <Div>
                    <Card mode="outline" className="enhanced-card">
                        <Div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                                <Avatar size={64} src={photo_200} />
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                                        {first_name} {last_name}
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
                                    {store.achievements.workoutsThisMonth}
                                </div>
                                <div style={{ fontSize: 14, opacity: 0.7 }}>Тренировок в месяце</div>
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
                                    {store.achievements.totalWorkouts}
                                </div>
                                <div style={{ fontSize: 14, opacity: 0.7 }}>Всего тренировок</div>
                            </Div>
                        </Card>
                    </div>
                </Div>
            </Group>
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
                            {filteredFriends.map((friend) => (
                                <FriendCard key={friend.id} friend={friend} />
                            ))}
                        </div>
                    )}
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
                                        time={workout.time}
                                        location={workout.gym}
                                        color="#4CAF50"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </Div>
            </Group>

            <Spacing size={80} />
        </Panel>
    );
});
