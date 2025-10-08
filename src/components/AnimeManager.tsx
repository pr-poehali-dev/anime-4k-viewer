import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AnimeListItem from './anime-manager/AnimeListItem';
import AnimeForm from './anime-manager/AnimeForm';
import { Anime } from './anime-manager/types';

interface AnimeManagerProps {
  authToken: string;
  onClose: () => void;
}

const ANIME_URL = 'https://functions.poehali.dev/1c23b5e2-a71e-459a-8aad-2ea4a85a0740';

const initialFormData = {
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
};

export default function AnimeManager({ authToken, onClose }: AnimeManagerProps) {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(initialFormData);
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

  const handleCoverFileUpload = async (file: File) => {
    setCoverFile(file);
    const base64 = await fileToBase64(file);
    setFormData({ ...formData, image_url: base64 });
  };

  const handleVideoFileUpload = async (file: File, quality: string) => {
    setVideoFiles({ ...videoFiles, [quality]: file });
    const base64 = await fileToBase64(file);
    const qualityKey = `video_quality_${quality}` as keyof typeof formData;
    setFormData({ ...formData, [qualityKey]: base64 });
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
      setFormData(initialFormData);
      setCoverFile(null);
      setVideoFiles({ '4k': null, '1080p': null, '720p': null, '480p': null });
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

  const handleCancel = () => {
    setIsAdding(false);
    setEditingAnime(null);
    setFormData(initialFormData);
    setCoverFile(null);
    setVideoFiles({ '4k': null, '1080p': null, '720p': null, '480p': null });
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
                  <AnimeListItem
                    key={anime.id}
                    anime={anime}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}

          {(isAdding || editingAnime) && (
            <AnimeForm
              formData={formData}
              isEditing={!!editingAnime}
              isLoading={isLoading}
              error={error}
              uploadMode={uploadMode}
              coverFile={coverFile}
              videoFiles={videoFiles}
              onFormDataChange={(data) => setFormData({ ...formData, ...data })}
              onUploadModeChange={setUploadMode}
              onCoverFileUpload={handleCoverFileUpload}
              onVideoFileUpload={handleVideoFileUpload}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}