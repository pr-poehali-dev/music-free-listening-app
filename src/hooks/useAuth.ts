import { useState, useEffect, useCallback } from "react";

const AUTH_URL = "https://functions.poehali.dev/a0a4cd38-4a35-4acf-8fb1-6db095b48578";
const LIKES_URL = "https://functions.poehali.dev/d42b1e19-90e0-45da-81a8-17c452da7903";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
}

export interface LikedTrack {
  id: number;
  title: string;
  artist: string;
  cover: string;
  preview: string;
  duration: number;
  added_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string>("");
  const [likedTracks, setLikedTracks] = useState<LikedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("nocturn_user");
    const savedSession = localStorage.getItem("nocturn_session");
    if (savedUser && savedSession) {
      const u = JSON.parse(savedUser) as User;
      setUser(u);
      setSession(savedSession);
      // Verify session is still valid
      fetch(`${AUTH_URL}?user_id=${u.id}`, {
        headers: { "X-Session-Id": savedSession },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            loadLikes(u.id, savedSession);
          } else {
            logout();
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loadLikes = useCallback((userId: number, sessionToken: string) => {
    fetch(LIKES_URL, {
      headers: { "X-Session-Id": sessionToken, "X-User-Id": String(userId) },
    })
      .then((r) => r.json())
      .then((data) => setLikedTracks(data.tracks || []))
      .catch(() => {});
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (data.user && data.session) {
      setUser(data.user);
      setSession(data.session);
      localStorage.setItem("nocturn_user", JSON.stringify(data.user));
      localStorage.setItem("nocturn_session", data.session);
      loadLikes(data.user.id, data.session);
    }
    return data;
  }, [loadLikes]);

  const logout = useCallback(() => {
    setUser(null);
    setSession("");
    setLikedTracks([]);
    localStorage.removeItem("nocturn_user");
    localStorage.removeItem("nocturn_session");
  }, []);

  const toggleLike = useCallback(async (track: { id: number; title: string; artist: string; cover: string; preview: string; duration: number }) => {
    if (!user || !session) return;

    const isLiked = likedTracks.some((t) => t.id === track.id);

    if (isLiked) {
      setLikedTracks((prev) => prev.filter((t) => t.id !== track.id));
      await fetch(LIKES_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Session-Id": session, "X-User-Id": String(user.id) },
        body: JSON.stringify({ track_id: track.id }),
      });
    } else {
      const newLike: LikedTrack = { ...track, added_at: new Date().toISOString() };
      setLikedTracks((prev) => [newLike, ...prev]);
      await fetch(LIKES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": session, "X-User-Id": String(user.id) },
        body: JSON.stringify({ track }),
      });
    }
  }, [user, session, likedTracks]);

  const isLiked = useCallback((trackId: number) => {
    return likedTracks.some((t) => t.id === trackId);
  }, [likedTracks]);

  return { user, session, likedTracks, loading, loginWithGoogle, logout, toggleLike, isLiked };
}
