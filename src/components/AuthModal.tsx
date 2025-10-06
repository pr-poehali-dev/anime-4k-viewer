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
          <p className="text-sm text-muted-foreground mb-6">
            Выберите способ входа для доступа ко всем функциям сайта
          </p>

          <button
            onClick={handleYandexAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FC3F1D] hover:bg-[#FC3F1D]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Icon name="Circle" size={20} />
            Войти через Яндекс
          </button>

          <button
            onClick={handleVKAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0077FF] hover:bg-[#0077FF]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Icon name="Share2" size={20} />
            Войти через ВКонтакте
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">или</span>
            </div>
          </div>

          <div id="telegram-login-container" className="flex justify-center">
            <button
              onClick={handleTelegramAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Icon name="Send" size={20} />
              Войти через Telegram
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Входя на сайт, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
}
