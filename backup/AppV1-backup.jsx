import React, { useState, useEffect } from 'react';
import PublicDashboard from './components/PublicDashboard';
import { CMoneyAPI } from './services/apiService';

const INITIAL_FALLBACK_DATA = {
  app_name: 'C-Money',
  cluster_full_name: 'Cluster Mutiara Residence Sumberjaya',
  current_balance: 1452200,
  default_ipl_amount: 200000,
  total_active_houses: 21,
  qris_merchant_name: 'Cluster Mutiara Residence',
  qris_nmid: 'ID1026000000CMR',
  qris_image_url: '/assets/qris-cmr-statis.png',
  houses: Array.from({ length: 21 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const names = { '01': 'Sonny Ilham', '02': 'Kiswanto' };
    return {
      id: `H-${num}`,
      nomor_rumah: `No. ${num}`,
      nama_warga: names[num] || `Warga Blok/No ${num}`,
      status_huni: 'Aktif',
      tarif_ipl: 200000
    };
  }),
  ipl_status: Array.from({ length: 21 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      id: `IPL-202611-H${num}`,
      house_id: `H-${num}`,
      periode_bulan: 'November',
      periode_tahun: 2026,
      nominal: 200000,
      status_bayar: 'Belum Lunas',
      tanggal_bayar: '',
      catatan: 'Tagihan IPL November 2026'
    };
  }),
  cash_ledger: [
    { id: 'TX-202606-01', tanggal: '2026-06-05', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4200000, keterangan: 'Iuran Warga Periode Juni 2026' },
    { id: 'TX-202606-02', tanggal: '2026-06-10', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Perbaikan Pagar dan Jembatan', nominal: 1695600, keterangan: 'pengeluaran proyek' },
    { id: 'TX-202606-03', tanggal: '2026-06-12', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Pemasangan Lampu 2 dan Kebersihan', nominal: 1179000, keterangan: 'pengeluaran proyek' },
    { id: 'TX-202606-04', tanggal: '2026-06-15', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Periode Juni' },
    { id: 'TX-202606-05', tanggal: '2026-06-25', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 585000, keterangan: 'Gaji + Uang Makan Pak Rizki Juni' },
    { id: 'TX-202606-06', tanggal: '2026-06-18', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'bibit tanaman pos dan jasa cat pagar' },
    { id: 'TX-202606-07', tanggal: '2026-06-20', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 300000, keterangan: 'Dana Sosial' },
    { id: 'TX-202606-08', tanggal: '2026-06-22', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 111600, keterangan: 'Kopi, Teh, Gula, Susu' },
    { id: 'TX-202606-09', tanggal: '2026-06-25', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Listrik Pos' },
    { id: 'TX-202606-10', tanggal: '2026-06-28', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 30000, keterangan: 'Galon Pos 5' },
    { id: 'TX-202607-01', tanggal: '2026-07-05', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga Juli' },
    { id: 'TX-202607-02', tanggal: '2026-07-15', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'fogging', nominal: 500000, keterangan: 'fogging' },
    { id: 'TX-202607-03', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Operasional & Keamanan', is_proyek: false, nama_proyek: '', nominal: 4135800, keterangan: 'Operasional Rutin Juli' },
    { id: 'TX-202608-01', tanggal: '2026-08-05', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4300000, keterangan: 'Iuran Warga Agustus' },
    { id: 'TX-202608-02', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Operasional & Keamanan', is_proyek: false, nama_proyek: '', nominal: 4798500, keterangan: 'Operasional Rutin Agustus' },
    { id: 'TX-202609-01', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga September' },
    { id: 'TX-202609-02', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Operasional & Keamanan', is_proyek: false, nama_proyek: '', nominal: 4904300, keterangan: 'Operasional Rutin September' },
    { id: 'TX-202610-01', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4200000, keterangan: 'Iuran Warga Oktober' },
    { id: 'TX-202610-02', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Operasional & Keamanan', is_proyek: false, nama_proyek: '', nominal: 4260000, keterangan: 'Operasional Rutin Oktober' }
  ],
  monthly_closings: [
    { id: 'CLS-2026-06', periode_bulan: 'Juni', periode_tahun: 2026, saldo_awal: 3702000, uang_masuk: 4200000, total_pengeluaran: 5051200, pengeluaran_proyek: 2874600, sisa_saldo: 2850800, status_tutup_buku: 'CLOSED' },
    { id: 'CLS-2026-07', periode_bulan: 'Juli', periode_tahun: 2026, saldo_awal: 2850800, uang_masuk: 4100000, total_pengeluaran: 4635800, pengeluaran_proyek: 500000, sisa_saldo: 2315000, status_tutup_buku: 'CLOSED' },
    { id: 'CLS-2026-08', periode_bulan: 'Agustus', periode_tahun: 2026, saldo_awal: 2816000, uang_masuk: 4300000, total_pengeluaran: 4798500, pengeluaran_proyek: 0, sisa_saldo: 2316500, status_tutup_buku: 'CLOSED' },
    { id: 'CLS-2026-09', periode_bulan: 'September', periode_tahun: 2026, saldo_awal: 2316500, uang_masuk: 4100000, total_pengeluaran: 4904300, pengeluaran_proyek: 0, sisa_saldo: 1512200, status_tutup_buku: 'CLOSED' },
    { id: 'CLS-2026-10', periode_bulan: 'Oktober', periode_tahun: 2026, saldo_awal: 1512200, uang_masuk: 4200000, total_pengeluaran: 4260000, pengeluaran_proyek: 0, sisa_saldo: 1452200, status_tutup_buku: 'CLOSED' },
    { id: 'CLS-2026-11', periode_bulan: 'November', periode_tahun: 2026, saldo_awal: 1452200, uang_masuk: 0, total_pengeluaran: 0, pengeluaran_proyek: 0, sisa_saldo: 1452200, status_tutup_buku: 'OPEN' }
  ],
  security_payroll: [
    { id: 'PAY-202609-01', nama_security: 'Pak Mulyadi', periode_bulan: 'September', periode_tahun: 2026, gaji_pokok: 1600000, uang_konsumsi: 0, potongan_kasbon: 0, gaji_bersih: 1600000, status_pembayaran: 'Ditransfer' },
    { id: 'PAY-202609-02', nama_security: 'Pak Eko', periode_bulan: 'September', periode_tahun: 2026, gaji_pokok: 1600000, uang_konsumsi: 0, potongan_kasbon: 500000, gaji_bersih: 1100000, status_pembayaran: 'Ditransfer' },
    { id: 'PAY-202610-01', nama_security: 'Pak Mulyadi', periode_bulan: 'Oktober', periode_tahun: 2026, gaji_pokok: 1650000, uang_konsumsi: 0, potongan_kasbon: 0, gaji_bersih: 1650000, status_pembayaran: 'Ditransfer' },
    { id: 'PAY-202610-02', nama_security: 'Pak Eko', periode_bulan: 'Oktober', periode_tahun: 2026, gaji_pokok: 1650000, uang_konsumsi: 0, potongan_kasbon: 350000, gaji_bersih: 1300000, status_pembayaran: 'Ditransfer' }
  ]
};

export default function App() {
  const [dashboardData, setDashboardData] = useState(INITIAL_FALLBACK_DATA);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    Boolean(localStorage.getItem('cmoney_pengurus_token'))
  );
  const [adminTab, setAdminTab] = useState('kas');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  // Form State 1: Input Transaksi Kas
  const [txForm, setTxForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    periode_bulan: 'November',
    periode_tahun: 2026,
    tipe: 'OUT',
    kategori: 'Sampah',
    is_proyek: false,
    nama_proyek: '',
    nominal: '',
    keterangan: ''
  });

  // Form State 2: Gaji & Kasbon Security
  const [payrollForm, setPayrollForm] = useState({
    nama_security: 'Pak Eko',
    periode_bulan: 'November',
    periode_tahun: 2026,
    gaji_pokok: 1650000,
    uang_konsumsi: 50000,
    potongan_kasbon: 0
  });

  // Form State 3: Tutup Buku & WA Fonnte
  const [closingPeriod, setClosingPeriod] = useState({
    bulan: 'Juni',
    tahun: 2026,
    target_wa: ''
  });

  const formatRp = (num) => Number(num || 0).toLocaleString('id-ID');

  const fetchDashboard = async () => {
    try {
      const res = await CMoneyAPI.getPublicDashboard('November', 2026);
      if (res && res.status === 'success') {
        setDashboardData((prev) => ({ ...prev, ...res }));
      }
    } catch {
      // Tetap gunakan baseline data jika GAS belum dihubungkan
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Fungsi Generator Live Preview Laporan WA (Format Identik C-Money Fonnte)
  const generateWaPreviewText = (bulan, tahun) => {
    const closingRow = (dashboardData.monthly_closings || []).find(
      (c) => c.periode_bulan === bulan && Number(c.periode_tahun) === Number(tahun)
    );
    const saldoAwal = closingRow ? Number(closingRow.saldo_awal || 0) : 1452200;
    const ledger = (dashboardData.cash_ledger || []).filter(
      (r) => r.periode_bulan === bulan && Number(r.periode_tahun) === Number(tahun)
    );

    let uangMasuk = 0;
    let totalPengeluaran = 0;
    let pengeluaranProyek = 0;
    const pemasukanMap = {};
    const pengeluaranMap = {};
    const proyekList = [];

    ledger.forEach((item) => {
      const nom = Number(item.nominal || 0);
      const kat = item.kategori || 'Lainnya';
      const ket = item.keterangan || '-';
      if (item.tipe === 'IN') {
        uangMasuk += nom;
        pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
      } else {
        totalPengeluaran += nom;
        if (item.is_proyek) {
          pengeluaranProyek += nom;
          proyekList.push({ nama: item.nama_proyek || ket, nominal: nom });
        }
        if (!pengeluaranMap[kat]) pengeluaranMap[kat] = { total: 0, details: [] };
        pengeluaranMap[kat].total += nom;
        pengeluaranMap[kat].details.push(`${ket} (Rp ${formatRp(nom)})`);
      }
    });

    const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;
    const lines = [
      `*C-Money | Laporan Bulanan Cluster Mutiara Residence Sumberjaya*`,
      `Periode: ${bulan} ${tahun}`,
      ``,
      `Halo warga Mutiara Residence Sumberjaya, berikut rekap kas bulanan kita:`,
      ``,
      `Saldo Awal: Rp ${formatRp(saldoAwal)}`,
      `Uang Masuk: Rp ${formatRp(uangMasuk)}`,
      `Total Pengeluaran: Rp ${formatRp(totalPengeluaran)}`,
      `Pengeluaran Proyek: Rp ${formatRp(pengeluaranProyek)}`,
      `Sisa Saldo: Rp ${formatRp(sisaSaldo)}`,
      ``,
      `*Breakdown Pemasukan per Kategori*`
    ];
    Object.keys(pemasukanMap).forEach((k) =>
      lines.push(`• ${k}: Rp ${formatRp(pemasukanMap[k])}`)
    );
    lines.push(``, `*Breakdown Pengeluaran per Kategori*`);
    Object.keys(pengeluaranMap).forEach((k) => {
      const item = pengeluaranMap[k];
      lines.push(`• ${k}: Rp ${formatRp(item.total)} | detail: ${item.details.join(', ')}`);
    });
    if (proyekList.length > 0) {
      lines.push(``, `*Detail Proyek:*`);
      proyekList.forEach((p) => lines.push(`• ${p.nama} - Rp ${formatRp(p.nominal)}`));
    }
    return lines.join('\n');
  };

  // Login Pengurus
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await CMoneyAPI.loginPengurus(username, password);
      if (res.status === 'success') {
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setIsAdminModalOpen(true);
      } else {
        setAuthError(res.message || 'Username atau password salah.');
      }
    } catch {
      if (username === 'pengurus_cmr' && password === 'cmr_admin_2026') {
        localStorage.setItem('cmoney_pengurus_token', 'LOCAL_DEV_TOKEN');
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setIsAdminModalOpen(true);
      } else {
        setAuthError('Username atau password pengurus salah.');
      }
    }
  };

  // Simpan Mutasi Kas Baru
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const nominalNum = Number(txForm.nominal || 0);
    const newTx = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      ...txForm,
      nominal: nominalNum
    };

    const newBalance =
      txForm.tipe === 'IN'
        ? dashboardData.current_balance + nominalNum
        : dashboardData.current_balance - nominalNum;

    setDashboardData((prev) => ({
      ...prev,
      current_balance: newBalance,
      cash_ledger: [newTx, ...prev.cash_ledger]
    }));

    setActionStatus(`✅ Transaksi disimpan! Saldo Kas menjadi Rp ${formatRp(newBalance)}`);
    setTxForm({ ...txForm, nominal: '', keterangan: '', nama_proyek: '' });

    try {
      await CMoneyAPI.inputTransaction(newTx);
    } catch {
      // Tersimpan di state lokal jika GAS belum aktif
    }
  };

  // Toggle Status Lunas / Belum Lunas 21 Rumah oleh Pengurus
  const handleToggleHouseIpl = async (houseId, currentStatus) => {
    const nextStatus = currentStatus === 'Lunas' ? 'Belum Lunas' : 'Lunas';
    const today = new Date().toISOString().slice(0, 10);

    setDashboardData((prev) => {
      const updatedIpl = prev.ipl_status.map((item) =>
        item.house_id === houseId
          ? { ...item, status_bayar: nextStatus, tanggal_bayar: nextStatus === 'Lunas' ? today : '' }
          : item
      );
      const balanceDiff = nextStatus === 'Lunas' ? 200000 : -200000;
      return {
        ...prev,
        current_balance: prev.current_balance + balanceDiff,
        ipl_status: updatedIpl
      };
    });

    setActionStatus(`✅ Status IPL ${houseId} diubah menjadi ${nextStatus}.`);
    try {
      await CMoneyAPI.updateIplStatus({
        house_id: houseId,
        periode_bulan: 'November',
        periode_tahun: 2026,
        status_bayar: nextStatus,
        tanggal_bayar: today
      });
    } catch {
      // State lokal sudah diperbarui
    }
  };

  // Simpan Gaji & Kasbon Security
  const handleSavePayroll = async (e) => {
    e.preventDefault();
    const bersih =
      Number(payrollForm.gaji_pokok) +
      Number(payrollForm.uang_konsumsi) -
      Number(payrollForm.potongan_kasbon);

    const newPay = {
      id: `PAY-${Date.now().toString().slice(-5)}`,
      ...payrollForm,
      gaji_bersih: bersih,
      status_pembayaran: 'Ditransfer'
    };

    setDashboardData((prev) => ({
      ...prev,
      security_payroll: [newPay, ...prev.security_payroll]
    }));
    setActionStatus(
      `✅ Gaji ${payrollForm.nama_security} (${payrollForm.periode_bulan}) tercatat: Bersih Rp ${formatRp(bersih)}`
    );

    try {
      await CMoneyAPI.inputSecurityPayroll(newPay);
    } catch {
      // State lokal sudah diperbarui
    }
  };

  // Trigger Kirim Laporan WA via Fonnte
  const handleSendWaClosing = async () => {
    setActionStatus('📲 Mengirim laporan tutup buku ke Grup WA via Fonnte...');
    try {
      const res = await CMoneyAPI.closeMonthAndSendWa(
        closingPeriod.bulan,
        closingPeriod.tahun,
        closingPeriod.target_wa
      );
      setActionStatus(`✅ Tutup Buku Selesai! Status Fonnte: ${res.fonnte_status}`);
    } catch {
      setActionStatus(
        '✅ Simulasi Tutup Buku selesai! (Pasang URL GAS & Token Fonnte di app_settings untuk pengiriman live ke WA).'
      );
    }
  };

  return (
    <div className="relative">
      <PublicDashboard
        dashboardData={dashboardData}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => {
          if (isAdminLoggedIn) {
            setIsAdminModalOpen(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        onUploadIplProof={(proof) => {
          handleToggleHouseIpl(proof.house_id, 'Belum Lunas');
        }}
      />

      {/* ================= STEP 3B: HIDDEN VIEW PANEL PENGURUS (4 MODUL) ================= */}
      {isAdminLoggedIn && isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header Panel Pengurus */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  Hidden View • Mode Pengurus CMR (1 Akun Tanpa Gmail)
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 mt-1">
                  Panel Kendali Bendahara & Pengurus C-Money
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAdminModalOpen(false)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl"
                >
                  Tutup Panel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('cmoney_pengurus_token');
                    setIsAdminLoggedIn(false);
                    setIsAdminModalOpen(false);
                  }}
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Sub-Menu 4 Modul Pengurus */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'kas', label: '1. Input Mutasi Kas' },
                { id: 'ipl', label: '2. Validasi 21 Rumah' },
                { id: 'gaji', label: '3. Gaji & Kasbon Satpam' },
                { id: 'fonnte', label: '4. Tutup Buku & WA Fonnte' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setAdminTab(t.id);
                    setActionStatus('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-extrabold border transition ${
                    adminTab === t.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {actionStatus && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                {actionStatus}
              </div>
            )}

            {/* MODUL 1: INPUT MUTASI KAS & PROYEK */}
            {adminTab === 'kas' && (
              <form onSubmit={handleSaveTransaction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Tipe Transaksi</label>
                  <select
                    value={txForm.tipe}
                    onChange={(e) => setTxForm({ ...txForm, tipe: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold bg-slate-50"
                  >
                    <option value="OUT">Pengeluaran Kas (OUT)</option>
                    <option value="IN">Pemasukan Kas (IN)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kategori</label>
                  <select
                    value={txForm.kategori}
                    onChange={(e) =>
                      setTxForm({
                        ...txForm,
                        kategori: e.target.value,
                        is_proyek: e.target.value === 'Proyek'
                      })
                    }
                    className="w-full border rounded-xl px-3 py-2.5 font-bold bg-slate-50"
                  >
                    <option value="Iuran Warga">Iuran Warga</option>
                    <option value="Gaji">Gaji Security</option>
                    <option value="Sampah">Retribusi Sampah</option>
                    <option value="Listrik">Listrik Pos</option>
                    <option value="Konsumsi">Konsumsi Pos</option>
                    <option value="Perawatan Pos">Perawatan Pos</option>
                    <option value="Proyek">Proyek Cluster</option>
                  </select>
                </div>

                {txForm.is_proyek && (
                  <div className="sm:col-span-2">
                    <label className="font-bold text-amber-800 block mb-1">
                      Nama Proyek (Muncul di Bagian Detail Proyek Laporan WA)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Perbaikan Pagar dan Jembatan"
                      value={txForm.nama_proyek}
                      onChange={(e) => setTxForm({ ...txForm, nama_proyek: e.target.value })}
                      className="w-full border border-amber-300 rounded-xl px-3 py-2.5 bg-amber-50/40"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 700000"
                    value={txForm.nominal}
                    onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Periode Bulan Buku</label>
                  <select
                    value={txForm.periode_bulan}
                    onChange={(e) => setTxForm({ ...txForm, periode_bulan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold bg-slate-50"
                  >
                    {['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(
                      (b) => (
                        <option key={b} value={b}>
                          {b} 2026
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">
                    Rincian Keterangan (Muncul di Detail Kategori WA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gaji + Uang Makan Security atau Listrik Pos"
                    value={txForm.keterangan}
                    onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold shadow-md"
                  >
                    💾 Simpan Transaksi & Perbarui Saldo Kas
                  </button>
                </div>
              </form>
            )}

            {/* MODUL 2: VALIDASI CEPAT IPL 21 RUMAH */}
            {adminTab === 'ipl' && (
              <div className="space-y-3 pt-2 text-xs">
                <p className="text-slate-500">
                  Klik tombol status pada masing-masing rumah untuk mengubah status pembayaran IPL
                  bulan berjalan secara cepat:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {dashboardData.houses.map((h) => {
                    const row = dashboardData.ipl_status.find((r) => r.house_id === h.id);
                    const status = row?.status_bayar || 'Belum Lunas';
                    const isLunas = status === 'Lunas';
                    return (
                      <div
                        key={h.id}
                        className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50"
                      >
                        <div>
                          <p className="font-extrabold text-slate-800">{h.nomor_rumah}</p>
                          <p className="text-[11px] text-slate-500">{h.nama_warga}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleHouseIpl(h.id, status)}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition ${
                            isLunas
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {isLunas ? '✓ Lunas' : 'Set Lunas'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODUL 3: INPUT GAJI & POTONGAN KASBON SECURITY */}
            {adminTab === 'gaji' && (
              <form onSubmit={handleSavePayroll} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Pilih Petugas Security</label>
                  <select
                    value={payrollForm.nama_security}
                    onChange={(e) => setPayrollForm({ ...payrollForm, nama_security: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold bg-slate-50"
                  >
                    <option value="Pak Mulyadi">Pak Mulyadi</option>
                    <option value="Pak Eko">Pak Eko</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Periode Gaji</label>
                  <select
                    value={payrollForm.periode_bulan}
                    onChange={(e) => setPayrollForm({ ...payrollForm, periode_bulan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold bg-slate-50"
                  >
                    {['September', 'Oktober', 'November', 'Desember'].map((b) => (
                      <option key={b} value={b}>
                        {b} 2026
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={payrollForm.gaji_pokok}
                    onChange={(e) => setPayrollForm({ ...payrollForm, gaji_pokok: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Tambahan Uang Konsumsi Tunai (Rp)
                  </label>
                  <input
                    type="number"
                    value={payrollForm.uang_konsumsi}
                    onChange={(e) => setPayrollForm({ ...payrollForm, uang_konsumsi: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-rose-700 block mb-1">
                    Potongan Kasbon Bulan Berjalan (Rp)
                  </label>
                  <input
                    type="number"
                    value={payrollForm.potongan_kasbon}
                    onChange={(e) =>
                      setPayrollForm({ ...payrollForm, potongan_kasbon: e.target.value })
                    }
                    className="w-full border border-rose-200 rounded-xl px-3 py-2.5 font-bold bg-rose-50/30"
                  />
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-900">
                    Total Gaji Bersih Diterima (Otomatis):
                  </span>
                  <span className="text-base font-black text-emerald-800">
                    Rp{' '}
                    {formatRp(
                      Number(payrollForm.gaji_pokok) +
                        Number(payrollForm.uang_konsumsi) -
                        Number(payrollForm.potongan_kasbon)
                    )}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold shadow-md"
                  >
                    💾 Simpan Slip Gaji & Potongan Kasbon
                  </button>
                </div>
              </form>
            )}

            {/* MODUL 4: TUTUP BUKU & LIVE PREVIEW LAPORAN WA FONNTE */}
            {adminTab === 'fonnte' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="space-y-3">
                  <label className="font-bold text-slate-700 block">
                    Pilih Periode Laporan Bulanan
                  </label>
                  <select
                    value={closingPeriod.bulan}
                    onChange={(e) => setClosingPeriod({ ...closingPeriod, bulan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 font-bold bg-slate-50"
                  >
                    {['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November'].map((b) => (
                      <option key={b} value={b}>
                        Periode {b} 2026
                      </option>
                    ))}
                  </select>

                  <label className="font-bold text-slate-700 block">
                    Target ID Grup WA / Nomor WA Fonnte (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk memakai default app_settings"
                    value={closingPeriod.target_wa}
                    onChange={(e) =>
                      setClosingPeriod({ ...closingPeriod, target_wa: e.target.value })
                    }
                    className="w-full border rounded-xl px-3 py-2.5"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        generateWaPreviewText(closingPeriod.bulan, closingPeriod.tahun)
                      );
                      setActionStatus('✅ Teks laporan WhatsApp berhasil disalin ke clipboard!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold"
                  >
                    📋 Salin Teks Laporan WA Manual
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWaClosing}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md"
                  >
                    📲 Tutup Buku & Auto-Send ke Grup WA (Fonnte)
                  </button>
                </div>

                {/* Live Preview Kotak Hijau WhatsApp */}
                <div className="bg-[#075E54] text-white rounded-2xl p-4 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto shadow-inner">
                  {generateWaPreviewText(closingPeriod.bulan, closingPeriod.tahun)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL LOGIN 1 USER PENGURUS */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                  placeholder="cmr_admin_2026"
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