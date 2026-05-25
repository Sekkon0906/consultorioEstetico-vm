// app/administrar/page.tsx
import { Suspense } from "react";
import AdministrarPageInner from "./AdministrarPageInner";

export default function AdministrarPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center [color:var(--text-soft)]">
          Cargando panel administrativo...
        </div>
      }
    >
      <AdministrarPageInner />
    </Suspense>
  );
}
