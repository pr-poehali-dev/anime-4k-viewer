interface User {
  username: string;
  email?: string;
  avatar_url?: string;
  provider: string;
  is_admin?: boolean;
}

interface ProfileSectionProps {
  currentUser: User;
}

export default function ProfileSection({ currentUser }: ProfileSectionProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <span>👤</span>
        Профиль
      </h1>
      <div className="bg-card p-8 rounded-lg border border-border">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.username} className="w-full h-full object-cover" />
            ) : (
              currentUser.username[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{currentUser.username}</h2>
            <p className="text-muted-foreground">{currentUser.email || `Авторизация через ${currentUser.provider}`}</p>
            {currentUser.is_admin && (
              <span className="inline-block mt-2 px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                Администратор
              </span>
            )}
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
  );
}
