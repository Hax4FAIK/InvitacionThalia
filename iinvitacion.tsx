import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Calendar,
  Share2,
  QrCode,
  Shirt,
  MapPin,
  Clock,
  Lock,
  Copy,
  Eye,
  X,
  ArrowUpRight,
  Users,
  Award,
  Bell,
  RefreshCw,
  Navigation,
  ExternalLink,
  Check,
  Compass,
  Sun,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

// ==========================================
// SINTETIZADOR DE AUDIO CÁLIDO (WEB AUDIO API)
// Acordes acústicos suaves, sin archivos pesados externos
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.ambientInterval = null;
    this.isPlayingAmbient = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playNotificationDing() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [587.33, 880.0]; // Re5 -> La5 (timbre cálido orgánico)
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.24, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.68);
      });
      if (navigator.vibrate) {
        navigator.vibrate([140, 60, 180]);
      }
    } catch (e) {}
  }

  playModeSwitch(isPresent) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Acorde cálido Mayor 7 para Modo Presente vs tono frío breve para Modo Automático
      const chord = isPresent
        ? [293.66, 369.99, 440.0, 554.37] // Dmaj7 cálido
        : [392.0, 311.13, 261.63];
      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isPresent ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.001, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.11, now + i * 0.06 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.55);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.58);
      });
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (e) {}
  }

  toggleAmbient() {
    if (this.isPlayingAmbient) {
      this.stopAmbient();
      return false;
    }
    this.init();
    if (!this.ctx) return false;
    this.isPlayingAmbient = true;
    // Escala pentatónica cálida acústica
    const scale = [293.66, 329.63, 369.99, 440.0, 587.33, 440.0, 369.99, 329.63];
    let step = 0;

    const triggerNote = () => {
      if (!this.isPlayingAmbient || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      const freq = scale[step % scale.length];
      step++;

      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.032, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    };

    triggerNote();
    this.ambientInterval = setInterval(triggerNote, 640);
    return true;
  }

  stopAmbient() {
    this.isPlayingAmbient = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

const soundFX = new SoundEngine();

// ==========================================
// GENERADOR DE MATRIZ QR PERSONALIZADA (SVG)
// ==========================================
function PersonalQRMatrix({ seedText = 'UNSM-NICOLE', size = 84 }) {
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
      hash ^= seedText.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const grid = 15;
    const matrix = [];

    const isFinderPattern = (r, c) => {
      const topLeft = r < 4 && c < 4;
      const topRight = r < 4 && c >= grid - 4;
      const bottomLeft = r >= grid - 4 && c < 4;
      return topLeft || topRight || bottomLeft;
    };

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if (isFinderPattern(r, c)) continue;
        // Simetría parcial para estética de código real
        const idx = r * grid + Math.min(c, grid - 1 - c);
        const bit = ((hash >>> (idx % 24)) ^ (r * 7 + c * 13)) & 1;
        if (bit === 1 || (r === 7 && c % 2 === 0)) {
          matrix.push({ r, c });
        }
      }
    }
    return matrix;
  }, [seedText]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 150 150"
      className="rounded-lg bg-[#F6EFE2] p-1.5 shadow-inner border border-[#14110F]/15 shrink-0"
      aria-label={`Código QR personal para ${seedText}`}
    >
      {/* Tres esquinas de posicionamiento QR */}
      <g fill="#14110F">
        <rect x="6" y="6" width="34" height="34" rx="5" />
        <rect x="12" y="12" width="22" height="22" rx="3" fill="#F6EFE2" />
        <rect x="17" y="17" width="12" height="12" rx="2" fill="#E05A37" />

        <rect x="110" y="6" width="34" height="34" rx="5" />
        <rect x="116" y="12" width="22" height="22" rx="3" fill="#F6EFE2" />
        <rect x="121" y="17" width="12" height="12" rx="2" fill="#14110F" />

        <rect x="6" y="110" width="34" height="34" rx="5" />
        <rect x="12" y="116" width="22" height="22" rx="3" fill="#F6EFE2" />
        <rect x="17" y="121" width="12" height="12" rx="2" fill="#14110F" />
      </g>

      {/* Celdas dinámicas únicas por nombre */}
      <g fill="#14110F">
        {cells.map(({ r, c }, idx) => (
          <rect
            key={idx}
            x={6 + c * 9.2}
            y={6 + r * 9.2}
            width="7.2"
            height="7.2"
            rx="1.8"
          />
        ))}
      </g>

      {/* Emblema central sol/estrella */}
      <rect x="61" y="61" width="28" height="28" rx="6" fill="#14110F" />
      <circle cx="75" cy="75" r="7" fill="#F2B749" />
    </svg>
  );
}

// ==========================================
// ILUSTRACIÓN VECTORIAL DEL FESTIVAL (ATARDECER CÁLIDO)
// ==========================================
function FestivalCrowdSVG({ isPresent }) {
  return (
    <svg
      viewBox="0 0 800 500"
      className="w-full h-full object-cover select-none pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="sunsetSkyGlow" cx="52%" cy="34%" r="68%">
          <stop offset="0%" stopColor={isPresent ? '#F2B749' : '#C86D44'} stopOpacity={isPresent ? '0.62' : '0.32'} />
          <stop offset="48%" stopColor={isPresent ? '#9E3E26' : '#33261F'} stopOpacity="0.82" />
          <stop offset="100%" stopColor="#14110F" stopOpacity="1" />
        </radialGradient>
        <linearGradient id="warmBeamLeft" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={isPresent ? '#F2B749' : '#7A9A82'} stopOpacity="0.38" />
          <stop offset="100%" stopColor="#F2B749" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="warmBeamRight" x1="100%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#E05A37" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#E05A37" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Cielo de atardecer amazónico / campus UNSM */}
      <rect width="800" height="500" fill="url(#sunsetSkyGlow)" />

      {/* Reflectores cálidos analógicos */}
      <polygon points="85,0 265,0 520,500 0,500" fill="url(#warmBeamLeft)" />
      <polygon points="715,0 535,0 280,500 800,500" fill="url(#warmBeamRight)" />

      {/* Sol de hora dorada en Tarapoto */}
      <circle
        cx="465"
        cy="172"
        r={isPresent ? '108' : '86'}
        fill={isPresent ? '#F2B749' : '#E05A37'}
        opacity={isPresent ? '0.32' : '0.16'}
      />
      <circle
        cx="465"
        cy="172"
        r="64"
        fill="none"
        stroke={isPresent ? '#F6EFE2' : '#F2B749'}
        strokeWidth="1.5"
        strokeDasharray="5 7"
        opacity="0.45"
      />

      {/* Siluetas de cordillera escalera y vegetación de fondo */}
      <path
        d="M 0,320 Q 170,265 350,305 T 690,285 L 800,310 L 800,500 L 0,500 Z"
        fill="#1F1916"
        opacity="0.85"
      />

      {/* Guirnaldas de bombillas cálidas tipo festival indie */}
      <path
        d="M -20,68 Q 220,140 450,82 T 830,112"
        fill="none"
        stroke="#F2B749"
        strokeWidth="1.5"
        opacity="0.55"
      />
      {[65, 145, 225, 305, 385, 465, 545, 625, 705, 765].map((cx, idx) => (
        <g key={cx}>
          <circle
            cx={cx}
            cy={86 + Math.sin(idx) * 15}
            r="5.5"
            fill={idx % 2 === 0 ? '#F6EFE2' : '#F2B749'}
            opacity="0.92"
          />
          <circle
            cx={cx}
            cy={86 + Math.sin(idx) * 15}
            r="14"
            fill={idx % 2 === 0 ? '#F2B749' : '#E05A37'}
            opacity="0.25"
          />
        </g>
      ))}

      {/* Colinas y explanada del anfiteatro */}
      <path d="M 0,362 Q 260,315 520,352 T 800,338 L 800,500 L 0,500 Z" fill="#181411" />
      <path d="M 0,398 Q 360,355 800,392 L 800,500 L 0,500 Z" fill="#120F0D" />

      {/* Siluetas de jóvenes compartiendo, conversando y celebrando */}
      <g fill="#0E0B0A" stroke={isPresent ? '#F2B749' : '#7A9A82'} strokeWidth="1.5">
        {/* Joven 1 */}
        <circle cx="332" cy="306" r="21" />
        <path d="M 297,430 C 297,356 367,356 367,430 Z" />
        <path d="M 307,366 L 278,298" strokeWidth="10" strokeLinecap="round" />
        <path d="M 356,366 L 385,292" strokeWidth="10" strokeLinecap="round" />

        {/* Joven 2 central */}
        <circle cx="456" cy="292" r="23" />
        <path d="M 416,435 C 416,346 496,346 496,435 Z" />
        <path d="M 426,356 L 396,286" strokeWidth="11" strokeLinecap="round" />
        <path d="M 486,356 L 524,282" strokeWidth="11" strokeLinecap="round" />

        {/* Joven 3 */}
        <circle cx="584" cy="308" r="20" />
        <path d="M 550,435 C 550,360 620,360 620,435 Z" />
        <path d="M 560,368 L 535,306" strokeWidth="9" strokeLinecap="round" />
        <path d="M 610,368 L 644,300" strokeWidth="9" strokeLinecap="round" />

        {/* Joven 4 */}
        <circle cx="704" cy="322" r="19" />
        <path d="M 672,445 C 672,372 738,372 738,445 Z" />
        <path d="M 680,375 L 660,322" strokeWidth="9" strokeLinecap="round" />
      </g>

      {/* Destellos cálidos cuando están en Modo Presente */}
      {isPresent && (
        <g stroke="#F6EFE2" strokeWidth="2.2" strokeLinecap="round">
          <path d="M 455,218 L 455,242 M 443,230 L 467,230" />
          <path d="M 620,235 L 620,253 M 611,244 L 629,244" />
          <path d="M 312,240 L 312,258 M 303,249 L 321,249" />
        </g>
      )}
    </svg>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL REACT
// ==========================================
export default function App() {
  // Parámetros iniciales desde la URL (?inv=Nombre&rol=docente&wa=519...)
  const initialData = useMemo(() => {
    if (typeof window === 'undefined') {
      return { name: 'Nicole', role: 'joven', wa: '', code: 'A6-VIP' };
    }
    const params = new URLSearchParams(window.location.search);
    const rawName =
      params.get('inv') ||
      params.get('nombre') ||
      params.get('invitado') ||
      params.get('n') ||
      'Nicole';
    const rawRole = params.get('rol') || params.get('tipo') || 'joven';
    const rawWa = params.get('wa') || '';
    const rawCode = params.get('pase') || 'A6-VIP';
    const isAdminUrl =
      params.get('admin') === '1' ||
      params.get('secret') === '1' ||
      window.location.hash === '#admin';

    const lower = rawName.toLowerCase();
    const isDocente =
      rawRole === 'docente' ||
      lower.includes('dra.') ||
      lower.includes('dr.') ||
      lower.includes('lic.') ||
      lower.includes('mg.') ||
      lower.includes('myriam');

    return {
      name: rawName.trim(),
      role: isDocente ? 'docente' : 'joven',
      wa: rawWa.trim(),
      code: rawCode.trim(),
      isAdminUrl,
    };
  }, []);

  // Estados principales
  const [guest, setGuest] = useState(initialData);
  const [screen, setScreen] = useState('lockscreen'); // 'lockscreen' | 'invitation'
  const [notifDropped, setNotifDropped] = useState(false);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Modales
  const [showAdminModal, setShowAdminModal] = useState(Boolean(initialData.isAdminUrl));
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  // Estado formulario Admin (Individual + Lista de Invitados en lote)
  const [adminTab, setAdminTab] = useState('single'); // 'single' | 'batch'
  const [adminForm, setAdminForm] = useState({
    name: initialData.name,
    role: initialData.role,
    wa: initialData.wa,
  });
  const [copiedUrl, setCopiedUrl] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [savedGuests, setSavedGuests] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('unsm_festival_guests_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: '1', name: 'Nicole', role: 'joven' },
      { id: '2', name: 'Thalia', role: 'joven' },
      { id: '3', name: 'Lic. Dra. Myriam Cristina Cango Ramírez', role: 'docente' },
    ];
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('unsm_festival_guests_v1', JSON.stringify(savedGuests));
    } catch (e) {}
  }, [savedGuests]);

  // Atajo de teclado secreto para escritorio: Ctrl + Shift + K (o Cmd + Shift + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setAdminForm((prev) => ({
          ...prev,
          name: guest.name,
          role: guest.role,
          wa: prev.wa || guest.wa,
        }));
        setShowAdminModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guest]);

  // Contador secreto de 5 toques en el encabezado UNSM
  const logoTapRef = useRef({ count: 0, timer: null });

  // Parallax del escenario 2.5D
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sparks, setSparks] = useState([]);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);

  // Reloj en tiempo real para la pantalla de bloqueo
  const [clockText, setClockText] = useState('18:00');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setClockText(`${hh}:${mm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 15000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // CONTADOR EN TIEMPO REAL HASTA EL 30 DE NOVIEMBRE 6:00 PM
  // ==========================================
  const [countdown, setCountdown] = useState({
    days: '23',
    hours: '06',
    minutes: '45',
    seconds: '00',
    isLive: false,
  });

  useEffect(() => {
    const computeRemaining = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      // 30 de Noviembre a las 18:00:00 (Hora Perú -05:00)
      let target = new Date(`${currentYear}-11-30T18:00:00-05:00`);
      if (now.getTime() > target.getTime() + 1000 * 60 * 60 * 6) {
        target = new Date(`${currentYear + 1}-11-30T18:00:00-05:00`);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
          isLive: true,
        });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
        isLive: false,
      });
    };

    computeRemaining();
    const timer = setInterval(computeRemaining, 1000);
    return () => clearInterval(timer);
  }, []);

  // Caída automática de la notificación a los 1.2 segundos
  useEffect(() => {
    if (screen !== 'lockscreen') return;
    setNotifDropped(false);
    const timer = setTimeout(() => {
      setNotifDropped(true);
      soundFX.playNotificationDing();
    }, 1150);
    return () => clearTimeout(timer);
  }, [screen, guest.name]);

  // Helper para mostrar notificaciones flotantes (Toast)
  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(''), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Partículas cálidas tipo luciérnagas en Canvas 2D
  useEffect(() => {
    if (screen !== 'invitation') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const particles = Array.from({ length: 42 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.9 + (i % 3) * 0.65,
      speed: 0.00025 + (i % 5) * 0.00012,
      phase: i * 0.7,
      colorIndex: i % 4,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width);
      canvas.height = Math.max(1, rect.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (now) => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const t = now * 0.001;
      // Paleta cálida analógica: Ámbar, Terracota, Crema y Salvia
      const palette = isPresentMode
        ? ['242, 183, 73', '246, 239, 226', '224, 90, 55', '122, 154, 130']
        : ['242, 183, 73', '224, 90, 55', '122, 154, 130', '246, 239, 226'];

      particles.forEach((p) => {
        const px = ((p.x + Math.sin(t + p.phase) * 0.025 + 1) % 1) * w;
        const py = (((p.y - t * p.speed * 16) % 1) + 1) % 1 * h;
        const alpha = 0.16 + 0.48 * Math.abs(Math.sin(t * 1.1 + p.phase));

        ctx.fillStyle = `rgba(${palette[p.colorIndex]}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [screen, isPresentMode]);

  useEffect(() => {
    return () => soundFX.stopAmbient();
  }, []);

  const handleOpenInvitation = () => {
    soundFX.playNotificationDing();
    setScreen('invitation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStagePointerMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    setTilt({ x: nx, y: ny });
  };

  const handleStagePointerDown = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSparks((prev) => [...prev.slice(-8), { id, x, y }]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id));
    }, 750);
  };

  const handleTogglePhoneMode = (e) => {
    e.stopPropagation();
    const next = !isPresentMode;
    setIsPresentMode(next);
    soundFX.playModeSwitch(next);
    triggerToast(
      next
        ? '✨ Modo Presente activado: el ruido se apaga y empieza el encuentro.'
        : '📱 Volviste al Modo Automático (99+ notificaciones).'
    );
  };

  const handleToggleSound = (e) => {
    e.stopPropagation();
    const active = soundFX.toggleAmbient();
    setSoundEnabled(active);
    triggerToast(active ? '🎵 Acordes acústicos activados' : '🔇 Sonido ambiental desactivado');
  };

  const handleLogoClick = () => {
    logoTapRef.current.count += 1;
    clearTimeout(logoTapRef.current.timer);
    logoTapRef.current.timer = setTimeout(() => {
      logoTapRef.current.count = 0;
    }, 2500);

    if (logoTapRef.current.count >= 5) {
      logoTapRef.current.count = 0;
      setAdminForm((prev) => ({
        name: guest.name,
        role: guest.role,
        wa: prev.wa || guest.wa,
      }));
      setShowAdminModal(true);
    }
  };

  // Construir URL personalizada para cualquier invitado
  const buildGuestUrl = (guestName, guestRole, receptorWa) => {
    const base =
      window.location.origin && window.location.origin !== 'null'
        ? window.location.origin + window.location.pathname
        : 'https://tu-app-unsm.onrender.com/';
    const params = new URLSearchParams();
    params.set('inv', (guestName || 'Nicole').trim());
    if (guestRole === 'docente') params.set('rol', 'docente');
    if ((receptorWa || '').trim()) params.set('wa', receptorWa.trim());
    return `${base}?${params.toString()}`;
  };

  // Confirmar asistencia por WhatsApp (sin mencionar número de estudiantes)
  const handleConfirmWhatsApp = () => {
    soundFX.playModeSwitch(true);
    const isDoc = guest.role === 'docente';
    const message = isDoc
      ? `¡Hola Escuela Profesional de Enfermería UNSM! 🎓 Soy ${guest.name} y confirmo mi participación de honor en "¿Quién controla a quién? El Festival de la Desconexión" este 30 de noviembre a las 6:00 PM en el Aula A6.`
      : `¡Hola UNSM Enfermería! ✨ Soy ${guest.name} y confirmo mi asistencia a "¿Quién controla a quién? El Festival de la Desconexión" este 30 de noviembre a las 6:00 PM en el Aula A6. ¡Ahí nos vemos!`;

    const cleanPhone = (guest.wa || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    triggerToast('🌿 Abriendo WhatsApp para confirmar tu asistencia...');
  };

  // Abrir ubicación exacta de la Ciudad Universitaria UNSM en Google Maps
  const handleOpenGoogleMaps = () => {
    const mapsUrl =
      'https://www.google.com/maps/place//data=!4m2!3m1!19sChIJJWqJueULupERcANvAia3jNA';
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLocation = () => {
    const text = 'Aula A6 - Ciudad Universitaria UNSM, Jr. Amorarca 315, Morales - Tarapoto';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedAddress(true);
    triggerToast('📍 Dirección del Aula A6 - UNSM copiada');
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  // Descargar archivo de calendario (.ics)
  const handleDownloadCalendar = () => {
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UNSM Enfermeria//Festival de la Desconexion//ES',
      'BEGIN:VEVENT',
      'UID:festival-desconexion-unsm-2026@unsm.edu.pe',
      'DTSTAMP:20261107T120000Z',
      'DTSTART:20261130T230000Z',
      'DTEND:20261201T010000Z',
      'SUMMARY:¿Quién controla a quién? | Festival de la Desconexión UNSM',
      'LOCATION:Aula A6, Ciudad Universitaria UNSM (Jr. Amorarca 315, Tarapoto)',
      'DESCRIPTION:Encuentro vivencial e íntimo. Juegos, retos y desconexión activa. Organiza: Escuela Profesional de Enfermería UNSM.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Festival_Desconexion_UNSM.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    triggerToast('📅 Evento guardado para tu calendario (30 NOV · 6:00 PM)');
  };

  // Compartir invitación
  const handleShare = async () => {
    const shareData = {
      title: '¿Quién controla a quién? · UNSM Enfermería',
      text: `Invitación personal para ${guest.name} al Festival de la Desconexión UNSM (30 Nov, 6:00 PM, Aula A6).`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast('🔗 Enlace de invitación copiado al portapapeles');
      }
    } catch (err) {
      triggerToast('🔗 Copia el enlace desde la barra de tu navegador');
    }
  };

  // Generar y copiar enlace personalizado desde el panel organizador
  const handleGenerateCustomLink = () => {
    const fullUrl = buildGuestUrl(adminForm.name, adminForm.role, adminForm.wa);
    setCopiedUrl(fullUrl);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).catch(() => {});
    }
    triggerToast('✅ Link personalizado copiado al portapapeles');
  };

  // Agregar varios nombres separados por coma o salto de línea a la lista del organizador
  const handleAddBatchGuests = () => {
    if (!batchInput.trim()) return;
    const rawNames = batchInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!rawNames.length) return;

    const newEntries = rawNames.map((n) => {
      const lower = n.toLowerCase();
      const autoDocente =
        lower.includes('dra.') ||
        lower.includes('dr.') ||
        lower.includes('lic.') ||
        lower.includes('mg.');
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: n,
        role: autoDocente ? 'docente' : 'joven',
      };
    });

    setSavedGuests((prev) => [...prev, ...newEntries]);
    setBatchInput('');
    triggerToast(`✨ ${newEntries.length} invitado(s) añadido(s) a tu lista`);
  };

  const handleCopyFromList = (item) => {
    const url = buildGuestUrl(item.name, item.role, adminForm.wa || guest.wa);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedUrl(url);
    triggerToast(`🔗 Link de ${item.name} copiado`);
  };

  const handleSendWhatsAppToGuest = (item) => {
    const url = buildGuestUrl(item.name, item.role, adminForm.wa || guest.wa);
    const text =
      item.role === 'docente'
        ? `¡Hola ${item.name}! 🎓 Le enviamos su pase de honor interactivo para «¿Quién controla a quién? El Festival de la Desconexión» de la UNSM (30 de noviembre, 6:00 PM, Aula A6):\n\n${url}`
        : `¡Hola ${item.name}! ✨ Te enviamos tu pase personal para «¿Quién controla a quién? El Festival de la Desconexión» en la UNSM (30 de noviembre, 6:00 PM, Aula A6). Ábrelo aquí:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handlePreviewGuest = () => {
    setGuest({
      name: adminForm.name.trim() || 'Nicole',
      role: adminForm.role,
      wa: adminForm.wa.trim(),
      code: 'A6-VIP',
    });
    setShowAdminModal(false);
    setScreen('lockscreen');
  };

  const isDocente = guest.role === 'docente';
  const passSerial = useMemo(() => {
    const clean = guest.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'INV';
    return `UNSM-A6-${clean}`;
  }, [guest.name]);

  return (
    <div className="min-h-screen w-full bg-[#120F0D] text-[#F6EFE2] font-sans overflow-x-hidden selection:bg-[#F2B749] selection:text-[#14110F]">
      {/* Tipografías editoriales cálidas */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;700;800&family=Space+Mono:wght@400;700&display=swap');
        .font-poster { font-family: 'Barlow Condensed', Impact, sans-serif; }
        .font-mono-tech { font-family: 'Space Mono', monospace; }
        .font-body { font-family: 'DM Sans', sans-serif; }
        @keyframes dropBanner {
          0% { opacity: 0; transform: translateY(-120%) scale(0.94); }
          70% { opacity: 1; transform: translateY(6px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-drop-banner {
          animation: dropBanner 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-9px) rotate(-1.5deg); }
        }
        .animate-float-phone {
          animation: floatPhone 4.6s ease-in-out infinite;
        }
      `}</style>

      {/* =====================================================================
          PANTALLA 1: PANTALLA DE BLOQUEO CÁLIDA + NOTIFICACIÓN PERSONALIZADA
      ===================================================================== */}
      {screen === 'lockscreen' && (
        <main
          onClick={() => {
            if (!notifDropped) {
              setNotifDropped(true);
              soundFX.playNotificationDing();
            }
          }}
          className="relative min-h-screen w-full bg-[#0E0C0A] flex flex-col items-center justify-between px-4 py-6 select-none cursor-pointer overflow-hidden"
        >
          {/* Resplandor cálido de hora dorada */}
          <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#E05A37]/15 blur-[110px]" />
          <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#F2B749]/10 blur-[100px]" />

          {/* Barra superior y Reloj de bloqueo */}
          <div className="w-full max-w-[400px] flex flex-col items-center pt-4 z-10">
            <div className="flex items-center gap-1.5 text-[#A89B8C] text-xs font-medium mb-2">
              <Lock className="w-3.5 h-3.5 text-[#F2B749]" />
              <span>UNSM • TARAPOTO</span>
            </div>
            <div className="text-6xl sm:text-7xl font-light tracking-tight text-[#F6EFE2] font-body">
              {clockText}
            </div>
            <p className="text-xs text-[#A89B8C] mt-1">
              Lunes, 30 de noviembre • Festival de la Desconexión
            </p>

            {/* Banner de Notificación Push (Sin mencionar cantidad de estudiantes) */}
            {notifDropped ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenInvitation();
                }}
                className="w-full mt-7 rounded-[24px] p-4 sm:p-5 bg-[#1E1916]/95 backdrop-blur-2xl border border-[#F6EFE2]/15 shadow-[0_24px_55px_rgba(0,0,0,0.9),0_0_30px_rgba(242,183,73,0.12)] hover:scale-[1.01] active:scale-[0.98] transition-transform animate-drop-banner"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[7px] bg-[#7A9A82] flex items-center justify-center text-[13px] shadow-sm shrink-0">
                      💬
                    </div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#D5C7B8]">
                      INVITACIÓN PERSONAL • UNSM ENFERMERÍA
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A89B8C] shrink-0">Ahora</span>
                </div>

                <p className="text-[15px] font-bold text-[#F6EFE2] leading-snug">
                  📲 ¡Hola, {guest.name}! Te llegó una invitación especial de la UNSM...
                </p>

                <p className="text-[13.5px] text-[#D8CBB8] mt-1 leading-relaxed">
                  {isDocente
                    ? 'Es nuestra Invitada de Honor en «¿Quién controla a quién? El Festival de la Desconexión». Una velada vivencial para reconectar más allá de las pantallas. Toque para abrir su pase.'
                    : 'Fuiste elegido/a para vivir «¿Quién controla a quién? El Festival de la Desconexión». ¡No es una charla más! Una pausa real con juegos, retos y sorpresas. Toca para abrir tu pase.'}
                </p>

                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#F6EFE2]/10 text-[11px] text-[#F2B749] font-semibold">
                  <span>✨ Toca aquí para descubrir tu invitación</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>

                <div className="mt-2.5 flex justify-center">
                  <div className="w-9 h-1 rounded-full bg-[#A89B8C]/40" />
                </div>
              </div>
            ) : (
              <div className="mt-16 flex flex-col items-center text-center px-6 py-8">
                <div className="w-12 h-12 rounded-full bg-[#1C1815] border border-[#F2B749]/30 flex items-center justify-center text-xl mb-3 animate-pulse">
                  📲
                </div>
                <p className="text-xs text-[#A89B8C]">
                  Recibiendo tu pase personal de UNSM Enfermería...
                </p>
              </div>
            )}
          </div>

          {/* Pie de pantalla de bloqueo */}
          <div className="w-full max-w-[400px] flex flex-col items-center gap-3 pb-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInvitation();
              }}
              className="px-5 py-2.5 rounded-full bg-[#F6EFE2]/10 hover:bg-[#F6EFE2]/15 border border-[#F6EFE2]/20 text-xs font-semibold text-[#F6EFE2] flex items-center gap-2 transition"
            >
              <Bell className="w-3.5 h-3.5 text-[#F2B749]" />
              Abrir mi invitación ahora
            </button>
            <div className="w-32 h-1 rounded-full bg-[#A89B8C]/30" />
          </div>
        </main>
      )}

      {/* =====================================================================
          PANTALLA 2: EL PÓSTER / ARTEFACTO EDITORIAL CÁLIDO DEL FESTIVAL
      ===================================================================== */}
      {screen === 'invitation' && (
        <section className="relative min-h-screen w-full flex flex-col items-center justify-start sm:justify-center sm:py-8 sm:px-4 bg-[#120F0D] overflow-hidden">
          {/* Luces volumétricas cálidas de atardecer */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -left-24 top-10 w-96 h-96 rounded-full bg-[#E05A37]/15 blur-[100px]" />
            <div className="absolute -right-24 bottom-10 w-96 h-96 rounded-full bg-[#F2B749]/12 blur-[100px]" />
          </div>

          {/* Contenedor del Póster Editorial (Max 500px) */}
          <article className="relative z-10 w-full max-w-[500px] bg-gradient-to-b from-[#231B16] via-[#1A1512] to-[#14110F] sm:rounded-2xl shadow-[0_30px_120px_rgba(0,0,0,0.9)] border border-[#F2B749]/25 overflow-hidden">
            {/* Canvas de Luciérnagas Cálidas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* 1. CABECERA INSTITUCIONAL UNSM (5 toques silenciosos abren el panel secreto) */}
            <header className="relative z-20 pt-4 px-5 flex flex-col items-center gap-2">
              <div
                onClick={handleLogoClick}
                className="w-full max-w-[345px] bg-[#2B211B]/90 border border-[#F6EFE2]/15 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-md backdrop-blur-md select-none cursor-default"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#7A9A82]/25 border border-[#7A9A82] flex items-center justify-center text-[11px] font-black text-[#CBE0D0] shrink-0">
                    UNSM
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold tracking-wider uppercase text-[#D8CBB8]">
                      Universidad Nacional de San Martín
                    </p>
                    <p className="text-[10.5px] font-extrabold text-[#F6EFE2]">
                      Facultad de Ciencias de la Salud • Enfermería
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono-tech font-bold px-2 py-0.5 rounded bg-[#F2B749]/15 text-[#F2B749] border border-[#F2B749]/30">
                  FCS
                </span>
              </div>

              <div className="w-full flex items-center justify-center gap-2 font-mono-tech text-[9px] font-bold tracking-[0.18em] uppercase text-[#D8CBB8]">
                <span className="text-[#E05A37]">●</span>
                <span>EDICIÓN ÍNTIMA & VIVENCIAL</span>
                <span className="text-[#F2B749] tracking-normal ml-1">2026—II</span>
              </div>
            </header>

            {/* 2. TITULAR GIGANTE EDITORIAL */}
            <div className="relative z-20 px-5 pt-3 text-center select-none">
              <div className="flex items-center justify-between font-mono-tech text-[9px] font-bold tracking-[0.15em] uppercase text-[#D8CBB8] mb-1">
                <span className="text-[#7A9A82]">PASE PERSONAL</span>
                <span>EL FESTIVAL DE LA DESCONEXIÓN</span>
              </div>

              <h1
                aria-label="¿Quién controla a quién?"
                className="font-poster font-black uppercase text-[62px] xs:text-[72px] sm:text-[86px] leading-[0.8] tracking-tight drop-shadow-[2px_6px_0px_#0E0B09]"
              >
                <span className="block text-[#F6EFE2] -rotate-2 -translate-x-2">
                  ¿QUIÉN
                </span>
                <span className="block text-[#F2B749] rotate-1 scale-x-95 drop-shadow-[0_4px_18px_rgba(242,183,73,0.25)]">
                  CONTROLA
                </span>
                <span className="block text-[#F6EFE2] -rotate-1 translate-x-2">
                  A QUIÉN<span className="text-[#E05A37]">?</span>
                </span>
              </h1>

              <p className="mt-2.5 font-body text-xs sm:text-sm text-[#E6Decf]">
                El celular conecta.{' '}
                <strong className="font-black text-[#F2B749] text-sm sm:text-base">
                  Este encuentro nos reúne.
                </strong>
              </p>

              <div className="mt-1.5 inline-flex items-center gap-2 font-mono-tech text-[8px] font-bold tracking-[0.15em] uppercase text-[#CBE0D0]">
                <span>UNA PAUSA REAL • MÚSICA, JUEGOS & CONEXIÓN HUMANA</span>
                <span className="text-[#E05A37] text-sm">✳</span>
              </div>
            </div>

            {/* 3. DIORAMA INTERACTIVO 2.5D + TELÉFONO TÁCTIL */}
            <div
              ref={stageRef}
              onPointerMove={handleStagePointerMove}
              onPointerDown={handleStagePointerDown}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              className="relative z-20 w-full h-[255px] sm:h-[295px] mt-2 overflow-hidden cursor-pointer select-none"
            >
              {/* Escenario con Parallax */}
              <div
                style={{
                  transform: `translate3d(${tilt.x * -10}px, ${tilt.y * -7}px, 0) scale(1.05)`,
                  transition: 'transform 0.18s ease-out',
                }}
                className="absolute inset-0"
              >
                <FestivalCrowdSVG isPresent={isPresentMode} />
              </div>

              {/* Etiqueta superior izquierda */}
              <div className="absolute top-3 left-3 z-20 bg-[#14110F]/90 border border-[#F2B749]/40 px-2.5 py-1 -rotate-2 font-mono-tech text-[8px] font-bold tracking-wider text-[#F6EFE2] shadow">
                ● ENCUENTRO EN VIVO <span className="text-[#E05A37]">◆</span> SIN FILTROS
              </div>

              {/* Botón de Sonido Acústico */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono-tech text-[8px] font-bold tracking-wider border backdrop-blur-md transition ${
                  soundEnabled
                    ? 'bg-[#F2B749] text-[#14110F] border-[#F6EFE2] shadow-[0_0_15px_rgba(242,183,73,0.5)]'
                    : 'bg-[#1C1815]/90 text-[#F6EFE2] border-[#F6EFE2]/30 hover:border-[#F2B749]'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>ACÚSTICO ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>SONIDO AMBIENTE</span>
                  </>
                )}
              </button>

              {/* Burbuja flotante contextual */}
              {!isPresentMode ? (
                <div className="absolute top-12 right-4 z-20 max-w-[152px] bg-[#1E1916]/95 border border-[#E05A37]/60 rounded-lg px-2.5 py-1.5 -rotate-2 font-mono-tech text-[8px] font-bold text-[#F6EFE2] shadow-lg pointer-events-none">
                  ✳ <span className="text-[#F2B749]">¿PILOTO AUTOMÁTICO?</span>
                  <div className="text-[7px] text-[#D8CBB8] font-normal mt-0.5">
                    Toca el celular para elegir estar presente
                  </div>
                </div>
              ) : (
                <div className="absolute top-12 right-4 z-20 max-w-[162px] bg-[#7A9A82]/95 border border-[#F6EFE2] rounded-lg px-2.5 py-1.5 rotate-2 font-mono-tech text-[8px] font-bold text-[#14110F] shadow-lg pointer-events-none">
                  <Sun className="w-3 h-3 inline mr-1" />
                  <span>¡MODO PRESENTE ACTIVO!</span>
                  <div className="text-[7px] text-[#14110F]/80 font-normal mt-0.5">
                    Tú decides a qué darle tu tiempo
                  </div>
                </div>
              )}

              {/* TELÉFONO 3D INTERACTIVO */}
              <div
                style={{
                  transform: `translate3d(${tilt.x * 9}px, ${tilt.y * 6}px, 0)`,
                }}
                className="absolute top-7 left-6 sm:left-10 z-30 w-[106px] sm:w-[120px] h-[192px] sm:h-[214px]"
              >
                <div
                  className={`absolute -inset-6 rounded-full blur-xl transition-colors duration-500 ${
                    isPresentMode ? 'bg-[#F2B749]/40' : 'bg-[#7A9A82]/25'
                  }`}
                />

                <button
                  type="button"
                  onClick={handleTogglePhoneMode}
                  aria-label="Toca el teléfono para cambiar a Modo Presente"
                  className="relative w-full h-full rounded-[24px] p-1.5 bg-gradient-to-br from-[#D8CBB8] via-[#2C241E] to-[#120E0C] border-2 border-[#F2B749] shadow-[0_12px_30px_rgba(0,0,0,0.75),8px_12px_0px_-5px_#E05A37] animate-float-phone focus:outline-none"
                >
                  <div
                    className={`relative w-full h-full rounded-[18px] overflow-hidden flex flex-col items-center justify-between p-2 transition-all duration-500 ${
                      isPresentMode
                        ? 'bg-gradient-to-b from-[#F6EFE2] via-[#F2B749] to-[#E05A37] text-[#1C140F]'
                        : 'bg-gradient-to-b from-[#3A4E58] via-[#25333A] to-[#162025] text-[#E2ECEF]'
                    }`}
                  >
                    <div className="w-10 h-2 rounded-full bg-black/80" />

                    <div className="w-full flex justify-between font-mono-tech text-[6.5px] font-bold px-0.5 opacity-80">
                      <span>UNSM</span>
                      <span>{isPresentMode ? 'LIBRE' : '99+'}</span>
                    </div>

                    <div className="my-auto flex flex-col items-center text-center">
                      <span className="font-poster font-black text-5xl sm:text-6xl leading-none tracking-tighter">
                        {isPresentMode ? 'AQUÍ' : '99+'}
                      </span>
                      <span className="mt-1 font-mono-tech text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-black/15">
                        {isPresentMode ? 'MODO PRESENTE' : 'RUIDO DIGITAL'}
                      </span>
                    </div>

                    <div className="text-[7px] font-mono-tech font-bold uppercase tracking-wider">
                      {isPresentMode ? '✦ VIDA REAL' : '👆 TOCA AQUÍ'}
                    </div>
                    <div className="w-8 h-1 rounded-full bg-black/50" />
                  </div>
                </button>
              </div>

              {/* Etiqueta inferior derecha */}
              <div
                onClick={handleTogglePhoneMode}
                className={`absolute bottom-4 right-3 z-30 px-2.5 py-1.5 font-mono-tech text-[8px] font-bold tracking-wider border-l-2 shadow-lg transition-all ${
                  isPresentMode
                    ? 'bg-[#F2B749] text-[#14110F] border-[#E05A37]'
                    : 'bg-[#14110F]/90 text-[#F6EFE2] border-[#F2B749]'
                }`}
              >
                {isPresentMode
                  ? '✦ TU ATENCIÓN ES TUYA · NOS VEMOS EN EL AULA A6'
                  : '✦ TOCA EL TELÉFONO · APAGA EL PILOTO AUTOMÁTICO ↗'}
              </div>

              {/* Ondas al tocar */}
              {sparks.map((s) => (
                <span
                  key={s.id}
                  style={{ left: s.x, top: s.y }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-[#F2B749] animate-ping"
                />
              ))}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#14110F] to-transparent z-10" />
            </div>

            {/* 4. CUERPO DEL BOLETO: INVITADO, QR INTEGRADO, CONTADOR Y MAPA */}
            <div className="relative z-20 px-5 pb-5 pt-2 bg-[#14110F]">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E05A37] to-[#F2B749] opacity-80 mb-3.5" />

              {/* BOLETO PERSONAL + QR INTEGRADO */}
              <div className="rounded-2xl bg-[#1E1915] border border-[#F6EFE2]/15 p-3.5 sm:p-4 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7A9A82]/20 border border-[#7A9A82]/50 font-mono-tech text-[8.5px] font-bold uppercase tracking-wider text-[#CBE0D0] mb-1.5">
                      {isDocente ? (
                        <>
                          <Award className="w-3 h-3 text-[#F2B749]" />
                          <span>Pase de Honor Docente • UNSM</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-[#F2B749]" />
                          <span>Invitación Personal • Edición Íntima</span>
                        </>
                      )}
                    </div>

                    <span className="block font-mono-tech text-[8.5px] font-bold uppercase tracking-widest text-[#A89B8C]">
                      RESERVADO ESPECIALMENTE PARA:
                    </span>
                    <h2 className="font-poster font-black uppercase text-4xl sm:text-5xl text-[#F2B749] tracking-wide break-words leading-[0.95] mt-0.5">
                      {guest.name}
                    </h2>

                    <p className="mt-2 text-xs text-[#D8CBB8] leading-relaxed font-body">
                      {isDocente ? (
                        <>
                          Es un honor contar con su presencia en esta jornada vivencial donde
                          promoveremos el uso consciente del celular mediante dinámicas
                          recreativas y reflexión activa.
                        </>
                      ) : (
                        <>
                          <strong className="text-[#F6EFE2]">
                            ¡{guest.name}, no es una charla aburrida más!
                          </strong>{' '}
                          Te esperamos para desconectar del ruido digital con juegos en vivo,
                          retos grupales y sorpresas en la UNSM.
                        </>
                      )}
                    </p>
                  </div>

                  {/* QR Personalizado Integrado en la Tarjeta */}
                  <div
                    onClick={() => setShowPassModal(true)}
                    className="flex flex-col items-center cursor-pointer group shrink-0"
                    title="Toca para ampliar tu pase QR"
                  >
                    <PersonalQRMatrix seedText={passSerial} size={82} />
                    <span className="mt-1 font-mono-tech text-[7.5px] font-bold tracking-wider text-[#F2B749] group-hover:underline">
                      {passSerial}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTADOR EN TIEMPO REAL HASTA EL EVENTO */}
              <div className="mt-4 rounded-xl bg-[#1A1512] border border-[#E05A37]/35 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-tech text-[8.5px] font-bold uppercase tracking-widest text-[#E05A37] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E05A37] animate-ping" />
                    CUENTA REGRESIVA EN TIEMPO REAL
                  </span>
                  <span className="font-mono-tech text-[8px] text-[#A89B8C]">
                    30 NOV • 6:00 PM
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'DÍAS', value: countdown.days },
                    { label: 'HORAS', value: countdown.hours },
                    { label: 'MINUTOS', value: countdown.minutes },
                    { label: 'SEGUNDOS', value: countdown.seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-[#120F0D] border border-[#F6EFE2]/10 py-2 px-1"
                    >
                      <span className="block font-poster font-black text-3xl sm:text-4xl leading-none text-[#F6EFE2]">
                        {item.value}
                      </span>
                      <span className="block font-mono-tech text-[7.5px] font-bold tracking-wider text-[#F2B749] mt-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRILLA DE FECHA / HORA / LUGAR */}
              <div className="mt-4 py-3 border-y border-[#F6EFE2]/15 grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2">
                  <strong className="font-poster font-black text-5xl sm:text-6xl leading-none text-[#F6EFE2]">
                    30
                  </strong>
                  <div className="flex flex-col font-mono-tech text-[10px] leading-tight text-[#D8CBB8]">
                    <b className="font-poster text-xl text-[#F2B749] tracking-wide">NOV</b>
                    <span>LUNES</span>
                  </div>
                </div>

                <div className="pl-3 border-l border-[#F6EFE2]/15 flex flex-col">
                  <span className="font-mono-tech text-[8px] font-bold uppercase tracking-wider text-[#7A9A82] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> HORA
                  </span>
                  <strong className="font-poster font-black text-2xl sm:text-3xl text-[#F6EFE2] leading-tight mt-0.5">
                    6:00 <small className="text-[#F2B749] text-sm">PM</small>
                  </strong>
                </div>

                <div className="pl-3 border-l border-[#F6EFE2]/15 flex flex-col">
                  <span className="font-mono-tech text-[8px] font-bold uppercase tracking-wider text-[#7A9A82] flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> LUGAR
                  </span>
                  <strong className="font-poster font-black text-2xl sm:text-3xl text-[#F6EFE2] leading-tight mt-0.5">
                    AULA <em className="not-italic text-[#E05A37]">A6</em>
                  </strong>
                </div>
              </div>

              {/* TARJETA DE UBICACIÓN CON GOOGLE MAPS */}
              <div className="mt-3.5 rounded-xl bg-[#1E1915] border border-[#7A9A82]/40 p-3 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#7A9A82]/20 border border-[#7A9A82] flex items-center justify-center text-[#CBE0D0] shrink-0 mt-0.5">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono-tech text-[8px] font-bold uppercase tracking-wider text-[#7A9A82]">
                        UBICACIÓN DEL ENCUENTRO
                      </span>
                      <h3 className="font-body font-bold text-xs sm:text-sm text-[#F6EFE2]">
                        Aula A6 • Ciudad Universitaria UNSM
                      </h3>
                      <p className="text-[11px] text-[#A89B8C]">
                        Jr. Amorarca 315, Morales • Tarapoto
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="py-2 px-3 rounded-lg bg-[#7A9A82] hover:bg-[#89aa91] text-[#120F0D] font-body font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Abrir en Google Maps</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLocation}
                    className="py-2 px-3 rounded-lg bg-[#14110F] hover:bg-black/60 text-[#D8CBB8] border border-[#F6EFE2]/15 font-body font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#7A9A82]" />
                        <span>Dirección copiada</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar referencia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* BOTÓN PRINCIPAL: CONFIRMAR ASISTENCIA POR WHATSAPP */}
              <button
                type="button"
                onClick={handleConfirmWhatsApp}
                className="mt-4 relative w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#E05A37] via-[#F2B749] to-[#E8993E] text-[#14110F] font-poster font-black text-2xl sm:text-3xl tracking-wide flex items-center justify-between shadow-[0_10px_28px_rgba(224,90,55,0.3)] hover:-translate-y-0.5 active:scale-[0.99] transition"
              >
                <span>CONFIRMAR MI ASISTENCIA</span>
                <span className="w-8 h-8 rounded-full bg-[#14110F] text-[#F2B749] flex items-center justify-center text-lg">
                  ↗
                </span>
              </button>

              {/* Microcopy de vestimenta */}
              <p className="mt-2.5 text-[11px] text-center text-[#D8CBB8] font-body">
                👟 Ven con <strong className="text-[#F2B749]">ropa cómoda y zapatillas</strong> para
                disfrutar los juegos y retos con total libertad.
              </p>

              {/* BARRA SECUNDARIA DE ACCIONES (Limpia, sin ningún botón de edición/admin) */}
              <nav className="mt-3.5 pt-3 border-t border-[#F6EFE2]/10 grid grid-cols-4 gap-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowPassModal(true)}
                  className="py-1.5 px-1 rounded-lg hover:bg-white/5 text-[#D8CBB8] hover:text-[#F2B749] font-body text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pase QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTipsModal(true)}
                  className="py-1.5 px-1 rounded-lg hover:bg-white/5 text-[#D8CBB8] hover:text-[#F2B749] font-body text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Vestimenta</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCalendar}
                  className="py-1.5 px-1 rounded-lg hover:bg-white/5 text-[#D8CBB8] hover:text-[#F2B749] font-body text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="py-1.5 px-1 rounded-lg hover:bg-white/5 text-[#D8CBB8] hover:text-[#F2B749] font-body text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </button>
              </nav>

              {/* Pie limpio centrado únicamente con "Ver notificación inicial" */}
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-center text-[10px] text-[#A89B8C]">
                <button
                  type="button"
                  onClick={() => setScreen('lockscreen')}
                  className="hover:text-[#F2B749] flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Repetir animación de bienvenida</span>
                </button>
              </div>
            </div>

            {/* 5. CINTA INFERIOR DE CIERRE DEL TICKET */}
            <footer className="relative z-20 bg-[#F2B749] text-[#14110F] px-4 py-2 flex items-center justify-between font-mono-tech text-[8px] font-extrabold tracking-tight">
              <span>DESCONECTA DEL CELULAR</span>
              <b className="text-sm">✦</b>
              <span>CONECTA CON LA VIDA • UNSM</span>
            </footer>
          </article>
        </section>
      )}

      {/* =====================================================================
          MODAL 3: PANEL SECRETO DEL ORGANIZADOR (INDIVIDUAL + LISTA DE 15 INVITADOS)
      ===================================================================== */}
      {showAdminModal && (
        <div
          onClick={() => setShowAdminModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#1C1714] border border-[#F2B749]/35 p-5 text-[#F6EFE2] shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A9A82]">
                  🔒 Modo Organizador Secreto • UNSM
                </span>
                <h3 className="text-base font-extrabold text-[#F6EFE2] mt-0.5">
                  Generador de Invitaciones Personalizadas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 text-[#D8CBB8] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de pestaña: Individual vs Lista de Invitados */}
            <div className="grid grid-cols-2 gap-1.5 bg-[#120F0D] p-1 rounded-xl border border-white/10 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setAdminTab('single')}
                className={`py-2 rounded-lg font-bold transition ${
                  adminTab === 'single'
                    ? 'bg-[#F2B749] text-[#14110F]'
                    : 'text-[#A89B8C] hover:text-[#F6EFE2]'
                }`}
              >
                Link Individual
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('batch')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  adminTab === 'batch'
                    ? 'bg-[#F2B749] text-[#14110F]'
                    : 'text-[#A89B8C] hover:text-[#F6EFE2]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mi Lista ({savedGuests.length})</span>
              </button>
            </div>

            {/* Campo común: WhatsApp receptor del organizador */}
            <div className="text-xs shrink-0">
              <label className="block font-bold text-[#D8CBB8] mb-1">
                Tu WhatsApp receptor de confirmaciones (con código 51)
              </label>
              <input
                type="text"
                value={adminForm.wa}
                onChange={(e) => setAdminForm({ ...adminForm, wa: e.target.value })}
                placeholder="Ej. 51987654321"
                className="w-full px-3 py-2 rounded-xl bg-[#120F0D] border border-white/15 text-[#F6EFE2] focus:outline-none focus:border-[#F2B749]"
              />
            </div>

            {adminTab === 'single' ? (
              <div className="space-y-3 text-xs overflow-y-auto pr-1">
                <div>
                  <label className="block font-bold text-[#D8CBB8] mb-1">
                    Nombre del Invitado(a)
                  </label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="Ej. Nicole / Carlos / Dra. Myriam Cango"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#120F0D] border border-white/15 text-[#F6EFE2] focus:outline-none focus:border-[#F2B749]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#D8CBB8] mb-1">
                    Tipo de Pase
                  </label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#120F0D] border border-white/15 text-[#F6EFE2]"
                  >
                    <option value="joven">Invitado/a Joven (Pase Personal)</option>
                    <option value="docente">Docente de Honor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateCustomLink}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E05A37] to-[#F2B749] text-[#14110F] font-black flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link Único para esta Persona</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewGuest}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-[#F6EFE2] font-bold border border-white/15 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Simular Entrada con Notificación y Sonido</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
                <div>
                  <label className="block font-bold text-[#D8CBB8] mb-1">
                    Agregar invitados (escribe uno o varios separados por coma)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBatchGuests();
                        }
                      }}
                      placeholder="Ej. Andrea, Sebastián, Valeria, Diego..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#120F0D] border border-white/15 text-[#F6EFE2] focus:outline-none focus:border-[#F2B749]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBatchGuests}
                      className="px-3 py-2 rounded-xl bg-[#7A9A82] text-[#14110F] font-bold flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {savedGuests.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#120F0D] border border-white/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#F6EFE2] truncate">
                          {idx + 1}. {item.name}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setSavedGuests((prev) =>
                              prev.map((g) =>
                                g.id === item.id
                                  ? { ...g, role: g.role === 'docente' ? 'joven' : 'docente' }
                                  : g
                              )
                            )
                          }
                          className="text-[10px] text-[#F2B749] hover:underline"
                        >
                          {item.role === 'docente' ? '🎓 Docente de Honor' : '✨ Joven Invitado'} (cambiar)
                        </button>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyFromList(item)}
                          title="Copiar link personalizado"
                          className="px-2.5 py-1.5 rounded-lg bg-[#F2B749]/20 hover:bg-[#F2B749] text-[#F2B749] hover:text-[#14110F] font-bold text-[10px] flex items-center gap-1 transition"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppToGuest(item)}
                          title="Enviar link por WhatsApp"
                          className="p-1.5 rounded-lg bg-[#7A9A82]/25 hover:bg-[#7A9A82] text-[#CBE0D0] hover:text-[#14110F] transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSavedGuests((prev) => prev.filter((g) => g.id !== item.id))
                          }
                          title="Eliminar de la lista"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#A89B8C] hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {copiedUrl && (
              <div className="p-2.5 rounded-xl bg-[#7A9A82]/20 border border-[#7A9A82]/50 text-[11px] text-[#CBE0D0] break-all shrink-0">
                ✅ <strong>Link copiado:</strong> {copiedUrl}
              </div>
            )}

            <p className="text-[10px] text-center text-[#A89B8C] shrink-0">
              Acceso secreto: 5 toques en el logo superior de la UNSM, o <code>?admin=1</code> en la URL.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST DE RETROALIMENTACIÓN
      ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#F6EFE2] text-[#14110F] px-4 py-2.5 rounded-xl shadow-2xl border border-[#F2B749] font-body text-xs font-bold flex items-center gap-2 max-w-[90vw] text-center">
          <Sparkles className="w-4 h-4 text-[#E05A37] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}