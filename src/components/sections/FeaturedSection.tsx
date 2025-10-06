import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Anime {
  id: string;
  title: string;
  image: string;
  episodes: number;
  rating: number;
  currentEpisode?: number;
}

interface FeaturedSectionProps {
  featuredAnime: Anime[];
  onWatch: (anime: Anime) => void;
}

export default function FeaturedSection({ featuredAnime, onWatch }: FeaturedSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-lg">
      <div className="gradient-red-dark p-12 cloud-pattern">
        <Carousel className="w-full">
          <CarouselContent>
            {featuredAnime.map((anime) => (
              <CarouselItem key={anime.id}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <img
                    src={anime.image}
                    alt={anime.title}
                    className="w-64 h-96 object-cover rounded-lg shadow-2xl"
                  />
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 text-accent">
                      <span className="text-2xl">🌸</span>
                      <span className="text-sm font-medium">Рекомендуем</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-shadow-glow">
                      {anime.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-accent">⭐</span>
                        <span className="font-semibold">{anime.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{anime.episodes} эпизодов</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-white/10 rounded">4K</span>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                      Погрузитесь в захватывающий мир аниме в качестве 4K. 
                      Без рекламы, с автоматическим сохранением прогресса.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => onWatch(anime)}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
                      >
                        ▶️ Смотреть сейчас
                      </button>
                      <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-all">
                        📋 Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </div>
    </section>
  );
}
