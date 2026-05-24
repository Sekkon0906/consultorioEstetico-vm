"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { IMG } from "@/lib/imagenes";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const t = useTranslations("navbar");
  const tc = useTranslations("common");

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const linkRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* === MENÚ PRINCIPAL === */
  const menuItems = useMemo(() => {
    const base = [
      { label: t("home"), href: "/" },
      { label: t("doctor"), href: "/doctora" },
      { label: t("office"), href: "/consultorio" },
      { label: t("procedures"), href: "/procedimientos" },
      { label: t("testimonials"), href: "/testimonios" },
      { label: t("book"), href: "/agendar" },
    ];
    if (user?.rol === "admin" || user?.rol === "developer")
      base.push({ label: t("admin"), href: "/administrar" });
    return base;
  }, [user?.rol, t]);

  /* === INDICADOR ACTIVO === */
  const updateIndicatorTo = (el: HTMLLIElement | null) => {
    if (!el) return;
    // offsetLeft/offsetWidth son valores de layout (NO afectados por el
    // scale del hover ni por transforms), y son relativos al mismo
    // offsetParent que el indicador → alineación correcta.
    const next = { left: el.offsetLeft, width: el.offsetWidth };
    setIndicator((prev) =>
      prev.left !== next.left || prev.width !== next.width ? next : prev
    );
  };

  useEffect(() => {
    const measure = () => {
      const activeIndex = menuItems.findIndex((item) => item.href === pathname);
      const activeEl = activeIndex !== -1 ? linkRefs.current[activeIndex] : null;
      updateIndicatorTo(activeEl);
    };
    // Espera a que el layout/tipografías se asienten tras el cambio de ruta
    const r1 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const t = setTimeout(measure, 250);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [pathname, menuItems.length]);

  /* === SECCIÓN ACTUAL (pt 22) === */
  const currentSection = useMemo(() => {
    const exact = menuItems.find((i) => i.href === pathname);
    if (exact) return exact.label;
    const prefix = menuItems
      .filter((i) => i.href !== "/" && pathname.startsWith(i.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (prefix) return prefix.label;
    if (pathname.startsWith("/perfil")) return "Mi perfil";
    if (pathname.startsWith("/login") || pathname.startsWith("/register"))
      return "Acceso";
    return "Inicio";
  }, [pathname, menuItems]);

  /* === LOGOUT === */
  const requestLogout = () => {
    setMenuOpen(false);
    setMobileOpen(false);
    setConfirmLogout(true);
  };

  const handleLogout = async () => {
    setConfirmLogout(false);
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
        {/* LOGO + SECCIÓN ACTUAL */}
        <div className="d-flex align-items-center" style={{ gap: "0.6rem" }}>
          <Link href="/" className="navbar-logo d-flex align-items-center">
            <img
              src={IMG.logo}
              alt="Logo JM"
              width={75}
              height={55}
              className="me-2"
            />
          </Link>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentSection}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              style={{
                fontWeight: 600,
                fontSize: "0.92rem",
                color: "#8d7a6a",
                borderLeft: "1px solid #E6CCB2",
                paddingLeft: "0.6rem",
                whiteSpace: "nowrap",
              }}
            >
              {currentSection}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* MENÚ DESKTOP */}
        <div
          className="position-relative d-none d-md-block"
          style={{ flex: 1.5 }}
          onMouseLeave={handleMenuLeave}
        >
          <ul
            className="navbar-menu d-flex justify-content-center align-items-center mb-0"
            style={{ fontWeight: 600, listStyle: "none", gap: "2.4rem" }}
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
                    style={{ color: isActive ? "#B08968" : "#2B2B2B", fontWeight: 600, fontSize: "1.08rem", letterSpacing: "0.01em", whiteSpace: "nowrap" }}
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
          {/* Selector de idioma (siempre visible en desktop) */}
          <div className="d-none d-md-inline-flex me-2 align-items-center">
            <LanguageSwitcher />
          </div>

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
            <motion.button
              onClick={() => router.push("/login")}
              className="btn rounded-pill px-4 py-2 d-none d-md-inline-flex align-items-center gap-2"
              style={{ border: "1.5px solid #B08968", color: "#6B4E3D", backgroundColor: "#fff8f3", fontWeight: 600 }}
              whileHover={{ scale: 1.05, backgroundColor: "#B08968", color: "#fff", boxShadow: "0 6px 18px rgba(176,137,104,0.35)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              {t("login")}
            </motion.button>
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
                        {t("editProfile")}
                      </button>
                      <button
                        className="btn"
                        style={{ background: "#C9AD8D", color: "#fff", fontWeight: 600, border: "none", borderRadius: "10px" }}
                        onClick={() => { setMenuOpen(false); router.push("/perfil/citas_agendadas"); }}
                      >
                        {t("myAppointments")}
                      </button>
                      <button
                        className="btn mt-2"
                        style={{ background: "#fff3ef", color: "#b02e2e", fontWeight: 600, border: "1px solid #e4bfbf", borderRadius: "10px" }}
                        onClick={requestLogout}
                      >
                        {t("logout")}
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
              <button className="user-action-btn" onClick={requestLogout} style={{ color: "#b02e2e" }}>
                {t("logout")}
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

      {/* MODAL CONFIRMAR CERRAR SESIÓN (pt 27) */}
      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            key="logout-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setConfirmLogout(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(3px)", zIndex: 2000,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-4 shadow-lg p-4 text-center"
              style={{ maxWidth: 360, width: "100%", background: "linear-gradient(135deg, #fffdfb 0%, #f8f3ed 100%)" }}
            >
              <h5 className="fw-bold mb-2" style={{ color: "#6B4E3D" }}>
                {t("logoutConfirm")}
              </h5>
              <p className="mb-4" style={{ color: "#8d7a6a", fontSize: "0.92rem" }}>
                {t("logoutMessage")}
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn flex-fill"
                  style={{ background: "#E9E0D1", color: "#4B3A2E", fontWeight: 600, border: "none", borderRadius: "10px" }}
                  onClick={() => setConfirmLogout(false)}
                >
                  {tc("cancel")}
                </button>
                <button
                  className="btn flex-fill"
                  style={{ background: "#b02e2e", color: "#fff", fontWeight: 600, border: "none", borderRadius: "10px" }}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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