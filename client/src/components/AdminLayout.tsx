import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Newspaper,
  Video,
  Users,
  Rss,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  User,
  Globe,
  BarChart3,
  Menu,
  X,
  Home,
  TrendingUp,
  Radio,
  Tag,
  FileText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  {
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    href: "/admin",
    exact: true,
  },
  {
    label: "إدارة الأخبار",
    icon: Newspaper,
    href: "/admin/news",
  
  },
  {
    label: "إدارة الفيديوهات",
    icon: Video,
    href: "/admin/videos",
  },
  {
    label: "البث المباشر",
    icon: Radio,
    href: "/admin/live",
  },
  {
    label: "المستخدمون",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "مصادر RSS",
    icon: Rss,
    href: "/admin/sources",
  },
  {
    label: "التصنيفات",
    icon: Tag,
    href: "/admin/categories",
  },
  {
    label: "الإحصائيات",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    label: "الإعدادات",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-slate-700",
        sidebarCollapsed && "justify-center px-2"
      )}>
        <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="font-bold text-white text-sm leading-tight">ArabiSmart</div>
            <div className="text-xs text-slate-400">لوحة التحكم</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                    active
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-white")} style={{ width: 18, height: 18 }} />
                  {!sidebarCollapsed && (
                    <span className="arabic-text font-medium">{item.label}</span>
                  )}

                </button>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-slate-700" />

        {/* Quick Links */}
        <div className={cn("px-2 mb-2", sidebarCollapsed && "hidden")}>
          <p className="text-xs text-slate-500 arabic-text mb-2">روابط سريعة</p>
        </div>
        <Link href="/">
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-all",
              sidebarCollapsed && "justify-center px-2"
            )}
            title={sidebarCollapsed ? "الموقع الرئيسي" : undefined}
          >
            <Home style={{ width: 18, height: 18 }} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="arabic-text">الموقع الرئيسي</span>}
          </button>
        </Link>
      </nav>

      {/* User Info at Bottom */}
      <div className={cn(
        "border-t border-slate-700 p-3",
        sidebarCollapsed && "flex justify-center"
      )}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={""} />
              <AvatarFallback className="bg-red-600 text-white text-xs">
                {user?.name?.charAt(0) || "م"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate arabic-text">{user?.name || "المدير"}</p>
              <p className="text-xs text-slate-400 arabic-text">مدير النظام</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-slate-400 hover:text-red-400"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Avatar className="w-8 h-8">
            <AvatarImage src={""} />
            <AvatarFallback className="bg-red-600 text-white text-xs">
              {user?.name?.charAt(0) || "م"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden" dir="rtl">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-slate-800 border-l border-slate-700 transition-all duration-300 flex-shrink-0",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-64 bg-slate-800 border-l border-slate-700 z-50 transform transition-transform duration-300 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Collapse Button - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-slate-400 hover:text-white"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Page Title */}
          {title && (
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-semibold text-sm arabic-text truncate">{title}</h1>
              {subtitle && <p className="text-slate-400 text-xs arabic-text">{subtitle}</p>}
            </div>
          )}

          <div className="flex-1" />

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            {/* Site Link */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1.5 hidden sm:flex">
                <Globe className="w-4 h-4" />
                <span className="arabic-text text-xs">الموقع</span>
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={""} />
                  <AvatarFallback className="bg-red-600 text-white text-xs">
                    {user?.name?.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700 text-white">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium arabic-text">{user?.name || "المدير"}</p>
                  <p className="text-xs text-slate-400 arabic-text">مدير النظام</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem asChild className="hover:bg-slate-700 cursor-pointer">
                  <Link href="/profile">
                    <User className="w-4 h-4 ml-2" />
                    <span className="arabic-text">الملف الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-slate-700 cursor-pointer">
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4 ml-2" />
                    <span className="arabic-text">الإعدادات</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  className="text-red-400 hover:bg-slate-700 cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  <span className="arabic-text">تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
