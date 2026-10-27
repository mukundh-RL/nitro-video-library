import { useEffect, useMemo, useRef, useState } from 'react';
import { WistiaPlayer } from '@wistia/wistia-player-react';
import { Button } from './design-system/components.tsx';
import { categories, videos } from './videos.js';

const asset = (file) => import.meta.env.BASE_URL + 'design/' + file;
const thumbnail = (video) => import.meta.env.BASE_URL + video.thumbnail.replace(/^\//, '');

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name === 'pause' && <path d="M8 5v14M16 5v14" strokeWidth="4" />}
    {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
    {name === 'expand' && <path d="M9 3H3v6m0-6 7 7m5 11h6v-6m0 6-7-7" />}
    {name === 'home' && <path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4Z" />}
  </svg>;
}

function useMechanicalAudio(enabled) {
  const contextRef = useRef(null);
  const transportSound = useRef(null);
  const selectionSound = useRef(null);
  useEffect(() => {
    const sound = new Audio(import.meta.env.BASE_URL + 'audio/interface-device-click.wav');
    sound.preload = 'auto';
    sound.volume = .55;
    sound.load();
    transportSound.current = sound;
    const selection = new Audio(import.meta.env.BASE_URL + 'audio/cool-interface-click-tone.wav');
    selection.preload = 'auto';
    selection.volume = .55;
    selection.load();
    selectionSound.current = selection;
    return () => {
      sound.pause();
      selection.pause();
      transportSound.current = null;
      selectionSound.current = null;
    };
  }, []);
  function playSelection() {
    if (!enabled || !selectionSound.current) return;
    selectionSound.current.currentTime = 0;
    selectionSound.current.play().catch(() => {});
  }
  function tone(frequency, endFrequency, duration, volume, delay = 0, type = 'triangle') {
    if (!enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = contextRef.current || new AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') context.resume().catch(() => {});
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
  return {
    click: playSelection,
    pad: playSelection,
    transport() {
      if (!enabled || !transportSound.current) return;
      transportSound.current.currentTime = 0;
      transportSound.current.play().catch(() => tone(920, 260, .038, .055, 0, 'square'));
    },
    tick() { tone(1780, 1080, .018, .035, 0, 'square'); },
    startup() { tone(86, 180, .5, .025, .1); tone(240, 520, .34, .02, .5); tone(620, 980, .18, .025, .9); },
  };
}

function VideoCard({ video, onOpen, compact = false, active = false, index = 0 }) {
  return <button type="button" className={'video-card ' + (compact ? 'video-card--compact ' : '') + (active ? 'is-selected' : '')} aria-label={'Play ' + video.title + ', ' + video.duration + ' minutes'} aria-current={active ? 'true' : undefined} onClick={() => onOpen(video)}>
    <span className="video-card__image">
      <img src={thumbnail(video)} alt="" loading={index < 4 ? 'eager' : 'lazy'} />
      <span className="video-card__duration">{video.duration} min</span>
      {!compact && <img className="video-card__play" src={asset('thumbnail-play.svg')} alt="" />}
    </span>
    <span className="video-card__copy"><strong>{video.title}</strong>{!compact && <span>{video.description}</span>}</span>
  </button>;
}

function RoundButton({ label, icon, onClick, pressed = false }) {
  return <button type="button" className="round-button" aria-label={label} title={label} aria-pressed={pressed || undefined} onClick={onClick}>
    <img className="round-button__cap" src={asset('button-cap.svg')} alt="" />
    <span className="round-button__icon">{icon === 'pause' ? <Icon name="pause" size={14} /> : <img src={asset(icon + '.svg')} alt="" />}</span>
    <span className="sr-only">{label}</span>
  </button>;
}

function VolumeSlider({ value, onChange, onTick }) {
  const lastTick = useRef(Math.round(value * 20));
  function update(event) {
    const next = Number(event.target.value);
    const tick = Math.round(next * 20);
    if (tick !== lastTick.current) { lastTick.current = tick; onTick(); }
    onChange(next);
  }
  return <div className="volume-control">
    <div className="volume-slider" style={{ '--volume': (value * 100) + '%', '--volume-number': value }}>
      <span className="volume-slider__track" aria-hidden="true" />
      <span className="volume-slider__position" aria-hidden="true"><img src={asset('volume-thumb.svg')} alt="" /></span>
      <input type="range" min="0" max="1" step="0.01" value={value} aria-label="Volume" aria-valuetext={Math.round(value * 100) + ' percent'} onChange={update} />
    </div>
    <span className="volume-level" aria-hidden="true"><img src={asset('volume-level.svg')} alt="" /><span className="volume-level__fill" style={{ maskImage: 'url(' + asset('volume-level.svg') + ')', clipPath: 'inset(0 ' + ((1 - value) * 100) + '% 0 0)' }} /></span>
    <output className="sr-only">{String(Math.round(value * 100)).padStart(2, '0')}</output>
  </div>;
}

export default function App() {
  const [view, setView] = useState('welcome');
  const [category, setCategory] = useState('All videos');
  const [activeVideo, setActiveVideo] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(.45);
  const [soundFx, setSoundFx] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [pip, setPip] = useState(false);
  const [intro, setIntro] = useState(true);
  const [playRequest, setPlayRequest] = useState(0);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const playerRef = useRef(null);
  const railRef = useRef(null);
  const welcomeRef = useRef(null);
  const gridRef = useRef(null);
  const lastOpener = useRef(null);
  const audio = useMechanicalAudio(soundFx);
  const startup = useRef(audio.startup);
  const filteredVideos = useMemo(() => videos.filter((video) => category === 'All videos' || video.category === category), [category]);
  const showBrowser = view !== 'welcome';

  useEffect(() => {
    startup.current();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setIntro(false), reduced ? 0 : 1500);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (playerReady && playerRef.current) playerRef.current.volume = volume; }, [volume, playerReady]);
  useEffect(() => {
    if (!showBrowser) return;
    const rail = railRef.current;
    if (!rail) return;
    const update = () => { setCanScrollBack(rail.scrollLeft > 2); setCanScrollNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2); };
    rail.scrollTo({ left: 0 });
    update();
    rail.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => { rail.removeEventListener('scroll', update); observer.disconnect(); };
  }, [category, showBrowser]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (['INPUT', 'BUTTON', 'A'].includes(event.target.tagName) || event.target.isContentEditable) return;
      if (event.key === 'Escape' && activeVideo) closeVideo();
      if (event.code === 'Space' && activeVideo) { event.preventDefault(); togglePlayback(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function openVideo(video, sound = 'click') {
    lastOpener.current = document.activeElement;
    if (sound) audio[sound]();
    setView('player');
    setPip(false);
    setPlayerReady(false);
    setPlaying(false);
    setPlayRequest((request) => request + 1);
    setActiveVideo(video);
  }
  function handlePlayerReady(event) {
    if (event.target !== playerRef.current) return;
    setPlayerReady(true);
    event.target.volume = volume;
    event.target.play().catch(() => setPlaying(false));
  }
  function closeVideo() {
    audio.click();
    playerRef.current?.pause?.();
    setActiveVideo(null);
    setPlaying(false);
    setPlayerReady(false);
    setPip(false);
    if (!pip) setView('library');
    window.setTimeout(() => {
      const target = pip
        ? document.querySelector('.category-key.is-active')
        : lastOpener.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
    }, 0);
  }
  function togglePlayback() {
    if (!activeVideo) { openVideo(filteredVideos[0], 'transport'); return; }
    if (!playerReady) return;
    audio.transport();
    if (playing) playerRef.current.pause();
    else playerRef.current.play().catch(() => setPlaying(false));
  }
  function stepVideo(direction) {
    const current = filteredVideos.findIndex((video) => video.slug === activeVideo?.slug);
    const next = current < 0 ? (direction > 0 ? 0 : filteredVideos.length - 1) : (current + direction + filteredVideos.length) % filteredVideos.length;
    openVideo(filteredVideos[next], 'transport');
  }
  function chooseCategory(next) {
    audio.pad();
    if (next === 'All videos') { showAllVideos(); return; }
    setCategory(next);
    setView('player');
    if (activeVideo && playing) {
      if (next !== category || view === 'welcome') setPip(true);
    } else {
      const first = videos.find((video) => next === 'All videos' || video.category === next);
      if (first) openVideo(first, null);
    }
  }
  function explore() {
    audio.click();
    if (welcomeRef.current && gridRef.current) {
      const offset = gridRef.current.getBoundingClientRect().top - welcomeRef.current.getBoundingClientRect().top;
      welcomeRef.current.scrollTo({ top: welcomeRef.current.scrollTop + offset, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    gridRef.current?.focus({ preventScroll: true });
  }
  function goHome() {
    audio.click();
    setView('welcome');
    if (activeVideo) setPip(true);
    window.requestAnimationFrame(() => welcomeRef.current?.scrollTo({ top: 0 }));
  }
  function showAllVideos() {
    setCategory('All videos');
    setView('welcome');
    if (activeVideo) setPip(true);
    window.requestAnimationFrame(() => {
      if (welcomeRef.current && gridRef.current) {
        const offset = gridRef.current.getBoundingClientRect().top - welcomeRef.current.getBoundingClientRect().top;
        welcomeRef.current.scrollTo({ top: welcomeRef.current.scrollTop + offset, behavior: 'instant' });
        gridRef.current.focus({ preventScroll: true });
      }
    });
  }
  function backToVideos() {
    audio.transport();
    showAllVideos();
  }
  function scrollRail(direction) {
    audio.click();
    const rail = railRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  return <main className={'system-stage ' + (intro ? 'is-starting' : 'is-ready')}>
    <div className="room-scene" aria-hidden="true">
      <img className="room-scene__background" src={asset('room-background-v4.png')} alt="" />
      <div className="room-scene__tone" />
      <div className="room-scene__ambient"><img src={asset('room-ambient-light.svg')} alt="" /></div>
    </div>
    <a className="skip-link" href="#video-library" onClick={() => { if (view === 'welcome') explore(); }}>Skip to videos</a>
    <section className="workstation" aria-label="Nitro video workstation">
      <img className="workstation__texture" src={asset('case-texture.png')} alt="" aria-hidden="true" />
      <div className="device-ground-shadow" aria-hidden="true"><img src={asset('room-ground-shadow.png')} alt="" /></div>
      <span className="device-fitting device-fitting--side" aria-hidden="true" />
      <span className="device-fitting device-fitting--top" aria-hidden="true" />
      <span className="device-screw device-screw--left" aria-hidden="true"><img src={asset('case-screw.svg')} alt="" /></span>
      <span className="device-screw device-screw--right" aria-hidden="true"><img src={asset('case-screw.svg')} alt="" /></span>
      <header className="device-header">
        <button className="brand-plate" type="button" onClick={goHome} aria-label="Nitro video archive home">
          <img src={asset('rocketlane.svg')} alt="Rocketlane" />
          <span className="nitro-lockup"><img src={asset('nitro-mark.svg')} alt="" /><img src={asset('nitro-wordmark.svg')} alt="Nitro" /></span>
        </button>
        <span className="case-label">NTR–01 / VIDEO ARCHIVE</span>
      </header>
      <div className="device-interior">
        <section className={'display-panel ' + (showBrowser ? 'display-panel--browser' : '')} aria-label="Video screen">
          {!showBrowser && <div className="welcome-view" ref={welcomeRef}>
            <section className="welcome-hero" aria-label="Welcome to Nitro">
              <img className="welcome-art" src={asset('nitro-sunrise.png')} alt="Nitro above the sunrise on Earth" />
              <div className="welcome-copy"><h1>Welcome to the hub of Nitro video content.</h1><Button variant="onblue" size="sm" className="explore-button" onClick={explore}>Explore the videos</Button></div>
            </section>
            <div className="welcome-library" id="video-library" tabIndex="-1" ref={gridRef} aria-label="All Nitro videos">
              {videos.map((video, index) => <VideoCard key={video.slug} video={video} index={index} onOpen={openVideo} />)}
            </div>
          </div>}
          {showBrowser && <>
            <div className="main-screen">
              {(!activeVideo || pip) && <button type="button" className="screen-idle" onClick={() => openVideo(filteredVideos[0])} aria-label={'Play ' + filteredVideos[0].title + ' in main player'}>
                <img src={thumbnail(filteredVideos[0])} alt="" />
                <span><img src={asset('thumbnail-play.svg')} alt="" />{filteredVideos[0].title}</span>
              </button>}
            </div>
            <section className="thumbnail-tray" aria-label={category + ' video selection'}>
              <div className="tray-heading"><h2>{category}</h2></div>
              <div className="thumbnail-rail" ref={railRef} id="category-videos">{filteredVideos.map((video, index) => <VideoCard key={video.slug} video={video} index={index} compact active={video.slug === activeVideo?.slug} onOpen={openVideo} />)}</div>
              {canScrollBack && <button type="button" className="rail-arrow rail-arrow--back" onClick={() => scrollRail(-1)} aria-label="Previous thumbnails"><img src={asset('carousel-next.svg')} alt="" /></button>}
              {canScrollNext && <button type="button" className="rail-arrow" onClick={() => scrollRail(1)} aria-label="More thumbnails"><img src={asset('carousel-next.svg')} alt="" /></button>}
            </section>
          </>}
          {activeVideo && <div className={'video-window ' + (pip ? 'is-pip' : '')} role="region" aria-label={'Playing ' + activeVideo.title}>
            <div className="video-window__player">
              {!playerReady && <div className="player-loading" role="status"><span />Loading video</div>}
              <WistiaPlayer key={activeVideo.mediaId + '-' + playRequest} ref={playerRef} mediaId={activeVideo.mediaId} aspect={16 / 9} autoplay playerColor="0E61FE" volume={volume} onApiReady={handlePlayerReady} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => stepVideo(1)} onVolumeChange={(event) => { if (Number.isFinite(event.detail?.volume)) setVolume(event.detail.volume); }} />
            </div>
            <div className="window-actions">
              {pip && <button type="button" aria-label="Expand video" onClick={() => { audio.click(); setPip(false); setView('player'); }}><Icon name="expand" size={16} /></button>}
              <button type="button" onClick={closeVideo} aria-label="Close video"><Icon name="close" size={16} /></button>
            </div>
            {pip && <div className="pip-title">{activeVideo.title}</div>}
          </div>}
          {showBrowser && <button type="button" className="video-back-button" aria-label="Back to all videos" onClick={backToVideos}><img src={asset('back.svg')} alt="" /></button>}
          {!showBrowser && <div className="screen-vignette" aria-hidden="true" />}
        </section>
        <aside className="control-deck" aria-label="Video controls">
          <section className="transport-bank" aria-label="Playback controls">
            <div className="transport-readout" aria-live="polite"><div><span>NOW PLAYING</span>{playing ? <img src={asset('readout-play.svg')} alt="Playing" /> : activeVideo ? <Icon name="pause" size={14} /> : <img src={asset('readout-play.svg')} alt="Ready" />}</div><p>{activeVideo?.title || 'Select a video to get started.'}</p></div>
            <div className="transport-bottom">
              <div className="transport-controls"><div className="transport-keys">
                <RoundButton label="Previous video" icon="previous" onClick={() => stepVideo(-1)} />
                <RoundButton label={playing ? 'Pause video' : 'Play video'} icon={playing ? 'pause' : 'play'} onClick={togglePlayback} pressed={playing} />
                <RoundButton label="Next video" icon="next" onClick={() => stepVideo(1)} />
              </div><VolumeSlider value={volume} onChange={setVolume} onTick={audio.tick} /></div>
              <button className="speaker-button" type="button" onClick={() => { audio.click(); setSoundFx((value) => !value); }} aria-label={(soundFx ? 'Disable' : 'Enable') + ' mechanical sounds'} aria-pressed={soundFx} title="Toggle mechanical sounds"><img src={asset('speaker.svg')} alt="" />{!soundFx && <span className="speaker-muted">SFX OFF</span>}</button>
            </div>
          </section>
          <div className="category-keys" role="group" aria-label="Video categories">{categories.map((item) => <button key={item} type="button" className={'category-key ' + (category === item && (showBrowser || item === 'All videos') ? 'is-active' : '')} aria-label={'Filter by ' + item} aria-pressed={category === item && (showBrowser || item === 'All videos')} onClick={() => chooseCategory(item)}><span className="category-key__top"><img className="channel-light" src={asset(category === item && (showBrowser || item === 'All videos') ? 'light-on.svg' : 'light-off.svg')} alt="" /></span><span className="category-key__label">{item}</span></button>)}</div>
        </aside>
      </div>
    </section>
  </main>;
}
