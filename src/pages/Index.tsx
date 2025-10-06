import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AnimeCard from '@/components/AnimeCard';
import VideoPlayer from '@/components/VideoPlayer';
import AdminPanel from '@/components/AdminPanel';
import AnimeDetails from '@/components/AnimeDetails';
import AuthModal from '@/components/AuthModal';
import AdvancedAdminPanel from '@/components/AdvancedAdminPanel';
import FeaturedSection from '@/components/sections/FeaturedSection';
import AnimeGridSection from '@/components/sections/AnimeGridSection';
import CatalogFilters from '@/components/sections/CatalogFilters';
import ProfileSection from '@/components/sections/ProfileSection';
import Footer from '@/components/sections/Footer';
import { MOCK_ANIME } from '@/data/mockAnime';

const API_URL = 'https://functions.poehali.dev/74bb9374-2de8-495b-ba12-4a8d593566b5';

export default function Index() {
  const [currentSection, setCurrentSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchingAnime, setWatchingAnime] = useState<{id: string; title: string; episode: number; episodes: number} | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showAdvancedAdmin, setShowAdvancedAdmin] = useState(false);

  useEffect(() => {
    fetchAnime();
    if (authToken) {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/268f16de-69c3-43b0-a1ce-341db3868ec2?action=verify', {
        headers: { 'X-Auth-Token': authToken || '' }
      });
      const data = await response.json();
      if (data.user_id) {
        setCurrentUser(data);
      } else {
        localStorage.removeItem('auth_token');
        setAuthToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  };

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

  const handleAuthSuccess = (token: string, user: any) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('auth_token', token);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('auth_token');
  };

  const displayAnime = animeList.length > 0 ? animeList : MOCK_ANIME;
  
  const allGenres = Array.from(new Set(displayAnime.flatMap(anime => anime.genres || [])));
  const allYears = Array.from(new Set(displayAnime.map(anime => anime.year).filter(Boolean))).sort((a, b) => b - a);
  
  const filteredAnime = displayAnime.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || (anime.genres && anime.genres.includes(selectedGenre));
    const matchesYear = selectedYear === 'all' || anime.year === parseInt(selectedYear);
    return matchesSearch && matchesGenre && matchesYear;
  });
  
  const featuredAnime = displayAnime.slice(0, 3);
  const popularAnime = filteredAnime;

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

  const handleResetFilters = () => {
    setSelectedGenre('all');
    setSelectedYear('all');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onSearch={handleSearch}
        onAuthClick={() => setShowAuthModal(true)}
        onAdvancedAdminClick={() => setShowAdvancedAdmin(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="container py-8">
        {currentSection === 'home' && (
          <div className="space-y-12">
            <FeaturedSection 
              featuredAnime={featuredAnime} 
              onWatch={handleWatch} 
            />

            <AnimeGridSection
              title="Популярное сейчас"
              icon="🔥"
              animeList={popularAnime}
              onWatch={handleWatch}
              onDetails={setSelectedAnime}
              showViewAll={true}
              onViewAll={() => setCurrentSection('catalog')}
            />

            <AnimeGridSection
              title="Продолжить просмотр"
              icon="⏱️"
              animeList={popularAnime.filter(a => a.currentEpisode > 0 && a.currentEpisode < a.episodes)}
              onWatch={handleWatch}
              onDetails={setSelectedAnime}
            />
          </div>
        )}

        {currentSection === 'catalog' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Каталог аниме</h1>
            
            <CatalogFilters
              selectedGenre={selectedGenre}
              selectedYear={selectedYear}
              allGenres={allGenres}
              allYears={allYears}
              onGenreChange={setSelectedGenre}
              onYearChange={setSelectedYear}
              onResetFilters={handleResetFilters}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {popularAnime.length > 0 ? (
                popularAnime.map((anime) => (
                  <AnimeCard key={anime.id} {...anime} onWatch={() => handleWatch(anime)} onDetails={() => setSelectedAnime(anime)} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Не найдено аниме по выбранным фильтрам
                </div>
              )}
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

        {currentSection === 'profile' && currentUser && (
          <ProfileSection currentUser={currentUser} />
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

      {showAdminPanel && currentUser?.is_admin && (
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

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showAdvancedAdmin && currentUser?.is_admin && authToken && (
        <AdvancedAdminPanel
          onClose={() => setShowAdvancedAdmin(false)}
          authToken={authToken}
        />
      )}

      <Footer />
    </div>
  );
}
