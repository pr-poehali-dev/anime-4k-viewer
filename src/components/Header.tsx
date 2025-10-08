import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface HeaderProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  onSearch: (query: string) => void;
  onAdminClick?: () => void;
  onAuthClick?: () => void;
  onAdvancedAdminClick?: () => void;
  onChatClick?: () => void;
  onAnimeManagerClick?: () => void;
  currentUser?: any | null;
  onLogout?: () => void;
}

export default function Header({ currentSection, onSectionChange, onSearch, onAdminClick, onAuthClick, onAdvancedAdminClick, onChatClick, onAnimeManagerClick, currentUser, onLogout }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    onSectionChange('search');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 wave-pattern">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onSectionChange('home')}>
            <span className="font-bold text-2xl gradient-japan bg-clip-text text-transparent text-shadow-crimson japanese-text transition-all group-hover:scale-105">
              DokiDokiHub
            </span>
            <span className="text-xl">🌸</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onSectionChange('home')}
              className={`text-sm font-medium transition-all hover:text-primary japanese-text relative group ${
                currentSection === 'home' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Главная
              {currentSection === 'home' && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-japan rounded-full"></span>}
            </button>
            <button
              onClick={() => onSectionChange('catalog')}
              className={`text-sm font-medium transition-all hover:text-primary japanese-text relative group ${
                currentSection === 'catalog' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Каталог
              {currentSection === 'catalog' && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-japan rounded-full"></span>}
            </button>
            <button
              onClick={() => onSectionChange('favorites')}
              className={`text-sm font-medium transition-all hover:text-primary japanese-text relative group ${
                currentSection === 'favorites' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Избранное
              {currentSection === 'favorites' && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-japan rounded-full"></span>}
            </button>
            <button
              onClick={() => onSectionChange('history')}
              className={`text-sm font-medium transition-all hover:text-primary japanese-text relative group ${
                currentSection === 'history' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              История
              {currentSection === 'history' && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-japan rounded-full"></span>}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
          </Button>
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="search"
              placeholder="Поиск аниме..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-muted/50"
            />
          </form>

          {currentUser && onChatClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChatClick}
              className="hidden sm:flex items-center gap-2 relative"
            >
              <Icon name="MessageCircle" size={16} />
              Чат
            </Button>
          )}

          {currentUser?.is_admin && onAdvancedAdminClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdvancedAdminClick}
              className="hidden sm:flex items-center gap-2"
            >
              <Icon name="Shield" size={16} />
              Админ-панель
            </Button>
          )}

          {currentUser?.is_admin && onAnimeManagerClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAnimeManagerClick}
              className="hidden sm:flex items-center gap-2"
            >
              <Icon name="Film" size={16} />
              Управление аниме
            </Button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => onSectionChange('profile')}>
                <AvatarImage src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">{currentUser.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <Icon name="LogOut" size={16} />
              </Button>
            </div>
          ) : (
            <Button onClick={onAuthClick} className="gradient-red-dark">
              Войти
            </Button>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container py-4 flex flex-col gap-3">
            <button
              onClick={() => { onSectionChange('home'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                currentSection === 'home' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => { onSectionChange('catalog'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                currentSection === 'catalog' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Каталог
            </button>
            <button
              onClick={() => { onSectionChange('favorites'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                currentSection === 'favorites' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Избранное
            </button>
            <button
              onClick={() => { onSectionChange('history'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                currentSection === 'history' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              История
            </button>

            {currentUser && onChatClick && (
              <button
                onClick={() => { onChatClick(); setMobileMenuOpen(false); }}
                className="text-left px-4 py-2 rounded-lg font-medium transition-colors hover:bg-muted flex items-center gap-2"
              >
                <Icon name="MessageCircle" size={16} />
                Чат
              </button>
            )}

            {currentUser?.is_admin && onAdvancedAdminClick && (
              <button
                onClick={() => { onAdvancedAdminClick(); setMobileMenuOpen(false); }}
                className="text-left px-4 py-2 rounded-lg font-medium transition-colors hover:bg-muted flex items-center gap-2"
              >
                <Icon name="Shield" size={16} />
                Админ-панель
              </button>
            )}

            {currentUser?.is_admin && onAnimeManagerClick && (
              <button
                onClick={() => { onAnimeManagerClick(); setMobileMenuOpen(false); }}
                className="text-left px-4 py-2 rounded-lg font-medium transition-colors hover:bg-muted flex items-center gap-2"
              >
                <Icon name="Film" size={16} />
                Управление аниме
              </button>
            )}

            <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="px-4 py-2">
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="search"
                  placeholder="Поиск аниме..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </div>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}