import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface HeaderProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  onSearch: (query: string) => void;
}

export default function Header({ currentSection, onSectionChange, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
            <span className="text-2xl">⛩️</span>
            <span className="font-bold text-xl gradient-red-dark bg-clip-text text-transparent">ANIME 4K</span>
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

          {isLoggedIn ? (
            <Avatar className="cursor-pointer" onClick={() => onSectionChange('profile')}>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          ) : (
            <Button onClick={() => setIsLoggedIn(true)} className="gradient-red-dark">
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
