'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FaCalendarAlt,
  FaUsers,
  FaUserCheck,
  FaUser,
  FaBuilding,
  FaTruck,
  FaHotel,
  FaListUl,
  FaMapMarkerAlt,
  FaBullhorn,
  FaMoneyCheckAlt,
} from 'react-icons/fa';
import { ChevronDown, X } from 'lucide-react';

// 🟦 Master Admin Menu Items
const menuItems = [
  { name: 'Event', href: '/events', icon: FaCalendarAlt },
  { name: 'Team', href: '/teams', icon: FaUsers },
  { name: 'Assign', href: '/assigns', icon: FaUserCheck },
  { name: 'Organizer', href: '/organizers', icon: FaUser },
  { name: 'Department', href: '/departments', icon: FaBuilding },
  { name: 'Supplier', href: '/suppliers', icon: FaTruck },
  {
    name: 'Hotel',
    icon: FaHotel,
    subMenu: [
      { name: 'Hotel', href: '/hotel-details', icon: FaHotel },
      { name: 'Room Category', href: '/room-category', icon: FaListUl },
    ],
  },
  { name: 'Venue', href: '/venues', icon: FaMapMarkerAlt },
  { name: 'Announcement', href: '/announcements', icon: FaBullhorn },
  { name: 'Payment Gateway', href: '/payment-gateway', icon: FaMoneyCheckAlt },
];

export default function MobileNavbarAdmin() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const navItems = useMemo(() => menuItems, []);

  // 🟢 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🟢 Handle dropdown toggle
  const handleToggle = (item: any) => {
    if (!item.subMenu?.length) return;
    setOpenMenu((prev) => (prev === item.name ? null : item.name));
  };

  return (
    <>
      {/* 🔹 Fixed navbar at top (below DashboardNavbar) */}
      <div
        ref={dropdownRef}
        className="sticky top-[64px] bg-background border-t border-blue-900 z-[30]"
      >
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex items-start justify-start gap-6 px-4 py-3 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isOpen = openMenu === item.name;

              // ✅ Active if current page matches the main menu or any subMenu
              const isActive =
                pathname === item.href ||
                item.subMenu?.some((sub) => pathname?.startsWith(sub.href)) ||
                openMenu === item.name;

              return (
                <div key={item.name} className="relative flex flex-col items-center">
                  {/* 🔸 Tap Area */}
                  <div
                    className="flex flex-col items-center cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(item);
                    }}
                  >
                    {/* 🔸 Main Icon */}
                    {item.subMenu?.length ? (
                      <button
                        className={cn(
                          'flex flex-col items-center justify-center w-14 h-14 rounded-full border transition-all duration-200',
                          isActive
                            ? 'bg-sky-800 text-background border-sky-800'
                            : 'bg-sky-100 text-sky-800 border-sky-200'
                        )}
                      >
                        <Icon size={22} />
                      </button>
                    ) : item.href ? (
                      <Link href={item.href}>
                        <button
                          className={cn(
                            'flex flex-col items-center justify-center w-14 h-14 rounded-full border transition-all duration-200',
                            isActive
                              ? 'bg-sky-800 text-background border-sky-800'
                              : 'bg-sky-100 text-sky-800 border-sky-200'
                          )}
                        >
                          <Icon size={22} />
                        </button>
                      </Link>
                    ) : (
                      <button
                        className={cn(
                          'flex flex-col items-center justify-center w-14 h-14 rounded-full border transition-all duration-200',
                          isActive
                            ? 'bg-sky-800 text-background border-sky-800'
                            : 'bg-sky-100 text-sky-800 border-sky-200'
                        )}
                      >
                        <Icon size={22} />
                      </button>
                    )}

                    {/* 🔹 Label + Dropdown Icon */}
                    <div
                      className={cn(
                        'mt-1 flex items-center text-xs font-medium transition-colors',
                        isActive ? 'text-sky-800' : 'text-forground'
                      )}
                    >
                      {item.name}
                      {(item.subMenu?.length ?? 0) > 0 && (
                        <ChevronDown
                          size={12}
                          className={cn(
                            'ml-1 transition-transform',
                            isOpen ? 'rotate-180' : 'rotate-0'
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🔹 Bottom Drawer Submenu */}
      <AnimatePresence>
        {openMenu &&
          (navItems.find((i) => i.name === openMenu)?.subMenu?.length ?? 0) > 0 && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 w-full bg-forground rounded-t-2xl shadow-2xl border-t border-gray-200 z-[30]"
            >
              <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800">{openMenu}</span>
                <button
                  onClick={() => setOpenMenu(null)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <ul className="flex flex-col divide-y divide-gray-100">
                {navItems
                  .find((i) => i.name === openMenu)
                  ?.subMenu?.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname?.startsWith(sub.href);
                    return (
                      <li key={sub.name}>
                        <Link
                          href={sub.href}
                          className={cn(
                            'flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-sky-50',
                            isSubActive
                              ? 'text-sky-800 font-medium'
                              : 'text-foreground'
                          )}
                          onClick={() => setOpenMenu(null)}
                        >
                          <SubIcon size={16} />
                          {sub.name}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}
