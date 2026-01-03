import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { AppMenuItem } from "./types";
import { getUserProfile } from "../../../shared/services/userProfile.service";

type AppMenuProps = {
  title?: string;
  subtitle?: string;
  menu: AppMenuItem[];
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const hasActiveChild = (item: AppMenuItem, pathname: string): boolean => {
  if (!item.children?.length) return false;

  return item.children.some((c) => {
    const match = !!c.to && (c.end ? pathname === c.to : pathname.startsWith(c.to));
    if (match) return true;
    return hasActiveChild(c, pathname);
  });
};

const getInitials = (value?: string) => {
  if (!value) return "U";
  const parts = value.trim().split(/\s+/g);
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
};

const AppMenu = ({ title = "Menu", subtitle, menu, className }: AppMenuProps) => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Usuario");
  const [profileRole, setProfileRole] = useState("Conta");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const profile = await getUserProfile();
      if (!isMounted) return;
      const name = profile.nome?.trim() || "Usuario";
      setProfileName(name);
      setProfileRole(profile.email ? "Conta" : "Perfil");
      setProfilePhoto(profile.fotoUrl ?? null);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const renderItem = (item: AppMenuItem, level = 0, forceExpanded = false) => {
    const isGroup = !!item.children?.length;
    const isOpen = openGroups[item.id] ?? autoOpenGroups[item.id] ?? false;
    const hideLabel = collapsed && !forceExpanded;
    const basePadding = hideLabel ? "px-3" : level === 0 ? "px-4" : "pl-12 pr-4";

    if (item.disabled) {
      return (
        <div
          key={item.id}
          className={cx(
            "flex items-center gap-3 rounded-xl py-2 text-sm text-gray-400",
            basePadding
          )}
        >
          {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
          {!hideLabel && <span>{item.label}</span>}
        </div>
      );
    }

    if (isGroup) {
      return (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => collapsed && setHoverGroup(item.id)}
          onMouseLeave={() => collapsed && setHoverGroup(null)}
        >
          <button
            type="button"
            onClick={() => (!collapsed ? toggleGroup(item.id) : undefined)}
            className={cx(
              "flex w-full items-center gap-3 rounded-xl py-2 text-sm",
              "text-gray-700 hover:bg-gray-100",
              basePadding
            )}
            aria-expanded={collapsed ? false : isOpen}
            title={hideLabel ? item.label : undefined}
          >
            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
            {!hideLabel && <span className="flex-1 text-left">{item.label}</span>}
            {!hideLabel ? (
              <svg
                className={cx("h-4 w-4 text-gray-400 transition", isOpen && "rotate-180")}
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
            ) : null}
          </button>

          {collapsed && hoverGroup === item.id ? (
            <div className="absolute left-full top-0 z-40 ml-3 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <div className="px-2 pb-2 text-xs uppercase tracking-wide text-gray-400">
                {item.label}
              </div>
              {item.children?.map((child) => renderItem(child, level + 1, true))}
            </div>
          ) : null}

          {!collapsed && isOpen ? (
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => renderItem(child, level + 1))}
            </div>
          ) : null}
        </div>
      );
    }

    if (!item.to) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className={cx(
            "flex w-full items-center gap-3 rounded-xl py-2 text-sm",
            "text-gray-700 hover:bg-gray-100",
            basePadding
          )}
          title={collapsed ? item.label : undefined}
        >
          {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
          {!hideLabel && <span>{item.label}</span>}
        </button>
      );
    }

    return (
      <NavLink
        key={item.id}
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cx(
            "flex items-center gap-3 rounded-xl py-2 text-sm",
            basePadding,
            isActive
              ? "bg-gray-900 text-white"
              : "text-gray-700 hover:bg-gray-100"
          )
        }
        title={hideLabel ? item.label : undefined}
      >
        {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
        {!hideLabel && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cx(
        "sticky top-0 flex h-screen flex-col border-r border-gray-200 bg-white",
        collapsed ? "w-20" : "w-72",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-2xl bg-gray-100 text-gray-700">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Foto do usuario"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                {getInitials(profileName)}
              </div>
            )}
          </div>
          {!collapsed ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                {profileRole}
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {profileName}
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          onClick={() => setCollapsed((prev) => !prev)}
          className={cx(
            "inline-flex h-8 w-8 items-center justify-center rounded-full",
            "border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
          )}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={cx("h-4 w-4 transition", collapsed && "rotate-180")}
          >
            <path
              fillRule="evenodd"
              d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L6.47 10.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="px-4 pt-4 text-xs uppercase tracking-wide text-gray-400">
        {title}
      </div>
      {subtitle && !collapsed ? (
        <div className="px-4 pt-1 text-xs text-gray-500">{subtitle}</div>
      ) : null}

      <nav className="mt-4 flex-1 space-y-1 overflow-auto px-2 pb-4">
        {menu.map((item) => renderItem(item, 0))}
      </nav>

      <div className="border-t border-gray-200 p-3 text-xs text-gray-400">
        {!collapsed ? "SETTINGS" : ""}
      </div>
    </aside>
  );
};

export default AppMenu;
