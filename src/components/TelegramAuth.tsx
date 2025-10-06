import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

interface TelegramAuthProps {
  botUsername: string;
  onAuth: (user: any) => void;
}

export default function TelegramAuth({ botUsername, onAuth }: TelegramAuthProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    window.onTelegramAuth = (user: any) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, onAuth]);

  return <div ref={containerRef} className="flex justify-center w-full" />;
}
