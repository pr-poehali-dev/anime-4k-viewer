export interface Anime {
  id: number;
  title: string;
  image_url: string;
  episodes: number;
  rating: number;
  description: string;
  genres: string[];
  release_year: number;
  status: string;
  video_quality_4k?: string;
  video_quality_1080p?: string;
  video_quality_720p?: string;
  video_quality_480p?: string;
  anime_type: string;
  duration_minutes?: number;
  is_movie: boolean;
}

export interface AnimeFormData {
  title: string;
  image_url: string;
  episodes: number;
  rating: number;
  description: string;
  genres: string;
  release_year: number;
  status: string;
  video_quality_4k: string;
  video_quality_1080p: string;
  video_quality_720p: string;
  video_quality_480p: string;
  anime_type: string;
  duration_minutes: number;
  is_movie: boolean;
}
