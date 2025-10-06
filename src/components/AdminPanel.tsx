import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ADMIN_KEY = 'dokidoki-admin-2024';
const API_URL = 'https://functions.poehali.dev/74bb9374-2de8-495b-ba12-4a8d593566b5';

interface AdminPanelProps {
  onClose: () => void;
  onAnimeAdded: () => void;
}

export default function AdminPanel({ onClose, onAnimeAdded }: AdminPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    episodes: 1,
    rating: 0,
    description: '',
    genres: '',
    release_year: new Date().getFullYear(),
    status: 'ongoing'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': ADMIN_KEY
        },
        body: JSON.stringify({
          title: formData.title,
          image_url: formData.image_url,
          episodes: Number(formData.episodes),
          rating: Number(formData.rating),
          description: formData.description,
          genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
          release_year: Number(formData.release_year),
          status: formData.status
        })
      });

      if (response.ok) {
        toast({
          title: 'Успех!',
          description: 'Аниме успешно добавлено',
        });
        setFormData({
          title: '',
          image_url: '',
          episodes: 1,
          rating: 0,
          description: '',
          genres: '',
          release_year: new Date().getFullYear(),
          status: 'ongoing'
        });
        onAnimeAdded();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить аниме',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>⚙️</span>
            Админ-панель - Добавить аниме
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Название аниме *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Клинок, рассекающий демонов"
                required
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL обложки *</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                required
              />
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-32 h-48 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="episodes">Количество эпизодов</Label>
                <Input
                  id="episodes"
                  type="number"
                  min="1"
                  value={formData.episodes}
                  onChange={(e) => setFormData({ ...formData, episodes: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="rating">Рейтинг (0-10)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание сюжета аниме..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="genres">Жанры (через запятую)</Label>
              <Input
                id="genres"
                value={formData.genres}
                onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                placeholder="Экшен, Приключения, Фэнтези"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="release_year">Год выпуска</Label>
                <Input
                  id="release_year"
                  type="number"
                  min="1960"
                  max="2030"
                  value={formData.release_year}
                  onChange={(e) => setFormData({ ...formData, release_year: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="status">Статус</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ongoing">Выходит</option>
                  <option value="completed">Завершено</option>
                  <option value="upcoming">Анонсировано</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Добавление...' : 'Добавить аниме'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Отменить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}