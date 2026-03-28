import { ReportsPanel } from "../components/ReportsPanel";
import type { LocalSale } from "../database";

type ReportsPageProps = {
  sales: LocalSale[];
};

export function ReportsPage({ sales }: ReportsPageProps) {
  return (
    <section className="mt-4">
      <ReportsPanel sales={sales} />
    </section>
  );
}
