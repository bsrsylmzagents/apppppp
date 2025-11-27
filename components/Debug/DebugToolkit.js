import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bug, Wand2, Users, Trash2, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import { autoFillCurrentForm } from './magicFill';
import AutoPilot from './AutoPilot';

const ROLE_PRESETS = [
  {
    key: 'super_admin',
    label: 'Super Admin',
  },
  {
    key: 'admin',
    label: 'Ajans Admin',
  },
  {
    key: 'corporate_user',
    label: 'B2B Kullanıcı',
  },
];

const DebugToolkit = () => {
  const [open, setOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [forceErrorArmed, setForceErrorArmed] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');
  const [bugReports, setBugReports] = useState([]);
  const [autoPilotVisible, setAutoPilotVisible] = useState(false);

  const currentRole = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch (_) {
      return null;
    }
  }, [open, roleMenuOpen]);

  const refreshBugReports = useCallback(() => {
    try {
      const raw = localStorage.getItem('tourcast_bug_reports');
      if (!raw) {
        setBugReports([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setBugReports(parsed);
      } else {
        setBugReports([]);
      }
    } catch {
      setBugReports([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      refreshBugReports();
    }
  }, [open, refreshBugReports]);

  useEffect(() => {
    if (window.__tourcastAxiosInterceptorInstalled) {
      return;
    }

    axios.interceptors.request.use(
      (config) => {
        if (window.__TOURCAST_FORCE_NEXT_ERROR__) {
          window.__TOURCAST_FORCE_NEXT_ERROR__ = false;
          return Promise.reject(new axios.Cancel('QA Forced Error'));
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    window.__tourcastAxiosInterceptorInstalled = true;
  }, []);

  const handleMagicFill = useCallback(() => {
    autoFillCurrentForm();
  }, []);

  const handleRoleChange = useCallback((roleKey) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      if (!sessionStorage.getItem('qa_prev_user')) {
        sessionStorage.setItem('qa_prev_user', JSON.stringify(user));
      }

      const updatedUser = { ...user, role: roleKey };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new StorageEvent('storage', { key: 'user' }));
      window.location.reload();
    } catch (error) {
      console.error('DebugToolkit role change error:', error);
    }
  }, []);

  const handleRestoreRole = useCallback(() => {
    try {
      const prevUserStr = sessionStorage.getItem('qa_prev_user');
      if (!prevUserStr) return;
      localStorage.setItem('user', prevUserStr);
      sessionStorage.removeItem('qa_prev_user');
      window.location.reload();
    } catch (error) {
      console.error('DebugToolkit restore role error:', error);
    }
  }, []);

  const handleClearCache = useCallback(() => {
    if (!window.confirm('Tüm önbellek temizlenecek ve sayfa yenilenecek. Emin misiniz?')) {
      return;
    }
    try {
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      window.location.reload();
    }
  }, []);

  const handleForceError = useCallback(() => {
    window.__TOURCAST_FORCE_NEXT_ERROR__ = true;
    setForceErrorArmed(true);
    setTimeout(() => {
      setForceErrorArmed(false);
    }, 4000);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end space-y-2 space-y-reverse pointer-events-none" data-testid="qa-toolkit">
      {open && (
        <div className="mb-2 w-72 max-w-[80vw] pointer-events-auto">
          <div
            className="rounded-2xl shadow-xl backdrop-blur-md p-3 space-y-2"
            style={{
              background:
                'linear-gradient(135deg, rgba(234,88,12,0.98) 0%, rgba(194,65,12,0.98) 100%)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={16} />
                <span className="text-sm font-semibold text-gray-900">QA Toolkit</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-white/60"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  activeTab === 'actions'
                    ? 'bg-white text-gray-900'
                    : 'bg-white/40 text-gray-700'
                }`}
              >
                Aksiyonlar
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('bugs');
                  refreshBugReports();
                }}
                className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  activeTab === 'bugs'
                    ? 'bg-white text-gray-900'
                    : 'bg-white/40 text-gray-700'
                }`}
              >
                To-Fix List
              </button>
            </div>

            {activeTab === 'actions' && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleMagicFill}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white text-sm"
              >
                <span className="flex items-center gap-2">
                  <Wand2 size={16} />
                  <span className="text-gray-900">Sihirli Doldur</span>
                </span>
                <span className="text-[11px] text-gray-900">Formları Otomatik Doldur</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="text-gray-900">Rol Değiştir</span>
                  </span>
                  <span className="text-[11px] text-gray-900">
                    {currentRole ? `Aktif: ${currentRole}` : 'Rol seç'}
                  </span>
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden z-[10000]">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500">
                      Rol Seç (Mock - Sadece UI)
                    </div>
                    {ROLE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleRoleChange(p.key)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <span>{p.label}</span>
                        <span className="text-[11px] text-gray-400">{p.key}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleRestoreRole}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border-t border-gray-100 hover:bg-gray-50"
                    >
                      <span>Önceki Rolü Geri Yükle</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white text-sm"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  <span className="text-gray-900">Önbellek Temizle</span>
                </span>
                <span className="text-[11px] text-gray-900">LocalStorage + Session</span>
              </button>

              <button
                type="button"
                onClick={handleForceError}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white text-sm"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="text-gray-900">Hata Simülasyonu</span>
                </span>
                <span className="text-[11px] text-gray-900">
                  Sonraki API Çağrısı: {forceErrorArmed ? 'Hazır' : 'Hazırlanıyor'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAutoPilotVisible(true)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-sm"
              >
                <span className="flex items-center gap-2">
                  <Bug size={16} />
                  <span className="text-gray-900">🦎 Chameleon Runner</span>
                </span>
                <span className="text-[11px] text-gray-900">Tema + Smoke Test Otomasyonu</span>
              </button>
            </div>
            )}

            {activeTab === 'bugs' && (
              <div className="space-y-2 max-h-64 overflow-y-auto bg-white/80 rounded-xl p-2">
                {bugReports.length === 0 && (
                  <p className="text-xs text-gray-700">Henüz kayıtlı hata yok.</p>
                )}
                {bugReports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 mb-1 bg-white"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-900">
                        {report.route || report.url}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleTimeString('tr-TR')
                          : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-800 line-clamp-3">
                      {report.description}
                    </p>
                    {report.lastAction && (
                      <p className="mt-1 text-[10px] text-gray-600">
                        Son Aksiyon: {report.lastAction}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full shadow-lg"
        style={{
          background:
            'linear-gradient(135deg, rgba(234,88,12,1) 0%, rgba(194,65,12,1) 100%)',
        }}
      >
        <Bug size={18} />
        <span className="text-xs font-semibold hidden sm:inline text-gray-900">QA Toolkit</span>
      </button>

      {autoPilotVisible && (
        <AutoPilot
          onClose={() => setAutoPilotVisible(false)}
        />
      )}
    </div>
  );
};

export default DebugToolkit;


