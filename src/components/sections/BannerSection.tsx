import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
}

const BANNERS_API = 'https://functions.poehali.dev/74bb9374-2de8-495b-ba12-4a8d593566b5';

export default function BannerSection() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch(`${BANNERS_API}?action=get_banners`);
      const data = await response.json();
      const activeBanners = (data.banners || []).filter((b: Banner) => b.is_active);
      setBanners(activeBanners);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  if (isLoading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handleBannerClick = () => {
    if (currentBanner.link_url) {
      window.open(currentBanner.link_url, '_blank');
    }
  };

  return (
    <div className="relative w-full h-32 md:h-48 rounded-xl overflow-hidden group mb-8">
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${
          currentBanner.link_url ? 'cursor-pointer' : ''
        }`}
        style={{ backgroundImage: `url(${currentBanner.image_url})` }}
        onClick={handleBannerClick}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <h3 className="text-white text-lg md:text-2xl font-bold drop-shadow-lg">
            {currentBanner.title}
          </h3>
          
          {currentBanner.link_url && (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <span className="text-sm font-medium">Подробнее</span>
              <Icon name="ArrowRight" size={16} />
            </button>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon name="ChevronRight" size={20} className="text-white" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
