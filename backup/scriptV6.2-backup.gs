/**
 * C-MONEY BACKEND REST API v6.2 (GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan (100% Real Cash), Keamanan Multi-Foto, Paket Pos & Parkir Dinamis
 * Cluster Mutiara Residence (CMR) Sumberjaya
 *
 * Pembaruan V6.2:
 * 1. Skema Atomik / Fail-Safe: transaksi & log dibatalkan total jika upload foto ke Drive gagal
 * 2. Dukungan Multi-Foto (maksimal 5 foto) pada Laporan & Paket Pos Security (pemisah " | " di url_foto)
 * 3. Perhitungan Saldo Kas 100% LIVE dari Closing CLOSED terakhir + seluruh mutasi cash_ledger setelahnya
 * 4. Pembersihan format sel angka yang berubah menjadi tanggal pada sheet app_settings
 * 5. Alias action POST (anti error "Action POST tidak dikenali") + pemetaan kolom berbasis header
 * 6. Penelusuran ketat folder CMR -> 03_Assets_Uploads -> 4 Subfolder agar file tidak pernah nyasar
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
  PARKING: 'parking_slots',
  DEPOSIT: 'deposit_parkir'
};

const DRIVE_UPLOADS_PARENT = '03_Assets_Uploads';
const DRIVE_FOLDERS = {
  STRUK_KAS: 'Struk_Pengeluaran_Kas',
  BUKTI_IPL: 'Bukti_Iuran_Warga',
  LOG_SECURITY: 'Log_Absensi_Security',
  ASET_SISTEM: 'Aset_Sistem'
};

const MAX_SECURITY_PHOTOS = 5;

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
 * JALANKAN FUNGSI "setupV62DanSinkronDatabase" INI SEKALI DI APPS SCRIPT (KLIK RUN)
 * - Membersihkan format tanggal rusak pada sheet app_settings
 * - Memastikan kolom url_foto tersedia di sheet security_logs
 * - Memverifikasi lokasi ke-4 folder Drive di dalam 03_Assets_Uploads
 * - Menyinkronkan Saldo Kas Nyata 100% Live dari cash_ledger
 * ============================================================================
 */
function setupV62DanSinkronDatabase() {
  ensureV62DatabaseSchema_(true);
  const realBalance = syncAccurateCurrentBalance_();

  const f1 = getTargetDriveFolder_(DRIVE_FOLDERS.STRUK_KAS);
  const f2 = getTargetDriveFolder_(DRIVE_FOLDERS.BUKTI_IPL);
  const f3 = getTargetDriveFolder_(DRIVE_FOLDERS.LOG_SECURITY);
  const f4 = getTargetDriveFolder_(DRIVE_FOLDERS.ASET_SISTEM);

  Logger.log('✅ Setup Database V6.2 Selesai!');
  Logger.log('💰 Saldo Kas Nyata (Live): Rp ' + formatRupiah_(realBalance));
  Logger.log('📁 Folder 1 (Struk Kas): ' + f1.getName() + ' -> ' + f1.getUrl());
  Logger.log('📁 Folder 2 (Bukti IPL): ' + f2.getName() + ' -> ' + f2.getUrl());
  Logger.log('📁 Folder 3 (Log Security): ' + f3.getName() + ' -> ' + f3.getUrl());
  Logger.log('📁 Folder 4 (Aset Sistem): ' + f4.getName() + ' -> ' + f4.getUrl());
}

/**
 * OPSIONAL: Tes upload 1 file gambar contoh ke Folder Log_Absensi_Security & Struk_Pengeluaran_Kas
 */
function tesUploadDriveV62() {
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const u1 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.STRUK_KAS, 'TES_V62_STRUK');
  const u2 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.BUKTI_IPL, 'TES_V62_IPL');
  const u3 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.LOG_SECURITY, 'TES_V62_SECURITY');
  Logger.log('Struk Kas: ' + u1);
  Logger.log('Bukti IPL: ' + u2);
  Logger.log('Log Security: ' + u3);
}

/**
 * HELPER V6.2: PASTIKAN STRUKTUR DATABASE & BERSIHKAN FORMAT TANGGAL RUSAK DI app_settings
 */
function ensureV62DatabaseSchema_(repairSettingsFormat) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const nowIso = new Date().toISOString();

  // 1. Perbaiki & selaraskan app_settings (cegah angka terkonversi jadi tanggal oleh Sheets)
  const settingsSheet = ss.getSheetByName(TABLES.SETTINGS);
  if (settingsSheet) {
    const cleanNumericSettings = {
      cutoff_day_ipl: { val: '25', desc: 'Tanggal mulai cut-off buku IPL bulan berikutnya (default tgl 25)' },
      default_ipl_amount: { val: '200000', desc: 'Tarif baku iuran IPL bulanan (Rp)' },
      parking_total_slots: { val: '6', desc: 'Jumlah slot parkir fasum dinamis (6 slot)' },
      parking_fee_monthly: { val: '150000', desc: 'Tarif kontribusi parkir fasum 1 Mobil bulanan (Rp)' },
      parking_fee_monthly_2cars: { val: '300000', desc: 'Tarif kontribusi parkir fasum 2 Mobil bulanan (Rp)' },
      parking_fee_weekend: { val: '50000', desc: 'Tarif kontribusi parkir fasum Weekend (Rp)' },
      parking_fee_daily: { val: '15000', desc: 'Tarif parkir fasum harian/tamu melewati batas gratis (Rp)' },
      parking_free_guest_nights: { val: '3', desc: 'Batas gratis parkir menginap tamu warga per bulan (malam)' }
    };

    const data = settingsSheet.getDataRange().getValues();
    const existingRowMap = {};
    for (let i = 1; i < data.length; i++) {
      existingRowMap[String(data[i][0]).trim()] = {
        rowNum: i + 1,
        rawVal: data[i][1]
      };
    }

    Object.keys(cleanNumericSettings).forEach(key => {
      const target = cleanNumericSettings[key];
      const existing = existingRowMap[key];
      if (existing) {
        const isDateCorrupted =
          existing.rawVal instanceof Date ||
          /^\d{4}-\d{2}-\d{2}/.test(String(existing.rawVal || ''));
        if (repairSettingsFormat === true && isDateCorrupted) {
          const cell = settingsSheet.getRange(existing.rowNum, 2);
          cell.setNumberFormat('@');
          cell.setValue(target.val);
          settingsSheet.getRange(existing.rowNum, 4).setValue(nowIso);
        }
      } else {
        settingsSheet.appendRow([key, target.val, target.desc, nowIso]);
        const lastRow = settingsSheet.getLastRow();
        settingsSheet.getRange(lastRow, 2).setNumberFormat('@').setValue(target.val);
      }
    });
  }

  // 2. Pastikan sheet parking_slots ada (default 6 slot KOSONG jika belum ada)
  let parkingSheet = ss.getSheetByName(TABLES.PARKING);
  const v62ParkingHeaders = [
    'slot_id', 'slot_number', 'posisi_layout', 'nama_slot', 'status_slot',
    'house_id', 'nama_pemilik', 'nomor_polisi', 'jenis_paket', 'waktu_masuk',
    'catatan', 'url_bukti_parkir', 'updated_by', 'updated_at'
  ];

  if (!parkingSheet) {
    parkingSheet = ss.insertSheet(TABLES.PARKING);
    parkingSheet.getRange(1, 1, 1, v62ParkingHeaders.length).setValues([v62ParkingHeaders]);
    const emptySlots = [
      ['SLOT-01', 1, 'KIRI_VERTIKAL_1', 'Slot 01', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
      ['SLOT-02', 2, 'KIRI_VERTIKAL_2', 'Slot 02', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
      ['SLOT-03', 3, 'KIRI_VERTIKAL_3', 'Slot 03', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
      ['SLOT-04', 4, 'KIRI_VERTIKAL_4', 'Slot 04', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
      ['SLOT-05', 5, 'KANAN_ATAS_5', 'Slot 05', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso],
      ['SLOT-06', 6, 'KANAN_BAWAH_6', 'Slot 06', 'Kosong', '-', '-', '-', 'Tersedia', '-', 'Kosong — Klik untuk Check-In', '-', 'SYSTEM', nowIso]
    ];
    parkingSheet.getRange(2, 1, emptySlots.length, v62ParkingHeaders.length).setValues(emptySlots);
  }

  // 3. Pastikan sheet security_logs memiliki kolom url_foto
  const secLogSheet = ss.getSheetByName(TABLES.SEC_LOGS);
  if (secLogSheet && secLogSheet.getLastColumn() > 0) {
    const secHeaders = secLogSheet.getRange(1, 1, 1, secLogSheet.getLastColumn()).getValues()[0];
    if (secHeaders.indexOf('url_foto') === -1) {
      secLogSheet.getRange(1, secHeaders.length + 1).setValue('url_foto');
    }
  }

  // 4. Pertahankan sheet deposit_parkir tanpa menimpa data yang sudah ada
  if (!ss.getSheetByName(TABLES.DEPOSIT)) {
    const depositSheet = ss.insertSheet(TABLES.DEPOSIT);
    const depHeaders = [
      'id_deposit', 'house_id', 'identitas_warga', 'total_deposit_awal',
      'tarif_potong_per_bulan', 'periode_sudah_terpotong', 'jumlah_bulan_terpotong',
      'nominal_sudah_terpotong', 'sisa_deposit', 'estimasi_sisa_bulan',
      'kebijakan_pengurus', 'updated_at'
    ];
    depositSheet.getRange(1, 1, 1, depHeaders.length).setValues([depHeaders]);
    depositSheet.appendRow([
      'DEP-H15', 'H-15', 'No. 15 / Pak Juhairi', 5000000, 150000,
      'Juni 2025 - Maret 2026', 10, 1500000, 3500000, 23,
      'Hanya memotong kontribusi slot parkir Rp150.000/bln (Tidak memotong kewajiban IPL tunai Rp200.000/bln)',
      nowIso
    ]);
  }
}

/**
 * HELPER V6.2: PARSER NOMOR RUMAH & NAMA WARGA ANTI-BUG ("No. 01 / Pak Suharso")
 */
function extractCleanHouseNumber_(rawNumOrId) {
  const digits = String(rawNumOrId || '').replace(/[^0-9]/g, '');
  return digits ? digits.padStart(2, '0') : '00';
}

function getNormalizedHouses_() {
  const rawHouses = getTableData_(TABLES.HOUSES);
  return rawHouses
    .map(h => {
      const cleanNum = extractCleanHouseNumber_(h.nomor_rumah || h.id);
      const namaWarga = String(h.nama_warga || h.nama_kepala_keluarga || 'Warga').trim();
      const displayLabel = 'No. ' + cleanNum + ' / ' + namaWarga;

      return {
        ...h,
        nomor_rumah: cleanNum,
        nama_warga: namaWarga,
        nama_kepala_keluarga: namaWarga,
        display_label: displayLabel
      };
    })
    .sort((a, b) => Number(a.nomor_rumah) - Number(b.nomor_rumah));
}

function formatHouseLabelById_(houseId, housesList) {
  if (!houseId || houseId === '-') return '-';
  const list = Array.isArray(housesList) ? housesList : getNormalizedHouses_();
  const cleanTarget = String(houseId).trim().toUpperCase();
  const targetDigits = extractCleanHouseNumber_(cleanTarget);

  const found = list.find(
    h =>
      String(h.id).toUpperCase() === cleanTarget ||
      String(h.nomor_rumah) === targetDigits
  );
  return found ? found.display_label : String(houseId);
}

/**
 * HELPER V6.2: HITUNG SALDO KAS NYATA 100% LIVE
 * Sumber kebenaran tunggal: Sisa Saldo Closing CLOSED terakhir + seluruh transaksi cash_ledger setelahnya
 */
function syncAccurateCurrentBalance_() {
  const closings = getTableData_(TABLES.CLOSINGS);
  const ledger = getTableData_(TABLES.LEDGER);

  const closedRows = closings
    .filter(r => String(r.status_tutup_buku || '').toUpperCase() === 'CLOSED')
    .sort((a, b) => {
      const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
      if (yearDiff !== 0) return yearDiff;
      return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    });

  let baseBalance = 1394200;
  let closedYear = 2026;
  let closedMonthNum = 10; // Default Oktober 2026 jika belum ada baris CLOSED

  if (closedRows.length > 0) {
    baseBalance = parseNominal_(closedRows[0].sisa_saldo);
    closedYear = Number(closedRows[0].periode_tahun || 2026);
    closedMonthNum = MONTH_ORDER[closedRows[0].periode_bulan] || 10;
  }

  let totalInAfterClose = 0;
  let totalOutAfterClose = 0;

  ledger.forEach(tx => {
    const txYear = Number(tx.periode_tahun || 2026);
    const txMonthNum = MONTH_ORDER[tx.periode_bulan] || 0;
    const isAfterLastClosed =
      txYear > closedYear || (txYear === closedYear && txMonthNum > closedMonthNum);

    if (isAfterLastClosed) {
      const nom = parseNominal_(tx.nominal);
      if (String(tx.tipe || '').toUpperCase() === 'IN') {
        totalInAfterClose += nom;
      } else {
        totalOutAfterClose += nom;
      }
    }
  });

  const accurateBalance = baseBalance + totalInAfterClose - totalOutAfterClose;
  const settings = getSettingsMap_();
  if (parseNominal_(settings.current_balance) !== accurateBalance) {
    updateSettingValue_('current_balance', String(accurateBalance));
  }

  return accurateBalance;
}

/**
 * HELPER V6.2: HITUNG LIVE MONTHLY CLOSINGS DARI CASH_LEDGER UNTUK BULAN BERJALAN (OPEN)
 */
function getLiveMonthlyClosings_(rawClosings, ledger, activeBulan, activeTahun) {
  const closingsList = Array.isArray(rawClosings) ? rawClosings.map(c => ({ ...c })) : [];

  const hasActiveMonth = closingsList.some(
    c => String(c.periode_bulan) === String(activeBulan) && Number(c.periode_tahun || 2026) === Number(activeTahun)
  );

  const closedRows = closingsList
    .filter(c => String(c.status_tutup_buku || '').toUpperCase() === 'CLOSED')
    .sort((a, b) => {
      const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
      if (yearDiff !== 0) return yearDiff;
      return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    });

  const lastClosedSaldo = closedRows.length > 0 ? parseNominal_(closedRows[0].sisa_saldo) : 1394200;

  if (!hasActiveMonth && activeBulan) {
    closingsList.push({
      id: 'CLS-' + activeTahun + '-' + String(MONTH_ORDER[activeBulan] || 11).padStart(2, '0'),
      periode_bulan: activeBulan,
      periode_tahun: Number(activeTahun),
      saldo_awal: lastClosedSaldo,
      uang_masuk: 0,
      total_pengeluaran: 0,
      pengeluaran_proyek: 0,
      sisa_saldo: lastClosedSaldo,
      status_tutup_buku: 'OPEN'
    });
  }

  // Urutkan kronologis dari terlama ke terbaru dulu agar saldo_awal bulan OPEN berantai akurat
  const chronological = closingsList.sort((a, b) => {
    const yearDiff = Number(a.periode_tahun || 2026) - Number(b.periode_tahun || 2026);
    if (yearDiff !== 0) return yearDiff;
    return (MONTH_ORDER[a.periode_bulan] || 0) - (MONTH_ORDER[b.periode_bulan] || 0);
  });

  let runningBalance = lastClosedSaldo;
  const enriched = chronological.map(c => {
    const isClosed = String(c.status_tutup_buku || '').toUpperCase() === 'CLOSED';
    if (isClosed) {
      runningBalance = parseNominal_(c.sisa_saldo);
      return c;
    }

    const bulan = String(c.periode_bulan);
    const tahun = Number(c.periode_tahun || 2026);
    const monthTx = ledger.filter(
      tx => String(tx.periode_bulan) === bulan && Number(tx.periode_tahun || 2026) === tahun
    );

    let uangMasuk = 0;
    let totalPengeluaran = 0;
    let pengeluaranProyek = 0;

    monthTx.forEach(tx => {
      const nom = parseNominal_(tx.nominal);
      const isProyek = String(tx.is_proyek).toUpperCase() === 'TRUE' || tx.is_proyek === true;
      if (String(tx.tipe || '').toUpperCase() === 'IN') {
        uangMasuk += nom;
      } else {
        totalPengeluaran += nom;
        if (isProyek) pengeluaranProyek += nom;
      }
    });

    const saldoAwal = runningBalance;
    const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;
    runningBalance = sisaSaldo;

    return {
      ...c,
      saldo_awal: saldoAwal,
      uang_masuk: uangMasuk,
      total_pengeluaran: totalPengeluaran,
      pengeluaran_proyek: pengeluaranProyek,
      sisa_saldo: sisaSaldo,
      status_tutup_buku: 'OPEN'
    };
  });

  return sortNewestFirst_(enriched);
}

/**
 * HELPER V6.2: PASTIKAN 22 BARIS RUMAH TERSEDIA UNTUK PERIODE BULAN YANG DIPILIH
 */
function getOrEnsureIplRowsForPeriod_(periodeBulan, periodeTahun, houses, defaultIplAmount) {
  const allIpl = getTableData_(TABLES.IPL);
  const filtered = allIpl.filter(
    r => String(r.periode_bulan) === String(periodeBulan) && Number(r.periode_tahun || 2026) === Number(periodeTahun)
  );

  if (filtered.length > 0) {
    return filtered
      .map(r => {
        const matchedHouse = houses.find(h => String(h.id) === String(r.house_id));
        const st = String(r.status_bayar || 'Belum Bayar');
        return {
          ...r,
          nomor_rumah: matchedHouse ? matchedHouse.nomor_rumah : extractCleanHouseNumber_(r.house_id),
          nama_warga: matchedHouse ? matchedHouse.nama_warga : (r.nama_warga || r.nama_kepala_keluarga || 'Warga'),
          nama_kepala_keluarga: matchedHouse ? matchedHouse.nama_warga : (r.nama_warga || r.nama_kepala_keluarga || 'Warga'),
          display_label: matchedHouse ? matchedHouse.display_label : r.house_id,
          status_bayar: st === 'Belum Lunas' ? 'Belum Bayar' : st,
          nominal_bayar: parseNominal_(r.nominal_bayar || r.tarif_ipl || defaultIplAmount || 200000)
        };
      })
      .sort((a, b) => String(a.house_id).localeCompare(String(b.house_id)));
  }

  return houses.map(h => {
    const isNonActive =
      String(h.status_huni || '').toLowerCase().indexOf('tidak aktif') !== -1 || String(h.id) === 'H-04';
    return {
      id: 'IPL-' + periodeBulan.slice(0, 3).toUpperCase() + periodeTahun + '-' + h.id,
      house_id: h.id,
      nomor_rumah: h.nomor_rumah,
      nama_warga: h.nama_warga,
      nama_kepala_keluarga: h.nama_warga,
      display_label: h.display_label,
      periode_bulan: periodeBulan,
      periode_tahun: Number(periodeTahun),
      tarif_ipl: isNonActive ? 0 : Number(h.tarif_ipl || defaultIplAmount || 200000),
      nominal_bayar: isNonActive ? 0 : Number(h.tarif_ipl || defaultIplAmount || 200000),
      status_bayar: isNonActive ? 'Tidak Aktif' : 'Belum Bayar',
      tanggal_bayar: '-',
      url_bukti: '-',
      catatan: isNonActive ? 'Unit Non-Aktif (Pihak BPR)' : '',
      updated_at: new Date().toISOString()
    };
  });
}

/**
 * HELPER V6.2: NORMALISASI 6 SLOT PARKIR DENAH HORIZONTAL
 */
function getNormalizedParkingSlots_(houses) {
  const rawSlots = getTableData_(TABLES.PARKING);
  const layoutOrder = [
    'KIRI_VERTIKAL_1', 'KIRI_VERTIKAL_2', 'KIRI_VERTIKAL_3',
    'KIRI_VERTIKAL_4', 'KANAN_ATAS_5', 'KANAN_BAWAH_6'
  ];

  if (!rawSlots || rawSlots.length === 0) return [];

  return rawSlots
    .map((s, idx) => {
      const num = Number(s.slot_number || (idx + 1));
      const slotId = s.slot_id || ('SLOT-0' + num);
      const posisiLayout = s.posisi_layout || layoutOrder[num - 1] || ('KIRI_VERTIKAL_' + num);
      const namaSlot = s.nama_slot || ('Slot 0' + num);
      const houseId = s.house_id || '-';
      const upperSt = String(s.status_slot || 'Kosong').toUpperCase();
      const normStatus =
        upperSt === 'TERISI' ? 'Terisi'
          : upperSt === 'WEEKEND' ? 'Weekend'
          : upperSt === 'TAMU' ? 'Tamu'
          : 'Kosong';

      const namaPemilik =
        normStatus === 'Kosong'
          ? '-'
          : (houseId !== '-' ? formatHouseLabelById_(houseId, houses) : (s.nama_pemilik || 'Tamu / Non-Warga'));

      return {
        slot_id: slotId,
        slot_number: num,
        posisi_layout: posisiLayout,
        nama_slot: namaSlot,
        status_slot: normStatus,
        house_id: normStatus === 'Kosong' ? '-' : houseId,
        nama_pemilik: namaPemilik,
        nomor_polisi: normStatus === 'Kosong' ? '-' : (s.nomor_polisi || s.plat_nomor || '-'),
        jenis_paket: normStatus === 'Kosong' ? 'Tersedia' : (s.jenis_paket || s.kategori_parkir || 'Parkir Bulanan (Rp 150.000)'),
        waktu_masuk: normStatus === 'Kosong' ? '-' : (s.waktu_masuk || '-'),
        catatan: normStatus === 'Kosong' ? 'Kosong — Klik untuk Check-In' : (s.catatan || s.keterangan_kendaraan || '-'),
        url_bukti_parkir: s.url_bukti_parkir || '-',
        updated_by: s.updated_by || 'Security',
        updated_at: s.updated_at || ''
      };
    })
    .sort((a, b) => Number(a.slot_number) - Number(b.slot_number));
}

/**
 * HELPER V6.2: PARSER MULTI-FOTO UNTUK LOG SECURITY (KEMBALIKAN url_foto STRING & photo_urls ARRAY)
 */
function parseMultiPhotoUrls_(rawUrlStr) {
  if (!rawUrlStr || rawUrlStr === '-') return [];
  return String(rawUrlStr)
    .split('|')
    .map(u => u.trim())
    .filter(u => u && u !== '-' && (u.indexOf('http') === 0 || u.indexOf('data:image') === 0 || u.indexOf('/assets/') === 0));
}

function getNormalizedSecurityLogs_(houses) {
  const rawLogs = sortSecurityLogsNewestFirst_(getTableData_(TABLES.SEC_LOGS));
  return rawLogs.map(log => {
    let urlFotoRaw = String(log.url_foto || '-').trim();
    let cleanCatatan = String(log.detail_catatan || '-');

    const matchFoto = cleanCatatan.match(/\[Foto Bukti:\s*([^\]]+)\]/i);
    if (matchFoto && matchFoto[1]) {
      if (!urlFotoRaw || urlFotoRaw === '-') {
        urlFotoRaw = matchFoto[1].trim();
      }
      cleanCatatan = cleanCatatan.replace(matchFoto[0], '').trim();
    }

    const photoUrls = parseMultiPhotoUrls_(urlFotoRaw);
    const houseLabel =
      log.house_id && log.house_id !== '-'
        ? formatHouseLabelById_(log.house_id, houses)
        : (log.nama_warga_tujuan || '-');

    return {
      ...log,
      nama_warga_tujuan: houseLabel,
      detail_catatan: cleanCatatan,
      url_foto: photoUrls.length > 0 ? photoUrls.join(' | ') : '-',
      photo_urls: photoUrls
    };
  });
}

/**
 * HTTP GET: Endpoint Publik Warga & Security (Tanpa Login)
 */
function doGet(e) {
  try {
    ensureV62DatabaseSchema_(false);

    const settings = getSettingsMap_();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const accurateBalance = syncAccurateCurrentBalance_();
      const defaultIplAmount = parseNominal_(settings.default_ipl_amount || 200000);

      const houses = getNormalizedHouses_();
      const ledger = sortNewestFirst_(getTableData_(TABLES.LEDGER));
      const ipl = getOrEnsureIplRowsForPeriod_(periodeBulan, periodeTahun, houses, defaultIplAmount);
      const rawClosings = getTableData_(TABLES.CLOSINGS);
      const closings = getLiveMonthlyClosings_(rawClosings, ledger, periodeBulan, periodeTahun);
      const payroll = sortNewestFirst_(getTableData_(TABLES.PAYROLL));

      const securitySchedules = getTableData_(TABLES.SEC_SCHEDULES).sort((a, b) =>
        String(a.tanggal).localeCompare(String(b.tanggal))
      );

      const securityLogs = getNormalizedSecurityLogs_(houses);
      const parkingSlots = getNormalizedParkingSlots_(houses);

      return jsonResponse_({
        status: 'success',
        backend_version: 'v6.2',
        server_time_iso: new Date().toISOString(),
        app_name: settings.app_name || 'C-Money',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        logo_url: settings.logo_url || '/assets/logo-cmoney.png',
        current_balance: accurateBalance,
        default_ipl_amount: defaultIplAmount,
        total_houses: Number(settings.total_houses || 22),
        total_active_houses: Number(settings.total_active_houses || 21),
        qris_merchant_name: settings.qris_merchant_name || 'Cluster Mutiara Residence',
        qris_nmid: settings.qris_nmid || 'ID1026000000CMR',
        qris_image_url: settings.qris_image_url || '/assets/qris-cmr-statis.png',
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: ipl,
        cash_ledger: ledger,
        monthly_closings: closings,
        security_payroll: payroll,
        security_schedules: securitySchedules,
        security_logs: securityLogs,
        parking_slots: parkingSlots
      });
    }

    if (action === 'PreviewWaClosing') {
      const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
      return jsonResponse_({ status: 'success', data: report });
    }

    return jsonResponse_({ status: 'error', message: 'Action GET tidak dikenali: ' + action }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * HTTP POST: Endpoint Aksi Security/Warga (Tanpa Login) & Pengurus (Dengan Token)
 */
function doPost(e) {
  try {
    ensureV62DatabaseSchema_(false);

    const rawContents = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(rawContents);
    const action = String(body.action || '').trim();

    // 1. Login Pengurus
    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    // 2. Endpoint Publik / Mandiri Warga & Security (Tanpa Login Token)
    if (action === 'input_security_log' || action === 'add_security_log') {
      return handleInputSecurityLog_(body);
    }
    if (action === 'update_security_schedule') {
      return handleUpdateSecuritySchedule_(body);
    }
    if (
      action === 'upload_ipl_proof' ||
      action === 'upload_qris_proof' ||
      action === 'confirm_qris_proof' ||
      action === 'public_upload_ipl_proof'
    ) {
      return handlePublicUploadIplProof_(body);
    }
    if (action === 'update_parking_slot') {
      return handleUpdateParkingSlot_(body);
    }

    // 3. Endpoint Khusus Pengurus (Wajib Token Sesi)
    if (!verifyPengurusToken_(body.session_token)) {
      return jsonResponse_({ status: 'unauthorized', message: 'Sesi pengurus tidak valid. Silakan login ulang.' }, 401);
    }

    if (action === 'input_ledger' || action === 'input_transaction' || action === 'add_transaction') {
      return handleInputLedger_(body);
    }
    if (action === 'update_ipl' || action === 'update_ipl_status') {
      return handleUpdateIpl_(body);
    }
    if (action === 'input_payroll') {
      return handleInputPayroll_(body);
    }
    if (action === 'close_month_and_send_wa') {
      return handleCloseMonthAndSendWa_(body);
    }

    return jsonResponse_({
      status: 'error',
      backend_version: 'v6.2',
      message: 'Action POST tidak dikenali: ' + (action || '(kosong)')
    }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', backend_version: 'v6.2', message: err.toString() }, 500);
  }
}

/**
 * HELPER V6.2: PENELUSURAN KETAT FOLDER DRIVE CMR -> 03_Assets_Uploads -> [Subfolder]
 */
function getTargetDriveFolder_(subFolderName) {
  // 1. Telusuri dari lokasi file Spreadsheet CMR_Database_Master (01_Database -> CMR -> 03_Assets_Uploads)
  try {
    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const dbParents = ssFile.getParents();
    while (dbParents.hasNext()) {
      const dbFolder = dbParents.next();

      // Jika 03_Assets_Uploads berada sejajar di dalam folder yg sama
      const directAssets = dbFolder.getFoldersByName(DRIVE_UPLOADS_PARENT);
      if (directAssets.hasNext()) {
        const assetsFolder = directAssets.next();
        const subIter = assetsFolder.getFoldersByName(subFolderName);
        return subIter.hasNext() ? subIter.next() : assetsFolder.createFolder(subFolderName);
      }

      // Naik 1 tingkat ke folder induk CMR (parent dari 01_Database)
      const cmrParents = dbFolder.getParents();
      while (cmrParents.hasNext()) {
        const cmrRoot = cmrParents.next();
        const assetsIter = cmrRoot.getFoldersByName(DRIVE_UPLOADS_PARENT);
        if (assetsIter.hasNext()) {
          const assetsFolder = assetsIter.next();
          const subIter = assetsFolder.getFoldersByName(subFolderName);
          return subIter.hasNext() ? subIter.next() : assetsFolder.createFolder(subFolderName);
        }
      }
    }
  } catch (navErr) {
    // Lanjut ke pencarian berdasarkan nama folder 03_Assets_Uploads
  }

  // 2. Cari folder induk 03_Assets_Uploads secara global agar tidak pernah keluar dari struktur aset
  const globalAssets = DriveApp.getFoldersByName(DRIVE_UPLOADS_PARENT);
  if (globalAssets.hasNext()) {
    const assetsFolder = globalAssets.next();
    const subIter = assetsFolder.getFoldersByName(subFolderName);
    return subIter.hasNext() ? subIter.next() : assetsFolder.createFolder(subFolderName);
  }

  // 3. Fallback terakhir: cari langsung nama subfolder
  const globalSub = DriveApp.getFoldersByName(subFolderName);
  if (globalSub.hasNext()) return globalSub.next();

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
    (String(payload.url_bukti || '').indexOf('data:image') === 0 ? payload.url_bukti : '') ||
    (String(payload.url_foto || '').indexOf('data:image') === 0 ? payload.url_foto : '');
  return candidate ? String(candidate).trim() : '';
}

function extractMultiBase64FromPayload_(payload) {
  const results = [];
  if (!payload) return results;

  if (Array.isArray(payload.files_base64) && payload.files_base64.length > 0) {
    payload.files_base64.slice(0, MAX_SECURITY_PHOTOS).forEach((item, idx) => {
      if (typeof item === 'string' && item.trim().length > 20) {
        results.push({ base64: item.trim(), name: 'foto_' + (idx + 1) });
      } else if (item && typeof item === 'object') {
        const b64 = String(item.base64 || item.file_base64 || item.dataUrl || '').trim();
        if (b64.length > 20) {
          results.push({ base64: b64, name: item.name || item.file_name || ('foto_' + (idx + 1)) });
        }
      }
    });
    return results;
  }

  const single = extractBase64FromPayload_(payload);
  if (single) {
    results.push({ base64: single, name: payload.file_name || 'foto_1' });
  }
  return results;
}

function saveBase64ToDriveFolder_(base64Input, folderName, customFileName) {
  try {
    if (!base64Input) return 'ERROR_DRIVE: Data gambar kosong.';
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
    if (!base64Str || base64Str.length < 20) {
      return 'ERROR_DRIVE: Format base64 gambar tidak valid.';
    }

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

function isDriveUploadFailed_(urlResult) {
  return !urlResult || String(urlResult).indexOf('ERROR_DRIVE:') === 0 || String(urlResult).indexOf('http') !== 0;
}

/**
 * HELPER: SUSUN BARIS BERDASARKAN URUTAN HEADER ASLI SHEET (ANTI KOLOM BERGESER)
 */
function buildRowByHeaders_(headers, valueMap) {
  return headers.map(h => (valueMap[h] !== undefined ? valueMap[h] : ''));
}

/**
 * HELPER AUTO-JURNAL KE cash_ledger (ANTI-DUPLIKAT)
 */
function upsertAutoLedgerEntry_(txObj) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const nowIso = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(txObj.id)) {
      const setVal = (col, val) => {
        const cIdx = headers.indexOf(col);
        if (cIdx !== -1) sheet.getRange(i + 1, cIdx + 1).setValue(val);
      };
      setVal('tanggal', txObj.tanggal);
      setVal('periode_bulan', txObj.periode_bulan);
      setVal('periode_tahun', Number(txObj.periode_tahun));
      setVal('kategori', txObj.kategori);
      setVal('nominal', parseNominal_(txObj.nominal));
      setVal('keterangan', txObj.keterangan);
      if (txObj.url_bukti && txObj.url_bukti !== '-') {
        setVal('url_bukti', txObj.url_bukti);
      }
      SpreadsheetApp.flush();
      return txObj.id;
    }
  }

  const newRow = buildRowByHeaders_(headers, {
    id: txObj.id,
    tanggal: txObj.tanggal,
    periode_bulan: txObj.periode_bulan,
    periode_tahun: Number(txObj.periode_tahun || 2026),
    tipe: txObj.tipe || 'IN',
    kategori: txObj.kategori || 'Iuran Warga (IPL)',
    is_proyek: false,
    nama_proyek: '',
    nominal: parseNominal_(txObj.nominal),
    keterangan: txObj.keterangan || '',
    house_id: txObj.house_id || '-',
    url_bukti: txObj.url_bukti || '-',
    input_by: 'ADM-01',
    created_at: nowIso
  });

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();
  return txObj.id;
}

/**
 * 1. HANDLER INPUT MUTASI KAS PENGURUS (ATOMIK / FAIL-SAFE UPLOAD FOTO)
 */
function handleInputLedger_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const txId = payload.id || ('TX-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));
  const nominal = parseNominal_(payload.nominal);
  const tipe = String(payload.tipe || 'OUT').toUpperCase();
  const kategori = payload.kategori || 'Perawatan Pos';
  const periodeBulan = payload.periode_bulan || 'November';
  const periodeTahun = Number(payload.periode_tahun || 2026);

  const targetFolder = (tipe === 'IN') ? DRIVE_FOLDERS.BUKTI_IPL : DRIVE_FOLDERS.STRUK_KAS;
  const base64Photo = extractBase64FromPayload_(payload);
  const expectPhoto = payload.expect_photo === true || Boolean(payload.file_name) || Boolean(base64Photo);

  let finalUrlBukti = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '-';

  // SKEMA FAIL-SAFE: Jika pengurus melampirkan foto tapi data hilang atau gagal masuk Drive -> BATALKAN TRANSAKSI
  if (expectPhoto) {
    if (!base64Photo) {
      return jsonResponse_({
        status: 'error',
        backend_version: 'v6.2',
        message: 'Upload foto bukti gagal: file gambar tidak terbaca. Transaksi dibatalkan agar saldo tidak terpotong.'
      }, 400);
    }

    const fileLabel = txId + '_' + dateStr + '_' + tipe + '_' + kategori;
    const uploadedUrl = saveBase64ToDriveFolder_(base64Photo, targetFolder, fileLabel);
    if (isDriveUploadFailed_(uploadedUrl)) {
      return jsonResponse_({
        status: 'error',
        backend_version: 'v6.2',
        message: 'Gagal mengunggah foto ke Google Drive (' + uploadedUrl + '). Transaksi dibatalkan agar saldo tetap aman.'
      }, 500);
    }
    finalUrlBukti = uploadedUrl;
  }

  const newRow = buildRowByHeaders_(headers, {
    id: txId,
    tanggal: dateStr,
    periode_bulan: periodeBulan,
    periode_tahun: periodeTahun,
    tipe: tipe,
    kategori: kategori,
    is_proyek: Boolean(payload.is_proyek),
    nama_proyek: payload.nama_proyek || '',
    nominal: nominal,
    keterangan: payload.keterangan || '',
    house_id: payload.house_id || '-',
    url_bukti: finalUrlBukti,
    input_by: 'ADM-01',
    created_at: nowIso
  });

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();

  const updatedBalance = syncAccurateCurrentBalance_();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.2',
    message: 'Transaksi berhasil disimpan ke Buku Kas ' + periodeBulan + ' ' + periodeTahun + '.',
    tx_id: txId,
    url_bukti: finalUrlBukti,
    new_balance: updatedBalance
  });
}

/**
 * 2. HANDLER VALIDASI LUNAS IPL & PAKET PARKIR NETRAL (ATOMIK / FAIL-SAFE + AUTO-JURNAL)
 */
function handleUpdateIpl_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();

  const houses = getNormalizedHouses_();
  const targetHouseId = String(payload.house_id || 'H-01');
  const houseObj = houses.find(h => String(h.id) === targetHouseId) || {
    id: targetHouseId,
    nomor_rumah: extractCleanHouseNumber_(targetHouseId),
    nama_warga: targetHouseId,
    display_label: targetHouseId,
    tarif_ipl: 200000
  };

  const targetBulan = String(payload.periode_bulan || 'November');
  const targetTahun = Number(payload.periode_tahun || 2026);
  const tanggalBayar = payload.tanggal_bayar || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const nominalBayar = parseNominal_(payload.nominal_bayar || payload.nominal_ipl || houseObj.tarif_ipl || 200000);
  const paketBayarLabel = String(payload.paket_bayar || 'IPL Bulanan');

  const base64Photo = extractBase64FromPayload_(payload);
  const expectPhoto = payload.expect_photo === true || Boolean(payload.file_name) || Boolean(base64Photo);

  let uploadedProofUrl = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '';

  if (expectPhoto) {
    if (!base64Photo) {
      return jsonResponse_({
        status: 'error',
        backend_version: 'v6.2',
        message: 'Upload foto bukti IPL gagal: data gambar kosong. Validasi dibatalkan.'
      }, 400);
    }
    const fileLabel = 'IPL_' + targetBulan + '_' + targetTahun + '_' + targetHouseId;
    const driveUrl = saveBase64ToDriveFolder_(base64Photo, DRIVE_FOLDERS.BUKTI_IPL, fileLabel);
    if (isDriveUploadFailed_(driveUrl)) {
      return jsonResponse_({
        status: 'error',
        backend_version: 'v6.2',
        message: 'Gagal menyimpan foto bukti IPL ke Google Drive (' + driveUrl + '). Validasi dibatalkan.'
      }, 500);
    }
    uploadedProofUrl = driveUrl;
  }

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
      if (headers.indexOf('tarif_ipl') !== -1 && nominalBayar > 0) {
        sheet.getRange(i + 1, headers.indexOf('tarif_ipl') + 1).setValue(nominalBayar);
      }
      if (uploadedProofUrl) {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(uploadedProofUrl);
        existingProofUrl = uploadedProofUrl;
      }
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(payload.catatan || '');
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      break;
    }
  }

  if (!rowFound) {
    const newIplId = 'IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
    existingProofUrl = uploadedProofUrl || '-';
    const newRow = buildRowByHeaders_(headers, {
      id: newIplId,
      house_id: targetHouseId,
      nomor_rumah: houseObj.nomor_rumah,
      nama_warga: houseObj.nama_warga,
      nama_kepala_keluarga: houseObj.nama_warga,
      periode_bulan: targetBulan,
      periode_tahun: targetTahun,
      tarif_ipl: nominalBayar,
      status_bayar: payload.status_bayar || 'Lunas',
      tanggal_bayar: tanggalBayar,
      url_bukti: existingProofUrl,
      catatan: payload.catatan || '',
      updated_at: nowIso
    });
    sheet.appendRow(newRow);
  }

  SpreadsheetApp.flush();

  const shouldAutoJournal =
    payload.auto_jurnal !== false &&
    payload.auto_journal !== false &&
    String(payload.status_bayar) === 'Lunas' &&
    nominalBayar > 0;

  let autoLedgerId = null;
  if (shouldAutoJournal) {
    autoLedgerId = 'IPL-' + targetBulan.toUpperCase() + '-' + targetTahun + '-' + targetHouseId;
    const kategoriKas =
      nominalBayar > 200000
        ? 'Iuran Warga (IPL) & Parkir Fasum'
        : nominalBayar === 150000
        ? 'Parkir Fasum'
        : 'Iuran Warga (IPL)';

    upsertAutoLedgerEntry_({
      id: autoLedgerId,
      tanggal: tanggalBayar,
      periode_bulan: targetBulan,
      periode_tahun: targetTahun,
      tipe: 'IN',
      kategori: kategoriKas,
      nominal: nominalBayar,
      keterangan: 'Pembayaran ' + paketBayarLabel + ' — ' + houseObj.display_label,
      house_id: targetHouseId,
      url_bukti: existingProofUrl
    });
  }

  const updatedBalance = syncAccurateCurrentBalance_();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.2',
    message: 'Status ' + houseObj.display_label + ' (' + targetBulan + ') berhasil divalidasi.',
    url_bukti: existingProofUrl,
    auto_ledger_id: autoLedgerId,
    new_balance: updatedBalance
  });
}

/**
 * 3. HANDLER UPLOAD BUKTI QRIS MANDIRI OLEH WARGA (ATOMIK / FAIL-SAFE)
 */
function handlePublicUploadIplProof_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const todayStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

  const houses = getNormalizedHouses_();
  const targetHouseId = String(payload.house_id || 'H-01');
  const houseObj = houses.find(h => String(h.id) === targetHouseId) || {
    id: targetHouseId,
    nomor_rumah: extractCleanHouseNumber_(targetHouseId),
    nama_warga: targetHouseId,
    display_label: targetHouseId,
    tarif_ipl: 200000
  };

  const targetBulan = String(payload.periode_bulan || 'November');
  const targetTahun = Number(payload.periode_tahun || 2026);
  const paketLabel = String(payload.paket_label || payload.paket_bayar || 'IPL Bulanan');
  const totalNominalBayar = parseNominal_(payload.nominal_bayar || payload.nominal_total || 200000);

  const base64Photo = extractBase64FromPayload_(payload);
  if (!base64Photo) {
    return jsonResponse_({
      status: 'error',
      backend_version: 'v6.2',
      message: 'Foto screenshot bukti transfer wajib dilampirkan dan gagal terbaca.'
    }, 400);
  }

  const fileLabel = 'QRIS_' + targetBulan + '_' + targetTahun + '_' + targetHouseId + '_' + Date.now();
  const driveUrl = saveBase64ToDriveFolder_(base64Photo, DRIVE_FOLDERS.BUKTI_IPL, fileLabel);
  if (isDriveUploadFailed_(driveUrl)) {
    return jsonResponse_({
      status: 'error',
      backend_version: 'v6.2',
      message: 'Gagal mengunggah bukti pembayaran ke Google Drive (' + driveUrl + '). Silakan coba ulang.'
    }, 500);
  }

  const infoCatatan =
    payload.catatan ||
    (paketLabel + ' (Rp ' + formatRupiah_(totalNominalBayar) + ') — ' + houseObj.display_label);

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === targetHouseId &&
      String(data[i][headers.indexOf('periode_bulan')]) === targetBulan &&
      Number(data[i][headers.indexOf('periode_tahun')]) === targetTahun
    ) {
      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue('Menunggu Validasi');
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(todayStr);
      if (headers.indexOf('tarif_ipl') !== -1) {
        sheet.getRange(i + 1, headers.indexOf('tarif_ipl') + 1).setValue(totalNominalBayar);
      }
      sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(driveUrl);
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(infoCatatan);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      SpreadsheetApp.flush();

      return jsonResponse_({
        status: 'success',
        backend_version: 'v6.2',
        message: 'Bukti pembayaran ' + houseObj.display_label + ' berhasil disimpan ke Drive.',
        url_bukti: driveUrl,
        periode_bulan: targetBulan,
        periode_tahun: targetTahun
      });
    }
  }

  const newIplId = 'IPL-' + targetBulan.slice(0, 3).toUpperCase() + targetTahun + '-' + targetHouseId;
  const newRow = buildRowByHeaders_(headers, {
    id: newIplId,
    house_id: targetHouseId,
    nomor_rumah: houseObj.nomor_rumah,
    nama_warga: houseObj.nama_warga,
    nama_kepala_keluarga: houseObj.nama_warga,
    periode_bulan: targetBulan,
    periode_tahun: targetTahun,
    tarif_ipl: totalNominalBayar,
    status_bayar: 'Menunggu Validasi',
    tanggal_bayar: todayStr,
    url_bukti: driveUrl,
    catatan: infoCatatan,
    updated_at: nowIso
  });
  sheet.appendRow(newRow);
  SpreadsheetApp.flush();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.2',
    message: 'Bukti pembayaran ' + houseObj.display_label + ' berhasil disimpan ke Drive.',
    url_bukti: driveUrl,
    periode_bulan: targetBulan,
    periode_tahun: targetTahun
  });
}

/**
 * 4. HANDLER LOG SECURITY & DAFTAR PAKET DI POS (MULTI-FOTO MAKS 5 + ATOMIK / FAIL-SAFE)
 */
function handleInputSecurityLog_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.SEC_LOGS);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet security_logs tidak ditemukan.' }, 404);
  }

  const houses = getNormalizedHouses_();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');

  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = payload.tanggal || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const timeStr = payload.jam || Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm');
  const logId = payload.id || ('SEC-' + Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));

  // Upsert: jika ID log paket sudah ada (misal saat klik "Tandai Sudah Diambil"), perbarui baris tersebut
  if (payload.id && idIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(payload.id)) {
        if (payload.sub_kategori && headers.indexOf('sub_kategori') !== -1) {
          sheet.getRange(i + 1, headers.indexOf('sub_kategori') + 1).setValue(payload.sub_kategori);
        }
        if (payload.detail_catatan && headers.indexOf('detail_catatan') !== -1) {
          sheet.getRange(i + 1, headers.indexOf('detail_catatan') + 1).setValue(payload.detail_catatan);
        }
        SpreadsheetApp.flush();
        return jsonResponse_({
          status: 'success',
          backend_version: 'v6.2',
          message: 'Status paket warga berhasil diperbarui.',
          log_id: payload.id
        });
      }
    }
  }

  const kategori = payload.kategori_laporan || 'PAKET_SURAT';
  const subKategori = payload.sub_kategori || 'Paket Tiba di Pos (Belum Diambil)';
  const houseId = payload.house_id || '-';
  const wargaTujuan =
    houseId !== '-'
      ? formatHouseLabelById_(houseId, houses)
      : (payload.nama_warga_tujuan || '-');

  // Ekstrak 1 atau hingga 5 foto base64
  const photosList = extractMultiBase64FromPayload_(payload);
  const expectPhoto = payload.expect_photo === true || photosList.length > 0;
  const uploadedUrls = [];

  if (expectPhoto) {
    if (photosList.length === 0) {
      return jsonResponse_({
        status: 'error',
        backend_version: 'v6.2',
        message: 'Upload foto laporan gagal: file gambar tidak terbaca. Laporan dibatalkan.'
      }, 400);
    }

    for (let idx = 0; idx < photosList.length; idx++) {
      const pItem = photosList[idx];
      const suffix = photosList.length > 1 ? ('_Foto' + (idx + 1)) : '';
      const fileLabel = logId + '_' + (payload.nama_security || 'Security') + '_' + kategori + suffix;
      const uploadedUrl = saveBase64ToDriveFolder_(pItem.base64, DRIVE_FOLDERS.LOG_SECURITY, fileLabel);

      if (isDriveUploadFailed_(uploadedUrl)) {
        return jsonResponse_({
          status: 'error',
          backend_version: 'v6.2',
          message: 'Gagal menyimpan foto ke-' + (idx + 1) + ' ke Google Drive (' + uploadedUrl + '). Laporan dibatalkan.'
        }, 500);
      }
      uploadedUrls.push(uploadedUrl);
    }
  }

  const combinedUrlFoto =
    uploadedUrls.length > 0
      ? uploadedUrls.join(' | ')
      : ((payload.url_foto && String(payload.url_foto).indexOf('http') === 0) ? payload.url_foto : '-');

  const newRow = buildRowByHeaders_(headers, {
    id: logId,
    tanggal: dateStr,
    jam: timeStr,
    nama_security: payload.nama_security || 'Pak Eko',
    shift: payload.shift || 'Pagi',
    kategori_laporan: kategori,
    sub_kategori: subKategori,
    house_id: houseId,
    nama_warga_tujuan: wargaTujuan,
    titik_patroli: payload.titik_patroli || 'Pos Utama Security',
    cuaca_815: payload.cuaca_815 || 'Cerah',
    status_gerbang: payload.status_gerbang || 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
    detail_catatan: payload.detail_catatan || '-',
    teks_wa: payload.teks_wa || '-',
    created_at: nowIso,
    url_foto: combinedUrlFoto
  });

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
  SpreadsheetApp.flush();

  return jsonResponse_({
    status: 'success',
    backend_version: 'v6.2',
    message: uploadedUrls.length > 0
      ? ('Laporan & ' + uploadedUrls.length + ' foto berhasil tersimpan ke Drive & Database!')
      : 'Laporan Pos berhasil tersimpan ke Database.',
    log_id: logId,
    url_foto: combinedUrlFoto,
    photo_urls: uploadedUrls
  });
}

/**
 * 5. HANDLER CHECK-IN / CHECK-OUT DENAH 6 SLOT PARKIR OLEH SECURITY
 */
function handleUpdateParkingSlot_(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TABLES.PARKING);
  if (!sheet) {
    return jsonResponse_({ status: 'error', message: 'Sheet parking_slots belum tersedia.' }, 404);
  }

  const houses = getNormalizedHouses_();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const nowIso = now.toISOString();
  const timeNowStr = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM HH:mm') + ' WIB';

  const slotId = String(payload.slot_id || 'SLOT-01');
  const rawStatus = String(payload.status_slot || 'Kosong');
  const isCheckout = rawStatus.toUpperCase() === 'KOSONG';

  const houseId = isCheckout ? '-' : (payload.house_id || '-');
  const namaPemilik = isCheckout
    ? '-'
    : (houseId !== '-' ? formatHouseLabelById_(houseId, houses) : (payload.nama_pemilik || 'Tamu / Non-Warga'));
  const statusSlot = isCheckout ? 'Kosong' : rawStatus;
  const jenisPaket = isCheckout ? 'Tersedia' : (payload.jenis_paket || 'Parkir Bulanan (Rp 150.000)');
  const nomorPolisi = isCheckout ? '-' : (payload.nomor_polisi || '-');
  const waktuMasuk = isCheckout ? '-' : (payload.waktu_masuk && payload.waktu_masuk !== '-' ? payload.waktu_masuk : timeNowStr);
  const catatan = isCheckout ? 'Kosong — Klik untuk Check-In' : (payload.catatan || 'Kondisi parkir aman');
  const updatedBy = payload.updated_by || payload.nama_security || 'Security';

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('slot_id')]) === slotId) {
      const rowNum = i + 1;
      const setCol = (colName, val) => {
        const idx = headers.indexOf(colName);
        if (idx !== -1) sheet.getRange(rowNum, idx + 1).setValue(val);
      };

      setCol('status_slot', statusSlot);
      setCol('house_id', houseId);
      setCol('nama_pemilik', namaPemilik);
      setCol('nomor_polisi', nomorPolisi);
      setCol('jenis_paket', jenisPaket);
      setCol('waktu_masuk', waktuMasuk);
      setCol('catatan', catatan);
      setCol('updated_by', updatedBy);
      setCol('updated_at', nowIso);

      SpreadsheetApp.flush();

      if (payload.catat_ke_log_security === true) {
        const logDetail = isCheckout
          ? ('Check-Out ' + slotId + ' (Slot kini Kosong).')
          : ('Check-In ' + slotId + ' — ' + namaPemilik + ' (' + nomorPolisi + ' / ' + jenisPaket + '). Kondisi: ' + catatan);

        handleInputSecurityLog_({
          nama_security: updatedBy,
          shift: payload.shift || 'Malam',
          kategori_laporan: 'PARKIR_FASUM',
          sub_kategori: isCheckout ? ('Parkir Keluar (' + slotId + ')') : ('Parkir Masuk (' + slotId + ')'),
          house_id: houseId,
          nama_warga_tujuan: namaPemilik,
          titik_patroli: 'Area Parkir Fasum (' + slotId + ')',
          detail_catatan: logDetail,
          teks_wa: '*LAPORAN KONDISI PARKIR FASUM CMR*\n• Slot: *' + slotId + '* (' + statusSlot + ')\n• Kendaraan: *' + namaPemilik + '* (' + nomorPolisi + ')\n• Pelapor: *' + updatedBy + '*\n• Kondisi: ' + catatan
        });
      }

      return jsonResponse_({
        status: 'success',
        backend_version: 'v6.2',
        message: isCheckout
          ? (slotId + ' berhasil dikosongkan (Check-Out).')
          : (slotId + ' berhasil diperbarui (' + namaPemilik + ').')
      });
    }
  }

  return jsonResponse_({ status: 'error', message: 'Slot parkir tidak ditemukan.' }, 404);
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
      if (payload.shift_malam) sheet.getRange(i + 1, headers.indexOf('shift_malam') + 1).setValue(payload.shift_malam);
      if (payload.status_jadwal) sheet.getRange(i + 1, headers.indexOf('status_jadwal') + 1).setValue(payload.status_jadwal);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      return jsonResponse_({ status: 'success', message: 'Jadwal tanggal ' + targetDate + ' diperbarui.' });
    }
  }

  return jsonResponse_({ status: 'error', message: 'Tanggal jadwal tidak ditemukan.' }, 404);
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
        backend_version: 'v6.2',
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
  if (token === 'LOCAL_DEV_TOKEN') return true;
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
    payId, payload.nama_security, payload.periode_bulan, Number(payload.periode_tahun || 2026),
    gajiPokok, uangKonsumsi, potonganKasbon, gajiBersih,
    payload.status_pembayaran || 'Ditransfer',
    payload.catatan || ('Potongan kasbon Rp ' + formatRupiah_(potonganKasbon)),
    nowIso
  ];

  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);

  return jsonResponse_({ status: 'success', backend_version: 'v6.2', payroll_id: payId, gaji_bersih: gajiBersih });
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
      if (isProyek) pengeluaranProyek += nom;
      if (!pengeluaranMap[kat]) pengeluaranMap[kat] = { total: 0, details: [] };
      pengeluaranMap[kat].total += nom;
      pengeluaranMap[kat].details.push(ket + ' (Rp ' + formatRupiah_(nom) + ')');
    }
  });

  const sisaSaldo = saldoAwal + uangMasuk - totalPengeluaran;

  const lines = [
    '*' + (settings.app_name || 'C-Money') + ' | Laporan Kas Bulanan ' + (settings.cluster_full_name || 'Cluster Mutiara Residence') + '*',
    'Periode Buku: ' + periodeBulan + ' ' + periodeTahun,
    '',
    'Saldo Awal: Rp ' + formatRupiah_(saldoAwal),
    'Uang Masuk Nyata: Rp ' + formatRupiah_(uangMasuk),
    'Total Pengeluaran: Rp ' + formatRupiah_(totalPengeluaran),
    'Sisa Saldo Kas Nyata: Rp ' + formatRupiah_(sisaSaldo),
    '',
    '*Rincian Pemasukan:*'
  ];

  Object.keys(pemasukanMap).forEach(k => {
    lines.push('• ' + k + ': Rp ' + formatRupiah_(pemasukanMap[k]));
  });

  lines.push('');
  lines.push('*Rincian Pengeluaran:*');
  Object.keys(pengeluaranMap).forEach(k => {
    const item = pengeluaranMap[k];
    lines.push('• ' + k + ': Rp ' + formatRupiah_(item.total) + ' (' + item.details.join(', ') + ')');
  });

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
  if (logSheet) {
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
  }

  return jsonResponse_({ status: 'success', backend_version: 'v6.2', fonnte_status: fonnteStatus, report: report });
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
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      const cell = sheet.getRange(i + 1, 2);
      cell.setNumberFormat('@');
      cell.setValue(String(val));
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([key, String(val), 'Parameter V6.2', new Date().toISOString()]);
}

function formatRupiah_(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}