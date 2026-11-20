import React, { useMemo, useState } from 'react';
import {
  CMoneyLogo,
  IconClose,
  IconDownload,
  IconShareIos,
  IconPlusSquare,
  IconPillCheck,
  IconAlert
} from './CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7 — UNIVERSAL PWA INSTALL BOTTOM SHEET (ANDROID, IOS, & IN-APP WA)
 * ============================================================================
 * Otomatis mengenali jenis perangkat & browser warga tanpa mengganggu layar utama.
 */

function detectClientPlatform() {
  if (typeof navigator === 'undefined') {
    return { isIos: false, isAndroid: false, isInAppBrowser: false };
  }
  const ua = navigator.userAgent || '';
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isInAppBrowser =
    /WhatsApp|FBAN|FBAV|Instagram|Line\/|MicroMessenger|wv\)/i.test(ua);

  return { isIos, isAndroid, isInAppBrowser };
}

async function copyUrlSafe(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

export default function PwaInstallSheet({
  isOpen = false,
  onClose,
  deferredPrompt = null,
  onTriggerNativeInstall,
  isInstalled = false,
  logoUrl = '/assets/logo-cmoney.png'
}) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const platform = useMemo(() => detectClientPlatform(), []);

  if (!isOpen) return null;

  const handleNativeInstallClick = async () => {
    if (typeof onTriggerNativeInstall !== 'function') return;
    setIsInstalling(true);
    try {
      await onTriggerNativeInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopyCurrentUrl = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    if (!url) return;
    const ok = await copyUrlSafe(url);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      onClick={() => !isInstalling && typeof onClose === 'function' && onClose()}
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 px-5 pt-3 sm:pt-5 space-y-4 animate-fade-in"
      >
        {/* Gagang Tarik khusus Mobile */}
        <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-black text-slate-900">Pasang Aplikasi C-Money</h3>
          <button
            type="button"
            disabled={isInstalling}
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Identitas Aplikasi */}
        <div className="flex flex-col items-center text-center pt-1">
          <div className="p-2 rounded-3xl bg-emerald-50 ring-1 ring-emerald-200/80 shadow-xs mb-2.5">
            <CMoneyLogo src={logoUrl} size={56} />
          </div>
          <p className="text-sm font-black text-slate-900">
            C-Money — Cluster Mutiara Residence
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Buka lebih cepat dari layar utama HP dengan tampilan penuh tanpa bilah alamat browser,
            hemat kuota, & data kas selalu 100% live.
          </p>
        </div>

        {/* KONDISI 1: SUDAH TERINSTAL */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <IconPillCheck size={20} />
            </div>
            <p className="text-xs font-extrabold text-emerald-900">
              C-Money sudah terpasang & berjalan dalam mode aplikasi!
            </p>
          </div>
        ) : deferredPrompt ? (
          /* KONDISI 2: ANDROID CHROME / EDGE / DESKTOP SIAP INSTALL 1-KLIK */
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={isInstalling}
              onClick={handleNativeInstallClick}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-md shadow-emerald-600/20 inline-flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
            >
              <IconDownload size={18} />
              <span>{isInstalling ? 'Memasang Aplikasi...' : 'Pasang Sekarang'}</span>
            </button>
            <button
              type="button"
              disabled={isInstalling}
              onClick={onClose}
              className="w-full h-10 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-bold transition cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        ) : platform.isInAppBrowser ? (
          /* KONDISI 3: DIBUKA DARI BROWSER DALAM WHATSAPP / IG */
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold">
                <IconAlert size={16} className="text-amber-600 shrink-0" />
                <span>Anda sedang membuka lewat browser WhatsApp</span>
              </div>
              <p className="leading-relaxed text-amber-900">
                Ketuk ikon titik tiga (<strong>⋮</strong>) di pojok kanan atas lalu pilih{' '}
                <strong>Buka di Chrome</strong> (Android) atau <strong>Buka di Safari</strong>{' '}
                (iPhone), kemudian pasang aplikasi dari sana.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCurrentUrl}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              {copiedLink ? 'Link C-Money Tersalin!' : 'Salin Link untuk Dibuka di Chrome / Safari'}
            </button>
          </div>
        ) : platform.isIos ? (
          /* KONDISI 4: IPHONE / IPAD SAFARI (VERSI LAMA S/D TERBARU) */
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-3 text-xs">
              <p className="font-extrabold text-slate-800">
                2 Langkah Cepat Pasang di iPhone (Safari):
              </p>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <IconShareIos size={16} />
                </span>
                <p className="text-slate-700 leading-snug pt-0.5">
                  <strong>1.</strong> Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah
                  layar Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <IconPlusSquare size={16} />
                </span>
                <p className="text-slate-700 leading-snug pt-0.5">
                  <strong>2.</strong> Gulir sedikit ke bawah lalu pilih{' '}
                  <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>, lalu ketuk{' '}
                  <strong>Tambah</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        ) : (
          /* KONDISI 5: BROWSER ANDROID LAWAS / DESKTOP LAINNYA */
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2 text-xs text-slate-700">
              <p className="font-extrabold text-slate-900">Cara Pasang ke Layar Utama:</p>
              <p className="leading-relaxed">
                <strong>1.</strong> Ketuk ikon menu titik tiga (<strong>⋮</strong>) di pojok kanan
                atas browser Anda.
                <br />
                <strong>2.</strong> Pilih <strong>Install app</strong> atau{' '}
                <strong>Tambahkan ke Layar Utama (Add to Home screen)</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        )}
      </div>
    </div>
  );
}