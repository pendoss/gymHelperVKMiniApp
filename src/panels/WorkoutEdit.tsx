import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
    Panel,
    PanelHeader,
    PanelHeaderBack,
    Group,
    FormItem,
    Input,
    Button,
    Div,
    Tabs,
    TabsItem,
    DateInput,
    Textarea,
    Search,
    Card,
    ModalRoot,
    ModalPage,
    ModalPageHeader,
    PanelHeaderButton,
    Spacing,
} from "@vkontakte/vkui";
import { useRouteNavigator, useParams } from "@vkontakte/vk-mini-apps-router";
import { Icon24Dismiss } from "@vkontakte/icons";

import { FriendCard } from "../components/FriendCard";
import { ExerciseSelector } from "../components/ExerciseSelector";
import { useStore } from "../stores/StoreContext";
import { Exercise, Friend, Set, Workout, WorkoutExercise } from "../types";

export interface WorkoutEditProps {
    id: string;
}

export const WorkoutEdit: FC<WorkoutEditProps> = observer(({ id }: WorkoutEditProps) => {
    const store = useStore();
    const routeNavigator = useRouteNavigator();
    const params = useParams<'workoutId'>();
    const workoutId = params?.workoutId;
    const existingWorkout = workoutId ? store.workouts.find(w => w.id === workoutId) : null;
    const [title, setTitle] = useState(existingWorkout?.title || "");
    const [description, setDescription] = useState(existingWorkout?.description || "");
    const [date, setDate] = useState(existingWorkout ? new Date(existingWorkout.date) : new Date());
    const [time, setTime] = useState(existingWorkout?.time || "");
    const [gym, setGym] = useState(existingWorkout?.gym || "");
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
    const [exerciseSets, setExerciseSets] = useState<Record<string, Set[]>>({});
    const [selectedParticipants, setSelectedParticipants] = useState<Friend[]>([]);
    const [friendSearch, setFriendSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"exercises" | "friends">("exercises");
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (existingWorkout) {
            setSelectedExercises(existingWorkout.exercises.map((we: WorkoutExercise) => we.exercise));
            const sets: Record<string, Set[]> = {};
            existingWorkout.exercises.forEach((we: WorkoutExercise) => {
                sets[we.exercise.id] = we.sets;
            });
            setExerciseSets(sets);
            const participantFriends = existingWorkout.participants.map(p => ({
                id: p.userId,
                first_name: p.user.first_name,
                last_name: p.user.last_name,
                photo_200: p.user.photo_200,
                isOnline: false,
                workoutsThisWeek: 0,
                status: 'resting' as const
            } as Friend));
            setSelectedParticipants(participantFriends);
        }
    }, [existingWorkout]);

    if (!workoutId || !existingWorkout) {
        return (
            <Panel id={id}>
                <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
                    Редактирование тренировки
                </PanelHeader>
                <Div>Тренировка не найдена</Div>
            </Panel>
        );
    }

    const filteredFriends = store.friends.filter(
        (friend: Friend) =>
            `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(friendSearch.toLowerCase()) &&
            !selectedParticipants.find((selected: Friend) => selected.id === friend.id)
    );

    const handleExerciseAdd = (exercise: Exercise, sets: Set[]) => {
        setSelectedExercises(prev => [...prev, exercise]);
        setExerciseSets(prev => ({
            ...prev,
            [exercise.id]: sets
        }));
    };

    const handleExerciseRemove = (exerciseId: string) => {
        setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
        setExerciseSets(prev => {
            const newSets = { ...prev };
            delete newSets[exerciseId];
            return newSets;
        });
    };

    const handleFriendToggle = (friend: Friend) => {
        setSelectedParticipants((prev: Friend[]) => {
            const isSelected = prev.find((f: Friend) => f.id === friend.id);
            if (isSelected) {
                return prev.filter((f: Friend) => f.id !== friend.id);
            } else {
                return [...prev, friend];
            }
        });
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Введите название тренировки");
            return;
        }

        setIsUpdating(true);
        try {
            const workoutExercises: WorkoutExercise[] = selectedExercises.map((exercise) => ({
                exerciseId: exercise.id,
                exercise,
                sets: exerciseSets[exercise.id] || [],
            }));

            const updatedWorkout: Workout = {
                ...existingWorkout,
                title,
                description,
                date,
                time,
                gym,
                exercises: workoutExercises,
                participants: selectedParticipants.map(friend => ({
                    userId: friend.id,
                    user: {
                        id: friend.id,
                        first_name: friend.first_name,
                        last_name: friend.last_name,
                        photo_200: friend.photo_200,
                        level: 'beginner' as const,
                        firstLogin: false
                    },
                    status: 'pending' as const,
                    invitedAt: new Date()
                }))
            };

            store.updateWorkout(existingWorkout.id, updatedWorkout);
            routeNavigator.back();
        } catch (error) {
            console.error("Ошибка при сохранении тренировки:", error);
            alert("Произошла ошибка при сохранении тренировки");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        routeNavigator.back();
    };

    return (
        <Panel id={id}>
            <PanelHeader before={<PanelHeaderBack onClick={handleCancel} />}>
                Редактирование тренировки
            </PanelHeader>

            <Group>
                <FormItem top="Название тренировки">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Введите название тренировки"
                    />
                </FormItem>

                <FormItem top="Описание">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Описание тренировки (необязательно)"
                    />
                </FormItem>

                <FormItem top="Дата">
                    <DateInput 
                        value={date} 
                        onChange={(value?: Date) => value && setDate(value)} 
                    />
                </FormItem>

                <FormItem top="Время">
                    <Input
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="Время тренировки (например, 18:00)"
                    />
                </FormItem>

                <FormItem top="Зал">
                    <Input
                        value={gym}
                        onChange={(e) => setGym(e.target.value)}
                        placeholder="Название зала (необязательно)"
                    />
                </FormItem>
            </Group>

            <Group>
                <Tabs>
                    <TabsItem
                        selected={activeTab === "exercises"}
                        onClick={() => setActiveTab("exercises")}
                    >
                        Упражнения ({selectedExercises.length})
                    </TabsItem>
                    <TabsItem
                        selected={activeTab === "friends"}
                        onClick={() => setActiveTab("friends")}
                    >
                        Друзья ({selectedParticipants.length})
                    </TabsItem>
                </Tabs>

                {activeTab === "exercises" && (
                    <Div>
                        <Button
                            size="l"
                            stretched
                            onClick={() => setShowExerciseSelector(true)}
                            style={{ marginBottom: 16 }}
                        >
                            Добавить упражнение
                        </Button>

                        {selectedExercises.map((exercise) => (
                            <Card key={exercise.id} style={{ marginBottom: 8 }}>
                                <Div>
                                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                        {exercise.name}
                                    </div>
                                    <div style={{ fontSize: 14, color: "var(--vkui--color_text_secondary)", marginBottom: 8 }}>
                                        {exercise.muscleGroup.join(", ")}
                                    </div>
                                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                                        Подходы: {exerciseSets[exercise.id]?.length || 0}
                                    </div>
                                    <Button
                                        size="s"
                                        mode="secondary"
                                        onClick={() => handleExerciseRemove(exercise.id)}
                                    >
                                        Удалить
                                    </Button>
                                </Div>
                            </Card>
                        ))}
                    </Div>
                )}

                {activeTab === "friends" && (
                    <Div>
                        <Search
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                            placeholder="Поиск друзей"
                        />

                        {selectedParticipants.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                                    Выбранные друзья:
                                </div>
                                {selectedParticipants.map((friend: Friend) => (
                                    <FriendCard
                                        key={friend.id}
                                        friend={friend}
                                        onInvite={() => handleFriendToggle(friend)}
                                    />
                                ))}
                            </div>
                        )}

                        {filteredFriends.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                                    Доступные друзья:
                                </div>
                                {filteredFriends.map((friend: Friend) => (
                                    <FriendCard
                                        key={friend.id}
                                        friend={friend}
                                        onInvite={() => handleFriendToggle(friend)}
                                    />
                                ))}
                            </div>
                        )}
                    </Div>
                )}
            </Group>

            <Group style={{ paddingBottom: 80 }}>
                <Div>
                    <Button
                        size="l"
                        stretched
                        onClick={handleSave}
                        loading={isUpdating}
                        disabled={isUpdating || !title.trim()}
                    >
                        Сохранить изменения
                    </Button>
                </Div>
            </Group>

            <ModalRoot activeModal={showExerciseSelector ? "exercise-selector" : null}>
                <ModalPage
                    id="exercise-selector"
                    onClose={() => setShowExerciseSelector(false)}
                    settlingHeight={100}
                    header={
                        <ModalPageHeader
                            before={
                                <PanelHeaderButton onClick={() => setShowExerciseSelector(false)}>
                                    <Icon24Dismiss />
                                </PanelHeaderButton>
                            }
                        >
                            Выбор упражнений
                        </ModalPageHeader>
                    }
                >
                    <ExerciseSelector
                        selectedExercises={selectedExercises}
                        exerciseSets={exerciseSets}
                        onExerciseAdd={handleExerciseAdd}
                        onExerciseRemove={handleExerciseRemove}
                    />
                    <Spacing size={80} />
                </ModalPage>
            </ModalRoot>
        </Panel>
    );
});
