import React, { useState, useEffect } from 'react';

export default function QrisPaymentModal({
  isOpen,
  onClose,
  initialHouse = 'H-01',
  merchantName = 'Cluster Mutiara Residence',
  nmid = 'ID1026000000CMR',
  qrisImageUrl = '/assets/qris-cmr-statis.png',
  defaultAmount = 200000,
  houses = [],
  onConfirmUpload
}) {
  const [selectedHouse, setSelectedHouse] = useState(initialHouse);
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialHouse) setSelectedHouse(initialHouse);
  }, [initialHouse]);

  if (!isOpen) return null;

  const housesList =
    houses.length > 0
      ? houses
      : Array.from({ length: 21 }, (_, i) => {
          const num = String(i + 1).padStart(2, '0');
          return { id: `H-${num}`, nomor_rumah: `No. ${num}`, nama_warga: `Warga No. ${num}` };
        });

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(String(defaultAmount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitProof = () => {
    if (onConfirmUpload) {
      onConfirmUpload({
        house_id: selectedHouse,
        periode_bulan: selectedMonth,
        periode_tahun: 2026,
        file_name: proofFile?.name || 'bukti_qris.jpg'
      });
    }
    alert(
      `✅ Bukti pembayaran ${selectedHouse} (${selectedMonth} 2026) berhasil tercatat dan siap divalidasi Pengurus.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md md:max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
              QRIS Nasional • Bebas Biaya Admin (MDR 0%)
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 mt-1">
              Bayar Iuran IPL Warga
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Konten Responsif: 1 Kolom di HP, 2 Kolom di Tablet/Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 items-center">
          {/* Kolom Kiri: Kartu QRIS */}
          <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5 px-1">
              <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">QRIS</span>
              <span className="text-teal-700 text-[11px]">GPN • Standar Nasional</span>
            </div>

            <p className="font-extrabold text-sm text-slate-900 uppercase">{merchantName}</p>
            <p className="text-[11px] text-slate-500 mb-2.5">NMID: {nmid}</p>

            <div className="w-44 h-44 sm:w-48 sm:h-48 mx-auto bg-white p-2.5 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={qrisImageUrl}
                alt="QRIS Cluster Mutiara Residence"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=QRIS_CMR_200000';
                }}
              />
            </div>

            <a
              href={qrisImageUrl}
              download={`QRIS_${merchantName}_${selectedHouse}.png`}
              className="mt-3 inline-block w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
            >
              ⬇️ Simpan Gambar QRIS
            </a>
          </div>

          {/* Kolom Kanan: Pilih Rumah, Salin Nominal, & Upload Bukti */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilih Nomor Rumah</label>
              <select
                value={selectedHouse}
                onChange={(e) => setSelectedHouse(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 bg-slate-50"
              >
                {housesList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nomor_rumah} — {h.nama_warga}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Periode Tagihan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 bg-slate-50"
              >
                {['November', 'Desember', 'Januari'].map((m) => (
                  <option key={m} value={m}>
                    {m} 2026
                  </option>
                ))}
              </select>
            </div>

            {/* Box Nominal Tagihan */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-teal-700 block font-medium">
                  Nominal Iuran ({selectedHouse} • {selectedMonth})
                </span>
                <span className="text-lg font-extrabold text-teal-900">
                  Rp {Number(defaultAmount).toLocaleString('id-ID')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyNominal}
                className="text-xs bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
              >
                {copied ? '✓ Tersalin' : 'Salin Angka'}
              </button>
            </div>

            {/* Unggah Bukti Transfer */}
            <div className="pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block mb-1.5">
                Unggah Screenshot Bukti Transfer:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
              <button
                type="button"
                disabled={!proofFile}
                onClick={handleSubmitProof}
                className="mt-3 w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md transition"
              >
                ✅ Kirim Bukti Pembayaran IPL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}