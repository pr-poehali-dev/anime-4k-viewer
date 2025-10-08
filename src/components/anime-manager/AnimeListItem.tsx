import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Anime } from './types';

interface AnimeListItemProps {
  anime: Anime;
  onEdit: (anime: Anime) => void;
  onDelete: (animeId: number) => void;
}

export default function AnimeListItem({ anime, onEdit, onDelete }: AnimeListItemProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
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
        <Button size="sm" variant="outline" onClick={() => onEdit(anime)} className="flex-1 sm:flex-none">
          <Icon name="Edit" size={16} />
          <span className="ml-1 sm:hidden">Изменить</span>
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(anime.id)} className="flex-1 sm:flex-none">
          <Icon name="Trash2" size={16} />
          <span className="ml-1 sm:hidden">Удалить</span>
        </Button>
      </div>
    </div>
  );
}