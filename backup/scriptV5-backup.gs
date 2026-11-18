/**
 * C-MONEY BACKEND REST API v5.0 (GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan, Keamanan & Parkir Fasum Cluster Mutiara Residence (CMR)
 *
 * Fitur Terkunci (V2 + V3 + V4.2 + V5.0):
 * - Auto-Sync Saldo Kas Aktif & Pemisahan Saldo Bulan Berjalan vs Titipan Bulan Depan (Cut-Off Tgl 25)
 * - Auto-Upload Foto Evidence ke 4 Subfolder Drive (03_Assets_Uploads)
 * - Auto-Jurnal Validasi IPL & Paket Parkir ke cash_ledger (Anti-Duplikat)
 * - Denah Parkir Fasum Horizontal (Slot 1-6 / fleksibel s/d 8) + Aturan Tarif Fleksibel di app_settings
 * - Rekap Frekuensi Parkir Malam Otomatis dari Log Patroli Security
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const TABLES = {
  AUTH: 'auth_pengurus',
  HOUSES: 'houses',
  LEDGER: 'cash_ledger',
  IPL: 'ipl_status',
  PAYROLL: 'security_payroll',
  SETTINGS: 'app_settings',
  CLOSINGS: 'monthly_closings',
  WA_LOGS: 'wa_notification_logs',
  SEC_SCHEDULES: 'security_schedules',
  SEC_LOGS: 'security_logs',
  PARKING: 'parking_slots'
};

const DRIVE_UPLOADS_PARENT = '03_Assets_Uploads';
const DRIVE_FOLDERS = {
  STRUK_KAS: 'Struk_Pengeluaran_Kas',
  BUKTI_IPL: 'Bukti_Iuran_Warga',
  LOG_SECURITY: 'Log_Absensi_Security',
  ASET_SISTEM: 'Aset_Sistem'
};

// ID Folder Asli dari Google Drive CMR Anda (Terkunci Akurat + Fallback Otomatis)
const DRIVE_FOLDER_IDS = {
  Struk_Pengeluaran_Kas: '1s0hqj3DqYIwHxKt4fIP0lG52iAKW-HMl',
  Bukti_Iuran_Warga: '1_Fkb9p1zvX0mnL3Jaa4GuyZUkZ_aGi8D',
  Log_Absensi_Security: '15dGynlB2l6gWE0dcs77dtlx_m0FpKc4x',
  Aset_Sistem: '1YdOvc8mouVaKKqwl8uVuMx3vCLYUhung'
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_ORDER = {
  Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
  Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12
};

/**
 * ============================================================================
 * JALANKAN FUNGSI "setupV5DanTesDrive" INI SEKALI DI EDITOR APPS SCRIPT (KLIK RUN)
 * Otomatis menyiapkan tabel parking_slots, setting fleksibel V5, & sinkronisasi saldo
 * ============================================================================
 */
function setupV5DanTesDrive() {
  ensureV5ParkingTablesAndSettings_();
  const syncedBalance = syncAccurateCurrentBalance_('November', 2026);
  Logger.log('✅ Setup V5 Selesai! Saldo Kas Aktif Tersinkron: Rp ' + formatRupiah_(syncedBalance));
}

function perbaikiSaldoDanTesDrive() {
  setupV5DanTesDrive();
}

/**
 * HELPER V5: PASTIKAN SHEET parking_slots & SETTING PARKIR/CUT-OFF TERSEDIA DI SPREADSHEET
 */
function ensureV5ParkingTablesAndSettings_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. Pastikan parameter fleksibel V5 ada di app_settings
  const defaultV5Settings = [
    ['cutoff_day_ipl', '25', 'Tanggal mulai cut-off buku IPL bulan berikutnya (default tgl 25)'],
    ['parking_total_slots', '6', 'Jumlah total kotak slot parkir fasum aktif (fleksibel 6-8 slot)'],
    ['parking_fee_monthly', '100000', 'Tarif parkir fasum Member Rutin Bulanan (Rp)'],
    ['parking_fee_weekend', '50000', 'Tarif parkir fasum Paket Weekend / Sabtu-Minggu (Rp)'],
    ['parking_fee_daily', '10000', 'Tarif parkir fasum Harian / Tamu lebih dari batas gratis (Rp/malam)'],
    ['parking_free_guest_nights', '3', 'Batas gratis parkir menginap tamu warga per bulan (malam)'],
    ['parking_rules_note', 'Parkir Siang Gratis • Tamu Menginap Gratis maks 3 malam/bln • Member Bulanan Rp100.000 • Paket Weekend Rp50.000', 'Catatan aturan parkir fasum']
  ];

  const settingsSheet = ss.getSheetByName(TABLES.SETTINGS);
  if (settingsSheet) {
    const data = settingsSheet.getDataRange().getValues();
    const existingKeys = data.slice(1).map(r => String(r[0]));
    const nowIso = new Date().toISOString();

    defaultV5Settings.forEach(item => {
      if (existingKeys.indexOf(item[0]) === -1) {
        settingsSheet.appendRow([item[0], item[1], item[2], nowIso]);
      }
    });
  }

  // 2. Pastikan sheet parking_slots tersedia dengan 6 slot default (Denah Horizontal 1-4 Kiri, 5-6 Kanan)
  let parkingSheet = ss.getSheetByName(TABLES.PARKING);
  if (!parkingSheet) {
    parkingSheet = ss.insertSheet(TABLES.PARKING);
    const headers = [
      'slot_id',
      'slot_number',
      'posisi_layout',
      'status_slot',
      'kategori_parkir',
      'house_id',
      'nama_pemilik',
      'plat_nomor',
      'keterangan_kendaraan',
      'waktu_masuk',
      'periode_bulan',
      'periode_tahun',
      'status_bayar_parkir',
      'nominal_parkir',
      'url_bukti_parkir',
      'updated_by',
      'updated_at'
    ];
    parkingSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const nowIso = new Date().toISOString();
    const initialSlots = [
      ['SLOT-01', 1, 'KIRI_VERTIKAL_1', 'KOSONG', '-', '-', '-', '-', 'Slot Parkir Fasum #1', '-', 'November', 2026, '-', 0, '-', 'SYSTEM', nowIso],
      ['SLOT-02', 2, 'KIRI_VERTIKAL_2', 'KOSONG', '-', '-', '-', '-', 'Slot Parkir Fasum #2', '-', 'November', 2026, '-', 0, '-', 'SYSTEM', nowIso],
      ['SLOT-03', 3, 'KIRI_VERTIKAL_3', 'KOSONG', '-', '-', '-', '-', 'Slot Parkir Fasum #3', '-', 'November', 2026, '-', 0, '-', 'SYSTEM', nowIso],
      ['SLOT-04', 4, 'KIRI_VERTIKAL_4', 'KOSONG', '-', '-', '-', '-', 'Slot Parkir Fasum #4', '-', 'November', 2026, '-', 0, '-', 'SYSTEM', nowIso],
      ['SLOT-05', 5, 'KANAN_ATAS_5', 'KOSONG', '-', '-', '-', '-', 'Slot Parkir Fasum #5 (Kanan Atas)', '-', 'November', 2026, '-', 0, '-', 'SYSTEM', nowIso],
      ['SLOT-06', 6, 'KANAN_BAWAH_6', 'KOSONG', '-', '-', '-', '-', 'Slot Parkir Fasum #6 (Kanan Bawah)', '-', 'November', 2026, '-', 0, '-', 'SYSTEM', nowIso]
    ];
    parkingSheet.getRange(2, 1, initialSlots.length, headers.length).setValues(initialSlots);
  }
}

/**
 * HELPER V5: LOGIKA CUT-OFF TANGGAL 25 (SMART BOOK PERIOD)
 */
function getSmartPeriodInfo_(cutoffDayInput) {
  const cutoffDay = Number(cutoffDayInput || 25);
  const now = new Date();
  const day = Number(Utilities.formatDate(now, 'Asia/Jakarta', 'd'));
  const monthIdx = Number(Utilities.formatDate(now, 'Asia/Jakarta', 'M')) - 1; // 0..11
  const year = Number(Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy'));

  const currentCalendarMonth = MONTH_NAMES[monthIdx];
  const currentCalendarYear = year;

  let nextMonthIdx = monthIdx + 1;
  let nextYear = year;
  if (nextMonthIdx > 11) {
    nextMonthIdx = 0;
    nextYear += 1;
  }
  const nextCalendarMonth = MONTH_NAMES[nextMonthIdx];

  const isAfterCutoff = day >= cutoffDay;
  return {
    cutoff_day: cutoffDay,
    current_day: day,
    is_after_cutoff: isAfterCutoff,
    calendar_bulan: currentCalendarMonth,
    calendar_tahun: currentCalendarYear,
    default_ipl_bulan: isAfterCutoff ? nextCalendarMonth : currentCalendarMonth,
    default_ipl_tahun: isAfterCutoff ? nextYear : currentCalendarYear,
    next_bulan: nextCalendarMonth,
    next_tahun: nextYear
  };
}

function getNextPeriod_(periodeBulan, periodeTahun) {
  const idx = MONTH_NAMES.indexOf(String(periodeBulan));
  const yr = Number(periodeTahun || 2026);
  if (idx === -1) return { bulan: 'Desember', tahun: yr };
  if (idx === 11) return { bulan: 'Januari', tahun: yr + 1 };
  return { bulan: MONTH_NAMES[idx + 1], tahun: yr };
}

/**
 * HELPER: SINKRONISASI SALDO KAS AKTIF + RINCIAN SALDO PISAH PERIODE (V5)
 */
function syncAccurateCurrentBalance_(periodeBulan, periodeTahun) {
  const targetBulan = periodeBulan || 'November';
  const targetTahun = Number(periodeTahun || 2026);

  const closings = getTableData_(TABLES.CLOSINGS);
  const ledger = getTableData_(TABLES.LEDGER);

  let baseBalance = 1394200;
  const currentClosing = closings.find(
    r => String(r.periode_bulan) === String(targetBulan) && Number(r.periode_tahun) === targetTahun
  );
  const octClosing = closings.find(
    r => String(r.periode_bulan) === 'Oktober' && Number(r.periode_tahun) === targetTahun
  );

  if (currentClosing && parseNominal_(currentClosing.saldo_awal) > 0) {
    baseBalance = parseNominal_(currentClosing.saldo_awal);
  } else if (octClosing && parseNominal_(octClosing.sisa_saldo) > 0) {
    baseBalance = parseNominal_(octClosing.sisa_saldo);
  }

  // Hitung mutasi pada periode buku aktif + titipan periode bulan berikutnya (jika sudah ada yang bayar tgl 25-31)
  const nextPeriod = getNextPeriod_(targetBulan, targetTahun);
  let totalInCurrent = 0;
  let totalOutCurrent = 0;
  let titipanNextMonthIn = 0;
  let totalParkirInCurrent = 0;

  ledger.forEach(tx => {
    const txBulan = String(tx.periode_bulan || '');
    const txTahun = Number(tx.periode_tahun || 2026);
    const nom = parseNominal_(tx.nominal);
    const isIn = String(tx.tipe).toUpperCase() === 'IN';
    const kat = String(tx.kategori || '').toLowerCase();

    if (txBulan === String(targetBulan) && txTahun === targetTahun) {
      if (isIn) {
        totalInCurrent += nom;
        if (kat.indexOf('parkir') !== -1) {
          totalParkirInCurrent += nom;
        }
      } else {
        totalOutCurrent += nom;
      }
    } else if (txBulan === String(nextPeriod.bulan) && txTahun === Number(nextPeriod.tahun)) {
      if (isIn) {
        titipanNextMonthIn += nom;
      }
    }
  });

  const accurateBalance = baseBalance + totalInCurrent - totalOutCurrent;
  const settings = getSettingsMap_();
  if (parseNominal_(settings.current_balance) !== accurateBalance) {
    updateSettingValue_('current_balance', String(accurateBalance));
  }

  return accurateBalance;
}

function getBalanceBreakdown_(periodeBulan, periodeTahun, accurateBalance) {
  const targetBulan = periodeBulan || 'November';
  const targetTahun = Number(periodeTahun || 2026);
  const nextPeriod = getNextPeriod_(targetBulan, targetTahun);
  const ledger = getTableData_(TABLES.LEDGER);

  let pemasukanBulanIni = 0;
  let pengeluaranBulanIni = 0;
  let pemasukanParkirBulanIni = 0;
  let titipanBulanDepan = 0;

  ledger.forEach(tx => {
    const txBulan = String(tx.periode_bulan || '');
    const txTahun = Number(tx.periode_tahun || 2026);
    const nom = parseNominal_(tx.nominal);
    const isIn = String(tx.tipe).toUpperCase() === 'IN';
    const kat = String(tx.kategori || '').toLowerCase();

    if (txBulan === String(targetBulan) && txTahun === targetTahun) {
      if (isIn) {
        pemasukanBulanIni += nom;
        if (kat.indexOf('parkir') !== -1) {
          pemasukanParkirBulanIni += nom;
        }
      } else {
        pengeluaranBulanIni += nom;
      }
    } else if (txBulan === String(nextPeriod.bulan) && txTahun === Number(nextPeriod.tahun) && isIn) {
      titipanBulanDepan += nom;
    }
  });

  return {
    periode_bulan: targetBulan,
    periode_tahun: targetTahun,
    saldo_buku_berjalan: accurateBalance,
    pemasukan_bulan_ini: pemasukanBulanIni,
    pengeluaran_bulan_ini: pengeluaranBulanIni,
    pemasukan_parkir_bulan_ini: pemasukanParkirBulanIni,
    next_periode_bulan: nextPeriod.bulan,
    next_periode_tahun: nextPeriod.tahun,
    titipan_ipl_bulan_depan: titipanBulanDepan,
    saldo_fisik_termasuk_titipan: accurateBalance + titipanBulanDepan
  };
}

/**
 * HELPER V5: PASTIKAN 22 BARIS RUMAH TERSEDIA UNTUK PERIODE BULAN YANG DIPILIH
 */
function getOrEnsureIplRowsForPeriod_(periodeBulan, periodeTahun, houses, defaultIplAmount) {
  const allIpl = getTableData_(TABLES.IPL);
  const filtered = allIpl.filter(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );

  if (filtered.length > 0) {
    return filtered.sort((a, b) => String(a.house_id).localeCompare(String(b.house_id)));
  }

  // Jika bulan baru (misal Desember) belum ada di sheet ipl_status, siapkan daftar virtual / inisialisasi otomatis
  return houses.map(h => {
    const isNonActive = String(h.status_huni || '').toLowerCase().indexOf('tidak aktif') !== -1 || String(h.id) === 'H-04';
    return {
      id: 'IPL-' + periodeBulan.slice(0, 3).toUpperCase() + periodeTahun + '-' + h.id,
      house_id: h.id,
      nomor_rumah: h.nomor_rumah,
      nama_kepala_keluarga: h.nama_kepala_keluarga,
      periode_bulan: periodeBulan,
      periode_tahun: Number(periodeTahun),
      tarif_ipl: isNonActive ? 0 : Number(h.tarif_ipl || defaultIplAmount || 200000),
      status_bayar: isNonActive ? 'Non-Aktif (BPR)' : 'Belum Lunas',
      tanggal_bayar: '-',
      url_bukti: '-',
      catatan: isNonActive ? 'Unit Dijual oleh Pihak BPR (Bebas Tagihan)' : '',
      updated_at: new Date().toISOString()
    };
  });
}

/**
 * HELPER V5: REKAP FREKUENSI PARKIR MALAM PER RUMAH DARI LOG PATROLI SECURITY
 */
function computeParkingNightStats_(securityLogs, periodeBulan, periodeTahun, parkingConfig) {
  const countsByHouse = {};
  const logsList = Array.isArray(securityLogs) ? securityLogs : [];

  logsList.forEach(log => {
    const catatan = String(log.detail_catatan || '');
    const teksWa = String(log.teks_wa || '');
    const combined = catatan + ' ' + teksWa;

    // Deteksi tag [Parkir Malam: H-01, H-05] atau daftar rumah di log patroli malam/subuh
    const matchTag = combined.match(/\[Parkir Malam:\s*([^\]]+)\]/i);
    if (matchTag && matchTag[1]) {
      const ids = matchTag[1].split(',').map(s => s.trim()).filter(Boolean);
      ids.forEach(hId => {
        countsByHouse[hId] = (countsByHouse[hId] || 0) + 1;
      });
    }
  });

  const freeGuestNights = Number(parkingConfig.free_guest_nights || 3);
  const feeWeekend = Number(parkingConfig.fee_weekend || 50000);
  const feeMonthly = Number(parkingConfig.fee_monthly || 100000);

  const summary = Object.keys(countsByHouse).map(houseId => {
    const nights = countsByHouse[houseId];
    let rekomendasiKategori = 'Tamu / Gratis (<= ' + freeGuestNights + ' mlm)';
    let rekomendasiTarif = 0;
    if (nights > 8) {
      rekomendasiKategori = 'Member Bulanan';
      rekomendasiTarif = feeMonthly;
    } else if (nights > freeGuestNights) {
      rekomendasiKategori = 'Paket Weekend';
      rekomendasiTarif = feeWeekend;
    }
    return {
      house_id: houseId,
      total_malam: nights,
      rekomendasi_kategori: rekomendasiKategori,
      rekomendasi_tarif: rekomendasiTarif
    };
  });

  return summary;
}

/**
 * HTTP GET: Endpoint Publik Warga & Security (Tanpa Login)
 */
function doGet(e) {
  try {
    ensureV5ParkingTablesAndSettings_();

    const settings = getSettingsMap_();
    const smartPeriod = getSmartPeriodInfo_(settings.cutoff_day_ipl || 25);

    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const accurateBalance = syncAccurateCurrentBalance_(periodeBulan, periodeTahun);
      const balanceBreakdown = getBalanceBreakdown_(periodeBulan, periodeTahun, accurateBalance);
      const defaultIplAmount = parseNominal_(settings.default_ipl_amount || 200000);

      const houses = getTableData_(TABLES.HOUSES).sort((a, b) =>
        String(a.id).localeCompare(String(b.id))
      );

      const ledger = sortNewestFirst_(getTableData_(TABLES.LEDGER));

      const ipl = getOrEnsureIplRowsForPeriod_(periodeBulan, periodeTahun, houses, defaultIplAmount);
      const allIplRaw = getTableData_(TABLES.IPL);

      const closings = sortNewestFirst_(getTableData_(TABLES.CLOSINGS));
      const payroll = sortNewestFirst_(getTableData_(TABLES.PAYROLL));

      const securitySchedules = getTableData_(TABLES.SEC_SCHEDULES).sort((a, b) =>
        String(a.tanggal).localeCompare(String(b.tanggal))
      );

      const securityLogs = sortSecurityLogsNewestFirst_(getTableData_(TABLES.SEC_LOGS));

      const parkingConfig = {
        total_slots: Number(settings.parking_total_slots || 6),
        fee_monthly: parseNominal_(settings.parking_fee_monthly || 100000),
        fee_weekend: parseNominal_(settings.parking_fee_weekend || 50000),
        fee_daily: parseNominal_(settings.parking_fee_daily || 10000),
        free_guest_nights: Number(settings.parking_free_guest_nights || 3),
        cutoff_day_ipl: Number(settings.cutoff_day_ipl || 25),
        rules_note: settings.parking_rules_note || 'Parkir Siang Gratis • Tamu Menginap Gratis maks 3 malam/bln • Member Bulanan Rp100.000 • Paket Weekend Rp50.000'
      };

      const parkingSlots = getTableData_(TABLES.PARKING)
        .sort((a, b) => Number(a.slot_number || 0) - Number(b.slot_number || 0));

      const parkingNightStats = computeParkingNightStats_(
        securityLogs,
        periodeBulan,
        periodeTahun,
        parkingConfig
      );

      return jsonResponse_({
        status: 'success',
        backend_version: 'v5.0',
        server_time_iso: new Date().toISOString(),
        app_name: settings.app_name || 'C-Money',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        logo_url: settings.logo_url || '/assets/logo-cmoney.png',
        current_balance: accurateBalance,
        balance_breakdown: balanceBreakdown,
        smart_period: smartPeriod,
        default_ipl_amount: defaultIplAmount,
        total_houses: Number(settings.total_houses || 22),
        total_active_houses: Number(settings.total_active_houses || 21),
        qris_merchant_name: settings.qris_merchant_name || 'Cluster Mutiara Residence',
        qris_nmid: settings.qris_nmid || 'ID1026000000CMR',
        qris_image_url: settings.qris_image_url || '/assets/qris-cmr-statis.png',
        security_config: {
          active_1: settings.security_active_1 || 'Pak Eko',
          active_2: settings.security_active_2 || 'Pak Mulyadi',
          shift_pagi_jam: settings.security_shift_pagi_jam || '08:00 - 20:00 WIB',
          shift_malam_jam: settings.security_shift_malam_jam || '20:00 - 08:00 WIB',
          libur_malam_hari: settings.security_libur_malam_hari || 'Jumat,Sabtu',
          galon_count_bulan_ini: Number(settings.security_galon_count_bulan_ini || 0),
          anchor_sunday_date: settings.security_anchor_sunday_date || '2026-11-01'
        },
        parking_config: parkingConfig,
        parking_slots: parkingSlots,
        parking_night_stats: parkingNightStats,
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: ipl,
        ipl_all_periods: allIplRaw,
        cash_ledger: ledger,
        monthly_closings: closings,
        security_payroll: payroll,
        security_schedules: securitySchedules,
        security_logs: securityLogs
      });
    }

    if (action === 'PreviewWaClosing') {
      const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
      return jsonResponse_({ status: 'success', data: report });
    }

    return jsonResponse_({ status: 'error', message: 'Action GET tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * HTTP POST: Endpoint Aksi Security/Warga (Tanpa Login) & Pengurus (Dengan Token)
 */
function doPost(e) {
  try {
    ensureV5ParkingTablesAndSettings_();

    const rawContents = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(rawContents);
    const action = body.action;

    // 1. Endpoint Login Pengurus
    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    // 2. Endpoint Publik / Mandiri Warga & Security (Tanpa Login Token)
    if (action === 'input_security_log') {
      return handleInputSecurityLog_(body);
    }
    if (action === 'update_security_schedule') {
      return handleUpdateSecuritySchedule_(body);
    }
    if (action === 'upload_ipl_proof') {
      return handlePublicUploadIplProof_(body);
    }
    if (action === 'update_parking_slot') {
      return handleUpdateParkingSlot_(body);
    }

    // 3. Endpoint Khusus Pengurus (Wajib Token Sesi)
    if (!verifyPengurusToken_(body.session_token)) {
      return jsonResponse_({ status: 'unauthorized', message: 'Sesi pengurus tidak valid.' }, 401);
    }

    if (action === 'input_ledger') return handleInputLedger_(body);
    if (action === 'update_ipl') return handleUpdateIpl_(body);
    if (action === 'input_payroll') return handleInputPayroll_(body);
    if (action === 'close_month_and_send_wa') return handleCloseMonthAndSendWa_(body);
    if (action === 'update_parking_config') return handleUpdateParkingConfig_(body);

    return jsonResponse_({ status: 'error', message: 'Action POST tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * HELPER: TELUSURI ID FOLDER RESMI ATAU JALUR 01_Database -> CMR -> 03_Assets_Uploads -> [Subfolder]
 */
function getTargetDriveFolder_(subFolderName) {
  if (DRIVE_FOLDER_IDS[subFolderName]) {
    try {
      return DriveApp.getFolderById(DRIVE_FOLDER_IDS[subFolderName]);
    } catch (idErr) {
      // Lanjut ke penelusuran struktur folder jika ID tidak terjangkau
    }
  }

  try {
    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const dbParents = ssFile.getParents();
    if (dbParents.hasNext()) {
      const dbFolder = dbParents.next();

      const directSub = dbFolder.getFoldersByName(subFolderName);
      if (directSub.hasNext()) return directSub.next();

      const directAssets = dbFolder.getFoldersByName(DRIVE_UPLOADS_PARENT);
      if (directAssets.hasNext()) {
        const assetsFolder = directAssets.next();
        const targetInAssets = assetsFolder.getFoldersByName(subFolderName);
        if (targetInAssets.hasNext()) return targetInAssets.next();
        return assetsFolder.createFolder(subFolderName);
      }

      const cmrParents = dbFolder.getParents();
      if (cmrParents.hasNext()) {
        const cmrRoot = cmrParents.next();
        const assetsIter = cmrRoot.getFoldersByName(DRIVE_UPLOADS_PARENT);
        if (assetsIter.hasNext()) {
          const assetsFolder = assetsIter.next();
          const subIter = assetsFolder.getFoldersByName(subFolderName);
          if (subIter.hasNext()) return subIter.next();
          return assetsFolder.createFolder(subFolderName);
        }
        const cmrSubIter = cmrRoot.getFoldersByName(subFolderName);
        if (cmrSubIter.hasNext()) return cmrSubIter.next();
      }
    }
  } catch (navErr) {
    // Lanjut ke pencarian global
  }

  const globalSub = DriveApp.getFoldersByName(subFolderName);
  if (globalSub.hasNext()) return globalSub.next();

  const globalAssets = DriveApp.getFoldersByName(DRIVE_UPLOADS_PARENT);
  if (globalAssets.hasNext()) {
    return globalAssets.next().createFolder(subFolderName);
  }

  return DriveApp.createFolder(subFolderName);
}

function extractBase64FromPayload_(payload) {
  if (!payload) return '';
  const candidate =
    payload.file_base64 ||
    payload.photo_base64 ||
    payload.bukti_base64 ||
    payload.image_base64 ||
    payload.foto_base64 ||
    payload.photo_data_url ||
    (String(payload.url_bukti || '').indexOf('data:image') === 0 ? payload.url_bukti : '');
  return candidate ? String(candidate).trim() : '';
}

function saveBase64ToDriveFolder_(base64Input, folderName, customFileName) {
  try {
    if (!base64Input) return '';
    const rawStr = String(base64Input).trim();

    let mimeType = 'image/jpeg';
    let base64Str = rawStr;

    if (rawStr.indexOf('base64,') !== -1) {
      const parts = rawStr.split('base64,');
      const header = parts[0];
      base64Str = parts[1];
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      }
    }

    base64Str = base64Str.replace(/\s/g, '');
    if (!base64Str || base64Str.length < 20) return '';

    const ext = mimeType.indexOf('png') !== -1 ? '.png' : '.jpg';
    const cleanBaseName = String(customFileName || ('Evidence_' + Date.now()))
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_');
    const finalFileName = cleanBaseName + ext;

    const decodedBytes = Utilities.base64Decode(base64Str);
    const blob = Utilities.newBlob(decodedBytes, mimeType, finalFileName);

    const targetFolder = getTargetDriveFolder_(folderName);
    const file = targetFolder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Abaikan jika dibatasi domain
    }

    return file.getUrl();
  } catch (err) {
    return 'ERROR_DRIVE: ' + err.toString();
  }
}

/**
 * HELPER V5: AUTO-JURNAL KE cash_ledger (ANTI-DUPLIKAT BERDASARKAN ID TRANSAKSI)
 */
function upsertAutoLedgerEntry_(txObj) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const nowIso = new Date().toISOString();

  // Cek apakah ID jurnal otomatis sudah pernah tercatat agar tidak pernah dobel
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(txObj.id)) {
      sheet.getRange(i + 1, headers.indexOf('tanggal') + 1).setValue(txObj.tanggal);
      sheet.getRange(i + 1, headers.indexOf('periode_bulan') + 1).setValue(txObj.periode_bulan);
      sheet.getRange(i + 1, headers.indexOf('periode_tahun') + 1).setValue(Number(txObj.periode_tahun));
      sheet.getRange(i + 1, headers.indexOf('nominal') + 1).setValue(parseNominal_(txObj.nominal));
      sheet.getRange(i + 1, headers.indexOf('keterangan') + 1).setValue(txObj.keterangan);
      if (txObj.url_bukti && txObj.url_bukti !== '-') {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(txObj.url_bukti);
      }
      SpreadsheetApp.flush();
      return txObj.id;
    }
  }

  const newRow = [
    txObj.id,
    txObj.tanggal,
    txObj.periode_bulan,
    Number(txObj.periode_tahun || 2026),
    txObj.tipe || 'IN',
    txObj.kategori || 'Iuran Warga',
    false,
    '',
    parseNominal_(txObj.nominal),
    txObj.keterangan || '',
    txObj.house_id || '-',
    txObj.url_bukti || '-',
    'ADM-01',
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();
  return txObj.id;
}

/**
 * 1. HANDLER UPLOAD MUTASI KAS PENGURUS -> FOLDER Struk_Pengeluaran_Kas
 */
function handleInputLedger_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const txId = payload.id || ('TX-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));
  const nominal = parseNominal_(payload.nominal);
  const tipe = String(payload.tipe || 'OUT').toUpperCase();
  const kategori = payload.kategori || 'Perawatan Pos';
  const periodeBulan = payload.periode_bulan || 'November';
  const periodeTahun = Number(payload.periode_tahun || 2026);

  // Jika pemasukan Iuran Warga / Parkir Fasum, simpan ke Bukti_Iuran_Warga; jika pengeluaran ke Struk_Pengeluaran_Kas
  const targetFolder = (tipe === 'IN' && (kategori === 'Iuran Warga' || kategori === 'Parkir Fasum'))
    ? DRIVE_FOLDERS.BUKTI_IPL
    : DRIVE_FOLDERS.STRUK_KAS;

  let finalUrlBukti = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '-';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = txId + '_' + dateStr + '_' + tipe + '_' + kategori;
    const uploadedUrl = saveBase64ToDriveFolder_(
      base64Photo,
      targetFolder,
      fileLabel
    );
    if (uploadedUrl) {
      finalUrlBukti = uploadedUrl;
    }
  }

  const newRow = [
    txId,
    dateStr,
    periodeBulan,
    periodeTahun,
    tipe,
    kategori,
    Boolean(payload.is_proyek),
    payload.nama_proyek || '',
    nominal,
    payload.keterangan || '',
    payload.house_id || '-',
    finalUrlBukti,
    'ADM-01',
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();

  const updatedBalance = syncAccurateCurrentBalance_('November', 2026);

  return jsonResponse_({
    status: 'success',
    backend_version: 'v5.0',
    message: 'Transaksi berhasil disimpan di urutan teratas (Buku ' + periodeBulan + ' ' + periodeTahun + ').',
    tx_id: txId,
    url_bukti: finalUrlBukti,
    new_balance: updatedBalance
  });
}

/**
 * 2. HANDLER UPDATE STATUS IPL OLEH PENGURUS (+ AUTO-JURNAL KE CASH_LEDGER SESUAI BULAN BUKU)
 */
function handleUpdateIpl_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();

  const targetHouseId = String(payload.house_id || 'H-01');
  const targetBulan = String(payload.periode_bulan || 'November');
  const targetTahun = Number(payload.periode_tahun || 2026);
  const tanggalBayar = payload.tanggal_bayar || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

  let uploadedProofUrl = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'IPL_' + targetBulan + '_' + targetTahun + '_' + targetHouseId;
    uploadedProofUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.BUKTI_IPL,
      fileLabel
    );
  }

  // Cari data rumah untuk informasi nama & nomor rumah jika baris periode baru perlu dibuat
  const houses = getTableData_(TABLES.HOUSES);
  const houseObj = houses.find(h => String(h.id) === targetHouseId) || {
    id: targetHouseId,
    nomor_rumah: targetHouseId.replace('H-', ''),
    nama_kepala_keluarga: targetHouseId,
    tarif_ipl: 200000
  };

  let rowFound = false;
  let existingProofUrl = '-';

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === targetHouseId &&
      String(data[i][headers.indexOf('periode_bulan')]) === targetBulan &&
      Number(data[i][headers.indexOf('periode_tahun')]) === targetTahun
    ) {
      rowFound = true;
      existingProofUrl = String(data[i][headers.indexOf('url_bukti')] || '-');
      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue(payload.status_bayar);
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(tanggalBayar);
      if (uploadedProofUrl) {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(uploadedProofUrl);
        existingProofUrl = uploadedProofUrl;
      }
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(payload.catatan || '');
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      break;
    }
  }

  // Jika baris untuk periode bulan tersebut (misal Desember) belum ada di sheet ipl_status, tambahkan otomatis
  if (!rowFound) {
    const newIplId = 'IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
    existingProofUrl = uploadedProofUrl || '-';
    const newIplRow = [
      newIplId,
      targetHouseId,
      houseObj.nomor_rumah || targetHouseId.replace('H-', ''),
      houseObj.nama_kepala_keluarga || '-',
      targetBulan,
      targetTahun,
      parseNominal_(payload.nominal_ipl || houseObj.tarif_ipl || 200000),
      payload.status_bayar || 'Lunas',
      tanggalBayar,
      existingProofUrl,
      payload.catatan || '',
      nowIso
    ];
    sheet.appendRow(newIplRow);
  }

  SpreadsheetApp.flush();

  // FITUR V5: AUTO-JURNAL KE cash_ledger SAAT STATUS LUNAS
  const shouldAutoJournal = payload.auto_journal !== false && String(payload.status_bayar) === 'Lunas';
  const journalIds = [];

  if (shouldAutoJournal) {
    const nominalIpl = parseNominal_(payload.nominal_ipl || houseObj.tarif_ipl || 200000);
    if (nominalIpl > 0) {
      const iplTxId = 'AUTO-IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
      upsertAutoLedgerEntry_({
        id: iplTxId,
        tanggal: tanggalBayar,
        periode_bulan: targetBulan,
        periode_tahun: targetTahun,
        tipe: 'IN',
        kategori: 'Iuran Warga',
        nominal: nominalIpl,
        keterangan: 'Iuran IPL ' + targetBulan + ' ' + targetTahun + ' - No. ' + (houseObj.nomor_rumah || targetHouseId) + ' (' + (houseObj.nama_kepala_keluarga || '') + ')',
        house_id: targetHouseId,
        url_bukti: existingProofUrl
      });
      journalIds.push(iplTxId);
    }

    // Jika sekaligus validasi pembayaran Parkir Fasum (Weekend / Member Bulanan)
    const nominalParkir = parseNominal_(payload.nominal_parkir || 0);
    if (nominalParkir > 0) {
      const prkTxId = 'AUTO-PRK-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
      const labelPaket = payload.kategori_parkir || (nominalParkir >= 100000 ? 'Member Bulanan' : 'Paket Weekend');
      upsertAutoLedgerEntry_({
        id: prkTxId,
        tanggal: tanggalBayar,
        periode_bulan: targetBulan,
        periode_tahun: targetTahun,
        tipe: 'IN',
        kategori: 'Parkir Fasum',
        nominal: nominalParkir,
        keterangan: 'Kontribusi Parkir Fasum (' + labelPaket + ') ' + targetBulan + ' ' + targetTahun + ' - No. ' + (houseObj.nomor_rumah || targetHouseId),
        house_id: targetHouseId,
        url_bukti: existingProofUrl
      });
      journalIds.push(prkTxId);
    }
  }

  const updatedBalance = syncAccurateCurrentBalance_('November', 2026);

  return jsonResponse_({
    status: 'success',
    backend_version: 'v5.0',
    message: 'Status IPL ' + targetHouseId + ' (Buku ' + targetBulan + ' ' + targetTahun + ') diperbarui' + (journalIds.length ? ' & tercatat otomatis di Buku Kas.' : '.'),
    url_bukti: existingProofUrl,
    auto_journal_ids: journalIds,
    new_balance: updatedBalance
  });
}

/**
 * 3. HANDLER UPLOAD BUKTI QRIS MANDIRI OLEH WARGA (MENDUKUNG PAKET IPL + PARKIR & CUT-OFF TGL 25)
 */
function handlePublicUploadIplProof_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const todayStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

  const settings = getSettingsMap_();
  const smartPeriod = getSmartPeriodInfo_(settings.cutoff_day_ipl || 25);

  const targetHouseId = String(payload.house_id || 'H-01');
  const targetBulan = String(payload.periode_bulan || smartPeriod.default_ipl_bulan || 'November');
  const targetTahun = Number(payload.periode_tahun || smartPeriod.default_ipl_tahun || 2026);
  const paketBayar = String(payload.paket_bayar || 'IPL_ONLY');
  const totalNominalBayar = parseNominal_(payload.nominal_total || 200000);

  let finalProofUrl = payload.file_name || 'bukti_qris.jpg';
  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'QRIS_' + targetBulan + '_' + targetTahun + '_' + targetHouseId + '_' + paketBayar + '_' + Date.now();
    const driveUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.BUKTI_IPL,
      fileLabel
    );
    if (driveUrl) {
      finalProofUrl = driveUrl;
    }
  }

  const infoCatatan = 'Menunggu Validasi Pengurus [' + paketBayar + ' Rp' + formatRupiah_(totalNominalBayar) + ' • Buku ' + targetBulan + ' ' + targetTahun + ']';

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === targetHouseId &&
      String(data[i][headers.indexOf('periode_bulan')]) === targetBulan &&
      Number(data[i][headers.indexOf('periode_tahun')]) === targetTahun
    ) {
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(todayStr);
      sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(finalProofUrl);
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(infoCatatan);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      SpreadsheetApp.flush();

      return jsonResponse_({
        status: 'success',
        backend_version: 'v5.0',
        message: 'Bukti pembayaran Buku ' + targetBulan + ' ' + targetTahun + ' berhasil disimpan ke Drive & Spreadsheet.',
        url_bukti: finalProofUrl,
        periode_bulan: targetBulan,
        periode_tahun: targetTahun
      });
    }
  }

  // Jika warga membayar di tanggal 25-31 untuk bulan depan yang barisnya belum ada di sheet ipl_status, tambahkan otomatis
  const houses = getTableData_(TABLES.HOUSES);
  const houseObj = houses.find(h => String(h.id) === targetHouseId) || {
    id: targetHouseId,
    nomor_rumah: targetHouseId.replace('H-', ''),
    nama_kepala_keluarga: targetHouseId,
    tarif_ipl: 200000
  };

  const newIplId = 'IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
  sheet.appendRow([
    newIplId,
    targetHouseId,
    houseObj.nomor_rumah || targetHouseId.replace('H-', ''),
    houseObj.nama_kepala_keluarga || '-',
    targetBulan,
    targetTahun,
    parseNominal_(houseObj.tarif_ipl || 200000),
    'Belum Lunas',
    todayStr,
    finalProofUrl,
    infoCatatan,
    nowIso
  ]);
  SpreadsheetApp.flush();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v5.0',
    message: 'Bukti pembayaran Buku ' + targetBulan + ' ' + targetTahun + ' berhasil disimpan ke Drive & Spreadsheet.',
    url_bukti: finalProofUrl,
    periode_bulan: targetBulan,
    periode_tahun: targetTahun
  });
}

/**
 * 4. HANDLER SIMPAN LOG SECURITY + CEKLIS PARKIR MALAM + FOTO WATERMARK
 */
function handleInputSecurityLog_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.SEC_LOGS);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet security_logs tidak ditemukan.' }, 404);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const timeStr = payload.jam || Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm');
  const logId = payload.id || ('SEC-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));

  const kategori = payload.kategori_laporan || 'PATROLI';
  const subKategori = payload.sub_kategori || 'Patroli Rutin';

  let detailCatatan = payload.detail_catatan || '-';

  // V5: Jika Security mencentang daftar rumah yang mobilnya menginap di fasum saat patroli malam/subuh
  if (Array.isArray(payload.parked_house_ids) && payload.parked_house_ids.length > 0) {
    const cleanIds = payload.parked_house_ids.map(x => String(x).trim()).filter(Boolean);
    if (cleanIds.length > 0 && detailCatatan.indexOf('[Parkir Malam:') === -1) {
      detailCatatan += ' [Parkir Malam: ' + cleanIds.join(', ') + ']';
    }
  }

  let drivePhotoUrl = '';
  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = logId + '_' + (payload.nama_security || 'Security') + '_' + kategori;
    drivePhotoUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.LOG_SECURITY,
      fileLabel
    );
    if (drivePhotoUrl) {
      detailCatatan += ' [Foto Bukti: ' + drivePhotoUrl + ']';
    }
  }

  const newRow = [
    logId,
    dateStr,
    timeStr,
    payload.nama_security || 'Pak Eko',
    payload.shift || 'Pagi',
    kategori,
    subKategori,
    payload.house_id || '-',
    payload.nama_warga_tujuan || '-',
    payload.titik_patroli || 'Pos Utama Security',
    payload.cuaca_815 || 'Cerah',
    payload.status_gerbang || 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detailCatatan,
    payload.teks_wa || '-',
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();

  let galonCount = Number(getSettingsMap_().security_galon_count_bulan_ini || 0);
  if (
    subKategori.toLowerCase().indexOf('galon') !== -1 ||
    String(payload.detail_catatan || '').toLowerCase().indexOf('galon') !== -1
  ) {
    galonCount += 1;
    updateSettingValue_('security_galon_count_bulan_ini', String(galonCount));
  }

  return jsonResponse_({
    status: 'success',
    backend_version: 'v5.0',
    message: 'Laporan security berhasil tercatat di database.',
    log_id: logId,
    photo_url: drivePhotoUrl,
    galon_count_bulan_ini: galonCount
  });
}

/**
 * 5. HANDLER V5 BARU: INTERAKSI DENAH SLOT PARKIR FASUM (KLIK KOTAK 1-6 / CHECK-IN / KOSONGKAN / BUKTI BAYAR)
 */
function handleUpdateParkingSlot_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.PARKING);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet parking_slots belum tersedia.' }, 404);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const waktuSekarang = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');

  const slotNumber = Number(payload.slot_number || 1);
  const slotId = payload.slot_id || ('SLOT-0' + slotNumber);
  const isClear = String(payload.status_slot || '').toUpperCase() === 'KOSONG';

  let uploadedProofUrl = payload.url_bukti_parkir || '-';
  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'PARKIR_SLOT_' + slotNumber + '_' + (payload.house_id || 'WARGA') + '_' + Date.now();
    const driveUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.BUKTI_IPL,
      fileLabel
    );
    if (driveUrl) {
      uploadedProofUrl = driveUrl;
    }
  }

  const periodeBulan = payload.periode_bulan || 'November';
  const periodeTahun = Number(payload.periode_tahun || 2026);
  const nominalParkir = isClear ? 0 : parseNominal_(payload.nominal_parkir || 0);

  let updatedSlotObj = null;

  for (let i = 1; i < data.length; i++) {
    if (
      Number(data[i][headers.indexOf('slot_number')]) === slotNumber ||
      String(data[i][headers.indexOf('slot_id')]) === String(slotId)
    ) {
      const rowNum = i + 1;
      const statusSlot = isClear ? 'KOSONG' : (payload.status_slot || 'TERISI');
      const kategoriParkir = isClear ? '-' : (payload.kategori_parkir || 'MEMBER_BULANAN');
      const houseId = isClear ? '-' : (payload.house_id || '-');
      const namaPemilik = isClear ? '-' : (payload.nama_pemilik || '-');
      const platNomor = isClear ? '-' : (payload.plat_nomor || '-');
      const ketKendaraan = isClear ? ('Slot Parkir Fasum #' + slotNumber + ' Kosong') : (payload.keterangan_kendaraan || '-');
      const waktuMasuk = isClear ? '-' : (payload.waktu_masuk || waktuSekarang);
      const statusBayar = isClear ? '-' : (payload.status_bayar_parkir || (nominalParkir > 0 ? 'Menunggu Validasi' : 'Gratis'));

      sheet.getRange(rowNum, headers.indexOf('status_slot') + 1).setValue(statusSlot);
      sheet.getRange(rowNum, headers.indexOf('kategori_parkir') + 1).setValue(kategoriParkir);
      sheet.getRange(rowNum, headers.indexOf('house_id') + 1).setValue(houseId);
      sheet.getRange(rowNum, headers.indexOf('nama_pemilik') + 1).setValue(namaPemilik);
      sheet.getRange(rowNum, headers.indexOf('plat_nomor') + 1).setValue(platNomor);
      sheet.getRange(rowNum, headers.indexOf('keterangan_kendaraan') + 1).setValue(ketKendaraan);
      sheet.getRange(rowNum, headers.indexOf('waktu_masuk') + 1).setValue(waktuMasuk);
      sheet.getRange(rowNum, headers.indexOf('periode_bulan') + 1).setValue(periodeBulan);
      sheet.getRange(rowNum, headers.indexOf('periode_tahun') + 1).setValue(periodeTahun);
      sheet.getRange(rowNum, headers.indexOf('status_bayar_parkir') + 1).setValue(statusBayar);
      sheet.getRange(rowNum, headers.indexOf('nominal_parkir') + 1).setValue(nominalParkir);
      if (!isClear && uploadedProofUrl && uploadedProofUrl !== '-') {
        sheet.getRange(rowNum, headers.indexOf('url_bukti_parkir') + 1).setValue(uploadedProofUrl);
      } else if (isClear) {
        sheet.getRange(rowNum, headers.indexOf('url_bukti_parkir') + 1).setValue('-');
      }
      sheet.getRange(rowNum, headers.indexOf('updated_by') + 1).setValue(payload.updated_by || 'WARGA/SECURITY');
      sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(nowIso);

      updatedSlotObj = {
        slot_id: slotId,
        slot_number: slotNumber,
        status_slot: statusSlot,
        kategori_parkir: kategoriParkir,
        house_id: houseId,
        nama_pemilik: namaPemilik,
        plat_nomor: platNomor,
        keterangan_kendaraan: ketKendaraan,
        waktu_masuk: waktuMasuk,
        periode_bulan: periodeBulan,
        periode_tahun: periodeTahun,
        status_bayar_parkir: statusBayar,
        nominal_parkir: nominalParkir,
        url_bukti_parkir: isClear ? '-' : uploadedProofUrl
      };
      break;
    }
  }

  // Jika slot 7 atau 8 ditambahkan secara dinamis
  if (!updatedSlotObj) {
    const newRow = [
      slotId,
      slotNumber,
      payload.posisi_layout || ('SLOT_TAMBAHAN_' + slotNumber),
      isClear ? 'KOSONG' : 'TERISI',
      isClear ? '-' : (payload.kategori_parkir || 'MEMBER_BULANAN'),
      isClear ? '-' : (payload.house_id || '-'),
      isClear ? '-' : (payload.nama_pemilik || '-'),
      isClear ? '-' : (payload.plat_nomor || '-'),
      isClear ? '-' : (payload.keterangan_kendaraan || '-'),
      isClear ? '-' : waktuSekarang,
      periodeBulan,
      periodeTahun,
      isClear ? '-' : (payload.status_bayar_parkir || 'Gratis'),
      nominalParkir,
      uploadedProofUrl,
      payload.updated_by || 'WARGA',
      nowIso
    ];
    sheet.appendRow(newRow);
  }

  SpreadsheetApp.flush();

  // Jika diupdate oleh Pengurus dengan status_bayar_parkir === 'Lunas' & auto_journal aktif, catat ke cash_ledger
  if (!isClear && String(payload.status_bayar_parkir) === 'Lunas' && nominalParkir > 0 && verifyPengurusToken_(payload.session_token)) {
    const prkTxId = 'AUTO-SLOT' + slotNumber + '-' + periodeBulan.slice(0, 3).toUpperCase() + periodeTahun + '-' + (payload.house_id || 'WARGA');
    upsertAutoLedgerEntry_({
      id: prkTxId,
      tanggal: Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd'),
      periode_bulan: periodeBulan,
      periode_tahun: periodeTahun,
      tipe: 'IN',
      kategori: 'Parkir Fasum',
      nominal: nominalParkir,
      keterangan: 'Parkir Fasum Slot #' + slotNumber + ' (' + (payload.kategori_parkir || 'Parkir') + ' - ' + (payload.plat_nomor || '') + ')',
      house_id: payload.house_id || '-',
      url_bukti: uploadedProofUrl
    });
    syncAccurateCurrentBalance_('November', 2026);
  }

  return jsonResponse_({
    status: 'success',
    backend_version: 'v5.0',
    message: isClear
      ? ('Slot Parkir #' + slotNumber + ' berhasil dikosongkan.')
      : ('Slot Parkir #' + slotNumber + ' berhasil diperbarui untuk ' + (payload.plat_nomor || payload.nama_pemilik || 'Warga') + '.'),
    slot: updatedSlotObj,
    url_bukti_parkir: uploadedProofUrl
  });
}

/**
 * 6. HANDLER V5 BARU: UPDATE ATURAN & TARIF PARKIR FLEKSIBEL + CUT-OFF DI app_settings (PENGURUS)
 */
function handleUpdateParkingConfig_(payload) {
  if (payload.total_slots !== undefined) {
    updateSettingValue_('parking_total_slots', String(payload.total_slots));
  }
  if (payload.fee_monthly !== undefined) {
    updateSettingValue_('parking_fee_monthly', String(parseNominal_(payload.fee_monthly)));
  }
  if (payload.fee_weekend !== undefined) {
    updateSettingValue_('parking_fee_weekend', String(parseNominal_(payload.fee_weekend)));
  }
  if (payload.fee_daily !== undefined) {
    updateSettingValue_('parking_fee_daily', String(parseNominal_(payload.fee_daily)));
  }
  if (payload.free_guest_nights !== undefined) {
    updateSettingValue_('parking_free_guest_nights', String(payload.free_guest_nights));
  }
  if (payload.cutoff_day_ipl !== undefined) {
    updateSettingValue_('cutoff_day_ipl', String(payload.cutoff_day_ipl));
  }
  if (payload.rules_note !== undefined) {
    updateSettingValue_('parking_rules_note', String(payload.rules_note));
  }

  SpreadsheetApp.flush();
  return jsonResponse_({
    status: 'success',
    backend_version: 'v5.0',
    message: 'Aturan tarif parkir & tanggal cut-off buku berhasil diperbarui di database.'
  });
}

function handleUpdateSecuritySchedule_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.SEC_SCHEDULES);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet security_schedules tidak ditemukan.' }, 404);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();
  const targetDate = String(payload.tanggal || '').slice(0, 10);

  for (let i = 1; i < data.length; i++) {
    const rowDateRaw = data[i][headers.indexOf('tanggal')];
    const rowDate = (rowDateRaw instanceof Date)
      ? Utilities.formatDate(rowDateRaw, 'Asia/Jakarta', 'yyyy-MM-dd')
      : String(rowDateRaw).slice(0, 10);

    if (rowDate === targetDate) {
      if (payload.shift_pagi) sheet.getRange(i + 1, headers.indexOf('shift_pagi') + 1).setValue(payload.shift_pagi);
      if (payload.jam_pagi) sheet.getRange(i + 1, headers.indexOf('jam_pagi') + 1).setValue(payload.jam_pagi);
      if (payload.shift_malam) sheet.getRange(i + 1, headers.indexOf('shift_malam') + 1).setValue(payload.shift_malam);
      if (payload.jam_malam) sheet.getRange(i + 1, headers.indexOf('jam_malam') + 1).setValue(payload.jam_malam);
      if (payload.status_jadwal) sheet.getRange(i + 1, headers.indexOf('status_jadwal') + 1).setValue(payload.status_jadwal);
      if (payload.catatan_jadwal !== undefined) sheet.getRange(i + 1, headers.indexOf('catatan_jadwal') + 1).setValue(payload.catatan_jadwal);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      return jsonResponse_({
        status: 'success',
        message: 'Jadwal security tanggal ' + targetDate + ' berhasil diperbarui.'
      });
    }
  }

  const newId = 'SCH-' + targetDate.replace(/-/g, '');
  const newRow = [
    newId,
    targetDate,
    payload.hari || '-',
    payload.periode_bulan || 'November',
    Number(payload.periode_tahun || 2026),
    payload.shift_pagi || 'Pak Eko',
    payload.jam_pagi || '08:00 - 20:00',
    payload.shift_malam || 'Pak Mulyadi',
    payload.jam_malam || '20:00 - 08:00',
    payload.status_jadwal || 'NORMAL_2_SHIFT',
    payload.catatan_jadwal || 'Update jadwal manual',
    nowIso
  ];
  sheet.appendRow(newRow);

  return jsonResponse_({
    status: 'success',
    message: 'Jadwal security baru untuk tanggal ' + targetDate + ' berhasil ditambahkan.'
  });
}

function handleLoginPengurus_(username, password) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.AUTH);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUser = String(row[headers.indexOf('username')]).trim();
    const rowPass = String(row[headers.indexOf('password_hash')]).trim();

    if (rowUser === String(username).trim() && rowPass === String(password).trim()) {
      const newToken = 'CMR_SESS_' + Utilities.getUuid().replace(/-/g, '');
      const nowIso = new Date().toISOString();

      sheet.getRange(i + 1, headers.indexOf('session_token') + 1).setValue(newToken);
      sheet.getRange(i + 1, headers.indexOf('last_login') + 1).setValue(nowIso);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      return jsonResponse_({
        status: 'success',
        user: {
          id: row[headers.indexOf('id')],
          username: rowUser,
          role: row[headers.indexOf('role')],
          nama_tampilan: row[headers.indexOf('nama_tampilan')],
          session_token: newToken
        }
      });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Username atau password pengurus salah.' }, 401);
}

function verifyPengurusToken_(token) {
  if (!token) return false;
  const users = getTableData_(TABLES.AUTH);
  return users.some(u => String(u.session_token) === String(token));
}

function handleInputPayroll_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.PAYROLL);
  const nowIso = new Date().toISOString();
  const payId = payload.id || ('PAY-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMM-HHmm'));

  const gajiPokok = parseNominal_(payload.gaji_pokok || 1650000);
  const uangKonsumsi = parseNominal_(payload.uang_konsumsi || 0);
  const potonganKasbon = parseNominal_(payload.potongan_kasbon || 0);
  const gajiBersih = gajiPokok + uangKonsumsi - potonganKasbon;

  const newRow = [
    payId,
    payload.nama_security,
    payload.periode_bulan,
    Number(payload.periode_tahun || 2026),
    gajiPokok,
    uangKonsumsi,
    potonganKasbon,
    gajiBersih,
    payload.status_pembayaran || 'Ditransfer',
    payload.catatan || ('Potongan kasbon Rp ' + formatRupiah_(potonganKasbon)),
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);

  return jsonResponse_({ status: 'success', payroll_id: payId, gaji_bersih: gajiBersih });
}

function buildMonthlyWaReport_(periodeBulan, periodeTahun) {
  const settings = getSettingsMap_();
  const closings = getTableData_(TABLES.CLOSINGS);
  const ledger = getTableData_(TABLES.LEDGER).filter(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );

  const closingRow = closings.find(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun) === Number(periodeTahun)
  );
  const saldoAwal = closingRow ? parseNominal_(closingRow.saldo_awal) : 1394200;

  let uangMasuk = 0;
  let totalPengeluaran = 0;
  let pengeluaranProyek = 0;
  const pemasukanMap = {};
  const pengeluaranMap = {};
  const proyekList = [];

  ledger.forEach(item => {
    const nom = parseNominal_(item.nominal);
    const kat = String(item.kategori || 'Lainnya');
    const ket = String(item.keterangan || '-');
    const isProyek = String(item.is_proyek).toUpperCase() === 'TRUE' || item.is_proyek === true;

    if (String(item.tipe).toUpperCase() === 'IN') {
      uangMasuk += nom;
      pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
    } else {
      totalPengeluaran += nom;
      if (isProyek) {
        pengeluaranProyek += nom;
        proyekList.push({ nama: item.nama_proyek || ket, nominal: nom });
      }
      if (!pengeluaranMap[kat]) {
        pengeluaranMap[kat] = { total: 0, details: [] };
      }
      pengeluaranMap[kat].total += nom;
      pengeluaranMap[kat].details.push(ket + ' (Rp ' + formatRupiah_(nom) + ')');
    }
  });

  const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;

  let lines = [];
  lines.push('*' + (settings.app_name || 'C-Money') + ' | Laporan Bulanan ' + (settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya') + '*');
  lines.push('Periode Buku: ' + periodeBulan + ' ' + periodeTahun);
  lines.push('');
  lines.push('Halo warga Mutiara Residence Sumberjaya, berikut rekap kas bulanan kita:');
  lines.push('');
  lines.push('Saldo Awal: Rp ' + formatRupiah_(saldoAwal));
  lines.push('Uang Masuk: Rp ' + formatRupiah_(uangMasuk));
  lines.push('Total Pengeluaran: Rp ' + formatRupiah_(totalPengeluaran));
  lines.push('Pengeluaran Proyek: Rp ' + formatRupiah_(pengeluaranProyek));
  lines.push('Sisa Saldo: Rp ' + formatRupiah_(sisaSaldo));
  lines.push('');
  lines.push('*Breakdown Pemasukan per Kategori*');
  Object.keys(pemasukanMap).forEach(k => {
    lines.push('• ' + k + ': Rp ' + formatRupiah_(pemasukanMap[k]));
  });
  lines.push('');
  lines.push('*Breakdown Pengeluaran per Kategori*');
  Object.keys(pengeluaranMap).forEach(k => {
    const item = pengeluaranMap[k];
    lines.push('• ' + k + ': Rp ' + formatRupiah_(item.total) + ' | detail: ' + item.details.join(', '));
  });

  if (proyekList.length > 0) {
    lines.push('');
    lines.push('*Detail Proyek:*');
    proyekList.forEach(p => {
      lines.push('• ' + p.nama + ' - Rp ' + formatRupiah_(p.nominal));
    });
  }

  return {
    periode_bulan: periodeBulan,
    periode_tahun: periodeTahun,
    saldo_awal: saldoAwal,
    uang_masuk: uangMasuk,
    total_pengeluaran: totalPengeluaran,
    pengeluaran_proyek: pengeluaranProyek,
    sisa_saldo: sisaSaldo,
    wa_message: lines.join('\n')
  };
}

function handleCloseMonthAndSendWa_(payload) {
  const periodeBulan = payload.periode_bulan;
  const periodeTahun = Number(payload.periode_tahun || 2026);
  const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
  const settings = getSettingsMap_();
  const nowIso = new Date().toISOString();

  let fonnteStatus = 'SKIPPED';
  let fonnteResponseText = '{}';
  const targetWa = payload.target_wa || settings.fonnte_target_group;
  const fonnteToken = settings.fonnte_api_token;

  if (String(settings.fonnte_auto_send_closing).toUpperCase() === 'TRUE' && fonnteToken && fonnteToken !== 'ISI_TOKEN_FONNTE_DISINI') {
    const resp = UrlFetchApp.fetch(settings.fonnte_api_url || 'https://api.fonnte.com/send', {
      method: 'post',
      headers: { Authorization: fonnteToken },
      payload: { target: targetWa, message: report.wa_message },
      muteHttpExceptions: true
    });
    fonnteResponseText = resp.getContentText();
    fonnteStatus = (resp.getResponseCode() === 200) ? 'SUCCESS' : 'FAILED';
  }

  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.WA_LOGS);
  logSheet.insertRowAfter(1);
  logSheet.getRange(2, 1, 1, 9).setValues([[
    'WA-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'),
    'LAPORAN_TUTUP_BUKU',
    periodeBulan + ' ' + periodeTahun,
    targetWa,
    report.wa_message,
    fonnteStatus,
    fonnteResponseText,
    'ADM-01',
    nowIso
  ]]);

  return jsonResponse_({ status: 'success', fonnte_status: fonnteStatus, report: report });
}

function sortNewestFirst_(rows) {
  return rows.slice().sort((a, b) => {
    const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
    if (yearDiff !== 0) return yearDiff;
    const monthDiff = (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    if (monthDiff !== 0) return monthDiff;
    const dateA = String(a.tanggal || a.created_at || a.closed_at || '');
    const dateB = String(b.tanggal || b.created_at || b.closed_at || '');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

function sortSecurityLogsNewestFirst_(rows) {
  return rows.slice().sort((a, b) => {
    const dateA = String(a.tanggal || '') + ' ' + String(a.jam || '').padStart(5, '0');
    const dateB = String(b.tanggal || '') + ' ' + String(b.jam || '').padStart(5, '0');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.created_at || b.id || '').localeCompare(String(a.created_at || a.id || ''));
  });
}

function parseNominal_(val) {
  if (typeof val === 'number') return val;
  const cleaned = String(val || '0').replace(/[^0-9-]/g, '');
  return Number(cleaned || 0);
}

function getTableData_(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx];
      if (val instanceof Date) {
        if (h === 'tanggal' || h === 'tanggal_bayar') {
          val = Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
        } else if (h === 'jam') {
          val = Utilities.formatDate(val, 'Asia/Jakarta', 'HH:mm');
        } else {
          val = val.toISOString();
        }
      }
      if (['nominal', 'tarif_ipl', 'saldo_awal', 'uang_masuk', 'total_pengeluaran', 'pengeluaran_proyek', 'sisa_saldo', 'gaji_pokok', 'uang_konsumsi', 'potongan_kasbon', 'gaji_bersih', 'nominal_parkir'].indexOf(h) !== -1) {
        obj[h] = parseNominal_(val);
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });
}

function getSettingsMap_() {
  const rows = getTableData_(TABLES.SETTINGS);
  const map = {};
  rows.forEach(r => { map[r.setting_key] = r.setting_value; });
  return map;
}

function updateSettingValue_(key, val) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(val);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([key, val, 'Parameter V5', new Date().toISOString()]);
}

function formatRupiah_(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}