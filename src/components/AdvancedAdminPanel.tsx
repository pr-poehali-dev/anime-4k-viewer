import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const ADMIN_URL = 'https://functions.poehali.dev/ad3199bd-1846-4831-ad02-15d7c6501574';

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
  is_admin: boolean;
  created_at: string;
  role?: string;
}

interface SiteSettings {
  site_title: string;
  site_description: string;
  show_featured_section: boolean;
  show_popular_section: boolean;
  show_continue_section: boolean;
  enable_comments: boolean;
  enable_ratings: boolean;
}

interface AdvancedAdminPanelProps {
  onClose: () => void;
  authToken: string;
}

export default function AdvancedAdminPanel({ onClose, authToken }: AdvancedAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings();
    } else {
      loadUsers();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${ADMIN_URL}?action=settings`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (data.settings) {
        const parsedSettings: any = {};
        Object.keys(data.settings).forEach(key => {
          try {
            parsedSettings[key] = JSON.parse(data.settings[key]);
          } catch {
            parsedSettings[key] = data.settings[key];
          }
        });
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${ADMIN_URL}?action=users`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await fetch(`${ADMIN_URL}?action=settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({ key, value })
      });
      loadSettings();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      await fetch(`${ADMIN_URL}?action=add-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({ user_id: userId, role: 'admin' })
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to make admin:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Settings" size={24} />
            Расширенная админ-панель
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Icon name="Sliders" size={16} className="inline mr-2" />
            Настройки сайта
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Icon name="Users" size={16} className="inline mr-2" />
            Пользователи
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'settings' && settings ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Название сайта</label>
                <input
                  type="text"
                  value={settings.site_title || ''}
                  onChange={(e) => updateSetting('site_title', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание сайта</label>
                <input
                  type="text"
                  value={settings.site_description || ''}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Отображение разделов</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_featured_section}
                    onChange={(e) => updateSetting('show_featured_section', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span>Показывать раздел "Рекомендуем"</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_popular_section}
                    onChange={(e) => updateSetting('show_popular_section', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span>Показывать раздел "Популярное"</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_continue_section}
                    onChange={(e) => updateSetting('show_continue_section', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span>Показывать раздел "Продолжить просмотр"</span>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Функции сайта</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_comments}
                    onChange={(e) => updateSetting('enable_comments', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span>Включить комментарии</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_ratings}
                    onChange={(e) => updateSetting('enable_ratings', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span>Включить оценки</span>
                </label>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email || user.provider}
                        {user.is_admin && (
                          <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                            Админ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!user.is_admin && (
                    <button
                      onClick={() => makeAdmin(user.id)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                    >
                      Сделать админом
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
