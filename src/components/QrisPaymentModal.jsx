import React, { useState, useEffect, useMemo } from 'react';
import { compressImageToBase64 } from '../services/apiService';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getDefaultSmartPeriod() {
  const now = new Date();
  const day = now.getDate();
  let monthIndex = now.getMonth();
  let year = now.getFullYear();

  if (day >= 25) {
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }
  return {
    month: MONTH_NAMES[monthIndex],
    year
  };
}

function extractCleanNum(rawVal) {
  const digits = String(rawVal || '').replace(/[^0-9]/g, '');
  return digits ? digits.padStart(2, '0') : '00';
}

const QRIS_PACKAGES_V6 = [
  {
    id: 'IPL_ONLY',
    title: 'IPL Saja',
    subtitle: 'Iuran Wajib Bulanan',
    nominal: 200000,
    badge: 'Rp 200.000'
  },
  {
    id: 'IPL_PARKIR_1',
    title: 'IPL + Parkir 1 Mobil',
    subtitle: 'IPL Rp 200rb + Parkir Rp 150rb',
    nominal: 350000,
    badge: 'Rp 350.000'
  },
  {
    id: 'IPL_PARKIR_2',
    title: 'IPL + Parkir 2 Mobil',
    subtitle: 'IPL Rp 200rb + 2 Mobil Rp 300rb',
    nominal: 500000,
    badge: 'Rp 500.000'
  },
  {
    id: 'IPL_PARKIR_WEEKEND',
    title: 'IPL + Parkir Weekend',
    subtitle: 'IPL Rp 200rb + Weekend Rp 50rb',
    nominal: 250000,
    badge: 'Rp 250.000'
  },
  {
    id: 'PARKIR_1_ONLY',
    title: 'Parkir 1 Mobil Saja',
    subtitle: 'Khusus Kontribusi Parkir Bulanan',
    nominal: 150000,
    badge: 'Rp 150.000'
  },
  {
    id: 'CUSTOM',
    title: 'Nominal Lainnya',
    subtitle: 'Isi sesuai uang riil yang ditransfer',
    nominal: 200000,
    badge: 'Custom'
  }
];

export default function QrisPaymentModal({
  isOpen = true,
  onClose,
  houses = [],
  selectedHouse = null,
  defaultMonth,
  defaultYear,
  qrisImageUrl = '/assets/qris-cmr-statis.png',
  qrisMerchantName = 'Cluster Mutiara Residence',
  onUploadProof,
  onConfirmQrisProof,
  onOpenLightbox,
  formatHouseIdentity
}) {
  const smartPeriod = useMemo(() => getDefaultSmartPeriod(), []);

  // Saring Hanya 21 Unit Rumah Aktif (Kunci Unit Non-Aktif No. 04 BPR)
  const activeHouses = useMemo(() => {
    const rawList = Array.isArray(houses) ? houses : [];
    return rawList.filter(
      (h) =>
        String(h.status_huni || 'Aktif').toLowerCase() !== 'tidak aktif' &&
        String(h.id || '').toUpperCase() !== 'H-04'
    );
  }, [houses]);

  // Helper V6.1: Format Seragam "No. XX / Nama Warga" (Anti-Bug "No. No." & "undefined")
  const getHouseLabel = (houseObjOrId) => {
    if (typeof formatHouseIdentity === 'function') {
      return formatHouseIdentity(houseObjOrId);
    }
    if (!houseObjOrId) return '-';
    if (typeof houseObjOrId === 'object') {
      const num = extractCleanNum(houseObjOrId.nomor_rumah || houseObjOrId.id);
      const name = String(
        houseObjOrId.nama_warga || houseObjOrId.nama_kepala_keluarga || 'Warga'
      ).trim();
      return `No. ${num} / ${name}`;
    }
    const cleanNum = extractCleanNum(houseObjOrId);
    const found = activeHouses.find(
      (h) =>
        String(h.id).toUpperCase() === String(houseObjOrId).toUpperCase() ||
        extractCleanNum(h.nomor_rumah || h.id) === cleanNum
    );
    if (found) {
      const num = extractCleanNum(found.nomor_rumah || found.id);
      const name = String(found.nama_warga || found.nama_kepala_keluarga || 'Warga').trim();
      return `No. ${num} / ${name}`;
    }
    return String(houseObjOrId);
  };

  // State Pilihan Form Warga
  const [houseId, setHouseId] = useState(
    selectedHouse?.id || activeHouses[0]?.id || 'H-01'
  );
  const [periodeBulan, setPeriodeBulan] = useState(defaultMonth || smartPeriod.month);
  const [periodeTahun, setPeriodeTahun] = useState(defaultYear || smartPeriod.year);
  const [selectedPkgId, setSelectedPkgId] = useState('IPL_ONLY');
  const [nominalBayar, setNominalBayar] = useState(200000);
  const [catatanWarga, setCatatanWarga] = useState('');

  // State Bukti Transfer & Status Pengiriman
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [qrisImgError, setQrisImgError] = useState(false);

  useEffect(() => {
    if (selectedHouse?.id && selectedHouse.id !== 'H-04') {
      setHouseId(selectedHouse.id);
    }
  }, [selectedHouse]);

  if (!isOpen) return null;

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  const selectedPackage =
    QRIS_PACKAGES_V6.find((p) => p.id === selectedPkgId) || QRIS_PACKAGES_V6[0];

  const handleSelectPackage = (pkg) => {
    setSelectedPkgId(pkg.id);
    if (pkg.id !== 'CUSTOM') {
      setNominalBayar(pkg.nominal);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setIsCompressing(true);
    try {
      const compressed = await compressImageToBase64(file);
      setFileBase64(compressed);
      setFileName(file.name);
    } catch (err) {
      setErrorMsg('Gagal memproses gambar bukti pembayaran. Silakan coba foto lain.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fileBase64) {
      setErrorMsg('Mohon pilih atau unggah foto screenshot bukti pembayaran QRIS terlebih dahulu.');
      return;
    }

    if (!nominalBayar || Number(nominalBayar) <= 0) {
      setErrorMsg('Nominal pembayaran wajib diisi dengan benar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const houseIdentity = getHouseLabel(houseId);
      const packageSummary = `${selectedPackage.title} (${formatRp(nominalBayar)})`;
      const finalNote = catatanWarga
        ? `${packageSummary} — ${catatanWarga} [${houseIdentity}]`
        : `${packageSummary} [${houseIdentity}]`;

      const payload = {
        house_id: houseId,
        identitas_rumah: houseIdentity,
        periode_bulan: periodeBulan,
        periode_tahun: Number(periodeTahun),
        paket_id: selectedPackage.id,
        paket_label: selectedPackage.title,
        nominal_bayar: Number(nominalBayar),
        catatan: finalNote,
        file_name: fileName || `QRIS_${periodeBulan}_${houseId}.jpg`,
        file_base64: fileBase64
      };

      const submitFn = onUploadProof || onConfirmQrisProof;
      if (typeof submitFn === 'function') {
        const res = await submitFn(payload);
        if (res && res.status === 'success') {
          setSubmitResult({
            houseIdentity,
            periodeBulan,
            periodeTahun,
            nominal: Number(nominalBayar),
            paketTitle: selectedPackage.title,
            urlBukti: res.url_bukti || fileBase64
          });
        } else {
          setErrorMsg(res?.message || 'Gagal mengirim bukti pembayaran ke server.');
        }
      } else {
        setSubmitResult({
          houseIdentity,
          periodeBulan,
          periodeTahun,
          nominal: Number(nominalBayar),
          paketTitle: selectedPackage.title,
          urlBukti: fileBase64
        });
      }
    } catch (err) {
      setErrorMsg(`Terjadi kendala koneksi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL QRIS */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              QRIS Resmi • Bebas Biaya Admin (MDR 0%)
            </span>
            <h2 className="text-base sm:text-lg font-extrabold mt-1">
              📲 Pembayaran IPL & Parkir Fasum CMR
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* ISI MODAL */}
        <div className="p-5 overflow-y-auto space-y-5">
          {submitResult ? (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
                ✓
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">
                  Bukti Pembayaran Berhasil Terkirim!
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Terima kasih, bukti transfer untuk{' '}
                  <span className="font-extrabold">{submitResult.houseIdentity}</span> telah
                  tersimpan di Google Drive & tercatat pada Buku{' '}
                  <span className="font-extrabold">
                    {submitResult.periodeBulan} {submitResult.periodeTahun}
                  </span>
                  .
                </p>
              </div>

              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-white border border-emerald-200/80 text-xs space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Identitas Rumah:</span>
                  <span className="font-extrabold text-slate-900">
                    {submitResult.houseIdentity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paket Pembayaran:</span>
                  <span className="font-bold text-slate-800">{submitResult.paketTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Uang Nyata:</span>
                  <span className="font-extrabold text-teal-800">
                    {formatRp(submitResult.nominal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Periode Buku:</span>
                  <span className="font-bold text-slate-800">
                    {submitResult.periodeBulan} {submitResult.periodeTahun}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {submitResult.urlBukti && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onOpenLightbox === 'function') {
                        onOpenLightbox(
                          submitResult.urlBukti,
                          `Bukti Pembayaran — ${submitResult.houseIdentity}`,
                          `${submitResult.paketTitle} • ${formatRp(submitResult.nominal)}`
                        );
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold shadow"
                  >
                    🖼️ Lihat Foto Bukti di Layar
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* KOLOM KIRI: KODE QRIS STATIS RESMI CMR */}
              <div className="md:col-span-5 bg-slate-50 rounded-3xl p-4 border border-slate-200/80 text-center space-y-3">
                <div className="inline-block bg-teal-900 text-white text-[11px] font-extrabold px-3 py-1 rounded-full">
                  {qrisMerchantName}
                </div>

                <div
                  onClick={() =>
                    typeof onOpenLightbox === 'function' &&
                    !qrisImgError &&
                    onOpenLightbox(
                      qrisImageUrl,
                      `QRIS Resmi ${qrisMerchantName}`,
                      `Nominal Tagihan Pilihan: ${formatRp(nominalBayar)}`
                    )
                  }
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner mx-auto max-w-[230px] cursor-pointer hover:border-teal-600 transition"
                >
                  {!qrisImgError ? (
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Cluster Mutiara Residence"
                      className="w-full h-auto object-contain rounded-xl"
                      onError={() => setQrisImgError(true)}
                    />
                  ) : (
                    <div className="py-12 px-4 text-xs text-slate-500 space-y-1">
                      <p className="text-2xl">📲</p>
                      <p className="font-bold text-slate-700">QRIS Cluster Mutiara Residence</p>
                      <p className="text-[11px]">
                        Simpan file QRIS di public/assets/qris-cmr-statis.png
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-teal-900 text-white">
                  <p className="text-[10px] uppercase tracking-wider text-teal-200 font-bold">
                    Nominal yang Diinput Saat Scan QRIS
                  </p>
                  <p className="text-xl font-black text-emerald-300 mt-0.5">
                    {formatRp(nominalBayar)}
                  </p>
                  <p className="text-[11px] text-teal-100 mt-0.5">{selectedPackage.title}</p>
                </div>

                <a
                  href={qrisImageUrl}
                  download="QRIS-Cluster-Mutiara-Residence.png"
                  className="block w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-teal-900 transition"
                >
                  ⬇️ Unduh Gambar QRIS ke HP
                </a>
              </div>

              {/* KOLOM KANAN: PILIH RUMAH, PAKET NETRAL, & UPLOAD BUKTI */}
              <form onSubmit={handleSubmitProof} className="md:col-span-7 space-y-3.5 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      1. Pilih No. Rumah / Nama Warga
                    </label>
                    <select
                      value={houseId}
                      onChange={(e) => setHouseId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {activeHouses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.display_label || getHouseLabel(h)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      2. Periode Bulan Buku
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={periodeBulan}
                        onChange={(e) => setPeriodeBulan(e.target.value)}
                        className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900 bg-slate-50"
                      >
                        {MONTH_NAMES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        value={periodeTahun}
                        onChange={(e) => setPeriodeTahun(Number(e.target.value))}
                        className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900 bg-slate-50"
                      >
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    3. Pilih Paket Pembayaran (Uang Kas Nyata)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QRIS_PACKAGES_V6.map((pkg) => {
                      const isSelected = selectedPkgId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-teal-900 text-white border-teal-900 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-extrabold text-xs">{pkg.title}</p>
                            <p
                              className={`text-[10px] mt-0.5 ${
                                isSelected ? 'text-teal-200' : 'text-slate-500'
                              }`}
                            >
                              {pkg.subtitle}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-emerald-400 text-slate-950'
                                : 'bg-white text-teal-800 border border-slate-200'
                            }`}
                          >
                            {pkg.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Nominal Transfer Riil (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={nominalBayar}
                      onChange={(e) => setNominalBayar(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-extrabold text-teal-900 bg-teal-50/50"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Transfer via BCA / Mandiri"
                      value={catatanWarga}
                      onChange={(e) => setCatatanWarga(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                  <label className="block font-extrabold text-slate-700">
                    4. 📷 Unggah Screenshot Bukti Transfer / QRIS
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600"
                  />

                  {isCompressing && (
                    <p className="text-[11px] text-amber-700 font-bold">
                      ⏳ Mengompresi ukuran gambar agar cepat diunggah...
                    </p>
                  )}

                  {fileBase64 && !isCompressing && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={fileBase64}
                          alt="Preview Bukti QRIS"
                          onClick={() =>
                            typeof onOpenLightbox === 'function' &&
                            onOpenLightbox(
                              fileBase64,
                              `Pratinjau Bukti — ${getHouseLabel(houseId)}`,
                              `${selectedPackage.title} (${formatRp(nominalBayar)})`
                            )
                          }
                          className="w-12 h-12 object-cover rounded-xl border border-emerald-300 cursor-pointer"
                        />
                        <div>
                          <p className="font-extrabold text-emerald-800 text-[11px]">
                            ✓ Foto bukti siap dikirim ke Drive
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Klik gambar untuk memperbesar pratinjau
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFileBase64('');
                          setFileName('');
                        }}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-md transition"
                >
                  {isSubmitting
                    ? 'Menyimpan Bukti ke Google Drive...'
                    : `✅ Kirim Bukti Pembayaran (${getHouseLabel(houseId)})`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}