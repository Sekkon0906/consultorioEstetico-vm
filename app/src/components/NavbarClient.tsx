"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { IMG } from "@/lib/imagenes";

export default function Navbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const linkRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* === MENÚ PRINCIPAL === */
  const menuItems = useMemo(() => {
    const base = [
      { label: "Inicio", href: "/" },
      { label: "Dra. Vanessa Medina", href: "/doctora" },
      { label: "Consultorio", href: "/consultorio" },
      { label: "Procedimientos", href: "/procedimientos" },
      { label: "Testimonios", href: "/testimonios" },
      { label: "Agendar cita", href: "/agendar" },
    ];
    if (user?.rol === "admin" || user?.rol === "developer")
      base.push({ label: "Administrar", href: "/administrar" });
    return base;
  }, [user?.rol]);

  /* === INDICADOR ACTIVO === */
  const updateIndicatorTo = (el: HTMLLIElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement?.getBoundingClientRect();
    if (!rect || !parent) return;
    const next = { left: rect.left - parent.left, width: rect.width };
    setIndicator((prev) =>
      prev.left !== next.left || prev.width !== next.width ? next : prev
    );
  };

  useEffect(() => {
    const activeIndex = menuItems.findIndex((item) => item.href === pathname);
    const activeEl = activeIndex !== -1 ? linkRefs.current[activeIndex] : null;
    updateIndicatorTo(activeEl);
    const onResize = () => updateIndicatorTo(activeEl);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pathname, menuItems.length]);

  /* === LOGOUT === */
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  /* === CERRAR DROPDOWN SI CLIC FUERA === */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemEnter = (index: number) => updateIndicatorTo(linkRefs.current[index]);
  const handleMenuLeave = () => {
    const activeIndex = menuItems.findIndex((item) => item.href === pathname);
    updateIndicatorTo(linkRefs.current[activeIndex] || null);
  };

  const userPhoto =
    user?.photo ||
    (user
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          (user.nombres + " " + user.apellidos).trim()
        )}&background=E6CCB2&color=7F5539`
      : "https://cdn-icons-png.flaticon.com/512/847/847969.png");

  return (
    <nav
      className="navbar shadow-sm py-3"
      style={{ backgroundColor: "#FAF9F7", position: "sticky", top: 0, zIndex: 1000 }}
    >
      <div
        className="container-fluid d-flex align-items-center justify-content-between"
        style={{ padding: "0 1.2rem", position: "relative" }}
      >
        {/* LOGO */}
        <Link href="/" className="navbar-logo d-flex align-items-center">
          <img
            src={IMG.logo}
            alt="Logo JM"
            width={75}
            height={55}
            className="me-2"
          />
        </Link>

        {/* MENÚ DESKTOP */}
        <div
          className="position-relative d-none d-md-block"
          style={{ flex: 1.5 }}
          onMouseLeave={handleMenuLeave}
        >
          <ul
            className="navbar-menu d-flex justify-content-center align-items-center gap-4 mb-0"
            style={{ fontWeight: 600, listStyle: "none" }}
          >
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.li
                  key={index}
                  ref={(el) => { linkRefs.current[index] = el; }}
                  className="nav-item"
                  style={{ cursor: "pointer" }}
                  whileHover={{ scale: 1.07, filter: "brightness(1.08)" }}
                  transition={{ duration: 0.18 }}
                  onMouseEnter={() => handleItemEnter(index)}
                >
                  <Link
                    href={item.href}
                    className="text-decoration-none"
                    style={{ color: isActive ? "#B08968" : "#2B2B2B", fontWeight: 600 }}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              );
            })}
          </ul>

          <motion.div
            layout
            animate={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.width ? 1 : 0,
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: -2,
              height: "3px",
              background: "linear-gradient(90deg, #b08968, #ffe4c0, #b08968)",
              borderRadius: "3px",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* PERFIL / HAMBURGUESA */}
        <div
          ref={dropdownRef}
          className="navbar-user"
          style={{ position: "relative", display: "flex", justifyContent: "flex-end", flex: "0 0 auto" }}
        >
          {/* HAMBURGUESA MÓVIL */}
          <button
            className={`hamburger-btn d-md-none ${mobileOpen ? "active" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: mobileOpen ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {mobileOpen ? (
                <X size={30} strokeWidth={2.5} color="#6B4E3D" />
              ) : (
                <Menu size={30} strokeWidth={2.5} color="#6B4E3D" />
              )}
            </motion.div>
          </button>

          {/* PERFIL DESKTOP */}
          {loading ? null : !user ? (
            <button
              onClick={() => router.push("/login")}
              className="btn btn-outline-dark rounded-4 px-3 py-2 d-none d-md-inline"
              style={{ borderColor: "#B08968", color: "#6B4E3D", backgroundColor: "#fff8f3", fontWeight: 500 }}
            >
              Iniciar sesión
            </button>
          ) : (
            <>
              <motion.button
                onClick={() => setMenuOpen((p) => !p)}
                className="user-button d-none d-md-flex align-items-center border-0 bg-white rounded-pill shadow-sm px-2 py-1"
              >
                <img
                  src={userPhoto}
                  alt="Perfil"
                  style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #FFDDBF" }}
                />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="perfil-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 10 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="position-absolute bg-white border rounded-4 shadow-lg p-3"
                    style={{
                      top: "110%", right: 0, minWidth: "260px", zIndex: 100,
                      textAlign: "center",
                      background: "linear-gradient(135deg, #fffdfb 0%, #f8f3ed 100%)",
                    }}
                  >
                    <div
                      style={{ position: "absolute", top: "10px", right: "10px", cursor: "pointer" }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <X size={20} strokeWidth={2} color="#6b4e3d" />
                    </div>

                    <div className="text-center mb-3" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img
                        src={userPhoto}
                        alt="Perfil"
                        style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", border: "2px solid #FFDDBF", marginBottom: "0.4rem" }}
                      />
                      <div style={{ fontWeight: 700, color: "#6B4E3D" }}>
                        {user.nombres}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#8d7a6a" }}>{user.email}</div>
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        className="btn"
                        style={{ background: "#E9E0D1", color: "#4B3A2E", fontWeight: 600, border: "none", borderRadius: "10px" }}
                        onClick={() => { setMenuOpen(false); router.push("/perfil/editar_info"); }}
                      >
                        Editar perfil
                      </button>
                      <button
                        className="btn"
                        style={{ background: "#C9AD8D", color: "#fff", fontWeight: 600, border: "none", borderRadius: "10px" }}
                        onClick={() => { setMenuOpen(false); router.push("/perfil/citas_agendadas"); }}
                      >
                        Citas agendadas
                      </button>
                      <button
                        className="btn mt-2"
                        style={{ background: "#fff3ef", color: "#b02e2e", fontWeight: 600, border: "1px solid #e4bfbf", borderRadius: "10px" }}
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* SIDEBAR MÓVIL */}
      <div className={`mobile-sidebar ${mobileOpen ? "open" : ""}`} style={{ transition: "transform 0.4s ease, opacity 0.4s ease" }}>
        {user ? (
          <div className="mobile-sidebar-header" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img src={userPhoto} alt="Perfil" className="user-avatar" style={{ marginBottom: "0.8rem" }} />
            <div className="user-name">{user.nombres}</div>
            <div className="user-email">{user.email}</div>
            <div className="user-actions">
              <button className="user-action-btn" onClick={() => { setMobileOpen(false); router.push("/perfil/editar_info"); }}>
                Editar perfil
              </button>
              <button className="user-action-btn" onClick={() => { setMobileOpen(false); router.push("/perfil/citas_agendadas"); }}>
                Citas agendadas
              </button>
              <button className="user-action-btn" onClick={handleLogout} style={{ color: "#b02e2e" }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="mobile-sidebar-header">
            <button onClick={() => router.push("/login")} className="user-action-btn">
              Iniciar sesión
            </button>
          </div>
        )}
        <div className="mobile-sidebar-menu">
          <ul>
            {menuItems.map((item, i) => (
              <li key={i}>
                <Link href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* BACKDROP MÓVIL */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-backdrop"
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", zIndex: 80 }}
          />
        )}
      </AnimatePresence>
    </nav>
  );
}