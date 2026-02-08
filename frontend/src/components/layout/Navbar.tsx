"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Bell,
  LayoutDashboard,
  ShoppingCart,
  MapPin,
  BarChart3,
  MessageSquare,
  Package,
  IndianRupee,
  Truck,
  Leaf,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mobileMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "Commodities", href: "/commodities" },
  { icon: MapPin, label: "Mandis", href: "/mandis" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: IndianRupee, label: "Sales", href: "/sales" },
  { icon: Truck, label: "Transport", href: "/transport" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageSquare, label: "Community", href: "/community" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile Logo */}
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="font-bold">AgriProfit</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search commodities, mandis..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all">
                <AvatarFallback className="bg-green-600 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </Link>
            <Button 
              variant="ghost"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                <span className="font-bold">AgriProfit</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {mobileMenuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
