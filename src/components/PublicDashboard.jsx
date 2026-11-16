import React, { useState, useEffect } from 'react';
import QrisPaymentModal from './QrisPaymentModal';

export default function PublicDashboard({ dashboardData, onOpenAdminLogin }) {
  const [activeTab, setActiveTab] = useState('beranda');
  const [showBalance, setShowBalance] = useState(true);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('November');
  const [secretTapCount, setSecretTapCount] = useState(0);

  // Data fallback sesuai baseline CMR_Database_Master
  const data = dashboardData || {
    app_name: 'C-Money',
    cluster_full_name: 'Cluster Mutiara Residence Sumberjaya',
    current_balance: 1452200,
    default_ipl_amount: 200000,
    total_active_houses: 21,
    qris_merchant_name: 'Cluster Mutiara Residence',
    qris_nmid: 'ID1026000000CMR',
    qris_image_url: '/assets/qris-cmr-statis.png'
  };

  // Trigger tersembunyi untuk Pengurus: Ketuk logo C-Money 5x untuk membuka Login Pengurus
  const handleLogoTap = () => {
    const next = secretTapCount + 1;
    if (next >= 5) {
      setSecretTapCount(0);
      if (onOpenAdminLogin) onOpenAdminLogin();
    } else {
      setSecretTapCount(next);
    }
  };

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Container Mobile-First (Maksimal lebar HP agar seragam di Android, iPhone, & Desktop) */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen pb-24 shadow-xl relative flex flex-col">

        {/* TOP BAR & HERO CARD M-BANKING */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white pt-6 pb-8 px-5 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div onClick={handleLogoTap} className="cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-2.5 py-1 rounded-lg font-extrabold text-sm tracking-wider">
                  {data.app_name}
                </span>
                <span className="text-xs bg-emerald-500/30 border border-emerald-300/30 px-2 py-0.5 rounded-full">
                  Publik • Tanpa Login
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-1 font-medium">
                {data.cluster_full_name}
              </p>
            </div>

            {/* Tombol Akses Pengurus (Ikon Gembok Halus) */}
            <button
              onClick={onOpenAdminLogin}
              title="Mode Pengurus"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-teal-100 text-xs"
            >
              🔒 Pengurus
            </button>
          </div>

          {/* KARTU SALDO UTAMA (M-BANKING STYLE) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-teal-100">
                Saldo Kas Aktif Cluster
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-xs text-teal-200 underline"
              >
                {showBalance ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>

            <div className="text-2xl font-extrabold mt-1 tracking-tight">
              {showBalance ? formatRp(data.current_balance) : 'Rp ••••••••'}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/15 text-xs">
              <div>
                <p className="text-teal-200">Iuran Wajib / Rumah</p>
                <p className="font-bold text-emerald-300 mt-0.5">
                  {formatRp(data.default_ipl_amount)} / bln
                </p>
              </div>
              <div>
                <p className="text-teal-200">Total Hunian Aktif</p>
                <p className="font-bold text-white mt-0.5">
                  {data.total_active_houses} Rumah (H-01 – H-21)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS MENU (ALA SUPER-APP / KELUARGA NINGRAT) */}
        <div className="px-5 -mt-5">
          <div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-4 gap-2 text-center border border-slate-100">
            <button
              onClick={() => setIsQrisOpen(true)}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition">
                📲
              </div>
              <span className="text-[11px] font-bold text-teal-800 mt-1.5">
                Bayar QRIS
              </span>
            </button>

            <button
              onClick={() => setActiveTab('warga')}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl border border-emerald-100 group-hover:scale-105 transition">
                🏠
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5">
                21 Rumah
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl border border-amber-100 group-hover:scale-105 transition">
                📊
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5">
                Buku Kas
              </span>
            </button>

            <button
              onClick={() => setActiveTab('keamanan')}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl border border-rose-100 group-hover:scale-105 transition">
                🚨
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5">
                Pos & SOS
              </span>
            </button>
          </div>
        </div>

        {/* BANNER CTA BAYAR IPL CEPAT VIA QRIS */}
        <div className="px-5 mt-4">
          <div
            onClick={() => setIsQrisOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-sm"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                Bebas Biaya Admin • MDR 0%
              </span>
              <h3 className="font-bold text-sm mt-1">
                Bayar Iuran IPL Bulan {selectedPeriod}
              </h3>
              <p className="text-xs text-emerald-100">
                Klik untuk tampilkan QRIS Resmi CMR & unggah bukti
              </p>
            </div>
            <div className="bg-white text-teal-800 font-extrabold text-xs px-3 py-2 rounded-xl shadow">
              Buka QRIS →
            </div>
          </div>
        </div>

        {/* KONTEN DINAMIS BERDASARKAN TAB NAVIGASI */}
        <div className="px-5 mt-5 flex-1 space-y-4">
          {activeTab === 'beranda' && (
            <>
              {/* Ringkasan Historis 5 Bulan Terakhir */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Tren Kas 5 Bulan Terakhir (Juni – Oktober)
                  </h4>
                  <span className="text-[11px] text-teal-700 font-semibold">
                    Transparan 100%
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { bln: 'Juni 2026', masuk: 4200000, keluar: 5051200, sisa: 2850800 },
                    { bln: 'Juli 2026', masuk: 4100000, keluar: 4635800, sisa: 2315000 },
                    { bln: 'Agustus 2026', masuk: 4300000, keluar: 4798500, sisa: 2316500 },
                    { bln: 'September 2026', masuk: 4100000, keluar: 4904300, sisa: 1512200 },
                    { bln: 'Oktober 2026', masuk: 4200000, keluar: 4260000, sisa: 1452200 }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{item.bln}</p>
                        <p className="text-[11px] text-slate-500">
                          Masuk {formatRp(item.masuk)} • Keluar {formatRp(item.keluar)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-teal-700">
                          {formatRp(item.sisa)}
                        </span>
                        <p className="text-[10px] text-slate-400">Sisa Saldo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transparansi Gaji & Kasbon Security */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm mb-2">
                  Transparansi Gaji Security (Oktober 2026)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">Pak Mulyadi</p>
                      <p className="text-slate-500">Gaji Pokok Rp 1.650.000 • Kasbon Rp 0</p>
                    </div>
                    <span className="font-bold text-emerald-700">Rp 1.650.000</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">Pak Eko</p>
                      <p className="text-slate-500">
                        Gaji Pokok Rp 1.650.000 • Potong Kasbon Rp 350.000
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700">Rp 1.300.000</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 px-6 py-2.5 flex justify-between items-center text-xs z-20">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`flex flex-col items-center ${
              activeTab === 'beranda' ? 'text-teal-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">🏠</span>
            <span>Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('mutasi')}
            className={`flex flex-col items-center ${
              activeTab === 'mutasi' ? 'text-teal-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">📑</span>
            <span>Mutasi Kas</span>
          </button>

          {/* Tombol Tengah Mengambang (Bayar QRIS) */}
          <button
            onClick={() => setIsQrisOpen(true)}
            className="flex flex-col items-center -mt-6"
          >
            <div className="w-14 h-14 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-lg border-4 border-white text-xl">
              📲
            </div>
            <span className="text-[11px] font-bold text-teal-800 mt-0.5">QRIS IPL</span>
          </button>

          <button
            onClick={() => setActiveTab('warga')}
            className={`flex flex-col items-center ${
              activeTab === 'warga' ? 'text-teal-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">🏘️</span>
            <span>21 Rumah</span>
          </button>

          <button
            onClick={() => setActiveTab('keamanan')}
            className={`flex flex-col items-center ${
              activeTab === 'keamanan' ? 'text-teal-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">🛡️</span>
            <span>Keamanan</span>
          </button>
        </div>

        {/* MODAL POP-UP QRIS PEMBAYARAN IPL */}
        {isQrisOpen && (
          <QrisPaymentModal
            isOpen={isQrisOpen}
            onClose={() => setIsQrisOpen(false)}
            merchantName={data.qris_merchant_name}
            nmid={data.qris_nmid}
            qrisImageUrl={data.qris_image_url}
            defaultAmount={data.default_ipl_amount}
          />
        )}
      </div>
    </div>
  );
}
