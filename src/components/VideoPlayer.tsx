import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';

interface VideoPlayerProps {
  animeId: string;
  animeTitle: string;
  episode: number;
  totalEpisodes: number;
  videoUrl?: string;
  onEpisodeChange: (episode: number) => void;
  onClose: () => void;
}

export default function VideoPlayer({
  animeId,
  animeTitle,
  episode,
  totalEpisodes,
  videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  onEpisodeChange,
  onClose
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('4K');
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        if (progress > 90) {
          localStorage.setItem(`progress-${animeId}`, episode.toString());
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [animeId, episode, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleNextEpisode = () => {
    if (episode < totalEpisodes) {
      onEpisodeChange(episode + 1);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  const handlePrevEpisode = () => {
    if (episode > 1) {
      onEpisodeChange(episode - 1);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full w-full" onMouseMove={handleMouseMove}>
        <video
          ref={videoRef}
          className="h-full w-full"
          src={videoUrl}
          onClick={togglePlay}
        />

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{animeTitle}</h2>
              <p className="text-muted-foreground">Эпизод {episode} из {totalEpisodes}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur rounded-full">
                <span className="text-accent">⚡</span>
                <span className="text-sm font-semibold">{quality}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-white/10"
              >
                <Icon name="X" size={24} />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm min-w-[45px]">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-sm min-w-[45px]">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevEpisode}
                  disabled={episode === 1}
                  className="hover:bg-white/10"
                >
                  <Icon name="SkipBack" size={20} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="hover:bg-white/10 h-12 w-12"
                >
                  <Icon name={isPlaying ? 'Pause' : 'Play'} size={28} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextEpisode}
                  disabled={episode === totalEpisodes}
                  className="hover:bg-white/10"
                >
                  <Icon name="SkipForward" size={20} />
                </Button>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="hover:bg-white/10"
                  >
                    <Icon name={isMuted ? 'VolumeX' : 'Volume2'} size={20} />
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="hover:bg-white/10"
                >
                  <Icon name={isFullscreen ? 'Minimize' : 'Maximize'} size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="h-20 w-20 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Icon name="Play" size={40} className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
