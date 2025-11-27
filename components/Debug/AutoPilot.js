import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, Square } from 'lucide-react';
import { autoFillCurrentForm } from './magicFill';
import { useTheme } from '../../contexts/ThemeContext';

// Adımlar arasındaki bekleme süresi (ms)
const STEP_DELAY = 1500;

const AutoPilot = ({ onClose }) => {
  const navigate = useNavigate();
  const { theme, setThemeMode } = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);

  const timerRef = useRef(null);
  const originalThemeRef = useRef(theme);

  const log = useCallback((message, type = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type,
        message,
        time: new Date().toISOString(),
      },
    ]);
  }, []);

  const validateThemes = useCallback(async () => {
    const prevTheme = theme;
    originalThemeRef.current = prevTheme;

    try {
      log('Testing Dynamic Theme...', 'info');
      setThemeMode('dynamic');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const sidebar = document.querySelector('aside.sidebar');
      if (sidebar) {
        const style = window.getComputedStyle(sidebar);
        const bg = `${style.backgroundImage || ''} ${style.backgroundColor || ''}`.toLowerCase();
        const isOrange =
          bg.includes('#ea580c') ||
          bg.includes('#c2410c') ||
          bg.includes('234, 88, 12') ||
          bg.includes('194, 65, 12') ||
          bg.includes('orange');

        if (!isOrange) {
          log('❌ Dynamic Theme Failed: Sidebar is not orange.', 'error');
        } else {
          log('✅ Dynamic Theme OK: Sidebar is orange-toned.', 'info');
        }
      } else {
        log('⚠️ Dynamic Theme Check: Sidebar not found.', 'error');
      }

      log('Testing Dark Theme...', 'info');
      setThemeMode(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const main = document.querySelector('main');
      if (main) {
        const style = window.getComputedStyle(main);
        const bgColor = style.backgroundColor || '';
        const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        let isDarkEnough = false;
        if (match) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          const avg = (r + g + b) / 3;
          isDarkEnough = avg < 70;
        }

        if (!isDarkEnough) {
          log('❌ Dark Theme Failed: Background too light.', 'error');
        } else {
          log('✅ Dark Theme OK: Background is dark.', 'info');
        }
      } else {
        log('⚠️ Dark Theme Check: Main container not found.', 'error');
      }
    } catch (e) {
      log(`Theme validation error: ${String(e)}`, 'error');
    } finally {
      // Eski temaya dön
      setThemeMode(originalThemeRef.current || null);
    }
  }, [log, setThemeMode, theme]);

  const steps = useMemo(
    () => [
      {
        label: 'Dashboard sayfasına git',
        run: async () => {
          navigate('/dashboard');
        },
      },
      {
        label: 'Temaları doğrula (Dynamic & Dark)',
        run: validateThemes,
      },
      {
        label: 'Rezervasyonlar sayfasına git',
        run: async () => {
          navigate('/reservations');
        },
      },
      {
        label: '"Yeni Rezervasyon" butonuna tıkla',
        run: async () => {
          const selector =
            '[data-testid="new-reservation"], [data-testid*="new-reservation"], [data-testid="open-reservation-modal"], button[data-modal="reservation"]';
          const el = document.querySelector(selector);
          if (el) {
            el.click();
          } else {
            log('⚠️ Yeni Rezervasyon butonu bulunamadı.', 'error');
          }
        },
      },
      {
        label: 'Rezervasyon formunu otomatik doldur',
        run: async () => {
          autoFillCurrentForm();
        },
      },
    ],
    [log, navigate, validateThemes]
  );

  const resetRunner = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStep(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || isPaused) {
      return;
    }

    if (currentStep >= steps.length) {
      resetRunner();
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const step = steps[currentStep];
        log(`▶ ${step.label}`, 'info');
        await step.run();
      } catch (e) {
        log(`❌ Step error: ${String(e)}`, 'error');
      } finally {
        setCurrentStep((prev) => prev + 1);
      }
    }, STEP_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, isPaused, currentStep, steps, log, resetRunner]);

  const handlePlay = () => {
    if (!isPlaying) {
      setLogs([]);
      setCurrentStep(0);
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleStop = () => {
    resetRunner();
    if (onClose) onClose();
  };

  const totalSteps = steps.length;
  const stepDisplay = Math.min(currentStep + (isPlaying && !isPaused ? 1 : 0), totalSteps);

  return (
    <>
      {isPlaying && (
        <div className="fixed top-0 inset-x-0 z-[10040] pointer-events-none">
          <div className="mx-auto mt-2 w-[90vw] max-w-2xl pointer-events-auto rounded-full bg-black/70 text-white px-4 py-2 flex items-center justify-between shadow-lg">
            <span className="text-xs md:text-sm font-medium">
              🤖 Auto-Pilot Running: Step {stepDisplay}/{totalSteps}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-black text-[11px] font-semibold hover:bg-amber-300"
              >
                <Pause size={12} />
                <span>Pause</span>
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-[11px] font-semibold hover:bg-red-400"
              >
                <Square size={12} />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 space-y-2 text-xs text-gray-800 pointer-events-auto">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">🦎 Chameleon Runner</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlay}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600"
            >
              <Play size={12} />
              <span>{isPlaying && !isPaused ? 'Restart' : 'Start'}</span>
            </button>
            {isPlaying && (
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 text-black text-[11px] font-semibold hover:bg-amber-300"
              >
                <Pause size={12} />
                <span>Pause</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white/80 rounded-xl border border-gray-200 max-h-40 overflow-y-auto p-2">
          {logs.length === 0 && (
            <p className="text-[11px] text-gray-600">
              Henüz log yok. "Start" ile Quick Smoke Test başlatılabilir.
            </p>
          )}
          {logs.map((entry) => (
            <p
              key={entry.id}
              className={`text-[11px] mb-0.5 ${
                entry.type === 'error' ? 'text-red-600' : 'text-gray-800'
              }`}
            >
              {entry.message}
            </p>
          ))}
        </div>
      </div>
    </>
  );
};

export default AutoPilot;


