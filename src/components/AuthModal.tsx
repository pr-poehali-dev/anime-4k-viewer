import { useState } from 'react';
import Icon from '@/components/ui/icon';
import VKAuth from '@/components/VKAuth';

const AUTH_URL = 'https://functions.poehali.dev/268f16de-69c3-43b0-a1ce-341db3868ec2';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailAuth = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      const action = authMode === 'register' ? 'register' : authMode === 'forgot' ? 'forgot_password' : 'login';
      const body = authMode === 'register' 
        ? { action, email, password, username }
        : authMode === 'forgot'
        ? { action, email }
        : { action, email, password };
      
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Ошибка авторизации');
        return;
      }
      
      if (authMode === 'forgot') {
        setSuccessMessage('Ссылка для восстановления пароля отправлена на ваш email');
      } else if (data.token) {
        onSuccess(data.token, data.user);
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVKAuth = async (vkData: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'social_auth', provider: 'vk', vk_data: vkData })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Ошибка авторизации через VK');
        return;
      }
      
      if (data.token) {
        onSuccess(data.token, data.user);
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Вход на сайт</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {authMode !== 'forgot' && (
            <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => { setAuthMode('login'); setError(''); setSuccessMessage(''); }}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  authMode === 'login' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Вход
              </button>
              <button
                onClick={() => { setAuthMode('register'); setError(''); setSuccessMessage(''); }}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  authMode === 'register' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Регистрация
              </button>
            </div>
          )}

          {authMode === 'forgot' && (
            <button
              onClick={() => { setAuthMode('login'); setError(''); setSuccessMessage(''); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <Icon name="ArrowLeft" size={16} />
              Назад ко входу
            </button>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <div className="space-y-3">
            {authMode === 'forgot' ? (
              <>
                <h3 className="text-lg font-semibold mb-2">Восстановление пароля</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Введите ваш email, и мы отправим ссылку для сброса пароля
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  onClick={handleEmailAuth}
                  disabled={isLoading || !email}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Отправляем...' : 'Отправить ссылку'}
                </button>
              </>
            ) : (
              <>
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Имя</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ваше имя"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Пароль</label>
                    {authMode === 'login' && (
                      <button
                        onClick={() => { setAuthMode('forgot'); setError(''); setSuccessMessage(''); }}
                        className="text-xs text-primary hover:underline"
                      >
                        Забыли пароль?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Минимум 8 символов"
                  />
                </div>

                <button
                  onClick={handleEmailAuth}
                  disabled={isLoading || !email || !password || (authMode === 'register' && !username)}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Загрузка...' : authMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </>
            )}
          </div>

          {authMode !== 'forgot' && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">или войдите через</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Share2" size={16} className="text-[#0077FF]" />
              <span className="text-sm font-medium">Войти через ВКонтакте</span>
            </div>
            <VKAuth 
              onSuccess={handleVKAuth}
              onError={(error) => setError('Ошибка авторизации VK')}
            />
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            <Icon name="Shield" size={14} className="inline mr-1" />
            Защищенная авторизация с многоуровневой защитой
          </p>
        </div>
      </div>
    </div>
  );
}