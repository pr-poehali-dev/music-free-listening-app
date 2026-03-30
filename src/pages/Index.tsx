import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const COVER_1 = "https://cdn.poehali.dev/projects/8397f80b-8756-4e5a-b6d3-fabe76b919c3/files/5a4ae214-9fd9-4094-b947-5b271c5917f5.jpg";
const COVER_2 = "https://cdn.poehali.dev/projects/8397f80b-8756-4e5a-b6d3-fabe76b919c3/files/0688ada6-75b6-4aeb-a1b0-e8e302a592bd.jpg";
const COVER_3 = "https://cdn.poehali.dev/projects/8397f80b-8756-4e5a-b6d3-fabe76b919c3/files/1b018df8-0f00-4f61-a80d-d42efca99b44.jpg";

const tracks = [
  { id: 1, title: "Полночный асфальт", artist: "Тени Города", genre: "Lo-Fi", duration: "3:42", cover: COVER_1, mood: "Ночь" },
  { id: 2, title: "Дождь на стекле", artist: "Neon Dreams", genre: "Ambient", duration: "4:15", cover: COVER_2, mood: "Меланхолия" },
  { id: 3, title: "Фонарный свет", artist: "Cold Streets", genre: "Indie", duration: "3:28", cover: COVER_3, mood: "Ночь" },
  { id: 4, title: "03:47", artist: "Пустой Перекрёсток", genre: "Lo-Fi", duration: "5:01", cover: COVER_1, mood: "Одиночество" },
  { id: 5, title: "Туман у шоссе", artist: "Тени Города", genre: "Ambient", duration: "4:33", cover: COVER_2, mood: "Меланхолия" },
  { id: 6, title: "Последний автобус", artist: "Night Walks", genre: "Indie", duration: "3:55", cover: COVER_3, mood: "Ночь" },
  { id: 7, title: "Белые полосы", artist: "Cold Streets", genre: "Lo-Fi", duration: "4:08", cover: COVER_1, mood: "Одиночество" },
  { id: 8, title: "Безлюдный проспект", artist: "Neon Dreams", genre: "Ambient", duration: "6:12", cover: COVER_2, mood: "Ночь" },
];

const playlists = [
  { id: 1, name: "Ночные прогулки", count: 24, cover: COVER_1 },
  { id: 2, name: "Дождливый вечер", count: 18, cover: COVER_2 },
  { id: 3, name: "Туман и асфальт", count: 31, cover: COVER_3 },
  { id: 4, name: "Последний рейс", count: 15, cover: COVER_1 },
];

const moods = [
  { label: "Ночь", emoji: "🌑" },
  { label: "Меланхолия", emoji: "🌧️" },
  { label: "Одиночество", emoji: "🛣️" },
  { label: "Туман", emoji: "🌫️" },
];

const genres = ["Lo-Fi", "Ambient", "Indie", "Jazz", "Post-Rock"];

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

export default function Index() {
  const [tab, setTab] = useState<"home" | "search" | "player" | "profile">("home");
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(32);
  const [liked, setLiked] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p >= 100 ? 0 : p + 0.2));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const playTrack = (track: typeof tracks[0]) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setTab("player");
  };

  const toggleLike = (id: number) => {
    setLiked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q);
    const matchGenre = !activeGenre || t.genre === activeGenre;
    const matchMood = !activeMood || t.mood === activeMood;
    return matchSearch && matchGenre && matchMood;
  });

  return (
    <div className="min-h-screen bg-[var(--night)] font-golos text-[var(--stripe-white)] flex flex-col max-w-md mx-auto relative">

      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--stripe-yellow)] opacity-5 blur-[80px] pointer-events-none z-0" />

      {/* ===== HOME ===== */}
      {tab === "home" && (
        <div className="flex-1 overflow-y-auto pb-24 animate-fade-in">
          {/* Header */}
          <div className="px-5 pt-12 pb-6">
            <p className="text-[var(--text-dim)] text-sm font-display tracking-widest uppercase">Доброй ночи</p>
            <h1 className="font-oswald text-4xl font-semibold mt-1 tracking-tight">
              NOCTURN
            </h1>
            <div className="road-line mt-4 w-16" />
          </div>

          {/* Now playing mini */}
          {isPlaying && (
            <button
              onClick={() => setTab("player")}
              className="mx-5 mb-6 w-[calc(100%-40px)] card-night p-4 flex items-center gap-3 border-[var(--stripe-yellow)] border-opacity-30"
              style={{ borderColor: "rgba(245,197,24,0.3)" }}
            >
              <img src={currentTrack.cover} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold leading-tight">{currentTrack.title}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">{currentTrack.artist}</p>
              </div>
              <PlayingBars />
            </button>
          )}

          {/* Featured */}
          <div className="px-5 mb-8">
            <div
              className="relative rounded-2xl overflow-hidden h-52 cursor-pointer group"
              onClick={() => playTrack(tracks[3])}
            >
              <img src={COVER_1} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <span className="text-[var(--stripe-yellow)] text-xs font-display tracking-widest uppercase mb-1 block">Трек дня</span>
                <h2 className="font-oswald text-2xl font-medium leading-tight">03:47</h2>
                <p className="text-[var(--text-mid)] text-sm">Пустой Перекрёсток</p>
              </div>
              <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[var(--stripe-yellow)] flex items-center justify-center">
                <Icon name="Play" size={16} className="text-black ml-0.5" />
              </div>
            </div>
          </div>

          {/* Playlists */}
          <div className="mb-8">
            <div className="px-5 mb-4 flex items-center justify-between">
              <h3 className="font-oswald text-lg font-medium tracking-wide uppercase">Плейлисты</h3>
              <button className="text-[var(--text-dim)] text-xs">Все →</button>
            </div>
            <div className="flex gap-4 px-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {playlists.map((pl) => (
                <div key={pl.id} className="flex-shrink-0 w-36 cursor-pointer group">
                  <div className="relative rounded-xl overflow-hidden aspect-square mb-2">
                    <img src={pl.cover} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/60" />
                  </div>
                  <p className="text-sm font-medium leading-tight">{pl.name}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">{pl.count} треков</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent tracks */}
          <div className="px-5">
            <h3 className="font-oswald text-lg font-medium tracking-wide uppercase mb-4">Последнее</h3>
            <div className="flex flex-col gap-1">
              {tracks.slice(0, 5).map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--asphalt)] transition-colors cursor-pointer group"
                  onClick={() => playTrack(track)}
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <img src={track.cover} className="w-full h-full rounded-lg object-cover" />
                    {currentTrack.id === track.id && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <PlayingBars />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${currentTrack.id === track.id ? "text-[var(--stripe-yellow)]" : ""}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-[var(--text-dim)] truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-dim)]">{track.duration}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon
                        name={liked.includes(track.id) ? "Heart" : "Heart"}
                        size={16}
                        className={liked.includes(track.id) ? "text-[var(--stripe-yellow)]" : "text-[var(--text-dim)]"}
                      />
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
        <div className="flex-1 overflow-y-auto pb-24 animate-fade-in">
          <div className="px-5 pt-12 pb-6">
            <h1 className="font-oswald text-3xl font-medium tracking-wide uppercase mb-4">Поиск</h1>
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Трек, исполнитель, жанр..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--asphalt)] border border-[rgba(255,255,255,0.07)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--stripe-white)] placeholder-[var(--text-dim)] outline-none focus:border-[rgba(245,197,24,0.4)] transition-colors"
              />
            </div>
          </div>

          {/* Genres */}
          <div className="px-5 mb-6">
            <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest mb-3 font-display">Жанр</p>
            <div className="flex gap-2 flex-wrap">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                    activeGenre === g
                      ? "bg-[var(--stripe-yellow)] text-black border-[var(--stripe-yellow)] font-semibold"
                      : "border-[rgba(255,255,255,0.1)] text-[var(--text-mid)] hover:border-[rgba(245,197,24,0.3)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Moods */}
          <div className="px-5 mb-6">
            <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest mb-3 font-display">Настроение</p>
            <div className="flex gap-2 flex-wrap">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setActiveMood(activeMood === m.label ? null : m.label)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                    activeMood === m.label
                      ? "bg-[var(--stripe-yellow)] text-black border-[var(--stripe-yellow)] font-semibold"
                      : "border-[rgba(255,255,255,0.1)] text-[var(--text-mid)] hover:border-[rgba(245,197,24,0.3)]"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="road-line mx-5 mb-6" />

          {/* Results */}
          <div className="px-5">
            <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest mb-4 font-display">
              {filteredTracks.length} результатов
            </p>
            <div className="flex flex-col gap-1">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--asphalt)] transition-colors cursor-pointer"
                  onClick={() => playTrack(track)}
                >
                  <img src={track.cover} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-[var(--text-dim)] truncate">{track.artist} · {track.genre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-dim)]">{track.duration}</span>
                    <Icon name="Play" size={14} className="text-[var(--text-dim)]" />
                  </div>
                </div>
              ))}
              {filteredTracks.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-[var(--text-dim)] text-sm">Ничего не найдено</p>
                  <p className="text-[var(--text-dim)] text-xs mt-1">Попробуй другой запрос</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== PLAYER ===== */}
      {tab === "player" && (
        <div className="flex-1 overflow-y-auto pb-24 animate-fade-in">
          {/* Blurred background cover */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src={currentTrack.cover}
              className="w-full h-full object-cover opacity-10 blur-3xl scale-110"
            />
            <div className="absolute inset-0 bg-[var(--night)]/80" />
          </div>

          <div className="relative z-10 px-6 pt-12 pb-6 flex flex-col items-center min-h-full">
            {/* Label */}
            <div className="w-full flex items-center justify-between mb-8">
              <button onClick={() => setTab("home")}>
                <Icon name="ChevronDown" size={24} className="text-[var(--text-mid)]" />
              </button>
              <span className="text-xs font-display tracking-widest uppercase text-[var(--text-dim)]">
                Сейчас играет
              </span>
              <button onClick={() => toggleLike(currentTrack.id)}>
                <Icon
                  name="Heart"
                  size={22}
                  className={liked.includes(currentTrack.id) ? "text-[var(--stripe-yellow)]" : "text-[var(--text-dim)]"}
                />
              </button>
            </div>

            {/* Vinyl */}
            <div className="relative mb-10">
              <div
                className={`w-64 h-64 rounded-full overflow-hidden border-4 ${isPlaying ? "border-[var(--stripe-yellow)]" : "border-[rgba(255,255,255,0.1)]"} shadow-2xl transition-colors duration-500`}
                style={{ boxShadow: isPlaying ? "0 0 60px rgba(245,197,24,0.2), 0 0 120px rgba(245,197,24,0.08)" : "none" }}
              >
                <img
                  src={currentTrack.cover}
                  className={`w-full h-full object-cover ${isPlaying ? "vinyl-spin" : "vinyl-spin paused"}`}
                />
              </div>
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-[var(--night)] border-2 border-[rgba(255,255,255,0.1)]" />
              </div>
            </div>

            {/* Track info */}
            <div className="text-center mb-8 w-full">
              <h2 className="font-oswald text-3xl font-medium tracking-wide">{currentTrack.title}</h2>
              <p className="text-[var(--text-dim)] mt-1">{currentTrack.artist}</p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full border border-[rgba(245,197,24,0.3)] text-[var(--stripe-yellow)] text-xs font-display tracking-wider">
                {currentTrack.genre}
              </span>
            </div>

            {/* Progress */}
            <div className="w-full mb-6">
              <div className="progress-track w-full h-1 mb-2">
                <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-dim)]">
                <span>{Math.floor(progress / 100 * 3 * 60 + progress / 100 * 42)}s</span>
                <span>{currentTrack.duration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-xs">
              <button className="text-[var(--text-dim)] hover:text-white transition-colors p-2">
                <Icon name="Shuffle" size={20} />
              </button>
              <button
                className="text-[var(--text-mid)] hover:text-white transition-colors p-2"
                onClick={() => {
                  const idx = tracks.findIndex(t => t.id === currentTrack.id);
                  if (idx > 0) { setCurrentTrack(tracks[idx - 1]); setProgress(0); }
                }}
              >
                <Icon name="SkipBack" size={28} />
              </button>
              <button
                className="w-16 h-16 rounded-full bg-[var(--stripe-yellow)] flex items-center justify-center shadow-lg transition-transform active:scale-95"
                style={{ boxShadow: "0 0 30px rgba(245,197,24,0.4)" }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={26} className="text-black ml-0.5" />
              </button>
              <button
                className="text-[var(--text-mid)] hover:text-white transition-colors p-2"
                onClick={() => {
                  const idx = tracks.findIndex(t => t.id === currentTrack.id);
                  if (idx < tracks.length - 1) { setCurrentTrack(tracks[idx + 1]); setProgress(0); }
                }}
              >
                <Icon name="SkipForward" size={28} />
              </button>
              <button className="text-[var(--text-dim)] hover:text-white transition-colors p-2">
                <Icon name="Repeat" size={20} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 w-full max-w-xs mt-8">
              <Icon name="Volume1" size={16} className="text-[var(--text-dim)]" />
              <div className="flex-1 progress-track h-1">
                <div className="progress-fill h-full" style={{ width: "70%" }} />
              </div>
              <Icon name="Volume2" size={16} className="text-[var(--text-dim)]" />
            </div>
          </div>
        </div>
      )}

      {/* ===== PROFILE ===== */}
      {tab === "profile" && (
        <div className="flex-1 overflow-y-auto pb-24 animate-fade-in">
          <div className="px-5 pt-12 pb-6">
            {/* Avatar */}
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Треков", value: "248" },
                { label: "Часов", value: "91" },
                { label: "Плейлистов", value: "12" },
              ].map((s) => (
                <div key={s.label} className="card-night p-4 text-center">
                  <p className="font-oswald text-2xl font-semibold text-[var(--stripe-yellow)]">{s.value}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="road-line mb-8" />

            {/* Liked */}
            <div className="mb-8">
              <h3 className="font-oswald text-lg uppercase tracking-wide mb-4">Любимые треки</h3>
              {liked.length === 0 ? (
                <p className="text-[var(--text-dim)] text-sm py-4">Ты ещё не добавил любимые треки</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {tracks.filter(t => liked.includes(t.id)).map(track => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--asphalt)] cursor-pointer"
                      onClick={() => playTrack(track)}
                    >
                      <img src={track.cover} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{track.title}</p>
                        <p className="text-xs text-[var(--text-dim)]">{track.artist}</p>
                      </div>
                      <Icon name="Heart" size={14} className="text-[var(--stripe-yellow)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
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

      {/* ===== MINI PLAYER BAR (shown everywhere except full player) ===== */}
      {tab !== "player" && (
        <div
          className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-sm z-40 cursor-pointer"
          onClick={() => setTab("player")}
        >
          <div
            className="rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md"
            style={{
              background: "rgba(26,26,26,0.95)",
              border: "1px solid rgba(245,197,24,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)"
            }}
          >
            <img src={currentTrack.cover} className="w-10 h-10 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.title}</p>
              <p className="text-xs text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
            </div>
            {isPlaying && <PlayingBars />}
            <button
              className="w-9 h-9 rounded-full bg-[var(--stripe-yellow)] flex items-center justify-center ml-1 flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
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
            backdropFilter: "blur(20px)"
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
              {tab === item.id && (
                <div className="w-1 h-1 rounded-full bg-[var(--stripe-yellow)]" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}