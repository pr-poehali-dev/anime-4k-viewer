import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface CoverUploadProps {
  uploadMode: 'url' | 'file';
  coverFile: File | null;
  imageUrl: string;
  onUploadModeChange: (mode: 'url' | 'file') => void;
  onFileUpload: (file: File) => void;
  onUrlChange: (url: string) => void;
}

export default function CoverUpload({
  uploadMode,
  coverFile,
  imageUrl,
  onUploadModeChange,
  onFileUpload,
  onUrlChange
}: CoverUploadProps) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium mb-2">Обложка аниме</label>
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          size="sm"
          variant={uploadMode === 'file' ? 'default' : 'outline'}
          onClick={() => onUploadModeChange('file')}
        >
          <Icon name="Upload" size={16} className="mr-1" />
          Загрузить файл
        </Button>
        <Button
          type="button"
          size="sm"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          onClick={() => onUploadModeChange('url')}
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
            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
            className="hidden"
            id="cover-upload"
          />
          <label htmlFor="cover-upload" className="cursor-pointer">
            {coverFile || imageUrl ? (
              <div className="space-y-2">
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-24 h-36 object-cover mx-auto rounded" />
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
          value={imageUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
        />
      )}
    </div>
  );
}
