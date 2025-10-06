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
  user_id: string;
  username: string;
  avatar_url: string;
  message: string;
  created_at: string;
}

const CHAT_URL = 'https://functions.poehali.dev/3d6f11fc-510a-4c29-8237-b4aeb4a7d1b0';

export default function Chat({ currentUser, authToken, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get_messages&limit=50`, {
        headers: {
          'X-Auth-Token': authToken
        }
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

  const sendMessage = async () => {
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
      fetchMessages();
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Обновление каждые 3 секунды
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-4xl w-full h-[600px] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
              <Icon name="MessageCircle" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Общий чат</h2>
              <p className="text-sm text-muted-foreground">Обсуждайте аниме с другими пользователями</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Пока нет сообщений</p>
                <p className="text-sm">Будьте первым, кто напишет!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.user_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                      {msg.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${isOwnMessage ? 'text-right' : ''}`}>
                        {isOwnMessage ? 'Вы' : msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
              disabled={isLoading}
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !newMessage.trim()}
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
    </div>
  );
}