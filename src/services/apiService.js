/**
 * C-MONEY API SERVICE ADAPTER v6.2
 * Penghubung Frontend React ke Google Apps Script (Code.gs v6.2)
 * Mendukung: 100% Real Cash, Multi-Foto Security (maks 5), Denah Parkir 6 Slot, & Fail-Safe Upload
 */

const BACKEND_PROVIDER = import.meta.env.VITE_BACKEND_PROVIDER || 'gas';
const GAS_WEBAPP_URL = (import.meta.env.VITE_GAS_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbzcSQux1TIIPkjVW0g1rqYGUKimjDQprx0YV6BmOk_NK84U66r6UJTX1NvmvFvKYY-34w/exec').trim();

export const MONTH_LIST_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Helper: Hitung Periode Buku Pintar Berdasarkan Cut-Off Tanggal 25
 * Tanggal 1-24 -> Bulan Berjalan | Tanggal 25-31 -> Bulan Berikutnya
 */
export function getSmartBookPeriod(cutoffDay = 25, customDate = null) {
  const now = customDate instanceof Date ? customDate : new Date();
  const day = now.getDate();
  const monthIdx = now.getMonth();
  const year = now.getFullYear();

  const calendarBulan = MONTH_LIST_ID[monthIdx] || 'November';
  const calendarTahun = year;

  let nextMonthIdx = monthIdx + 1;
  let nextYear = year;
  if (nextMonthIdx > 11) {
    nextMonthIdx = 0;
    nextYear += 1;
  }
  const nextBulan = MONTH_LIST_ID[nextMonthIdx] || 'Desember';
  const isAfterCutoff = day >= Number(cutoffDay || 25);

  return {
    cutoff_day: Number(cutoffDay || 25),
    current_day: day,
    is_after_cutoff: isAfterCutoff,
    calendar_bulan: calendarBulan,
    calendar_tahun: calendarTahun,
    default_ipl_bulan: isAfterCutoff ? nextBulan : calendarBulan,
    default_ipl_tahun: isAfterCutoff ? nextYear : calendarTahun,
    next_bulan: nextBulan,
    next_tahun: nextYear
  };
}

/**
 * Helper V6.2: Kompresi 1 Foto ke Base64 JPEG Ringan (Fail-Safe)
 * Menolak secara eksplisit jika file tidak valid agar tidak mengirim data kosong ke server
 */
export function compressImageToBase64(file, maxWidth = 900, quality = 0.76) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File gambar tidak ditemukan.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      if (!rawDataUrl || !rawDataUrl.startsWith('data:image')) {
        reject(new Error(`File "${file.name || 'gambar'}" bukan format gambar yang didukung.`));
        return;
      }

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
          if (compressedDataUrl && compressedDataUrl.length > 50) {
            resolve(compressedDataUrl);
          } else {
            resolve(rawDataUrl);
          }
        } catch (canvasErr) {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => {
        // Fallback hanya jika rawDataUrl valid (misal format HEIC/WebP tertentu)
        if (rawDataUrl.startsWith('data:image') && rawDataUrl.length > 50) {
          resolve(rawDataUrl);
        } else {
          reject(new Error(`Gagal memproses gambar "${file.name || ''}".`));
        }
      };
      img.src = rawDataUrl;
    };

    reader.onerror = () => reject(new Error(`Gagal membaca file "${file.name || ''}".`));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper V6.2: Kompresi Multi-Foto Sekaligus (Default Maksimal 5 Foto untuk Laporan Security)
 */
export async function compressMultipleImagesToBase64(
  fileList,
  maxFiles = 5,
  maxWidth = 720,
  quality = 0.72
) {
  const filesArray = Array.from(fileList || []).slice(0, maxFiles);
  const results = [];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const base64 = await compressImageToBase64(file, maxWidth, quality);
    results.push({
      id: `photo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name || `foto_${i + 1}.jpg`,
      base64,
      sizeKb: Math.round((base64.length * 3) / 4 / 1024)
    });
  }

  return results;
}

function assertGasUrlReady() {
  if (!GAS_WEBAPP_URL || GAS_WEBAPP_URL.includes('TEMPEL_LINK_EXEC')) {
    throw new Error('VITE_GAS_WEBAPP_URL (/exec) belum diatur di Vercel Environment Variables atau file .env.');
  }
}

async function parseGasResponse(response) {
  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: Gagal terhubung ke server GAS.`);
  }
  try {
    return JSON.parse(rawText);
  } catch (parseErr) {
    throw new Error('Respon server GAS tidak valid. Pastikan deployment Web App aktif (Anyone) & URL /exec benar.');
  }
}

async function requestGasGet(params = {}) {
  assertGasUrlReady();
  const url = new URL(GAS_WEBAPP_URL);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  // Anti-cache agar saldo, mutasi, log security, & slot parkir selalu sinkron real-time
  url.searchParams.append('_t', String(Date.now()));

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow'
  });
  return parseGasResponse(response);
}

async function requestGasPost(actionName, payload = {}) {
  assertGasUrlReady();
  const token = localStorage.getItem('cmoney_pengurus_token') || '';

  // Kunci `action` di posisi terakhir agar tidak pernah tertimpa oleh isi payload
  const bodyData = {
    ...payload,
    action: actionName,
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

  return parseGasResponse(response);
}

export const CMoneyAPI = {
  // 1. Ambil seluruh data Dashboard Publik, Kalender Security, Log & Denah Parkir (Tanpa Login)
  async getPublicDashboard(bulan = 'November', tahun = 2026) {
    if (BACKEND_PROVIDER === 'gas') {
      return requestGasGet({ action: 'dashboard', bulan, tahun });
    }
    throw new Error('Provider backend belum didukung.');
  },

  // 2. Login 1 Akun Pengurus (Tanpa Gmail)
  async loginPengurus(username, password) {
    const res = await requestGasPost('login_pengurus', {
      username,
      password
    });
    if (res && res.status === 'success' && res.user?.session_token) {
      localStorage.setItem('cmoney_pengurus_token', res.user.session_token);
    }
    return res;
  },

  // 3. Input Transaksi Kas Masuk / Keluar / Proyek + Foto Bukti (Pengurus — Fail-Safe)
  async inputTransaction(txData) {
    return requestGasPost('input_ledger', txData);
  },

  // 4. Update Status Lunas IPL Warga + Auto-Jurnal + Foto Bukti (Pengurus — Fail-Safe)
  async updateIplStatus(iplData) {
    return requestGasPost('update_ipl', iplData);
  },

  // 5. Unggah Konfirmasi Bukti Bayar QRIS oleh Warga ke Bukti_Iuran_Warga (Tanpa Login)
  async uploadIplProof(proofData) {
    return requestGasPost('upload_ipl_proof', proofData);
  },

  // 6. Input Gaji & Kasbon Security (Pengurus)
  async inputPayroll(payrollData) {
    return requestGasPost('input_payroll', payrollData);
  },

  // 7. Tutup Buku Bulanan & Auto-Send WA Grup via Fonnte (Pengurus)
  async closeMonthAndSendWa(periode_bulan, periode_tahun = 2026, target_wa = '') {
    return requestGasPost('close_month_and_send_wa', {
      periode_bulan,
      periode_tahun,
      target_wa
    });
  },

  // 8. Simpan Laporan Pos, Paket, & Multi-Foto (maks 5) oleh Security (Tanpa Login)
  async inputSecurityLog(logData) {
    return requestGasPost('input_security_log', logData);
  },

  // 9. Update Jadwal Kalender Security
  async updateSecuritySchedule(scheduleData) {
    return requestGasPost('update_security_schedule', scheduleData);
  },

  // 10. Check-In / Check-Out Denah 6 Slot Parkir Fasum oleh Security (Tanpa Login)
  async updateParkingSlot(slotData) {
    return requestGasPost('update_parking_slot', slotData);
  }
};