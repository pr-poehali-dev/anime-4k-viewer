import { useState } from 'react';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/268f16de-69c3-43b0-a1ce-341db3868ec2';
const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID || '';
const VK_APP_ID = import.meta.env.VITE_VK_APP_ID || '';
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || '';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleEmailAuth = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const action = authMode === 'register' ? 'register' : 'login';
      const body = authMode === 'register' 
        ? { action, email, password, username }
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
      
      if (data.token) {
        onSuccess(data.token, data.user);
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYandexAuth = () => {
    const redirectUri = `${window.location.origin}/auth/yandex`;
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  const handleVKAuth = () => {
    const redirectUri = `${window.location.origin}/auth/vk`;
    const authUrl = `https://oauth.vk.com/authorize?client_id=${VK_APP_ID}&redirect_uri=${redirectUri}&display=page&response_type=code&v=5.131`;
    window.location.href = authUrl;
  };

  const handleTelegramAuth = () => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    (window as any).onTelegramAuth = async (user: any) => {
      setIsLoading(true);
      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'telegram', telegram_data: user })
        });
        const data = await response.json();
        if (data.token) {
          onSuccess(data.token, data.user);
        }
      } catch (error) {
        console.error('Telegram auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
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
          <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
            <button
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                authMode === 'login' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                authMode === 'register' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Регистрация
            </button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
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
              <label className="block text-sm font-medium mb-1">Пароль</label>
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
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">или войдите через</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleVKAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#0077FF] hover:bg-[#0077FF]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
            >
              <Icon name="Share2" size={18} />
              ВК
            </button>

            <button
              onClick={handleTelegramAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
            >
              <Icon name="Send" size={18} />
              Telegram
            </button>
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