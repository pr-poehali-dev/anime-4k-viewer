import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AnimeManagerProps {
  authToken: string;
  onClose: () => void;
}

interface Anime {
  id: number;
  title: string;
  image_url: string;
  episodes: number;
  rating: number;
  description: string;
  genres: string[];
  release_year: number;
  status: string;
  video_quality_4k?: string;
  video_quality_1080p?: string;
  video_quality_720p?: string;
  video_quality_480p?: string;
  anime_type: string;
  duration_minutes?: number;
  is_movie: boolean;
}

const ANIME_URL = 'https://functions.poehali.dev/1c23b5e2-a71e-459a-8aad-2ea4a85a0740';

export default function AnimeManager({ authToken, onClose }: AnimeManagerProps) {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    episodes: 12,
    rating: 8.0,
    description: '',
    genres: '',
    release_year: new Date().getFullYear(),
    status: 'Онгоинг',
    video_quality_4k: '',
    video_quality_1080p: '',
    video_quality_720p: '',
    video_quality_480p: '',
    anime_type: 'series',
    duration_minutes: 24,
    is_movie: false
  });

  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<{[key: string]: File | null}>({
    '4k': null,
    '1080p': null,
    '720p': null,
    '480p': null
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File, type: 'cover' | 'video', quality?: string) => {
    if (type === 'cover') {
      setCoverFile(file);
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, image_url: base64 });
    } else if (type === 'video' && quality) {
      setVideoFiles({ ...videoFiles, [quality]: file });
      const base64 = await fileToBase64(file);
      const qualityKey = `video_quality_${quality}` as keyof typeof formData;
      setFormData({ ...formData, [qualityKey]: base64 });
    }
  };

  const fetchAnimes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${ANIME_URL}?action=get_all`, {
        headers: { 'X-Auth-Token': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        setAnimes(data.animes || []);
      }
    } catch (err) {
      setError('Ошибка загрузки аниме');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    try {
      const action = editingAnime ? 'update_anime' : 'add_anime';
      const body: any = {
        action,
        ...formData,
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        is_movie: formData.anime_type === 'movie'
      };

      if (editingAnime) {
        body.anime_id = editingAnime.id;
      }

      const response = await fetch(ANIME_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка сохранения');
        return;
      }

      setEditingAnime(null);
      setIsAdding(false);
      setFormData({
        title: '',
        image_url: '',
        episodes: 12,
        rating: 8.0,
        description: '',
        genres: '',
        release_year: new Date().getFullYear(),
        status: 'Онгоинг',
        video_quality_4k: '',
        video_quality_1080p: '',
        video_quality_720p: '',
        video_quality_480p: '',
        anime_type: 'series',
        duration_minutes: 24,
        is_movie: false
      });
      fetchAnimes();
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (anime: Anime) => {
    setEditingAnime(anime);
    setFormData({
      title: anime.title,
      image_url: anime.image_url,
      episodes: anime.episodes,
      rating: anime.rating,
      description: anime.description,
      genres: anime.genres.join(', '),
      release_year: anime.release_year,
      status: anime.status,
      video_quality_4k: anime.video_quality_4k || '',
      video_quality_1080p: anime.video_quality_1080p || '',
      video_quality_720p: anime.video_quality_720p || '',
      video_quality_480p: anime.video_quality_480p || '',
      anime_type: anime.anime_type || 'series',
      duration_minutes: anime.duration_minutes || 24,
      is_movie: anime.is_movie || false
    });
  };

  const handleDelete = async (animeId: number) => {
    if (!confirm('Удалить это аниме?')) return;

    try {
      const response = await fetch(ANIME_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({ action: 'delete_anime', anime_id: animeId })
      });

      if (response.ok) {
        fetchAnimes();
      }
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  useEffect(() => {
    fetchAnimes();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card rounded-xl border border-border max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
              <Icon name="Film" size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">Управление аниме</h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Добавляйте и редактируйте аниме на сайте</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isAdding && !editingAnime && (
            <>
              <Button onClick={() => setIsAdding(true)} className="mb-4 gradient-red-dark">
                <Icon name="Plus" size={20} className="mr-2" />
                Добавить аниме
              </Button>

              <div className="grid gap-3 sm:gap-4">
                {animes.map((anime) => (
                  <div key={anime.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
                    <img src={anime.image_url} alt={anime.title} className="w-full sm:w-16 h-32 sm:h-24 object-cover rounded" />
                    <div className="flex-1 w-full">
                      <h3 className="font-bold text-sm sm:text-base">{anime.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {anime.is_movie ? 'Фильм' : `Серий: ${anime.episodes}`} • {anime.release_year} • ⭐ {anime.rating}
                      </p>
                      <div className="flex gap-1 sm:gap-2 mt-2 flex-wrap">
                        {anime.video_quality_4k && <span className="text-xs px-2 py-1 bg-primary/20 rounded">4K</span>}
                        {anime.video_quality_1080p && <span className="text-xs px-2 py-1 bg-primary/20 rounded">1080p</span>}
                        {anime.video_quality_720p && <span className="text-xs px-2 py-1 bg-primary/20 rounded">720p</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(anime)} className="flex-1 sm:flex-none">
                        <Icon name="Edit" size={16} />
                        <span className="ml-1 sm:hidden">Изменить</span>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(anime.id)} className="flex-1 sm:flex-none">
                        <Icon name="Trash2" size={16} />
                        <span className="ml-1 sm:hidden">Удалить</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(isAdding || editingAnime) && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">{editingAnime ? 'Редактировать аниме' : 'Добавить аниме'}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Название аниме"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select
                    value={formData.anime_type}
                    onChange={(e) => setFormData({ ...formData, anime_type: e.target.value, is_movie: e.target.value === 'movie' })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="series">Сериал</option>
                    <option value="movie">Фильм</option>
                    <option value="ova">OVA</option>
                    <option value="ona">ONA</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Обложка аниме</label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={uploadMode === 'file' ? 'default' : 'outline'}
                      onClick={() => setUploadMode('file')}
                    >
                      <Icon name="Upload" size={16} className="mr-1" />
                      Загрузить файл
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={uploadMode === 'url' ? 'default' : 'outline'}
                      onClick={() => setUploadMode('url')}
                    >
                      <Icon name="Link" size={16} className="mr-1" />
                      Ссылка
                    </Button>
                  </div>
                  
                  {uploadMode === 'file' ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label htmlFor="cover-upload" className="cursor-pointer">
                        {coverFile || formData.image_url ? (
                          <div className="space-y-2">
                            {formData.image_url && (
                              <img src={formData.image_url} alt="Preview" className="w-24 h-36 object-cover mx-auto rounded" />
                            )}
                            <p className="text-sm text-muted-foreground">
                              {coverFile?.name || 'Изображение загружено'}
                            </p>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Icon name="ImagePlus" size={32} className="mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Нажмите для выбора обложки</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG до 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{formData.anime_type === 'movie' ? 'Длительность (мин)' : 'Эпизодов'}</label>
                  <Input
                    type="number"
                    value={formData.anime_type === 'movie' ? formData.duration_minutes : formData.episodes}
                    onChange={(e) => formData.anime_type === 'movie' 
                      ? setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                      : setFormData({ ...formData, episodes: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Рейтинг</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Год выпуска</label>
                  <Input
                    type="number"
                    value={formData.release_year}
                    onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Статус</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="Онгоинг">Онгоинг</option>
                    <option value="Завершено">Завершено</option>
                    <option value="Анонс">Анонс</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Жанры (через запятую)</label>
                  <Input
                    value={formData.genres}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                    placeholder="Экшен, Романтика, Драма"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg min-h-[100px]"
                  placeholder="Описание аниме..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Видео (разные качества)</h4>
                    <p className="text-xs text-muted-foreground">
                      {uploadMode === 'file' ? 'Загрузите видео файлы' : 'Или укажите ссылки'}
                    </p>
                  </div>
                  {uploadMode === 'file' && (
                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Icon name="Info" size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-500">
                        <p className="font-medium mb-1">Автоматическая конвертация</p>
                        <p className="text-blue-500/80">
                          Загрузите видео в любом качестве - система автоматически создаст версии для всех разрешений (4K, 1080p, 720p, 480p)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadMode === 'file' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['4k', '1080p', '720p', '480p'].map((quality) => (
                      <div key={quality} className="border border-border rounded-lg p-3">
                        <label className="block text-xs font-medium mb-2 uppercase">{quality}</label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video', quality)}
                          className="hidden"
                          id={`video-${quality}`}
                        />
                        <label
                          htmlFor={`video-${quality}`}
                          className="flex items-center gap-2 p-2 bg-muted rounded cursor-pointer hover:bg-muted/70 transition-colors text-sm"
                        >
                          <Icon name={videoFiles[quality] ? 'CheckCircle2' : 'Upload'} size={16} />
                          <span className="flex-1 truncate">
                            {videoFiles[quality]?.name || 'Выбрать видео'}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={formData.video_quality_4k}
                      onChange={(e) => setFormData({ ...formData, video_quality_4k: e.target.value })}
                      placeholder="4K - https://..."
                    />
                    <Input
                      value={formData.video_quality_1080p}
                      onChange={(e) => setFormData({ ...formData, video_quality_1080p: e.target.value })}
                      placeholder="1080p - https://..."
                    />
                    <Input
                      value={formData.video_quality_720p}
                      onChange={(e) => setFormData({ ...formData, video_quality_720p: e.target.value })}
                      placeholder="720p - https://..."
                    />
                    <Input
                      value={formData.video_quality_480p}
                      onChange={(e) => setFormData({ ...formData, video_quality_480p: e.target.value })}
                      placeholder="480p - https://..."
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading} className="gradient-red-dark">
                  {isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingAnime(null);
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}