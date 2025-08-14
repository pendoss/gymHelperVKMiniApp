import { FC, useState } from "react";
import {
    ModalRoot,
    ModalPage,
    ModalPageHeader,
    PanelHeaderClose,
    Group,
    Header,
    Div,
    Button,
    Search,
    Avatar,
    Text,
    Card,
    Spacing,
} from "@vkontakte/vkui";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/StoreContext";
import { Icon28UsersOutline } from "@vkontakte/icons";

export interface InviteFriendsModalProps {
    workoutId: string;
    isVisible: boolean;
    onClose: () => void;
}

export const InviteFriendsModal: FC<InviteFriendsModalProps> = observer(({ 
    workoutId, 
    isVisible, 
    onClose 
}) => {
    const store = useStore();
    const [searchValue, setSearchValue] = useState("");
    const [selectedFriends, setSelectedFriends] = useState<number[]>([]);

    const filteredFriends = store.friends.filter(friend => 
        `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(searchValue.toLowerCase())
    );

    const handleFriendToggle = (friendId: number) => {
        setSelectedFriends(prev => 
            prev.includes(friendId) 
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const handleSendInvitations = () => {
        selectedFriends.forEach(friendId => {
            store.sendWorkoutInvitation(friendId, workoutId);
        });
        
        setSelectedFriends([]);
        setSearchValue("");
        onClose();
    };

    return (
        <ModalRoot activeModal={isVisible ? "invite-friends" : null}>
            <ModalPage
                id="invite-friends"
                onClose={onClose}
                settlingHeight={100}
                header={
                    <ModalPageHeader
                        before={<PanelHeaderClose onClick={onClose} />}
                    >
                        Пригласить друзей
                    </ModalPageHeader>
                }
            >
                <Group>
                    <Header>Выберите друзей для приглашения</Header>
                    <Div>
                        <Search
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Поиск друзей..."
                            style={{ marginBottom: 16 }}
                        />

                        {filteredFriends.length === 0 ? (
                            <Text style={{ textAlign: "center", opacity: 0.7, padding: 16 }}>
                                Друзья не найдены
                            </Text>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {filteredFriends.map(friend => (
                                    <Card
                                        key={friend.id}
                                        mode={selectedFriends.includes(friend.id) ? "shadow" : "outline"}
                                        style={{ 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => handleFriendToggle(friend.id)}
                                    >
                                        <Div style={{ padding: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Avatar 
                                                    size={40} 
                                                    src={friend.photo_200}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <Text weight="2">
                                                        {friend.first_name} {friend.last_name}
                                                    </Text>
                                                    {friend.gym && (
                                                        <Text style={{ fontSize: 13, opacity: 0.7 }}>
                                                            {friend.gym}
                                                        </Text>
                                                    )}
                                                </div>
                                                {selectedFriends.includes(friend.id) && (
                                                    <div style={{ 
                                                        width: 20, 
                                                        height: 20, 
                                                        borderRadius: '50%', 
                                                        backgroundColor: 'var(--vkui--color_accent)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: 12
                                                    }}>
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                        </Div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {selectedFriends.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Button 
                                    size="l"
                                    mode="primary"
                                    onClick={handleSendInvitations}
                                    before={<Icon28UsersOutline />}
                                    stretched
                                >
                                    Отправить приглашения ({selectedFriends.length})
                                </Button>
                            </div>
                        )}
                    </Div>
                </Group>
               <Spacing size={40} />
            </ModalPage>
        </ModalRoot>
    );
});
