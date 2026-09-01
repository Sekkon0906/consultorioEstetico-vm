"use client";

import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { IMG } from "@/lib/imagenes";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

/**
 * Avatar robusto: usa <img> nativo (no next/image) con
 * referrerPolicy="no-referrer" — clave para que las fotos de Google
 * (lh3.googleusercontent.com) no fallen por política de referer — y
 * fallback automático a un avatar generado si la imagen no carga.
 */
function Avatar({
  src,
  alt,
  fallback,
  className,
  style,
}: {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const finalSrc = failed || !src ? fallback : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      style={{ objectFit: "cover", ...style }}
    />
  );
}

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
  // `grupo` agrupa los enlaces por intención para poder separarlos
  // visualmente: sin eso los 7 enlaces se leen como una fila de palabras
  // sueltas flotando. "conoce" es quién es y dónde atiende, "servicios" es
  // qué ofrece, "accion" es lo que se hace (agendar) y el panel privado.
  const menuItems = useMemo(() => {
    const base = [
      { label: t("home"),         href: "/",               grupo: "conoce"    },
      { label: t("doctor"),       href: "/doctora",        grupo: "conoce"    },
      { label: t("office"),       href: "/consultorio",    grupo: "conoce"    },
      { label: t("procedures"),   href: "/procedimientos", grupo: "servicios" },
      { label: t("testimonials"), href: "/testimonios",    grupo: "servicios" },
      { label: t("book"),         href: "/agendar",        grupo: "accion"    },
    ];
    if (user?.rol === "admin" || user?.rol === "developer")
      base.push({ label: t("admin"), href: "/administrar", grupo: "accion" });
    return base;
  }, [user?.rol, t]);

  /* === INDICADOR ACTIVO === */
  const updateIndicatorTo = (el: HTMLLIElement | null) => {
    if (!el) return;
    // El CTA ("Agendar cita") es un botón con fondo propio: un subrayado
    // debajo se vería suelto, así que ahí se esconde el indicador.
    if (el.classList.contains("navbar-cta-item")) {
      setIndicator((prev) => (prev.width === 0 ? prev : { ...prev, width: 0 }));
      return;
    }
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
    // Espera a que el layout/tipografías/traducciones se asienten
    const r1 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const t1 = setTimeout(measure, 80);
    const t2 = setTimeout(measure, 250);
    const t3 = setTimeout(measure, 600); // re-mide tras animaciones de framer-motion
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", measure);
    };
    // Importante: depender de `menuItems` (no solo .length) para que se
    // re-mida cuando cambian las etiquetas (cambio de idioma).
  }, [pathname, menuItems]);

  /* === SECCIÓN ACTUAL (pt 22) === */
  const currentSection = useMemo(() => {
    const exact = menuItems.find((i) => i.href === pathname);
    if (exact) return exact.label;
    const prefix = menuItems
      .filter((i) => i.href !== "/" && pathname.startsWith(i.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (prefix) return prefix.label;
    if (pathname.startsWith("/perfil")) return t("profileSection");
    if (pathname.startsWith("/legal")) return t("legalSection");
    if (pathname.startsWith("/login") || pathname.startsWith("/register"))
      return "Acceso";
    return "Inicio";
  }, [pathname, menuItems, t]);

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
    // El mouse sale del menú justo cuando se hace clic para navegar — en
    // ese instante `pathname` (de React) todavía no se actualizó, porque
    // la navegación es asíncrona. Usar ese valor movía el indicador de
    // vuelta a la página ANTERIOR por un instante (el "salto") hasta que
    // el efecto de arriba lo corregía. window.location.pathname es la URL
    // real del navegador, que sí cambia de inmediato al hacer clic.
    const current = typeof window !== "undefined" ? window.location.pathname : pathname;
    const activeIndex = menuItems.findIndex((item) => item.href === current);
    updateIndicatorTo(linkRefs.current[activeIndex] || null);
  };

  // Fallback siempre disponible (avatar generado con iniciales).
  const avatarFallback = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
        (user.nombres + " " + user.apellidos).trim()
      )}&background=E6CCB2&color=7F5539`
    : "https://ui-avatars.com/api/?name=JM&background=E6CCB2&color=7F5539";

  const userPhoto = user?.photo || avatarFallback;

  return (
    <nav
      className="navbar navbar-container shadow-sm py-3"
      style={{ backgroundColor: "#FFFFFF", position: "sticky", top: 0, zIndex: 1000 }}
    >
      <div
        className="container-fluid d-flex align-items-center justify-content-between"
        style={{ padding: "0 1.2rem", position: "relative" }}
      >
        {/* LOGO + SECCIÓN ACTUAL */}
        <div className="d-flex align-items-center" style={{ gap: "0.6rem" }}>
          <Link href="/" className="navbar-logo d-flex align-items-center">
            <Image
              src={IMG.logo}
              alt="Logo JM"
              width={75}
              height={55}
              priority
              className="me-2"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          {/* Solo en móvil. En escritorio el menú está a la vista y el
              subrayado ya indica dónde estás, así que repetirlo aquí solo
              robaba ancho a los enlaces. En móvil el menú va colapsado
              detrás de la hamburguesa y no hay otra pista de ubicación.
              Se recorta con ellipsis para no empujar la hamburguesa. */}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentSection}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              className="d-inline-block d-md-none"
              style={{
                fontWeight: 600,
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                borderLeft: "1px solid var(--border)",
                paddingLeft: "0.6rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "38vw",
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
            /* gap chico: cada enlace ya trae su propio padding lateral, que
               es lo que le da el área de clic y el fondo al pasar el cursor */
            style={{ fontWeight: 600, listStyle: "none", gap: "0.5rem" }}
          >
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              // Separador al cambiar de grupo: da estructura visual sin
              // agregar ruido ni ocupar apenas ancho.
              const abreGrupo = index > 0 && menuItems[index - 1].grupo !== item.grupo;
              // "Agendar cita" es la acción principal del sitio: va como
              // botón, no como un enlace más de la fila.
              const esCta = item.href === "/agendar";
              return (
                <Fragment key={item.href}>
                  {abreGrupo && <li aria-hidden="true" className="navbar-sep" />}
                  <motion.li
                    ref={(el) => { linkRefs.current[index] = el; }}
                    className={`nav-item ${esCta ? "navbar-cta-item" : ""}`}
                    style={{ cursor: "pointer" }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.18 }}
                    onMouseEnter={() => handleItemEnter(index)}
                  >
                    <Link
                      href={item.href}
                      className={`text-decoration-none navbar-link ${esCta ? "navbar-cta" : ""} ${isActive ? "navbar-link-active" : ""}`}
                      style={!esCta ? { color: isActive ? "var(--brand)" : "var(--text)" } : undefined}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                </Fragment>
              );
            })}
          </ul>

          <motion.div
            layout
            className="navbar-indicator"
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
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: mobileOpen ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {mobileOpen ? (
                <X size={30} strokeWidth={2.5} color="var(--brand-deep)" />
              ) : (
                <Menu size={30} strokeWidth={2.5} color="var(--brand-deep)" />
              )}
            </motion.div>
          </button>

          {/* PERFIL DESKTOP */}
          {loading ? null : !user ? (
            <motion.button
              onClick={() => router.push("/login")}
              className="btn rounded-pill px-4 py-2 d-none d-md-inline-flex align-items-center gap-2"
              style={{ border: "1.5px solid var(--brand)", color: "var(--brand-deep)", backgroundColor: "var(--surface)", fontWeight: 600 }}
              whileHover={{ scale: 1.05, backgroundColor: "var(--brand)", color: "#fff", boxShadow: "0 6px 18px rgba(176,137,104,0.35)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              {t("login")}
            </motion.button>
          ) : (
            <>
              <motion.button
                onClick={() => setMenuOpen((p) => !p)}
                className={`user-button d-none d-md-flex align-items-center border-0 bg-white rounded-pill shadow-sm px-2 py-1 ${pathname.startsWith("/perfil") ? "is-active-route" : ""}`}
                style={{ position: "relative" }}
              >
                <Avatar
                  src={userPhoto}
                  alt={t("profileAlt")}
                  fallback={avatarFallback}
                  style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #FFDDBF" }}
                />
                {/* Indicador inferior cuando se está en /perfil/* */}
                {pathname.startsWith("/perfil") && (
                  <motion.span
                    layoutId="user-button-indicator"
                    className="user-button-indicator"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="perfil-menu"
                    initial={{ opacity: 0, y: -8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 12, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.94 }}
                    transition={{ type: "spring", damping: 22, stiffness: 320, mass: 0.6 }}
                    className="profile-menu position-absolute rounded-4 p-3"
                    style={{
                      top: "110%", right: 0, minWidth: "260px", zIndex: 100,
                      textAlign: "center",
                      transformOrigin: "top right",
                    }}
                  >
                    <button
                      type="button"
                      className="profile-menu-close"
                      onClick={() => setMenuOpen(false)}
                      aria-label="Cerrar"
                    >
                      <X size={18} strokeWidth={2.2} />
                    </button>

                    <div className="text-center mb-3" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Avatar
                        src={userPhoto}
                        alt={t("profileAlt")}
                        fallback={avatarFallback}
                        className="profile-menu-avatar"
                        style={{ width: 70, height: 70, borderRadius: "50%", marginBottom: "0.4rem" }}
                      />
                      <div className="profile-menu-name">
                        {user.nombres}
                      </div>
                      <div className="profile-menu-email">{user.email}</div>
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        type="button"
                        className="profile-menu-btn profile-menu-btn-soft"
                        onClick={() => { setMenuOpen(false); router.push("/perfil/editar_info"); }}
                      >
                        {t("editProfile")}
                      </button>
                      <button
                        type="button"
                        className="profile-menu-btn profile-menu-btn-primary"
                        onClick={() => { setMenuOpen(false); router.push("/perfil/citas_agendadas"); }}
                      >
                        {t("myAppointments")}
                      </button>
                      <button
                        type="button"
                        className="profile-menu-btn profile-menu-btn-danger mt-2"
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

          {/* Tema e idioma salieron de aquí: el navbar de escritorio competía
              por espacio con 6 enlaces + login. Ahora viven en el acceso
              rápido flotante (QuickAccessFab, esquina inferior derecha). */}
        </div>
      </div>

      {/* SIDEBAR MÓVIL */}
      <div className={`mobile-sidebar ${mobileOpen ? "open" : ""}`} style={{ transition: "transform 0.4s ease, opacity 0.4s ease" }}>
        {user ? (
          <div className="mobile-sidebar-header" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Avatar src={userPhoto} alt={t("profileAlt")} fallback={avatarFallback} className="user-avatar" style={{ marginBottom: "0.8rem", borderRadius: "50%" }} />
            <div className="user-name">{user.nombres}</div>
            <div className="user-email">{user.email}</div>
            <div className="user-actions">
              <button className="user-action-btn" onClick={() => { setMobileOpen(false); router.push("/perfil/editar_info"); }}>
                {t("editProfile")}
              </button>
              <button className="user-action-btn" onClick={() => { setMobileOpen(false); router.push("/perfil/citas_agendadas"); }}>
                {t("myAppointments")}
              </button>
            </div>
          </div>
        ) : (
          <div className="mobile-sidebar-header">
            <button onClick={() => router.push("/login")} className="user-action-btn">
              {t("login")}
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
        {/* Footer del sidebar: controles + cerrar sesión al fondo */}
        <div className="mobile-sidebar-footer">
          <div className="mobile-sidebar-controls">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          {user && (
            <button className="mobile-sidebar-logout" onClick={requestLogout}>
              {t("logout")}
            </button>
          )}
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
              <h5 className="fw-bold mb-2" style={{ color: "var(--brand-deep)" }}>
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
                  {t("logout")}
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