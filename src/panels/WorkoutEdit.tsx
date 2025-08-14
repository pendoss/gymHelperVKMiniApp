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
import { useRootStore } from "../store/RootStoreContext";
import { Friend, Exercise, ExerciseSet, WorkoutExercise, Workout } from "../store/RootStore";

export interface WorkoutEditProps {
    id: string;
}

export const WorkoutEdit: FC<WorkoutEditProps> = observer(({ id }: WorkoutEditProps) => {
    const store = useRootStore();
    const routeNavigator = useRouteNavigator();
    const params = useParams<'workoutId'>();
    const workoutId = params?.workoutId;
    const existingWorkout = workoutId ? 
        store.getWorkout(+workoutId) as any : null;
    const [title, setTitle] = useState(existingWorkout?.title || "");
    const [description, setDescription] = useState(existingWorkout?.description || "");
    const [date, setDate] = useState(existingWorkout ? new Date(existingWorkout.date) : new Date());
    const [time, setTime] = useState(existingWorkout?.startTime || "");
    const [gym, setGym] = useState(existingWorkout?.location || "");
    const [selectedExercises, setSelectedExercises] = useState<{ exerciseId: number; exercise: Exercise; sets: ExerciseSet[] }[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<Friend[]>([]);
    const [friendSearch, setFriendSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"exercises" | "friends">("exercises");
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [estimatedDuration, setEstimatedDuration] = useState('');

    useEffect(() => {
        if (existingWorkout) {
            const exercisesWithSets = existingWorkout.exercises.map((we: WorkoutExercise) => ({
                exerciseId: we.exerciseId,
                exercise: we.exercise,
                sets: we.sets.map(set => ({
                    id: Number(set.id),
                    reps: set.reps,
                    weight: set.weight,
                    duration: set.duration,
                    distance: set.distance
                }))
            }));
            setSelectedExercises(exercisesWithSets);
            
            const participantFriends = existingWorkout.participants.map((p: any) => ({
                id: p.userId,
                vkId: p.userId,
                firstName: p.user.first_name,
                lastName: p.user.last_name,
                photo: p.user.photo_200,
                isActive: true,
                level: 'beginner' as const,
                firstLogin: false,
                gym: '',
                isOnline: false,
                status: 'resting' as const,
                lastWorkout: undefined,
                nextWorkout: undefined,
                workoutsThisWeek: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Friend));
            setSelectedParticipants(participantFriends);
        }
    }, [existingWorkout]);

    if (!workoutId || !existingWorkout) {
        return (
            <Panel id={id.toString()}>
                <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
                    Редактирование
                </PanelHeader>
                <Div>Тренировка не найдена</Div>
            </Panel>
        );
    }

    const filteredFriends = store.friends.filter(
        (friend: Friend) =>
            `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(friendSearch.toLowerCase()) &&
            !selectedParticipants.find((selected: Friend) => selected.id === friend.id)
    );

    // const handleExerciseAdd = (exercise: Exercise, sets: Set[]) => {
    //     setSelectedExercises(prev => [...prev, exercise]);
    //     setExerciseSets(prev => ({
    //         ...prev,
    //         [exercise.id]: sets
    //     }));
    // };

    const handleExerciseRemove = (exerciseId: number) => {
        setSelectedExercises(prev => prev.filter(ex => ex.exerciseId !== exerciseId));
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
            const workoutExercises: WorkoutExercise[] = selectedExercises.map((exerciseData, index) => ({
                id: Date.now() + index, // Генерируем уникальный ID для связи
                exerciseId: exerciseData.exerciseId,
                exercise: exerciseData.exercise,
                sets: exerciseData.sets,
                order: index + 1,
                completed: false
            }));

            const participants = selectedParticipants.map((friend: any) => ({
                userId: friend.id,
                user: {
                    id: friend.id,
                    first_name: friend.firstName,
                    last_name: friend.lastName,
                    photo_200: friend.photo || '',
                    level: 'beginner' as const,
                    firstLogin: false
                },
                status: 'pending' as const,
                invitedAt: new Date()
            }));

            const updatedWorkout: Workout = {
                ...existingWorkout,
                title,
                description,
                date: typeof date === 'string' ? date : date.toISOString(),
                startTime: time,
                location: gym,
                exercises: workoutExercises,
                participants: participants
            };

            // Проверяем, это пользовательская тренировка или общая
            const userWorkouts = await store.getUserWorkouts();
            const isUserWorkout = userWorkouts.find((w: any) => String(w.id) === String(existingWorkout.id));
            if (isUserWorkout) {
                store.updateWorkout(existingWorkout.id, updatedWorkout);
            } else {
                store.updateWorkout(existingWorkout.id, updatedWorkout);
            }
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
        <Panel id={id.toString()}>
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

                <FormItem top="Примерное время тренировки (мин)">
                <Input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="60"
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

                        {selectedExercises.map((exerciseData) => (
                            <Card key={exerciseData.exerciseId} style={{ marginBottom: 8 }}>
                                <Div>
                                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                        {exerciseData.exercise.name}
                                    </div>
                                    <div style={{ fontSize: 14, color: "var(--vkui--color_text_secondary)", marginBottom: 8 }}>
                                        {exerciseData.exercise.muscleGroup.join(", ")}
                                    </div>
                                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                                        Подходы: {exerciseData.sets.length}
                                    </div>
                                    <Button
                                        size="s"
                                        mode="secondary"
                                        onClick={() => handleExerciseRemove(exerciseData.exerciseId)}
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
                        onExercisesChange={(exercises) => {
                          setSelectedExercises(exercises);
                        }}
                        onClose={() => setShowExerciseSelector(false)}
                    />
                    <Spacing size={80} />
                </ModalPage>
            </ModalRoot>
        </Panel>
    );
});
