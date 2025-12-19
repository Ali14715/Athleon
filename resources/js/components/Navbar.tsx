import { Link, usePage } from "@inertiajs/react";
import { ShoppingCart, User, Search, Menu, X, ShieldCheck, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type NotificationItem } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import SearchDialog from "./SearchDialog";
import api, { isSuccess, getData } from "@/lib/api";

const Navbar = () => {
  const { url } = usePage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const latestNotifications = notifications.slice(0, 6);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const isActive = (path: string) => {
    if (path === "/catalog") {
      return url.startsWith("/catalog");
    }
    return url === path;
  };

  useEffect(() => {
    if (token) {
      fetchUserRole();
    }
  }, [token]);

  // Fetch cart only for customers (not admins)
  useEffect(() => {
    if (token && userRole === "customer") {
      fetchCartCount();
      
      // Listen for cart updates
      const handleCartUpdate = () => fetchCartCount();
      window.addEventListener('cartUpdated', handleCartUpdate);
      
      // Refresh cart count setiap 30 detik
      const interval = setInterval(fetchCartCount, 30000);
      
      return () => {
        window.removeEventListener('cartUpdated', handleCartUpdate);
        clearInterval(interval);
      };
    }
  }, [token, userRole]);

  // Also fetch when URL changes (navigation) - only for customers
  useEffect(() => {
    if (token && userRole === "customer") {
      fetchCartCount();
    }
  }, [url, userRole]);

  const fetchUserRole = async () => {
    try {
      const response = await api.post("/api/auth/me");
      // Handle new API format: { status_code, message, data }
      const userData = response.data?.data || response.data;
      
      if (userData && userData.role) {
        setUserRole(userData.role);
      }
    } catch (error) {
      // Silently fail if not logged in or error
      setUserRole(null);
    }
  };

  const fetchCartCount = async () => {
    // Only fetch cart for customers, not admins
    if (userRole !== "customer") {
      setCartCount(0);
      return;
    }

    try {
      const response = await api.get("/api/customer/keranjang");
      
      if (isSuccess(response) && getData(response)) {
        const cartData = getData(response) as { items?: Array<{ jumlah: number | string }> };
        const items = cartData.items || [];
        // Coerce jumlah to number to prevent string concatenation like "011"
        const totalItems = items.reduce((sum: number, item) => sum + Number(item.jumlah || 0), 0);
        setCartCount(totalItems);
      }
    } catch (error) {
      // Silently fail - user might not be logged in or is admin
      setCartCount(0);
    }
  };

  const handleNotificationOpenChange = (open: boolean) => {
    setNotificationPanelOpen(open);
    if (open) {
      refreshNotifications({ silent: true });
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markAsRead(notification.id);
    setNotificationPanelOpen(false);

    if (notification.pesanan_id || notification.pembayaran_id) {
      window.location.href = "/orders";
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refreshNotifications({ silent: true });
  };

  const formatNotificationTime = (notification: NotificationItem) => {
    const baseDate = notification.sent_at || notification.created_at || new Date().toISOString();

    try {
      return formatDistanceToNow(new Date(baseDate), { addSuffix: true });
    } catch {
      return "Baru";
    }
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gradient-to-b dark:from-[#1E293B] dark:via-[#0f172a] dark:to-[#1E293B] border-b border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-xl transition-colors duration-200">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="text-lg md:text-2xl font-bold flex items-center gap-1.5 sm:gap-2 group">
            <div className="p-1 sm:p-1.5 bg-emerald-50 dark:bg-gradient-to-r dark:from-[#059669] dark:to-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-400">
              <img src="/favicon.ico" alt="ATHLEON Logo" className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <span className="text-emerald-600 dark:bg-gradient-to-r dark:from-emerald-400 dark:to-emerald-300 dark:bg-clip-text dark:text-transparent">ATHLEON</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link 
              href="/" 
              className={`text-sm font-semibold transition-colors relative ${
                isActive("/") ? "text-emerald-600 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              Home
              {isActive("/") && <div className="absolute -bottom-[21px] left-0 right-0 h-1 bg-emerald-600 dark:bg-gradient-to-r dark:from-[#059669] dark:to-emerald-500 rounded-full"></div>}
            </Link>
            <Link 
              href="/catalog" 
              className={`text-sm font-semibold transition-colors relative ${
                isActive("/catalog") ? "text-emerald-600 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              Catalog
              {isActive("/catalog") && <div className="absolute -bottom-[21px] left-0 right-0 h-1 bg-emerald-600 dark:bg-gradient-to-r dark:from-[#059669] dark:to-emerald-500 rounded-full"></div>}
            </Link>
            {token && userRole !== "admin" && (
              <Link 
                href="/orders" 
                className={`text-sm font-semibold transition-colors relative ${
                  isActive("/orders") ? "text-emerald-600 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                Orders
                {isActive("/orders") && <div className="absolute -bottom-[21px] left-0 right-0 h-1 bg-emerald-600 dark:bg-gradient-to-r dark:from-[#059669] dark:to-emerald-500 rounded-full"></div>}
              </Link>
            )}
            {userRole === "admin" && (
              <Link 
                href="/admin/dashboard" 
                className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-[#059669] to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-slate-700/50"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-slate-700/50"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Logged In - Show appropriate icons */}
            {token && (
              <>
                {userRole !== "admin" && (
                  <>
                    <Popover open={notificationPanelOpen} onOpenChange={handleNotificationOpenChange}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50 relative"
                          aria-label="Buka notifikasi"
                        >
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <Badge 
                              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-gradient-to-r from-orange-500 to-amber-500 text-white border-2 border-white dark:border-slate-800"
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold">Notifikasi</p>
                            <p className="text-xs text-muted-foreground">
                              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Tidak ada notifikasi baru"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700"
                            disabled={unreadCount === 0 || notificationsLoading}
                            onClick={handleMarkAllRead}
                          >
                            Tandai semua
                          </Button>
                        </div>
                        <ScrollArea className="max-h-80">
                          {notificationsLoading && (
                            <div className="space-y-3 px-4 py-4">
                              {Array.from({ length: 3 }).map((_, index) => (
                                <div key={`notif-skeleton-${index}`} className="space-y-2 animate-pulse">
                                  <div className="h-4 rounded bg-muted" />
                                  <div className="h-3 w-2/3 rounded bg-muted" />
                                </div>
                              ))}
                            </div>
                          )}

                          {!notificationsLoading && latestNotifications.length === 0 && (
                            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                              Tidak ada notifikasi terbaru
                            </div>
                          )}

                          {!notificationsLoading && latestNotifications.length > 0 && (
                            <div className="py-2">
                              {latestNotifications.map((notification) => (
                                <button
                                  key={notification.id}
                                  className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 ${notification.read_at ? "bg-background" : "bg-emerald-50/50"} hover:bg-gray-50`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <p className="text-sm font-semibold truncate">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                                  <p className="text-[11px] text-muted-foreground mt-2">{formatNotificationTime(notification)}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        <div className="border-t px-4 py-2 text-center">
                          <Link href="/profile" className="text-sm font-semibold text-emerald-600 hover:underline">
                            Kelola notifikasi
                          </Link>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <Link href="/cart">
                      <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50 relative">
                        <ShoppingCart className="h-5 w-5" />
                        {cartCount > 0 && (
                          <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-gradient-to-r from-[#059669] to-emerald-500 text-white border-2 border-white dark:border-slate-800"
                          >
                            {cartCount > 99 ? '99+' : cartCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  </>
                )}
                
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}
            
            {/* Not Logged In - Show Register & Login buttons (Desktop only) */}
            {!token && (
              <>
                <Link href="/login?tab=register" className="hidden md:inline-block">
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50 font-medium"
                  >
                    Register
                  </Button>
                </Link>
                <Link href="/login" className="hidden md:inline-block">
                  <Button 
                    className="bg-gradient-to-r from-[#059669] to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 text-white font-medium shadow-lg"
                  >
                    Login
                  </Button>
                </Link>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 backdrop-blur-sm">
            <div className="flex flex-col gap-1">
              <Link 
                href="/" 
                className={`text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${
                  isActive("/") 
                    ? "bg-gradient-to-r from-[#059669] to-emerald-500 text-white" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/catalog" 
                className={`text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${
                  isActive("/catalog") 
                    ? "bg-gradient-to-r from-[#059669] to-emerald-500 text-white" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Catalog
              </Link>
              {token && userRole !== "admin" && (
                <Link 
                  href="/orders" 
                  className={`text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${
                    isActive("/orders") 
                      ? "bg-gradient-to-r from-[#059669] to-emerald-500 text-white" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Orders
                </Link>
              )}
              
              {userRole === "admin" && (
                <Link 
                  href="/admin/dashboard" 
                  className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-[#059669] to-emerald-500 text-white px-4 py-2.5 rounded-lg hover:from-emerald-600 hover:to-emerald-400 transition-all shadow-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
              
              {/* Mobile - Auth buttons when not logged in */}
              {!token && (
                <>
                  <Link 
                    href="/login?tab=register" 
                    className="text-sm font-semibold px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                  <Link 
                    href="/login" 
                    className="text-sm font-semibold px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#059669] to-emerald-500 text-white hover:from-emerald-600 hover:to-emerald-400 transition-all shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </nav>
  );
};

export default Navbar;
