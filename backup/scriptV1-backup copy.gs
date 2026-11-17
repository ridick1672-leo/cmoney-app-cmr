/**
 * ============================================================================
 * C-MONEY BACKEND REST API v2.0 (FULL VERSION - GOOGLE APPS SCRIPT)
 * Sistem Manajemen Keuangan & Operasional Cluster Mutiara Residence (CMR)
 * Arsitektur: Relational REST API (Siap Migrasi ke Supabase Free Tier)
 * ============================================================================
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
  WA_LOGS: 'wa_notification_logs'
};

const MONTH_ORDER = {
  Januari: 1,
  Februari: 2,
  Maret: 3,
  April: 4,
  Mei: 5,
  Juni: 6,
  Juli: 7,
  Agustus: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Desember: 12
};

/**
 * ============================================================================
 * HTTP GET: Endpoint Publik untuk Warga (Tanpa Login)
 * Parameter: ?action=dashboard | houses | ledger | ipl | closings | PreviewWaClosing
 * ============================================================================
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'dashboard';
    const periodeBulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'November';
    const periodeTahun = (e && e.parameter && e.parameter.tahun) ? Number(e.parameter.tahun) : 2026;

    if (action === 'dashboard') {
      const settings = getSettingsMap_();
      const houses = sortHouses_(getTableData_(TABLES.HOUSES));
      const ledger = sortLedgerNewestFirst_(getTableData_(TABLES.LEDGER));
      const allIpl = getTableData_(TABLES.IPL);
      const iplCurrent = allIpl.filter(
        r => String(r.periode_bulan).toLowerCase() === String(periodeBulan).toLowerCase() &&
             Number(r.periode_tahun) === periodeTahun
      );
      const closings = sortByPeriodNewestFirst_(getTableData_(TABLES.CLOSINGS));
      const payroll = sortByPeriodNewestFirst_(getTableData_(TABLES.PAYROLL));
      const waLogs = getTableData_(TABLES.WA_LOGS);

      // Bangun rincian kategori otomatis untuk setiap bulan tutup buku
      const monthlyBreakdowns = {};
      closings.forEach(c => {
        const key = c.periode_bulan + '_' + c.periode_tahun;
        monthlyBreakdowns[key] = buildMonthlyWaReport_(c.periode_bulan, c.periode_tahun, ledger, closings, settings);
      });

      const activeHousesCount = houses.filter(h => String(h.status_huni).toLowerCase() === 'aktif').length;

      return jsonResponse_({
        status: 'success',
        app_name: settings.app_name || 'C-Money',
        cluster_name: settings.cluster_name || 'CMR',
        cluster_full_name: settings.cluster_full_name || 'Cluster Mutiara Residence Sumberjaya',
        logo_url: settings.logo_url || '/assets/logo-cmoney.png',
        current_balance: Number(settings.current_balance || 1394200),
        default_ipl_amount: Number(settings.default_ipl_amount || 200000),
        total_houses: Number(settings.total_houses || houses.length || 22),
        total_active_houses: Number(settings.total_active_houses || activeHousesCount || 21),
        qris_merchant_name: settings.qris_merchant_name || 'Cluster Mutiara Residence',
        qris_nmid: settings.qris_nmid || 'ID1026000000CMR',
        qris_image_url: settings.qris_image_url || '/assets/qris-cmr-statis.png',
        summary_periode: { bulan: periodeBulan, tahun: periodeTahun },
        houses: houses,
        ipl_status: iplCurrent,
        cash_ledger: ledger,
        monthly_closings: closings,
        monthly_breakdowns: monthlyBreakdowns,
        security_payroll: payroll,
        wa_notification_logs: waLogs
      });
    }

    if (action === 'PreviewWaClosing') {
      const settings = getSettingsMap_();
      const ledger = sortLedgerNewestFirst_(getTableData_(TABLES.LEDGER));
      const closings = sortByPeriodNewestFirst_(getTableData_(TABLES.CLOSINGS));
      const report = buildMonthlyWaReport_(periodeBulan, periodeTahun, ledger, closings, settings);
      return jsonResponse_({ status: 'success', data: report });
    }

    return jsonResponse_({ status: 'error', message: 'Action GET tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * ============================================================================
 * HTTP POST: Endpoint Khusus Pengurus (1 User Tanpa Gmail)
 * Actions:
 * - login_pengurus
 * - input_ledger
 * - update_ipl
 * - update_house
 * - input_payroll
 * - close_month_and_send_wa
 * - upload_file
 * ============================================================================
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    // 1. Login Pengurus (Tanpa Gmail)
    if (action === 'login_pengurus') {
      return handleLoginPengurus_(body.username, body.password);
    }

    // Validasi Session Token Pengurus untuk seluruh aksi tulis (Write Actions)
    if (!verifyPengurusToken_(body.session_token)) {
      return jsonResponse_({
        status: 'unauthorized',
        message: 'Sesi pengurus tidak valid atau telah berakhir. Silakan login kembali.'
      }, 401);
    }

    // 2. Input Transaksi Kas (Masuk / Keluar / Proyek) -> Disisipkan di Baris Teratas
    if (action === 'input_ledger') {
      return handleInputLedger_(body);
    }

    // 3. Update Status IPL Warga (22 Rumah)
    if (action === 'update_ipl') {
      return handleUpdateIpl_(body);
    }

    // 4. Update Data Master Rumah / Warga
    if (action === 'update_house') {
      return handleUpdateHouse_(body);
    }

    // 5. Input Penggajian & Potongan Kasbon Security -> Disisipkan di Baris Teratas
    if (action === 'input_payroll') {
      return handleInputPayroll_(body);
    }

    // 6. Tutup Buku Bulanan & Trigger Otomatis WhatsApp via Fonnte
    if (action === 'close_month_and_send_wa') {
      return handleCloseMonthAndSendWa_(body);
    }

    // 7. Upload Bukti Transfer / Struk Belanja ke Subfolder Drive CMR
    if (action === 'upload_file') {
      return handleFileUpload_(body);
    }

    return jsonResponse_({ status: 'error', message: 'Action POST tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() }, 500);
  }
}

/**
 * ============================================================================
 * 1. AUTENTIKASI 1 USER PENGURUS TANPA GMAIL
 * ============================================================================
 */
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
  return users.some(u => String(u.session_token).trim() === String(token).trim());
}

/**
 * ============================================================================
 * 2. INPUT TRANSAKSI KAS (SISIPKAN DI BARIS PALING ATAS / TERBARU)
 * ============================================================================
 */
function handleInputLedger_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.LEDGER);
  const nowIso = new Date().toISOString();
  const txId = payload.id || ('TX-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'));
  const nominal = Number(payload.nominal || 0);
  const tipe = String(payload.tipe || 'OUT').toUpperCase();
  const isProyek = Boolean(payload.is_proyek) || String(payload.kategori).toLowerCase() === 'proyek';

  const newRow = [
    txId,
    payload.tanggal || nowIso.slice(0, 10),
    payload.periode_bulan || 'November',
    Number(payload.periode_tahun || 2026),
    tipe,
    payload.kategori || 'Perawatan Pos',
    isProyek,
    isProyek ? (payload.nama_proyek || payload.keterangan || '') : '',
    nominal,
    payload.keterangan || '',
    payload.house_id || '-',
    payload.url_bukti || '-',
    'ADM-01',
    nowIso
  ];

  // Sisipkan di baris ke-2 (tepat di bawah header) agar urutan selalu Terbaru -> Terlama
  insertRowAtTop_(sheet, newRow);

  // Perbarui current_balance pada app_settings
  const settings = getSettingsMap_();
  let currentBalance = Number(settings.current_balance || 0);
  currentBalance = (tipe === 'IN') ? (currentBalance + nominal) : (currentBalance - nominal);
  updateSettingValue_('current_balance', String(currentBalance));

  return jsonResponse_({
    status: 'success',
    message: 'Transaksi berhasil disimpan di urutan teratas.',
    tx_id: txId,
    new_balance: currentBalance
  });
}

/**
 * ============================================================================
 * 3. UPDATE STATUS IPL WARGA (MENDUKUNG 22 RUMAH & UNIT NON-AKTIF BPR)
 * ============================================================================
 */
function handleUpdateIpl_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.IPL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nowIso = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][headers.indexOf('house_id')]) === String(payload.house_id) &&
      String(data[i][headers.indexOf('periode_bulan')]).toLowerCase() === String(payload.periode_bulan).toLowerCase() &&
      Number(data[i][headers.indexOf('periode_tahun')]) === Number(payload.periode_tahun)
    ) {
      const prevStatus = String(data[i][headers.indexOf('status_bayar')]);
      const nextStatus = String(payload.status_bayar);

      sheet.getRange(i + 1, headers.indexOf('status_bayar') + 1).setValue(nextStatus);
      sheet.getRange(i + 1, headers.indexOf('tanggal_bayar') + 1).setValue(
        nextStatus === 'Lunas' ? (payload.tanggal_bayar || nowIso.slice(0, 10)) : ''
      );
      if (payload.url_bukti !== undefined) {
        sheet.getRange(i + 1, headers.indexOf('url_bukti') + 1).setValue(payload.url_bukti);
      }
      if (payload.catatan !== undefined) {
        sheet.getRange(i + 1, headers.indexOf('catatan') + 1).setValue(payload.catatan);
      }
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(nowIso);

      // Sesuaikan saldo kas berjalan jika terjadi perubahan Lunas <-> Belum Lunas
      const nominalIpl = Number(data[i][headers.indexOf('nominal')] || 200000);
      const settings = getSettingsMap_();
      let currentBalance = Number(settings.current_balance || 0);

      if (prevStatus !== 'Lunas' && nextStatus === 'Lunas') {
        currentBalance += nominalIpl;
        updateSettingValue_('current_balance', String(currentBalance));
      } else if (prevStatus === 'Lunas' && nextStatus !== 'Lunas') {
        currentBalance -= nominalIpl;
        updateSettingValue_('current_balance', String(currentBalance));
      }

      return jsonResponse_({
        status: 'success',
        message: 'Status IPL rumah ' + payload.house_id + ' diperbarui menjadi ' + nextStatus,
        new_balance: currentBalance
      });
    }
  }
  return jsonResponse_({ status: 'error', message: 'Data tagihan rumah tidak ditemukan.' }, 404);
}

/**
 * ============================================================================
 * 4. UPDATE DATA MASTER RUMAH (NAMA WARGA / STATUS HUNI AKTIF & TIDAK AKTIF)
 * ============================================================================
 */
function handleUpdateHouse_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.HOUSES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('id')]) === String(payload.house_id)) {
      if (payload.nama_warga !== undefined) {
        sheet.getRange(i + 1, headers.indexOf('nama_warga') + 1).setValue(payload.nama_warga);
      }
      if (payload.status_huni !== undefined) {
        sheet.getRange(i + 1, headers.indexOf('status_huni') + 1).setValue(payload.status_huni);
      }
      if (payload.tarif_ipl !== undefined) {
        sheet.getRange(i + 1, headers.indexOf('tarif_ipl') + 1).setValue(Number(payload.tarif_ipl));
      }
      return jsonResponse_({ status: 'success', message: 'Data rumah ' + payload.house_id + ' berhasil diperbarui.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'ID Rumah tidak ditemukan.' }, 404);
}

/**
 * ============================================================================
 * 5. INPUT GAJI SECURITY & POTONGAN KASBON (SISIPKAN DI BARIS TERATAS)
 * ============================================================================
 */
function handleInputPayroll_(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.PAYROLL);
  const nowIso = new Date().toISOString();
  const payId = payload.id || ('PAY-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMM-HHmm'));

  const gajiPokok = Number(payload.gaji_pokok || 1650000);
  const uangKonsumsi = Number(payload.uang_konsumsi || 0);
  const potonganKasbon = Number(payload.potongan_kasbon || 0);
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
    payload.catatan || (potonganKasbon > 0 ? 'Potongan kasbon Rp ' + formatRupiah_(potonganKasbon) : 'Gaji ' + payload.periode_bulan + ' full'),
    nowIso
  ];

  insertRowAtTop_(sheet, newRow);

  return jsonResponse_({
    status: 'success',
    payroll_id: payId,
    gaji_bersih: gajiBersih
  });
}

/**
 * ============================================================================
 * 6. GENERATOR LAPORAN BULANAN WA & BREAKDOWN KATEGORI DETAIL (SESUAI GAMBAR)
 * ============================================================================
 */
function buildMonthlyWaReport_(periodeBulan, periodeTahun, cachedLedger, cachedClosings, cachedSettings) {
  const settings = cachedSettings || getSettingsMap_();
  const closings = cachedClosings || getTableData_(TABLES.CLOSINGS);
  const allLedger = cachedLedger || getTableData_(TABLES.LEDGER);

  // Ambil transaksi periode terkait dan urutkan dari awal bulan ke akhir bulan untuk rincian kategori
  const ledger = allLedger.filter(
    r => String(r.periode_bulan).toLowerCase() === String(periodeBulan).toLowerCase() &&
         Number(r.periode_tahun) === Number(periodeTahun)
  );

  const closingRow = closings.find(
    r => String(r.periode_bulan).toLowerCase() === String(periodeBulan).toLowerCase() &&
         Number(r.periode_tahun) === Number(periodeTahun)
  );
  const saldoAwal = closingRow ? parseCurrency_(closingRow.saldo_awal) : 0;

  let uangMasuk = 0;
  let totalPengeluaran = 0;
  let pengeluaranProyek = 0;

  const pemasukanMap = {};
  const pengeluaranMap = {};
  const proyekList = [];

  ledger.forEach(item => {
    const nom = parseCurrency_(item.nominal);
    const kat = String(item.kategori || 'Lainnya').trim();
    const ket = String(item.keterangan || '-').trim();
    const isProyek = String(item.is_proyek).toUpperCase() === 'TRUE' || item.is_proyek === true || kat.toLowerCase() === 'proyek';

    if (String(item.tipe).toUpperCase() === 'IN') {
      uangMasuk += nom;
      pemasukanMap[kat] = (pemasukanMap[kat] || 0) + nom;
    } else {
      totalPengeluaran += nom;
      if (isProyek) {
        pengeluaranProyek += nom;
        proyekList.push({
          nama: item.nama_proyek ? String(item.nama_proyek) : ket,
          nominal: nom
        });
      }
      if (!pengeluaranMap[kat]) {
        pengeluaranMap[kat] = { kategori: kat, total: 0, items: [], detailsText: [] };
      }
      pengeluaranMap[kat].total += nom;
      pengeluaranMap[kat].items.push({ keterangan: ket, nominal: nom, is_proyek: isProyek, nama_proyek: item.nama_proyek || '' });
      pengeluaranMap[kat].detailsText.push(ket + ' (Rp ' + formatRupiah_(nom) + ')');
    }
  });

  // Jika kategori Proyek memiliki lebih dari 1 item, ringkas detail kategori Proyek seperti contoh Juni 2026
  if (pengeluaranMap['Proyek'] && pengeluaranProyek > 0) {
    pengeluaranMap['Proyek'].detailsText = ['pengeluaran proyek (Rp ' + formatRupiah_(pengeluaranProyek) + ')'];
  }

  const sisaSaldo = (ledger.length > 0)
    ? (saldoAwal + uangMasuk - totalPengeluaran)
    : (closingRow ? parseCurrency_(closingRow.sisa_saldo) : saldoAwal);

  // Urutkan kategori pengeluaran dari nominal terbesar ke terkecil
  const sortedExpenseCategories = Object.values(pengeluaranMap).sort((a, b) => b.total - a.total);
  const sortedIncomeCategories = Object.keys(pemasukanMap).map(k => ({
    kategori: k,
    total: pemasukanMap[k]
  }));

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
  sortedIncomeCategories.forEach(inc => {
    lines.push('• ' + inc.kategori + ': Rp ' + formatRupiah_(inc.total));
  });
  lines.push('');
  lines.push('*Breakdown Pengeluaran per Kategori*');
  sortedExpenseCategories.forEach(exp => {
    lines.push('• ' + exp.kategori + ': Rp ' + formatRupiah_(exp.total) + ' | detail: ' + exp.detailsText.join(', '));
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
    income_breakdown: sortedIncomeCategories,
    expense_breakdown: sortedExpenseCategories,
    proyek_list: proyekList,
    wa_message: lines.join('\n')
  };
}

/**
 * ============================================================================
 * 7. TUTUP BUKU BULANAN, UPDATE MONTHLY_CLOSINGS & AUTO-SEND WA FONNTE
 * ============================================================================
 */
function handleCloseMonthAndSendWa_(payload) {
  const periodeBulan = payload.periode_bulan;
  const periodeTahun = Number(payload.periode_tahun || 2026);
  const report = buildMonthlyWaReport_(periodeBulan, periodeTahun);
  const settings = getSettingsMap_();
  const nowIso = new Date().toISOString();

  // Kirim pesan ke Fonnte apabila token telah diisi
  let fonnteStatus = 'SKIPPED';
  let fonnteResponseText = '{}';
  const targetWa = payload.target_wa || settings.fonnte_target_group;
  const fonnteToken = settings.fonnte_api_token;

  if (
    String(settings.fonnte_auto_send_closing).toUpperCase() === 'TRUE' &&
    fonnteToken &&
    fonnteToken !== 'ISI_TOKEN_FONNTE_DISINI'
  ) {
    const resp = UrlFetchApp.fetch(settings.fonnte_api_url || 'https://api.fonnte.com/send', {
      method: 'post',
      headers: { Authorization: fonnteToken },
      payload: {
        target: targetWa,
        message: report.wa_message
      },
      muteHttpExceptions: true
    });
    fonnteResponseText = resp.getContentText();
    fonnteStatus = (resp.getResponseCode() === 200) ? 'SUCCESS' : 'FAILED';
  }

  // Update baris periode terkait pada sheet monthly_closings
  const closingSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.CLOSINGS);
  const closingData = closingSheet.getDataRange().getValues();
  const cHeaders = closingData[0];
  let foundClosing = false;

  for (let i = 1; i < closingData.length; i++) {
    if (
      String(closingData[i][cHeaders.indexOf('periode_bulan')]).toLowerCase() === String(periodeBulan).toLowerCase() &&
      Number(closingData[i][cHeaders.indexOf('periode_tahun')]) === periodeTahun
    ) {
      closingSheet.getRange(i + 1, cHeaders.indexOf('uang_masuk') + 1).setValue(report.uang_masuk);
      closingSheet.getRange(i + 1, cHeaders.indexOf('total_pengeluaran') + 1).setValue(report.total_pengeluaran);
      closingSheet.getRange(i + 1, cHeaders.indexOf('pengeluaran_proyek') + 1).setValue(report.pengeluaran_proyek);
      closingSheet.getRange(i + 1, cHeaders.indexOf('sisa_saldo') + 1).setValue(report.sisa_saldo);
      closingSheet.getRange(i + 1, cHeaders.indexOf('ringkasan_teks_wa') + 1).setValue(report.wa_message);
      closingSheet.getRange(i + 1, cHeaders.indexOf('status_tutup_buku') + 1).setValue('CLOSED');
      closingSheet.getRange(i + 1, cHeaders.indexOf('wa_sent_status') + 1).setValue(fonnteStatus === 'SUCCESS' ? 'SENT' : 'READY');
      closingSheet.getRange(i + 1, cHeaders.indexOf('closed_by') + 1).setValue('ADM-01');
      closingSheet.getRange(i + 1, cHeaders.indexOf('closed_at') + 1).setValue(nowIso);
      foundClosing = true;
      break;
    }
  }

  if (!foundClosing) {
    const monthNum = String(MONTH_ORDER[periodeBulan] || 11).padStart(2, '0');
    insertRowAtTop_(closingSheet, [
      'CLS-' + periodeTahun + '-' + monthNum,
      periodeBulan,
      periodeTahun,
      report.saldo_awal,
      report.uang_masuk,
      report.total_pengeluaran,
      report.pengeluaran_proyek,
      report.sisa_saldo,
      report.wa_message,
      'CLOSED',
      fonnteStatus === 'SUCCESS' ? 'SENT' : 'READY',
      'ADM-01',
      nowIso
    ]);
  }

  // Catat log WA ke wa_notification_logs di urutan teratas
  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TABLES.WA_LOGS);
  insertRowAtTop_(logSheet, [
    'WA-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss'),
    'LAPORAN_TUTUP_BUKU',
    periodeBulan + ' ' + periodeTahun,
    targetWa,
    report.wa_message,
    fonnteStatus,
    fonnteResponseText,
    'ADM-01',
    nowIso
  ]);

  return jsonResponse_({
    status: 'success',
    fonnte_status: fonnteStatus,
    report: report
  });
}

/**
 * ============================================================================
 * 8. UPLOAD FILE BASE64 KE SUBFOLDER DRIVE CMR
 * ============================================================================
 */
function handleFileUpload_(payload) {
  const folderId = payload.folder_id;
  const fileName = payload.file_name || ('upload_' + new Date().getTime() + '.jpg');
  const mimeType = payload.mime_type || 'image/jpeg';
  const bytes = Utilities.base64Decode(payload.base64_data);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);

  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonResponse_({
    status: 'success',
    file_name: fileName,
    file_url: file.getUrl()
  });
}

/**
 * ============================================================================
 * HELPER & SORTING UTILITIES (TERBARU KE TERLAMA)
 * ============================================================================
 */
function insertRowAtTop_(sheet, rowValues) {
  if (sheet.getLastRow() >= 1) {
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function parseCurrency_(val) {
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
      let cellVal = row[idx];
      if (['nominal', 'tarif_ipl', 'saldo_awal', 'uang_masuk', 'total_pengeluaran', 'pengeluaran_proyek', 'sisa_saldo', 'gaji_pokok', 'uang_konsumsi', 'potongan_kasbon', 'gaji_bersih'].indexOf(h) !== -1) {
        cellVal = parseCurrency_(cellVal);
      }
      obj[h] = cellVal;
    });
    return obj;
  });
}

function sortHouses_(houses) {
  return houses.slice().sort((a, b) => {
    const numA = Number(String(a.id || '').replace(/[^0-9]/g, '')) || 0;
    const numB = Number(String(b.id || '').replace(/[^0-9]/g, '')) || 0;
    return numA - numB;
  });
}

function sortLedgerNewestFirst_(ledger) {
  return ledger.slice().sort((a, b) => {
    const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
    if (yearDiff !== 0) return yearDiff;
    const monthDiff = (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
    if (monthDiff !== 0) return monthDiff;
    const dateA = String(a.tanggal || '');
    const dateB = String(b.tanggal || '');
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

function sortByPeriodNewestFirst_(rows) {
  return rows.slice().sort((a, b) => {
    const yearDiff = Number(b.periode_tahun || 2026) - Number(a.periode_tahun || 2026);
    if (yearDiff !== 0) return yearDiff;
    return (MONTH_ORDER[b.periode_bulan] || 0) - (MONTH_ORDER[a.periode_bulan] || 0);
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