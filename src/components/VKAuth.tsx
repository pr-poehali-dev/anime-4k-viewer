import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

interface VKAuthProps {
  onSuccess: (data: any) => void;
  onError?: (error: any) => void;
}

export default function VKAuth({ onSuccess, onError }: VKAuthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !window.VKIDSDK) return;

    const VKID = window.VKIDSDK;

    try {
      VKID.Config.init({
        app: 54213716,
        redirectUrl: window.location.origin,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      });

      const oAuth = new VKID.OAuthList();

      widgetRef.current = oAuth;

      oAuth.render({
        container: containerRef.current,
        oauthList: ['vkid']
      })
      .on(VKID.WidgetEvents.ERROR, (error: any) => {
        console.error('VK Auth Error:', error);
        onError?.(error);
      })
      .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
        try {
          const code = payload.code;
          const deviceId = payload.device_id;

          const data = await VKID.Auth.exchangeCode(code, deviceId);
          onSuccess(data);
        } catch (error) {
          console.error('VK Token Exchange Error:', error);
          onError?.(error);
        }
      });
    } catch (error) {
      console.error('VK Init Error:', error);
      onError?.(error);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.close?.();
        } catch (e) {
          console.error('VK Widget cleanup error:', e);
        }
      }
    };
  }, [onSuccess, onError]);

  return <div ref={containerRef} className="w-full" />;
}
