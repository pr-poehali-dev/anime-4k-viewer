import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface ChatProps {
  currentUser: any;
  authToken: string;
  onClose: () => void;
}

interface Message {
  id: string;
  user_id?: string;
  sender_id?: string;
  recipient_id?: string;
  username?: string;
  avatar_url?: string;
  message: string;
  created_at: string;
  is_read?: boolean;
}

interface Friend {
  id: string;
  username: string;
  avatar_url: string;
  status: string;
  created_at: string;
}

interface FriendRequest {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  status: string;
}

interface User {
  id: string;
  username: string;
  avatar_url: string;
  is_admin: boolean;
}

const CHAT_URL = 'https://functions.poehali.dev/3d6f11fc-510a-4c29-8237-b4aeb4a7d1b0';

export default function Chat({ currentUser, authToken, onClose }: ChatProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'private' | 'requests' | 'users'>('global');
  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGlobalMessages = async () => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get_messages&limit=50`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  };

  const fetchPrivateMessages = async (friendId: string) => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get_private_messages&friend_id=${friendId}`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Ошибка загрузки личных сообщений:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get_friends`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки друзей:', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get_friend_requests`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        setFriendRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get_all_users`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    }
  };

  const sendGlobalMessage = async () => {
    if (!newMessage.trim()) return;
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'send_message',
          message: newMessage.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Ошибка отправки сообщения');
        return;
      }

      setNewMessage('');
      fetchGlobalMessages();
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPrivateMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'send_private_message',
          recipient_id: selectedFriend.id,
          message: newMessage.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Ошибка отправки сообщения');
        return;
      }

      setNewMessage('');
      fetchPrivateMessages(selectedFriend.id);
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const addFriend = async (userId: string) => {
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'add_friend',
          friend_id: userId
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Заявка в друзья отправлена!');
        fetchAllUsers();
      } else {
        alert(data.error || 'Ошибка добавления в друзья');
      }
    } catch (err) {
      alert('Ошибка подключения к серверу');
    }
  };

  const acceptFriend = async (userId: string) => {
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'accept_friend',
          friend_id: userId
        })
      });

      if (response.ok) {
        fetchFriendRequests();
        fetchFriends();
      }
    } catch (err) {
      console.error('Ошибка принятия заявки:', err);
    }
  };

  const rejectFriend = async (userId: string) => {
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'reject_friend',
          friend_id: userId
        })
      });

      if (response.ok) {
        fetchFriendRequests();
      }
    } catch (err) {
      console.error('Ошибка отклонения заявки:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'global') {
        sendGlobalMessage();
      } else if (activeTab === 'private' && selectedFriend) {
        sendPrivateMessage();
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobalMessages();
      const interval = setInterval(fetchGlobalMessages, 3000);
      return () => clearInterval(interval);
    } else if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'private' && selectedFriend) {
      fetchPrivateMessages(selectedFriend.id);
      const interval = setInterval(() => fetchPrivateMessages(selectedFriend.id), 3000);
      return () => clearInterval(interval);
    } else if (activeTab === 'requests') {
      fetchFriendRequests();
      const interval = setInterval(fetchFriendRequests, 5000);
      return () => clearInterval(interval);
    } else if (activeTab === 'users') {
      fetchAllUsers();
    }
  }, [activeTab, selectedFriend]);

  const renderMessages = () => {
    if (activeTab === 'private' && !selectedFriend) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Icon name="UserCircle" size={48} className="mx-auto mb-2 opacity-50" />
            <p>Выберите друга для переписки</p>
          </div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
            <p>Пока нет сообщений</p>
            <p className="text-sm">Будьте первым, кто напишет!</p>
          </div>
        </div>
      );
    }

    return messages.map((msg) => {
      const isOwnMessage = activeTab === 'global' 
        ? msg.user_id === currentUser?.id 
        : msg.sender_id === currentUser?.id;
      
      const displayName = activeTab === 'global' ? msg.username : '';
      const avatarUrl = activeTab === 'global' 
        ? msg.avatar_url 
        : (isOwnMessage ? currentUser?.avatar_url : selectedFriend?.avatar_url);

      return (
        <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} />
            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">
              {(displayName || 'U')[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            {activeTab === 'global' && (
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${isOwnMessage ? 'text-right' : ''}`}>
                  {isOwnMessage ? 'Вы' : displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            {activeTab === 'private' && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            <div className={`p-3 rounded-lg ${isOwnMessage ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-muted'}`}>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-5xl w-full h-[650px] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
              <Icon name="MessageCircle" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Чат</h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'global' && 'Общий чат'}
                {activeTab === 'friends' && 'Ваши друзья'}
                {activeTab === 'private' && (selectedFriend ? `Переписка с ${selectedFriend.username}` : 'Личные сообщения')}
                {activeTab === 'requests' && 'Заявки в друзья'}
                {activeTab === 'users' && 'Все пользователи'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('global'); setSelectedFriend(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'global' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Общий чат
          </button>
          <button
            onClick={() => { setActiveTab('friends'); setSelectedFriend(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'friends' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Друзья ({friends.length})
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setSelectedFriend(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'requests' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Заявки
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSelectedFriend(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'users' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Найти друзей
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'friends' && (
            <div className="w-full flex">
              <div className="w-1/3 border-r border-border overflow-y-auto p-4">
                {friends.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">У вас пока нет друзей</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => { setSelectedFriend(friend); setActiveTab('private'); }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback>{friend.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{friend.username}</p>
                          <p className="text-xs text-muted-foreground">Нажмите для переписки</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Выберите друга для переписки</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="w-full overflow-y-auto p-4">
              {friendRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Нет новых заявок</p>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.avatar_url} />
                        <AvatarFallback>{request.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{request.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acceptFriend(request.id)} className="bg-green-500 hover:bg-green-600">
                          Принять
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectFriend(request.id)}>
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="w-full overflow-y-auto p-4">
              <div className="space-y-3">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.username}</p>
                      {user.is_admin && <span className="text-xs text-pink-500">Админ</span>}
                    </div>
                    <Button size="sm" onClick={() => addFriend(user.id)} className="gradient-red-dark">
                      Добавить в друзья
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'global' || activeTab === 'private') && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Напишите сообщение..."
                    className="flex-1"
                    disabled={isLoading || (activeTab === 'private' && !selectedFriend)}
                    maxLength={500}
                  />
                  <Button
                    onClick={activeTab === 'global' ? sendGlobalMessage : sendPrivateMessage}
                    disabled={isLoading || !newMessage.trim() || (activeTab === 'private' && !selectedFriend)}
                    className="gradient-red-dark"
                  >
                    {isLoading ? (
                      <Icon name="Loader2" size={20} className="animate-spin" />
                    ) : (
                      <Icon name="Send" size={20} />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter - отправить, Shift+Enter - новая строка. Макс. 500 символов
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
