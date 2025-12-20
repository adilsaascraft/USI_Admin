
// components/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaBuilding,
  FaUsers,
  FaUserCheck,
  FaTruck,
  FaHotel,
  FaListUl,
  FaBullhorn,
  FaHome,
  FaCog,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import clsx from "clsx";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: <FaCalendarAlt size={20} /> },
  { name: "USI Webinar", href: "/webinar", icon: <FaUsers size={20} /> },
  { name: "Assign", href: "/assigns", icon: <FaUserCheck size={20} /> },
  { name: "Organizer", href: "/organizers", icon: <FaUser size={20} /> },
  { name: "Department", href: "/departments", icon: <FaBuilding size={20} /> },
  { name: "Supplier", href: "/suppliers", icon: <FaTruck size={20} /> },
  {
    name: "Hotel",
    icon: <FaHotel size={20} />,
    children: [
      { name: "Hotel", href: "/hotel-details", icon: <FaHotel size={18} /> },
      { name: "Room Category", href: "/room-category", icon: <FaListUl size={18} /> },
    ],
  },
  { name: "Venue", href: "/venues", icon: <FaMapMarkerAlt size={20} /> },
  { name: "Announcement", href: "/announcements", icon: <FaBullhorn size={20} /> },
  { name: "Payment Gateway", href: "/payment-gateway", icon: <FaMoneyCheckAlt size={20} /> },
];

function SidebarComponent() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const toggleMenu = (name: string) =>
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));

  const isActive = (href?: string) => href && pathname === href;
  const isChildActive = (children?: any[]) =>
    children?.some((c) => pathname === c.href);

  const baseItem =
    "flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors";
  const inactive =
    "text-black hover:bg-white hover:text-sky-800 dark:text-foreground dark:hover:bg-muted dark:hover:text-sky-800";
  const active =
    "bg-white text-sky-800 dark:bg-muted dark:text-sky-800 dark:hover:bg-muted";

  return (
    <motion.div
      animate={{ width: collapsed ? 60 : 240 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="min-h-screen bg-sky-50 p-2 flex flex-col relative dark:bg-background dark:text-foreground border-r overflow-hidden"
    >
      {!isMobile && (
  <div className="relative mb-4">
    <button
      onClick={() => setCollapsed(!collapsed)}
      className={`absolute top-1/4 -translate-y-1/2 pr-2 mt-2
        transition-all duration-300 ease-in-out
        ${collapsed ? "left-3" : "-right-5"}`}
      title={collapsed ? "Expand" : "Collapse"} // Tooltip on hover
    >
      {collapsed ? (
  <FaChevronRight className="w-4 h-4 transition-transform duration-300" />
) : (
  <FaChevronLeft className="w-4 h-4 transition-transform duration-300" />
)}

    </button>
  </div>
)}


      {isMobile && (
        <Link
          href="/home"
          className={clsx(
            baseItem,
            isActive("/home") ? active : inactive,
            "mb-2 justify-center"
          )}
          title="Home"
        >
          <FaHome size={20} />
        </Link>
      )}

      <nav className="flex flex-col space-y-1 mt-2 flex-1">
        {sidebarItems.map((item) => {
          const isParentActive = isActive(item.href) || isChildActive(item.children);

          if (item.children) {
            const isOpen = openMenus[item.name] || isParentActive;
            return (
              <div key={item.name}>
                {!collapsed && (
                  <div
                    className={clsx(baseItem, isParentActive ? active : inactive, "mt-1 mb-1")}
                    onClick={() => toggleMenu(item.name)}
                    title={collapsed ? item.name : undefined}
                  >
                    {item.icon}
                    <span className="font-semibold">{item.name}</span>
                  </div>
                )}

                {(collapsed || isOpen) && (
                  <div className={clsx(collapsed ? "space-y-3 mt-2" : "ml-6 space-y-1")}>
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={clsx(
                          baseItem.replace("py-2", "py-1"),
                          isActive(child.href) ? active : inactive,
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? child.name : undefined}
                      >
                        {child.icon}
                        {!collapsed && <span className="text-sm">{child.name}</span>}
                      </Link>
                    ))}

                    {isMobile && (
                      <Link
                        href="/settings"
                        className={clsx(
                          baseItem.replace("py-2", "py-1"),
                          isActive("/settings") ? active : inactive,
                          "mt-2 justify-center"
                        )}
                        title="Settings"
                      >
                        <FaCog size={18} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={clsx(
                baseItem,
                isActive(item.href) ? active : inactive,
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              {item.icon}
              {!collapsed && <span className="font-semibold">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}

export default memo(SidebarComponent);
