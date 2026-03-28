import { type FormEvent, useMemo, useState } from "react";
import type { ManagedUser, ManagedUserRole } from "../auth";

type UsersPageProps = {
  users: ManagedUser[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onCreateUser: (input: {
    email: string;
    password: string;
    fullName: string;
    role: ManagedUserRole;
  }) => Promise<void>;
  onUpdateUser: (input: {
    userId: string;
    role?: ManagedUserRole;
    isActive?: boolean;
    fullName?: string;
  }) => Promise<void>;
};

export function UsersPage({
  users,
  loading,
  error,
  onRefresh,
  onCreateUser,
  onUpdateUser
}: UsersPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ManagedUserRole>("cashier");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.trim().length >= 8 &&
      fullName.trim().length > 0 &&
      !submitting
    );
  }, [email, password, fullName, submitting]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setFormError("");

    try {
      await onCreateUser({
        email,
        password,
        fullName,
        role
      });
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("cashier");
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Gagal membuat akun staf.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Buat Akun Kasir atau Manager</h2>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          Owner membuat akun staf. Kasir dan manager cukup login pakai email/password ini.
        </p>

        {formError && (
          <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container sm:text-sm">
            {formError}
          </p>
        )}

        <form className="mt-3 grid gap-2.5" onSubmit={submit}>
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            type="text"
            placeholder="Nama lengkap"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            type="email"
            placeholder="Email akun"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            type="password"
            minLength={8}
            placeholder="Password sementara (minimal 8 karakter)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <select
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            value={role}
            onChange={(event) => setRole(event.target.value as ManagedUserRole)}
          >
            <option value="cashier">Kasir</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Membuat akun..." : "Simpan Akun"}
          </button>
        </form>
      </aside>

      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Daftar Akun Staf</h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container sm:text-sm">
            {error}
          </p>
        )}

        <ul className="mt-3 grid gap-2">
          {loading && users.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Memuat akun staf...
            </li>
          )}

          {!loading && users.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Belum ada akun staf.
            </li>
          )}

          {users.map((user) => (
            <li key={user.id} className="rounded-xl bg-surface-container-lowest p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{user.fullName}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </div>
                <span
                  className={user.isActive ? "rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container" : "rounded-full bg-error-container px-2.5 py-1 text-xs font-semibold text-on-error-container"}
                >
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-lg border-none bg-surface-container-high px-2 text-xs text-on-surface outline-none"
                  value={user.role}
                  onChange={(event) => {
                    void onUpdateUser({
                      userId: user.id,
                      role: event.target.value as ManagedUserRole
                    }).catch((err) => {
                      if (err instanceof Error) {
                        setFormError(err.message);
                      } else {
                        setFormError("Gagal mengubah role akun staf.");
                      }
                    });
                  }}
                  disabled={loading}
                >
                  <option value="cashier">Kasir</option>
                  <option value="manager">Manager</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    void onUpdateUser({
                      userId: user.id,
                      isActive: !user.isActive
                    }).catch((err) => {
                      if (err instanceof Error) {
                        setFormError(err.message);
                      } else {
                        setFormError("Gagal mengubah status akun staf.");
                      }
                    });
                  }}
                  disabled={loading}
                  className={user.isActive ? "h-9 rounded-lg bg-error-container px-3 text-xs font-semibold text-on-error-container disabled:opacity-60" : "h-9 rounded-lg bg-secondary-container px-3 text-xs font-semibold text-on-secondary-container disabled:opacity-60"}
                >
                  {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
