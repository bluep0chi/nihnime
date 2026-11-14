"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { store } from "@/lib/client";
import { formatPlayerTime, isHlsUrl, usableIntro } from "@/lib/player.mjs";

function Icon({ name, className = "" }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "play": return <svg {...common}><path d="M8 5.5 19 12 8 18.5z" fill="currentColor" stroke="none" /></svg>;
    case "pause": return <svg {...common}><path d="M8 5.5v13M16 5.5v13" strokeWidth="3" /></svg>;
    case "back": return <svg {...common}><path d="M4 9a8.5 8.5 0 1 1-.2 5.7M4 5v4h4" /><text x="12" y="15.2" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">10</text></svg>;
    case "forward": return <svg {...common}><path d="M20 9a8.5 8.5 0 1 0 .2 5.7M20 5v4h-4" /><text x="12" y="15.2" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">10</text></svg>;
    case "volume": return <svg {...common}><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>;
    case "muted": return <svg {...common}><path d="M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6" /></svg>;
    case "fullscreen": return <svg {...common}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>;
    case "exit-fullscreen": return <svg {...common}><path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" /></svg>;
    case "pip": return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx=".5" fill="currentColor" stroke="none" /></svg>;
    case "skip": return <svg {...common}><path d="m5 5 9 7-9 7z" fill="currentColor" stroke="none" /><path d="M18 5v14" strokeWidth="2.5" /></svg>;
    default: return null;
  }
}

function Control({ label, icon, onClick, pressed, className = "" }) {
  return <button type="button" className={`ni-player-control ${className}`} onClick={onClick} aria-label={label} title={label} aria-pressed={pressed}><Icon name={icon} /></button>;
}

export default function VideoPlayer({ src, poster, title, serverLabel, episodeId, animeId, episodeNumber, demo, onError, onReady }) {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const playingRef = useRef(false);
  const resumedRef = useRef(false);
  const lastProgress = useRef(-1);
  const lastVolume = useRef(1);
  const errorRef = useRef(onError);
  const readyRef = useRef(onReady);
  errorRef.current = onError;
  readyRef.current = onReady;
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [pipAvailable, setPipAvailable] = useState(false);
  const [pip, setPip] = useState(false);
  const [introState, setIntroState] = useState({ status: demo ? "demo" : "waiting", data: null });
  const hlsSource = isHlsUrl(src);
  const durationKey = Number.isFinite(duration) && duration > 0 ? duration.toFixed(3) : "";

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(timerRef.current);
    if (playingRef.current) timerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Native HLS where supported, otherwise use hls.js for direct HLS sources.
  // MP4/WebM URLs remain on the native video element and need no CORS proxy.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsSource) return undefined;
    let cancelled = false;
    let hls;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { errorRef.current?.(); return; }
        hls = new Hls();
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal && !cancelled) errorRef.current?.();
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      }).catch(() => { if (!cancelled) errorRef.current?.(); });
    }
    return () => { cancelled = true; hls?.destroy(); if (!hls) video.removeAttribute("src"); };
  }, [src, hlsSource]);

  useEffect(() => {
    const video = videoRef.current;
    const wrapper = wrapperRef.current;
    if (!video || !wrapper) return undefined;
    try {
      const savedVolume = Number(localStorage.getItem("nihnime:player-volume"));
      if (localStorage.getItem("nihnime:player-volume") !== null && Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) video.volume = savedVolume;
      video.muted = localStorage.getItem("nihnime:player-muted") === "true";
    } catch { /* Browser storage can be disabled. */ }
    setVolume(video.volume);
    setMuted(video.muted);
    if (video.volume > 0) lastVolume.current = video.volume;
    setFullscreenAvailable(Boolean(document.fullscreenEnabled || wrapper.webkitRequestFullscreen || video.webkitEnterFullscreen));
    setPipAvailable(Boolean(document.pictureInPictureEnabled && video.requestPictureInPicture));
    const fullscreenChanged = () => setFullscreen(document.fullscreenElement === wrapper || document.webkitFullscreenElement === wrapper);
    const pipChanged = () => setPip(document.pictureInPictureElement === video);
    document.addEventListener("fullscreenchange", fullscreenChanged);
    document.addEventListener("webkitfullscreenchange", fullscreenChanged);
    video.addEventListener("enterpictureinpicture", pipChanged);
    video.addEventListener("leavepictureinpicture", pipChanged);
    const save = () => { if (resumedRef.current) store.saveProgress(episodeId, video.currentTime, video.duration); };
    const visibility = () => { if (document.visibilityState === "hidden") save(); };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      save();
      document.removeEventListener("fullscreenchange", fullscreenChanged);
      document.removeEventListener("webkitfullscreenchange", fullscreenChanged);
      video.removeEventListener("enterpictureinpicture", pipChanged);
      video.removeEventListener("leavepictureinpicture", pipChanged);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [episodeId]);

  // The effect belongs to this exact player instance. Switching episode,
  // source, or duration aborts the previous request and clears its interval.
  useEffect(() => {
    if (demo) { setIntroState({ status: "demo", data: null }); return undefined; }
    if (!durationKey) { setIntroState({ status: "waiting", data: null }); return undefined; }
    if (!/^[1-9]\d*$/.test(String(episodeId)) || !/^[1-9]\d*$/.test(String(animeId))) {
      setIntroState({ status: "unavailable", data: null }); return undefined;
    }
    const controller = new AbortController();
    setIntroState({ status: "loading", data: null });
    const params = new URLSearchParams({ anime: String(animeId), duration: durationKey });
    fetch(`/api/intro/${encodeURIComponent(episodeId)}?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.status !== 200) throw new Error("Intro unavailable");
        if (!controller.signal.aborted) setIntroState(usableIntro(body.data, Number(durationKey), episodeNumber)
          ? { status: "ready", data: body.data } : { status: "unavailable", data: null });
      }).catch(() => { if (!controller.signal.aborted) setIntroState({ status: "unavailable", data: null }); });
    return () => controller.abort();
  }, [animeId, episodeId, episodeNumber, durationKey, demo]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      const result = video.play();
      result?.catch(() => { /* The browser may require a new user gesture. */ });
    } else video.pause();
    showControls();
  };
  const seekTo = (seconds) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = Math.min(video.duration, Math.max(0, seconds));
    setCurrent(video.currentTime);
    showControls();
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) { if (video.volume === 0) video.volume = lastVolume.current || 1; video.muted = false; }
    else video.muted = true;
    showControls();
  };
  const changeVolume = (value) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(value);
    video.volume = next;
    video.muted = next === 0;
    if (next > 0) lastVolume.current = next;
    showControls();
  };
  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (wrapper.requestFullscreen) await wrapper.requestFullscreen();
      else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch { /* Fullscreen may be disabled by the browser or embedding page. */ }
    showControls();
  };
  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
      else if (video.requestPictureInPicture) await video.requestPictureInPicture();
    } catch { /* Picture-in-picture is not available for every source. */ }
    showControls();
  };
  const onKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    const key = event.key.toLowerCase();
    if (key === " " || key === "k") { event.preventDefault(); togglePlay(); }
    else if (key === "arrowleft") { event.preventDefault(); seekTo((videoRef.current?.currentTime || 0) - 10); }
    else if (key === "arrowright") { event.preventDefault(); seekTo((videoRef.current?.currentTime || 0) + 10); }
    else if (key === "m") { event.preventDefault(); toggleMute(); }
    else if (key === "f") { event.preventDefault(); toggleFullscreen(); }
  };

  const intro = introState.status === "ready" && usableIntro(introState.data, duration, episodeNumber) ? introState.data : null;
  const showIntro = intro && current >= intro.start && current < intro.end;
  const skipIntro = () => {
    const video = videoRef.current;
    if (video && usableIntro(intro, video.duration, episodeNumber) && video.currentTime >= intro.start && video.currentTime < intro.end) seekTo(intro.end);
  };
  const played = duration > 0 ? Math.min(100, Math.max(0, current / duration * 100)) : 0;
  const introStart = intro ? intro.start / duration * 100 : 0;
  const introWidth = intro ? (intro.end - intro.start) / duration * 100 : 0;

  return <div className="ni-player-block">
    <div id="video-player-wrapper" ref={wrapperRef} className="ni-player" role="region" aria-label={`Pemutar video NIHNIME: ${title}`} tabIndex={0} onKeyDown={onKeyDown} onPointerMove={showControls} onPointerDown={showControls} onFocus={showControls}>
      <video id="video-player-video" ref={videoRef} src={hlsSource ? undefined : src} poster={poster || undefined} playsInline preload="metadata" onClick={togglePlay}
        onError={() => { setWaiting(false); errorRef.current?.(); }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(Number.isFinite(video.duration) ? video.duration : 0);
          readyRef.current?.();
          if (!resumedRef.current) {
            resumedRef.current = true;
            const progress = store.getProgress(episodeId);
            if (progress > 0 && Number.isFinite(video.duration) && progress < video.duration) { video.currentTime = progress; setCurrent(progress); }
          }
        }}
        onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrent(video.currentTime);
          const step = Math.floor(video.currentTime / 5);
          if (resumedRef.current && step !== lastProgress.current) { lastProgress.current = step; store.saveProgress(episodeId, video.currentTime, video.duration); }
        }}
        onSeeked={(event) => { if (resumedRef.current) store.saveProgress(episodeId, event.currentTarget.currentTime, event.currentTarget.duration); }}
        onPlay={() => { playingRef.current = true; setPlaying(true); showControls(); }}
        onPause={(event) => { playingRef.current = false; setPlaying(false); setWaiting(false); if (resumedRef.current) store.saveProgress(episodeId, event.currentTarget.currentTime, event.currentTarget.duration); showControls(); }}
        onWaiting={(event) => { if (!event.currentTarget.paused) setWaiting(true); }} onPlaying={() => setWaiting(false)} onCanPlay={() => setWaiting(false)}
        onVolumeChange={(event) => {
          const video = event.currentTarget;
          setVolume(video.volume); setMuted(video.muted);
          if (video.volume > 0) lastVolume.current = video.volume;
          try { localStorage.setItem("nihnime:player-volume", String(video.volume)); localStorage.setItem("nihnime:player-muted", String(video.muted)); } catch { /* Optional preference. */ }
        }} onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)} />
      <div className="ni-player-top" aria-hidden="true"><span><b className="ni-player-dot" /> NIHNIME <strong>PLAYER</strong></span><span className="ni-player-source">{serverLabel}</span></div>
      {!playing && !waiting && <button type="button" className="ni-player-center" aria-label="Putar video" onClick={togglePlay}><Icon name="play" /></button>}
      {waiting && <div className="ni-player-buffer" role="status" aria-label="Memuat video"><span /></div>}
      {showIntro && <button type="button" className="ni-player-skip" onClick={skipIntro} title="Lewati bagian opening yang tersedia dari AniSkip">Lewati Intro <Icon name="skip" /></button>}
      <div className={`ni-player-chrome${controlsVisible ? "" : " is-hidden"}`}>
        <div className="ni-player-timeline">
          <div className="ni-player-seek">
            <div className="ni-player-track" aria-hidden="true"><span className="ni-player-played" style={{ width: `${played}%` }} />{intro && <span className="ni-player-intro-mark" style={{ left: `${introStart}%`, width: `${introWidth}%` }} />}</div>
            <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(current, duration || 0)} disabled={!duration} aria-label="Geser waktu video" aria-valuetext={`${formatPlayerTime(current)} dari ${formatPlayerTime(duration || NaN)}`} onChange={(event) => seekTo(Number(event.target.value))} />
          </div>
          <span className="ni-player-time">{formatPlayerTime(current)} <span>/</span> {formatPlayerTime(duration || NaN)}</span>
        </div>
        <div className="ni-player-toolbar">
          <Control label={playing ? "Jeda video" : "Putar video"} icon={playing ? "pause" : "play"} onClick={togglePlay} />
          <Control label="Mundur 10 detik" icon="back" onClick={() => seekTo((videoRef.current?.currentTime || 0) - 10)} />
          <Control label="Maju 10 detik" icon="forward" onClick={() => seekTo((videoRef.current?.currentTime || 0) + 10)} />
          <Control label={muted || volume === 0 ? "Nyalakan suara" : "Bisukan suara"} icon={muted || volume === 0 ? "muted" : "volume"} onClick={toggleMute} pressed={muted || volume === 0} />
          <input className="ni-player-volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} aria-label="Volume" onChange={(event) => changeVolume(event.target.value)} />
          <span className="ni-player-spacer" />
          <select className="ni-player-speed" aria-label="Kecepatan video" title="Kecepatan video" value={speed} onChange={(event) => { if (videoRef.current) videoRef.current.playbackRate = Number(event.target.value); showControls(); }}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}x</option>)}
          </select>
          {pipAvailable && <Control label={pip ? "Tutup picture-in-picture" : "Picture-in-picture"} icon="pip" onClick={togglePip} pressed={pip} className="ni-player-pip" />}
          {fullscreenAvailable && <Control label={fullscreen ? "Keluar layar penuh" : "Layar penuh"} icon={fullscreen ? "exit-fullscreen" : "fullscreen"} onClick={toggleFullscreen} pressed={fullscreen} />}
        </div>
      </div>
    </div>
    <div className="ni-player-caption">
      <p>Progres video langsung disimpan di browser ini. Jika video tidak muncul, coba server atau kualitas lain.</p>
      <p aria-live="polite">{introState.status === "demo" ? "Video contoh tidak memiliki data intro." : introState.status === "waiting" ? "Durasi video diperlukan untuk mencari intro." : introState.status === "loading" ? "Mencocokkan intro dengan episode dan durasi video…" : intro ? <>Intro dari <a href="https://aniskip.com/" target="_blank" rel="noreferrer">AniSkip</a> dicocokkan dengan episode dan durasi. Data komunitas dapat berbeda antarversi video.</> : "Intro belum tersedia atau tidak cocok untuk episode dan versi video ini."}</p>
    </div>
  </div>;
}
