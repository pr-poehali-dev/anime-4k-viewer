import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTH_URL = 'https://functions.poehali.dev/268f16de-69c3-43b0-a1ce-341db3868ec2';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const path = window.location.pathname;

      if (!code) {
        navigate('/');
        return;
      }

      let provider = '';
      if (path.includes('yandex')) provider = 'yandex';
      else if (path.includes('vk')) provider = 'vk';

      if (!provider) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            code,
            redirect_uri: `${window.location.origin}/auth/${provider}`
          })
        });

        const data = await response.json();

        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          navigate('/');
        } else {
          console.error('Auth failed:', data);
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Авторизация...</p>
      </div>
    </div>
  );
}
