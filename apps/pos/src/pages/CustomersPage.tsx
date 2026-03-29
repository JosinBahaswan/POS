import React, { useState, useEffect } from "react";
import { Customer } from "../types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setTimeout(() => {
        setCustomers([
          {
            id: "1",
            name: "Budi Santoso",
            phone: "081234567890",
            loyalty_points: 150,
            member_tier: "Gold",
            outstanding_debt: 50000
          },
          {
            id: "2",
            name: "Andi Wijaya",
            phone: "089876543210",
            loyalty_points: 20,
            member_tier: "Silver",
            outstanding_debt: 0
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Tambah Pelanggan Baru</h2>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          Simpan data pelanggan untuk program loyalitas dan fitur kasbon.
        </p>

        <form className="mt-4 grid gap-2.5">
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            type="text"
            placeholder="Nama lengkap pelanggan"
            required
          />
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            type="tel"
            placeholder="Nomor Telepon / WhatsApp"
          />
          <select
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            defaultValue="Silver"
          >
            <option value="Silver">Member Silver (Standar)</option>
            <option value="Gold">Member Gold (VIP)</option>
          </select>
          <button
            type="button"
            className="h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary transition hover:brightness-105"
          >
            Simpan Pelanggan Baru
          </button>
        </form>
      </aside>

      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Daftar Pelanggan</h2>
          <button
            type="button"
            onClick={loadCustomers}
            disabled={isLoading}
            className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-60 transition"
          >
            Refresh
          </button>
        </div>

        <ul className="mt-4 grid gap-2">
          {isLoading && customers.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-5 text-center text-sm text-on-surface-variant">
              Memuat data pelanggan...
            </li>
          )}

          {!isLoading && customers.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-5 text-center text-sm text-on-surface-variant">
              Belum ada pelanggan terdaftar.
            </li>
          )}

          {customers.map((c) => (
            <li key={c.id} className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">{c.name}</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">{c.phone || "Tidak ada nomor HP"}</span>
                </div>
                
                <span
                  className={
                    c.member_tier === "Gold"
                      ? "rounded-full bg-tertiary-container px-2.5 py-1 text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider"
                      : "rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider"
                  }
                >
                  {c.member_tier}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-outline-variant/20 pt-3">
                <div>
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Poin Loyalitas</p>
                  <p className="text-sm font-bold text-primary">{c.loyalty_points} Poin</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase text-right">Total Kasbon</p>
                  <p className={`text-sm font-bold text-right ${c.outstanding_debt > 0 ? "text-error" : "text-on-surface"}`}>
                    Rp {c.outstanding_debt.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end gap-2">
                 <button className="h-8 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest">
                    Edit
                 </button>
                 {c.outstanding_debt > 0 && (
                   <button className="h-8 rounded-lg bg-error-container px-3 text-xs font-semibold text-on-error-container transition hover:brightness-95">
                      Lunasi Kasbon
                   </button>
                 )}
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
