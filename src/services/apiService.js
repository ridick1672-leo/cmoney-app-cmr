/**
 * C-MONEY API SERVICE ADAPTER v4.2
 * Mendukung Google Apps Script (GAS) + Auto-Upload Evidence ke Google Drive CMR
 */

const BACKEND_PROVIDER = 'gas';
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbw2SIIEjqnUbDOp3f4skutwuzY-0oWcGXrja0Xxr5-wOCElh_v7VyEmS9yStJpJl-MrAA/exec';

/**
 * Helper V4.2: Kompresi Foto Nota / Bukti Transfer ke Base64 Ringan
 * Dilengkapi fallback otomatis ke DataURL asli agar file_base64 tidak pernah kosong
 */
export function compressImageToBase64(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result || '';
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl || rawDataUrl);
        } catch (canvasErr) {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function requestGasGet(params = {}) {
  if (!GAS_WEBAPP_URL) {
    throw new Error('VITE_GAS_WEBAPP_URL belum diatur di .env / Vercel.');
  }
  const url = new URL(GAS_WEBAPP_URL);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  // Cache-buster agar browser selalu menarik saldo & link bukti terbaru dari Sheet
  url.searchParams.append('_t', Date.now());

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow'
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

async function requestGasPost(payload = {}) {
  if (!GAS_WEBAPP_URL) {
    throw new Error('VITE_GAS_WEBAPP_URL belum diatur di .env / Vercel.');
  }
  const token = localStorage.getItem('cmoney_pengurus_token') || '';
  const bodyData = {
    ...payload,
    session_token: payload.session_token || token
  };

  // Menggunakan text/plain agar bebas blokir CORS preflight pada Google Apps Script
  const response = await fetch(GAS_WEBAPP_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

export const CMoneyAPI = {
  // 1. Ambil seluruh data Dashboard Publik, Kalender Security & Log (Tanpa Login)
  async getPublicDashboard(bulan = 'November', tahun = 2026) {
    if (BACKEND_PROVIDER === 'gas') {
      return requestGasGet({ action: 'dashboard', bulan, tahun });
    }
    throw new Error('Provider belum didukung.');
  },

  // 2. Login 1 Akun Pengurus (Tanpa Gmail)
  async loginPengurus(username, password) {
    const res = await requestGasPost({
      action: 'login_pengurus',
      username,
      password
    });
    if (res && res.status === 'success' && res.user?.session_token) {
      localStorage.setItem('cmoney_pengurus_token', res.user.session_token);
    }
    return res;
  },

  // 3. Input Transaksi Kas Masuk / Keluar / Proyek + Foto Bukti ke Struk_Pengeluaran_Kas (Pengurus)
  async inputTransaction(txData) {
    return requestGasPost({
      action: 'input_ledger',
      ...txData
    });
  },

  // 4. Update Status Lunas IPL Warga + Foto Bukti ke Bukti_Iuran_Warga (Pengurus)
  async updateIplStatus(iplData) {
    return requestGasPost({
      action: 'update_ipl',
      ...iplData
    });
  },

  // 5. Unggah Konfirmasi Bukti Bayar QRIS oleh Warga ke Bukti_Iuran_Warga (Tanpa Login)
  async uploadIplProof(proofData) {
    return requestGasPost({
      action: 'upload_ipl_proof',
      ...proofData
    });
  },

  // 6. Input Gaji & Kasbon Security (Pengurus)
  async inputPayroll(payrollData) {
    return requestGasPost({
      action: 'input_payroll',
      ...payrollData
    });
  },

  // 7. Tutup Buku Bulanan & Auto-Send WA Grup via Fonnte (Pengurus)
  async closeMonthAndSendWa(periode_bulan, periode_tahun = 2026, target_wa = '') {
    return requestGasPost({
      action: 'close_month_and_send_wa',
      periode_bulan,
      periode_tahun,
      target_wa
    });
  },

  // 8. Simpan Laporan WA & Log Aktivitas/Anomali Security + Foto Watermark ke Log_Absensi_Security
  async inputSecurityLog(logData) {
    return requestGasPost({
      action: 'input_security_log',
      ...logData
    });
  },

  // 9. Update / Override Jadwal Kalender Security (Tukar Shift / Izin Sakit)
  async updateSecuritySchedule(scheduleData) {
    return requestGasPost({
      action: 'update_security_schedule',
      ...scheduleData
    });
  }
};