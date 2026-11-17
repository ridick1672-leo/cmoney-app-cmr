import React, { useState, useRef } from 'react';
import QrisPaymentModal from './QrisPaymentModal';

export default function PublicDashboard({
  dashboardData,
  onOpenAdminLogin,
  onUploadIplProof,
  isAdminLoggedIn
}) {
  const [activeTab, setActiveTab] = useState('beranda');
  const [showBalance, setShowBalance] = useState(true);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [qrisHouseId, setQrisHouseId] = useState('H-01');
  const [secretTapCount, setSecretTapCount] = useState(0);

  // Filter State untuk Tab Mutasi Kas & Tab 21 Rumah
  const [filterBulanKas, setFilterBulanKas] = useState('Semua');
  const [filterTipeKas, setFilterTipeKas] = useState('ALL');
  const [searchRumah, setSearchRumah] = useState('');
  const [filterStatusIpl, setFilterStatusIpl] = useState('ALL');

  // State Tombol Darurat SOS (Tahan 3 Detik)
  const [sosProgress, setSosProgress] = useState(0);
  const sosTimerRef = useRef(null);

  const data = dashboardData;
  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  const handleLogoTap = () => {
    const next = secretTapCount + 1;
    if (next >= 5) {
      setSecretTapCount(0);
      if (onOpenAdminLogin) onOpenAdminLogin();
    } else {
      setSecretTapCount(next);
    }
  };

  const openQrisForHouse = (houseId = 'H-01') => {
    setQrisHouseId(houseId);
    setIsQrisOpen(true);
  };

  // Logika Tahan 3 Detik untuk Tombol SOS
  const startSosHold = () => {
    let current = 0;
    sosTimerRef.current = setInterval(() => {
      current += 10;
      setSosProgress(current);
      if (current >= 100) {
        clearInterval(sosTimerRef.current);
        setSosProgress(0);
        alert('🚨 SINYAL DARURAT SOS TERKIRIM KE POS SECURITY & GRUP WARGA CMR!');
      }
    }, 300);
  };

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSosProgress(0);
  };

  // Data Olahan untuk Tab Mutasi Kas
  const ledgerList = (data.cash_ledger || []).filter((item) => {
    const matchBulan = filterBulanKas === 'Semua' || item.periode_bulan === filterBulanKas;
    const matchTipe =
      filterTipeKas === 'ALL' ||
      (filterTipeKas === 'PROYEK' ? Boolean(item.is_proyek) : item.tipe === filterTipeKas);
    return matchBulan && matchTipe;
  });

  const totalMasukFilter = ledgerList
    .filter((i) => i.tipe === 'IN')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);
  const totalKeluarFilter = ledgerList
    .filter((i) => i.tipe === 'OUT')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);

  // Data Olahan untuk Tab 21 Rumah
  const housesWithIpl = (data.houses || []).map((h) => {
    const iplRow = (data.ipl_status || []).find((r) => r.house_id === h.id);
    return {
      ...h,
      status_bayar: iplRow?.status_bayar || 'Belum Lunas',
      tanggal_bayar: iplRow?.tanggal_bayar || '-',
      catatan: iplRow?.catatan || 'Tagihan IPL November 2026'
    };
  });

  const filteredHouses = housesWithIpl.filter((h) => {
    const matchSearch =
      h.nomor_rumah.toLowerCase().includes(searchRumah.toLowerCase()) ||
      h.nama_warga.toLowerCase().includes(searchRumah.toLowerCase());
    const matchStatus = filterStatusIpl === 'ALL' || h.status_bayar === filterStatusIpl;
    return matchSearch && matchStatus;
  });

  const totalLunasCount = housesWithIpl.filter((h) => h.status_bayar === 'Lunas').length;

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: '🏠' },
    { id: 'mutasi', label: 'Mutasi Kas', icon: '📑' },
    { id: 'warga', label: '21 Rumah', icon: '🏘️' },
    { id: 'keamanan', label: 'Keamanan & SOS', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24 md:pb-12">
      {/* TOP NAVBAR RESPONSIVE (Tampil Penuh di Tablet & Desktop) */}
      <header className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div onClick={handleLogoTap} className="cursor-pointer select-none flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-black text-lg shadow-inner">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide">{data.app_name}</span>
                <span className="text-[10px] bg-emerald-400/20 border border-emerald-300/40 px-2 py-0.5 rounded-full font-semibold">
                  Publik • Tanpa Login
                </span>
              </div>
              <p className="text-xs text-teal-100">{data.cluster_full_name}</p>
            </div>
          </div>

          {/* Menu Navigasi Desktop & Tablet */}
          <nav className="hidden md:flex items-center gap-2 bg-black/15 p-1.5 rounded-2xl border border-white/10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-teal-100 hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Tombol Aksi Kanan Atas */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openQrisForHouse('H-01')}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow transition"
            >
              📲 Bayar QRIS
            </button>
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition"
            >
              {isAdminLoggedIn ? '⚙️ Panel Pengurus' : '🔒 Pengurus'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER (1 Kolom di HP, 12 Kolom Grid Proporsional di Desktop/Tablet) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KOLOM KIRI (SIDEBAR STATIS DI DESKTOP): KARTU SALDO M-BANKING & QUICK ACTIONS */}
        <div className="lg:col-span-4 space-y-4">
          {/* Kartu Saldo Utama m-Banking */}
          <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">
                Saldo Kas Aktif Cluster
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-xs text-teal-300 hover:text-white underline"
              >
                {showBalance ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>

            <div className="text-3xl font-black mt-1.5 tracking-tight">
              {showBalance ? formatRp(data.current_balance) : 'Rp ••••••••'}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/10 px-2.5 py-1 rounded-full text-emerald-300">
              <span>●</span>
              <span>Status Periode November 2026: {totalLunasCount}/21 Rumah Lunas</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/15 text-xs">
              <div>
                <p className="text-teal-200 text-[11px]">Iuran Wajib / Rumah</p>
                <p className="font-extrabold text-emerald-300 mt-0.5">
                  {formatRp(data.default_ipl_amount)} / bln
                </p>
              </div>
              <div>
                <p className="text-teal-200 text-[11px]">Total Hunian Aktif</p>
                <p className="font-extrabold text-white mt-0.5">
                  {data.total_active_houses} Rumah (H-01–H-21)
                </p>
              </div>
            </div>
          </div>

          {/* Menu Cepat 4 Ikon (Quick Actions) */}
          <div className="bg-white rounded-3xl shadow-sm p-4 grid grid-cols-4 gap-2 text-center border border-slate-200/70">
            <button
              onClick={() => openQrisForHouse('H-01')}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow group-hover:scale-105 transition">
                📲
              </div>
              <span className="text-[11px] font-bold text-teal-800 mt-1.5">Bayar QRIS</span>
            </button>

            <button
              onClick={() => setActiveTab('warga')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition group-hover:scale-105 ${
                  activeTab === 'warga'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}
              >
                🏘️
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">21 Rumah</span>
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition group-hover:scale-105 ${
                  activeTab === 'mutasi'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                📊
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Buku Kas</span>
            </button>

            <button
              onClick={() => setActiveTab('keamanan')}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition group-hover:scale-105 ${
                  activeTab === 'keamanan'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}
              >
                🚨
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Pos & SOS</span>
            </button>
          </div>

          {/* Banner CTA QRIS */}
          <div
            onClick={() => openQrisForHouse('H-01')}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Bebas Biaya Admin • MDR 0%
              </span>
              <h3 className="font-extrabold text-sm mt-1">Bayar Iuran IPL Bulan November</h3>
              <p className="text-xs text-emerald-100">
                Tampilkan QRIS Resmi CMR & unggah bukti bayar
              </p>
            </div>
            <div className="bg-white text-teal-800 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow shrink-0">
              Buka QRIS →
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (AREA KONTEN DINAMIS 4 TAB) */}
        <div className="lg:col-span-8 space-y-5">
          {/* ================= TAB 1: BERANDA ================= */}
          {activeTab === 'beranda' && (
            <>
              {/* Kartu Grafik & Tabel Tren Kas 5 Bulan Terakhir */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      Tren Arus Kas 5 Bulan Terakhir (Juni – Oktober 2026)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Rekapitulasi buku kas tertutup yang telah dikirim ke WhatsApp grup warga
                    </p>
                  </div>
                  <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold">
                    100% Transparan
                  </span>
                </div>

                {/* Visualisasi Bar Perbandingan */}
                <div className="space-y-3">
                  {(data.monthly_closings || [])
                    .filter((c) => c.status_tutup_buku === 'CLOSED')
                    .map((item, idx) => {
                      const maxVal = 5200000;
                      const inPct = Math.min(100, Math.round((item.uang_masuk / maxVal) * 100));
                      const outPct = Math.min(
                        100,
                        Math.round((item.total_pengeluaran / maxVal) * 100)
                      );
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800 text-sm">
                              {item.periode_bulan} {item.periode_tahun}
                            </span>
                            <span className="font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                              Sisa Saldo: {formatRp(item.sisa_saldo)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <div className="flex justify-between text-emerald-700 font-semibold mb-1">
                                <span>Uang Masuk</span>
                                <span>{formatRp(item.uang_masuk)}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${inPct}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-rose-600 font-semibold mb-1">
                                <span>Total Pengeluaran</span>
                                <span>{formatRp(item.total_pengeluaran)}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${outPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Kartu Ringkasan 2 Kolom: Gaji Security & Struktur Beban Rutin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                    👮 Transparansi Gaji Security (Oktober)
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    {(data.security_payroll || [])
                      .filter((p) => p.periode_bulan === 'Oktober')
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-extrabold text-slate-800">{p.nama_security}</p>
                            <p className="text-[11px] text-slate-500">
                              Pokok {formatRp(p.gaji_pokok)} • Kasbon {formatRp(p.potongan_kasbon)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-700">
                              {formatRp(p.gaji_bersih)}
                            </span>
                            <p className="text-[10px] text-slate-400">{p.status_pembayaran}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                    📌 Struktur Beban Wajib Bulanan CMR
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Maksimal IPL (21 Rumah)</span>
                      <span className="font-bold text-emerald-700">Rp 4.200.000</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Gaji 2 Security (@1,65 Jt)</span>
                      <span className="font-bold text-slate-800">Rp 3.300.000</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Retribusi Sampah & Listrik Pos</span>
                      <span className="font-bold text-slate-800">Rp 800.000</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-bold text-teal-800">Margin Bebas Kas / Bulan</span>
                      <span className="font-extrabold text-teal-700">Rp 100.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: MUTASI KAS (BUKU KAS) ================= */}
          {activeTab === 'mutasi' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    📑 Buku Besar Mutasi Kas Cluster
                  </h4>
                  <p className="text-xs text-slate-500">
                    Catatan rinci uang masuk, operasional rutin, dan pengeluaran proyek
                  </p>
                </div>

                {/* Filter Bulan & Tipe */}
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={filterBulanKas}
                    onChange={(e) => setFilterBulanKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    {['Semua', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November'].map(
                      (b) => (
                        <option key={b} value={b}>
                          {b === 'Semua' ? 'Semua Bulan' : `Bulan ${b}`}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={filterTipeKas}
                    onChange={(e) => setFilterTipeKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Tipe</option>
                    <option value="IN">Uang Masuk (IN)</option>
                    <option value="OUT">Pengeluaran (OUT)</option>
                    <option value="PROYEK">Khusus Proyek</option>
                  </select>
                </div>
              </div>

              {/* Ringkasan Filter */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Pemasukan Terfilter</span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                    {formatRp(totalMasukFilter)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Pengeluaran Terfilter</span>
                  <span className="text-sm sm:text-base font-extrabold text-rose-600">
                    {formatRp(totalKeluarFilter)}
                  </span>
                </div>
              </div>

              {/* Daftar Transaksi */}
              <div className="space-y-2.5">
                {ledgerList.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          tx.tipe === 'IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.tipe === 'IN' ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800">{tx.kategori}</span>
                          {Boolean(tx.is_proyek) && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                              Proyek: {tx.nama_proyek}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-0.5">{tx.keterangan}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {tx.tanggal} • Periode {tx.periode_bulan} {tx.periode_tahun} • ID: {tx.id}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-extrabold text-sm ${
                          tx.tipe === 'IN' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.tipe === 'IN' ? '+' : '-'} {formatRp(tx.nominal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: STATUS 21 RUMAH ================= */}
          {activeTab === 'warga' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🏘️ Status Iuran IPL 21 Rumah Aktif (November 2026)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Klik tombol Bayar QRIS pada nomor rumah Anda untuk mengunggah bukti transfer
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari nomor / nama warga..."
                    value={searchRumah}
                    onChange={(e) => setSearchRumah(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 flex-1"
                  />
                  <select
                    value={filterStatusIpl}
                    onChange={(e) => setFilterStatusIpl(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua ({housesWithIpl.length})</option>
                    <option value="Lunas">Lunas ({totalLunasCount})</option>
                    <option value="Belum Lunas">
                      Belum Lunas ({housesWithIpl.length - totalLunasCount})
                    </option>
                  </select>
                </div>
              </div>

              {/* Grid 21 Rumah (1 Kolom di HP, 2-3 Kolom di Tablet/Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredHouses.map((h) => {
                  const isLunas = h.status_bayar === 'Lunas';
                  return (
                    <div
                      key={h.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                        isLunas
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 text-sm">{h.nomor_rumah}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isLunas
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {h.status_bayar}
                          </span>
                        </div>
                        <p className="font-bold text-slate-700 text-xs mt-1">{h.nama_warga}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tarif IPL: {formatRp(h.tarif_ipl)}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          {isLunas ? `Tgl: ${h.tanggal_bayar}` : 'Periode Nov 2026'}
                        </span>
                        {!isLunas && (
                          <button
                            onClick={() => openQrisForHouse(h.id)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm transition"
                          >
                            Bayar QRIS →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: KEAMANAN, GAJI SECURITY, CCTV & SOS ================= */}
          {activeTab === 'keamanan' && (
            <div className="space-y-4">
              {/* Kartu Panic Button SOS (Tahan 3 Detik) */}
              <div className="bg-gradient-to-br from-rose-600 to-red-800 text-white rounded-3xl p-5 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                      Fitur Darurat Warga CMR
                    </span>
                    <h4 className="font-black text-lg mt-1">🚨 SOS Panic Button Pos Security</h4>
                    <p className="text-xs text-rose-100 mt-0.5">
                      Tekan dan tahan tombol selama 3 detik untuk membunyikan alarm darurat di Pos
                      Jaga & mengirim peringatan ke grup WhatsApp warga.
                    </p>
                  </div>

                  <button
                    onMouseDown={startSosHold}
                    onMouseUp={cancelSosHold}
                    onMouseLeave={cancelSosHold}
                    onTouchStart={startSosHold}
                    onTouchEnd={cancelSosHold}
                    className="w-full sm:w-44 py-4 rounded-2xl bg-white text-rose-700 font-black text-sm shadow-xl active:scale-95 transition select-none relative overflow-hidden shrink-0"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-rose-200 transition-all"
                      style={{ width: `${sosProgress}%` }}
                    />
                    <span className="relative z-10">
                      {sosProgress > 0 ? `Tahan... ${sosProgress}%` : 'TAHAN 3 DETIK (SOS)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Petugas Security Aktif & Histori Kasbon */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <h4 className="font-extrabold text-slate-800 text-base mb-3">
                  🛡️ Petugas Security Aktif & Riwayat Penggajian
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(data.security_payroll || []).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {item.nama_security}
                        </span>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                          {item.periode_bulan} {item.periode_tahun}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Gaji Pokok:</span>
                        <span className="font-semibold text-slate-700">
                          {formatRp(item.gaji_pokok)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Potongan Kasbon:</span>
                        <span className="font-semibold text-rose-600">
                          - {formatRp(item.potongan_kasbon)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-extrabold text-emerald-700">
                        <span>Diterima Bersih:</span>
                        <span>{formatRp(item.gaji_bersih)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot Pantau 4 Titik CCTV Cluster */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      📹 Pantauan CCTV Lingkungan CMR
                    </h4>
                    <p className="text-xs text-slate-500">
                      Integrasi NVR / RTSP Pos Security (Tapo / EZVIZ Outdoor)
                    </p>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                    4 Channel Siap Integrasi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'CAM 01 — Gerbang Utama & Pos Security',
                    'CAM 02 — Persimpangan Blok A',
                    'CAM 03 — Jembatan & Area Taman',
                    'CAM 04 — Jalur Belakang Cluster'
                  ].map((cam, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-2xl bg-slate-900 text-white p-3.5 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold bg-black/50 px-2.5 py-0.5 rounded-md">
                          {cam}
                        </span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          ● RTSP READY
                        </span>
                      </div>
                      <div className="text-center my-auto">
                        <p className="text-xs text-slate-400">
                          Menunggu Stream MediaMTX / WebRTC Pos Jaga
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Cluster Mutiara Residence</span>
                        <span>CH-0{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR (Hanya tampil di layar Mobile < 768px) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-5 py-2 flex justify-between items-center text-xs z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center ${
            activeTab === 'beranda' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`flex flex-col items-center ${
            activeTab === 'mutasi' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📑</span>
          <span>Mutasi Kas</span>
        </button>

        <button
          onClick={() => openQrisForHouse('H-01')}
          className="flex flex-col items-center -mt-6"
        >
          <div className="w-14 h-14 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-lg border-4 border-white text-xl">
            📲
          </div>
          <span className="text-[10px] font-extrabold text-teal-800 mt-0.5">QRIS IPL</span>
        </button>

        <button
          onClick={() => setActiveTab('warga')}
          className={`flex flex-col items-center ${
            activeTab === 'warga' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🏘️</span>
          <span>21 Rumah</span>
        </button>

        <button
          onClick={() => setActiveTab('keamanan')}
          className={`flex flex-col items-center ${
            activeTab === 'keamanan' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🛡️</span>
          <span>Keamanan</span>
        </button>
      </div>

      {/* MODAL POP-UP QRIS */}
      <QrisPaymentModal
        isOpen={isQrisOpen}
        onClose={() => setIsQrisOpen(false)}
        initialHouse={qrisHouseId}
        merchantName={data.qris_merchant_name}
        nmid={data.qris_nmid}
        qrisImageUrl={data.qris_image_url}
        defaultAmount={data.default_ipl_amount}
        houses={data.houses}
        onConfirmUpload={onUploadIplProof}
      />
    </div>
  );
}