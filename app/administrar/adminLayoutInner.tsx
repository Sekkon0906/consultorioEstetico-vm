"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; //  ya no localDB ni auth viejo

interface AdminLayoutInnerProps {
  children: React.ReactNode;
}

const TOP_OFFSET = 76;

export default function AdminLayoutInner({ children }: AdminLayoutInnerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const params = useSearchParams();
  const section = params.get("section") || "inicio";

  const { user } = useAuth(); //  usuario real de Supabase

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  const links: { id: string; label: string }[] = [
    { id: "horarios",       label: "Horarios" },
    { id: "citas",          label: "Citas Agendadas" },
    { id: "procedimientos", label: "Procedimientos" },
    { id: "testimonios",    label: "Testimonios" },
    { id: "charlas",        label: "Formación" },
    { id: "ingresos",       label: "Analítica" },
    { id: "configuracion",  label: "Información general" },
    { id: "copiloto",       label: "Asistente" },
  ];

  const NavLinks = () => (
    <ul className="flex flex-col space-y-3 mb-6">
      {links.map(({ id, label }) => {
        const isActive = section === id;
        return (
          <motion.li key={id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={`/administrar?section=${id}`}
              scroll={false}
              onClick={() => setSidebarOpen(false)}
              className={`admin-nav-link block text-center px-4 py-2 rounded-lg font-medium transition-all duration-300 no-underline ${
                isActive ? "is-active" : ""
              }`}
            >
              {label}
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen [background:var(--bg)] [color:var(--text)]">

      {/* SIDEBAR DESKTOP */}
      <aside className="admin-sidebar hidden lg:flex lg:flex-col lg:w-64 lg:py-6 lg:px-4 lg:shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-center tracking-wide [color:var(--brand)]">
          Panel Admin
        </h1>
        {user && (
          <p className="text-sm text-center mb-6 [color:var(--text)]">
            Sesión: <b>{user.nombres}</b>
          </p>
        )}
        <NavLinks />
      </aside>

      {/* SIDEBAR MÃ“VIL */}
      <AnimatePresence>
        {!isDesktop && sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-x-0 bottom-0 bg-black/35 backdrop-blur-sm z-40"
              style={{ top: TOP_OFFSET }}
              initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }} transition={{ duration: 0.25 }}
              className="admin-sidebar fixed left-0 z-50 w-64 flex flex-col py-6 px-4 shadow-xl"
              style={{ top: TOP_OFFSET, height: `calc(100vh - ${TOP_OFFSET}px)` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold [color:var(--brand)]">Panel Admin</h1>
                <button onClick={() => setSidebarOpen(false)} className="admin-close-btn p-1 rounded-md">
                  <X size={20} className="[color:var(--text)]" />
                </button>
              </div>
              {user && (
                <p className="text-sm text-center mb-4 [color:var(--text)]">
                  Sesión: <b>{user.nombres}</b>
                </p>
              )}
              <NavLinks />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* CONTENIDO */}
      {/* min-w-0: sin esto, el flex item usa min-width:auto y NO se encoge por
          debajo del ancho intrínseco de su contenido, dejando el panel más
          ancho que la pantalla del móvil (se veía "extenso"/cortado). */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="w-full flex items-center justify-between px-6 py-4 [background:var(--surface)] border-b [border-color:var(--border)] shadow-sm sticky z-30"
          style={{ top: 72 }}
        >
          <button
            className="admin-menu-btn lg:hidden text-white p-2 rounded-lg shadow flex items-center gap-1"
            onClick={() => setSidebarOpen((p) => !p)}
          >
            <Menu size={20} />
            <span className="text-sm font-medium">Menú</span>
          </button>
          <h2 className="text-xl font-semibold [color:var(--brand)] ml-auto lg:ml-0">
            Administración
          </h2>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto [background:var(--surface)]">
          <motion.div
            initial={{ y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }} className="admin-responsive max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}