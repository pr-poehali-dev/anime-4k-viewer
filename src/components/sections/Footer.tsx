export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💖</span>
            <span className="font-bold text-xl">DokiDokiHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 DokiDokiHub. Смотрите аниме в 4K без рекламы
          </p>
          <div className="flex items-center gap-4">
            <span>🌸</span>
            <span>🎌</span>
            <span>💕</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
