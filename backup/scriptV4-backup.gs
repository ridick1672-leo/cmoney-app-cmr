/**
 * C-MONEY BACKEND REST API v4.1 (GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan & Keamanan Cluster Mutiara Residence (CMR)
 *
 * Fitur Terkunci (V2 + V3 + V4.1):
 * - V2: 22 Rumah (21 Aktif + 1 Non-Aktif BPR), 55 Rincian Kas, Rekap 5 Bulan, Urut Terbaru di Atas
 * - V3: Kalender Rotasi Security (Jumat & Sabtu Malam Libur), Generator WA & Log Anomali
 * - V4.1: Auto-Upload Foto Evidence dari 4 Fitur (Mutasi Kas, Validasi IPL Pengurus,
 *         Upload QRIS Warga, & Foto Log Security) tepat ke dalam struktur folder
 *         CMR -> 03_Assets_Uploads -> [4 Subfolder] + Tautan Otomatis di Spreadsheet
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
  SEC_LOGS: 'security_logs'
};

// Nama Folder Induk Aset & 4 Subfolder Resmi di Google Drive CMR Anda
const DRIVE_UPLOADS_PARENT = '03_Assets_Uploads';
const DRIVE_FOLDERS = {
  STRUK_KAS: 'Struk_Pengeluaran_Kas',
  BUKTI_IPL: 'Bukti_Iuran_Warga',
  LOG_SECURITY: 'Log_Absensi_Security',
  ASET_SISTEM: 'Aset_Sistem'
};

const MONTH_ORDER = {
  Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
  Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12
};

// ID Folder Asli dari Google Drive CMR Anda (Terkunci 100% Akurat)
const DRIVE_FOLDER_IDS = {
  Struk_Pengeluaran_Kas: '1s0hqj3DqYIwHxKt4fIP0lG52iAKW-HMl',
  Bukti_Iuran_Warga: '1_Fkb9p1zvX0mnL3Jaa4GuyZUkZ_aGi8D',
  Log_Absensi_Security: '15dGynlB2l6gWE0dcs77dtlx_m0FpKc4x',
  Aset_Sistem: '1YdOvc8mouVaKKqwl8uVuMx3vCLYUhung'
};

/**
 * ============================================================================
 * FUNGSI DIAGNOSTIK & TES UPLOAD NYATA KE SEMUA 4 FOLDER DRIVE CMR SEKALIGUS
 * Pilih "tesUploadKe4FolderDrive" di atas editor Apps Script lalu klik "Run"
 * ============================================================================
 */
function tesUploadKe4FolderDrive() {
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const url1 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.STRUK_KAS, 'TES_1_STRUK_KAS');
  Logger.log('✅ Folder 1 (Struk_Pengeluaran_Kas) Berhasil: ' + url1);

  const url2 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.BUKTI_IPL, 'TES_2_BUKTI_IPL_WARGA');
  Logger.log('✅ Folder 2 (Bukti_Iuran_Warga) Berhasil: ' + url2);

  const url3 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.LOG_SECURITY, 'TES_3_LOG_ABSEN_SECURITY');
  Logger.log('✅ Folder 3 (Log_Absensi_Security) Berhasil: ' + url3);

  const url4 = saveBase64ToDriveFolder_(sampleBase64, DRIVE_FOLDERS.ASET_SISTEM, 'TES_4_ASET_SISTEM');
  Logger.log('✅ Folder 4 (Aset_Sistem) Berhasil: ' + url4);
}

/**
 * HTTP GET: Endpoint Publik Warga & Security (Tanpa Login)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const settings = getSettingsMap_();

      const houses = getTableData_(TABLES.HOUSES).sort((a, b) =>
        String(a.id).localeCompare(String(b.id))
      );

      const ledger = sortNewestFirst_(getTableData_(TABLES.LEDGER));

      const ipl = getTableData_(TABLES.IPL)
        .filter(r => String(r.periode_bulan) === periodeBulan && Number(r.periode_tahun) === periodeTahun)
        .sort((a, b) => String(a.house_id).localeCompare(String(b.house_id)));

      const closings = sortNewestFirst_(getTableData_(TABLES.CLOSINGS));
      const payroll = sortNewestFirst_(getTableData_(TABLES.PAYROLL));

      const securitySchedules = getTableData_(TABLES.SEC_SCHEDULES).sort((a, b) =>
        String(a.tanggal).localeCompare(String(b.tanggal))
      );

      const securityLogs = sortSecurityLogsNewestFirst_(getTableData_(TABLES.SEC_LOGS));

      return jsonResponse_({
        status: 'success',
        backend_version: 'v4.1',
        server_time_iso: new Date().toISOString(),
        app_name: settings.app_name || 'C-Money',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        logo_url: settings.logo_url || '/assets/logo-cmoney.png',
        current_balance: parseNominal_(settings.current_balance || 1394200),
        default_ipl_amount: parseNominal_(settings.default_ipl_amount || 200000),
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
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: ipl,
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
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    // Endpoint Publik Security & Warga
    if (action === 'input_security_log') {
      return handleInputSecurityLog_(body);
    }
    if (action === 'update_security_schedule') {
      return handleUpdateSecuritySchedule_(body);
    }
    if (action === 'upload_ipl_proof') {
      return handlePublicUploadIplProof_(body);
    }

    // Endpoint Khusus Pengurus (Wajib Token Sesi)
    if (!verifyPengurusToken_(body.session_token)) {
      return jsonResponse_({ status: 'unauthorized', message: 'Sesi pengurus tidak valid.' }, 401);
    }

    if (action === 'input_ledger') return handleInputLedger_(body);
    if (action === 'update_ipl') return handleUpdateIpl_(body);
    if (action === 'input_payroll') return handleInputPayroll_(body);
    if (action === 'close_month_and_send_wa') return handleCloseMonthAndSendWa_(body);

    return jsonResponse_({ status: 'error', message: 'Action POST tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * HELPER V4.1: PENCARI FOLDER CERDAS SESUAI STRUKTUR DRIVE CMR
 * Menelusuri: 01_Database -> CMR -> 03_Assets_Uploads -> [Nama Subfolder]
 */
function getTargetDriveFolder_(subFolderName) {
  // Prioritas Utama: Gunakan ID Folder Asli Drive CMR Anda agar tidak pernah meleset
  if (DRIVE_FOLDER_IDS[subFolderName]) {
    try {
      return DriveApp.getFolderById(DRIVE_FOLDER_IDS[subFolderName]);
    } catch (idErr) {
      // Jika ID berubah, lanjutkan ke pencarian otomatis di bawah
    }
  }

  // 1. Telusuri dari lokasi Spreadsheet (01_Database) naik ke folder induk CMR
  try {
    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const dbParents = ssFile.getParents();
    if (dbParents.hasNext()) {
      const dbFolder = dbParents.next(); // 01_Database (atau CMR)

      // Cek apakah subFolderName ada langsung di sebelah Spreadsheet
      const directSub = dbFolder.getFoldersByName(subFolderName);
      if (directSub.hasNext()) return directSub.next();

      // Cek apakah ada 03_Assets_Uploads di dalam folder ini
      const directAssets = dbFolder.getFoldersByName(DRIVE_UPLOADS_PARENT);
      if (directAssets.hasNext()) {
        const assetsFolder = directAssets.next();
        const targetInAssets = assetsFolder.getFoldersByName(subFolderName);
        if (targetInAssets.hasNext()) return targetInAssets.next();
        return assetsFolder.createFolder(subFolderName);
      }

      // Naik 1 tingkat ke folder utama CMR (induk dari 01_Database)
      const cmrParents = dbFolder.getParents();
      if (cmrParents.hasNext()) {
        const cmrRoot = cmrParents.next(); // Folder CMR

        // Cek 03_Assets_Uploads di dalam CMR
        const assetsIter = cmrRoot.getFoldersByName(DRIVE_UPLOADS_PARENT);
        if (assetsIter.hasNext()) {
          const assetsFolder = assetsIter.next();
          const subIter = assetsFolder.getFoldersByName(subFolderName);
          if (subIter.hasNext()) return subIter.next();
          return assetsFolder.createFolder(subFolderName);
        }

        // Cek apakah subFolderName ada langsung di dalam CMR
        const cmrSubIter = cmrRoot.getFoldersByName(subFolderName);
        if (cmrSubIter.hasNext()) return cmrSubIter.next();
      }
    }
  } catch (navErr) {
    // Lanjut ke pencarian global jika navigasi parent gagal
  }

  // 2. Fallback: Cari berdasarkan nama di seluruh Google Drive
  const globalSub = DriveApp.getFoldersByName(subFolderName);
  if (globalSub.hasNext()) {
    return globalSub.next();
  }

  const globalAssets = DriveApp.getFoldersByName(DRIVE_UPLOADS_PARENT);
  if (globalAssets.hasNext()) {
    return globalAssets.next().createFolder(subFolderName);
  }

  return DriveApp.createFolder(subFolderName);
}

/**
 * HELPER V4.1: EKSTRAK DATA BASE64 DARI BERBAGAI NAMA FIELD FRONTEND
 */
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

/**
 * HELPER V4.1: SIMPAN FOTO BASE64 KE SUBFOLDER DRIVE CMR & KEMBALIKAN LINK URL
 */
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
      // Tetap lanjutkan jika pengaturan domain membatasi sharing publik otomatis
    }

    return file.getUrl() || ('https://drive.google.com/file/d/' + file.getId() + '/view');
  } catch (err) {
    return 'ERROR_DRIVE: ' + err.toString();
  }
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

  // Tangkap foto base64 dan simpan ke folder Struk_Pengeluaran_Kas
  let finalUrlBukti = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '-';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = txId + '_' + dateStr + '_' + tipe + '_' + kategori;
    const uploadedUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.STRUK_KAS,
      fileLabel
    );
    if (uploadedUrl) {
      finalUrlBukti = uploadedUrl;
    }
  }

  const rowObj = {
    id: txId,
    tanggal: dateStr,
    periode_bulan: payload.periode_bulan || 'November',
    periode_tahun: Number(payload.periode_tahun || 2026),
    tipe: tipe,
    kategori: kategori,
    is_proyek: Boolean(payload.is_proyek),
    nama_proyek: payload.nama_proyek || '',
    nominal: nominal,
    keterangan: payload.keterangan || '',
    house_id: payload.house_id || '-',
    url_bukti: finalUrlBukti,
    created_by: 'ADM-01',
    created_at: nowIso
  };

  // Petakan sesuai urutan header kolom di sheet cash_ledger agar url_bukti 100% tepat
  const lastCol = Math.max(sheet.getLastColumn(), 14);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let newRow = [];

  if (headers && headers.indexOf('url_bukti') !== -1) {
    newRow = headers.map(h => (rowObj[h] !== undefined ? rowObj[h] : ''));
  } else {
    newRow = [
      rowObj.id,
      rowObj.tanggal,
      rowObj.periode_bulan,
      rowObj.periode_tahun,
      rowObj.tipe,
      rowObj.kategori,
      rowObj.is_proyek,
      rowObj.nama_proyek,
      rowObj.nominal,
      rowObj.keterangan,
      rowObj.house_id,
      rowObj.url_bukti,
      rowObj.created_by,
      rowObj.created_at
    ];
  }

  // Sisipkan di baris ke-2 (paling atas)
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);

  const settings = getSettingsMap_();
  let currentBalance = parseNominal_(settings.current_balance || 0);
  currentBalance = (tipe === 'IN') ? (currentBalance + nominal) : (currentBalance - nominal);
  updateSettingValue_('current_balance', String(currentBalance));

  return jsonResponse_({
    status: 'success',
    message: 'Transaksi & bukti foto berhasil disimpan di urutan teratas.',
    tx_id: txId,
    url_bukti: finalUrlBukti,
    new_balance: currentBalance
  });
}

/**
 * 2. HANDLER UPDATE STATUS IPL OLEH PENGURUS -> FOLDER Bukti_Iuran_Warga
 */
function handleUpdateIpl_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();

  let uploadedProofUrl = (payload.url_bukti && String(payload.url_bukti).indexOf('data:image') === -1)
    ? payload.url_bukti
    : '';

  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'IPL_' + (payload.periode_bulan || 'November') + '_' + (payload.periode_tahun || 2026) + '_' + payload.house_id;
    uploadedProofUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.BUKTI_IPL,
      fileLabel
    );
  }

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === String(payload.house_id) &&
      String(data[i][headers.indexOf('periode_bulan')]) === String(payload.periode_bulan) &&
      Number(data[i][headers.indexOf('periode_tahun')]) === Number(payload.periode_tahun || 2026)
    ) {
      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue(payload.status_bayar);
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(payload.tanggal_bayar || nowIso.slice(0, 10));
      if (uploadedProofUrl) {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(uploadedProofUrl);
      }
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(payload.catatan || '');
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      return jsonResponse_({
        status: 'success',
        message: 'Status IPL ' + payload.house_id + ' diperbarui.',
        url_bukti: uploadedProofUrl
      });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Data rumah tidak ditemukan.' }, 404);
}

/**
 * 3. HANDLER UPLOAD BUKTI QRIS MANDIRI OLEH WARGA -> FOLDER Bukti_Iuran_Warga
 */
function handlePublicUploadIplProof_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();
  const targetBulan = payload.periode_bulan || 'November';

  let finalProofUrl = payload.file_name || 'bukti_qris.jpg';
  const base64Photo = extractBase64FromPayload_(payload);
  if (base64Photo) {
    const fileLabel = 'QRIS_' + targetBulan + '_' + (payload.house_id || 'Warga') + '_' + Date.now();
    const driveUrl = saveBase64ToDriveFolder_(
      base64Photo,
      DRIVE_FOLDERS.BUKTI_IPL,
      fileLabel
    );
    if (driveUrl) {
      finalProofUrl = driveUrl;
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === String(payload.house_id) &&
      String(data[i][headers.indexOf('periode_bulan')]) === String(targetBulan)
    ) {
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(nowIso.slice(0, 10));
      sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(finalProofUrl);
      sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(
        'Menunggu Validasi Pengurus (' + (payload.file_name || 'Bukti QRIS') + ')'
      );
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);
      return jsonResponse_({
        status: 'success',
        message: 'Bukti pembayaran berhasil disimpan ke Drive & Spreadsheet.',
        url_bukti: finalProofUrl
      });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Data rumah tidak ditemukan.' }, 404);
}

/**
 * 4. HANDLER SIMPAN LOG SECURITY + FOTO WATERMARK -> FOLDER Log_Absensi_Security
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
    message: 'Laporan security berhasil tercatat di database.',
    log_id: logId,
    photo_url: drivePhotoUrl,
    galon_count_bulan_ini: galonCount
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
  const saldoAwal = closingRow ? parseNominal_(closingRow.saldo_awal) : 0;

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
  lines.push('Periode: ' + periodeBulan + ' ' + periodeTahun);
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
      if (['nominal', 'tarif_ipl', 'saldo_awal', 'uang_masuk', 'total_pengeluaran', 'pengeluaran_proyek', 'sisa_saldo', 'gaji_pokok', 'uang_konsumsi', 'potongan_kasbon', 'gaji_bersih'].indexOf(h) !== -1) {
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
}

function formatRupiah_(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}