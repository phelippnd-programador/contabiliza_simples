import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { AppMenuItem } from "./types";



type AppMenuProps = {
  title?: string;
  subtitle?: string;
  menu: AppMenuItem[];
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Retorna true se algum filho (direto ou profundo) estiver ativo para o pathname */
const hasActiveChild = (item: AppMenuItem, pathname: string): boolean => {
  if (!item.children?.length) return false;

  return item.children.some((c) => {
    const match =
      !!c.to && (c.end ? pathname === c.to : pathname.startsWith(c.to));
    if (match) return true;
    return hasActiveChild(c, pathname);
  });
};

const AppMenu = ({ title = "Menu", subtitle, menu, className }: AppMenuProps) => {
  const [open, setOpen] = useState(false);

  // estado manual: só guarda o que o usuário mexeu
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const { pathname } = useLocation();

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  // abre automaticamente grupos que têm rota ativa (DERIVADO, sem setState em effect)
  const autoOpenGroups = useMemo((): Record<string, boolean> => {
    const next: Record<string, boolean> = {};
    const walk = (items: AppMenuItem[]) => {
      for (const it of items) {
        if (it.children?.length) {
          if (hasActiveChild(it, pathname)) next[it.id] = true;
          walk(it.children);
        }
      }
    };
    walk(menu);
    return next;
  }, [menu, pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const current = prev[id] ?? autoOpenGroups[id] ?? false;
      return { ...prev, [id]: !current };
    });
  };

  // ESC fecha o drawer
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // trava scroll do body quando aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const renderItem = (item: AppMenuItem, level = 0) => {
    const paddingLeft = level === 0 ? "pl-3" : level === 1 ? "pl-8" : "pl-12";

    if (item.disabled) {
      return (
        <div
          key={item.id}
          className={cx(
            "flex items-center gap-3 rounded-lg py-2 text-sm text-gray-400",
            paddingLeft,
            "pr-3"
          )}
        >
          {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
          <span>{item.label}</span>
        </div>
      );
    }

    // Grupo (submenu)
    if (item.children?.length) {
      const isOpen = openGroups[item.id] ?? autoOpenGroups[item.id] ?? false;

      return (
        <div key={item.id} className="select-none">
          <button
            type="button"
            onClick={() => toggleGroup(item.id)}
            className={cx(
              "flex w-full items-center gap-3 rounded-lg py-2 text-sm transition",
              "text-gray-800 hover:bg-gray-100 active:bg-gray-200",
              paddingLeft,
              "pr-3"
            )}
            aria-expanded={isOpen}
          >
            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
            <span className="flex-1 text-left">{item.label}</span>

            {/* caret */}
            <svg
              className={cx(
                "h-4 w-4 text-gray-500 transition-transform",
                isOpen && "rotate-180"
              )}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isOpen ? (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => renderItem(child, level + 1))}
            </div>
          ) : null}
        </div>
      );
    }

    // Item normal
    if (!item.to) {
      return (
        <div
          key={item.id}
          className={cx("rounded-lg py-2 text-sm text-gray-500", paddingLeft, "pr-3")}
        >
          {item.label}
        </div>
      );
    }

    return (
      <NavLink
        key={item.id}
        to={item.to}
        end={item.end}
        onClick={() => {
          item.onClick?.();
          close(); // fecha ao navegar
        }}
        className={({ isActive }) =>
          cx(
            "flex items-center gap-3 rounded-lg py-2 text-sm transition",
            paddingLeft,
            "pr-3",
            isActive
              ? "bg-blue-500 text-white"
              : "text-gray-800 hover:bg-gray-100 active:bg-gray-200"
          )
        }
      >
        {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Topbar */}
      <header className={cx("sticky top-0 z-40 flex h-14 items-center gap-3 bg-white px-4", className)}>
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="inline-flex 
          h-10 
          w-10 
          items-center 
          justify-center 
          rounded-lg 
          
          hover:bg-gray-50 
          active:scale-[0.98]"
        >
          {/* Hambúrguer / X */}
          <div className="relative h-4 w-5">
            <span
              className={cx(
                "absolute left-0 top-0 h-0.5 w-5 rounded bg-gray-800 transition",
                open && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cx(
                "absolute left-0 top-[7px] h-0.5 w-5 rounded bg-gray-800 transition",
                open ? "opacity-0" : "opacity-100"
              )}
            />
            <span
              className={cx(
                "absolute left-0 top-[14px] h-0.5 w-5 rounded bg-gray-800 transition",
                open && "translate-y-[-7px] -rotate-45"
              )}
            />
          </div>
        </button>
      </header>

      {/* Overlay */}
      <div
        className={cx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />

      {/* Drawer */}
      <aside
        className={cx(
          "fixed left-0 top-0 z-50 h-dvh w-80 max-w-[85vw] bg-white shadow-xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header do drawer */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            {subtitle ? <span className="text-xs text-gray-500">{subtitle}</span> : null}
          </div>

          <button
            type="button"
            onClick={close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg    hover:bg-gray-50"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Menu */}
        <nav className="p-2 space-y-1">
          {menu.map((item) => renderItem(item, 0))}
        </nav>

        {/* Rodapé */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <button
            type="button"
            className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={close}
          >
            Fechar
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppMenu;
