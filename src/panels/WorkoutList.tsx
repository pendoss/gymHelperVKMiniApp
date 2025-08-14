import { FC, useState } from "react";
import { Panel, PanelHeader, Group, Div, Search, SegmentedControl, NavIdProps, Spacing, Button } from "@vkontakte/vkui";
import { WorkoutCard } from "../components/WorkoutCard";
import { useRootStore } from "../store/RootStoreContext";
import { useRouteNavigator } from "@vkontakte/vk-mini-apps-router";
import { observer } from "mobx-react-lite";
import { Workout } from "../store/RootStore";

export interface WorkoutListProps extends NavIdProps {}

export const WorkoutList: FC<WorkoutListProps> = observer(({ id }) => {
    const store = useRootStore();
    const [searchValue, setSearchValue] = useState("");
    const [filter, setFilter] = useState("all");
    const routeNavigator = useRouteNavigator();

    const now = new Date();

    const filteredWorkouts = store.workouts
        .filter((workout: Workout) => {
            const matchesSearch =
                workout.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                workout.location?.toLowerCase().includes(searchValue.toLowerCase());

            if (!matchesSearch) return false;

            switch (filter) {
                case "upcoming":
                    return new Date(workout.date) >= now;
                case "past":
                    return new Date(workout.date) < now;
                default:
                    return true;
            }
        })
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleAddWorkout = () => {
        routeNavigator.push("/create");
    };

    return (
        <Panel id={id}>
            <PanelHeader>Тренировки</PanelHeader>

            <Group>
                <Div>
                    <Search
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Поиск тренировок..."
                    />
                </Div>
            </Group>

            <Group>
                <Div>
                    <SegmentedControl
                        value={filter}
                        onChange={(value) => setFilter(value as string)}
                        options={[
                            { label: "Все", value: "all" },
                            { label: "Предстоящие", value: "upcoming" },
                            { label: "Прошедшие", value: "past" },
                        ]}
                        size="l"
                    />
                </Div>
            </Group>

            <Group>
                <Div>
                    {filteredWorkouts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 32 }}>
                            <p>Тренировки не найдены</p>
                        </div>
                    ) : (
                        <div>
                            {filteredWorkouts.map((workout: any) => (
                                <WorkoutCard key={workout.id} workout={workout as any} />
                            ))}
                        </div>
                    )}
                </Div>
                <div style={{display:'flex', justifyContent:'center'}}>
                  <Button size="m" stretched={false} onClick={handleAddWorkout}>
                    Добавить тренировку
                  </Button>
                </div>
            </Group>

            <Spacing size={80} />
        </Panel>
    );
});
