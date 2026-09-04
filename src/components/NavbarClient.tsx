"use client";

import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import InsigniaSeleccion from "./InsigniaSeleccion";

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

  // La barra se afirma al desplazar (más opaca y con borde). passive:true
  // porque el listener no llama a preventDefault: así el navegador no tiene
  // que esperarlo para desplazar y el scroll no se siente pesado.
  const [desplazado, setDesplazado] = useState(false);
  useEffect(() => {
    const alDesplazar = () => setDesplazado(window.scrollY > 8);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);
  const linkRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  /** El portal del menú móvil solo existe en el cliente. */
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  /* Con el menú abierto la página de atrás no debe desplazarse: si no, se
     scrollea el fondo mientras el panel se queda quieto. */
  useEffect(() => {
    if (!mobileOpen) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [mobileOpen]);

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
    // Grupo propio, no "accion". Compartir grupo con "Agendar cita" hacía
    // que no se dibujara separador entre ambos y "Administrar" quedara
    // pegado al botón, como si fuera parte de él. Y no lo es: uno es la
    // acción que el sitio le pide a un paciente, el otro es el panel
    // privado de la doctora.
    if (user?.rol === "admin")
      base.push({ label: t("admin"), href: "/administrar", grupo: "privado" });
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
    // `offsetLeft` NO sirve aquí: los <li> cuelgan del <ul> y el indicador
    // del <div class="position-relative"> que lo envuelve, así que cada uno
    // mide contra un offsetParent distinto y el subrayado salía corrido el
    // ancho del propio <ul>. Medimos el <li> contra el elemento respecto al
    // que el indicador se posiciona de verdad, sea cual sea el anidamiento.
    //
    // Sumamos la cadena de offsetParent hasta esa base en vez de restar
    // getBoundingClientRect: el <li> lleva `whileHover: scale(1.05)` y los
    // rects SÍ incluyen ese transform — el subrayado crecería con el cursor.
    // offsetLeft/offsetWidth son valores de layout y lo ignoran.
    const base = indicatorRef.current?.offsetParent as HTMLElement | null;
    if (!base) return;
    let left = 0;
    let nodo: HTMLElement | null = el;
    while (nodo && nodo !== base) {
      left += nodo.offsetLeft;
      nodo = nodo.offsetParent as HTMLElement | null;
    }
    if (!nodo) return; // el indicador y el enlace no comparten cadena
    const next = { left, width: el.offsetWidth };
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

    // El indicador guarda una POSICIÓN (offsetLeft/offsetWidth), no una
    // referencia al elemento. Cualquier cosa que reacomode la barra deja esa
    // posición obsoleta y el subrayado aparece bajo el enlace equivocado.
    //
    // Pasaba en cada carga: mientras AuthContext resuelve, el bloque derecho
    // no ocupa nada; al resolver aparece "Iniciar sesión" (o el avatar, y con
    // un admin también el enlace "Administrar"), el menú centrado se
    // redistribuye y el subrayado se quedaba donde estaba — visualmente,
    // debajo del siguiente enlace.
    //
    // Un ResizeObserver reacciona al reacomodo real, en vez de adivinarlo con
    // temporizadores. Observamos también cada <li>: el <ul> tiene ancho fijo
    // (flex: 1.5), así que al aparecer "Iniciar sesión" los enlaces se
    // reacomodan DENTRO sin que el <ul> cambie de tamaño — observarlo solo a
    // él no disparaba nada y el subrayado se quedaba donde estaba.
    measure();
    const ro = new ResizeObserver(measure);
    if (menuRef.current) ro.observe(menuRef.current);
    if (dropdownRef.current) ro.observe(dropdownRef.current);
    for (const li of linkRefs.current) if (li) ro.observe(li);

    // El caso que rompía la carga: al resolver AuthContext aparece "Iniciar
    // sesión" y la fila se recentra. Eso mueve los enlaces sin cambiar el
    // tamaño de nadie, y un ResizeObserver no ve movimiento. Por eso el
    // efecto depende de `loading`/`user` y vuelve a medir en el frame
    // siguiente al repintado.
    const raf = requestAnimationFrame(measure);

    // Las fuentes cambian el ancho de los enlaces al terminar de cargar.
    document.fonts?.ready.then(measure).catch(() => {});

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
    // Importante: depender de `menuItems` (no solo .length) para que se
    // re-mida cuando cambian las etiquetas (cambio de idioma).
  }, [pathname, menuItems, loading, user]);


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
      /* Sin `py-3`: las utilidades de Bootstrap llevan !important, así que
         esa clase le ganaba a cualquier padding nuestro y la barra volvía a
         crecer al agrandar el logo. El alto se decide en .navbar-container. */
      className={`navbar navbar-container ${desplazado ? "is-scrolled" : ""}`}
      /* El fondo sale del token, no de un blanco fijo.
         Estaba quemado en "#FFFFFF" EN LÍNEA, y el estilo en línea le gana a
         cualquier regla de tema: en modo oscuro la barra se quedaba blanca.
         Y como el logo SÍ recibe su filtro de oscuro (brightness(0)
         invert(1), que lo vuelve blanco), quedaba un logo blanco sobre una
         barra blanca — invisible. Se veía en el móvil de Juan: barra en
         blanco con solo la hamburguesa apenas marcada. */
      style={{ backgroundColor: "var(--bg-elevated)", position: "sticky", top: 0, zIndex: 1000 }}
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
              className="me-2 navbar-logo-img"
              /* Antes iba `width: auto; height: auto` en línea, y el estilo
                 en línea le gana a la hoja: la imagen se pintaba a su
                 tamaño intrínseco, 96px de alto, y ella sola estiraba la
                 navbar de escritorio hasta 128px. La medida se decide ahora
                 en CSS (.navbar-logo img), que es donde puede cambiar por
                 breakpoint. Se dan los dos ejes para conservar la
                 proporción 75×55 y no disparar el aviso de next/image. */
            />
          </Link>
          {/* Aquí iba la "sección actual" ("Inicio", "Procedimientos"…) en
              móvil. Se quitó: la página ya dice en qué sección estás —con
              su propio titular, a pantalla completa— así que era la misma
              información dos veces, y en 375px se comía hasta un 38 % del
              ancho de la barra por repetirla. Ese ancho es lo que ahora
              deja respirar al logo y a la hamburguesa. */}
        </div>

        {/* MENÚ DESKTOP */}
        <div
          className="position-relative d-none d-md-block"
          style={{ flex: 1.5 }}
          onMouseLeave={handleMenuLeave}
        >
          <ul
            ref={menuRef}
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

          {/* Un div normal con transición CSS, no un motion.div: framer no
              llegaba a aplicar el `animate` de left/width en el primer commit
              (la fibra ya tenía la medida correcta y el DOM seguía en 0), así
              que en la carga el subrayado no aparecía. Para un subrayado de
              3px la transición del navegador basta y es determinista. */}
          <div
            ref={indicatorRef}
            className="navbar-indicator"
            style={{
              position: "absolute",
              bottom: -2,
              height: "3px",
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.width ? 1 : 0,
              background: "linear-gradient(90deg, var(--brand), #ffe4c0, #b08968)",
              borderRadius: "3px",
              pointerEvents: "none",
              transition:
                "left var(--mov-lento) var(--mov-curva), width var(--mov-lento) var(--mov-curva), opacity var(--mov-normal) ease",
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

          {/* La selección va ANTES del perfil y no dentro del menú de la
              cuenta: se llena estando sin sesión, así que esconderla tras
              "iniciar sesión" la volvería invisible justo para quien la
              está usando. Se muestra sola cuando tiene algo dentro. */}
          <InsigniaSeleccion />

          {/* PERFIL DESKTOP
              El botón de "Iniciar sesión" NAVEGA a /login; no despliega un
              panel. Decidido así a propósito: un desplegable que solo
              contiene "entrar" y "registrarse" añade un paso para llegar a
              una página a la que ibas de todos modos, es incoherente con el
              CTA de al lado —"Agendar cita" navega— y en móvil no hay sitio
              para desplegarlo. El desplegable se reserva para cuando SÍ hay
              sesión, que es cuando hay varias acciones distintas que ofrecer. */}
          {loading ? null : !user ? (
            <motion.button
              onClick={() => router.push("/login")}
              className="btn rounded-pill px-4 py-2 d-none d-md-inline-flex align-items-center gap-2"
              style={{ border: "1.5px solid var(--brand)", color: "var(--brand-deep)", backgroundColor: "var(--surface)", fontWeight: 600 }}
              whileHover={{ scale: 1.05, backgroundColor: "var(--brand)", color: "var(--brand-contrast)", boxShadow: "0 6px 18px rgba(176,137,104,0.35)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              {t("login")}
            </motion.button>
          ) : (
            <>
              <motion.button
                onClick={() => setMenuOpen((p) => !p)}
                /* Sin `bg-white`: es una clase de Bootstrap con el blanco
                   fijo, así que en modo oscuro el botón de la cuenta se
                   quedaba blanco sobre la barra oscura. El fondo sale del
                   token, como el resto. */
                className={`user-button d-none d-md-flex align-items-center border-0 rounded-pill shadow-sm px-2 py-1 ${pathname.startsWith("/perfil") ? "is-active-route" : ""}`}
                style={{ position: "relative", background: "var(--bg-elevated)" }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("profileAlt")}
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
                    initial={{ y: -8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 12, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.94 }}
                    transition={{ type: "spring", damping: 22, stiffness: 320, mass: 0.6 }}
                    className="profile-menu position-absolute rounded-4 p-3"
                    style={{
                      top: "110%", right: 0, minWidth: "248px", zIndex: 100,
                      transformOrigin: "top right",
                    }}
                  >
                    {/* Rediseño del indicador de cuenta.
                        Antes: un avatar de 70px repetido (ya está en el
                        botón que abre el menú), el nombre y el correo
                        centrados, y TRES botones de ancho completo en tres
                        colores distintos —suave, primario y rojo— para lo
                        que es una lista de navegación. Tres pesos visuales
                        compitiendo obligan a leerlos todos para elegir uno.
                        Y una X para cerrar, en un menú que ya se cierra al
                        pulsar fuera o con Escape.

                        Ahora: la identidad arriba, alineada a la izquierda y
                        con el avatar pequeño; debajo una lista donde todas
                        las opciones pesan igual; y cerrar sesión separada por
                        una línea, porque es la única que no lleva a ninguna
                        parte. */}
                    <div className="profile-menu-id">
                      <Avatar
                        src={userPhoto}
                        alt=""
                        fallback={avatarFallback}
                        className="profile-menu-avatar"
                        style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="profile-menu-name">{user.nombres}</div>
                        <div className="profile-menu-email">{user.email}</div>
                      </div>
                    </div>

                    <div className="profile-menu-lista" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className="profile-menu-item"
                        onClick={() => { setMenuOpen(false); router.push("/perfil/citas_agendadas"); }}
                      >
                        {t("myAppointments")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="profile-menu-item"
                        onClick={() => { setMenuOpen(false); router.push("/perfil/editar_info"); }}
                      >
                        {t("editProfile")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="profile-menu-item profile-menu-item-salir"
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

      {/* Los overlays (sidebar, backdrop, modal) se montan en <body> con un
          portal. Dentro del <nav> no funcionaban: el nav lleva
          `backdrop-filter` para el efecto de cristal, y eso (a) rasteriza todo
          su subárbol en una capa que se compone con el desenfoque del fondo —
          por eso el sidebar se veía transparente aunque su fondo es opaco — y
          (b) convierte al nav en bloque contenedor de los `position: fixed`,
          así que el overlay se posicionaba contra la barra y no contra la
          pantalla. */}
      {montado && createPortal(
        <>
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
            initial={false}
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
              initial={{ scale: 0.9, y: 20 }}
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
                  style={{ background: "var(--danger)", color: "#fff", fontWeight: 600, border: "none", borderRadius: "10px" }}
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
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-backdrop"
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", zIndex: 1400 }}
          />
        )}
      </AnimatePresence>
        </>,
        document.body
      )}
    </nav>
  );
}