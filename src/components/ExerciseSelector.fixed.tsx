import { FC, useState } from "react";
import {
    Group,
    Search,
    Card,
    Text,
    Button,
    ModalRoot,
    ModalPage,
    ModalPageHeader,
    PanelHeaderButton,
    Header,
    Div,
    FormItem,
    Input,
    Spacing,
} from "@vkontakte/vkui";
import { Icon24Dismiss, Icon28AddCircleOutline, Icon28DeleteOutline } from "@vkontakte/icons";
import { ExerciseCard } from "./ExerciseCard";
import { observer } from "mobx-react-lite";
import { Exercise, ExerciseSet } from "../store/RootStore";
import { useRootStore } from "../store/RootStoreContext";

export interface ExerciseSelectorProps {
    selectedExercises: { exerciseId: number; exercise: Exercise; sets: ExerciseSet[] }[];
    onExercisesChange: (exercises: { exerciseId: number; exercise: Exercise; sets: ExerciseSet[] }[]) => void;
    onClose: () => void;
}

export const ExerciseSelector: FC<ExerciseSelectorProps> = observer(
    ({ selectedExercises, onExercisesChange, onClose }) => {
        const appStore = useRootStore();

        const [exerciseSearch, setExerciseSearch] = useState("");
        const [showSetModal, setShowSetModal] = useState(false);
        const [selectedExerciseForSets, setSelectedExerciseForSets] = useState<Exercise | null>(null);
        const [newSets, setNewSets] = useState<ExerciseSet[]>([{ id: 1, reps: 10, weight: 50 }]);

        const filteredExercises = appStore.exercises.filter(
            (exercise: any) =>
                exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) &&
                !selectedExercises.find((selected) => selected.exerciseId === exercise.id)
        );

        // const handleExerciseSelect = (exercise: Exercise) => {
        //   setSelectedExerciseForSets(exercise);
        //   setShowSetModal(true);
        // };

        const handleAddExercise = () => {
            if (!selectedExerciseForSets) return;

            const newExercise = {
                exerciseId: selectedExerciseForSets.id,
                exercise: selectedExerciseForSets,
                sets: newSets.map((set) => ({ ...set, id: Date.now() - Math.random() })),
            };

            onExercisesChange([...selectedExercises, newExercise]);
            setShowSetModal(false);
            setSelectedExerciseForSets(null);
            setNewSets([{ id: 1, reps: 10, weight: 50 }]);
        };

        const handleRemoveExercise = (exerciseId: number) => {
            onExercisesChange(selectedExercises.filter((ex) => ex.exerciseId !== exerciseId));
        };

        const addSet = () => {
            const newSet: ExerciseSet = {
                id: newSets.length + 1,
                reps: 10,
                weight: 50,
            };
            setNewSets([...newSets, newSet]);
        };

        const removeSet = (setId: number) => {
            setNewSets(newSets.filter((set) => set.id !== setId));
        };

        const updateSet = (setId: number, field: keyof ExerciseSet, value: any) => {
            setNewSets(newSets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)));
        };

        return (
            <ModalRoot activeModal={showSetModal ? "set-modal" : null} onClose={() => setShowSetModal(false)}>
                <ModalPage
                    id="exercise-selector"
                    onClose={onClose}
                    header={
                        <ModalPageHeader
                            after={
                                <PanelHeaderButton onClick={onClose}>
                                    <Icon24Dismiss />
                                </PanelHeaderButton>
                            }
                        >
                            Выбор упражнений
                        </ModalPageHeader>
                    }
                >
                    <Group header={<Header>Поиск упражнений</Header>}>
                        <Search
                            value={exerciseSearch}
                            onChange={(e) => setExerciseSearch(e.target.value)}
                            placeholder="Название упражнения"
                        />
                    </Group>

                    {selectedExercises.length > 0 && (
                        <Group header={<Header>Выбранные упражнения</Header>}>
                            <Div>
                                {selectedExercises.map((exerciseItem) => (
                                    <Card
                                        key={exerciseItem.exerciseId}
                                        mode="outline"
                                        style={{ padding: 12, marginBottom: 8 }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div>
                                                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                                                    {exerciseItem.exercise.name}
                                                </Text>
                                                <Text style={{ fontSize: 14, opacity: 0.7 }}>
                                                    {exerciseItem.exercise.muscleGroup.join(", ")}
                                                </Text>
                                                <Text style={{ fontSize: 14, opacity: 0.7 }}>
                                                    {exerciseItem.sets.length} подходов
                                                </Text>
                                            </div>
                                            <Button
                                                size="s"
                                                mode="secondary"
                                                onClick={() => handleRemoveExercise(exerciseItem.exerciseId)}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </Div>
                        </Group>
                    )}

                    <Group header={<Header>Доступные упражнения</Header>}>
                        <Div>
                            {filteredExercises.map((exercise: any) => (
                                <ExerciseCard key={exercise.id} exercise={exercise} />
                            ))}
                        </Div>
                    </Group>

                    <ModalPage
                        id="set-modal"
                        onClose={() => setShowSetModal(false)}
                        header={
                            <ModalPageHeader
                                after={
                                    <PanelHeaderButton onClick={() => setShowSetModal(false)}>
                                        <Icon24Dismiss />
                                    </PanelHeaderButton>
                                }
                            >
                                Настройка подходов
                            </ModalPageHeader>
                        }
                    >
                        {selectedExerciseForSets && (
                            <>
                                <Group>
                                    <Div>
                                        <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                                            {selectedExerciseForSets.name}
                                        </Text>
                                        <Text style={{ fontSize: 14, opacity: 0.7 }}>
                                            {selectedExerciseForSets.muscleGroup.join(", ")}
                                        </Text>
                                    </Div>
                                </Group>

                                <Group header={<Header>Подходы</Header>}>
                                    <Div>
                                        {newSets.map((set, _) => (
                                            <Card key={set.id} mode="outline" style={{ padding: 12, marginBottom: 8 }}>
                                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                    <FormItem style={{ flex: 1 }}>
                                                        <Input
                                                            type="number"
                                                            placeholder="Повторения"
                                                            value={set.reps?.toString() || ""}
                                                            onChange={(e) =>
                                                                updateSet(set.id, "reps", parseInt(e.target.value) || 0)
                                                            }
                                                        />
                                                    </FormItem>
                                                    <FormItem style={{ flex: 1 }}>
                                                        <Input
                                                            type="number"
                                                            placeholder="Вес (кг)"
                                                            value={set.weight?.toString() || ""}
                                                            onChange={(e) =>
                                                                updateSet(
                                                                    set.id,
                                                                    "weight",
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                        />
                                                    </FormItem>
                                                    {newSets.length > 1 && (
                                                        <Button
                                                            size="s"
                                                            mode="secondary"
                                                            onClick={() => removeSet(set.id)}
                                                        >
                                                            <Icon28DeleteOutline width={20} height={20} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}

                                        <Button
                                            size="l"
                                            mode="secondary"
                                            onClick={addSet}
                                            before={<Icon28AddCircleOutline />}
                                        >
                                            Добавить подход
                                        </Button>
                                    </Div>
                                </Group>

                                <Spacing size={16} />
                                <Div>
                                    <Button size="l" onClick={handleAddExercise} stretched>
                                        Добавить упражнение
                                    </Button>
                                </Div>
                            </>
                        )}
                    </ModalPage>
                </ModalPage>
            </ModalRoot>
        );
    }
);
