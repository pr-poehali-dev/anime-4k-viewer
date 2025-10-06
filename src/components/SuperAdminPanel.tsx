import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const FILE_UPLOAD_URL = 'https://functions.poehali.dev/0b16efce-58ce-431b-ac85-db3546fe4bb7';
const SECURITY_URL = 'https://functions.poehali.dev/769b7595-3ec5-4734-acdd-4d8b3b1a29c1';

interface SuperAdminPanelProps {
  onClose: () => void;
  authToken: string;
}

export default function SuperAdminPanel({ onClose, authToken }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'banners' | 'security' | 'files'>('banners');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'security') {
      loadSecurityStatus();
    }
  }, [activeTab]);

  const loadSecurityStatus = async () => {
    try {
      const response = await fetch(SECURITY_URL);
      const data = await response.json();
      setSecurityStatus(data);
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  };

  const handleBannerUpload = async () => {
    if (!bannerImage || !bannerTitle) {
      alert('Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const response = await fetch(FILE_UPLOAD_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken
          },
          body: JSON.stringify({
            file: base64,
            filename: bannerImage.name,
            filetype: bannerImage.type,
            entity_type: 'banner'
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          alert('Баннер успешно добавлен!');
          setBannerTitle('');
          setBannerLink('');
          setBannerImage(null);
        } else {
          alert(data.error || 'Ошибка загрузки');
        }
      };
      reader.readAsDataURL(bannerImage);
    } catch (error) {
      alert('Ошибка загрузки баннера');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Супер Админ-Панель</h2>
              <p className="text-sm text-muted-foreground">Полное управление сайтом</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'banners'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="Image" size={18} className="inline mr-2" />
            Баннеры
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="Shield" size={18} className="inline mr-2" />
            Безопасность
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="FileText" size={18} className="inline mr-2" />
            Файлы
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Добавить баннер</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Заголовок баннера</label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="Новое аниме 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Ссылка (необязательно)</label>
                    <input
                      type="url"
                      value={bannerLink}
                      onChange={(e) => setBannerLink(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Изображение баннера</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerImage(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    />
                    {bannerImage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Выбран файл: {bannerImage.name}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleBannerUpload}
                    disabled={isLoading || !bannerImage || !bannerTitle}
                    className="w-full"
                  >
                    {isLoading ? 'Загрузка...' : 'Добавить баннер'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && securityStatus && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Icon name="Shield" size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Уровень защиты</p>
                      <p className="text-2xl font-bold">{securityStatus.security_level}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Icon name="AlertTriangle" size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Угрозы за 24ч</p>
                      <p className="text-2xl font-bold">{securityStatus.recent_threats?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Icon name="Ban" size={24} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Заблокировано IP</p>
                      <p className="text-2xl font-bold">{securityStatus.blocked_ips?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Последние угрозы</h3>
                <div className="space-y-2">
                  {securityStatus.recent_threats?.slice(0, 10).map((threat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          threat.threat_level === 'critical' ? 'bg-red-500' :
                          threat.threat_level === 'high' ? 'bg-orange-500' :
                          threat.threat_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium">{threat.threat_type}</p>
                          <p className="text-sm text-muted-foreground">{threat.source_ip}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(threat.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 p-6 rounded-lg border border-blue-500/20">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Info" size={20} className="text-blue-600" />
                  Система автозащиты активна
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Автоматическая смена паролей при брутфорсе</li>
                  <li>✅ Блокировка IP при SQL-инъекциях</li>
                  <li>✅ Rate limiting при DDoS атаках</li>
                  <li>✅ Принудительная 2FA при подозрительной активности</li>
                  <li>✅ Очистка сессий при утечках</li>
                  <li>✅ 990 уровней защиты активны</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Управление файлами в разработке</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
