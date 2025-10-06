import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AnimeCardProps {
  id: string;
  title: string;
  image: string;
  episodes: number;
  currentEpisode?: number;
  rating?: number;
  onWatch?: () => void;
}

export default function AnimeCard({ id, title, image, episodes, currentEpisode = 0, rating, onWatch }: AnimeCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchProgress, setWatchProgress] = useState(currentEpisode);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));

    const progress = localStorage.getItem(`progress-${id}`);
    if (progress) {
      setWatchProgress(parseInt(progress));
    }
  }, [id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const updated = favorites.filter((fav: string) => fav !== id);
      localStorage.setItem('favorites', JSON.stringify(updated));
    } else {
      favorites.push(id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    setIsFavorite(!isFavorite);
  };

  const progressPercentage = (watchProgress / episodes) * 100;

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all hover:scale-105 hover:border-primary/50">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 backdrop-blur transition-all hover:bg-black/70"
        >
          <Icon
            name="Heart"
            size={20}
            className={isFavorite ? 'fill-primary text-primary' : 'text-white'}
          />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full transition-transform group-hover:translate-y-0">
          <Button onClick={onWatch} className="w-full gradient-red-dark">
            <Icon name="Play" size={18} className="mr-2" />
            Смотреть
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{title}</h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Эпизод {watchProgress}/{episodes}</span>
          {rating && (
            <div className="flex items-center gap-1">
              <Icon name="Star" size={14} className="fill-accent text-accent" />
              <span>{rating}</span>
            </div>
          )}
        </div>

        <Progress value={progressPercentage} className="h-1" />
      </CardContent>
    </Card>
  );
}