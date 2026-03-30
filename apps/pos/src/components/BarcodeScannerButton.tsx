import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type BarcodeScannerButtonProps = {
  onDetected: (barcode: string) => void;
  className?: string;
  label?: string;
};

export function BarcodeScannerButton({
  onDetected,
  className,
  label = "Scan"
}: BarcodeScannerButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualError, setManualError] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "html5-qrcode-reader-element";

  const closeScanner = () => {
    setOpen(false);
    setIsManualInputOpen(false);
    setManualBarcode("");
    setManualError("");
  };

  const applyDetectedBarcode = (barcode: string) => {
    const normalized = barcode.trim();
    if (!normalized) return;
    onDetected(normalized);
    closeScanner();
  };

  const openManualInput = () => {
    setIsManualInputOpen(true);
    setManualError("");
  };

  const submitManualInput = () => {
    if (manualBarcode.trim().length === 0) {
      setManualError("Barcode manual tidak boleh kosong.");
      return;
    }

    applyDetectedBarcode(manualBarcode);
  };

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setIsInitializing(true);
    setError(null);

    const initializeScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              applyDetectedBarcode(decodedText);
            }
          },
          () => {
            // Ignore frame check errors
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Gagal mengakses kamera. Browser tidak mendukung kamera atau izin ditolak.");
          setIsInitializing(false);
        }
      }
    };

    // Small delay to ensure the DOM element is rendered before Html5Qrcode binds to it
    const timer = setTimeout(() => {
      void initializeScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
        }
        aria-label="Buka scanner barcode"
      >
        <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 px-3 pb-4 pt-20 sm:items-center sm:p-6"
          onClick={closeScanner}
        >
          <aside
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-low p-4 editorial-shadow sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-headline text-xl font-extrabold text-on-surface">Scan Barcode</h3>
                <p className="mt-1 text-sm text-on-surface-variant">Arahkan kamera ke barcode produk.</p>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-container-high text-on-surface-variant"
                aria-label="Tutup scanner"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl bg-black/80">
              <div id={scannerContainerId} className="w-full"></div>
            </div>

            {isInitializing && (
              <p className="mt-2 text-xs text-on-surface-variant">Menyiapkan kamera...</p>
            )}

            {error && (
              <p className="mt-2 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
                {error}
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openManualInput}
                className="h-10 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface"
              >
                Input Manual
              </button>
              <button
                type="button"
                onClick={closeScanner}
                className="h-10 rounded-xl bg-primary text-xs font-semibold text-on-primary"
              >
                Tutup
              </button>
            </div>

            {isManualInputOpen && (
              <div className="mt-3 rounded-xl bg-surface-container-lowest p-3">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  Input Barcode Manual
                </label>
                <input
                  className="mt-2 h-10 w-full rounded-lg border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  placeholder="Masukkan barcode"
                  value={manualBarcode}
                  onChange={(event) => {
                    setManualBarcode(event.target.value);
                    if (manualError) setManualError("");
                  }}
                />

                {manualError && (
                  <p className="mt-2 rounded-lg bg-error-container px-2 py-1 text-xs font-semibold text-on-error-container">
                    {manualError}
                  </p>
                )}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualInputOpen(false);
                      setManualBarcode("");
                      setManualError("");
                    }}
                    className="h-9 rounded-lg bg-surface-container-high text-xs font-semibold text-on-surface-variant"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={submitManualInput}
                    className="h-9 rounded-lg bg-primary text-xs font-semibold text-on-primary"
                  >
                    Gunakan Barcode
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
