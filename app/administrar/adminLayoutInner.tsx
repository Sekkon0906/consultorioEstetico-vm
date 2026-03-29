"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; //  ya no localDB ni auth viejo

interface AdminLayoutInnerProps {
  children: React.ReactNode;
}

const TOP_OFFSET = 64;

export default function AdminLayoutInner({ children }: AdminLayoutInnerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const params = useSearchParams();
  const router = useRouter();
  const section = params.get("section") || "inicio";

  const { user, logout } = useAuth(); //  usuario real de Supabase

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const links: { id: string; label: string }[] = [
    { id: "horarios",       label: "Horarios" },
    { id: "citas",          label: "Citas Agendadas" },
    { id: "procedimientos", label: "Procedimientos" },
    { id: "testimonios",    label: "Testimonios" },
    { id: "charlas",        label: "Formación" },
    { id: "ingresos",       label: "Ingresos" },
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
              className={`block text-center px-4 py-2 rounded-lg font-medium transition-all duration-300 no-underline ${
                isActive
                  ? "bg-[#8B6A4B] text-white shadow-sm"
                  : "bg-[#FBF7F2] text-[#5A4230] hover:bg-[#DCC7AC] hover:text-[#3A2A1A]"
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
    <div className="flex min-h-screen bg-[#FAF8F4] text-[#32261C]">

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-[#E9E0D1] lg:py-6 lg:px-4 lg:shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-center tracking-wide text-[#8B6A4B]">
          Panel Admin
        </h1>
        {user && (
          <p className="text-sm text-center mb-6 text-[#5A4230]">
            Sesión: <b>{user.nombres}</b>
          </p>
        )}
        <NavLinks />
        <button
          onClick={handleLogout}
          className="mt-auto px-4 py-2 rounded-lg bg-[#C87A7A] text-white font-semibold shadow hover:bg-[#B56666] transition"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* SIDEBAR MÓVIL */}
      <AnimatePresence>
        {!isDesktop && sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-x-0 bottom-0 bg-black/35 backdrop-blur-sm z-40"
              style={{ top: TOP_OFFSET }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }} transition={{ duration: 0.25 }}
              className="fixed left-0 z-50 w-64 bg-[#E9E0D1] flex flex-col py-6 px-4 shadow-xl"
              style={{ top: TOP_OFFSET, height: `calc(100vh - ${TOP_OFFSET}px)` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-[#8B6A4B]">Panel Admin</h1>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md hover:bg-[#DCC7AC]">
                  <X size={20} className="text-[#5A4230]" />
                </button>
              </div>
              {user && (
                <p className="text-sm text-center mb-4 text-[#5A4230]">
                  Sesión: <b>{user.nombres}</b>
                </p>
              )}
              <NavLinks />
              <button
                onClick={handleLogout}
                className="mt-auto px-4 py-2 rounded-lg bg-[#C87A7A] text-white font-semibold shadow hover:bg-[#B56666] transition"
              >
                Cerrar sesión
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col">
        <header className="w-full flex items-center justify-between px-6 py-4 bg-[#FBF7F2] border-b border-[#E5D8C8] shadow-sm sticky top-0 z-30">
          <button
            className="lg:hidden bg-[#8B6A4B] text-white p-2 rounded-lg shadow flex items-center gap-1"
            onClick={() => setSidebarOpen((p) => !p)}
          >
            <Menu size={20} />
            <span className="text-sm font-medium">Menú</span>
          </button>
          <h2 className="text-xl font-semibold text-[#8B6A4B] ml-auto lg:ml-0">
            Administración
          </h2>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#FBF7F2]">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }} className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}