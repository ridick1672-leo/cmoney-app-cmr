import React, { useState, useEffect } from 'react';
import {
  CMoneyLogo,
  IconClose,
  IconChevronRight,
  IconChevronDown,
  IconPillTheme,
  IconGuideBook,
  Icon3DInstallApp,
  IconPillCheck,
  IconPillWa,
  IconSettings
} from './CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7.2 — PENGATURAN WARGA & PUSAT PANDUAN (4 TAB + FAQ AKORDEON)
 * ============================================================================
 * Isi kontak resmi di bawah ini kapan saja (format 628xxx tanpa tanda +).
 * Jika waNumber diisi, tombol "Chat WA" akan muncul otomatis pada kartu kontak.
 */

const IMPORTANT_CONTACTS = [
  {
    id: 'pos_security',
    role: 'Pos Security CMR',
    person: 'Pak Eko & Pak Mulyadi',
    desc: 'Laporan paket warga, tamu berkunjung, kendala gerbang, & pantauan parkir fasum.',
    waNumber: '' // Contoh isi nanti: '6281234567890'
  },
  {
    id: 'bendahara',
    role: 'Bendahara Paguyuban CMR',
    person: 'Pengurus Keuangan',
    desc: 'Konfirmasi pembayaran IPL, kontribusi parkir fasum, & validasi buku kas.',
    waNumber: ''
  },
  {
    id: 'pengurus',
    role: 'Pengurus Lingkungan CMR',
    person: 'Koordinator Cluster',
    desc: 'Koordinasi fasilitas umum, izin renovasi/acara warga, & saran lingkungan.',
    waNumber: ''
  }
];

const FAQ_ITEMS = [
  {
    q: 'Kenapa setelah bayar QRIS status rumah saya masih "Menunggu Validasi"?',
    a: 'Pembayaran warga masuk ke antrean pengecekan bendahara terlebih dahulu agar mutasi rekening benar-benar cocok sebelum status diubah menjadi Lunas dan otomatis masuk ke Buku Kas.'
  },
  {
    q: 'Apakah wajib mengunggah screenshot bukti transfer saat konfirmasi QRIS?',
    a: 'Tidak wajib (opsional). Warga tetap boleh menekan tombol konfirmasi tanpa foto, meski melampirkan screenshot m-Banking akan membantu bendahara memvalidasi lebih cepat.'
  },
  {
    q: 'Kenapa angka Saldo Kas Nyata langsung berubah saat bulan belum berakhir?',
    a: 'C-Money menghitung Uang Kas Nyata 100% Live langsung dari setiap pemasukan lunas dan pengeluaran riil di Buku Kas tanpa perlu menunggu tutup buku akhir bulan.'
  },
  {
    q: 'Bagaimana cara mengetahui ada paket saya yang dititipkan di Pos Security?',
    a: 'Setiap paket yang dicatat petugas otomatis muncul di blok "Paket di Pos Security" pada Beranda lengkap dengan jumlah angka dan foto buktinya. Setelah diambil, petugas menandainya selesai.'
  },
  {
    q: 'Apakah warga biasa perlu login atau membuat akun?',
    a: 'Tidak perlu. Seluruh menu warga (cek buku kas, bayar QRIS, cek status IPL, buka foto bukti, cek parkir, & paket) terbuka langsung tanpa login. Tombol Masuk Pengurus khusus Bendahara/Pengurus.'
  },
  {
    q: 'Apakah C-Money aman dipakai di HP Android lama atau iPhone lama?',
    a: 'Aman. C-Money dirancang ringan untuk browser versi lama maupun baru, dan tidak menyimpan cache saldo di memori HP sehingga angka kas selalu akurat mengikuti server.'
  }
];

/* ============================================================================
 * 1. BOTTOM SHEET / MODAL: PENGATURAN WARGA (DIKLIK DARI IKON GEAR ⚙️)
 * ============================================================================ */

export function SettingsSheet({
  isOpen = false,
  onClose,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenGuide,
  onOpenPwaInstall,
  isPwaInstalled = false,
  isOnline = true,
  backendVersion = 'v6.3',
  lastSyncTime = '',
  logoUrl = '/assets/logo-cmoney.png'
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 px-5 pt-3 sm:pt-5 space-y-4 animate-fade-in"
      >
        {/* Gagang tarik khusus Mobile */}
        <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <IconSettings size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">Pengaturan & Bantuan</h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Preferensi tampilan & panduan warga CMR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengaturan"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Daftar Menu Pengaturan Bergaya Gojek */}
        <div className="rounded-3xl border border-slate-200/90 bg-slate-50/70 divide-y divide-slate-200/80 overflow-hidden">
          {/* 1. Saklar Mode Gelap */}
          {typeof onToggleDarkMode === 'function' && (
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={onToggleDarkMode}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition text-left cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <IconPillTheme dark={isDarkMode} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold text-slate-900">
                    Mode Gelap
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">
                    {isDarkMode ? 'Aktif • Nyaman dilihat malam hari' : 'Nonaktif • Tema terang'}
                  </span>
                </span>
              </span>

              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    isDarkMode ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}
                />
              </span>
            </button>
          )}

          {/* 2. Pusat Panduan & FAQ */}
          {typeof onOpenGuide === 'function' && (
            <button
              type="button"
              onClick={() => {
                if (typeof onClose === 'function') onClose();
                onOpenGuide('cara_pakai');
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition text-left cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <IconGuideBook size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold text-slate-900">
                    Pusat Panduan & FAQ
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">
                    Cara pakai, tata tertib, tarif, & kontak pos
                  </span>
                </span>
              </span>
              <IconChevronRight size={17} className="text-slate-400 shrink-0" />
            </button>
          )}

          {/* 3. Pasang Aplikasi (PWA) */}
          {typeof onOpenPwaInstall === 'function' && (
            <button
              type="button"
              onClick={() => {
                if (typeof onClose === 'function') onClose();
                onOpenPwaInstall();
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition text-left cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <Icon3DInstallApp size={22} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-extrabold text-slate-900">
                      Pasang Aplikasi (PWA)
                    </span>
                    {isPwaInstalled && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        Terpasang
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">
                    {isPwaInstalled
                      ? 'C-Money sudah berjalan dalam mode layar penuh'
                      : 'Tambahkan ikon C-Money ke layar utama HP'}
                  </span>
                </span>
              </span>
              <IconChevronRight size={17} className="text-slate-400 shrink-0" />
            </button>
          )}
        </div>

        {/* Info Versi & Status Koneksi Ringkas */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-3.5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CMoneyLogo src={logoUrl} size={30} className="ring-1 ring-emerald-200/70" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 truncate">
                C-Money V7.2 • API {backendVersion || 'v6.3'}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 truncate">
                {lastSyncTime ? `Sinkron terakhir: ${lastSyncTime}` : 'Cluster Mutiara Residence'}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {isOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. BOTTOM SHEET / MODAL: PUSAT PANDUAN (4 TAB: CARA PAKAI, TATIB, FAQ, POS)
 * ============================================================================ */

const GUIDE_TABS = [
  { id: 'cara_pakai', label: 'Cara Pakai' },
  { id: 'tatib', label: 'Tata Tertib' },
  { id: 'faq', label: 'FAQ' },
  { id: 'pos_kontak', label: 'Pos & Kontak' }
];

export function GuideCenterSheet({
  isOpen = false,
  initialTab = 'cara_pakai',
  onClose,
  onOpenPwaInstall,
  onToggleDarkMode,
  isDarkMode = false,
  isPwaInstalled = false
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'cara_pakai');
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'cara_pakai');
      setOpenFaqIdx(0);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
      >
        {/* Gagang tarik khusus Mobile */}
        <div className="pt-2.5 pb-1 sm:hidden shrink-0">
          <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto" />
        </div>

        {/* Header Pusat Panduan */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <IconGuideBook size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 truncate">
                Pusat Panduan C-Money CMR
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Cara pakai, ketentuan tarif, tanya jawab, & kontak cluster
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pusat Panduan"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* 4 Tab Garis Bawah Seragam */}
        <div className="grid grid-cols-4 border-b border-slate-200 px-2 sm:px-4 shrink-0">
          {GUIDE_TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-1 text-[11px] sm:text-xs font-extrabold relative text-center transition cursor-pointer ${
                  active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="truncate block">{t.label}</span>
                {active && (
                  <span className="absolute bottom-0 inset-x-2 h-[3px] rounded-t-full bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Konten Scrollable per Tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs space-y-3.5">
          {/* ================================================================
              TAB 1: CARA PAKAI WARGA
          ================================================================ */}
          {activeTab === 'cara_pakai' && (
            <div className="space-y-3">
              <GuideStepCard
                step="1"
                title="Bayar IPL & Parkir via QRIS"
                items={[
                  'Ketuk tombol bulat Bayar di tengah bawah (HP) atau Bayar QRIS di sidebar kiri (Desktop).',
                  'Pilih nomor rumah, periode bulan buku, dan paket pembayaran (IPL Saja, +1 Mobil, +2 Mobil, atau +Weekend).',
                  'Scan kode QRIS (bisa tekan Simpan QRIS ke Galeri untuk dipindai lewat m-Banking) dan salin nominalnya.',
                  'Lampirkan screenshot bukti transfer (opsional / tidak wajib), lalu tekan Kirim Konfirmasi Pembayaran.'
                ]}
              />

              <GuideStepCard
                step="2"
                title="Cek Buku Kas & Lihat Foto Bukti"
                items={[
                  'Buka tab Buku Kas atau ketuk kartu bulan di Beranda untuk melihat rincian uang masuk & keluar per kategori.',
                  'Ketuk tombol Bukti / Lihat Foto untuk memperbesar nota atau foto patroli.',
                  'Jika fotonya lebih dari satu, geser ke kanan/kiri. Ketuk tombol putih ✕ Tutup (atau area luar foto) untuk keluar.'
                ]}
              />

              <GuideStepCard
                step="3"
                title="Pantau Paket di Pos & Slot Parkir Fasum"
                items={[
                  'Kiriman paket warga yang belum diambil tampil otomatis di Beranda dan di menu Pos → Paket lengkap dengan fotonya.',
                  'Cek ketersediaan 6 slot parkir fasum secara live lewat kartu Parkir Fasum di Beranda.'
                ]}
              />

              <GuideStepCard
                step="4"
                title="Pasang Aplikasi (PWA) & Mode Gelap"
                items={[
                  'Ketuk ikon Gear (⚙️) di pojok kanan atas untuk mengganti Mode Gelap / Terang dalam 1 ketukan.',
                  'Pilih Pasang Aplikasi agar ikon C-Money tampil di layar utama HP Android maupun iPhone Anda.'
                ]}
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {typeof onToggleDarkMode === 'function' && (
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <IconPillTheme dark={isDarkMode} size={15} />
                    <span>Coba {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                  </button>
                )}
                {!isPwaInstalled && typeof onOpenPwaInstall === 'function' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onClose === 'function') onClose();
                      onOpenPwaInstall();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <IconPillCheck size={15} />
                    <span>Pasang Aplikasi Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: TATA TERTIB & TARIF CLUSTER
          ================================================================ */}
          {activeTab === 'tatib' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <h4 className="font-black text-emerald-950 text-sm">
                  1. Iuran Wajib (IPL) & Siklus Buku
                </h4>
                <ul className="space-y-1 text-slate-700 leading-relaxed list-disc pl-4">
                  <li>
                    Tarif IPL dasar <strong>Rp 200.000/bulan</strong> untuk{' '}
                    <strong>21 unit hunian aktif</strong>.
                  </li>
                  <li>
                    Unit <strong>No. 04</strong> berstatus Non-Aktif (Dijual Pihak BPR) sehingga
                    bebas tagihan bulanan.
                  </li>
                  <li>
                    Siklus pembayaran memakai batas <em>cut-off</em> <strong>tanggal 25</strong>{' '}
                    (pembayaran mulai tgl 25 otomatis mengarah ke buku iuran bulan berikutnya).
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                <h4 className="font-black text-sky-950 text-sm">
                  2. Kontribusi & Aturan Parkir Fasum (6 Slot)
                </h4>
                <ul className="space-y-1 text-slate-700 leading-relaxed list-disc pl-4">
                  <li>
                    Tarif kontribusi: <strong>1 Mobil Rp 150.000/bln</strong> •{' '}
                    <strong>2 Mobil Rp 300.000/bln</strong> •{' '}
                    <strong>Weekend Rp 50.000/bln</strong>.
                  </li>
                  <li>
                    Seluruh <strong>6 slot parkir</strong> (Area Kiri Slot 01–04 & Area Kanan Slot
                    05–06) bersifat <strong>dinamis & bebas</strong> (tidak dikunci permanen per
                    rumah).
                  </li>
                  <li>
                    Status Check-In dan Check-Out kendaraan dicatat langsung oleh petugas security
                    yang sedang berjaga.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <h4 className="font-black text-amber-950 text-sm">
                  3. Jadwal Shift Security & SOP Gerbang
                </h4>
                <ul className="space-y-1 text-slate-700 leading-relaxed list-disc pl-4">
                  <li>
                    Petugas keamanan: <strong>Pak Eko</strong> & <strong>Pak Mulyadi</strong>{' '}
                    (rotasi mingguan Shift Pagi 08:00–20:00 & Shift Malam 20:00–08:00).
                  </li>
                  <li>
                    <strong>Minggu – Kamis:</strong> Berjalan 2 shift penuh (Pagi & Malam).
                  </li>
                  <li>
                    <strong>Jumat Malam & Sabtu Malam:</strong> Shift malam <strong>LIBUR</strong>{' '}
                    mulai pukul <strong>20:00 WIB</strong> — gerbang utama dikunci dan dibuka-tutup
                    mandiri oleh warga.
                  </li>
                  <li>
                    Pintu gerbang kecil selalu ditutup kembali sesuai SOP setelah warga/tamu
                    melintas.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: TANYA JAWAB (FAQ AKORDEON)
          ================================================================ */}
          {activeTab === 'faq' && (
            <div className="space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpenItem = openFaqIdx === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpenItem ? -1 : idx)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition cursor-pointer"
                    >
                      <span className="font-extrabold text-slate-900 leading-snug">{item.q}</span>
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                        <IconChevronDown size={14} rotated={isOpenItem} />
                      </span>
                    </button>
                    {isOpenItem && (
                      <div className="px-4 pb-3.5 pt-2 border-t border-slate-200/70 bg-white text-slate-600 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================
              TAB 4: PANDUAN PETUGAS POS & KONTAK PENTING
          ================================================================ */}
          {activeTab === 'pos_kontak' && (
            <div className="space-y-4">
              {/* Ringkasan Alur Petugas Pos */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  Alur Cepat Petugas Pos (Tanpa Login)
                </h4>
                <ul className="space-y-1.5 text-slate-700 leading-relaxed list-disc pl-4">
                  <li>
                    <strong>Absen & Tukar Shift:</strong> Buka <strong>Pos → Absen</strong>, ketuk{' '}
                    <strong>Rekam Waktu</strong>, posisikan wajah di dalam bingkai oval (atau pakai
                    tombol cadangan <strong>HP</strong>), lalu salin teks WA ke grup pos.
                  </li>
                  <li>
                    <strong>Catat Paket & Patroli:</strong> Buka <strong>Pos → Lapor</strong>, pilih
                    kategori (<em>Paket Warga / Patroli / Kendala</em>), pilih preset cepat, lampirkan
                    hingga <strong>5 foto</strong> sekaligus, lalu salin teks WA.
                  </li>
                  <li>
                    <strong>Check-In / Check-Out Parkir:</strong> Ketuk kartu{' '}
                    <strong>Parkir Fasum</strong> di Beranda lalu ketuk nomor slot yang terisi atau
                    kosong.
                  </li>
                </ul>
              </div>

              {/* Daftar Kontak Penting */}
              <div className="space-y-2.5">
                <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px] px-1">
                  Kontak Penting Cluster Mutiara Residence
                </h4>
                {IMPORTANT_CONTACTS.map((c) => {
                  const cleanWa = String(c.waNumber || '').replace(/[^0-9]/g, '');
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm">{c.role}</p>
                        <p className="text-[11px] font-bold text-emerald-700">{c.person}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{c.desc}</p>
                      </div>

                      {cleanWa ? (
                        <a
                          href={`https://wa.me/${cleanWa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 transition"
                        >
                          <IconPillWa size={15} />
                          <span>Chat WA</span>
                        </a>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold shrink-0">
                          Via Grup CMR
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GuideStepCard({ step, title, items = [] }) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
          {step}
        </span>
        <h4 className="font-black text-slate-900 text-sm">{title}</h4>
      </div>
      <ul className="space-y-1 text-slate-700 leading-relaxed list-disc pl-8">
        {items.map((text, idx) => (
          <li key={idx}>{text}</li>
        ))}
      </ul>
    </div>
  );
}