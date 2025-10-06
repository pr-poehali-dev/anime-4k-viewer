import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface UserProfileProps {
  currentUser: any;
  authToken: string;
  onClose: () => void;
  onUserUpdate: (user: any) => void;
}

const PROFILE_URL = 'https://functions.poehali.dev/268f16de-69c3-43b0-a1ce-341db3868ec2';

export default function UserProfile({ currentUser, authToken, onClose, onUserUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(PROFILE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'update_profile',
          username,
          bio,
          avatar_url: avatarUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка обновления профиля');
        return;
      }

      setSuccess('Профиль успешно обновлен!');
      onUserUpdate(data.user);
      setIsEditing(false);
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUser?.username || '');
    setBio(currentUser?.bio || '');
    setAvatarUrl(currentUser?.avatar_url || '');
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-2xl w-full shadow-2xl overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6 -mt-16">
          <div className="flex items-start gap-6">
            <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
              <AvatarImage src={avatarUrl || currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                {currentUser?.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 mt-16">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{currentUser?.username}</h2>
                  <p className="text-sm text-muted-foreground">{currentUser?.email || 'Нет email'}</p>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                    <Icon name="Edit" size={16} />
                    Редактировать
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Отмена
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} size="sm" className="gradient-red-dark">
                      {isLoading ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm flex items-center gap-2">
              <Icon name="CheckCircle" size={16} />
              {success}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Имя пользователя</label>
              {isEditing ? (
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full"
                />
              ) : (
                <p className="text-foreground">{currentUser?.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">О себе</label>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                />
              ) : (
                <p className="text-muted-foreground">{currentUser?.bio || 'Пользователь не указал информацию о себе'}</p>
              )}
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">URL аватара</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Оставьте пустым для автоматического аватара
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-semibold mb-3">Статистика</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <Icon name="Heart" size={20} className="mx-auto mb-1 text-pink-500" />
                  <p className="text-2xl font-bold">{currentUser?.favorites_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Избранное</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <Icon name="Clock" size={20} className="mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold">{currentUser?.watch_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Просмотрено</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <Icon name="Star" size={20} className="mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold">{currentUser?.ratings_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Оценок</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Провайдер входа:</span>
                <span className="font-medium capitalize">{currentUser?.provider || 'email'}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Дата регистрации:</span>
                <span className="font-medium">
                  {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}