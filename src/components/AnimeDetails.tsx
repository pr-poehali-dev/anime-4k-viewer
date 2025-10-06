import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const RATINGS_API = 'https://functions.poehali.dev/c2e7eea7-7957-4890-82b2-9f9847047258';
const COMMENTS_API = 'https://functions.poehali.dev/ae1e28b5-a6a1-4f50-93cd-1a9f6c034855';

interface AnimeDetailsProps {
  anime: {
    id: string;
    title: string;
    image: string;
    episodes: number;
    rating?: number;
    description?: string;
    genres?: string[];
  };
  onClose: () => void;
  onWatch: () => void;
}

export default function AnimeDetails({ anime, onClose, onWatch }: AnimeDetailsProps) {
  const { toast } = useToast();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(anime.rating || 0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = localStorage.getItem('userId') || `user-${Date.now()}`;
  const userName = localStorage.getItem('userName') || 'Аноним';

  useEffect(() => {
    localStorage.setItem('userId', userId);
    if (!localStorage.getItem('userName')) {
      localStorage.setItem('userName', userName);
    }
    fetchRatings();
    fetchComments();
  }, [anime.id]);

  const fetchRatings = async () => {
    try {
      const response = await fetch(`${RATINGS_API}?anime_id=${anime.id}`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      setAverageRating(data.average_rating || 0);
      setTotalRatings(data.total_ratings || 0);
      setUserRating(data.user_rating || 0);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${COMMENTS_API}?anime_id=${anime.id}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      const response = await fetch(RATINGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ anime_id: anime.id, rating })
      });

      if (response.ok) {
        const data = await response.json();
        setUserRating(rating);
        setAverageRating(data.average_rating);
        setTotalRatings(data.total_ratings);
        toast({ title: 'Дякую за оцінку!' });
      }
    } catch (error) {
      toast({ title: 'Помилка', description: 'Не вдалося зберегти оцінку', variant: 'destructive' });
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(COMMENTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-User-Name': userName
        },
        body: JSON.stringify({ anime_id: anime.id, text: newComment })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
        toast({ title: 'Коментар додано!' });
      }
    } catch (error) {
      toast({ title: 'Помилка', description: 'Не вдалося додати коментар', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="container max-w-6xl py-8">
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={24} />
              </Button>
            </div>

            <div className="grid md:grid-cols-[300px,1fr] gap-8">
              <div>
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="w-full rounded-lg shadow-xl"
                />
                <Button onClick={onWatch} className="w-full mt-4 gradient-red-dark">
                  <Icon name="Play" size={20} className="mr-2" />
                  Дивитися
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{anime.title}</h1>
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {anime.genres.map((genre, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground">{anime.description || 'Опис відсутній'}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span>📺 {anime.episodes} епізодів</span>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>⭐</span>
                    Ваша оцінка
                  </h3>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRating(rating)}
                          onMouseEnter={() => setHoverRating(rating)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Icon
                            name="Star"
                            size={24}
                            className={
                              rating <= (hoverRating || userRating)
                                ? 'fill-accent text-accent'
                                : 'text-muted'
                            }
                          />
                        </button>
                      ))}
                    </div>
                    {userRating > 0 && (
                      <span className="text-sm text-muted-foreground">Ви оцінили: {userRating}/10</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Середня оцінка: <span className="font-semibold text-foreground">{averageRating.toFixed(1)}/10</span> ({totalRatings} {totalRatings === 1 ? 'оцінка' : 'оцінок'})
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span>💬</span>
                    Коментарі ({comments.length})
                  </h3>

                  <div className="space-y-2 mb-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Напишіть свій коментар..."
                      rows={3}
                      maxLength={1000}
                      className="resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {newComment.length}/1000
                      </span>
                      <Button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || isSubmitting}
                        size="sm"
                      >
                        {isSubmitting ? 'Відправка...' : 'Відправити'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Поки що немає коментарів. Будьте першим!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <Card key={comment.id} className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {comment.user_name[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{comment.user_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.text}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
