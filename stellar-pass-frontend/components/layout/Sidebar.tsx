"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  User,
  Settings,
  ChevronLeft,
  LogOut,
  Ticket,
} from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";

const iconMap = {
  LayoutDashboard,
  Calendar,
  User,
  Settings,
  Ticket,
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" as const },
  { href: "/dashboard/events", label: "Events", icon: "Calendar" as const },
  { href: "/dashboard/profile", label: "Profile", icon: "User" as const },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" as const },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { publicKey, walletType, disconnect } = useWallet();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-stellar">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold font-display text-gray-900 dark:text-white">
              Dashboard
            </span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-stellar-50 text-stellar-700 shadow-sm dark:bg-stellar-950/50 dark:text-stellar-300"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-stellar-600 dark:text-stellar-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        {publicKey && (
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-stellar" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {truncateAddress(publicKey, 8)}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">{walletType}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={disconnect}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-danger-600 dark:hover:bg-gray-800 dark:hover:text-danger-400 transition-colors"
                title="Disconnect"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
