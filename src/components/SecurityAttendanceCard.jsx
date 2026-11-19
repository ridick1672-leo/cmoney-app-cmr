import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const OFFICERS = ['Pak Eko', 'Pak Mulyadi'];
const CUACA_OPTIONS = ['Cerah', 'Mendung', 'Gerimis', 'Hujan', 'Panas'];
const DAY_NAMES_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Konversi tautan Google Drive menjadi URL gambar langsung untuk avatar & bottom sheet
 */
function toDirectDriveImageUrl(rawUrl) {
  if (!rawUrl || rawUrl === '-') return '';
  const firstUrl = String(rawUrl).split('|')[0].trim();
  if (!firstUrl || firstUrl === '-') return '';
  if (firstUrl.startsWith('data:image') || firstUrl.startsWith('/assets/')) return firstUrl;

  const matchId =
    firstUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    firstUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (matchId && matchId[1]) {
    return `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w800`;
  }
  return firstUrl;
}

function getInitials(name) {
  const clean = String(name || 'SC')
    .replace(/^Pak\s+/i, '')
    .trim();
  if (!clean) return 'SC';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function getLocalDateStr(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLocalTimeStr(dateObj = new Date()) {
  const h = String(dateObj.getHours()).padStart(2, '0');
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatIndoShortDate(dateStr) {
  if (!dateStr) return '-';
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(dt.getTime())) return dateStr;
  return `${DAY_NAMES_SHORT[dt.getDay()]}, ${dt.getDate()} ${MONTH_NAMES_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}

function getGreetingByHour(hour) {
  if (hour >= 4 && hour < 11) return 'selamat pagi';
  if (hour >= 11 && hour < 15) return 'selamat siang';
  if (hour >= 15 && hour < 18) return 'selamat sore';
  return 'selamat malam';
}

function parseLogTimestamp(log) {
  if (!log) return 0;
  const tgl = String(log.tanggal || '').slice(0, 10);
  const jam = String(log.jam || '00:00').slice(0, 5);
  if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    const [y, m, d] = tgl.split('-').map(Number);
    const [hh, mm] = jam.split(':').map(n => Number(n) || 0);
    const dt = new Date(y, m - 1, d, hh, mm, 0);
    if (!Number.isNaN(dt.getTime())) return dt.getTime();
  }
  const fallback = Date.parse(log.created_at || '');
  return Number.isNaN(fallback) ? 0 : fallback;
}

function detectAttendanceActionType(log) {
  const sub = String(log?.sub_kategori || '').toLowerCase();
  const det = String(log?.detail_catatan || '').toLowerCase();
  if (
    sub.includes('keluar') ||
    sub.includes('check_out') ||
    sub.includes('check-out') ||
    sub.includes('balik kanan') ||
    sub.includes('tutup pos')
  ) {
    return 'CHECK_OUT';
  }
  if (sub.includes('tukar') || det.includes('tukar shift')) {
    return 'TUKAR_SHIFT';
  }
  return 'CHECK_IN';
}

async function copyTextSafe(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // Fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

/**
 * Kompresi gambar ringan (maks lebar 640px, JPEG 0.72 -> ~40-70KB)
 * untuk unggahan cepat via endpoint V6.3
 */
function compressImageFileLight(file, maxWidth = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto dari kamera HP.'));
    reader.onload = ev => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format foto tidak dapat diproses.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / (img.width || maxWidth));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round((img.width || maxWidth) * scale);
        canvas.height = Math.round((img.height || maxWidth) * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function AvatarThumb({ photoUrl, name, sizeClass = 'w-11 h-11', onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const directUrl = useMemo(() => toDirectDriveImageUrl(photoUrl), [photoUrl]);

  useEffect(() => {
    setImgErr(false);
  }, [directUrl]);

  if (directUrl && !imgErr) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sizeClass} rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400`}
        title="Lihat detail foto absen"
      >
        <img
          src={directUrl}
          alt={name || 'Foto Security'}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sizeClass} rounded-full bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-300/70`}
      title={name || 'Petugas Security'}
    >
      {getInitials(name)}
    </button>
  );
}

function GreenCheckBadge() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shrink-0">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.415l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 111.415-1.415l2.543 2.543 6.542-6.543a1 1 0 011.415 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function RedCrossBadge() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white shrink-0">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
        <path
          fillRule="evenodd"
          d="M5.293 5.293a1 1 0 011.414 0L10 8.586l3.293-3.293a1 1 0 111.414 1.414L11.414 10l3.293 3.293a1 1 0 01-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export default function SecurityAttendanceCard({
  securityLogs = [],
  securitySchedules = [],
  waitingPackagesCount = 0,
  onInputSecurityLog,
  onOpenLightbox
}) {
  const [nowTick, setNowTick] = useState(() => new Date());
  const [showHistory, setShowHistory] = useState(true);
  const [detailLog, setDetailLog] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [lastSavedWa, setLastSavedWa] = useState(null);

  // State Kamera & Rekam Waktu
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [cameraError, setCameraError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('Pak Eko');
  const [attendanceType, setAttendanceType] = useState('CHECK_IN'); // CHECK_IN | TUKAR_SHIFT | CHECK_OUT
  const [selectedCuaca, setSelectedCuaca] = useState('Cerah');
  const [optionalNote, setOptionalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  // Perbarui jam tiap 30 detik agar tanggal & deteksi shift selalu akurat
  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => getLocalDateStr(nowTick), [nowTick]);
  const currentHour = nowTick.getHours();

  // Baca jadwal hari ini dari sheet security_schedules
  const todaySchedule = useMemo(() => {
    const found = (securitySchedules || []).find(
      s => String(s.tanggal || '').slice(0, 10) === todayStr
    );
    if (found) return found;

    // Fallback ringan jika tanggal di luar tabel spreadsheet
    const dayIdx = nowTick.getDay(); // 5 = Jumat, 6 = Sabtu
    return {
      tanggal: todayStr,
      shift_pagi: 'Pak Eko',
      shift_malam: dayIdx === 5 || dayIdx === 6 ? 'MALAM_LIBUR' : 'Pak Mulyadi',
      status_jadwal: dayIdx === 5 || dayIdx === 6 ? 'MALAM_LIBUR' : 'NORMAL'
    };
  }, [securitySchedules, todayStr, nowTick]);

  // Tentukan shift terjadwal aktif berdasarkan jam sekarang & status malam libur
  const scheduledShiftInfo = useMemo(() => {
    const isMalamLibur =
      String(todaySchedule.status_jadwal || '').toUpperCase().includes('LIBUR') ||
      String(todaySchedule.shift_malam || '').toUpperCase().includes('LIBUR') ||
      todaySchedule.shift_malam === '-';

    if (isMalamLibur) {
      return {
        shiftCode: 'Tunggal',
        shiftLabel: 'Shift Tunggal [07:15 - 21:00]',
        shiftShort: 'Shift Tunggal 07:15–21:00',
        scheduledOfficer: todaySchedule.shift_pagi || 'Pak Eko',
        isMalamLibur: true
      };
    }

    // Jam 06:30 - 18:59 -> Pagi | 19:00 - 06:29 -> Malam
    const isNightWindow = currentHour >= 19 || currentHour < 7;
    if (isNightWindow) {
      return {
        shiftCode: 'Malam',
        shiftLabel: 'Shift Malam [20:00 - 08:00]',
        shiftShort: 'Shift Malam 20:00–08:00',
        scheduledOfficer: todaySchedule.shift_malam || 'Pak Mulyadi',
        isMalamLibur: false
      };
    }

    return {
      shiftCode: 'Pagi',
      shiftLabel: 'Shift Pagi [08:00 - 20:00]',
      shiftShort: 'Shift Pagi 08:00–20:00',
      scheduledOfficer: todaySchedule.shift_pagi || 'Pak Eko',
      isMalamLibur: false
    };
  }, [todaySchedule, currentHour]);

  // Saring khusus log ABSEN_SHIFT dan urutkan terbaru di atas
  const attendanceLogs = useMemo(() => {
    return (securityLogs || [])
      .filter(log => String(log.kategori_laporan || '').toUpperCase() === 'ABSEN_SHIFT')
      .sort((a, b) => parseLogTimestamp(b) - parseLogTimestamp(a));
  }, [securityLogs]);

  // Cari pasangan Jam Masuk & Jam Keluar untuk jendela shift aktif (maks 14 jam ke belakang agar mendukung Shift Malam lintas hari)
  const activeShiftRecord = useMemo(() => {
    const nowMs = nowTick.getTime();
    const windowMs = 14 * 60 * 60 * 1000;
    const recentLogs = attendanceLogs.filter(log => {
      const ts = parseLogTimestamp(log);
      const isToday = String(log.tanggal || '').slice(0, 10) === todayStr;
      return isToday || (ts > 0 && nowMs - ts <= windowMs && nowMs - ts >= -60 * 60 * 1000);
    });

    const latestCheckIn = recentLogs.find(log => {
      const t = detectAttendanceActionType(log);
      return t === 'CHECK_IN' || t === 'TUKAR_SHIFT';
    }) || null;

    let matchingCheckOut = null;
    if (latestCheckIn) {
      const checkInTs = parseLogTimestamp(latestCheckIn);
      matchingCheckOut = recentLogs.find(log => {
        const t = detectAttendanceActionType(log);
        const ts = parseLogTimestamp(log);
        return t === 'CHECK_OUT' && ts >= checkInTs;
      }) || null;
    } else {
      matchingCheckOut = recentLogs.find(log => detectAttendanceActionType(log) === 'CHECK_OUT') || null;
    }

    const activeOfficer = latestCheckIn
      ? latestCheckIn.nama_security || scheduledShiftInfo.scheduledOfficer
      : scheduledShiftInfo.scheduledOfficer;

    const isTukarShiftLive = latestCheckIn
      ? detectAttendanceActionType(latestCheckIn) === 'TUKAR_SHIFT' ||
        String(latestCheckIn.nama_security || '').toLowerCase() !==
          String(scheduledShiftInfo.scheduledOfficer || '').toLowerCase()
      : false;

    const isCurrentlyOnDuty = Boolean(latestCheckIn && !matchingCheckOut);

    return {
      checkInLog: latestCheckIn,
      checkOutLog: matchingCheckOut,
      activeOfficer,
      isTukarShiftLive,
      isCurrentlyOnDuty
    };
  }, [attendanceLogs, nowTick, todayStr, scheduledShiftInfo]);

  // Helper stop kamera
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  // Nyalakan kamera saat layar Rekam Waktu dibuka
  const startCameraStream = useCallback(async mode => {
    stopCameraStream();
    setCameraError('');
    setIsCameraReady(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser ini tidak mendukung kamera live langsung. Gunakan tombol Kamera HP di bawah.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 720 },
          height: { ideal: 960 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsCameraReady(true);
      }
    } catch (err) {
      setCameraError(
        'Izin kamera belum aktif atau dibatasi browser. Silakan izinkan kamera atau klik tombol Kamera HP di bawah.'
      );
    }
  }, [stopCameraStream]);

  useEffect(() => {
    if (isCameraOpen && !capturedPhoto) {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [isCameraOpen, capturedPhoto, facingMode, startCameraStream, stopCameraStream]);

  // Buka layar Rekam Waktu dengan pilihan otomatis cerdas (tanpa dropdown panjang)
  const handleOpenRecorder = () => {
    const defaultOfficer = activeShiftRecord.isCurrentlyOnDuty
      ? activeShiftRecord.activeOfficer
      : scheduledShiftInfo.scheduledOfficer;

    const cleanOfficer = OFFICERS.includes(defaultOfficer) ? defaultOfficer : OFFICERS[0];
    setSelectedOfficer(cleanOfficer);
    setAttendanceType(activeShiftRecord.isCurrentlyOnDuty ? 'CHECK_OUT' : 'CHECK_IN');
    setSelectedCuaca('Cerah');
    setOptionalNote('');
    setCapturedPhoto('');
    setSubmitError('');
    setIsCameraOpen(true);
  };

  const handleCloseRecorder = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedPhoto('');
    setSubmitError('');
  };

  // Jika petugas mengetuk nama berbeda dari jadwal saat posisi masuk -> otomatis jadi Tukar Shift
  const handleSelectOfficer = name => {
    setSelectedOfficer(name);
    if (attendanceType !== 'CHECK_OUT') {
      const isDifferentFromSchedule =
        String(name).toLowerCase() !== String(scheduledShiftInfo.scheduledOfficer || '').toLowerCase();
      setAttendanceType(isDifferentFromSchedule ? 'TUKAR_SHIFT' : 'CHECK_IN');
    }
  };

  // Jepret foto dari live video canvas
  const handleCaptureFromVideo = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setSubmitError('Kamera belum siap. Tunggu 1 detik atau gunakan tombol Kamera HP.');
      return;
    }

    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    setCapturedPhoto(dataUrl);
    setSubmitError('');
    stopCameraStream();
  };

  // Cadangan kamera bawaan HP (input file capture)
  const handleFallbackFileChange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileLight(file, 640, 0.72);
      setCapturedPhoto(compressed);
      setSubmitError('');
      stopCameraStream();
    } catch (err) {
      setSubmitError(err.message || 'Gagal memproses foto dari kamera HP.');
    } finally {
      e.target.value = '';
    }
  };

  // Generator Teks WA Siap Copas konsisten tren pos CMR
  const buildAttendanceWaText = (officer, type, cuaca, noteText, dateStr, timeStr) => {
    const hourNow = Number(String(timeStr).split(':')[0] || new Date().getHours());
    const salam = getGreetingByHour(hourNow);
    const shortDate = formatIndoShortDate(dateStr);
    const otherOfficer = OFFICERS.find(o => o !== officer) || 'Petugas Shift Sebelumnya';
    const paketText = waitingPackagesCount > 0 ? `${waitingPackagesCount} paket` : 'Nihil';
    const extraLine = noteText && noteText.trim() ? `\n• Catatan Pos: ${noteText.trim()}` : '';

    if (type === 'CHECK_OUT') {
      const gerbangNote = scheduledShiftInfo.isMalamLibur
        ? 'Situasi aman kondusif tanpa taruna, gerbang cluster ditutup sesuai SOP malam libur.'
        : 'Situasi aman kondusif tanpa taruna, serah terima pos selesai & pintu gerbang kecil sesuai SOP.';
      return (
        `*Assalamualaikum, ${salam}.*\n` +
        `Izin lapor *Jam Keluar / Balik Kanan* petugas jaga pos CMR pukul *${timeStr} WIB* (${shortDate}):\n` +
        `• Petugas: *${officer}* (${scheduledShiftInfo.shiftShort} selesai)\n` +
        `• Status Pos & Gerbang: ${gerbangNote}\n` +
        `• Titipan Paket di Pos: *${paketText}*\n` +
        `• Cuaca 815: *${cuaca}*${extraLine}\n` +
        `Izin balik kanan, 86 terima kasih 🙏🫡`
      );
    }

    if (type === 'TUKAR_SHIFT') {
      const replacedName =
        scheduledShiftInfo.scheduledOfficer && scheduledShiftInfo.scheduledOfficer !== officer
          ? scheduledShiftInfo.scheduledOfficer
          : otherOfficer;
      return (
        `*Assalamualaikum, ${salam}.*\n` +
        `Izin lapor absen *Tukar Shift* jaga pos CMR pukul *${timeStr} WIB* (${shortDate}):\n` +
        `• Petugas Masuk: *${officer}* _(menggantikan jadwal ${replacedName} — ${scheduledShiftInfo.shiftShort})_\n` +
        `• Status Pos & Gerbang: Situasi aman kondusif tanpa taruna, pintu gerbang kecil ditutup sesuai SOP.\n` +
        `• Titipan Paket di Pos: *${paketText}*\n` +
        `• Cuaca 815: *${cuaca}*${extraLine}\n` +
        `86, terima kasih 🙏🫡`
      );
    }

    return (
      `*Assalamualaikum, ${salam}.*\n` +
      `Izin lapor absen pergantian shift jaga pos CMR pukul *${timeStr} WIB* (${shortDate}):\n` +
      `• Petugas Masuk: *${officer}* (${scheduledShiftInfo.shiftShort})\n` +
      `• Serah Terima dari: *${otherOfficer}* (izin balik kanan)\n` +
      `• Status Pos & Gerbang: Situasi aman kondusif tanpa taruna, pintu gerbang kecil ditutup sesuai SOP.\n` +
      `• Titipan Paket di Pos: *${paketText}*\n` +
      `• Cuaca 815: *${cuaca}*${extraLine}\n` +
      `86, terima kasih 🙏🫡`
    );
  };

  // Simpan absensi ke Code.gs V6.3 (input_security_log -> Fail-Safe Drive + Sheet security_logs)
  const handleSaveAttendance = async () => {
    if (!capturedPhoto) {
      setSubmitError('Ambil foto selfie terlebih dahulu sebelum menyimpan absen.');
      return;
    }
    if (typeof onInputSecurityLog !== 'function') {
      setSubmitError('Handler simpan log tidak terhubung.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const now = new Date();
      const dateStr = getLocalDateStr(now);
      const timeStr = getLocalTimeStr(now);
      const waText = buildAttendanceWaText(
        selectedOfficer,
        attendanceType,
        selectedCuaca,
        optionalNote,
        dateStr,
        timeStr
      );

      const subKategoriLabel =
        attendanceType === 'CHECK_OUT'
          ? `Jam Keluar / Balik Kanan (${scheduledShiftInfo.shiftCode})`
          : attendanceType === 'TUKAR_SHIFT'
          ? `Tukar Shift — Masuk (${scheduledShiftInfo.shiftCode})`
          : `Absen Masuk (${scheduledShiftInfo.shiftCode})`;

      const detailCatatan =
        optionalNote.trim() ||
        (attendanceType === 'TUKAR_SHIFT'
          ? `Tukar shift menggantikan ${scheduledShiftInfo.scheduledOfficer} (${scheduledShiftInfo.shiftShort}).`
          : attendanceType === 'CHECK_OUT'
          ? `Selesai tugas ${scheduledShiftInfo.shiftShort}, izin balik kanan.`
          : `Absen masuk ${scheduledShiftInfo.shiftShort}, situasi pos aman kondusif.`);

      const payload = {
        tanggal: dateStr,
        jam: timeStr,
        nama_security: selectedOfficer,
        shift: scheduledShiftInfo.shiftCode,
        kategori_laporan: 'ABSEN_SHIFT',
        sub_kategori: subKategoriLabel,
        house_id: '-',
        nama_warga_tujuan: '-',
        titik_patroli: 'Pos Utama Security',
        cuaca_815: selectedCuaca,
        status_gerbang: scheduledShiftInfo.isMalamLibur && attendanceType === 'CHECK_OUT'
          ? 'Gerbang Cluster Ditutup (SOP Malam Libur)'
          : 'Pintu Gerbang Kecil Ditutup Sesuai SOP',
        detail_catatan: detailCatatan,
        teks_wa: waText,
        expect_photo: true,
        file_name: `Absen_${selectedOfficer.replace(/\s+/g, '_')}_${dateStr}_${timeStr.replace(':', '')}.jpg`,
        file_base64: capturedPhoto,
        files_base64: [
          {
            base64: capturedPhoto,
            name: `Absen_${selectedOfficer.replace(/\s+/g, '_')}_${dateStr}_${timeStr.replace(':', '')}.jpg`
          }
        ]
      };

      const res = await onInputSecurityLog(payload);
      const isFailed =
        res === false ||
        (res && typeof res === 'object' && (res.status === 'error' || res.ok === false));

      if (isFailed) {
        throw new Error(res?.message || 'Gagal menyimpan absensi ke server. Silakan coba lagi.');
      }

      // Sukses tersimpan -> otomatis salin teks WA & tampilkan kotak hijau siap tempel
      await copyTextSafe(waText);
      setLastSavedWa({
        text: waText,
        officer: selectedOfficer,
        time: timeStr,
        typeLabel: subKategoriLabel
      });
      setIsCameraOpen(false);
      setCapturedPhoto('');
    } catch (err) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat menyimpan absen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWa = async (text, keyId) => {
    if (!text || text === '-') return;
    await copyTextSafe(text);
    setCopiedId(keyId);
    setTimeout(() => setCopiedId(''), 2200);
  };

  const recentHistoryLogs = useMemo(() => attendanceLogs.slice(0, 5), [attendanceLogs]);

  return (
    <div className="space-y-4">
      {/* Header Status Petugas Jaga Live (Ala Header Profil GreatDay) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarThumb
            photoUrl={activeShiftRecord.checkInLog?.url_foto}
            name={activeShiftRecord.activeOfficer}
            sizeClass="w-12 h-12"
            onClick={() => activeShiftRecord.checkInLog && setDetailLog(activeShiftRecord.checkInLog)}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-bold text-slate-900 truncate">
                {activeShiftRecord.activeOfficer}
              </p>
              {activeShiftRecord.isCurrentlyOnDuty ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sedang Berjaga
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Sesuai Jadwal
                </span>
              )}
              {activeShiftRecord.isTukarShiftLive && (
                <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Tukar Shift
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              SECURITY POS CMR • {scheduledShiftInfo.shiftShort.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[11px] text-slate-400">Paket di Pos</p>
          <p className="text-xs font-bold text-slate-700">
            {waitingPackagesCount > 0 ? `${waitingPackagesCount} Paket` : 'Nihil'}
          </p>
        </div>
      </div>

      {/* Kotak Hijau Teks WA Siap Copas (Otomatis Muncul Setelah Check-In / Keluar) */}
      {lastSavedWa && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-emerald-800">
                ✅ Absen Tercatat & Teks WA Tersalin Otomatis
              </p>
              <p className="text-[11px] text-emerald-700">
                {lastSavedWa.officer} • {lastSavedWa.typeLabel} ({lastSavedWa.time} WIB)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastSavedWa(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 px-2 py-1"
            >
              ✕
            </button>
          </div>
          <pre className="text-xs text-slate-700 bg-white/90 border border-emerald-200/80 rounded-xl p-3 whitespace-pre-wrap font-sans leading-relaxed">
            {lastSavedWa.text}
          </pre>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyWa(lastSavedWa.text, 'latest_wa')}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              {copiedId === 'latest_wa' ? '✓ Berhasil Disalin! Tempel ke Grup WA' : '📋 Salin Ulang Teks WA'}
            </button>
          </div>
        </div>
      )}

      {/* Kartu Absensi Utama (Desain GreatDay: Tanggal, Jam Masuk/Keluar, Rekam Waktu, Riwayat Lipat) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Bar Tanggal & Shift Aktif */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">
              Hari ini ({formatIndoShortDate(todayStr)})
            </p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {scheduledShiftInfo.shiftLabel}
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
            Tanpa GPS • Foto
          </span>
        </div>

        {/* 2 Kolom Jam Masuk & Jam Keluar */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 px-4 py-4">
          {/* Kolom Kiri: Jam Masuk */}
          <div className="flex items-center gap-3 pr-2">
            <AvatarThumb
              photoUrl={activeShiftRecord.checkInLog?.url_foto}
              name={activeShiftRecord.checkInLog?.nama_security || activeShiftRecord.activeOfficer}
              sizeClass="w-11 h-11"
              onClick={() => activeShiftRecord.checkInLog && setDetailLog(activeShiftRecord.checkInLog)}
            />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Jam Masuk</p>
              {activeShiftRecord.checkInLog ? (
                <button
                  type="button"
                  onClick={() => setDetailLog(activeShiftRecord.checkInLog)}
                  className="flex items-center gap-1.5 mt-0.5 text-left group"
                >
                  <span className="text-lg font-extrabold text-emerald-600 group-hover:underline tracking-tight">
                    {String(activeShiftRecord.checkInLog.jam || '--:--').slice(0, 5)}
                  </span>
                  <GreenCheckBadge />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-slate-400 tracking-wider">--:--</span>
                  <RedCrossBadge />
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Jam Keluar */}
          <div className="flex items-center gap-3 pl-3">
            <AvatarThumb
              photoUrl={activeShiftRecord.checkOutLog?.url_foto}
              name={activeShiftRecord.checkOutLog?.nama_security || activeShiftRecord.activeOfficer}
              sizeClass="w-11 h-11"
              onClick={() => activeShiftRecord.checkOutLog && setDetailLog(activeShiftRecord.checkOutLog)}
            />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Jam Keluar</p>
              {activeShiftRecord.checkOutLog ? (
                <button
                  type="button"
                  onClick={() => setDetailLog(activeShiftRecord.checkOutLog)}
                  className="flex items-center gap-1.5 mt-0.5 text-left group"
                >
                  <span className="text-lg font-extrabold text-emerald-600 group-hover:underline tracking-tight">
                    {String(activeShiftRecord.checkOutLog.jam || '--:--').slice(0, 5)}
                  </span>
                  <GreenCheckBadge />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-slate-400 tracking-wider">--:--</span>
                  <RedCrossBadge />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Utama Oranye: Rekam Waktu */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleOpenRecorder}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Rekam Waktu</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Jadwal bulan lengkap dikelola di Spreadsheet • Klik jam hijau untuk lihat bukti foto & salin WA
          </p>
        </div>

        {/* Daftar Riwayat Absen Terakhir (Dapat Dilipat) */}
        {showHistory && (
          <div className="border-t border-slate-100 px-4 py-2 divide-y divide-slate-100">
            {recentHistoryLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Belum ada riwayat absen tercatat.
              </p>
            ) : (
              recentHistoryLogs.map(log => {
                const actionType = detectAttendanceActionType(log);
                return (
                  <button
                    key={log.id || `${log.tanggal}-${log.jam}-${log.nama_security}`}
                    type="button"
                    onClick={() => setDetailLog(log)}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition rounded-lg px-1"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarThumb
                        photoUrl={log.url_foto}
                        name={log.nama_security}
                        sizeClass="w-10 h-10"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-600 truncate">
                          {formatIndoShortDate(log.tanggal)} •{' '}
                          <span className="font-bold text-slate-800">{log.nama_security}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {String(log.jam || '--:--').slice(0, 5)}
                          </span>
                          <GreenCheckBadge />
                          {actionType === 'TUKAR_SHIFT' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Tukar Shift
                            </span>
                          )}
                          {actionType === 'CHECK_OUT' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              Keluar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs shrink-0">
                      <span>Tercatat</span>
                      <span className="text-slate-400 text-sm">›</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Footer Toggle: Sembunyikan Detail / Tampilkan Detail */}
        <button
          type="button"
          onClick={() => setShowHistory(prev => !prev)}
          className="w-full py-3 border-t border-slate-100 text-xs font-semibold text-amber-600 hover:bg-amber-50/40 transition flex items-center justify-center gap-1"
        >
          <span>{showHistory ? 'Sembunyikan Detail' : 'Tampilkan Riwayat Absen'}</span>
          <span>{showHistory ? '⌃' : '⌄'}</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* POP-UP BOTTOM SHEET DETAIL JAM HIJAU (Persis Referensi GreatDay)     */}
      {/* ==================================================================== */}
      {detailLog && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setDetailLog(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-6 shadow-2xl space-y-4 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />

            <div className="flex gap-4 items-start">
              {/* Foto Selfie Vertikal Kiri */}
              <div className="w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                {toDirectDriveImageUrl(detailLog.url_foto) ? (
                  <img
                    src={toDirectDriveImageUrl(detailLog.url_foto)}
                    alt={detailLog.nama_security}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      if (typeof onOpenLightbox === 'function') {
                        onOpenLightbox(
                          detailLog.photo_urls?.length ? detailLog.photo_urls : [detailLog.url_foto],
                          `Absen ${detailLog.nama_security} (${detailLog.tanggal} ${detailLog.jam})`
                        );
                      }
                    }}
                  />
                ) : (
                  <div className="text-center p-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center mx-auto mb-1">
                      {getInitials(detailLog.nama_security)}
                    </div>
                    <p className="text-[10px] text-slate-400">Tanpa Foto</p>
                  </div>
                )}
              </div>

              {/* Info Detail Kanan */}
              <div className="flex-1 min-w-0 space-y-2.5 pt-1">
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {formatIndoShortDate(detailLog.tanggal)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xl font-extrabold text-emerald-600">
                      {String(detailLog.jam || '--:--').slice(0, 5)}
                    </span>
                    <GreenCheckBadge />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                    Tercatat
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                  <p className="font-bold text-slate-800">{detailLog.nama_security}</p>
                  <p>{detailLog.sub_kategori || `Shift ${detailLog.shift || '-'}`}</p>
                  {detailLog.cuaca_815 && (
                    <p className="text-slate-500">Cuaca 815: {detailLog.cuaca_815}</p>
                  )}
                </div>
              </div>
            </div>

            {detailLog.detail_catatan && detailLog.detail_catatan !== '-' && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3">
                {detailLog.detail_catatan}
              </p>
            )}

            {/* Tombol Copas WA & Tutup */}
            <div className="flex items-center gap-2 pt-1">
              {detailLog.teks_wa && detailLog.teks_wa !== '-' && (
                <button
                  type="button"
                  onClick={() => handleCopyWa(detailLog.teks_wa, `detail_${detailLog.id}`)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  {copiedId === `detail_${detailLog.id}`
                    ? '✓ Teks WA Disalin!'
                    : '📋 Salin Teks WA'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailLog(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LAYAR KAMERA LIVE FULLSCREEN + SILUET KEPALA (Ala GreatDay)          */}
      {/* ==================================================================== */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
          {/* Bar Atas Kamera */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
            <button
              type="button"
              onClick={handleCloseRecorder}
              disabled={isSubmitting}
              className="p-2 -ml-2 text-white hover:text-amber-400 transition"
              aria-label="Kembali"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <p className="text-base font-extrabold tracking-tight">C-Money Absen</p>
              <p className="text-[10px] text-slate-400">{scheduledShiftInfo.shiftShort}</p>
            </div>

            <button
              type="button"
              disabled={isSubmitting || Boolean(capturedPhoto)}
              onClick={() => setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40"
            >
              <span>{facingMode === 'user' ? 'Cam 1' : 'Cam 2'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h3l2-2h6l2 2h3v12H4V7z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          </div>

          {/* Area Viewfinder Kamera / Pratinjau Hasil Jepret */}
          <div className="relative flex-1 bg-neutral-950 overflow-hidden flex items-center justify-center">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Pratinjau Selfie Absen"
                className="w-full h-full object-contain bg-black"
              />
            ) : cameraError ? (
              <div className="px-6 text-center max-w-sm space-y-4">
                <p className="text-sm text-amber-300 font-medium">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
                >
                  📷 Buka Kamera Bawaan HP
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                {/* Garis Pandu Siluet Kepala & Bahu (Persis Referensi) */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <svg
                    viewBox="0 0 300 360"
                    fill="none"
                    className="w-full max-w-[290px] h-auto opacity-80 drop-shadow"
                  >
                    <path
                      d="M150 42 C104 42 84 82 86 126 C77 128 74 142 78 156 C81 165 86 168 90 169 C96 196 112 214 114 226 C115 236 105 244 86 250 C48 262 20 282 14 316 L14 330 M150 42 C196 42 216 82 214 126 C223 128 226 142 222 156 C219 165 214 168 210 169 C204 196 188 214 186 226 C185 236 195 244 214 250 C252 262 280 282 286 316 L286 330"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {!isCameraReady && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <p className="text-xs text-slate-300 animate-pulse">Menyiapkan kamera...</p>
                  </div>
                )}
              </>
            )}

            {/* Input File Cadangan (Hidden) */}
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFallbackFileChange}
              className="hidden"
            />
          </div>

          {/* Panel Kontrol Cepat 1-Tap (Tanpa Dropdown Panjang) */}
          <div className="bg-neutral-950/95 border-t border-white/10 px-4 pt-3 pb-4 space-y-2.5 shrink-0">
            {/* Baris 1: Nama Petugas & Tipe Absen */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {OFFICERS.map(name => (
                  <button
                    key={name}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectOfficer(name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      selectedOfficer === name
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {[
                  { id: 'CHECK_IN', label: 'Masuk' },
                  { id: 'TUKAR_SHIFT', label: 'Tukar Shift' },
                  { id: 'CHECK_OUT', label: 'Keluar' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setAttendanceType(t.id)}
                    className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition ${
                      attendanceType === t.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Baris 2: Cuaca 815 1-Tap */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] text-slate-400 shrink-0">815:</span>
              {CUACA_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedCuaca(c)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition ${
                    selectedCuaca === c
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Catatan opsional hanya saat sudah jepret (tidak mengganggu tampilan kamera) */}
            {capturedPhoto && (
              <input
                type="text"
                value={optionalNote}
                onChange={e => setOptionalNote(e.target.value)}
                disabled={isSubmitting}
                placeholder="Catatan serah terima (opsional, boleh kosong)..."
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
            )}

            {submitError && (
              <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2">
                ⚠️ {submitError}
              </p>
            )}

            {/* Baris Bawah: Tombol Shutter / Tombol Simpan */}
            {!capturedPhoto ? (
              <div className="flex items-center justify-between pt-1 px-4">
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="text-xs text-slate-300 hover:text-white px-2 py-2 rounded-lg bg-white/10"
                  title="Gunakan Kamera Bawaan HP"
                >
                  📷 HP
                </button>

                {/* Tombol Jepret Bulat Putih Besar (Persis Referensi) */}
                <button
                  type="button"
                  onClick={handleCaptureFromVideo}
                  disabled={!isCameraReady}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition disabled:opacity-40"
                  aria-label="Ambil Foto Selfie Absen"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M9 4l-1.5 2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-2.5L15 4H9zm3 5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                    </svg>
                  </div>
                </button>

                <div className="w-12 text-right text-[10px] text-slate-400">
                  {getLocalTimeStr(nowTick)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setCapturedPhoto('');
                    setSubmitError('');
                  }}
                  className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold disabled:opacity-40"
                >
                  Ulangi
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveAttendance}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? '⏳ Menyimpan Foto & Absen...'
                    : '✓ Simpan Absen & Buat Teks WA'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}