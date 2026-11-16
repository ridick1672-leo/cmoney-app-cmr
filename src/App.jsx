import React, { useState, useEffect } from 'react';
import PublicDashboard from './components/PublicDashboard';
import { CMoneyAPI } from './services/apiService';

// Baseline Data Default (Digunakan otomatis jika URL GAS belum dipasang atau sedang memuat)
const INITIAL_FALLBACK_DATA = {
  app_name: 'C-Money',
  cluster_full_name: 'Cluster Mutiara Residence Sumberjaya',
  current_balance: 1452200,
  default_ipl_amount: 200000,
  total_active_houses: 21,
  qris_merchant_name: 'Cluster Mutiara Residence',
  qris_nmid: 'ID1026000000CMR',
  qris_image_url: '/assets/qris-cmr-statis.png',
  summary_periode: { bulan: 'November', tahun: 2026 },
  houses: Array.from({ length: 21 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const names = {
      '01': 'Sonny Ilham',
      '02': 'Kiswanto'
    };
    return {
      id: `H-${num}`,
      nomor_rumah: `No. ${num}`,
      nama_warga: names[num] || `Warga Blok/No ${num}`,
      status_huni: 'Aktif',
      tarif_ipl: 200000
    };
  })
};

export default function App() {
  const [dashboardData, setDashboardData] = useState(INITIAL_FALLBACK_DATA);
  const [loading, setLoading] = useState(false);

  // State Mode Pengurus (1 Akun Tunggal Tanpa Gmail)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    Boolean(localStorage.getItem('cmoney_pengurus_token'))
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // State Form Input Transaksi Pengurus
  const [txForm, setTxForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    periode_bulan: 'November',
    periode_tahun: 2026,
    tipe: 'OUT',
    kategori: 'Operasional',
    is_proyek: false,
    nama_proyek: '',
    nominal: '',
    keterangan: ''
  });

  // State Tutup Buku & Trigger Fonnte WA
  const [closingPeriod, setClosingPeriod] = useState({
    bulan: 'November',
    tahun: 2026,
    target_wa: ''
  });
  const [actionStatus, setActionStatus] = useState('');

  // Ambil data live dari Backend GAS saat aplikasi dibuka
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await CMoneyAPI.getPublicDashboard('November', 2026);
      if (res && res.status === 'success') {
        setDashboardData((prev) => ({ ...prev, ...res }));
      }
    } catch (err) {
      console.warn('Menggunakan data baseline lokal:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Fungsi Login 1 User Pengurus Tanpa Gmail
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await CMoneyAPI.loginPengurus(username, password);
      if (res.status === 'success') {
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setUsername('');
        setPassword('');
      } else {
        setAuthError(res.message || 'Username atau password pengurus salah.');
      }
    } catch (err) {
      // Fallback verifikasi jika sedang tes lokal sebelum GAS URL terhubung
      if (username === 'pengurus_cmr' && password === 'cmr_admin_2026') {
        localStorage.setItem('cmoney_pengurus_token', 'LOCAL_DEV_TOKEN');
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
      } else {
        setAuthError('Gagal terhubung ke server atau kredensial salah.');
      }
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('cmoney_pengurus_token');
    setIsAdminLoggedIn(false);
  };

  // Fungsi Simpan Transaksi Kas oleh Pengurus
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setActionStatus('Menyimpan transaksi ke Spreadsheet...');
    try {
      const res = await CMoneyAPI.inputTransaction({
        ...txForm,
        nominal: Number(txForm.nominal)
      });
      if (res.status === 'success') {
        setActionStatus(`✅ Transaksi berhasil disimpan! Saldo baru: Rp ${Number(res.new_balance).toLocaleString('id-ID')}`);
        setTxForm({ ...txForm, nominal: '', keterangan: '', nama_proyek: '' });
        fetchDashboard();
      } else {
        setActionStatus(`❌ Gagal: ${res.message}`);
      }
    } catch (err) {
      setActionStatus(`❌ Error koneksi: ${err.message}`);
    }
  };

  // Fungsi Trigger Tutup Buku & Auto-Send WA Fonnte
  const handleTriggerClosingWa = async () => {
    setActionStatus('Memproses Tutup Buku & Mengirim Laporan WA via Fonnte...');
    try {
      const res = await CMoneyAPI.closeMonthAndSendWa(
        closingPeriod.bulan,
        closingPeriod.tahun,
        closingPeriod.target_wa
      );
      if (res.status === 'success') {
        setActionStatus(`✅ Tutup Buku Selesai! Status WA Fonnte: ${res.fonnte_status}`);
      } else {
        setActionStatus(`❌ Gagal: ${res.message}`);
      }
    } catch (err) {
      setActionStatus(`❌ Error koneksi: ${err.message}`);
    }
  };

  return (
    <div className="relative">
      {/* TAMPILAN UTAMA WARGA (TANPA LOGIN) */}
      <PublicDashboard
        dashboardData={dashboardData}
        onOpenAdminLogin={() => {
          if (!isAdminLoggedIn) setIsLoginModalOpen(true);
        }}
      />

      {/* PANEL KHUSUS PENGURUS (HIDDEN VIEW - HANYA MUNCUL JIKA LOGIN PENGURUS) */}
      {isAdminLoggedIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-center overflow-y-auto p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 my-auto shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  Hidden View • Mode Pengurus
                </span>
                <h2 className="text-base font-extrabold text-slate-800 mt-1">
                  Panel Input & Tutup Buku C-Money
                </h2>
              </div>
              <button
                onClick={handleLogoutAdmin}
                className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200"
              >
                Keluar
              </button>
            </div>

            {actionStatus && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900">
                {actionStatus}
              </div>
            )}

            {/* FORM 1: INPUT TRANSAKSI KAS MASUK / KELUAR / PROYEK */}
            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-700 uppercase tracking-wider">
                1. Input Mutasi Kas (Masuk / Keluar)
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Tipe Transaksi</label>
                  <select
                    value={txForm.tipe}
                    onChange={(e) => setTxForm({ ...txForm, tipe: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="OUT">Pengeluaran (OUT)</option>
                    <option value="IN">Pemasukan (IN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Kategori</label>
                  <select
                    value={txForm.kategori}
                    onChange={(e) =>
                      setTxForm({
                        ...txForm,
                        kategori: e.target.value,
                        is_proyek: e.target.value === 'Proyek'
                      })
                    }
                    className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="Iuran Warga">Iuran Warga</option>
                    <option value="Gaji">Gaji Security</option>
                    <option value="Sampah">Sampah</option>
                    <option value="Listrik">Listrik Pos</option>
                    <option value="Konsumsi">Konsumsi Pos</option>
                    <option value="Perawatan Pos">Perawatan Pos</option>
                    <option value="Proyek">Proyek Cluster</option>
                  </select>
                </div>
              </div>

              {txForm.is_proyek && (
                <div>
                  <label className="block text-slate-500 mb-1">
                    Nama Proyek (Tampil di Detail Proyek WA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Perbaikan Pagar dan Jembatan"
                    value={txForm.nama_proyek}
                    onChange={(e) => setTxForm({ ...txForm, nama_proyek: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="200000"
                    value={txForm.nominal}
                    onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Bulan Buku</label>
                  <select
                    value={txForm.periode_bulan}
                    onChange={(e) => setTxForm({ ...txForm, periode_bulan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-slate-50"
                  >
                    {['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(
                      (b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Detail Keterangan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Listrik Pos atau Gaji Pak Eko"
                  value={txForm.keterangan}
                  onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-700 text-white font-extrabold shadow"
              >
                💾 Simpan Transaksi ke Database
              </button>
            </form>

            {/* FORM 2: TUTUP BUKU & AUTO-SEND WHATSAPP FONNTE */}
            <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-700 uppercase tracking-wider">
                2. Tutup Buku & Kirim Laporan WA (Fonnte)
              </h3>
              <p className="text-[11px] text-slate-500">
                Menghitung otomatis Saldo Awal, Uang Masuk, Total Pengeluaran, Proyek, dan Sisa Saldo lalu mengirimkan format laporan C-Money ke grup WA.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={closingPeriod.bulan}
                  onChange={(e) => setClosingPeriod({ ...closingPeriod, bulan: e.target.value })}
                  className="border rounded-xl px-3 py-2 font-bold bg-slate-50"
                >
                  {['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(
                    (b) => (
                      <option key={b} value={b}>
                        Periode {b}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="text"
                  placeholder="ID Grup WA / No Tujuan (Opsional)"
                  value={closingPeriod.target_wa}
                  onChange={(e) => setClosingPeriod({ ...closingPeriod, target_wa: e.target.value })}
                  className="border rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="button"
                onClick={handleTriggerClosingWa}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md"
              >
                📲 Tutup Buku & Kirim WA via Fonnte Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN 1 USER PENGURUS (TANPA GMAIL) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">
                🔒 Login Khusus Pengurus CMR
              </h3>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="mt-4 space-y-3 text-xs">
              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                  {authError}
                </div>
              )}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="pengurus_cmr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Password / PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-700 text-white font-extrabold shadow-md"
              >
                Masuk ke Panel Pengurus
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
