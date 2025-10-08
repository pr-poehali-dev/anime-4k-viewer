import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface VideoUploadProps {
  uploadMode: 'url' | 'file';
  videoFiles: {[key: string]: File | null};
  videoUrls: {
    video_quality_4k: string;
    video_quality_1080p: string;
    video_quality_720p: string;
    video_quality_480p: string;
  };
  onFileUpload: (file: File, quality: string) => void;
  onUrlChange: (quality: string, url: string) => void;
}

export default function VideoUpload({
  uploadMode,
  videoFiles,
  videoUrls,
  onFileUpload,
  onUrlChange
}: VideoUploadProps) {
  return (
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
                onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], quality)}
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
            value={videoUrls.video_quality_4k}
            onChange={(e) => onUrlChange('video_quality_4k', e.target.value)}
            placeholder="4K - https://..."
          />
          <Input
            value={videoUrls.video_quality_1080p}
            onChange={(e) => onUrlChange('video_quality_1080p', e.target.value)}
            placeholder="1080p - https://..."
          />
          <Input
            value={videoUrls.video_quality_720p}
            onChange={(e) => onUrlChange('video_quality_720p', e.target.value)}
            placeholder="720p - https://..."
          />
          <Input
            value={videoUrls.video_quality_480p}
            onChange={(e) => onUrlChange('video_quality_480p', e.target.value)}
            placeholder="480p - https://..."
          />
        </div>
      )}
    </div>
  );
}
