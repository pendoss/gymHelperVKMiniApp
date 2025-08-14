import { FC } from "react";
import {
    Group,
    Header,
    Card,
    Div,
    Text,
    Button,
    Avatar,
    Chip,
} from "@vkontakte/vkui";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/StoreContext";
import { WorkoutInvitation } from "../types";

export interface WorkoutInvitationsProps {}

export const WorkoutInvitations: FC<WorkoutInvitationsProps> = observer(() => {
    const store = useStore();

    const incomingInvitations = store.getIncomingInvitations();
    const sentInvitations = store.getSentInvitations();

    const handleAcceptInvitation = (invitationId: string) => {
        store.acceptWorkoutInvitation(invitationId);
    };

    const handleDeclineInvitation = (invitationId: string) => {
        store.declineWorkoutInvitation(invitationId);
    };

    const renderInvitation = (invitation: WorkoutInvitation, type: 'incoming' | 'sent') => {
        const workout = invitation.workout;
        if (!workout) return null;

        const fromUser = store.friends.find(f => f.id === invitation.fromUserId) ||
                        (invitation.fromUserId === store.currentUser?.id ? store.currentUser : null);
        const toUser = store.friends.find(f => f.id === invitation.toUserId) ||
                      (invitation.toUserId === store.currentUser?.id ? store.currentUser : null);

        return (
            <Card key={invitation.id} mode="shadow">
                <Div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar
                            size={40}
                            src={type === 'incoming' ? fromUser?.photo_200 : toUser?.photo_200}
                        />
                        <div style={{ marginLeft: 12, flex: 1 }}>
                            <Text weight="2">
                                {type === 'incoming'
                                    ? `${fromUser?.first_name} ${fromUser?.last_name} приглашает на тренировку`
                                    : `Приглашение для ${toUser?.first_name} ${toUser?.last_name}`
                                }
                            </Text>
                            <Text style={{ fontSize: 13, opacity: 0.7 }}>
                                {new Date(invitation.sentAt).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </div>
                        <Chip>
                            {invitation.status === 'pending' ? 'Ожидает' :
                             invitation.status === 'accepted' ? 'Принято' : 'Отклонено'}
                        </Chip>
                    </div>

                    <Card mode="tint">
                        <Div style={{ padding: 12 }}>
                            <Text weight="2">{workout.title}</Text>
                            <Text style={{ fontSize: 13, opacity: 0.7 }}>
                                {new Date(workout.date).toLocaleDateString('ru-RU')} в {workout.time}
                            </Text>
                            <Text style={{ fontSize: 13, opacity: 0.7 }}>
                                {workout.gym}
                            </Text>
                            <Text style={{ fontSize: 13, marginTop: 4 }}>
                                {workout.exercises.length} упражнени{workout.exercises.length === 1 ? 'е' : 'й'}
                            </Text>
                        </Div>
                    </Card>

                    {type === 'incoming' && invitation.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <Button
                                size="m"
                                mode="primary"
                                onClick={() => handleAcceptInvitation(invitation.id)}
                                stretched
                            >
                                Принять
                            </Button>
                            <Button
                                size="m"
                                mode="secondary"
                                onClick={() => handleDeclineInvitation(invitation.id)}
                                stretched
                            >
                                Отклонить
                            </Button>
                        </div>
                    )}
                </Div>
            </Card>
        );
    };

    if (incomingInvitations.length === 0 && sentInvitations.length === 0) {
        return (
            <Group>
                <Header>Приглашения на тренировки</Header>
                <Div>
                    <Text style={{ opacity: 0.7 }}>Нет приглашений</Text>
                </Div>
            </Group>
        );
    }

    return (
        <>
            {incomingInvitations.length > 0 && (
                <Group>
                    <Header>Входящие приглашения</Header>
                    <Div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {incomingInvitations.map(invitation =>
                            renderInvitation(invitation, 'incoming')
                        )}
                    </Div>
                </Group>
            )}

            {sentInvitations.length > 0 && (
                <Group>
                    <Header>Отправленные приглашения</Header>
                    <Div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sentInvitations.map(invitation =>
                            renderInvitation(invitation, 'sent')
                        )}
                    </Div>
                </Group>
            )}
        </>
    );
});
