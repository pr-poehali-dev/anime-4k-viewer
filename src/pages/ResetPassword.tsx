import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/268f16de-69c3-43b0-a1ce-341db3868ec2';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Токен восстановления не найден');
    }
  }, []);

  const handleResetPassword = async () => {
    setError('');
    
    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          token,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка восстановления пароля');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border max-w-md w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Lock" size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Новый пароль</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Введите новый пароль для вашего аккаунта
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <p className="text-green-600 font-medium">Пароль успешно изменен!</p>
            <p className="text-sm text-muted-foreground mt-2">Перенаправление на главную...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-start gap-2">
                <Icon name="AlertCircle" size={18} className="mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Минимум 8 символов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Повторите пароль"
              />
            </div>

            <button
              onClick={handleResetPassword}
              disabled={isLoading || !password || !confirmPassword || !token}
              className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Вернуться на главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
