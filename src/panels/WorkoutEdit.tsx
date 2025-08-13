import { FC, useState, useEffect } from "react";
import {
    Panel,
    PanelHeader,
    PanelHeaderBack,
    Group,
    FormItem,
    Input,
    Button,
    Div,
    NavIdProps,
    DateInput,
    Textarea,
    Search,
    Spacing,
    Card,
    Text,
    ModalRoot,
    ModalPage,
    ModalPageHeader,
    PanelHeaderButton,
    Header,
    Chip,
    Badge,
    IconButton,
    Tabs,
    TabsItem,
    HorizontalScroll,
    Title,
} from "@vkontakte/vkui";
import { Icon24Dismiss, Icon28AddCircleOutline, Icon28DeleteOutline, Icon28EditOutline } from "@vkontakte/icons";
import { ExerciseCard } from "../components/ExerciseCard";
import { FriendCard } from "../components/FriendCard";
import { useStore } from "../stores/StoreContext";
import { useRouteNavigator, useParams } from "@vkontakte/vk-mini-apps-router";
import { Exercise, Friend, Workout, WorkoutExercise, WorkoutParticipant, Set } from "../types";
import { observer } from "mobx-react-lite";

export interface WorkoutEditProps extends NavIdProps {}

export const WorkoutEdit: FC<WorkoutEditProps> = observer(({ id }) => {
    const store = useStore();
    const routeNavigator = useRouteNavigator();
    const params = useParams<"workoutId">();

    // Получаем ID тренировки из параметров роута
    const workoutId = params?.workoutId;
    const existingWorkout = workoutId ? store.workouts.find((w) => w.id === workoutId) : null;
    const isEditing = !!existingWorkout;

    const [title, setTitle] = useState(existingWorkout?.title || "");
    const [description, setDescription] = useState(existingWorkout?.description || "");
    const [date, setDate] = useState(existingWorkout ? new Date(existingWorkout.date) : new Date());
    const [time, setTime] = useState(existingWorkout?.time || "");
    const [gym, setGym] = useState(existingWorkout?.gym || "");
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
        existingWorkout?.exercises.map((we) => we.exercise) || []
    );
    const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
    const [exerciseSets, setExerciseSets] = useState<Record<string, Set[]>>(
        existingWorkout?.exercises.reduce((acc, we) => {
            acc[we.exerciseId] = we.sets;
            return acc;
        }, {} as Record<string, Set[]>) || {}
    );
    const [exerciseSearch, setExerciseSearch] = useState("");
    const [friendSearch, setFriendSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"exercises" | "friends">("exercises");
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSetModal, setShowSetModal] = useState(false);
    const [selectedExerciseForSets, setSelectedExerciseForSets] = useState<Exercise | null>(null);
    const [selectedMode, setSelectedMode] = useState<"existing" | "new">("existing");
    const [selectedExistingSets, setSelectedExistingSets] = useState<Set[]>([]);
    const [newSets, setNewSets] = useState<Set[]>([{ id: "1", reps: 10, weight: 50 }]);

    useEffect(() => {
        if (existingWorkout?.participants) {
            const participantFriends = existingWorkout.participants
                .map((p) => store.friends.find((f) => f.id === p.userId))
                .filter(Boolean) as Friend[];
            setSelectedFriends(participantFriends);
        }
    }, [existingWorkout, store.friends]);

    const filteredExercises = store.exercises.filter(
        (exercise) =>
            exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) &&
            !selectedExercises.find((selected) => selected.id === exercise.id)
    );

    const filteredFriends = store.friends.filter(
        (friend) =>
            `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(friendSearch.toLowerCase()) &&
            !selectedFriends.find((selected) => selected.id === friend.id)
    );

    const handleExerciseSelect = (exercise: Exercise) => {
        setSelectedExerciseForSets(exercise);
        setShowSetModal(true);
    };

    const handleAddExerciseWithSets = () => {
        if (!selectedExerciseForSets) return;

        const sets = selectedMode === "existing" ? selectedExistingSets : newSets;

        setSelectedExercises((prev) => [...prev, selectedExerciseForSets]);
        setExerciseSets((prev) => ({
            ...prev,
            [selectedExerciseForSets.id]: sets,
        }));
        setShowSetModal(false);
        setSelectedExerciseForSets(null);
        setSelectedMode("existing");
        setSelectedExistingSets([]);
        setNewSets([{ id: "1", reps: 10, weight: 50 }]);
    };

    const handleRemoveExercise = (exerciseId: string) => {
        setSelectedExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
        setExerciseSets((prev) => {
            const { [exerciseId]: removed, ...rest } = prev;
            return rest;
        });
    };

    const handleEditExerciseSets = (exercise: Exercise) => {
        setSelectedExerciseForSets(exercise);
        const currentSets = exerciseSets[exercise.id] || [];
        setNewSets(currentSets.length > 0 ? currentSets : [{ id: "1", reps: 10, weight: 50 }]);
        setSelectedMode("new");
        setShowSetModal(true);
    };

    const handleFriendSelect = (friend: Friend) => {
        setSelectedFriends((prev) => [...prev, friend]);
    };

    const handleRemoveFriend = (friendId: number) => {
        setSelectedFriends((prev) => prev.filter((f) => f.id !== friendId));
    };

    const addNewSet = () => {
        const newSetId = (newSets.length + 1).toString();
        setNewSets((prev) => [...prev, { id: newSetId, reps: 10, weight: 50 }]);
    };

    const removeSet = (setId: string) => {
        setNewSets((prev) => prev.filter((set) => set.id !== setId));
    };

    const updateSet = (setId: string, field: "reps" | "weight", value: number) => {
        setNewSets((prev) => prev.map((set) => (set.id === setId ? { ...set, [field]: value } : set)));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Введите название тренировки");
            return;
        }

        if (selectedExercises.length === 0) {
            alert("Добавьте хотя бы одно упражнение");
            return;
        }

        setIsUpdating(true);

        try {
            const workoutExercises: WorkoutExercise[] = selectedExercises.map((exercise) => ({
                exerciseId: exercise.id,
                exercise,
                sets: exerciseSets[exercise.id] || [],
                notes: "",
            }));

            const participants: WorkoutParticipant[] = selectedFriends.map((friend) => ({
                userId: friend.id,
                user: {
                    id: friend.id,
                    first_name: friend.first_name,
                    last_name: friend.last_name,
                    photo_200: friend.photo_200,
                    level: "amateur",
                },
                status: "pending",
                invitedAt: new Date(),
            }));

            const workoutData: Partial<Workout> = {
                title: title.trim(),
                description: description.trim(),
                date,
                time: time.trim(),
                gym: gym.trim(),
                exercises: workoutExercises,
                participants,
            };

            if (isEditing && workoutId) {
                store.updateWorkout(workoutId, workoutData);
            } else {
                const newWorkoutData: Omit<Workout, "id"> = {
                    ...workoutData,
                    createdBy: 1,
                    createdAt: new Date(),
                    isTemplate: false,
                } as Omit<Workout, "id">;
                store.addWorkout(newWorkoutData);
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

    const modal = (
        <ModalRoot activeModal={showSetModal ? "sets" : null}>
            <ModalPage
                id="sets"
                onClose={() => setShowSetModal(false)}
                header={
                    <ModalPageHeader
                        before={
                            <PanelHeaderButton onClick={() => setShowSetModal(false)}>
                                <Icon24Dismiss />
                            </PanelHeaderButton>
                        }
                    >
                        <span className="train-sync-gradient-text">Настройка подходов</span>
                    </ModalPageHeader>
                }
            >
                {selectedExerciseForSets && (
                    <Div>
                        <div style={{ marginBottom: 24 }}>
                            <Text weight="2" style={{ fontSize: 18, marginBottom: 8 }}>
                                {selectedExerciseForSets.name}
                            </Text>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {selectedExerciseForSets.muscleGroup.map((group, index) => (
                                    <Chip key={index} removable={false} style={{ fontSize: 12 }}>
                                        {group}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <Tabs>
                            <HorizontalScroll>
                                <TabsItem
                                    selected={selectedMode === "existing"}
                                    onClick={() => setSelectedMode("existing")}
                                    id="existing"
                                >
                                    Из предыдущих тренировок
                                </TabsItem>
                                <TabsItem
                                    selected={selectedMode === "new"}
                                    onClick={() => setSelectedMode("new")}
                                    id="new"
                                >
                                    Создать новые
                                </TabsItem>
                            </HorizontalScroll>
                        </Tabs>

                        <Spacing size={16} />

                        {selectedMode === "existing" ? (
                            <div>
                                <Text style={{ marginBottom: 12, opacity: 0.7 }}>
                                    Выберите подходы из предыдущих тренировок
                                </Text>
                                <Text style={{ textAlign: "center", padding: 32, opacity: 0.5 }}>
                                    Нет данных о предыдущих тренировках
                                </Text>
                            </div>
                        ) : (
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 16,
                                    }}
                                >
                                    <Text weight="2">Подходы ({newSets.length})</Text>
                                    <Button size="s" onClick={addNewSet} before={<Icon28AddCircleOutline />}>
                                        Добавить подход
                                    </Button>
                                </div>

                                {newSets.map((set, index) => (
                                    <Card key={set.id} mode="outline" style={{ marginBottom: 12 }}>
                                        <Div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <Text weight="2">Подход {index + 1}</Text>
                                                {newSets.length > 1 && (
                                                    <IconButton
                                                        onClick={() => removeSet(set.id)}
                                                        style={{ color: "#F44336" }}
                                                    >
                                                        <Icon28DeleteOutline />
                                                    </IconButton>
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(2, 1fr)",
                                                    gap: 12,
                                                }}
                                            >
                                                <FormItem top="Повторения">
                                                    <Input
                                                        type="number"
                                                        value={set.reps?.toString() || ""}
                                                        onChange={(e) =>
                                                            updateSet(set.id, "reps", Number(e.target.value) || 0)
                                                        }
                                                        placeholder="10"
                                                    />
                                                </FormItem>
                                                <FormItem top="Вес (кг)">
                                                    <Input
                                                        type="number"
                                                        value={set.weight?.toString() || ""}
                                                        onChange={(e) =>
                                                            updateSet(set.id, "weight", Number(e.target.value) || 0)
                                                        }
                                                        placeholder="50"
                                                    />
                                                </FormItem>
                                            </div>
                                        </Div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <Spacing size={24} />

                        <Button
                            size="l"
                            stretched
                            onClick={handleAddExerciseWithSets}
                            className="train-sync-accent-bg"
                            disabled={selectedMode === "existing" && selectedExistingSets.length === 0}
                        >
                            {isEditing ? "Обновить упражнение" : "Добавить упражнение"}
                        </Button>
                    </Div>
                )}
            </ModalPage>
        </ModalRoot>
    );

    return (
        <Panel id={id} className="workout-edit-panel">
            <PanelHeader before={<PanelHeaderBack onClick={handleCancel} />}>
                <span className="train-sync-gradient-text">
                    {isEditing ? "Редактировать тренировку" : "Создать тренировку"}
                </span>
            </PanelHeader>
            <Group>
                <Div>
                    <div
                        style={{
                            textAlign: "center",
                            padding: "24px 16px",
                            background: "var(--train-sync-gradient)",
                            borderRadius: 16,
                            margin: "0 16px 24px",
                            color: "white",
                        }}
                    >
                        <Icon28EditOutline
                            style={{
                                marginBottom: 12,
                                width: 40,
                                height: 40,
                                opacity: 0.9,
                            }}
                        />
                        <Title level="2" style={{ color: "white", margin: 0 }}>
                            {isEditing ? "Редактируем тренировку" : "Создаём новую тренировку"}
                        </Title>
                        <Text style={{ color: "rgba(255, 255, 255, 0.8)", marginTop: 8 }}>
                            {isEditing
                                ? "Внесите необходимые изменения"
                                : "Заполните детали для вашей идеальной тренировки"}
                        </Text>
                    </div>
                </Div>
            </Group>
            <Group header={<Header>Основная информация</Header>}>
                <FormItem top="Название тренировки" status={!title.trim() ? "error" : "default"}>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Например: Тренировка груди и трицепса"
                    />
                </FormItem>

                <FormItem top="Описание (необязательно)">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Краткое описание тренировки..."
                        rows={3}
                    />
                </FormItem>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    <FormItem top="Дата тренировки">
                        <DateInput
                            value={date}
                            onChange={(newDate) => newDate && setDate(newDate)}
                            enableTime={false}
                        />
                    </FormItem>

                    <FormItem top="Время">
                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </FormItem>
                </div>

                <FormItem top="Спортзал">
                    <Input value={gym} onChange={(e) => setGym(e.target.value)} placeholder="Название спортзала" />
                </FormItem>
            </Group>
            <Group>
                <Div>
                    <Tabs>
                        <HorizontalScroll>
                            <TabsItem
                                selected={activeTab === "exercises"}
                                onClick={() => setActiveTab("exercises")}
                                id="exercises"
                            >
                                Упражнения ({selectedExercises.length})
                            </TabsItem>
                            <TabsItem
                                selected={activeTab === "friends"}
                                onClick={() => setActiveTab("friends")}
                                id="friends"
                            >
                                Партнёры ({selectedFriends.length})
                            </TabsItem>
                        </HorizontalScroll>
                    </Tabs>
                </Div>
            </Group>
            {activeTab === "exercises" ? (
                <>
                    {selectedExercises.length > 0 && (
                        <Group header={<Header>Выбранные упражнения ({selectedExercises.length})</Header>}>
                            {selectedExercises.map((exercise) => (
                                <Card key={exercise.id} mode="outline" style={{ margin: "8px 16px" }}>
                                    <Div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <Text weight="2" style={{ marginBottom: 8 }}>
                                                    {exercise.name}
                                                </Text>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 6,
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    {exercise.muscleGroup.map((group, index) => (
                                                        <Chip key={index} removable={false} style={{ fontSize: 11 }}>
                                                            {group}
                                                        </Chip>
                                                    ))}
                                                </div>

                                                {exerciseSets[exercise.id] && (
                                                    <div style={{ marginBottom: 12 }}>
                                                        <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
                                                            Подходы: {exerciseSets[exercise.id].length}
                                                        </Text>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                            {exerciseSets[exercise.id].map((set, index) => (
                                                                <Badge key={index} style={{ fontSize: 11 }}>
                                                                    {set.reps}×{set.weight}кг
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 8 }}>
                                                <IconButton
                                                    onClick={() => handleEditExerciseSets(exercise)}
                                                    style={{ color: "var(--vkui--color_accent)" }}
                                                >
                                                    <Icon28EditOutline />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleRemoveExercise(exercise.id)}
                                                    style={{ color: "#F44336" }}
                                                >
                                                    <Icon28DeleteOutline />
                                                </IconButton>
                                            </div>
                                        </div>
                                    </Div>
                                </Card>
                            ))}
                        </Group>
                    )}
                    <Group header={<Header>Добавить упражнения</Header>}>
                        <Div>
                            <Search
                                value={exerciseSearch}
                                onChange={(e) => setExerciseSearch(e.target.value)}
                                placeholder="Поиск упражнений..."
                            />
                        </Div>

                        {filteredExercises.length > 0 ? (
                            filteredExercises.map((exercise) => (
                                <div
                                    key={exercise.id}
                                    onClick={() => handleExerciseSelect(exercise)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <ExerciseCard exercise={exercise} />
                                </div>
                            ))
                        ) : (
                            <Div>
                                <Text style={{ textAlign: "center", opacity: 0.7, padding: 32 }}>
                                    {exerciseSearch ? "Упражнения не найдены" : "Все упражнения добавлены"}
                                </Text>
                            </Div>
                        )}
                    </Group>
                </>
            ) : (
                <>
                    {selectedFriends.length > 0 && (
                        <Group header={<Header>Приглашённые партнёры ({selectedFriends.length})</Header>}>
                            {selectedFriends.map((friend) => (
                                <div key={friend.id} style={{ position: "relative" }}>
                                    <FriendCard friend={friend} />
                                    <IconButton
                                        onClick={() => handleRemoveFriend(friend.id)}
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            color: "#F44336",
                                            background: "rgba(255, 255, 255, 0.9)",
                                            borderRadius: "50%",
                                        }}
                                    >
                                        <Icon28DeleteOutline />
                                    </IconButton>
                                </div>
                            ))}
                        </Group>
                    )}
                    <Group header={<Header>Пригласить партнёров</Header>}>
                        <Div>
                            <Search
                                value={friendSearch}
                                onChange={(e) => setFriendSearch(e.target.value)}
                                placeholder="Поиск друзей..."
                            />
                        </Div>

                        {filteredFriends.length > 0 ? (
                            filteredFriends.map((friend) => (
                                <div
                                    key={friend.id}
                                    onClick={() => handleFriendSelect(friend)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <FriendCard friend={friend} />
                                </div>
                            ))
                        ) : (
                            <Div>
                                <Text style={{ textAlign: "center", opacity: 0.7, padding: 32 }}>
                                    {friendSearch ? "Друзья не найдены" : "Все друзья приглашены"}
                                </Text>
                            </Div>
                        )}
                    </Group>
                </>
            )}
            <Group>
                <Div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <Button size="l" stretched mode="outline" onClick={handleCancel} disabled={isUpdating}>
                            Отмена
                        </Button>
                        <Button
                            size="l"
                            stretched
                            className="train-sync-accent-bg"
                            onClick={handleSave}
                            loading={isUpdating}
                            disabled={!title.trim() || selectedExercises.length === 0}
                        >
                            {isEditing ? "Сохранить изменения" : "Создать тренировку"}
                        </Button>
                    </div>
                </Div>
            </Group>

            <Spacing size={80} />
            {modal}
        </Panel>
    );
});
