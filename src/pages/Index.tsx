import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/99a75547-f418-4f5a-984f-af76b558d3eb";

interface Track {
  id: number;
  title: string;
  artist: string;
  artist_picture: string;
  album: string;
  cover: string;
  cover_xl: string;
  preview: string;
  duration: number;
  rank: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayingBars() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] bg-[var(--stripe-yellow)] rounded-sm origin-bottom"
          style={{
            height: "100%",
            animation: `playingBar ${0.6 + i * 0.15}s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

const moods = [
  { label: "Поп", query: "pop hits", emoji: "✨" },
  { label: "Хип-хоп", query: "hip hop", emoji: "🎤" },
  { label: "Рок", query: "rock", emoji: "🎸" },
  { label: "Электронная", query: "electronic", emoji: "🎛️" },
  { label: "Lo-Fi", query: "lofi chill", emoji: "🌙" },
  { label: "Джаз", query: "jazz", emoji: "🎷" },
];

export default function Index() {
  const [tab, setTab] = useState<"home" | "search" | "player" | "profile">("home");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chart on mount
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => { setChartTracks(data.tracks || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Audio player logic
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const playTrack = useCallback((track: Track) => {
    const audio = audioRef.current!;
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play(); setIsPlaying(true); }
      return;
    }
    audio.src = track.preview;
    audio.load();
    audio.play().catch(() => {});
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setTab("player");
  }, [currentTrack, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current!;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const skipTrack = (direction: 1 | -1) => {
    const list = searchResults.length > 0 ? searchResults : chartTracks;
    if (!currentTrack || list.length === 0) return;
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    const next = list[idx + direction];
    if (next) playTrack(next);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current!;
    if (!audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  const changeVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current!;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.volume = pct;
    setVolume(pct);
  };

  // Search with debounce
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(() => {
      setSearchLoading(true);
      fetch(`${API_URL}?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data.tracks || []))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 500);
  };

  const searchMood = (query: string) => {
    setSearchQuery(query);
    setTab("search");
    setSearchLoading(true);
    fetch(`${API_URL}?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => setSearchResults(data.tracks || []))
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  };

  const toggleLike = (id: number) => {
    setLiked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const displayTracks = searchQuery ? searchResults : chartTracks;
  const likedTracks = chartTracks.filter((t) => liked.includes(t.id));

  return (
    <div className="min-h-screen bg-[var(--night)] font-golos text-[var(--stripe-white)] flex flex-col max-w-md mx-auto relative">

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--stripe-yellow)] opacity-5 blur-[80px] pointer-events-none z-0" />

      {/* ===== HOME ===== */}
      {tab === "home" && (
        <div className="flex-1 overflow-y-auto pb-36 animate-fade-in">
          <div className="px-5 pt-12 pb-6">
            <p className="text-[var(--text-dim)] text-sm font-display tracking-widest uppercase">Доброй ночи</p>
            <h1 className="font-oswald text-4xl font-semibold mt-1 tracking-tight">NOCTURN</h1>
            <div className="road-line mt-4 w-16" />
          </div>

          {/* Now playing mini */}
          {currentTrack && isPlaying && (
            <button
              onClick={() => setTab("player")}
              className="mx-5 mb-6 w-[calc(100%-40px)] card-night p-4 flex items-center gap-3"
              style={{ borderColor: "rgba(245,197,24,0.3)" }}
            >
              <img src={currentTrack.cover} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold leading-tight truncate">{currentTrack.title}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">{currentTrack.artist}</p>
              </div>
              <PlayingBars />
            </button>
          )}

          {/* Moods / Genres */}
          <div className="mb-8">
            <div className="px-5 mb-4">
              <h3 className="font-oswald text-lg font-medium tracking-wide uppercase">Жанры</h3>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => searchMood(m.query)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[var(--asphalt)] hover:border-[rgba(245,197,24,0.3)] transition-all"
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs text-[var(--text-mid)] whitespace-nowrap">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="px-5">
            <h3 className="font-oswald text-lg font-medium tracking-wide uppercase mb-4">
              {loading ? "Загружаю..." : "Чарт Deezer"}
            </h3>
            {loading && (
              <div className="flex flex-col gap-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--asphalt-mid)] animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 bg-[var(--asphalt-mid)] rounded animate-pulse mb-2 w-3/4" />
                      <div className="h-2 bg-[var(--asphalt-mid)] rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {chartTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--asphalt)] transition-colors cursor-pointer group"
                  onClick={() => playTrack(track)}
                >
                  <span className="text-xs text-[var(--text-dim)] w-5 text-right flex-shrink-0">{idx + 1}</span>
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <img src={track.cover} className="w-full h-full rounded-lg object-cover" />
                    {currentTrack?.id === track.id && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <PlayingBars />
                      </div>
                    )}
                    {!(currentTrack?.id === track.id && isPlaying) && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="Play" size={16} className="text-white ml-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? "text-[var(--stripe-yellow)]" : ""}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-[var(--text-dim)] truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-dim)]">{formatTime(track.duration)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Icon name="Heart" size={14} className={liked.includes(track.id) ? "text-[var(--stripe-yellow)]" : "text-[var(--text-dim)]"} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SEARCH ===== */}
      {tab === "search" && (
        <div className="flex-1 overflow-y-auto pb-36 animate-fade-in">
          <div className="px-5 pt-12 pb-6">
            <h1 className="font-oswald text-3xl font-medium tracking-wide uppercase mb-4">Поиск</h1>
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Трек, исполнитель, жанр..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="w-full bg-[var(--asphalt)] border border-[rgba(255,255,255,0.07)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--stripe-white)] placeholder-[var(--text-dim)] outline-none focus:border-[rgba(245,197,24,0.4)] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <Icon name="X" size={14} className="text-[var(--text-dim)]" />
                </button>
              )}
            </div>
          </div>

          {/* Жанры в поиске */}
          {!searchQuery && (
            <div className="px-5 mb-6">
              <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest mb-3 font-display">Быстрый выбор</p>
              <div className="flex gap-2 flex-wrap">
                {moods.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => handleSearch(m.query)}
                    className="px-4 py-1.5 rounded-full text-sm border border-[rgba(255,255,255,0.1)] text-[var(--text-mid)] hover:border-[rgba(245,197,24,0.3)] transition-all"
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-5">
            {searchLoading && (
              <div className="flex flex-col gap-3 mt-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--asphalt-mid)] animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 bg-[var(--asphalt-mid)] rounded animate-pulse mb-2 w-3/4" />
                      <div className="h-2 bg-[var(--asphalt-mid)] rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchLoading && displayTracks.length > 0 && (
              <>
                <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest mb-4 font-display">
                  {searchQuery ? `${displayTracks.length} результатов` : "Чарт"}
                </p>
                <div className="flex flex-col gap-1">
                  {displayTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--asphalt)] transition-colors cursor-pointer group"
                      onClick={() => playTrack(track)}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img src={track.cover} className="w-full h-full rounded-lg object-cover" />
                        {currentTrack?.id === track.id && isPlaying && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <PlayingBars />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? "text-[var(--stripe-yellow)]" : ""}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-[var(--text-dim)] truncate">{track.artist} · {track.album}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-dim)]">{formatTime(track.duration)}</span>
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} className="p-1">
                          <Icon name="Heart" size={14} className={liked.includes(track.id) ? "text-[var(--stripe-yellow)]" : "text-[var(--text-dim)]"} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!searchLoading && searchQuery && displayTracks.length === 0 && (
              <div className="text-center py-16">
                <p className="text-[var(--text-dim)] text-sm">Ничего не найдено</p>
                <p className="text-[var(--text-dim)] text-xs mt-1">Попробуй другой запрос</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PLAYER ===== */}
      {tab === "player" && (
        <div className="flex-1 overflow-y-auto pb-24 animate-fade-in">
          {currentTrack && (
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
              <img src={currentTrack.cover_xl || currentTrack.cover} className="w-full h-full object-cover opacity-10 blur-3xl scale-110" />
              <div className="absolute inset-0 bg-[var(--night)]/80" />
            </div>
          )}

          <div className="relative z-10 px-6 pt-12 pb-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-8">
              <button onClick={() => setTab("home")}>
                <Icon name="ChevronDown" size={24} className="text-[var(--text-mid)]" />
              </button>
              <span className="text-xs font-display tracking-widest uppercase text-[var(--text-dim)]">Сейчас играет</span>
              <button onClick={() => currentTrack && toggleLike(currentTrack.id)}>
                <Icon
                  name="Heart"
                  size={22}
                  className={currentTrack && liked.includes(currentTrack.id) ? "text-[var(--stripe-yellow)]" : "text-[var(--text-dim)]"}
                />
              </button>
            </div>

            {currentTrack ? (
              <>
                {/* Vinyl */}
                <div className="relative mb-10">
                  <div
                    className={`w-64 h-64 rounded-full overflow-hidden border-4 transition-colors duration-500 ${isPlaying ? "border-[var(--stripe-yellow)]" : "border-[rgba(255,255,255,0.1)]"}`}
                    style={{ boxShadow: isPlaying ? "0 0 60px rgba(245,197,24,0.2), 0 0 120px rgba(245,197,24,0.08)" : "none" }}
                  >
                    <img
                      src={currentTrack.cover_xl || currentTrack.cover}
                      className={`w-full h-full object-cover ${isPlaying ? "vinyl-spin" : "vinyl-spin paused"}`}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-[var(--night)] border-2 border-[rgba(255,255,255,0.1)]" />
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mb-8 w-full">
                  <h2 className="font-oswald text-3xl font-medium tracking-wide">{currentTrack.title}</h2>
                  <p className="text-[var(--text-dim)] mt-1">{currentTrack.artist}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">{currentTrack.album}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full border border-[rgba(245,197,24,0.3)] text-[var(--stripe-yellow)] text-xs font-display tracking-wider">
                    30 сек превью
                  </span>
                </div>

                {/* Progress */}
                <div className="w-full mb-6">
                  <div
                    className="progress-track w-full h-1.5 mb-2 cursor-pointer"
                    onClick={seekTo}
                  >
                    <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--text-dim)]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(currentTrack.duration > 30 ? 30 : currentTrack.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between w-full max-w-xs mb-8">
                  <button className="text-[var(--text-dim)] hover:text-white transition-colors p-2">
                    <Icon name="Shuffle" size={20} />
                  </button>
                  <button className="text-[var(--text-mid)] hover:text-white transition-colors p-2" onClick={() => skipTrack(-1)}>
                    <Icon name="SkipBack" size={28} />
                  </button>
                  <button
                    className="w-16 h-16 rounded-full bg-[var(--stripe-yellow)] flex items-center justify-center transition-transform active:scale-95"
                    style={{ boxShadow: "0 0 30px rgba(245,197,24,0.4)" }}
                    onClick={togglePlay}
                  >
                    <Icon name={isPlaying ? "Pause" : "Play"} size={26} className="text-black ml-0.5" />
                  </button>
                  <button className="text-[var(--text-mid)] hover:text-white transition-colors p-2" onClick={() => skipTrack(1)}>
                    <Icon name="SkipForward" size={28} />
                  </button>
                  <button className="text-[var(--text-dim)] hover:text-white transition-colors p-2">
                    <Icon name="Repeat" size={20} />
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <Icon name="Volume1" size={16} className="text-[var(--text-dim)]" />
                  <div className="flex-1 progress-track h-1 cursor-pointer" onClick={changeVolume}>
                    <div className="progress-fill h-full" style={{ width: `${volume * 100}%` }} />
                  </div>
                  <Icon name="Volume2" size={16} className="text-[var(--text-dim)]" />
                </div>
              </>
            ) : (
              <div className="text-center mt-32">
                <Icon name="Disc3" size={64} className="text-[var(--text-dim)] mx-auto mb-4" />
                <p className="text-[var(--text-dim)]">Выбери трек для воспроизведения</p>
                <button
                  onClick={() => setTab("home")}
                  className="mt-6 px-6 py-2 rounded-full bg-[var(--stripe-yellow)] text-black text-sm font-semibold"
                >
                  Открыть чарт
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PROFILE ===== */}
      {tab === "profile" && (
        <div className="flex-1 overflow-y-auto pb-36 animate-fade-in">
          <div className="px-5 pt-12 pb-6">
            <div className="flex items-end gap-4 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[var(--asphalt-mid)] border-2 border-[rgba(245,197,24,0.4)] flex items-center justify-center">
                  <Icon name="User" size={32} className="text-[var(--text-mid)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--stripe-yellow)] flex items-center justify-center">
                  <Icon name="Music" size={10} className="text-black" />
                </div>
              </div>
              <div>
                <h2 className="font-oswald text-2xl font-medium">Слушатель</h2>
                <p className="text-[var(--text-dim)] text-sm">@nocturn_user</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Понравилось", value: liked.length.toString() },
                { label: "Прослушано", value: chartTracks.length > 0 ? "∞" : "0" },
                { label: "Жанров", value: moods.length.toString() },
              ].map((s) => (
                <div key={s.label} className="card-night p-4 text-center">
                  <p className="font-oswald text-2xl font-semibold text-[var(--stripe-yellow)]">{s.value}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="road-line mb-8" />

            <div className="mb-8">
              <h3 className="font-oswald text-lg uppercase tracking-wide mb-4">Любимые треки</h3>
              {likedTracks.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-dim)]">
                  <Icon name="Heart" size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Нет понравившихся треков</p>
                  <p className="text-xs mt-1">Нажми ♥ рядом с треком</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {likedTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--asphalt)] cursor-pointer"
                      onClick={() => playTrack(track)}
                    >
                      <img src={track.cover} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-[var(--text-dim)] truncate">{track.artist}</p>
                      </div>
                      <Icon name="Heart" size={14} className="text-[var(--stripe-yellow)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 className="font-oswald text-lg uppercase tracking-wide mb-4">Настройки</h3>
            <div className="flex flex-col gap-1">
              {[
                { icon: "Bell", label: "Уведомления" },
                { icon: "Download", label: "Загрузки" },
                { icon: "Shield", label: "Конфиденциальность" },
                { icon: "HelpCircle", label: "Поддержка" },
              ].map((item) => (
                <button key={item.label} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--asphalt)] transition-colors text-left group">
                  <div className="w-9 h-9 rounded-full bg-[var(--asphalt-mid)] flex items-center justify-center">
                    <Icon name={item.icon} fallback="Settings" size={16} className="text-[var(--text-mid)]" />
                  </div>
                  <span className="text-sm flex-1">{item.label}</span>
                  <Icon name="ChevronRight" size={16} className="text-[var(--text-dim)] group-hover:text-[var(--text-mid)] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MINI PLAYER ===== */}
      {tab !== "player" && currentTrack && (
        <div
          className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-sm z-40 cursor-pointer"
          onClick={() => setTab("player")}
        >
          <div
            className="rounded-2xl p-3 flex items-center gap-3"
            style={{
              background: "rgba(26,26,26,0.97)",
              border: "1px solid rgba(245,197,24,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)"
            }}
          >
            <img src={currentTrack.cover} className="w-10 h-10 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.title}</p>
              <p className="text-xs text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
            </div>
            {/* Mini progress */}
            <div className="w-16 h-0.5 bg-[var(--asphalt-mid)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--stripe-yellow)] rounded-full" style={{ width: `${progress}%` }} />
            </div>
            {isPlaying && <PlayingBars />}
            <button
              className="w-9 h-9 rounded-full bg-[var(--stripe-yellow)] flex items-center justify-center ml-1 flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              <Icon name={isPlaying ? "Pause" : "Play"} size={14} className="text-black ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAV ===== */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 pb-4 pt-2"
        style={{ background: "linear-gradient(to top, var(--night) 70%, transparent)" }}
      >
        <div
          className="rounded-2xl flex items-center justify-around py-3 px-2"
          style={{
            background: "rgba(17,17,17,0.97)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { id: "home", icon: "Home", label: "Главная" },
            { id: "search", icon: "Search", label: "Поиск" },
            { id: "player", icon: "Disc3", label: "Плеер" },
            { id: "profile", icon: "User", label: "Профиль" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as "home" | "search" | "player" | "profile")}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
                tab === item.id ? "text-[var(--stripe-yellow)]" : "text-[var(--text-dim)] hover:text-[var(--text-mid)]"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={22} />
              <span className="text-[10px] font-display tracking-wide">{item.label}</span>
              {tab === item.id && <div className="w-1 h-1 rounded-full bg-[var(--stripe-yellow)]" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
