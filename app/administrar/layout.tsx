// app/administrar/layout.tsx
import { Suspense } from "react";
import AdminLayoutInner from "./adminLayoutInner";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando panel...</div>}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
