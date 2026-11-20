import React, { useState, useMemo, useEffect } from 'react';
import {
  CMoneyLogo,
  IconPillQris,
  IconClose,
  IconUpload,
  IconPhoto,
  IconDownload,
  IconAlert,
  IconPillCheck,
  IconClock
} from './CMoneyIcons';

/**
 * ============================================================================
 * C-MONEY V7 — QRIS PAYMENT BOTTOM SHEET (MOBILE) <-> 2-COLUMN MODAL (DESKTOP)
 * ============================================================================
 * - 100% kompatibel dengan Code.gs V6.3 (upload bukti opsional + fail-safe)
 * - Penyaringan otomatis 21 rumah aktif (mengunci unit Non-Aktif / BPR)
 * - Standarisasi identitas anti-bug "No. XX / Nama Warga"
 * - Otomatisasi bulan buku cut-off tanggal 25 + tombol Unduh QRIS & Salin Nominal
 */

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const PAYMENT_PACKAGES = [
  {
    id: 'IPL_ONLY',
    label: 'IPL Saja',
    nominal: 200000,
    desc: 'Iuran wajib bulanan'
  },
  {
    id: 'IPL_PARKIR_1',
    label: 'IPL + Parkir 1 Mobil',
    nominal: 350000,
    desc: 'IPL 200rb + 1 mobil'
  },
  {
    id: 'IPL_PARKIR_2',
    label: 'IPL + Parkir 2 Mobil',
    nominal: 500000,
    desc: 'IPL 200rb + 2 mobil'
  },
  {
    id: 'IPL_WEEKEND',
    label: 'IPL + Parkir Weekend',
    nominal: 250000,
    desc: 'IPL 200rb + weekend'
  }
];

const PARKING_ONLY_PRESETS = [
  { label: 'Member 1 Mobil', nominal: 150000 },
  { label: 'Weekend', nominal: 50000 },
  { label: 'Harian / Tamu', nominal: 10000 }
];

function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * Parser anti-bug: mencegah "No. No. 01" atau "undefined"
 */
function extractCleanHouseNum(house) {
  const raw = String(house?.nomor_rumah || house?.id || '').trim();
  const match = raw.match(/\d+/);
  if (match) return match[0].padStart(2, '0');
  return raw.replace(/^no\.?\s*/i, '') || '--';
}

function formatHouseIdentity(house) {
  if (!house) return '-';
  const num = extractCleanHouseNum(house);
  const name = String(house.nama_warga || house.nama_kepala_keluarga || '').trim();
  return name ? `No. ${num} / ${name}` : `No. ${num}`;
}

function isHouseInactive(house) {
  const st = String(house?.status_huni || house?.status || 'Aktif').toLowerCase();
  return (
    st.includes('tidak') ||
    st.includes('non') ||
    st.includes('kosong') ||
    st.includes('bpr') ||
    st.includes('dijual')
  );
}

/**
 * Menentukan periode buku otomatis berdasarkan tanggal cut-off (default tgl 25)
 */
function getSmartDefaultPeriod(fallbackMonth, fallbackYear, cutoffDay = 25) {
  if (fallbackMonth) {
    return {
      bulan: fallbackMonth,
      tahun: Number(fallbackYear) || new Date().getFullYear(),
      isNextMonthCutoff: false
    };
  }
  const now = new Date();
  let mIdx = now.getMonth();
  let year = now.getFullYear();
  let isNextMonthCutoff = false;

  if (now.getDate() >= Number(cutoffDay || 25)) {
    mIdx += 1;
    isNextMonthCutoff = true;
    if (mIdx > 11) {
      mIdx = 0;
      year += 1;
    }
  }
  return {
    bulan: MONTHS_ID[mIdx],
    tahun: year,
    isNextMonthCutoff
  };
}

/**
 * Kompresi gambar ringan mandiri (~80-120 KB JPEG) dengan fallback aman
 */
function compressProofImage(file, maxWidth = 960, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File gambar tidak ditemukan.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar dari perangkat.'));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      const img = new Image();
      img.onerror = () => {
        // Fallback aman: kirim data URL asli jika masih di bawah ~1.5 MB
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
          resolve(dataUrl);
        } else {
          reject(new Error('Format gambar tidak didukung. Gunakan JPG atau PNG.'));
        }
      };
      img.onload = () => {
        try {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          reject(new Error('Gagal memproses kompresi gambar.'));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function estimateBase64Kb(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const idx = dataUrl.indexOf('base64,');
  const raw = idx !== -1 ? dataUrl.slice(idx + 7) : dataUrl;
  return Math.max(1, Math.round((raw.length * 0.75) / 1024));
}

async function copyTextSafe(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // fallback di bawah
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

export default function QrisPaymentModal({
  isOpen = false,
  onClose,
  houses = [],
  selectedHouse = null,
  preselectedHouse = null,
  selectedMonth = '',
  defaultMonth = '',
  selectedYear = 2026,
  defaultYear = 2026,
  defaultIplAmount = 200000,
  cutoffDay = 25,
  qrisImageUrl = '/assets/qris-cmr-statis.png',
  qrisMerchantName = 'Cluster Mutiara Residence',
  qrisNmid = 'ID1026000000CMR',
  logoUrl = '/assets/logo-cmoney.png',
  onSubmitProof,
  onUploadIplProof,
  onConfirmQrisProof,
  onOpenLightbox
}) {
  // Saring hanya 21 rumah aktif (kunci unit non-aktif seperti No. 04 BPR)
  const activeHouses = useMemo(() => {
    return (houses || []).filter((h) => !isHouseInactive(h));
  }, [houses]);

  const targetPreselect = selectedHouse || preselectedHouse || null;

  const smartPeriod = useMemo(
    () =>
      getSmartDefaultPeriod(
        selectedMonth || defaultMonth,
        selectedYear || defaultYear,
        cutoffDay
      ),
    [selectedMonth, defaultMonth, selectedYear, defaultYear, cutoffDay]
  );

  // Paket pembayaran dinamis (menghormati defaultIplAmount dari database bila berubah)
  const packages = useMemo(() => {
    const baseIpl = Number(defaultIplAmount) || 200000;
    return PAYMENT_PACKAGES.map((pkg) => {
      if (pkg.id === 'IPL_ONLY') return { ...pkg, nominal: baseIpl };
      if (pkg.id === 'IPL_PARKIR_1') return { ...pkg, nominal: baseIpl + 150000 };
      if (pkg.id === 'IPL_PARKIR_2') return { ...pkg, nominal: baseIpl + 300000 };
      if (pkg.id === 'IPL_WEEKEND') return { ...pkg, nominal: baseIpl + 50000 };
      return pkg;
    });
  }, [defaultIplAmount]);

  const [houseId, setHouseId] = useState('');
  const [periodeBulan, setPeriodeBulan] = useState(smartPeriod.bulan);
  const [periodeTahun, setPeriodeTahun] = useState(smartPeriod.tahun);
  const [packageId, setPackageId] = useState('IPL_ONLY');
  const [nominal, setNominal] = useState(Number(defaultIplAmount) || 200000);
  const [catatan, setCatatan] = useState('');

  // State foto bukti opsional
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoKb, setPhotoKb] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);

  // State UI & status pengiriman
  const [qrisImgError, setQrisImgError] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Reset form saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const initialHouseId =
      targetPreselect?.id ||
      (activeHouses.length > 0 ? activeHouses[0].id : '');

    setHouseId(initialHouseId);
    setPeriodeBulan(smartPeriod.bulan);
    setPeriodeTahun(smartPeriod.tahun);
    setPackageId('IPL_ONLY');
    setNominal(Number(defaultIplAmount) || 200000);
    setCatatan('');
    setPhotoBase64('');
    setPhotoName('');
    setPhotoKb(0);
    setIsCompressing(false);
    setQrisImgError(false);
    setCopiedNominal(false);
    setErrorMsg('');
    setSuccessInfo(null);
  }, [isOpen, targetPreselect, activeHouses, smartPeriod, defaultIplAmount]);

  if (!isOpen) return null;

  const chosenHouse = activeHouses.find((h) => String(h.id) === String(houseId)) || activeHouses[0];

  const handleSelectPackage = (pkg) => {
    setPackageId(pkg.id);
    setNominal(pkg.nominal);
    setErrorMsg('');
  };

  const handleSelectCustomMode = () => {
    setPackageId('CUSTOM_PARKIR');
    setNominal(150000);
    setErrorMsg('');
  };

  const handleCopyNominal = async () => {
    const ok = await copyTextSafe(String(Number(nominal) || 0));
    if (ok) {
      setCopiedNominal(true);
      setTimeout(() => setCopiedNominal(false), 2000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setIsCompressing(true);
    try {
      const compressed = await compressProofImage(file, 960, 0.78);
      setPhotoBase64(compressed);
      setPhotoName(file.name || `Bukti_QRIS_${houseId || 'Warga'}.jpg`);
      setPhotoKb(estimateBase64Kb(compressed));
    } catch (err) {
      setPhotoBase64('');
      setPhotoName('');
      setPhotoKb(0);
      setErrorMsg(
        err?.message || 'Gagal membaca gambar. Coba pilih ulang atau kirim tanpa foto bukti.'
      );
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleClearPhoto = () => {
    setPhotoBase64('');
    setPhotoName('');
    setPhotoKb(0);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isCompressing) {
      setErrorMsg('Mohon tunggu 1 detik hingga proses kompresi foto selesai.');
      return;
    }

    if (!chosenHouse) {
      setErrorMsg('Pilih nomor rumah Anda terlebih dahulu.');
      return;
    }

    const numericNominal = Number(nominal) || 0;
    if (numericNominal <= 0) {
      setErrorMsg('Nominal pembayaran harus lebih dari Rp 0.');
      return;
    }

    const handler = onSubmitProof || onUploadIplProof || onConfirmQrisProof;
    if (typeof handler !== 'function') {
      setErrorMsg('Handler pengiriman pembayaran belum tersambung.');
      return;
    }

    const activePkg = packages.find((p) => p.id === packageId);
    const pkgLabel = activePkg ? activePkg.label : 'Parkir Fasum / Nominal Khusus';
    const hasPhoto = Boolean(photoBase64);

    const payload = {
      house_id: chosenHouse.id,
      nomor_rumah: `No. ${extractCleanHouseNum(chosenHouse)}`,
      nama_warga: chosenHouse.nama_warga || chosenHouse.nama_kepala_keluarga || '',
      periode_bulan: periodeBulan,
      periode_tahun: Number(periodeTahun) || 2026,
      nominal: numericNominal,
      nominal_bayar: numericNominal,
      paket_pembayaran: pkgLabel,
      catatan: catatan.trim()
        ? `${pkgLabel} • ${catatan.trim()}`
        : `${pkgLabel}${hasPhoto ? ' (Dengan Bukti)' : ' (Konfirmasi Tanpa Foto)'}`,
      file_base64: hasPhoto ? photoBase64 : '',
      file_name: hasPhoto
        ? photoName || `QRIS_${periodeBulan}_${chosenHouse.id}.jpg`
        : '',
      expect_photo: hasPhoto
    };

    setIsSubmitting(true);
    try {
      const res = await handler(payload);
      if (res && res.status === 'success') {
        setSuccessInfo({
          houseLabel: formatHouseIdentity(chosenHouse),
          periode: `${periodeBulan} ${periodeTahun}`,
          paket: pkgLabel,
          nominal: numericNominal,
          urlBukti: res.url_bukti && res.url_bukti !== '-' ? res.url_bukti : ''
        });
      } else {
        setErrorMsg(
          res?.message ||
            'Gagal mengirim konfirmasi pembayaran. Silakan coba beberapa saat lagi.'
        );
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Koneksi ke server gagal. Pastikan internet aktif.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSafe = () => {
    if (isSubmitting) return;
    if (typeof onClose === 'function') onClose();
  };

  return (
    <div
      onClick={handleCloseSafe}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-end md:items-center justify-center md:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        className="w-full md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200/90 max-h-[92vh] flex flex-col overflow-hidden animate-fade-in"
      >
        {/* Drag Handle khusus Mobile */}
        <div className="pt-2.5 pb-1 md:hidden shrink-0">
          <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto" />
        </div>

        {/* Header Modal / Sheet */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-gradient-to-r from-sky-50/70 via-white to-emerald-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-cyan-500/25 shrink-0">
              <IconPillQris size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                Bayar IPL & Parkir via QRIS
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                {qrisMerchantName} • Konfirmasi langsung masuk daftar validasi
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCloseSafe}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 transition cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Isi Modal Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {successInfo ? (
            /* ================================================================
               TAMPILAN SUKSES TERKIRIM
            ================================================================ */
            <div className="py-6 max-w-md mx-auto text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <IconPillCheck size={34} />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  Konfirmasi Pembayaran Terkirim!
                </h4>
                <p className="text-xs text-slate-500">
                  Status rumah Anda kini <strong>Menunggu Validasi</strong> pengurus dan akan
                  segera tercatat di Buku Kas Nyata.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 text-left text-xs space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 font-semibold">Rumah / Warga</span>
                  <span className="font-extrabold text-slate-900 text-right">
                    {successInfo.houseLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 font-semibold">Periode Buku</span>
                  <span className="font-extrabold text-slate-900">{successInfo.periode}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 font-semibold">Paket</span>
                  <span className="font-bold text-slate-800">{successInfo.paket}</span>
                </div>
                <div className="flex justify-between gap-2 pt-1 border-t border-slate-200/80">
                  <span className="text-slate-500 font-semibold">Nominal</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {formatRupiah(successInfo.nominal)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {successInfo.urlBukti && typeof onOpenLightbox === 'function' && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLightbox(
                        [successInfo.urlBukti],
                        `Bukti QRIS • ${successInfo.houseLabel} (${successInfo.periode})`
                      )
                    }
                    className="flex-1 h-11 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <IconPhoto size={16} />
                    <span>Lihat Bukti Tersimpan</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseSafe}
                  className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            /* ================================================================
               LAYOUT ADAPTIF: 1 KOLOM (MOBILE) <-> 2 KOLOM (DESKTOP MD+)
            ================================================================ */
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start"
            >
              {/* KOLOM KIRI (DESKTOP) / ATAS (MOBILE): KARTU QRIS */}
              <div className="md:col-span-5 space-y-3">
                <div className="rounded-3xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 p-4 text-center space-y-3 shadow-xs">
                  <div className="flex items-center justify-center gap-2">
                    <CMoneyLogo src={logoUrl} size={26} />
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black text-slate-900">{qrisMerchantName}</p>
                      <p className="text-[10px] font-mono font-semibold text-slate-500">
                        NMID: {qrisNmid}
                      </p>
                    </div>
                  </div>

                  {/* Bingkai Gambar QRIS */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex items-center justify-center min-h-[210px] relative">
                    {!qrisImgError && qrisImageUrl ? (
                      <img
                        src={qrisImageUrl}
                        alt={`QRIS ${qrisMerchantName}`}
                        onError={() => setQrisImgError(true)}
                        onClick={() =>
                          typeof onOpenLightbox === 'function' &&
                          onOpenLightbox([qrisImageUrl], `QRIS Resmi • ${qrisMerchantName}`)
                        }
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl cursor-zoom-in"
                      />
                    ) : (
                      <div className="py-6 px-3 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                          <IconPillQris size={26} />
                        </div>
                        <p className="text-xs font-extrabold text-slate-700">
                          Gambar QRIS belum ditemukan
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Pastikan file <code>public/assets/qris-cmr-statis.png</code> tersedia atau
                          gunakan transfer rekening kas bendahara.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Strip Nominal Terpilih + Salin */}
                  <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Total Transfer
                      </p>
                      <p className="text-base font-black text-emerald-950">
                        {formatRupiah(nominal)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyNominal}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-200 text-[11px] font-extrabold text-emerald-800 transition cursor-pointer shrink-0"
                    >
                      {copiedNominal ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>

                  {/* Tombol Simpan / Unduh Gambar QRIS */}
                  {!qrisImgError && qrisImageUrl && (
                    <a
                      href={qrisImageUrl}
                      download="QRIS-Cluster-Mutiara-Residence.png"
                      className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <IconDownload size={15} />
                      <span>Simpan QRIS ke Galeri</span>
                    </a>
                  )}
                </div>

                {/* Info Cut-Off Tanggal 25 */}
                {smartPeriod.isNextMonthCutoff && (
                  <div className="rounded-2xl bg-sky-50 border border-sky-200/80 p-3 flex items-start gap-2 text-[11px] font-semibold text-sky-900">
                    <IconClock size={15} className="text-sky-600 shrink-0 mt-0.5" />
                    <span>
                      Mulai tanggal {cutoffDay}, periode buku otomatis diarahkan ke{' '}
                      <strong>
                        {smartPeriod.bulan} {smartPeriod.tahun}
                      </strong>
                      . Anda tetap bisa mengubah bulan di kolom formulir.
                    </span>
                  </div>
                )}
              </div>

              {/* KOLOM KANAN (DESKTOP) / BAWAH (MOBILE): FORM KONFIRMASI */}
              <div className="md:col-span-7 space-y-3.5">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-start gap-2">
                    <IconAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 1. Pilih Rumah (Hanya 21 Rumah Aktif) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    1. Pilih Nomor Rumah ({activeHouses.length} Unit Aktif)
                  </label>
                  <select
                    required
                    value={houseId}
                    onChange={(e) => setHouseId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 px-3.5 text-sm font-bold text-slate-900 outline-none transition"
                  >
                    {activeHouses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {formatHouseIdentity(h)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Periode Buku Pembayaran */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    2. Periode Bulan Buku
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={periodeBulan}
                      onChange={(e) => setPeriodeBulan(e.target.value)}
                      disabled={isSubmitting}
                      className="col-span-2 h-11 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-emerald-500 px-3 text-sm font-bold text-slate-800 outline-none"
                    >
                      {MONTHS_ID.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="2024"
                      max="2035"
                      value={periodeTahun}
                      onChange={(e) => setPeriodeTahun(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="h-11 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-emerald-500 px-2.5 text-sm font-bold text-center text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* 3. Pilih Paket Pembayaran (4 Paket Netral + Opsi Parkir Saja) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      3. Pilih Paket Pembayaran
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectCustomMode}
                      className={`text-[11px] font-extrabold transition cursor-pointer ${
                        packageId === 'CUSTOM_PARKIR'
                          ? 'text-sky-700 underline'
                          : 'text-slate-500 hover:text-sky-700'
                      }`}
                    >
                      Parkir Saja / Nominal Lain
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {packages.map((pkg) => {
                      const active = packageId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                            active
                              ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <p className="text-xs font-extrabold text-slate-900 leading-tight">
                            {pkg.label}
                          </p>
                          <p className="text-xs font-black text-emerald-700 mt-1">
                            {formatRupiah(pkg.nominal)}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">
                            {pkg.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Input Khusus jika pilih Parkir Saja / Nominal Lain */}
                  {packageId === 'CUSTOM_PARKIR' && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {PARKING_ONLY_PRESETS.map((pr) => (
                          <button
                            key={pr.label}
                            type="button"
                            onClick={() => setNominal(pr.nominal)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition cursor-pointer ${
                              Number(nominal) === pr.nominal
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-100'
                            }`}
                          >
                            {pr.label} ({formatRupiah(pr.nominal)})
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={nominal}
                        onChange={(e) => setNominal(Number(e.target.value))}
                        placeholder="Masukkan nominal lainnya (Rp)"
                        className="w-full h-10 rounded-xl border border-sky-200 bg-white px-3 text-xs font-extrabold text-slate-900 outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Lampirkan Bukti Transfer (100% OPSIONAL — TIDAK WAJIB) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      4. Bukti Transfer / QRIS
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Opsional • Tidak Wajib
                    </span>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0">
                          <IconUpload size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 truncate">
                            {isCompressing
                              ? 'Mengompresi gambar...'
                              : photoName || 'Boleh langsung kirim tanpa foto'}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500">
                            {photoBase64
                              ? `Siap unggah ke Drive (~${photoKb} KB)`
                              : 'Lampirkan screenshot m-Banking jika tersedia'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {photoBase64 && (
                          <button
                            type="button"
                            onClick={handleClearPhoto}
                            disabled={isSubmitting}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-extrabold cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                        <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 text-[11px] font-extrabold text-slate-700 cursor-pointer transition">
                          {photoBase64 ? 'Ganti' : 'Pilih Foto'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isSubmitting || isCompressing}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {photoBase64 && (
                      <div className="mt-2.5 flex items-center gap-3">
                        <img
                          src={photoBase64}
                          alt="Pratinjau Bukti Pembayaran"
                          onClick={() =>
                            typeof onOpenLightbox === 'function' &&
                            onOpenLightbox([photoBase64], 'Pratinjau Bukti Pembayaran')
                          }
                          className="h-20 w-20 rounded-xl object-cover border border-slate-200 cursor-zoom-in"
                        />
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Bukti akan disimpan otomatis ke arsip Google Drive{' '}
                          <strong>Bukti_Iuran_Warga</strong> secara aman.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Catatan Tambahan Singkat */}
                <input
                  type="text"
                  placeholder="Catatan tambahan (opsional, misal: Bayar via BCA / Tunai)"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-emerald-500 px-3.5 text-xs font-medium text-slate-800 outline-none"
                />

                {/* Tombol Kirim Utama */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || isCompressing}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-sm font-extrabold shadow-md shadow-cyan-500/25 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
                  >
                    {isCompressing
                      ? 'Memproses Foto...'
                      : isSubmitting
                      ? 'Mengirim Konfirmasi...'
                      : photoBase64
                      ? `Kirim Bukti & Konfirmasi (${formatRupiah(nominal)})`
                      : `Kirim Konfirmasi Pembayaran (${formatRupiah(nominal)})`}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}