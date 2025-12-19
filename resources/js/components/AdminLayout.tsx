import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Tags,
  Image as ImageIcon,
  Moon,
  Sun,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import api from "@/lib/api";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  const emitAuthLogout = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
  };

  useEffect(() => {
    const APP_NAME = import.meta.env.VITE_APP_NAME || 'Athleon';
    const titleUpper = title.toUpperCase();
    const appNameUpper = APP_NAME.toUpperCase();
    
    // Check if title already contains "Admin" and APP_NAME (case-insensitive)
    const alreadyHasAdmin = titleUpper.includes('ADMIN');
    const alreadyHasAppName = titleUpper.includes(appNameUpper);
    
    // Only append if not already present
    const fullTitle = (alreadyHasAdmin && alreadyHasAppName) 
      ? title 
      : `${title} - Admin ${APP_NAME}`;
    
    document.title = fullTitle;
    fetchUser();
  }, [title]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.visit("/login");
        return;
      }

      const response = await api.post("/api/auth/me");
      const userData = response.data?.data || response.data;
      
      if (userData.role !== "admin") {
        toast.error("Akses ditolak. Hanya admin yang dapat mengakses halaman ini.");
        router.visit("/");
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
      emitAuthLogout();
      router.visit("/login");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      
      localStorage.removeItem("token");
      emitAuthLogout();
      toast.success("Berhasil logout");
      router.visit("/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("token");
      emitAuthLogout();
      router.visit("/login");
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Banner", icon: ImageIcon, href: "/admin/banners" },
    { name: "Produk", icon: Package, href: "/admin/products" },
    { name: "Kategori", icon: Tags, href: "/admin/categories" },
    { name: "Pesanan", icon: ShoppingCart, href: "/admin/orders" },
    { name: "Pengguna", icon: Users, href: "/admin/users" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Sidebar - Desktop */}
      <aside className={`fixed left-0 top-0 z-40 h-screen shadow-2xl bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 hidden lg:block ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo & Toggle */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6">
            {!sidebarCollapsed && (
              <Link href="/admin/dashboard">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
                  {import.meta.env.VITE_APP_NAME || 'Athleon'}
                </h1>
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ml-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-2 px-3 py-6">
            {menuItems.map((item) => {
              const isActive = window.location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    sidebarCollapsed ? "justify-center" : ""
                  } ${
                    isActive 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:scale-105"
                  }`}
                  title={sidebarCollapsed ? item.name : ""}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
            {user && !sidebarCollapsed && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            )}
            <Button 
              className={`w-full ${sidebarCollapsed ? "justify-center px-0" : "justify-start"} bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-200`}
              onClick={handleLogout}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className={`h-4 w-4 ${sidebarCollapsed ? "" : "mr-2"}`} />
              {!sidebarCollapsed && "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-screen w-64 shadow-2xl bg-white dark:bg-gray-900 lg:hidden">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
                  {import.meta.env.VITE_APP_NAME || 'Athleon'}
                </h1>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-2 px-3 py-6">
                {menuItems.map((item) => {
                  const isActive = window.location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
                {user && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                )}
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800 backdrop-blur-md px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-[#1E293B] to-slate-700 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">{title}</h2>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;