import { type FormEvent, useState } from "react";
import {
  isAuthConfigured,
  registerOwnerAccount,
  signInWithEmail,
  type AuthenticatedUser
} from "../auth";

type AuthMode = "login" | "owner";

type AuthScreenProps = {
  onAuthenticated: (user: AuthenticatedUser) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [ownerCompanyName, setOwnerCompanyName] = useState("");
  const [ownerCompanyCode, setOwnerCompanyCode] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  const runWithGuard = async (action: () => Promise<AuthenticatedUser>) => {
    setLoading(true);
    setError("");

    try {
      const user = await action();
      onAuthenticated(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat autentikasi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithGuard(() => signInWithEmail(loginEmail, loginPassword));
  };

  const onOwnerRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithGuard(() =>
      registerOwnerAccount({
        email: ownerEmail,
        password: ownerPassword,
        fullName: ownerName,
        companyName: ownerCompanyName,
        companyCode: ownerCompanyCode,
      })
    );
  };

  if (!isAuthConfigured()) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <section className="mx-auto grid max-w-xl gap-4 rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Aktifkan Login POS</h1>
          <p className="text-sm text-slate-600">
            Tambahkan konfigurasi Supabase di file apps/pos/.env supaya fitur login dan daftar bisa dipakai.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>VITE_SUPABASE_URL=https://your-project-ref.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=your-anon-key</p>
          </div>
          <p className="text-xs text-slate-500">
            Dengan setup ini, owner bisa membuat banyak akun kasir dan manager dalam satu perusahaan.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-100 via-amber-50 to-emerald-50 p-4 sm:p-6">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-lg">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
          <aside className="bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">POS Commerce</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">Kasir Cepat, Multi Toko, Multi User</h1>
            <p className="mt-3 text-sm text-orange-50/95">
              Owner membuat akun kasir dan manager. Kasir atau manager hanya perlu login.
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="font-semibold">Beda perusahaan</p>
                <p className="mt-1 text-orange-50/95">Data produk dan transaksi otomatis terisolasi per tenant.</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="font-semibold">Kasir banyak</p>
                <p className="mt-1 text-orange-50/95">Akun kasir dan manager dibuat owner dari menu Pengguna.</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="font-semibold">Role akses</p>
                <p className="mt-1 text-orange-50/95">Kasir fokus jualan, manager atau owner pegang produk dan laporan.</p>
              </div>
            </div>
          </aside>

          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-xs font-semibold sm:text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={mode === "login" ? "h-10 rounded-xl bg-white text-slate-900 shadow-sm" : "h-10 rounded-xl text-slate-600"}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setMode("owner")}
                className={mode === "owner" ? "h-10 rounded-xl bg-white text-slate-900 shadow-sm" : "h-10 rounded-xl text-slate-600"}
              >
                Daftar Owner
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            {mode === "login" && (
              <form className="mt-4 grid gap-3" onSubmit={onLoginSubmit}>
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  required
                />
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-11 text-sm"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((state) => !state)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showLoginPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showLoginPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Masuk POS"}
                </button>
              </form>
            )}

            {mode === "owner" && (
              <form className="mt-4 grid gap-3" onSubmit={onOwnerRegister}>
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                  type="text"
                  placeholder="Nama owner"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  required
                />
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                  type="text"
                  placeholder="Nama perusahaan"
                  value={ownerCompanyName}
                  onChange={(event) => setOwnerCompanyName(event.target.value)}
                  required
                />
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                  type="text"
                  placeholder="Kode perusahaan (contoh: kopikami)"
                  value={ownerCompanyCode}
                  onChange={(event) => setOwnerCompanyCode(event.target.value)}
                  required
                />
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                  type="email"
                  placeholder="Email owner"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  required
                />
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-11 text-sm"
                    type={showOwnerPassword ? "text" : "password"}
                    placeholder="Password"
                    value={ownerPassword}
                    onChange={(event) => setOwnerPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword((state) => !state)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showOwnerPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showOwnerPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-11 rounded-xl bg-orange-500 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Buat Perusahaan"}
                </button>
              </form>
            )}

            {mode === "login" && (
              <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 sm:text-sm">
                Untuk kasir dan manager: minta owner membuat akun dulu, lalu login di sini.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
