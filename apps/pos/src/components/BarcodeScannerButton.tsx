import { useEffect, useRef, useState } from "react";

type BarcodeScannerButtonProps = {
  onDetected: (barcode: string) => void;
  className?: string;
  label?: string;
};

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function BarcodeScannerButton({
  onDetected,
  className,
  label = "Scan"
}: BarcodeScannerButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const closeScanner = () => {
    setOpen(false);
  };

  const applyDetectedBarcode = (barcode: string) => {
    const normalized = barcode.trim();
    if (!normalized) return;

    onDetected(normalized);
    closeScanner();
  };

  const manualInput = () => {
    const input = window.prompt("Masukkan barcode secara manual", "");
    if (!input || input.trim().length === 0) return;
    applyDetectedBarcode(input);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const startScanner = async () => {
      setError("");
      setIsInitializing(true);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Browser tidak mendukung akses kamera.");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }
          },
          audio: false
        });

        if (cancelled) {
          stopMediaStream(mediaStream);
          return;
        }

        streamRef.current = mediaStream;

        if (!videoRef.current) {
          throw new Error("Elemen video scanner belum siap.");
        }

        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();

        const BarcodeDetectorClass = (window as WindowWithBarcodeDetector).BarcodeDetector;

        if (!BarcodeDetectorClass) {
          setError("Browser ini belum mendukung deteksi barcode otomatis.");
          return;
        }

        const detector = new BarcodeDetectorClass({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"]
        });

        const scanLoop = async () => {
          if (cancelled || !videoRef.current) return;

          try {
            if (videoRef.current.readyState >= 2) {
              const results = await detector.detect(videoRef.current);
              const barcode = results.find((result) => Boolean(result.rawValue?.trim()))?.rawValue;

              if (barcode) {
                applyDetectedBarcode(barcode);
                return;
              }
            }
          } catch {
            // Ignore per-frame detector errors and keep scanning.
          }

          rafRef.current = window.requestAnimationFrame(() => {
            void scanLoop();
          });
        };

        rafRef.current = window.requestAnimationFrame(() => {
          void scanLoop();
        });
      } catch (scannerError) {
        setError(
          scannerError instanceof Error
            ? scannerError.message
            : "Gagal mengakses kamera untuk scan barcode."
        );
      } finally {
        setIsInitializing(false);
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      stopMediaStream(streamRef.current);
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
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
              <video
                ref={videoRef}
                className="h-64 w-full object-cover"
                muted
                playsInline
                autoPlay
              />
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
                onClick={manualInput}
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
          </aside>
        </div>
      )}
    </>
  );
}
