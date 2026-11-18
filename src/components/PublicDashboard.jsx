import React, { useState, useMemo } from 'react';
import { compressImageToBase64, MONTH_LIST_ID, getSmartBookPeriod } from '../services/apiService';

/**
 * 55 RINCIAN TRANSAKSI HISTORIS (JUNI - OKTOBER 2026) SEBAGAI CADANGAN AWAL (FALLBACK)
 * Otomatis digantikan oleh data live dari sheet cash_ledger saat online
 */
const FALLBACK_LEDGER = [
  // OKTOBER 2026 (11 Transaksi)
  { id: 'TX-202610-01', tanggal: '2026-10-28', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 203000, keterangan: 'Token listrik pos & lampu jalan utama Oktober', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-02', tanggal: '2026-10-25', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Eko (Oktober 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-03', tanggal: '2026-10-25', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Mulyadi (Oktober 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-04', tanggal: '2026-10-20', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 400000, keterangan: 'Retribusi pengangkutan sampah lingkungan (22 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-05', tanggal: '2026-10-18', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 80000, keterangan: 'Kopi, gula, teh & air galon pos security (4 galon)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-06', tanggal: '2026-10-14', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Jasa las roda pintu pagar gerbang utama', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-07', tanggal: '2026-10-12', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 75000, keterangan: 'Iuran air bersih pos & penyiraman taman', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-08', tanggal: '2026-10-10', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1100000, keterangan: 'Pelunasan IPL Oktober Gelombang 3 (5,5 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-09', tanggal: '2026-10-05', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Pelunasan IPL Oktober Gelombang 2 (8 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202610-10', tanggal: '2026-10-01', periode_bulan: 'Oktober', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Pelunasan IPL Oktober Gelombang 1 (7 rumah)', house_id: '-', url_bukti: '-' },

  // SEPTEMBER 2026 (11 Transaksi)
  { id: 'TX-202609-01', tanggal: '2026-09-28', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 201500, keterangan: 'Token listrik pos & penerangan jalan September', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-02', tanggal: '2026-09-25', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Eko (September 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-03', tanggal: '2026-09-25', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Mulyadi (September 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-04', tanggal: '2026-09-20', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 400000, keterangan: 'Retribusi sampah bulanan cluster September', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-05', tanggal: '2026-09-16', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 85000, keterangan: 'Penggantian lampu sorot pos & perbaikan MCB', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-06', tanggal: '2026-09-14', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 75000, keterangan: 'Isi ulang galon pos & kopi jaga malam', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-07', tanggal: '2026-09-11', periode_bulan: 'September', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Biaya air bersih pos security September', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-08', tanggal: '2026-09-10', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1200000, keterangan: 'Iuran IPL Warga September Tahap 3 (6 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-09', tanggal: '2026-09-05', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1600000, keterangan: 'Iuran IPL Warga September Tahap 2 (8 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202609-10', tanggal: '2026-09-01', periode_bulan: 'September', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga September Tahap 1 (7 rumah)', house_id: '-', url_bukti: '-' },

  // AGUSTUS 2026 (11 Transaksi)
  { id: 'TX-202608-01', tanggal: '2026-08-28', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 202000, keterangan: 'Token listrik pos & PJU cluster Agustus', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-02', tanggal: '2026-08-25', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Eko (Agustus 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-03', tanggal: '2026-08-25', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Mulyadi (Agustus 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-04', tanggal: '2026-08-20', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 400000, keterangan: 'Retribusi pengangkutan sampah Agustus', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-05', tanggal: '2026-08-17', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sosial', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Konsumsi malam keakraban & bendera HUT RI ke-81', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-06', tanggal: '2026-08-14', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Air galon & kopi pos security Agustus', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-07', tanggal: '2026-08-10', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Tagihan air pos security Agustus', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-08', tanggal: '2026-08-09', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1200000, keterangan: 'Iuran IPL Warga Agustus Tahap 3 (6 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-09', tanggal: '2026-08-05', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Agustus Tahap 2 (7 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202608-10', tanggal: '2026-08-01', periode_bulan: 'Agustus', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Agustus Tahap 1 (7 rumah)', house_id: '-', url_bukti: '-' },

  // JULI 2026 (11 Transaksi)
  { id: 'TX-202607-01', tanggal: '2026-07-28', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 201000, keterangan: 'Token listrik pos & lampu jalan Juli', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-02', tanggal: '2026-07-25', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Eko (Juli 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-03', tanggal: '2026-07-25', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Mulyadi (Juli 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-04', tanggal: '2026-07-20', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 400000, keterangan: 'Retribusi pengangkutan sampah Juli', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-05', tanggal: '2026-07-15', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: false, nama_proyek: '', nominal: 55000, keterangan: 'Pembelian gembok cadangan & sapu lidi pos', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-06', tanggal: '2026-07-12', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Air galon & konsumsi pos security Juli', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-07', tanggal: '2026-07-10', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Tagihan air bersih pos security Juli', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-08', tanggal: '2026-07-09', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1200000, keterangan: 'Iuran IPL Warga Juli Tahap 3 (6 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-09', tanggal: '2026-07-05', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Juli Tahap 2 (7 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202607-10', tanggal: '2026-07-01', periode_bulan: 'Juli', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Juli Tahap 1 (7 rumah)', house_id: '-', url_bukti: '-' },

  // JUNI 2026 (11 Transaksi + Proyek 816rb)
  { id: 'TX-202606-01', tanggal: '2026-06-28', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Listrik', is_proyek: false, nama_proyek: '', nominal: 202000, keterangan: 'Token listrik pos & lampu jalan Juni', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-02', tanggal: '2026-06-25', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Eko (Juni 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-03', tanggal: '2026-06-25', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Gaji', is_proyek: false, nama_proyek: '', nominal: 1650000, keterangan: 'Gaji Security Pak Mulyadi (Juni 2026)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-04', tanggal: '2026-06-22', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Perawatan Pos', is_proyek: true, nama_proyek: 'Renovasi Atap Pos & Lampu Sorot Gerbang', nominal: 816000, keterangan: 'Proyek perbaikan atap pos bocor & instalasi lampu sorot gerbang', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-05', tanggal: '2026-06-20', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Sampah', is_proyek: false, nama_proyek: '', nominal: 400000, keterangan: 'Retribusi pengangkutan sampah Juni', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-06', tanggal: '2026-06-14', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Konsumsi', is_proyek: false, nama_proyek: '', nominal: 100000, keterangan: 'Konsumsi kerja bakti warga & galon pos Juni', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-07', tanggal: '2026-06-10', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'OUT', kategori: 'Air', is_proyek: false, nama_proyek: '', nominal: 70000, keterangan: 'Tagihan air bersih pos security Juni', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-08', tanggal: '2026-06-09', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Juni Tahap 3 (7 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-09', tanggal: '2026-06-05', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Juni Tahap 2 (7 rumah)', house_id: '-', url_bukti: '-' },
  { id: 'TX-202606-10', tanggal: '2026-06-01', periode_bulan: 'Juni', periode_tahun: 2026, tipe: 'IN', kategori: 'Iuran Warga', is_proyek: false, nama_proyek: '', nominal: 1400000, keterangan: 'Iuran IPL Warga Juni Tahap 1 (7 rumah)', house_id: '-', url_bukti: '-' }
];

const CCTV_CHANNELS = [
  { id: 'CAM-01', nama: 'Gerbang Utama Cluster', lokasi: 'Akses Keluar/Masuk & Pos Security', status: 'ONLINE' },
  { id: 'CAM-02', nama: 'Jalur Blok A (No. 01 - 11)', lokasi: 'Koridor Depan & Area Fasum Parkir', status: 'ONLINE' },
  { id: 'CAM-03', nama: 'Jalur Blok B (No. 12 - 22)', lokasi: 'Koridor Belakang & Taman', status: 'ONLINE' },
  { id: 'CAM-04', nama: 'Area Parkir Fasum (Slot 1-6)', lokasi: 'Pantauan Kendaraan Menginap', status: 'ONLINE' }
];

function formatRp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function hasValidDriveProof(url) {
  if (!url || url === '-') return false;
  return String(url).startsWith('http');
}

export default function PublicDashboard({
  data,
  loading,
  isRefreshing,
  onRefresh,
  liveClock,
  lastSyncTime,
  isOnline = true,
  activeTab: externalTab,
  onTabChange,
  activeBookBulan = 'November',
  activeBookTahun = 2026,
  onChangeBookPeriod,
  onOpenQris,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onAddSecurityLog,
  onUpdateSecuritySchedule,
  onUpdateParkingSlot
}) {
  const [internalTab, setInternalTab] = useState('overview');
  const currentTab = externalTab !== undefined ? externalTab : internalTab;
  const setTab = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    setInternalTab(tabId);
  };

  const [logoError, setLogoError] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [expandedClosingId, setExpandedClosingId] = useState('CLS-2026-10');

  // Filter Tab 22 Rumah
  const [houseSearch, setHouseSearch] = useState('');
  const [houseStatusFilter, setHouseStatusFilter] = useState('ALL');

  // Filter Tab Buku Kas
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState('ALL');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // State Pop-up Interaktif Klik Kotak Parkir (Slot 1-6)
  const [selectedSlotModal, setSelectedSlotModal] = useState(null);
  const [slotForm, setSlotForm] = useState({
    slot_number: 1,
    status_slot: 'TERISI',
    kategori_parkir: 'MEMBER_BULANAN',
    house_id: 'H-01',
    nama_pemilik: 'Pak Suharso',
    plat_nomor: '',
    keterangan_kendaraan: '',
    nominal_parkir: 100000,
    status_bayar_parkir: 'Menunggu Validasi',
    file_base64: '',
    file_name: ''
  });
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // State Tab Keamanan & SOS
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [sosTimerId, setSosTimerId] = useState(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
  const [scheduleEditForm, setScheduleEditForm] = useState({
    shift_pagi: 'Pak Eko',
    shift_malam: 'Pak Mulyadi',
    status_jadwal: 'NORMAL_2_SHIFT',
    catatan_jadwal: ''
  });

  // Generator Laporan WA Security + Ceklis Parkir Malam V5.0 + Foto Bukti
  const [secReportForm, setSecReportForm] = useState({
    nama_security: 'Pak Eko',
    shift: 'Pagi',
    kategori_laporan: 'PATROLI',
    sub_kategori: 'Patroli Malam 5 Titik',
    house_id: '-',
    cuaca_815: 'Cerah',
    status_gerbang: 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: 'Situasi Cluster Mutiara Residence aman terkendali.',
    parked_house_ids: [],
    file_base64: '',
    file_name: ''
  });
  const [isSubmittingSecLog, setIsSubmittingSecLog] = useState(false);
  const [secStatusMsg, setSecStatusMsg] = useState('');

  const houses = data?.houses || [];
  const activeHousesList = useMemo(
    () => houses.filter((h) => !String(h.status_huni || '').includes('Tidak Aktif') && h.id !== 'H-04'),
    [houses]
  );
  const iplStatusList = data?.ipl_status || [];
  const cashLedger = data?.cash_ledger?.length ? data.cash_ledger : FALLBACK_LEDGER;
  const closings = data?.monthly_closings || [];
  const securityPayroll = data?.security_payroll || [];
  const securitySchedules = data?.security_schedules || [];
  const securityLogs = data?.security_logs || [];
  const parkingConfig = data?.parking_config || {
    total_slots: 6,
    fee_monthly: 100000,
    fee_weekend: 50000,
    fee_daily: 10000,
    free_guest_nights: 3,
    cutoff_day_ipl: 25,
    rules_note: 'Parkir Siang Gratis • Tamu Menginap Gratis maks 3 malam/bln • Member Bulanan Rp100.000 • Paket Weekend Rp50.000'
  };
  const parkingSlots = data?.parking_slots || [];
  const parkingNightStats = data?.parking_night_stats || [];
  const smartPeriod = data?.smart_period || getSmartBookPeriod(parkingConfig.cutoff_day_ipl || 25);
  const balanceBreakdown = data?.balance_breakdown || {
    periode_bulan: activeBookBulan,
    periode_tahun: activeBookTahun,
    saldo_buku_berjalan: data?.current_balance || 1394200,
    pemasukan_bulan_ini: 0,
    pengeluaran_bulan_ini: 0,
    pemasukan_parkir_bulan_ini: 0,
    next_periode_bulan: smartPeriod.next_bulan || 'Desember',
    next_periode_tahun: smartPeriod.next_tahun || 2026,
    titipan_ipl_bulan_depan: 0,
    saldo_fisik_termasuk_titipan: data?.current_balance || 1394200
  };

  // Hitung Statistik IPL pada Periode Bulan Buku Aktif
  const iplStats = useMemo(() => {
    const activeRows = iplStatusList.filter(
      (r) => !String(r.status_bayar || '').includes('Non-Aktif') && r.house_id !== 'H-04'
    );
    const lunasCount = activeRows.filter((r) => String(r.status_bayar) === 'Lunas').length;
    const belumCount = Math.max(0, 21 - lunasCount);
    const waitingCount = activeRows.filter(
      (r) => String(r.status_bayar) !== 'Lunas' && String(r.catatan || '').includes('Menunggu Validasi')
    ).length;
    return { lunasCount, belumCount, waitingCount, totalActive: 21 };
  }, [iplStatusList]);

  // Jadwal Security Hari Ini
  const todaySchedule = useMemo(() => {
    const now = liveClock || new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return (
      securitySchedules.find((s) => String(s.tanggal).slice(0, 10) === todayStr) ||
      securitySchedules[0] || {
        tanggal: todayStr,
        hari: 'Hari Ini',
        shift_pagi: data?.security_config?.active_1 || 'Pak Eko',
        jam_pagi: '08:00 - 20:00',
        shift_malam: data?.security_config?.active_2 || 'Pak Mulyadi',
        jam_malam: '20:00 - 08:00',
        status_jadwal: 'NORMAL_2_SHIFT',
        catatan_jadwal: 'Jaga normal 2 shift (Pagi & Malam)'
      }
    );
  }, [securitySchedules, liveClock, data]);

  // Statistik Slot Parkir Terisi vs Kosong
  const normalizedSlots = useMemo(() => {
    const total = Number(parkingConfig.total_slots || 6);
    const list = [];
    for (let i = 1; i <= total; i++) {
      const found = parkingSlots.find((s) => Number(s.slot_number) === i);
      list.push(
        found || {
          slot_id: `SLOT-0${i}`,
          slot_number: i,
          posisi_layout: i <= 4 ? `KIRI_VERTIKAL_${i}` : `KANAN_${i}`,
          status_slot: 'KOSONG',
          kategori_parkir: '-',
          house_id: '-',
          nama_pemilik: '-',
          plat_nomor: '-',
          keterangan_kendaraan: `Slot Parkir #${i} Kosong`,
          waktu_masuk: '-',
          status_bayar_parkir: '-',
          nominal_parkir: 0,
          url_bukti_parkir: '-'
        }
      );
    }
    return list;
  }, [parkingSlots, parkingConfig.total_slots]);

  const occupiedSlotsCount = useMemo(
    () => normalizedSlots.filter((s) => String(s.status_slot).toUpperCase() !== 'KOSONG').length,
    [normalizedSlots]
  );

  // Filter Rumah di Tab 22 Rumah
  const filteredIplHouses = useMemo(() => {
    return iplStatusList.filter((item) => {
      const matchSearch =
        !houseSearch ||
        String(item.nomor_rumah).toLowerCase().includes(houseSearch.toLowerCase()) ||
        String(item.nama_kepala_keluarga).toLowerCase().includes(houseSearch.toLowerCase()) ||
        String(item.house_id).toLowerCase().includes(houseSearch.toLowerCase());

      if (!matchSearch) return false;
      if (houseStatusFilter === 'LUNAS') return item.status_bayar === 'Lunas';
      if (houseStatusFilter === 'BELUM') return item.status_bayar === 'Belum Lunas';
      return true;
    });
  }, [iplStatusList, houseSearch, houseStatusFilter]);

  // Filter Transaksi di Tab Buku Kas
  const filteredLedger = useMemo(() => {
    return cashLedger.filter((tx) => {
      if (ledgerMonthFilter !== 'ALL' && String(tx.periode_bulan) !== ledgerMonthFilter) {
        return false;
      }
      if (ledgerTypeFilter !== 'ALL' && String(tx.tipe).toUpperCase() !== ledgerTypeFilter) {
        return false;
      }
      if (ledgerSearch) {
        const q = ledgerSearch.toLowerCase();
        const matchKet = String(tx.keterangan || '').toLowerCase().includes(q);
        const matchKat = String(tx.kategori || '').toLowerCase().includes(q);
        const matchId = String(tx.id || '').toLowerCase().includes(q);
        if (!matchKet && !matchKat && !matchId) return false;
      }
      return true;
    });
  }, [cashLedger, ledgerMonthFilter, ledgerTypeFilter, ledgerSearch]);

  const filteredLedgerSummary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalParkir = 0;
    filteredLedger.forEach((tx) => {
      const nom = Number(tx.nominal || 0);
      if (String(tx.tipe).toUpperCase() === 'IN') {
        totalIn += nom;
        if (String(tx.kategori || '').toLowerCase().includes('parkir')) {
          totalParkir += nom;
        }
      } else {
        totalOut += nom;
      }
    });
    return { totalIn, totalOut, totalParkir, selisih: totalIn - totalOut };
  }, [filteredLedger]);

  // Format Tanggal & Jam Detik Real-Time (WIB)
  const formattedClock = useMemo(() => {
    const d = liveClock || new Date();
    const datePart = d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return `${datePart} • ${timePart} WIB`;
  }, [liveClock]);

  const handleLogoClick = () => {
    const next = logoTapCount + 1;
    if (next >= 5) {
      setLogoTapCount(0);
      if (onOpenAdminLogin) onOpenAdminLogin();
    } else {
      setLogoTapCount(next);
    }
  };

  // Buka Pop-up Saat Kotak Slot Parkir 1-6 Diklik
  const handleOpenSlotModal = (slotObj) => {
    const isCurrentlyEmpty = String(slotObj.status_slot).toUpperCase() === 'KOSONG';
    const defaultHouse = activeHousesList[0] || { id: 'H-01', nomor_rumah: '01', nama_kepala_keluarga: 'Pak Suharso' };

    setSelectedSlotModal(slotObj);
    setSlotForm({
      slot_number: slotObj.slot_number,
      status_slot: 'TERISI',
      kategori_parkir: isCurrentlyEmpty ? 'MEMBER_BULANAN' : (slotObj.kategori_parkir || 'MEMBER_BULANAN'),
      house_id: isCurrentlyEmpty ? defaultHouse.id : (slotObj.house_id !== '-' ? slotObj.house_id : defaultHouse.id),
      nama_pemilik: isCurrentlyEmpty
        ? `No. ${defaultHouse.nomor_rumah} - ${defaultHouse.nama_kepala_keluarga}`
        : (slotObj.nama_pemilik !== '-' ? slotObj.nama_pemilik : `No. ${defaultHouse.nomor_rumah} - ${defaultHouse.nama_kepala_keluarga}`),
      plat_nomor: isCurrentlyEmpty ? '' : (slotObj.plat_nomor !== '-' ? slotObj.plat_nomor : ''),
      keterangan_kendaraan: isCurrentlyEmpty ? '' : (slotObj.keterangan_kendaraan || ''),
      nominal_parkir: isCurrentlyEmpty ? Number(parkingConfig.fee_monthly || 100000) : Number(slotObj.nominal_parkir || 0),
      status_bayar_parkir: isCurrentlyEmpty ? 'Menunggu Validasi' : (slotObj.status_bayar_parkir || 'Gratis'),
      file_base64: '',
      file_name: ''
    });
  };

  const handleSelectParkingCategoryInModal = (catKey) => {
    let fee = 0;
    let statusBayar = 'Gratis';
    if (catKey === 'MEMBER_BULANAN') {
      fee = Number(parkingConfig.fee_monthly || 100000);
      statusBayar = 'Menunggu Validasi';
    } else if (catKey === 'PAKET_WEEKEND') {
      fee = Number(parkingConfig.fee_weekend || 50000);
      statusBayar = 'Menunggu Validasi';
    } else if (catKey === 'HARIAN_LEBIH_3_MALAM') {
      fee = Number(parkingConfig.fee_daily || 10000);
      statusBayar = 'Menunggu Validasi';
    }
    setSlotForm((prev) => ({
      ...prev,
      kategori_parkir: catKey,
      nominal_parkir: fee,
      status_bayar_parkir: statusBayar
    }));
  };

  const handleSelectSlotProofPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImageToBase64(file, 800, 0.75);
    setSlotForm((prev) => ({
      ...prev,
      file_base64: base64,
      file_name: file.name
    }));
  };

  const handleSaveSlotCheckIn = async (e) => {
    e.preventDefault();
    if (!onUpdateParkingSlot) return;
    setIsSavingSlot(true);
    try {
      await onUpdateParkingSlot({
        ...slotForm,
        status_slot: 'TERISI',
        periode_bulan: activeBookBulan,
        periode_tahun: activeBookTahun
      });
      setSelectedSlotModal(null);
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleClearSlot = async () => {
    if (!onUpdateParkingSlot || !selectedSlotModal) return;
    setIsSavingSlot(true);
    try {
      await onUpdateParkingSlot({
        slot_number: selectedSlotModal.slot_number,
        status_slot: 'KOSONG',
        periode_bulan: activeBookBulan,
        periode_tahun: activeBookTahun
      });
      setSelectedSlotModal(null);
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Helper Warna Kotak Slot Parkir (1-6)
  const getSlotVisualStyle = (slot) => {
    const isOccupied = String(slot.status_slot).toUpperCase() !== 'KOSONG';
    if (!isOccupied) {
      return {
        bg: 'bg-slate-50 hover:bg-teal-50/60 border-dashed border-slate-300 text-slate-600',
        badge: 'bg-slate-200 text-slate-700',
        label: 'KOSONG • KLIK LAPOR'
      };
    }
    const cat = String(slot.kategori_parkir || '').toUpperCase();
    if (cat.includes('MEMBER')) {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-500 text-emerald-950 shadow-sm',
        badge: 'bg-emerald-600 text-white',
        label: 'MEMBER BULANAN'
      };
    }
    if (cat.includes('WEEKEND')) {
      return {
        bg: 'bg-sky-50 hover:bg-sky-100/80 border-sky-500 text-sky-950 shadow-sm',
        badge: 'bg-sky-600 text-white',
        label: 'PAKET WEEKEND'
      };
    }
    return {
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-500 text-amber-950 shadow-sm',
      badge: 'bg-amber-500 text-slate-950',
      label: cat.includes('SIANG') ? 'PARKIR SIANG' : 'TAMU / HARIAN'
    };
  };

  // Generator Teks WA Otomatis untuk Security
  const generatedWaText = useMemo(() => {
    const {
      nama_security,
      shift,
      kategori_laporan,
      sub_kategori,
      house_id,
      cuaca_815,
      status_gerbang,
      detail_catatan,
      parked_house_ids
    } = secReportForm;

    const targetHouse = houses.find((h) => h.id === house_id);
    const wargaLabel = targetHouse
      ? `Rumah No. ${targetHouse.nomor_rumah} (${targetHouse.alias_keluarga || targetHouse.nama_kepala_keluarga})`
      : '-';

    const parkirSuffix =
      parked_house_ids && parked_house_ids.length > 0
        ? `\n🅿️ *Pantauan Parkir Menginap Fasum:* ${parked_house_ids.join(', ')}`
        : '';

    if (kategori_laporan === 'PAKET_TAMU') {
      return `Selamat ${shift === 'Pagi' ? 'siang/sore' : 'malam'} Bapak/Ibu warga CMR, izin menginformasikan ada titipan paket/tamu untuk *${wargaLabel}* sudah diterima dan diamankan di Pos Security (${ nama_security }).\nCatatan: ${detail_catatan}`;
    }
    if (kategori_laporan === 'TUTUP_POS_MALAM_LIBUR') {
      return `Selamat malam Bapak/Ibu warga Cluster Mutiara Residence, izin melaporkan tugas jaga shift pagi (${nama_security}) selesai pukul 20.00 WIB. Mengingat malam ini jadwal libur security, pintu gerbang sudah kami tutup dan lampu jalan sudah dinyalakan. Mohon kerja sama warga yang keluar/masuk untuk menutup kembali gerbang. Terima kasih.`;
    }
    if (kategori_laporan === 'IZIN_ISOMA') {
      return `Selamat siang Bapak/Ibu warga CMR, izin meninggalkan pos sementara (${nama_security}) untuk melaksanakan ${sub_kategori}. ${status_gerbang}. Terima kasih.`;
    }
    return `Selamat ${shift === 'Pagi' ? 'pagi/siang' : 'malam'} komandan & Bapak/Ibu warga CMR, izin melaporkan giat *${sub_kategori}* bersama *${nama_security}* (Shift ${shift}).\n• Situasi: Aman terkendali (815 ${cuaca_815})\n• Gerbang: ${status_gerbang}\n• Catatan: ${detail_catatan}${parkirSuffix}`;
  }, [secReportForm, houses]);

  const handleToggleNightParkedHouse = (houseId) => {
    setSecReportForm((prev) => {
      const exists = prev.parked_house_ids.includes(houseId);
      const updated = exists
        ? prev.parked_house_ids.filter((id) => id !== houseId)
        : [...prev.parked_house_ids, houseId];
      return { ...prev, parked_house_ids: updated };
    });
  };

  const handleSelectSecPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImageToBase64(file, 800, 0.75);
    setSecReportForm((prev) => ({
      ...prev,
      file_base64: base64,
      file_name: file.name
    }));
  };

  const handleSubmitSecurityReport = async (e) => {
    e.preventDefault();
    setIsSubmittingSecLog(true);
    setSecStatusMsg('⏳ Menyimpan laporan security & menyalin teks WA...');
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedWaText);
      }
      const targetHouse = houses.find((h) => h.id === secReportForm.house_id);
      await onAddSecurityLog({
        ...secReportForm,
        nama_warga_tujuan: targetHouse
          ? targetHouse.alias_keluarga || targetHouse.nama_kepala_keluarga
          : '-',
        teks_wa: generatedWaText
      });
      setSecStatusMsg('✅ Teks WA tersalin ke Clipboard & Laporan tersimpan di Database!');
      setSecReportForm((prev) => ({
        ...prev,
        file_base64: '',
        file_name: '',
        parked_house_ids: []
      }));
    } catch (err) {
      setSecStatusMsg('⚠️ Tersimpan lokal: ' + err.message);
    } finally {
      setIsSubmittingSecLog(false);
    }
  };

  // Panic Button SOS Tahan 3 Detik
  const startSosHold = () => {
    let progress = 0;
    const id = setInterval(() => {
      progress += 10;
      setSosHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(id);
        setSosHoldProgress(0);
        const sosText = encodeURIComponent(
          '🚨 *DARURAT SOS CLUSTER MUTIARA RESIDENCE* 🚨\nMohon bantuan segera ke titik lokasi warga! Dikirim melalui Panic Button C-Money.'
        );
        window.open(`https://wa.me/?text=${sosText}`, '_blank');
      }
    }, 250);
    setSosTimerId(id);
  };

  const stopSosHold = () => {
    if (sosTimerId) clearInterval(sosTimerId);
    setSosHoldProgress(0);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800 pb-12">
      {/* HEADER ATAS + STATUS ONLINE + JAM DETIK REAL-TIME + TOMBOL REFRESH */}
      <header className="sticky top-0 z-30 bg-teal-900 text-white shadow-md border-b border-teal-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
          {/* Kiri: Logo Kustom 512x512 + Nama Aplikasi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogoClick}
              className="w-10 h-10 rounded-2xl bg-teal-700 border border-teal-400/40 flex items-center justify-center overflow-hidden shadow-inner shrink-0"
              title="C-Money CMR (Ketuk 5x untuk Pengurus)"
            >
              {!logoError && data?.logo_url ? (
                <img
                  src={data.logo_url}
                  alt="C-Money"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-lg font-black text-amber-300">C</span>
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-none">
                  {data?.app_name || 'C-Money'}
                </h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-800 text-teal-200 border border-teal-600">
                  V5.0 AIO
                </span>
              </div>
              <p className="text-[11px] text-teal-200 font-medium truncate max-w-[220px] sm:max-w-none">
                {data?.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya'}
              </p>
            </div>
          </div>

          {/* Kanan: Lampu Hijau Online + Jam Detik WIB + Tombol Refresh + Tombol Pengurus */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-teal-950/80 border border-teal-700/80 px-2.5 py-1.5 rounded-xl text-[11px]">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </span>
              <span className="font-semibold text-teal-100 hidden md:inline">
                {isOnline ? 'Online • Tersinkron' : 'Mode Lokal'}
              </span>
              <span className="text-amber-300 font-mono font-bold">{formattedClock}</span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl border border-teal-600 transition shadow-sm"
              title="Sinkronkan Data Terbaru dari Spreadsheet"
            >
              <span className={isRefreshing || loading ? 'animate-spin inline-block' : ''}>🔄</span>
              <span>{isRefreshing || loading ? 'Memuat...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdminLogin}
              className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl border transition shadow-sm ${
                isAdminLoggedIn
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-teal-950/90 text-teal-200 border-teal-700 hover:bg-teal-800'
              }`}
            >
              <span>{isAdminLoggedIn ? '⚙️ Panel Pengurus' : '🔒 Pengurus'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTAINER UTAMA FULL-WIDTH DESKTOP & MOBILE */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {/* TOP HERO GRID (UX 3: KARTU SALDO & STATUS POS SEJAJAR DI ATAS AGAR SCROLL BAWAH FULL-WIDTH 100%) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* KARTU SALDO KAS AKTIF + PEMISAHAN SIKLUS CUT-OFF TGL 25 (7 Kolom Desktop) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-teal-700/50 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-teal-200">
                    Saldo Kas Aktif Cluster (Real-Time)
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    Buku {activeBookBulan} {activeBookTahun}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  {formatRp(data?.current_balance || 1394200)}
                </h2>
              </div>

              {/* Pemilih Cepat Periode Buku Aktif */}
              <div className="flex items-center gap-1.5 bg-slate-900/70 border border-teal-600/50 rounded-2xl p-1.5">
                <span className="text-[10px] text-teal-300 font-bold px-1.5">Periode Buku:</span>
                <select
                  value={activeBookBulan}
                  onChange={(e) => onChangeBookPeriod && onChangeBookPeriod(e.target.value, activeBookTahun)}
                  className="bg-teal-800 text-amber-300 font-extrabold text-xs rounded-xl px-2.5 py-1 border border-teal-600 focus:outline-none"
                >
                  {MONTH_LIST_ID.map((m) => (
                    <option key={m} value={m}>
                      {m} {activeBookTahun}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rincian Saldo Bulan Berjalan vs Titipan IPL Bulan Depan (Cut-Off Tgl 25) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3.5 bg-slate-950/45 border border-teal-700/40 rounded-2xl p-3">
              <div>
                <p className="text-[10px] text-teal-300">IPL Lunas ({activeBookBulan})</p>
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  {iplStats.lunasCount} / 21 Rumah
                </p>
              </div>
              <div>
                <p className="text-[10px] text-teal-300">Kas Parkir Fasum</p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-300">
                  {formatRp(balanceBreakdown.pemasukan_parkir_bulan_ini || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-teal-300">
                  Titipan {balanceBreakdown.next_periode_bulan || smartPeriod.next_bulan}
                </p>
                <p className="text-xs sm:text-sm font-extrabold text-amber-300">
                  {formatRp(balanceBreakdown.titipan_ipl_bulan_depan || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-teal-300">Slot Parkir Fasum</p>
                <p className="text-xs sm:text-sm font-extrabold text-sky-300">
                  {occupiedSlotsCount} / {parkingConfig.total_slots || 6} Terisi
                </p>
              </div>
            </div>

            {/* Info Siklus Buku Tgl 25 + Tombol Bayar QRIS */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-teal-200">
                📅 <span className="font-bold text-amber-300">Siklus Cut-Off Tgl {parkingConfig.cutoff_day_ipl || 25}:</span>{' '}
                {smartPeriod.is_after_cutoff
                  ? ` Pembayaran tgl ${parkingConfig.cutoff_day_ipl}–31 otomatis masuk Buku ${smartPeriod.default_ipl_bulan}.`
                  : ` Pembayaran tgl 1–${parkingConfig.cutoff_day_ipl - 1} tercatat di Buku ${smartPeriod.default_ipl_bulan}.`}
              </div>
              <button
                type="button"
                onClick={() => onOpenQris && onOpenQris(null)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
              >
                <span>📲 Bayar IPL / Parkir (QRIS)</span>
              </button>
            </div>
          </div>

          {/* KARTU STATUS POS SECURITY HARI INI & AKSI CEPAT (5 Kolom Desktop) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-md border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  🛡️ Pos Security Hari Ini ({todaySchedule.hari})
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  🚰 Galon Pos: <strong className="text-teal-700">{data?.security_config?.galon_count_bulan_ini || 4}x</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 my-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    ☀️ Shift Pagi ({todaySchedule.jam_pagi})
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {todaySchedule.shift_pagi}
                  </p>
                </div>
                <div
                  className={`border rounded-2xl p-3 ${
                    String(todaySchedule.shift_malam).includes('LIBUR')
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    🌙 Shift Malam ({todaySchedule.jam_malam})
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {todaySchedule.shift_malam}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                📌 {todaySchedule.catatan_jadwal}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTab('parking')}
                className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs border border-teal-200 transition flex items-center justify-center gap-1.5"
              >
                <span>🅿️ Cek Denah Parkir ({occupiedSlotsCount}/{parkingConfig.total_slots || 6})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('security')}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>👮 Lapor Patroli / SOS</span>
              </button>
            </div>
          </div>
        </section>

        {/* UX 1: SATU MENU UTAMA TERPADU DI BAWAH CARD SALDO (TANPA MENU BAWAH STATIS) */}
        <nav className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                currentTab === 'overview'
                  ? 'bg-teal-800 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>🏠</span>
              <span>Beranda</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQris && onOpenQris(null)}
              className="py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 bg-amber-400/90 hover:bg-amber-400 text-slate-950 shadow-sm transition"
            >
              <span>📲</span>
              <span>Bayar QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('houses')}
              className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                currentTab === 'houses'
                  ? 'bg-teal-800 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>🏘️</span>
              <span>22 Rumah</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('ledger')}
              className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                currentTab === 'ledger'
                  ? 'bg-teal-800 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>📑</span>
              <span>Buku Kas</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('parking')}
              className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                currentTab === 'parking'
                  ? 'bg-teal-800 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>🅿️</span>
              <span>Parkir ({occupiedSlotsCount}/{parkingConfig.total_slots || 6})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('security')}
              className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                currentTab === 'security'
                  ? 'bg-teal-800 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>🛡️</span>
              <span>Pos & SOS</span>
            </button>
          </div>
        </nav>

        {/* =====================================================================
            TAB 1: BERANDA (REKAP 5 BULAN + RINCIAN KATEGORI & 2 KARTU BAWAH)
           ===================================================================== */}
        {currentTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    📊 Riwayat Laporan Tutup Buku Bulanan (Terbaru di Atas)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klik pada kartu bulan untuk melihat rincian pemasukan, pengeluaran per kategori, dan proyek.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  22 Unit (21 Aktif • 1 Non-Aktif BPR)
                </span>
              </div>

              <div className="space-y-3">
                {closings.map((cls) => {
                  const isExpanded = expandedClosingId === cls.id;
                  const monthTx = cashLedger.filter(
                    (tx) =>
                      String(tx.periode_bulan) === String(cls.periode_bulan) &&
                      Number(tx.periode_tahun || 2026) === Number(cls.periode_tahun || 2026)
                  );

                  const inByCategory = {};
                  const outByCategory = {};
                  const projectItems = [];

                  monthTx.forEach((t) => {
                    const nom = Number(t.nominal || 0);
                    const kat = t.kategori || 'Lainnya';
                    if (String(t.tipe).toUpperCase() === 'IN') {
                      inByCategory[kat] = (inByCategory[kat] || 0) + nom;
                    } else {
                      if (!outByCategory[kat]) outByCategory[kat] = { total: 0, items: [] };
                      outByCategory[kat].total += nom;
                      outByCategory[kat].items.push(`${t.keterangan} (${formatRp(nom)})`);
                      if (t.is_proyek || String(t.is_proyek).toUpperCase() === 'TRUE') {
                        projectItems.push({
                          nama: t.nama_proyek || t.keterangan,
                          nominal: nom,
                          url_bukti: t.url_bukti
                        });
                      }
                    }
                  });

                  const totalAvailable = Number(cls.saldo_awal || 0) + Number(cls.uang_masuk || 0);
                  const outRatio =
                    totalAvailable > 0
                      ? Math.min(100, Math.round((Number(cls.total_pengeluaran || 0) / totalAvailable) * 100))
                      : 0;

                  return (
                    <div
                      key={cls.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60"
                    >
                      <div
                        onClick={() => setExpandedClosingId(isExpanded ? null : cls.id)}
                        className="p-4 bg-white hover:bg-slate-50 cursor-pointer transition flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900">
                              Periode {cls.periode_bulan} {cls.periode_tahun}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {cls.status_tutup_buku || 'FINAL'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Saldo Awal: {formatRp(cls.saldo_awal)} • Masuk: +{formatRp(cls.uang_masuk)} • Keluar: -{formatRp(cls.total_pengeluaran)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Sisa Saldo</p>
                            <p className="text-sm sm:text-base font-black text-teal-800">
                              {formatRp(cls.sisa_saldo)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200">
                            {isExpanded ? '▲ Tutup Rincian' : '▼ Lihat Rincian Kategori & Proyek'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Rasio Kas Masuk vs Pengeluaran */}
                      <div className="px-4 pb-2 bg-white">
                        <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-rose-500 h-full transition-all"
                            style={{ width: `${outRatio}%` }}
                            title={`Pengeluaran ${outRatio}%`}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200 space-y-3 text-xs bg-slate-50">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <p className="text-[10px] text-slate-500">Saldo Awal</p>
                              <p className="font-bold text-slate-800">{formatRp(cls.saldo_awal)}</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <p className="text-[10px] text-slate-500">Uang Masuk</p>
                              <p className="font-bold text-emerald-700">+{formatRp(cls.uang_masuk)}</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <p className="text-[10px] text-slate-500">Total Pengeluaran</p>
                              <p className="font-bold text-rose-600">-{formatRp(cls.total_pengeluaran)}</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <p className="text-[10px] text-slate-500">Pengeluaran Proyek</p>
                              <p className="font-bold text-amber-700">{formatRp(cls.pengeluaran_proyek)}</p>
                            </div>
                            <div className="bg-teal-900 text-white p-2.5 rounded-xl">
                              <p className="text-[10px] text-teal-200">Sisa Saldo Akhir</p>
                              <p className="font-extrabold text-amber-300">{formatRp(cls.sisa_saldo)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <p className="font-bold text-emerald-800 mb-1.5">
                                Breakdown Pemasukan per Kategori:
                              </p>
                              <ul className="space-y-1 text-slate-700">
                                {Object.keys(inByCategory).map((k) => (
                                  <li key={k} className="flex justify-between">
                                    <span>• {k}</span>
                                    <span className="font-bold text-emerald-700">{formatRp(inByCategory[k])}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <p className="font-bold text-rose-800 mb-1.5">
                                Breakdown Pengeluaran per Kategori:
                              </p>
                              <ul className="space-y-1.5 text-slate-700">
                                {Object.keys(outByCategory).map((k) => (
                                  <li key={k}>
                                    <div className="flex justify-between font-bold">
                                      <span>• {k}</span>
                                      <span className="text-rose-600">{formatRp(outByCategory[k].total)}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 pl-3">
                                      Detail: {outByCategory[k].items.join('; ')}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {projectItems.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                              <p className="font-bold text-amber-900 mb-1">🔨 Detail Proyek Bulan Ini:</p>
                              {projectItems.map((p, idx) => (
                                <p key={idx} className="text-amber-800 font-medium">
                                  • {p.nama} — <strong>{formatRp(p.nominal)}</strong>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2 KARTU RINGKASAN BAWAH DI TAB BERANDA (TRANSPARANSI GAJI SECURITY & STRUKTUR BEBAN WAJIB) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mb-2">
                  👮 Transparansi Gaji & Potongan Kasbon Security
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Gaji pokok Rp1.650.000/personel otomatis dihitung bersih setelah dikurangi kasbon berjalan.
                </p>
                <div className="space-y-2.5">
                  {securityPayroll.slice(0, 2).map((pay) => (
                    <div
                      key={pay.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900">
                          {pay.nama_security} ({pay.periode_bulan} {pay.periode_tahun})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Gaji Pokok {formatRp(pay.gaji_pokok)} • Kasbon: -{formatRp(pay.potongan_kasbon)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {pay.status_pembayaran}
                        </span>
                        <p className="font-black text-teal-800 text-sm mt-0.5">
                          {formatRp(pay.gaji_bersih)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mb-2">
                  📌 Struktur Hunian & Beban Wajib Bulanan CMR
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex justify-between py-1 border-b border-slate-100">
                    <span>Total Hunian Terdaftar</span>
                    <span className="font-bold">22 Rumah (21 Aktif + 1 Non-Aktif BPR)</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-100">
                    <span>Potensi Maksimal IPL (21 × Rp200.000)</span>
                    <span className="font-bold text-emerald-700">Rp 4.200.000 / bln</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-100">
                    <span>Beban Tetap (Gaji 2 Security + Sampah + Listrik/Air)</span>
                    <span className="font-bold text-rose-600">± Rp 4.050.000 / bln</span>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Kontribusi Parkir Fasum (Slot 1–6)</span>
                    <span className="font-bold text-teal-700">
                      Member {formatRp(parkingConfig.fee_monthly)} • Weekend {formatRp(parkingConfig.fee_weekend)}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: 22 RUMAH (PEMILIH PERIODE BULAN BUKU + BUKTI DRIVE + QRIS)
           ===================================================================== */}
        {currentTab === 'houses' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  🏘️ Status Iuran IPL 22 Unit Rumah — Buku {activeBookBulan} {activeBookTahun}
                </h3>
                <p className="text-xs text-slate-500">
                  21 Rumah Aktif Wajib IPL Rp200.000 • Rumah No. 04 Berstatus Non-Aktif (Dijual Pihak BPR).
                </p>
              </div>

              {/* Pemilih Cepat Bulan Buku (Memudahkan Transisi Tgl 25) */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeBookBulan}
                  onChange={(e) => onChangeBookPeriod && onChangeBookPeriod(e.target.value, activeBookTahun)}
                  className="px-3 py-2 rounded-xl border border-teal-600 bg-teal-50 text-teal-900 font-extrabold text-xs"
                >
                  {MONTH_LIST_ID.map((m) => (
                    <option key={m} value={m}>
                      Periode Buku: {m} {activeBookTahun}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    onChangeBookPeriod &&
                    onChangeBookPeriod(smartPeriod.default_ipl_bulan, smartPeriod.default_ipl_tahun)
                  }
                  className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 transition"
                >
                  ⚡ Ke Buku Aktif Cut-Off ({smartPeriod.default_ipl_bulan})
                </button>
              </div>
            </div>

            {/* Bar Pencarian & Filter Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <input
                type="text"
                placeholder="Cari nomor rumah atau nama warga (Contoh: 07 / Kiswanto / Baim)..."
                value={houseSearch}
                onChange={(e) => setHouseSearch(e.target.value)}
                className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <div className="flex gap-1.5">
                {[
                  { id: 'ALL', label: `Semua (22)` },
                  { id: 'LUNAS', label: `Lunas (${iplStats.lunasCount})` },
                  { id: 'BELUM', label: `Belum Lunas (${iplStats.belumCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHouseStatusFilter(f.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                      houseStatusFilter === f.id
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid 22 Kartu Rumah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIplHouses.map((item) => {
                const isBpr = String(item.status_bayar).includes('Non-Aktif') || item.house_id === 'H-04';
                const isLunas = item.status_bayar === 'Lunas';
                const isWaiting = !isLunas && String(item.catatan || '').includes('Menunggu Validasi');
                const houseMaster = houses.find((h) => h.id === item.house_id);

                return (
                  <div
                    key={item.id || item.house_id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
                      isBpr
                        ? 'bg-slate-100 border-slate-300 opacity-80'
                        : isLunas
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : isWaiting
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-teal-900 text-white font-black text-xs flex items-center justify-center">
                            {item.nomor_rumah}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">
                              {item.nama_kepala_keluarga}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {houseMaster?.alias_keluarga || `Unit ${item.house_id}`}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                            isBpr
                              ? 'bg-slate-300 text-slate-700'
                              : isLunas
                              ? 'bg-emerald-600 text-white'
                              : isWaiting
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isBpr
                            ? 'NON-AKTIF (BPR)'
                            : isLunas
                            ? '✓ LUNAS'
                            : isWaiting
                            ? '⏳ VALIDASI'
                            : 'BELUM LUNAS'}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/70 text-[11px] text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Tagihan Buku {item.periode_bulan}:</span>
                          <span className="font-bold text-slate-900">{formatRp(item.tarif_ipl)}</span>
                        </div>
                        {item.tanggal_bayar && item.tanggal_bayar !== '-' && (
                          <div className="flex justify-between">
                            <span>Tanggal Bayar Riil:</span>
                            <span className="font-semibold text-teal-800">
                              {String(item.tanggal_bayar).slice(0, 10)}
                            </span>
                          </div>
                        )}
                        {item.catatan && (
                          <p className="text-[10px] text-slate-500 italic">{item.catatan}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between gap-2">
                      {hasValidDriveProof(item.url_bukti) ? (
                        <a
                          href={item.url_bukti}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
                        >
                          📎 Lihat Bukti Drive
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {isBpr ? 'Bebas Tagihan IPL' : 'Belum ada lampiran'}
                        </span>
                      )}

                      {!isBpr && !isLunas && (
                        <button
                          type="button"
                          onClick={() => onOpenQris && onOpenQris(houseMaster || item)}
                          className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-[11px] shadow-sm transition"
                        >
                          📲 Bayar QRIS
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: BUKU KAS / MUTASI KAS (FILTER BULAN BUKU + BUKTI DRIVE)
           ===================================================================== */}
        {currentTab === 'ledger' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  📑 Buku Kas & Bukti Transaksi (Terbaru di Atas)
                </h3>
                <p className="text-xs text-slate-500">
                  Seluruh pemasukan IPL, kontribusi Parkir Fasum, dan pengeluaran operasional beserta foto struk Google Drive.
                </p>
              </div>
            </div>

            {/* Kotak Ringkasan Terfilter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Kas Masuk (IN)</p>
                <p className="text-sm sm:text-base font-extrabold text-emerald-700">
                  +{formatRp(filteredLedgerSummary.totalIn)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Kas Keluar (OUT)</p>
                <p className="text-sm sm:text-base font-extrabold text-rose-600">
                  -{formatRp(filteredLedgerSummary.totalOut)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Kontribusi Parkir Fasum</p>
                <p className="text-sm sm:text-base font-extrabold text-teal-700">
                  {formatRp(filteredLedgerSummary.totalParkir)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Jumlah Transaksi</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900">
                  {filteredLedger.length} Baris Data
                </p>
              </div>
            </div>

            {/* Filter Bulan Buku, Tipe, & Pencarian */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ledgerMonthFilter}
                onChange={(e) => setLedgerMonthFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
              >
                <option value="ALL">Semua Periode Buku</option>
                {MONTH_LIST_ID.map((m) => (
                  <option key={m} value={m}>
                    Buku {m}
                  </option>
                ))}
              </select>

              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
              >
                <option value="ALL">Semua Tipe (IN & OUT)</option>
                <option value="IN">Kas Masuk (IN)</option>
                <option value="OUT">Kas Keluar (OUT)</option>
              </select>

              <input
                type="text"
                placeholder="Cari keterangan / kategori (Contoh: Parkir, Listrik, Gaji, Las)..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Daftar Transaksi */}
            <div className="space-y-2.5">
              {filteredLedger.map((tx) => {
                const isIn = String(tx.tipe).toUpperCase() === 'IN';
                const isParkir = String(tx.kategori || '').toLowerCase().includes('parkir');
                const isProyek = tx.is_proyek === true || String(tx.is_proyek).toUpperCase() === 'TRUE';

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-white flex flex-wrap items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isIn ? 'KAS MASUK' : 'KAS KELUAR'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isParkir
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tx.kategori}
                        </span>
                        <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                          Buku {tx.periode_bulan} {tx.periode_tahun}
                        </span>
                        {isProyek && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                            🔨 Proyek: {tx.nama_proyek || 'Perbaikan'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{tx.keterangan}</p>
                      <p className="text-[11px] text-slate-400">
                        Tanggal Transaksi Riil: {String(tx.tanggal).slice(0, 10)} • ID: {tx.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {hasValidDriveProof(tx.url_bukti) && (
                        <a
                          href={tx.url_bukti}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition"
                        >
                          📎 Lihat Bukti
                        </a>
                      )}
                      <p
                        className={`text-sm sm:text-base font-black ${
                          isIn ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isIn ? '+' : '-'}
                        {formatRp(tx.nominal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: PARKIR FASUM (UX 2: DENAH HORIZONTAL 1-6 SESUAI GAMBAR 2)
           ===================================================================== */}
        {currentTab === 'parking' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    Interactive Parking Map V5.0
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                    🅿️ Denah Visual Parkir Fasum Cluster Mutiara Residence (Horizontal)
                  </h3>
                  <p className="text-xs text-slate-500">
                    <strong>Klik langsung pada Kotak Nomor 1 s/d {parkingConfig.total_slots || 6}</strong> di bawah ini untuk melapor parkir (*Check-In*), mengosongkan slot (*Mobil Keluar*), atau mengunggah bukti bayar parkir.
                  </p>
                </div>

                {/* Legenda Warna Slot */}
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🟢 Member ({formatRp(parkingConfig.fee_monthly)}/bln)
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 border border-sky-300">
                    🔵 Weekend ({formatRp(parkingConfig.fee_weekend)}/bln)
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                    🟡 Tamu / Siang
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-300">
                    ⚪ Kosong
                  </span>
                </div>
              </div>

              {/* DENAH HORIZONTAL SESUAI GAMBAR 2: KIRI 4 KOTAK VERTIKAL (1, 2, 3, 4) + KANAN 2 KOTAK HORIZONTAL BERSUSUN (5 ATAS, 6 BAWAH) */}
              <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border-4 border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  <span>⬅ Arah Gerbang Utama Cluster</span>
                  <span>Area Kantong Parkir Fasum ({occupiedSlotsCount}/{parkingConfig.total_slots || 6} Terisi)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* SISI KIRI: 4 KOTAK TEGAK BERJAJAR (SLOT 1, 2, 3, 4) — 8 Kolom */}
                  <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {normalizedSlots.slice(0, 4).map((slot) => {
                      const st = getSlotVisualStyle(slot);
                      const isOccupied = String(slot.status_slot).toUpperCase() !== 'KOSONG';
                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          onClick={() => handleOpenSlotModal(slot)}
                          className={`min-h-[175px] rounded-2xl border-2 p-3.5 flex flex-col justify-between text-left transition transform hover:-translate-y-0.5 active:scale-95 ${st.bg}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-base flex items-center justify-center shadow">
                              {slot.slot_number}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${st.badge}`}>
                              {st.label}
                            </span>
                          </div>

                          {isOccupied ? (
                            <div className="my-2 space-y-0.5">
                              <p className="text-xs font-black tracking-wide uppercase">
                                🚗 {slot.plat_nomor !== '-' ? slot.plat_nomor : slot.house_id}
                              </p>
                              <p className="text-[11px] font-bold truncate">{slot.nama_pemilik}</p>
                              <p className="text-[10px] opacity-80 truncate">
                                {slot.keterangan_kendaraan}
                              </p>
                            </div>
                          ) : (
                            <div className="my-4 text-center w-full">
                              <p className="text-2xl opacity-40">🅿️</p>
                              <p className="text-[11px] font-bold mt-1">Slot #{slot.slot_number} Kosong</p>
                            </div>
                          )}

                          <div className="w-full pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-bold">
                            <span>{isOccupied ? slot.status_bayar_parkir : 'Klik untuk isi'}</span>
                            <span>✎ Kelola →</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* SISI KANAN: 2 KOTAK MENDATAR BERSUSUN ATAS-BAWAH (SLOT 5 DI ATAS & SLOT 6 DI BAWAH) — 4 Kolom */}
                  <div className="md:col-span-4 flex flex-col justify-between gap-3">
                    {normalizedSlots.slice(4, 6).map((slot) => {
                      const st = getSlotVisualStyle(slot);
                      const isOccupied = String(slot.status_slot).toUpperCase() !== 'KOSONG';
                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          onClick={() => handleOpenSlotModal(slot)}
                          className={`min-h-[82px] flex-1 rounded-2xl border-2 p-3.5 flex flex-col justify-between text-left transition transform hover:-translate-y-0.5 active:scale-95 ${st.bg}`}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow">
                                {slot.slot_number}
                              </span>
                              <div>
                                <p className="text-xs font-black">
                                  {isOccupied
                                    ? `🚗 ${slot.plat_nomor !== '-' ? slot.plat_nomor : slot.house_id} (${slot.nama_pemilik})`
                                    : `Slot #${slot.slot_number} Kosong`}
                                </p>
                                <p className="text-[10px] opacity-80">
                                  {isOccupied
                                    ? `${slot.keterangan_kendaraan} • ${slot.status_bayar_parkir}`
                                    : 'Posisi Kanan Horizontal • Klik untuk Lapor Parkir'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${st.badge}`}>
                              {st.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jika Pengurus Menambah Kuota Slot Menjadi 7 atau 8 di Database */}
                {normalizedSlots.length > 6 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800">
                    {normalizedSlots.slice(6).map((slot) => {
                      const st = getSlotVisualStyle(slot);
                      const isOccupied = String(slot.status_slot).toUpperCase() !== 'KOSONG';
                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          onClick={() => handleOpenSlotModal(slot)}
                          className={`rounded-2xl border-2 p-3 flex items-center justify-between text-left ${st.bg}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                              {slot.slot_number}
                            </span>
                            <div>
                              <p className="text-xs font-extrabold">
                                {isOccupied ? `${slot.plat_nomor} - ${slot.nama_pemilik}` : `Slot Cadangan #${slot.slot_number} Kosong`}
                              </p>
                              <p className="text-[10px]">{slot.keterangan_kendaraan}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>
                            {st.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Keterangan Aturan Parkir Fleksibel dari Database */}
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-teal-950">
                <div>
                  <span className="font-extrabold">📌 Ketentuan Parkir Fasum CMR: </span>
                  <span>{parkingConfig.rules_note}</span>
                </div>
                <span className="text-[11px] font-bold text-teal-800">
                  Batas Gratis Tamu Menginap: {parkingConfig.free_guest_nights || 3} Malam/Bln
                </span>
              </div>
            </div>

            {/* REKAP FREKUENSI PARKIR MALAM OTOMATIS DARI PATROLI SECURITY */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mb-1">
                🌙 Rekap Objektif Frekuensi Parkir Menginap (Dari Patroli Malam Security)
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Dihitung otomatis setiap kali Pak Eko / Pak Mulyadi mencentang kendaraan yang menginap di fasum saat patroli malam/subuh.
              </p>

              {parkingNightStats.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  Belum ada catatan frekuensi parkir malam bulan ini. Security dapat mencentang nomor rumah pada menu <strong>🛡️ Pos & SOS → Generator Laporan Patroli</strong>.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {parkingNightStats.map((st) => {
                    const hObj = houses.find((h) => h.id === st.house_id);
                    return (
                      <div
                        key={st.house_id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-extrabold text-slate-900">
                            {hObj ? `No. ${hObj.nomor_rumah} - ${hObj.nama_kepala_keluarga}` : st.house_id}
                          </p>
                          <p className="text-[11px] text-teal-700 font-semibold">
                            {st.rekomendasi_kategori} ({formatRp(st.rekomendasi_tarif)})
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-black text-xs">
                          {st.total_malam} Malam
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: POS KEAMANAN & SOS (PANIC BUTTON + KALENDER + CEKLIS PARKIR + CCTV)
           ===================================================================== */}
        {currentTab === 'security' && (
          <div className="space-y-4">
            {/* PANIC BUTTON SOS DARURAT */}
            <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white rounded-3xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                  Emergency Response System
                </span>
                <h3 className="text-lg font-black mt-1">🚨 Panic Button SOS Warga & Pos Security</h3>
                <p className="text-xs text-rose-100">
                  Tekan dan tahan tombol selama 3 detik untuk mengirim sinyal darurat ke WhatsApp Grup & Pos Jaga.
                </p>
              </div>
              <button
                type="button"
                onMouseDown={startSosHold}
                onMouseUp={stopSosHold}
                onMouseLeave={stopSosHold}
                onTouchStart={startSosHold}
                onTouchEnd={stopSosHold}
                className="relative overflow-hidden bg-white text-rose-800 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl active:scale-95 transition select-none"
              >
                <span
                  className="absolute left-0 top-0 bottom-0 bg-rose-300/60 transition-all"
                  style={{ width: `${sosHoldProgress}%` }}
                />
                <span className="relative z-10">
                  {sosHoldProgress > 0 ? `TAHAN... ${sosHoldProgress}%` : '🔴 TAHAN 3 DETIK UNTUK SOS'}
                </span>
              </button>
            </div>

            {/* GENERATOR LAPORAN WA SECURITY + CEKLIS PARKIR MALAM V5 + FOTO BUKTI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <form
                onSubmit={handleSubmitSecurityReport}
                className="lg:col-span-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    👮 Generator Laporan WA & Log Pos Security
                  </h4>
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full border border-teal-200">
                    Tanpa Login
                  </span>
                </div>

                {secStatusMsg && (
                  <p className="text-xs bg-teal-50 border border-teal-200 text-teal-900 px-3 py-2 rounded-xl font-semibold">
                    {secStatusMsg}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Personel Jaga</label>
                    <select
                      value={secReportForm.nama_security}
                      onChange={(e) => setSecReportForm({ ...secReportForm, nama_security: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="Pak Eko">Pak Eko</option>
                      <option value="Pak Mulyadi">Pak Mulyadi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Shift Tugas</label>
                    <select
                      value={secReportForm.shift}
                      onChange={(e) => setSecReportForm({ ...secReportForm, shift: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="Pagi">Pagi (08:00 - 20:00)</option>
                      <option value="Malam">Malam (20:00 - 08:00)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Kategori Laporan</label>
                    <select
                      value={secReportForm.kategori_laporan}
                      onChange={(e) =>
                        setSecReportForm({ ...secReportForm, kategori_laporan: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="PATROLI">Patroli Keliling 5 Titik</option>
                      <option value="ABSEN_SHIFT">Absen Serah Terima Shift</option>
                      <option value="PAKET_TAMU">Titipan Paket / Tamu Warga</option>
                      <option value="TUTUP_POS_MALAM_LIBUR">Tutup Pos Malam Libur (Jumat/Sabtu)</option>
                      <option value="IZIN_ISOMA">Izin Sholat / ISOMA</option>
                      <option value="ANOMALI_INSIDEN">Anomali / Isi Galon / Perbaikan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Sub-Kegiatan</label>
                    <input
                      type="text"
                      value={secReportForm.sub_kategori}
                      onChange={(e) => setSecReportForm({ ...secReportForm, sub_kategori: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {secReportForm.kategori_laporan === 'PAKET_TAMU' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Rumah Tujuan Paket / Tamu (Otomatis Sapaan Anti-Typo)
                    </label>
                    <select
                      value={secReportForm.house_id}
                      onChange={(e) => setSecReportForm({ ...secReportForm, house_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="-">-- Pilih Nomor Rumah Warga --</option>
                      {activeHousesList.map((h) => (
                        <option key={h.id} value={h.id}>
                          No. {h.nomor_rumah} — {h.alias_keluarga || h.nama_kepala_keluarga}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* BARU V5.0: CEKLIS CEPAT KENDARAAN MENGINAP DI FASUM SAAT PATROLI */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-teal-900">
                    🅿️ Ceklis Rumah yang Mobilnya Menginap di Fasum Malam Ini (Opsional):
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {activeHousesList.map((h) => {
                      const checked = secReportForm.parked_house_ids.includes(h.id);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => handleToggleNightParkedHouse(h.id)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                            checked
                              ? 'bg-teal-800 text-white border-teal-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          No.{h.nomor_rumah}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Catatan tambahan situasi lapangan..."
                  value={secReportForm.detail_catatan}
                  onChange={(e) => setSecReportForm({ ...secReportForm, detail_catatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />

                <div className="bg-slate-50 border border-dashed border-teal-500/50 rounded-xl p-2.5">
                  <label className="block text-[11px] font-bold text-teal-800 mb-1">
                    📷 Lampirkan Foto Patroli / Paket (Drive: Log_Absensi_Security)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelectSecPhoto}
                    className="w-full text-[11px] text-slate-600"
                  />
                </div>

                <div className="bg-slate-900 text-teal-200 p-3 rounded-2xl text-[11px] font-mono whitespace-pre-line">
                  {generatedWaText}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSecLog}
                  className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-xs shadow transition"
                >
                  {isSubmittingSecLog
                    ? '⏳ Menyimpan...'
                    : '📋 Salin Teks WA & Simpan ke Database Security'}
                </button>
              </form>

              {/* KALENDER ROTASI MINGGUAN PAK EKO & PAK MULYADI (6 Kolom Desktop) */}
              <div className="lg:col-span-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    📅 Kalender Jaga & Rotasi Mingguan Security (Klik Tanggal untuk Tukar Shift)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Jumat & Sabtu Malam Security Libur (Gerbang Mandiri 20.00 WIB) • Sabtu Pagi Tukar Shift.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
                  {securitySchedules.map((sch) => {
                    const isLiburMalam = String(sch.shift_malam).includes('LIBUR');
                    return (
                      <div
                        key={sch.id}
                        onClick={() => {
                          setSelectedScheduleDate(sch);
                          setScheduleEditForm({
                            shift_pagi: sch.shift_pagi,
                            shift_malam: sch.shift_malam,
                            status_jadwal: sch.status_jadwal,
                            catatan_jadwal: sch.catatan_jadwal
                          });
                        }}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition text-xs ${
                          isLiburMalam
                            ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
                            : 'bg-slate-50 border-slate-200 hover:border-teal-400'
                        }`}
                      >
                        <div className="flex justify-between items-center font-extrabold text-slate-900">
                          <span>{String(sch.tanggal).slice(8, 10)} Nov</span>
                          <span className="text-[10px] text-teal-800">{sch.hari}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-1">☀️ Pagi: <strong>{sch.shift_pagi}</strong></p>
                        <p className="text-[11px] text-slate-700">🌙 Malam: <strong>{sch.shift_malam}</strong></p>
                      </div>
                    );
                  })}
                </div>

                {selectedScheduleDate && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-amber-300">
                        Ubah Jadwal {selectedScheduleDate.hari}, {selectedScheduleDate.tanggal}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleDate(null)}
                        className="text-slate-400 hover:text-white font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={scheduleEditForm.shift_pagi}
                        onChange={(e) =>
                          setScheduleEditForm({ ...scheduleEditForm, shift_pagi: e.target.value })
                        }
                        className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        placeholder="Petugas Pagi"
                      />
                      <input
                        type="text"
                        value={scheduleEditForm.shift_malam}
                        onChange={(e) =>
                          setScheduleEditForm({ ...scheduleEditForm, shift_malam: e.target.value })
                        }
                        className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        placeholder="Petugas Malam"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (onUpdateSecuritySchedule) {
                          await onUpdateSecuritySchedule({
                            tanggal: selectedScheduleDate.tanggal,
                            ...scheduleEditForm
                          });
                        }
                        setSelectedScheduleDate(null);
                      }}
                      className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs"
                    >
                      Simpan Perubahan Jadwal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PANTAUAN 4 TITIK CCTV LINGKUNGAN */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mb-3">
                📹 Status Pantauan 4 Titik CCTV Lingkungan CMR
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CCTV_CHANNELS.map((cam) => (
                  <div
                    key={cam.id}
                    className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-amber-300">{cam.id}</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        {cam.status}
                      </span>
                    </div>
                    <div className="my-3">
                      <p className="font-extrabold text-xs">{cam.nama}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cam.lokasi}</p>
                    </div>
                    <span className="text-[10px] text-teal-300 font-mono">REC • 24/7 Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIWAYAT LOG AKTIVITAS & ANOMALI SECURITY (DENGAN TOMBOL SALIN ULANG WA & LIHAT BUKTI) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                📜 Riwayat Log Patroli, Paket Warga & Anomali Lapangan ({securityLogs.length} Log)
              </h4>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {securityLogs.map((log) => {
                  const photoMatch = String(log.detail_catatan || '').match(/\[Foto Bukti:\s*(https?:\/\/[^\]]+)\]/i);
                  const photoUrl = photoMatch ? photoMatch[1] : '';

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full text-[10px]">
                            {log.tanggal} • {log.jam} WIB
                          </span>
                          <span className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                            {log.nama_security} (Shift {log.shift})
                          </span>
                          <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                            {log.sub_kategori || log.kategori_laporan}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">{log.detail_catatan}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {photoUrl && (
                          <a
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]"
                          >
                            📎 Foto Bukti
                          </a>
                        )}
                        {log.teks_wa && log.teks_wa !== '-' && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard && navigator.clipboard.writeText(log.teks_wa)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px]"
                          >
                            📋 Salin Ulang WA
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* POP-UP MODAL SAAT KOTAK SLOT PARKIR 1-6 DIKLIK */}
      {selectedSlotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedSlotModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-teal-900 text-amber-300 font-black text-lg flex items-center justify-center">
                  #{selectedSlotModal.slot_number}
                </span>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    Kelola Slot Parkir Fasum #{selectedSlotModal.slot_number}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Status Saat Ini: <strong>{selectedSlotModal.status_slot}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlotCheckIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Pilih Kategori Parkir (Sesuai Aturan Fleksibel CMR)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'MEMBER_BULANAN', label: `🟢 Member (${formatRp(parkingConfig.fee_monthly)}/bln)` },
                    { key: 'PAKET_WEEKEND', label: `🔵 Weekend (${formatRp(parkingConfig.fee_weekend)}/bln)` },
                    { key: 'TAMU_MENGINAP', label: `🟡 Tamu Gratis (≤${parkingConfig.free_guest_nights} mlm)` },
                    { key: 'PARKIR_SIANG', label: '⚪ Parkir Siang (Gratis)' },
                    { key: 'HARIAN_LEBIH_3_MALAM', label: `🟠 Harian (${formatRp(parkingConfig.fee_daily)}/mlm)` }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectParkingCategoryInModal(opt.key)}
                      className={`p-2 rounded-xl font-bold border text-left transition ${
                        slotForm.kategori_parkir === opt.key
                          ? 'bg-teal-800 text-white border-teal-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Pilih Nomor Rumah Warga / Penanggung Jawab Tamu
                </label>
                <select
                  value={slotForm.house_id}
                  onChange={(e) => {
                    const hObj = activeHousesList.find((h) => h.id === e.target.value);
                    setSlotForm({
                      ...slotForm,
                      house_id: e.target.value,
                      nama_pemilik: hObj
                        ? `No. ${hObj.nomor_rumah} - ${hObj.nama_kepala_keluarga}`
                        : e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  {activeHousesList.map((h) => (
                    <option key={h.id} value={h.id}>
                      No. {h.nomor_rumah} — {h.nama_kepala_keluarga}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plat Nomor Mobil</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 1234 CMR"
                    value={slotForm.plat_nomor}
                    onChange={(e) => setSlotForm({ ...slotForm, plat_nomor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis / Warna Mobil</label>
                  <input
                    type="text"
                    placeholder="Contoh: Avanza Hitam"
                    value={slotForm.keterangan_kendaraan}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, keterangan_kendaraan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {slotForm.nominal_parkir > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 space-y-2">
                  <div className="flex justify-between font-extrabold text-teal-950">
                    <span>Kontribusi Kas Parkir:</span>
                    <span>{formatRp(slotForm.nominal_parkir)}</span>
                  </div>
                  <label className="block text-[11px] font-bold text-teal-800">
                    📷 Upload Bukti Transfer Parkir (Opsional / Drive Bukti_Iuran_Warga):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelectSlotProofPhoto}
                    className="w-full text-[11px]"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingSlot}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-xs shadow transition"
                >
                  {isSavingSlot ? '⏳ Menyimpan...' : `🚗 Simpan / Check-In Slot #${selectedSlotModal.slot_number}`}
                </button>

                {String(selectedSlotModal.status_slot).toUpperCase() !== 'KOSONG' && (
                  <button
                    type="button"
                    disabled={isSavingSlot}
                    onClick={handleClearSlot}
                    className="py-2.5 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs transition"
                  >
                    🔓 Kosongkan Slot
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}