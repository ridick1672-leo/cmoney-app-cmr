import React, { useState, useEffect, useMemo, useRef } from 'react';
import QrisPaymentModal from './QrisPaymentModal';

// ============================================================================
// DATA LENGKAP 55 TRANSAKSI HISTORIS (JUNI - OKTOBER 2026) - TERKUNCI V2
// ============================================================================
const FALLBACK_LEDGER = [
  // OKTOBER 2026 (10 Transaksi)
  { id: 'TX-202610-10', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 60000, keterangan: 'Air Minum Galon', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-09', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Token Listrik', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-08', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 350000, keterangan: 'Kasbon pak eko', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-07', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Lampu jalan + jasa pasang', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-06', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1300000, keterangan: 'Gaji pak eko', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-05', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji pak mulyadi', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-04', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang sampah', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-03', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 50000, keterangan: 'Ganti Fitting lampu dan jasa pasang', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-02', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 8000, keterangan: 'Beli batrei jam', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-01', tanggal: '2026-10-31', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4200000, keterangan: 'Iuran Warga Oktober (21 Rumah)', house_id: 'ALL', url_bukti: '-' },

  // SEPTEMBER 2026 (12 Transaksi)
  { id: 'TX-202609-12', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 210000, keterangan: 'Perbaikan Pagar', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-11', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 500000, keterangan: 'Kasbon pak Eko 2x', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-10', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 47000, keterangan: 'Alat kebersihan', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-09', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Ganti dinamo kipas pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-08', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 57300, keterangan: 'Kopi dan Gula', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-07', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 300000, keterangan: 'Dana Sosial', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-06', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 240000, keterangan: 'Plang Nama CMR + Rokok', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-05', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 50000, keterangan: 'Lampu dan laminating', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-04', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1100000, keterangan: 'Gaji pak Eko', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-03', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji pak Mulyadi', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-02', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-01', tanggal: '2026-09-30', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4100000, keterangan: 'Iuran Warga September', house_id: 'ALL', url_bukti: '-' },

  // AGUSTUS 2026 (14 Transaksi)
  { id: 'TX-202608-14', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 250000, keterangan: 'Uang Ambulance', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-13', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 120000, keterangan: 'Uang Lembur Satpam', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-12', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 132700, keterangan: 'Kopi, Gula, Teh, Cup gelas', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-11', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 60000, keterangan: 'Air Galon Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-10', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Token Listrik Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-09', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 165800, keterangan: 'Lampu sorot + kabel', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-08', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Bendera + Umbul-umbul', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-07', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Beli Tempat Sampah Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-06', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 200000, keterangan: 'Jasa potong rumput', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-05', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 900000, keterangan: 'Beli Toren Air + Pipa instalasi', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-04', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji Pak Eko', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-03', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah Agustus', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-02', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Tunggakan Iuran Bulan Lalu', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-01', tanggal: '2026-08-31', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4200000, keterangan: 'Iuran Warga Agustus', house_id: 'ALL', url_bukti: '-' },

  // JULI 2026 (11 Transaksi)
  { id: 'TX-202607-11', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Pengecoran & Perbaikan Jalan Depan Pos', nominal: 500000, keterangan: 'Material semen & pasir perbaikan jalan pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-10', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 60000, keterangan: 'Air Galon Pos Security', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-09', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Token Listrik Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-08', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 85800, keterangan: 'Kopi, Gula & Teh Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-07', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 200000, keterangan: 'Santunan Sosial Warga', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-06', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 390000, keterangan: 'Servis Pompa & Lampu Jalan Cluster', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-05', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 700000, keterangan: 'Uang Sampah Juli', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-04', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Gaji Pak Eko', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-03', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1500000, keterangan: 'Gaji Pak Rizki', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-02', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Iuran Tambahan Kas', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-01', tanggal: '2026-07-31', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 4000000, keterangan: 'Iuran Warga Juli', house_id: 'ALL', url_bukti: '-' },

  // JUNI 2026 (8 Transaksi)
  { id: 'TX-202606-08', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Proyek', is_proyek: true, nama_proyek: 'Proyek Renovasi Pos & Portal Cluster', nominal: 2874600, keterangan: 'Pengeluaran proyek renovasi pos & portal', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-07', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Token Listrik Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-06', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 60000, keterangan: 'Air Galon Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-05', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 66600, keterangan: 'Kopi & Gula Pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-04', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 150000, keterangan: 'Perawatan kebersihan lingkungan', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-03', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 600000, keterangan: 'Uang Sampah Juni', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-02', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1200000, keterangan: 'Gaji Security Juni', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-01', tanggal: '2026-06-30', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 3800000, keterangan: 'Iuran Warga Juni', house_id: 'ALL', url_bukti: '-' }
];

const FALLBACK_CLOSINGS = [
  { id: 'CLS-2026-10', periode_bulan: 'Oktober', periode_tahun: 2026, saldo_awal: 1512200, uang_masuk: 4200000, total_pengeluaran: 4318000, pengeluaran_proyek: 0, sisa_saldo: 1394200, status_tutup_buku: 'CLOSED' },
  { id: 'CLS-2026-09', periode_bulan: 'September', periode_tahun: 2026, saldo_awal: 2316500, uang_masuk: 4100000, total_pengeluaran: 4904300, pengeluaran_proyek: 0, sisa_saldo: 1512200, status_tutup_buku: 'CLOSED' },
  { id: 'CLS-2026-08', periode_bulan: 'Agustus', periode_tahun: 2026, saldo_awal: 2816000, uang_masuk: 4300000, total_pengeluaran: 4398500, pengeluaran_proyek: 0, sisa_saldo: 2717500, status_tutup_buku: 'CLOSED' },
  { id: 'CLS-2026-07', periode_bulan: 'Juli', periode_tahun: 2026, saldo_awal: 2850800, uang_masuk: 4100000, total_pengeluaran: 5135800, pengeluaran_proyek: 500000, sisa_saldo: 1815000, status_tutup_buku: 'CLOSED' },
  { id: 'CLS-2026-06', periode_bulan: 'Juni', periode_tahun: 2026, saldo_awal: 3702000, uang_masuk: 3800000, total_pengeluaran: 5051200, pengeluaran_proyek: 2874600, sisa_saldo: 2450800, status_tutup_buku: 'CLOSED' }
];

// Preset Sub-Kategori Cepat untuk Generator WA Security (V3)
const SECURITY_SUB_PRESETS = {
  PATROLI: [
    'Patroli Malam (22:00 - 02:00)',
    'Patroli Subuh (05:00)',
    'Patroli Siang & Kontrol Lingkungan',
    'Kontrol 5 Titik (Pos, Gerbang, Gang Depan, Gang Belakang, Lapangan)'
  ],
  ABSEN_SHIFT: [
    'Serah Terima Pagi ke Malam (20:00)',
    'Serah Terima Malam ke Pagi (08:00)',
    'Tutup Pos Malam Libur (Jumat Malam)',
    'Tutup Pos Malam Libur (Sabtu Malam)',
    'Mulai Shift Minggu Malam (Kembali Normal 2 Shift)'
  ],
  PAKET_SURAT: [
    'Paket Reguler Disimpan di Pos',
    'Paket Diantar Langsung ke Rumah Warga',
    'Titipan Uang Paket COD Warga di Pos',
    'Surat / Dokumen Penting Warga'
  ],
  IZIN_POS: [
    'Izin Sholat Jumat (Gerbang Dikunci Sementara)',
    'Izin ISOMA / Makan (Gerbang Dikunci Sementara)',
    'Izin Ke Toilet / Pembelian Kebutuhan Pos'
  ],
  ANOMALI_FASILITAS: [
    'Pengisian Air Galon Pos Security',
    'Pengambilan Sampah Mingguan (Bang Adi)',
    'Lampu Jalan / Lampu Sorot Pos Mati',
    'Perbaikan Las / Roda Pagar Utama',
    'Tamu / Survei Bank (Verifikasi KTP & No HP)',
    'Pengerjaan Renovasi Rumah Warga',
    'Listrik PLN Padam / Gangguan Utilitas'
  ]
};

export default function PublicDashboard({
  dashboardData,
  loading,
  isRefreshing,
  onRefresh,
  liveClock,
  lastSyncTime,
  isOnline = true,
  externalTabRequest,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onInputSecurityLog,
  onUpdateSecuritySchedule,
  onUploadIplProof,
  onConfirmQrisProof
}) {
  // Menggunakan ID tab konsisten ('beranda', 'mutasi', 'warga', 'keamanan')
  const [activeTab, setActiveTab] = useState('beranda');
  const [showBalance, setShowBalance] = useState(true);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [qrisHouseId, setQrisHouseId] = useState('H-01');
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [logoError, setLogoError] = useState(false);

  // State Buka-Tutup Rincian Laporan Bulanan di Beranda (Default buka Oktober)
  const [expandedMonth, setExpandedMonth] = useState('Oktober');
  const [copyBannerText, setCopyBannerText] = useState('');

  // State Filter untuk Tab Mutasi Kas & Tab 22 Rumah
  const [filterBulanKas, setFilterBulanKas] = useState('Semua');
  const [filterKategoriKas, setFilterKategoriKas] = useState('ALL');
  const [searchMutasiText, setSearchMutasiText] = useState('');
  const [searchRumah, setSearchRumah] = useState('');
  const [filterStatusIpl, setFilterStatusIpl] = useState('ALL');

  // State Tombol Darurat SOS (Tahan 3 Detik)
  const [sosProgress, setSosProgress] = useState(0);
  const sosTimerRef = useRef(null);

  // State Lengkap Modul Security (V3 + V4)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
  const [scheduleEditForm, setScheduleEditForm] = useState(null);
  const [secReportMode, setSecReportMode] = useState('PATROLI');
  const [secSubCategory, setSecSubCategory] = useState('Patroli Malam (22:00 - 02:00)');
  const [secGuardName, setSecGuardName] = useState('Pak Eko');
  const [secShift, setSecShift] = useState('Pagi');
  const [secHouseId, setSecHouseId] = useState('H-01');
  const [secPatrolPoint, setSecPatrolPoint] = useState(
    '5 Titik (Pos, Gerbang, Gang Depan, Gang Belakang, Lapangan)'
  );
  const [secWeather, setSecWeather] = useState('Cerah');
  const [secGateStatus, setSecGateStatus] = useState('Pintu Gerbang Kecil Ditutup Sesuai SOP');
  const [secCustomNote, setSecCustomNote] = useState('');
  const [secWatermarkedPhoto, setSecWatermarkedPhoto] = useState('');
  const [secPhotoFileName, setSecPhotoFileName] = useState('');
  const [secActionFeedback, setSecActionFeedback] = useState('');
  const [secLogFilter, setSecLogFilter] = useState('ALL');
  const [secLogSearch, setSecLogSearch] = useState('');

  // V4.2: Tangkap permintaan pindah tab dari Pop-up Panel Pengurus (App.jsx)
  useEffect(() => {
    if (externalTabRequest && externalTabRequest.tab) {
      const incoming = externalTabRequest.tab;
      const tabMap = {
        home: 'beranda',
        beranda: 'beranda',
        houses: 'warga',
        warga: 'warga',
        ledger: 'mutasi',
        mutasi: 'mutasi',
        security: 'keamanan',
        keamanan: 'keamanan'
      };
      setActiveTab(tabMap[incoming] || 'beranda');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [externalTabRequest]);

  const data = dashboardData || {};
  const houses = data.houses || [];
  const iplStatus = data.ipl_status || [];
  const cashLedger = data.cash_ledger?.length ? data.cash_ledger : FALLBACK_LEDGER;
  const monthlyClosings = data.monthly_closings?.length ? data.monthly_closings : FALLBACK_CLOSINGS;
  const securityPayroll = data.security_payroll || [];
  const securitySchedules = data.security_schedules || [];
  const securityLogs = data.security_logs || [];
  const secConfig = data.security_config || {
    active_1: 'Pak Eko',
    active_2: 'Pak Mulyadi',
    shift_pagi_jam: '08:00 - 20:00 WIB',
    shift_malam_jam: '20:00 - 08:00 WIB',
    libur_malam_hari: 'Jumat,Sabtu',
    galon_count_bulan_ini: 4
  };

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  // Helper V4.2: Format Tanggal & Jam lengkap dengan Detik (WIB)
  const formatDateTimeWithSeconds = (dateInput) => {
    if (!dateInput) return '-';
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '-';
    const tgl = d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const jam = d
      .toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      .replace(/\./g, ':');
    return `${tgl} • ${jam} WIB`;
  };

  const formatTimeOnlyWithSeconds = (dateInput) => {
    if (!dateInput) return '-';
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '-';
    return (
      d
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        .replace(/\./g, ':') + ' WIB'
    );
  };

  // Helper Cek Link Bukti Google Drive yang Valid
  const isValidEvidenceUrl = (urlStr) => {
    if (!urlStr) return false;
    const s = String(urlStr).trim();
    return s.startsWith('http://') || s.startsWith('https://');
  };

  // Helper Ekstrak URL Foto Bukti dari Log Security
  const extractSecurityPhotoUrl = (logItem) => {
    if (!logItem) return '';
    if (isValidEvidenceUrl(logItem.photo_url)) return logItem.photo_url;
    if (isValidEvidenceUrl(logItem.url_bukti)) return logItem.url_bukti;
    const text = String(logItem.detail_catatan || '');
    const match = text.match(/https?:\/\/[^\s\]]+/);
    return match ? match[0] : '';
  };

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
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    sosTimerRef.current = setInterval(() => {
      current += 10;
      setSosProgress(current);
      if (current >= 100) {
        clearInterval(sosTimerRef.current);
        setSosProgress(0);
        window.open(
          'https://wa.me/?text=' +
            encodeURIComponent(
              '🚨 *DARURAT SOS CLUSTER MUTIARA RESIDENCE (CMR)* 🚨\nMohon bantuan segera petugas Pos Security & Warga ke lokasi!'
            ),
          '_blank'
        );
      }
    }, 300);
  };

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSosProgress(0);
  };

  // Fungsi Pembentuk Rincian Kategori Bulanan (Persis Template Laporan Bulanan WA + Link Bukti V4)
  const getMonthlyBreakdown = (bulan, tahun = 2026) => {
    const items = cashLedger.filter(
      (tx) => String(tx.periode_bulan) === String(bulan) && Number(tx.periode_tahun || 2026) === Number(tahun)
    );
    const pemasukanMap = {};
    const pengeluaranMap = {};
    const proyekList = [];

    items.forEach((tx) => {
      const nom = Number(tx.nominal || 0);
      const kat = tx.kategori || 'Lainnya';
      const ket = tx.keterangan || '-';
      const isProyek =
        Boolean(tx.is_proyek) &&
        String(tx.is_proyek).toUpperCase() !== 'FALSE' &&
        String(tx.is_proyek) !== '0';

      if (String(tx.tipe).toUpperCase() === 'IN') {
        pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
      } else {
        if (isProyek || String(kat).toLowerCase() === 'proyek') {
          proyekList.push({
            nama: tx.nama_proyek || ket,
            nominal: nom,
            url_bukti: tx.url_bukti
          });
        }
        if (!pengeluaranMap[kat]) {
          pengeluaranMap[kat] = { total: 0, details: [], rawItems: [] };
        }
        pengeluaranMap[kat].total += nom;
        pengeluaranMap[kat].details.push(
          `${ket} (Rp ${Number(nom).toLocaleString('id-ID')})`
        );
        pengeluaranMap[kat].rawItems.push({
          id: tx.id,
          ket,
          nom,
          url_bukti: tx.url_bukti
        });
      }
    });

    return { pemasukanMap, pengeluaranMap, proyekList };
  };

  // Data Olahan Tab Mutasi Kas (Sudah Urut Terbaru di Atas)
  const ledgerList = useMemo(() => {
    return cashLedger.filter((item) => {
      const matchBulan = filterBulanKas === 'Semua' || item.periode_bulan === filterBulanKas;
      const isProyek =
        (Boolean(item.is_proyek) && String(item.is_proyek).toUpperCase() !== 'FALSE') ||
        String(item.kategori).toLowerCase() === 'proyek';
      const matchKat =
        filterKategoriKas === 'ALL' ||
        (filterKategoriKas === 'PROYEK' ? isProyek : item.kategori === filterKategoriKas);
      const matchSearch =
        !searchMutasiText ||
        String(item.keterangan || '').toLowerCase().includes(searchMutasiText.toLowerCase()) ||
        String(item.kategori || '').toLowerCase().includes(searchMutasiText.toLowerCase()) ||
        String(item.id || '').toLowerCase().includes(searchMutasiText.toLowerCase());
      return matchBulan && matchKat && matchSearch;
    });
  }, [cashLedger, filterBulanKas, filterKategoriKas, searchMutasiText]);

  const totalMasukFilter = ledgerList
    .filter((i) => String(i.tipe).toUpperCase() === 'IN')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);
  const totalKeluarFilter = ledgerList
    .filter((i) => String(i.tipe).toUpperCase() === 'OUT')
    .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);

  // Data Olahan Tab 22 Rumah (21 Aktif + 1 Tidak Aktif BPR)
  const housesWithIpl = useMemo(() => {
    return houses.map((h) => {
      const iplRow = iplStatus.find((r) => String(r.house_id) === String(h.id));
      const isNonAktif =
        h.status_huni === 'Tidak Aktif' || iplRow?.status_bayar === 'Tidak Aktif';
      return {
        ...h,
        is_non_aktif: isNonAktif,
        status_bayar: isNonAktif ? 'Tidak Aktif' : iplRow?.status_bayar || 'Belum Lunas',
        tanggal_bayar: iplRow?.tanggal_bayar || '-',
        url_bukti: iplRow?.url_bukti || '',
        catatan:
          iplRow?.catatan ||
          (isNonAktif
            ? 'Unit Dijual oleh Pihak BPR (Non-Aktif)'
            : 'Tagihan IPL November 2026')
      };
    });
  }, [houses, iplStatus]);

  const activeHousesCount = housesWithIpl.filter((h) => !h.is_non_aktif).length;
  const totalLunasCount = housesWithIpl.filter((h) => h.status_bayar === 'Lunas').length;
  const totalBelumLunasCount = housesWithIpl.filter(
    (h) => h.status_bayar === 'Belum Lunas'
  ).length;

  const filteredHouses = housesWithIpl.filter((h) => {
    const matchSearch =
      String(h.nomor_rumah).toLowerCase().includes(searchRumah.toLowerCase()) ||
      String(h.nama_warga).toLowerCase().includes(searchRumah.toLowerCase()) ||
      String(h.alias_keluarga || '').toLowerCase().includes(searchRumah.toLowerCase());
    const matchStatus =
      filterStatusIpl === 'ALL' ||
      (filterStatusIpl === 'AKTIF' ? !h.is_non_aktif : h.status_bayar === filterStatusIpl);
    return matchSearch && matchStatus;
  });

  // Jadwal Security Hari Ini
  const todaySchedule = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const found = securitySchedules.find((s) => String(s.tanggal).slice(0, 10) === todayIso);
    return (
      found ||
      securitySchedules[0] || {
        tanggal: todayIso,
        hari: 'Hari Ini',
        shift_pagi: 'Pak Eko',
        jam_pagi: '08:00 - 20:00',
        shift_malam: 'Pak Mulyadi',
        jam_malam: '20:00 - 08:00',
        status_jadwal: 'NORMAL_2_SHIFT',
        catatan_jadwal: 'Penjagaan normal 2 shift (Pagi & Malam)'
      }
    );
  }, [securitySchedules]);

  // Generator Teks Laporan WA Security Otomatis (V3)
  const generatedSecurityWaText = useMemo(() => {
    const now = liveClock || new Date();
    const hour = now.getHours();
    const sapaan =
      hour < 11
        ? 'selamat pagi'
        : hour < 15
        ? 'selamat siang'
        : hour < 18
        ? 'selamat sore'
        : 'selamat malam';
    const selectedHouseObj = houses.find((h) => h.id === secHouseId);
    const wargaLabel = selectedHouseObj
      ? `${selectedHouseObj.nomor_rumah} (${
          selectedHouseObj.alias_keluarga || selectedHouseObj.nama_warga
        })`
      : secHouseId;

    if (secReportMode === 'ABSEN_SHIFT') {
      if (secSubCategory.includes('Malam Libur')) {
        return `*Assalamualaikum, ${sapaan}*\nIzin lapor petugas jaga pagi (*${secGuardName}*) persiapan balik kanan pukul 20:00 WIB. Sesuai jadwal malam libur penjagaan, lampu lingkungan sudah dinyalakan, TV pos diamankan, dan *${secGateStatus}*.${
          secCustomNote ? `\nCatatan: ${secCustomNote}` : ''
        }\n*Terima kasih* 🙏🫡`;
      }
      const partner = secGuardName === 'Pak Eko' ? 'Pak Mulyadi' : 'Pak Eko';
      return `*ABSEN PERGANTIAN SHIFT SECURITY CMR*\nAssalamualaikum, ${sapaan}. Izin melaporkan serah terima tugas jaga pengamanan Cluster Mutiara Residence:\n• Petugas Masuk Jaga (${secShift}): *${secGuardName}*\n• Petugas Balik Kanan: *${partner}*\n• Status Gerbang: ${secGateStatus}\n• Cuaca 815: ${secWeather}\n• Catatan Pos: ${
        secCustomNote || 'Situasi aman kondusif tanpa taruna.'
      }\n*Terima kasih* 🙏🫡`;
    }

    if (secReportMode === 'PATROLI') {
      return `*Assalamualaikum, ${sapaan}*\nIzin lapor petugas jaga (*${secGuardName}* - Shift ${secShift}) giat *${secSubCategory}* pengecekan dan kontrol *${secPatrolPoint}*. Untuk saat ini situasi area CMR tetap aman kondusif tanpa taruna apapun. Status gerbang: *${secGateStatus}*. Berikut 815 cuaca *${secWeather}*.${
        secCustomNote ? `\nCatatan Tambahan: ${secCustomNote}` : ''
      }\n*Terima kasih* 🙏🫡`;
    }

    if (secReportMode === 'PAKET_SURAT') {
      return `*Assalamualaikum, ${sapaan}*\nIzin lapor petugas jaga (*${secGuardName}*): terdapat *${secSubCategory}* di Pos Security untuk rumah *${wargaLabel}*.${
        secCustomNote ? `\nKeterangan: ${secCustomNote}.` : ''
      } *Terima kasih* 🙏`;
    }

    if (secReportMode === 'IZIN_POS') {
      return `*Assalamualaikum, ${sapaan}*\nIzin lapor petugas jaga (*${secGuardName}*) melaksanakan *${secSubCategory}*. Status gerbang: *${secGateStatus}*.${
        secCustomNote ? `\nCatatan: ${secCustomNote}.` : ''
      } *Terima kasih* 🙏`;
    }

    return `*Assalamualaikum, ${sapaan}*\nIzin lapor update *${secSubCategory}* oleh petugas jaga (*${secGuardName}* - Shift ${secShift}) di area *${secPatrolPoint}*:\n• Rumah / Tujuan: ${wargaLabel}\n• Detail Laporan: ${
      secCustomNote || 'Terkendali sesuai SOP keamanan cluster.'
    }\n• Status Gerbang: ${secGateStatus}\n*Terima kasih* 🙏🫡`;
  }, [
    liveClock,
    secReportMode,
    secSubCategory,
    secGuardName,
    secShift,
    secHouseId,
    secPatrolPoint,
    secWeather,
    secGateStatus,
    secCustomNote,
    houses
  ]);

  // Handler Buat Foto Ber-Watermark Timestamp untuk Bukti Patroli/Absen Security (V4)
  const handleSelectSecurityPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSecPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const barH = 56;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.80)';
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(
          `CMR SECURITY VERIFIED • ${secGuardName.toUpperCase()} (${secShift.toUpperCase()})`,
          12,
          canvas.height - 32
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(
          `${formatDateTimeWithSeconds(new Date())} | ${secSubCategory}`,
          12,
          canvas.height - 12
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        setSecWatermarkedPhoto(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handler Simpan Log Security + Upload Foto Watermark ke Drive Log_Absensi_Security
  const handleSubmitSecurityReport = async () => {
    try {
      await navigator.clipboard.writeText(generatedSecurityWaText);
    } catch (clipErr) {
      // Abaikan jika browser membatasi clipboard otomatis
    }

    const selectedHouseObj = houses.find((h) => h.id === secHouseId);
    const payload = {
      tanggal: new Date().toISOString().slice(0, 10),
      jam: new Date().toTimeString().slice(0, 5),
      nama_security: secGuardName,
      shift: secShift,
      kategori_laporan: secReportMode,
      sub_kategori: secSubCategory,
      house_id:
        secReportMode === 'PAKET_SURAT' || secReportMode === 'ANOMALI_FASILITAS'
          ? secHouseId
          : '-',
      nama_warga_tujuan:
        secReportMode === 'PAKET_SURAT' || secReportMode === 'ANOMALI_FASILITAS'
          ? selectedHouseObj?.alias_keluarga || selectedHouseObj?.nama_warga || '-'
          : '-',
      titik_patroli: secPatrolPoint,
      cuaca_815: secWeather,
      status_gerbang: secGateStatus,
      detail_catatan: secCustomNote || `${secSubCategory} (${secPatrolPoint})`,
      teks_wa: generatedSecurityWaText,
      file_base64: secWatermarkedPhoto || '',
      file_name: secPhotoFileName || ''
    };

    setSecActionFeedback(
      secWatermarkedPhoto
        ? '⏳ Menyimpan laporan & mengunggah foto watermark ke Drive Log_Absensi_Security...'
        : '⏳ Menyimpan laporan ke database...'
    );

    if (onInputSecurityLog) {
      await onInputSecurityLog(payload);
    }

    setSecActionFeedback(
      `✅ Teks WA berhasil disalin & Laporan tercatat di urutan teratas!${
        secWatermarkedPhoto ? ' Foto bukti masuk ke Google Drive Log_Absensi_Security.' : ''
      }`
    );
    setSecCustomNote('');
    setSecWatermarkedPhoto('');
    setSecPhotoFileName('');
  };

  const filteredSecurityLogs = useMemo(() => {
    return securityLogs.filter((l) => {
      const matchKat =
        secLogFilter === 'ALL' || String(l.kategori_laporan) === secLogFilter;
      const matchSearch =
        !secLogSearch ||
        String(l.sub_kategori || '').toLowerCase().includes(secLogSearch.toLowerCase()) ||
        String(l.detail_catatan || '').toLowerCase().includes(secLogSearch.toLowerCase()) ||
        String(l.nama_security || '').toLowerCase().includes(secLogSearch.toLowerCase());
      return matchKat && matchSearch;
    });
  }, [securityLogs, secLogFilter, secLogSearch]);

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: '🏠' },
    { id: 'mutasi', label: 'Mutasi Kas', icon: '📑' },
    { id: 'warga', label: '22 Rumah', icon: '🏘️' },
    { id: 'keamanan', label: 'Keamanan & SOS', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-28 md:pb-14 overflow-y-auto overflow-x-hidden">
      {/* TOP NAVBAR RESPONSIVE + BAR STATUS LIVE SINKRONISASI V4.2 */}
      <header className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white shadow-md sticky top-0 z-30">
        {/* BAR PALING ATAS: TITIK LAMPU HIJAU ONLINE + JAM DETIK REAL-TIME + TOMBOL REFRESH */}
        <div className="bg-slate-950/30 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            {/* Kiri: Indikator Lampu Hijau Online & Waktu Sinkronisasi Terakhir */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRefreshing
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-emerald-400'
                      : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isRefreshing
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-emerald-400'
                      : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="font-extrabold text-emerald-300 tracking-wide">
                {isRefreshing
                  ? 'Menyinkronkan Database...'
                  : isOnline
                  ? 'Online • Data Tersinkron'
                  : 'Mode Baseline Lokal'}
              </span>
              <span className="text-teal-200/60 hidden sm:inline">|</span>
              <span className="text-teal-100 font-mono text-[10px] sm:text-[11px]">
                Sinkron Terakhir: <strong>{formatTimeOnlyWithSeconds(lastSyncTime)}</strong>
              </span>
            </div>

            {/* Kanan: Detail Tanggal & Jam Detik Real-Time + Button Refresh */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] text-white font-semibold">
                🕒 {formatDateTimeWithSeconds(liveClock || new Date())}
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Data dari Spreadsheet & Google Drive"
                className="inline-flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-extrabold px-3 py-1 rounded-lg shadow-sm transition cursor-pointer text-[11px]"
              >
                <span className={isRefreshing ? 'animate-spin inline-block' : ''}>🔄</span>
                <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* BAR KEDUA: LOGO, MENU NAVIGASI DESKTOP, & TOMBOL PENGURUS */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
          <div
            onClick={handleLogoTap}
            className="cursor-pointer select-none flex items-center gap-3"
          >
            {/* Slot Logo Kustom 512x512 px (/assets/logo-cmoney.png) */}
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-black text-lg shadow-inner overflow-hidden shrink-0">
              {!logoError && data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt="Logo C-Money"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span>C</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide">
                  {data.app_name || 'C-Money'}
                </span>
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
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
              type="button"
              onClick={() => openQrisForHouse('H-01')}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
            >
              📲 Bayar QRIS
            </button>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className={`px-3 py-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-amber-400 text-slate-950 border-amber-200 hover:bg-amber-300 shadow'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
              }`}
            >
              {isAdminLoggedIn ? '⚙️ Panel Pengurus' : '🔒 Pengurus'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER (2 KOLOM DI DESKTOP: KIRI 4 KOLOM STICKY INFO, KANAN 8 KOLOM TAB DINAMIS) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =====================================================================
            KOLOM KIRI (4 KOLOM): KARTU SALDO M-BANKING, SECURITY HARI INI & QUICK ACTIONS
           ===================================================================== */}
        <div className="lg:col-span-4 space-y-4">
          {/* Kartu Saldo Utama m-Banking */}
          <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">
                Saldo Kas Aktif Cluster
              </span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-xs text-teal-300 hover:text-white underline cursor-pointer"
              >
                {showBalance ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>

            <div className="text-3xl font-black mt-1.5 tracking-tight text-emerald-300">
              {showBalance ? formatRp(data.current_balance) : 'Rp ••••••••'}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/10 px-2.5 py-1 rounded-full text-emerald-300">
              <span>●</span>
              <span>
                Status IPL Nov 2026: {totalLunasCount}/{activeHousesCount} Rumah Aktif Lunas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/15 text-xs">
              <div>
                <p className="text-teal-200 text-[11px]">Iuran Wajib / Rumah</p>
                <p className="font-extrabold text-emerald-300 mt-0.5">
                  {formatRp(data.default_ipl_amount || 200000)} / bln
                </p>
              </div>
              <div>
                <p className="text-teal-200 text-[11px]">Total Unit Hunian</p>
                <p className="font-extrabold text-white mt-0.5">
                  22 Unit (21 Aktif • 1 BPR)
                </p>
              </div>
            </div>
          </div>

          {/* Menu Cepat 4 Ikon (Quick Actions) */}
          <div className="bg-white rounded-3xl shadow-sm p-4 grid grid-cols-4 gap-2 text-center border border-slate-200/70">
            <button
              type="button"
              onClick={() => openQrisForHouse('H-01')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow group-hover:scale-105 transition">
                📲
              </div>
              <span className="text-[11px] font-bold text-teal-800 mt-1.5">Bayar QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('warga')}
              className="flex flex-col items-center group cursor-pointer"
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
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5">22 Rumah</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mutasi')}
              className="flex flex-col items-center group cursor-pointer"
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
              type="button"
              onClick={() => setActiveTab('keamanan')}
              className="flex flex-col items-center group cursor-pointer"
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

          {/* Kartu Ringkas Petugas Security Bertugas Hari Ini (V3) */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
                  Security On Duty Hari Ini
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-1">
                  Jadwal Pos & Galon Security
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('keamanan')}
                className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
              >
                Buka Pos →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">
                  ☀️ Pagi (08:00-20:00)
                </p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {todaySchedule.shift_pagi}
                </p>
              </div>
              <div
                className={`p-2.5 rounded-2xl border ${
                  todaySchedule.shift_malam === 'LIBUR'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-indigo-50/70 border-indigo-200'
                }`}
              >
                <p className="text-[10px] font-bold text-slate-600 uppercase">
                  🌙 Malam (20:00-08:00)
                </p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {todaySchedule.shift_malam === 'LIBUR'
                    ? 'LIBUR (Mandiri)'
                    : todaySchedule.shift_malam}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Rekap Isi Galon Pos Bulan Ini:</span>
              <span className="font-extrabold text-teal-800">
                🚰 {secConfig.galon_count_bulan_ini || 4} Galon
              </span>
            </div>
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

        {/* =====================================================================
            KOLOM KANAN (8 KOLOM): AREA KONTEN DINAMIS 4 TAB UTAMA
           ===================================================================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* ================= TAB 1: BERANDA (URUT TERBARU OKTOBER -> JUNI + RINCIAN LENGKAP) ================= */}
          {activeTab === 'beranda' && (
            <>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      Laporan & Rincian Kas 5 Bulan Terakhir (Oktober – Juni 2026)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Diurutkan dari yang terbaru ke terlama • Klik bulan untuk melihat rincian per
                      kategori, proyek & bukti foto
                    </p>
                  </div>
                  <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold">
                    Terbaru di Atas ↓
                  </span>
                </div>

                {copyBannerText && (
                  <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    {copyBannerText}
                  </div>
                )}

                {/* Daftar Laporan Bulanan (Urut Oktober -> Juni) */}
                <div className="space-y-3">
                  {monthlyClosings
                    .filter((c) => c.status_tutup_buku === 'CLOSED')
                    .map((item) => {
                      const maxVal = 5200000;
                      const inPct = Math.min(100, Math.round((item.uang_masuk / maxVal) * 100));
                      const outPct = Math.min(
                        100,
                        Math.round((item.total_pengeluaran / maxVal) * 100)
                      );
                      const isExpanded = expandedMonth === item.periode_bulan;
                      const breakdown = getMonthlyBreakdown(item.periode_bulan, item.periode_tahun);

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden transition"
                        >
                          {/* Header Kartu Bulan (Bisa Diklik untuk Buka/Tutup Detail) */}
                          <div
                            onClick={() =>
                              setExpandedMonth(isExpanded ? '' : item.periode_bulan)
                            }
                            className="p-4 cursor-pointer hover:bg-slate-100/70 transition space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {item.periode_bulan} {item.periode_tahun}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  (Saldo Awal: {formatRp(item.saldo_awal)})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                                  Sisa Saldo: {formatRp(item.sisa_saldo)}
                                </span>
                                <span className="text-xs font-bold text-teal-700">
                                  {isExpanded ? '▲ Tutup Rincian' : '▼ Lihat Rincian'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
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
                                  <span>
                                    Total Pengeluaran
                                    {item.pengeluaran_proyek > 0
                                      ? ` (Termasuk Proyek ${formatRp(item.pengeluaran_proyek)})`
                                      : ''}
                                  </span>
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

                          {/* Panel Rincian Lengkap Sesuai Template Laporan Bulanan WA */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-3 border-t border-slate-200/80 bg-white text-xs space-y-3">
                              {/* Ringkasan 5 Angka Utama */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                                <div>
                                  <span className="text-slate-400 block">Saldo Awal</span>
                                  <span className="font-bold text-slate-800">
                                    {formatRp(item.saldo_awal)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Uang Masuk</span>
                                  <span className="font-bold text-emerald-700">
                                    {formatRp(item.uang_masuk)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Total Keluar</span>
                                  <span className="font-bold text-rose-600">
                                    {formatRp(item.total_pengeluaran)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Khusus Proyek</span>
                                  <span className="font-bold text-amber-700">
                                    {formatRp(item.pengeluaran_proyek)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Sisa Saldo</span>
                                  <span className="font-extrabold text-teal-700">
                                    {formatRp(item.sisa_saldo)}
                                  </span>
                                </div>
                              </div>

                              {/* Breakdown Pemasukan per Kategori */}
                              <div>
                                <p className="font-extrabold text-slate-700 mb-1">
                                  Breakdown Pemasukan per Kategori:
                                </p>
                                <ul className="space-y-1 pl-2">
                                  {Object.keys(breakdown.pemasukanMap).map((kat) => (
                                    <li key={kat} className="text-emerald-800 font-semibold">
                                      • {kat}: {formatRp(breakdown.pemasukanMap[kat])}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Breakdown Pengeluaran per Kategori + Detail Rincian & Tombol Bukti */}
                              <div>
                                <p className="font-extrabold text-slate-700 mb-1.5">
                                  Breakdown Pengeluaran per Kategori (Beserta Rincian):
                                </p>
                                <div className="space-y-1.5">
                                  {Object.keys(breakdown.pengeluaranMap).map((kat) => {
                                    const group = breakdown.pengeluaranMap[kat];
                                    return (
                                      <div
                                        key={kat}
                                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                                      >
                                        <div className="flex items-center justify-between font-bold text-slate-800">
                                          <span>• {kat}</span>
                                          <span className="text-rose-600">
                                            {formatRp(group.total)}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          <span className="font-semibold text-slate-600">
                                            detail:
                                          </span>{' '}
                                          {group.details.join(', ')}
                                        </p>
                                        {/* Tampilkan tautan bukti jika ada item pada kategori ini yang memiliki foto Drive */}
                                        {group.rawItems.some((r) =>
                                          isValidEvidenceUrl(r.url_bukti)
                                        ) && (
                                          <div className="flex flex-wrap gap-1.5 pt-1">
                                            {group.rawItems
                                              .filter((r) => isValidEvidenceUrl(r.url_bukti))
                                              .map((r) => (
                                                <a
                                                  key={r.id}
                                                  href={r.url_bukti}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200"
                                                >
                                                  📎 Bukti: {r.ket}
                                                </a>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Detail Proyek (Jika ada proyek di bulan tersebut) */}
                              {breakdown.proyekList.length > 0 && (
                                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                                  <p className="font-extrabold text-amber-900 mb-1">
                                    Detail Proyek Bulan {item.periode_bulan}:
                                  </p>
                                  <ul className="space-y-1 text-amber-900 font-medium">
                                    {breakdown.proyekList.map((p, i) => (
                                      <li
                                        key={i}
                                        className="flex items-center justify-between gap-2"
                                      >
                                        <span>
                                          • {p.nama} —{' '}
                                          <strong className="font-bold">
                                            {formatRp(p.nominal)}
                                          </strong>
                                        </span>
                                        {isValidEvidenceUrl(p.url_bukti) && (
                                          <a
                                            href={p.url_bukti}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] font-extrabold text-amber-900 underline"
                                          >
                                            📎 Lihat Bukti Proyek
                                          </a>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Kartu Ringkasan 2 Kolom: Gaji Security & Struktur Beban Rutin (V2 Utuh) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                    👮 Transparansi Gaji Security (Terbaru: Oktober)
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    {securityPayroll
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
                    📌 Struktur Hunian & Beban Wajib Bulanan CMR
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Total Hunian (21 Aktif + 1 Non-Aktif)</span>
                      <span className="font-bold text-slate-800">22 Rumah</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Potensi Maksimal IPL (21 x Rp 200rb)</span>
                      <span className="font-bold text-emerald-700">Rp 4.200.000</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Gaji 2 Security (@1,65 Jt)</span>
                      <span className="font-bold text-slate-800">Rp 3.300.000</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Retribusi Sampah & Listrik Pos</span>
                      <span className="font-extrabold text-teal-700">Rp 800.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: MUTASI KAS (RINCIAN 55+ ITEM TERBARU KE TERLAMA + BUKTI DRIVE) ================= */}
          {activeTab === 'mutasi' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    📑 Rincian Buku Kas Cluster (Urut Terbaru ke Terlama)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Menampilkan {ledgerList.length} rincian transaksi beserta tautan foto bukti Google Drive
                  </p>
                </div>

                {/* Filter Bulan, Kategori & Pencarian */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Cari keterangan / kode..."
                    value={searchMutasiText}
                    onChange={(e) => setSearchMutasiText(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                  />

                  <select
                    value={filterBulanKas}
                    onChange={(e) => setFilterBulanKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    {['Semua', 'November', 'Oktober', 'September', 'Agustus', 'Juli', 'Juni'].map(
                      (b) => (
                        <option key={b} value={b}>
                          {b === 'Semua' ? 'Semua Bulan' : `Periode ${b}`}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={filterKategoriKas}
                    onChange={(e) => setFilterKategoriKas(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Kategori ({ledgerList.length})</option>
                    <option value="Iuran Warga">Iuran Warga (IN)</option>
                    <option value="Gaji">Gaji & Kasbon Security</option>
                    <option value="Sampah">Uang Sampah</option>
                    <option value="Perawatan Pos">Perawatan Pos & Lingkungan</option>
                    <option value="Konsumsi">Konsumsi Pos</option>
                    <option value="Sosial">Dana Sosial</option>
                    <option value="Listrik">Listrik Pos</option>
                    <option value="Air">Air Galon Pos</option>
                    <option value="PROYEK">Khusus Proyek Cluster</option>
                  </select>
                </div>
              </div>

              {/* Ringkasan Filter (Pemasukan vs Pengeluaran Terfilter) */}
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

              {/* Daftar Transaksi Rinci (Terbaru di Atas -> Terlama di Bawah) */}
              <div className="space-y-2.5">
                {ledgerList.map((tx) => {
                  const isIn = String(tx.tipe).toUpperCase() === 'IN';
                  const isProyek =
                    (Boolean(tx.is_proyek) && String(tx.is_proyek).toUpperCase() !== 'FALSE') ||
                    String(tx.kategori).toLowerCase() === 'proyek';
                  const hasProof = isValidEvidenceUrl(tx.url_bukti);

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isIn ? '↓' : '↑'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-800">{tx.kategori}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                              {tx.periode_bulan} {tx.periode_tahun}
                            </span>
                            {isProyek && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                                🏗️ Proyek: {tx.nama_proyek || tx.keterangan}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium mt-0.5">{tx.keterangan}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Tanggal: {String(tx.tanggal).slice(0, 10)} • Kode: {tx.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {hasProof && (
                          <a
                            href={tx.url_bukti}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[11px] border border-teal-200 transition"
                          >
                            📎 Lihat Bukti
                          </a>
                        )}

                        <span
                          className={`font-extrabold text-sm ${
                            isIn ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isIn ? '+' : '-'} {formatRp(tx.nominal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 3: STATUS 22 RUMAH (21 AKTIF + 1 TIDAK AKTIF BPR + LINK BUKTI IPL) ================= */}
          {activeTab === 'warga' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🏘️ Daftar 22 Unit Rumah CMR (21 Aktif • 1 Non-Aktif BPR)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pak Baim 2 Unit (No. 16 & No. 22) • Pak Dwi 2 Unit (No. 14 & No. 03 Kontrak Pak
                    Upen) • No. 04 Dijual Pihak BPR
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari nomor / nama / alias keluarga..."
                    value={searchRumah}
                    onChange={(e) => setSearchRumah(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 flex-1"
                  />
                  <select
                    value={filterStatusIpl}
                    onChange={(e) => setFilterStatusIpl(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
                  >
                    <option value="ALL">Semua Unit (22)</option>
                    <option value="AKTIF">Hunian Aktif ({activeHousesCount})</option>
                    <option value="Lunas">Lunas ({totalLunasCount})</option>
                    <option value="Belum Lunas">Belum Lunas ({totalBelumLunasCount})</option>
                    <option value="Tidak Aktif">Tidak Aktif / BPR (1)</option>
                  </select>
                </div>
              </div>

              {/* Grid 22 Rumah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredHouses.map((h) => {
                  const isLunas = h.status_bayar === 'Lunas';
                  const isNonAktif = h.is_non_aktif;
                  const hasIplProof = isValidEvidenceUrl(h.url_bukti);

                  return (
                    <div
                      key={h.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                        isNonAktif
                          ? 'bg-slate-100/80 border-slate-300 opacity-80'
                          : isLunas
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 text-sm">{h.nomor_rumah}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isNonAktif
                                ? 'bg-slate-200 text-slate-700'
                                : isLunas
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isNonAktif ? 'Tidak Aktif (BPR)' : h.status_bayar}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-1">{h.nama_warga}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {h.alias_keluarga || h.nama_warga}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isNonAktif
                            ? 'Dijual oleh Pihak BPR (Bebas IPL)'
                            : `Tarif IPL: ${formatRp(h.tarif_ipl || 200000)}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-1.5 text-[11px]">
                        <span className="text-slate-400 truncate">
                          {isNonAktif
                            ? 'Non-Aktif'
                            : isLunas
                            ? `Tgl: ${String(h.tanggal_bayar).slice(0, 10)}`
                            : h.catatan}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasIplProof && (
                            <a
                              href={h.url_bukti}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold px-2 py-1 rounded-lg border border-teal-200"
                            >
                              📎 Bukti
                            </a>
                          )}

                          {!isNonAktif && !isLunas && (
                            <button
                              type="button"
                              onClick={() => openQrisForHouse(h.id)}
                              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm transition cursor-pointer"
                            >
                              Bayar QRIS →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: KEAMANAN, GENERATOR WA, KALENDER ROTASI, LOG, GAJI & CCTV ================= */}
          {activeTab === 'keamanan' && (
            <div className="space-y-5">
              {/* 1. Kartu Panic Button SOS (Tahan 3 Detik) */}
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
                    type="button"
                    onMouseDown={startSosHold}
                    onMouseUp={cancelSosHold}
                    onMouseLeave={cancelSosHold}
                    onTouchStart={startSosHold}
                    onTouchEnd={cancelSosHold}
                    className="w-full sm:w-48 py-4 rounded-2xl bg-white text-rose-700 font-black text-sm shadow-xl active:scale-95 transition select-none relative overflow-hidden shrink-0 cursor-pointer"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-rose-200 transition-all"
                      style={{ width: `${sosProgress}%` }}
                    />
                    <span className="relative z-10">
                      {sosProgress > 0 ? `Tahan... ${sosProgress}%` : '🔴 TAHAN 3 DETIK (SOS)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Generator Laporan WA Siap Copas & Bukti Foto Ber-Watermark ke Drive (V3 + V4) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                      Security Copilot V4.2 • Pak Eko & Pak Mulyadi
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base mt-1">
                      📋 Generator Laporan WA & Upload Foto Bukti Patroli/Absen
                    </h4>
                  </div>
                  <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    🚰 Galon Pos Bulan Ini: {secConfig.galon_count_bulan_ini || 4} Galon
                  </span>
                </div>

                {/* Pilihan 5 Kategori Laporan Security */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
                  {[
                    { id: 'PATROLI', label: '🔦 Patroli', defaultSub: 'Patroli Malam (22:00 - 02:00)' },
                    { id: 'ABSEN_SHIFT', label: '🤝 Absen Shift', defaultSub: 'Serah Terima Pagi ke Malam (20:00)' },
                    { id: 'PAKET_SURAT', label: '📦 Paket Warga', defaultSub: 'Paket Reguler Disimpan di Pos' },
                    { id: 'IZIN_POS', label: '🕌 Izin Pos', defaultSub: 'Izin Sholat Jumat (Gerbang Dikunci Sementara)' },
                    { id: 'ANOMALI_FASILITAS', label: '⚠️ Insiden / Galon', defaultSub: 'Pengisian Air Galon Pos Security' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSecReportMode(m.id);
                        setSecSubCategory(m.defaultSub);
                      }}
                      className={`py-2 px-2.5 rounded-xl font-extrabold border transition cursor-pointer ${
                        secReportMode === m.id
                          ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Preset Cepat Sub-Kategori */}
                <div className="flex flex-wrap gap-1.5">
                  {(SECURITY_SUB_PRESETS[secReportMode] || []).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSecSubCategory(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                        secSubCategory === preset
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Form Pilihan Petugas, Shift, Cuaca & Rumah Warga */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Petugas Jaga</label>
                    <select
                      value={secGuardName}
                      onChange={(e) => setSecGuardName(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                    >
                      <option value="Pak Eko">Pak Eko</option>
                      <option value="Pak Mulyadi">Pak Mulyadi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Shift Jaga</label>
                    <select
                      value={secShift}
                      onChange={(e) => setSecShift(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                    >
                      <option value="Pagi">Pagi (08:00-20:00)</option>
                      <option value="Malam">Malam (20:00-08:00)</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-slate-500 mb-1 font-semibold">Cuaca 815</label>
                    <select
                      value={secWeather}
                      onChange={(e) => setSecWeather(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                    >
                      <option value="Cerah">☀️ Cerah</option>
                      <option value="Panas Terik">🔥 Panas Terik</option>
                      <option value="Mendung">☁️ Mendung</option>
                      <option value="Gerimis / Hujan">🌧️ Gerimis / Hujan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">
                      Judul / Sub-Kategori Laporan
                    </label>
                    <input
                      type="text"
                      value={secSubCategory}
                      onChange={(e) => setSecSubCategory(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 font-bold"
                    />
                  </div>

                  {secReportMode === 'PAKET_SURAT' || secReportMode === 'ANOMALI_FASILITAS' ? (
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        Pilih Rumah / Keluarga Warga
                      </label>
                      <select
                        value={secHouseId}
                        onChange={(e) => setSecHouseId(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                      >
                        {houses.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nomor_rumah} - {h.alias_keluarga || h.nama_warga}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        Status Pintu Gerbang
                      </label>
                      <select
                        value={secGateStatus}
                        onChange={(e) => setSecGateStatus(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 font-bold bg-slate-50"
                      >
                        <option value="Pintu Gerbang Kecil Ditutup Sesuai SOP">
                          Pintu Kecil Ditutup Sesuai SOP
                        </option>
                        <option value="Gerbang Utama Dikunci (Buka-Tutup Mandiri Warga)">
                          Gerbang Utama Dikunci (Malam Libur)
                        </option>
                        <option value="Gerbang Utama Digembok Sementara (ISOMA / Jumatan)">
                          Gerbang Digembok Sementara (ISOMA/Jumatan)
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="text-xs">
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Catatan Tambahan Lapangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lampu jalan dimatikan bertahap / KTP tamu sudah difoto..."
                    value={secCustomNote}
                    onChange={(e) => setSecCustomNote(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>

                {/* Input Kamera / Upload Foto Bukti Ber-Watermark ke Drive Log_Absensi_Security */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-teal-300 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-extrabold text-teal-900 block">
                        📸 Ambil / Upload Foto Bukti ber-Watermark (Opsional)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Otomatis diberi cap waktu & disimpan ke folder Drive:{' '}
                        <strong>Log_Absensi_Security</strong>
                      </p>
                    </div>
                    {secWatermarkedPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setSecWatermarkedPhoto('');
                          setSecPhotoFileName('');
                        }}
                        className="text-[10px] font-bold text-rose-600"
                      >
                        ✕ Hapus Foto
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleSelectSecurityPhoto}
                    className="w-full text-[11px] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:font-extrabold file:bg-teal-700 file:text-white cursor-pointer"
                  />

                  {secWatermarkedPhoto && (
                    <img
                      src={secWatermarkedPhoto}
                      alt="Preview Watermark Security"
                      className="w-full max-h-48 object-cover rounded-xl border border-teal-300 shadow-sm"
                    />
                  )}
                </div>

                {/* Preview Teks WA Siap Copas */}
                <div className="p-3.5 rounded-2xl bg-emerald-950 text-emerald-100 font-mono text-[11px] whitespace-pre-line">
                  {generatedSecurityWaText}
                </div>

                {secActionFeedback && (
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                    {secActionFeedback}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSubmitSecurityReport}
                    className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    📋 Salin Teks WA & Simpan Log ke Database/Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        'https://wa.me/?text=' + encodeURIComponent(generatedSecurityWaText),
                        '_blank'
                      );
                    }}
                    className="py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    📲 Buka & Kirim ke Grup WhatsApp →
                  </button>
                </div>
              </div>

              {/* 3. Kalender Rotasi Jaga Security 1 Bulan Penuh (V3) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🗓️ Kalender Rotasi Jaga Security (November 2026)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Minggu–Kamis: 2 Shift Normal • Jumat & Sabtu Malam: LIBUR (Gerbang Mandiri 20:00
                    WIB) • Klik tanggal untuk Tukar Shift / Izin
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                  {securitySchedules.map((sch) => {
                    const isLiburMalam = sch.shift_malam === 'LIBUR';
                    return (
                      <div
                        key={sch.id || sch.tanggal}
                        onClick={() => {
                          setSelectedScheduleDate(sch);
                          setScheduleEditForm({ ...sch });
                        }}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition ${
                          isLiburMalam
                            ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                            : 'bg-slate-50 border-slate-200 hover:bg-teal-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="text-slate-800">
                            {String(sch.tanggal).slice(8, 10)} Nov
                          </span>
                          <span className="text-[10px] text-slate-500">{sch.hari}</span>
                        </div>
                        <div className="mt-1.5 space-y-1 text-[10px]">
                          <p className="font-bold text-emerald-800 truncate">
                            ☀️ {sch.shift_pagi}
                          </p>
                          <p
                            className={`font-bold truncate ${
                              isLiburMalam ? 'text-amber-700' : 'text-indigo-800'
                            }`}
                          >
                            🌙 {isLiburMalam ? 'LIBUR (Mandiri)' : sch.shift_malam}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedScheduleDate && scheduleEditForm && (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-slate-800">
                        Ubah / Tukar Shift Tanggal: {scheduleEditForm.hari},{' '}
                        {scheduleEditForm.tanggal}
                      </h5>
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleDate(null)}
                        className="text-slate-500 font-bold cursor-pointer"
                      >
                        ✕ Tutup
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-500 mb-1">Petugas Shift Pagi</label>
                        <select
                          value={scheduleEditForm.shift_pagi}
                          onChange={(e) =>
                            setScheduleEditForm({
                              ...scheduleEditForm,
                              shift_pagi: e.target.value
                            })
                          }
                          className="w-full border rounded-xl px-3 py-2 bg-white font-bold"
                        >
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                          <option value="LIBUR">LIBUR / Izin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Petugas Shift Malam</label>
                        <select
                          value={scheduleEditForm.shift_malam}
                          onChange={(e) =>
                            setScheduleEditForm({
                              ...scheduleEditForm,
                              shift_malam: e.target.value
                            })
                          }
                          className="w-full border rounded-xl px-3 py-2 bg-white font-bold"
                        >
                          <option value="Pak Mulyadi">Pak Mulyadi</option>
                          <option value="Pak Eko">Pak Eko</option>
                          <option value="LIBUR">LIBUR (Gerbang Mandiri)</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateSecuritySchedule) {
                              onUpdateSecuritySchedule(scheduleEditForm);
                            }
                            setSelectedScheduleDate(null);
                          }}
                          className="w-full py-2 rounded-xl bg-teal-700 text-white font-extrabold cursor-pointer"
                        >
                          💾 Simpan Jadwal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Riwayat Log Aktivitas & Anomali Security (Terbaru di Atas + Link Foto Bukti Drive) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      📜 Riwayat Log & Anomali Keamanan (Terbaru di Atas)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Menampilkan {filteredSecurityLogs.length} rekaman patroli, absen shift, paket
                      warga & bukti foto lapangan
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Cari log / petugas..."
                      value={secLogSearch}
                      onChange={(e) => setSecLogSearch(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50"
                    />
                    <select
                      value={secLogFilter}
                      onChange={(e) => setSecLogFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-1.5 font-bold bg-slate-50"
                    >
                      <option value="ALL">Semua Kategori ({securityLogs.length})</option>
                      <option value="PATROLI">Patroli</option>
                      <option value="ABSEN_SHIFT">Absen Shift</option>
                      <option value="PAKET_SURAT">Paket Warga</option>
                      <option value="IZIN_POS">Izin Pos</option>
                      <option value="ANOMALI_FASILITAS">Anomali / Insiden</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredSecurityLogs.map((log) => {
                    const photoUrl = extractSecurityPhotoUrl(log);
                    return (
                      <div key={log.id} className="py-3.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-extrabold text-[10px]">
                              {log.kategori_laporan}
                            </span>
                            <strong className="text-slate-800">{log.sub_kategori}</strong>
                            <span className="text-slate-400 font-mono text-[11px]">
                              • {String(log.tanggal).slice(0, 10)} {log.jam} WIB
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {photoUrl && (
                              <a
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[11px] border border-teal-200"
                              >
                                📎 Lihat Foto Bukti
                              </a>
                            )}
                            {log.teks_wa && log.teks_wa !== '-' && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(log.teks_wa);
                                  setSecActionFeedback(
                                    `✅ Teks WA log ${log.id} berhasil disalin ulang!`
                                  );
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                              >
                                📋 Salin WA
                              </button>
                            )}
                            <span className="text-[11px] font-bold text-slate-600">
                              👮 {log.nama_security} ({log.shift})
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600">{log.detail_catatan}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Petugas Security Aktif & Riwayat Penggajian (Urut Oktober -> September) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-slate-800 text-base">
                    🛡️ Petugas Security Aktif & Riwayat Gaji (Terbaru di Atas)
                  </h4>
                  <span className="text-[11px] text-teal-700 font-bold">Oktober → September</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {securityPayroll.map((item) => (
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

              {/* 6. Slot Pantau 4 Titik CCTV Cluster (V2 Utuh) */}
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

      {/* BOTTOM NAVIGATION BAR (Mobile < 768px — 5 Tombol dengan Tombol Tengah Menonjol QRIS IPL) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-5 py-2 flex justify-between items-center text-xs z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'beranda' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mutasi')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'mutasi' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📑</span>
          <span>Mutasi Kas</span>
        </button>

        <button
          type="button"
          onClick={() => openQrisForHouse('H-01')}
          className="flex flex-col items-center -mt-6 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-lg border-4 border-white text-xl">
            📲
          </div>
          <span className="text-[10px] font-extrabold text-teal-800 mt-0.5">QRIS IPL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warga')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'warga' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🏘️</span>
          <span>22 Rumah</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('keamanan')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'keamanan' ? 'text-teal-700 font-extrabold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🛡️</span>
          <span>Keamanan</span>
        </button>
      </div>

      {/* MODAL POP-UP QRIS (Mendukung Prop Lama & Prop Baru V4.2 Sekaligus) */}
      <QrisPaymentModal
        isOpen={isQrisOpen}
        onClose={() => setIsQrisOpen(false)}
        initialHouse={qrisHouseId}
        defaultHouseId={qrisHouseId}
        merchantName={data.qris_merchant_name}
        qrisMerchantName={data.qris_merchant_name}
        nmid={data.qris_nmid}
        qrisNmid={data.qris_nmid}
        qrisImageUrl={data.qris_image_url}
        defaultAmount={data.default_ipl_amount || 200000}
        periodeBulan={data.summary_periode?.bulan || 'November'}
        periodeTahun={data.summary_periode?.tahun || 2026}
        houses={houses}
        onConfirmUpload={onUploadIplProof || onConfirmQrisProof}
        onUploadSuccess={onUploadIplProof || onConfirmQrisProof}
      />
    </div>
  );
}