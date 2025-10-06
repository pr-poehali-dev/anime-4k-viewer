interface CatalogFiltersProps {
  selectedGenre: string;
  selectedYear: string;
  allGenres: string[];
  allYears: number[];
  onGenreChange: (genre: string) => void;
  onYearChange: (year: string) => void;
  onResetFilters: () => void;
}

export default function CatalogFilters({
  selectedGenre,
  selectedYear,
  allGenres,
  allYears,
  onGenreChange,
  onYearChange,
  onResetFilters
}: CatalogFiltersProps) {
  const hasActiveFilters = selectedGenre !== 'all' || selectedYear !== 'all';

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Жанр:</span>
        <select
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Все жанры</option>
          {allGenres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Год:</span>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Все годы</option>
          {allYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className="px-3 py-2 text-sm text-primary hover:text-primary/80 border border-primary rounded-md"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
