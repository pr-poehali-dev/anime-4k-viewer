import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AnimeCard from '@/components/AnimeCard';
import VideoPlayer from '@/components/VideoPlayer';
import AdminPanel from '@/components/AdminPanel';
import AnimeDetails from '@/components/AnimeDetails';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const API_URL = 'https://functions.poehali.dev/74bb9374-2de8-495b-ba12-4a8d593566b5';

const MOCK_ANIME = [
  {
    id: '1',
    title: 'Клинок, рассекающий демонов',
    image: 'https://v3.fal.media/files/elephant/BxjwjJ5vE7iof0eAaRl6o_output.png',
    episodes: 26,
    currentEpisode: 12,
    rating: 9.2
  },
  {
    id: '2',
    title: 'Моя геройская академия',
    image: 'https://picsum.photos/seed/anime2/400/600',
    episodes: 25,
    currentEpisode: 5,
    rating: 8.8
  },
  {
    id: '3',
    title: 'Атака титанов',
    image: 'https://picsum.photos/seed/anime3/400/600',
    episodes: 24,
    currentEpisode: 18,
    rating: 9.5
  },
  {
    id: '4',
    title: 'Магическая битва',
    image: 'https://picsum.photos/seed/anime4/400/600',
    episodes: 24,
    currentEpisode: 0,
    rating: 9.0
  },
  {
    id: '5',
    title: 'Токийский гуль',
    image: 'https://picsum.photos/seed/anime5/400/600',
    episodes: 12,
    currentEpisode: 12,
    rating: 8.5
  },
  {
    id: '6',
    title: 'Ванпанчмен',
    image: 'https://picsum.photos/seed/anime6/400/600',
    episodes: 12,
    currentEpisode: 3,
    rating: 8.9
  },
  {
    id: '7',
    title: 'Тетрадь смерти',
    image: 'https://picsum.photos/seed/anime7/400/600',
    episodes: 37,
    currentEpisode: 20,
    rating: 9.3
  },
  {
    id: '8',
    title: 'Стальной алхимик',
    image: 'https://picsum.photos/seed/anime8/400/600',
    episodes: 64,
    currentEpisode: 0,
    rating: 9.6
  }
];

export default function Index() {
  const [currentSection, setCurrentSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchingAnime, setWatchingAnime] = useState<{id: string; title: string; episode: number; episodes: number} | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnime();
  }, []);

  const fetchAnime = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setAnimeList(data.anime || []);
    } catch (error) {
      console.error('Failed to fetch anime:', error);
      setAnimeList(MOCK_ANIME);
    } finally {
      setIsLoading(false);
    }
  };

  const displayAnime = animeList.length > 0 ? animeList : MOCK_ANIME;
  const featuredAnime = displayAnime.slice(0, 3);
  const popularAnime = displayAnime;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleWatch = (anime: typeof MOCK_ANIME[0]) => {
    const savedProgress = localStorage.getItem(`progress-${anime.id}`);
    const startEpisode = savedProgress ? parseInt(savedProgress) : anime.currentEpisode || 1;
    setWatchingAnime({
      id: anime.id,
      title: anime.title,
      episode: startEpisode,
      episodes: anime.episodes
    });
  };

  const handleEpisodeChange = (episode: number) => {
    if (watchingAnime) {
      setWatchingAnime({ ...watchingAnime, episode });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onSearch={handleSearch}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      <main className="container py-8">
        {currentSection === 'home' && (
          <div className="space-y-12">
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
                                onClick={() => handleWatch(anime)}
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

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>🔥</span>
                  Популярное сейчас
                </h2>
                <button
                  onClick={() => setCurrentSection('catalog')}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Смотреть всё →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {popularAnime.map((anime) => (
                  <AnimeCard 
                    key={anime.id} 
                    {...anime} 
                    onWatch={() => handleWatch(anime)}
                    onDetails={() => setSelectedAnime(anime)}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>⏱️</span>
                  Продолжить просмотр
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {popularAnime.filter(a => a.currentEpisode > 0 && a.currentEpisode < a.episodes).map((anime) => (
                  <AnimeCard key={anime.id} {...anime} onWatch={() => handleWatch(anime)} onDetails={() => setSelectedAnime(anime)} />
                ))}
              </div>
            </section>
          </div>
        )}

        {currentSection === 'catalog' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Каталог аниме</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {popularAnime.map((anime) => (
                <AnimeCard key={anime.id} {...anime} onWatch={() => handleWatch(anime)} onDetails={() => setSelectedAnime(anime)} />
              ))}
            </div>
          </div>
        )}

        {currentSection === 'favorites' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span>❤️</span>
              Избранное
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {popularAnime.slice(0, 3).map((anime) => (
                <AnimeCard key={anime.id} {...anime} onWatch={() => handleWatch(anime)} onDetails={() => setSelectedAnime(anime)} />
              ))}
            </div>
          </div>
        )}

        {currentSection === 'history' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span>📜</span>
              История просмотров
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {popularAnime.filter(a => a.currentEpisode > 0).map((anime) => (
                <AnimeCard key={anime.id} {...anime} onWatch={() => handleWatch(anime)} onDetails={() => setSelectedAnime(anime)} />
              ))}
            </div>
          </div>
        )}

        {currentSection === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span>👤</span>
              Профиль
            </h1>
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl">
                  🎭
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Пользователь</h2>
                  <p className="text-muted-foreground">user@anime4k.com</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Просмотрено серий</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Избранных аниме</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Часов просмотра</span>
                  <span className="font-semibold">78 ч</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSection === 'search' && searchQuery && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">
              Результаты поиска: "{searchQuery}"
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {popularAnime.slice(0, 4).map((anime) => (
                <AnimeCard key={anime.id} {...anime} onWatch={() => handleWatch(anime)} onDetails={() => setSelectedAnime(anime)} />
              ))}
            </div>
          </div>
        )}
      </main>

      {watchingAnime && (
        <VideoPlayer
          animeId={watchingAnime.id}
          animeTitle={watchingAnime.title}
          episode={watchingAnime.episode}
          totalEpisodes={watchingAnime.episodes}
          onEpisodeChange={handleEpisodeChange}
          onClose={() => setWatchingAnime(null)}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onAnimeAdded={fetchAnime}
        />
      )}

      {selectedAnime && (
        <AnimeDetails
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onWatch={() => {
            handleWatch(selectedAnime);
            setSelectedAnime(null);
          }}
        />
      )}

      <footer className="border-t border-border mt-16">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💖</span>
              <span className="font-bold text-xl">DokiDokiHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 DokiDokiHub. Дивіться аніме в 4K без реклами
            </p>
            <div className="flex items-center gap-4">
              <span>🌸</span>
              <span>🎌</span>
              <span>💕</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}