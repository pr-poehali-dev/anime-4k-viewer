import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CoverUpload from './CoverUpload';
import VideoUpload from './VideoUpload';
import { AnimeFormData } from './types';

interface AnimeFormProps {
  formData: AnimeFormData;
  isEditing: boolean;
  isLoading: boolean;
  error: string;
  uploadMode: 'url' | 'file';
  coverFile: File | null;
  videoFiles: {[key: string]: File | null};
  onFormDataChange: (data: Partial<AnimeFormData>) => void;
  onUploadModeChange: (mode: 'url' | 'file') => void;
  onCoverFileUpload: (file: File) => void;
  onVideoFileUpload: (file: File, quality: string) => void;
  onVideoDelete?: (quality: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function AnimeForm({
  formData,
  isEditing,
  isLoading,
  error,
  uploadMode,
  coverFile,
  videoFiles,
  onFormDataChange,
  onUploadModeChange,
  onCoverFileUpload,
  onVideoFileUpload,
  onVideoDelete,
  onSave,
  onCancel
}: AnimeFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">{isEditing ? 'Редактировать аниме' : 'Добавить аниме'}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Название</label>
          <Input
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            placeholder="Название аниме"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Тип</label>
          <select
            value={formData.anime_type}
            onChange={(e) => onFormDataChange({ anime_type: e.target.value, is_movie: e.target.value === 'movie' })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
          >
            <option value="series">Сериал</option>
            <option value="movie">Фильм</option>
            <option value="ova">OVA</option>
            <option value="ona">ONA</option>
          </select>
        </div>

        <CoverUpload
          uploadMode={uploadMode}
          coverFile={coverFile}
          imageUrl={formData.image_url}
          onUploadModeChange={onUploadModeChange}
          onFileUpload={onCoverFileUpload}
          onUrlChange={(url) => onFormDataChange({ image_url: url })}
        />

        <div>
          <label className="block text-sm font-medium mb-1">{formData.anime_type === 'movie' ? 'Длительность (мин)' : 'Эпизодов'}</label>
          <Input
            type="number"
            value={formData.anime_type === 'movie' ? formData.duration_minutes : formData.episodes}
            onChange={(e) => formData.anime_type === 'movie' 
              ? onFormDataChange({ duration_minutes: parseInt(e.target.value) })
              : onFormDataChange({ episodes: parseInt(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Рейтинг</label>
          <Input
            type="number"
            step="0.1"
            value={formData.rating}
            onChange={(e) => onFormDataChange({ rating: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Год выпуска</label>
          <Input
            type="number"
            value={formData.release_year}
            onChange={(e) => onFormDataChange({ release_year: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Статус</label>
          <select
            value={formData.status}
            onChange={(e) => onFormDataChange({ status: e.target.value })}
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
            onChange={(e) => onFormDataChange({ genres: e.target.value })}
            placeholder="Экшен, Романтика, Драма"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Описание</label>
        <textarea
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg min-h-[100px]"
          placeholder="Описание аниме..."
        />
      </div>

      <VideoUpload
        uploadMode={uploadMode}
        videoFiles={videoFiles}
        videoUrls={{
          video_quality_4k: formData.video_quality_4k,
          video_quality_1080p: formData.video_quality_1080p,
          video_quality_720p: formData.video_quality_720p,
          video_quality_480p: formData.video_quality_480p
        }}
        onFileUpload={onVideoFileUpload}
        onUrlChange={(quality, url) => onFormDataChange({ [quality]: url })}
        onVideoDelete={onVideoDelete}
        isEditing={isEditing}
      />

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isLoading} className="gradient-red-dark">
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}