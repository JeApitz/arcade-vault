"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MOBILE_PANEL_ID = "av-mobile-panel";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isInicio = pathname === "/";
  const isBiblioteca = pathname === "/games" || pathname.startsWith("/juegos/");
  const isSalon = pathname === "/salon";
  const isAuth = pathname === "/auth";
  const isAcercaDe = pathname === "/about";

  const close = () => setOpen(false);

  // M7: cierre con Escape + scroll lock del body mientras el panel está abierto.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={isInicio ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/games" className={isBiblioteca ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isSalon ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isAcercaDe ? "active" : ""}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        <Link href="/auth" className="btn auth-btn">
          Iniciar Sesión
        </Link>
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
          aria-expanded={open}
          aria-controls={MOBILE_PANEL_ID}
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
        aria-hidden="true"
      ></div>
      <aside
        id={MOBILE_PANEL_ID}
        className={"av-mobile-panel" + (open ? " open" : "")}
        inert={!open}
      >
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={isInicio ? "active" : ""} onClick={close}>
          Inicio
        </Link>
        <Link href="/games" className={isBiblioteca ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={isSalon ? "active" : ""} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/about" className={isAcercaDe ? "active" : ""} onClick={close}>
          Acerca de
        </Link>
        <Link href="/auth" className={isAuth ? "active" : ""} onClick={close}>
          Iniciar Sesión
        </Link>
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
