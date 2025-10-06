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
  currentUser?: any | null;
  onLogout?: () => void;
}

export default function Header({ currentSection, onSectionChange, onSearch, onAdminClick, onAuthClick, onAdvancedAdminClick, currentUser, onLogout }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    onSectionChange('search');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSectionChange('home')}>
            <span className="text-2xl">💖</span>
            <span className="font-bold text-xl gradient-red-dark bg-clip-text text-transparent">DokiDokiHub</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onSectionChange('home')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                currentSection === 'home' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => onSectionChange('catalog')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                currentSection === 'catalog' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Каталог
            </button>
            <button
              onClick={() => onSectionChange('favorites')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                currentSection === 'favorites' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Избранное
            </button>
            <button
              onClick={() => onSectionChange('history')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                currentSection === 'history' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              История
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
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

          {onAdminClick && !currentUser?.is_admin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdminClick}
              className="hidden sm:flex items-center gap-2"
            >
              <Icon name="Settings" size={16} />
              Адмін
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

          {currentUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="cursor-pointer" onClick={() => onSectionChange('profile')}>
                <AvatarImage src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} />
                <AvatarFallback>{currentUser.username[0]?.toUpperCase()}</AvatarFallback>
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
    </header>
  );
}