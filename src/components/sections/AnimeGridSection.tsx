import AnimeCard from '@/components/AnimeCard';

interface Anime {
  id: string;
  title: string;
  image: string;
  episodes: number;
  rating: number;
  currentEpisode?: number;
  genres?: string[];
  year?: number;
}

interface AnimeGridSectionProps {
  title: string;
  icon: string;
  animeList: Anime[];
  onWatch: (anime: Anime) => void;
  onDetails: (anime: Anime) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export default function AnimeGridSection({ 
  title, 
  icon, 
  animeList, 
  onWatch, 
  onDetails,
  showViewAll = false,
  onViewAll
}: AnimeGridSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h2>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Смотреть всё →
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {animeList.map((anime) => (
          <AnimeCard 
            key={anime.id} 
            {...anime} 
            onWatch={() => onWatch(anime)}
            onDetails={() => onDetails(anime)}
          />
        ))}
      </div>
    </section>
  );
}
