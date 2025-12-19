import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AddressForm from "@/components/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { 
  User, 
  MapPin, 
  Heart, 
  Bell, 
  Shield, 
  LogOut,
  Edit2, 
  Save, 
  X,
  ChevronRight,
  Plus,
  Trash2,
  MapPinned,
  Eye,
  EyeOff
} from "lucide-react";
import api, { isSuccess, getData, getMessage, getErrorMessage } from "@/lib/api";
import { useNotifications, type NotificationItem } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@inertiajs/react";

// Wishlist Section Component
const WishlistSection = () => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get("/api/customer/wishlist");
      setWishlist(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Gagal memuat wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (produkId: number) => {
    try {
      await api.delete(`/api/customer/wishlist/${produkId}`);
      toast.success("Produk dihapus dari wishlist");
      fetchWishlist();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Gagal menghapus dari wishlist");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Wishlist</CardTitle>
          <CardDescription className="mt-2">Produk yang Anda simpan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Wishlist</CardTitle>
        <CardDescription className="mt-2">Produk yang Anda simpan ({wishlist.length})</CardDescription>
      </CardHeader>
      <CardContent>
        {wishlist.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Wishlist Kosong</p>
            <p>Belum ada produk yang disimpan</p>
            <Link href="/catalog">
              <Button className="mt-4" variant="outline">
                Jelajahi Produk
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={item.produk?.gambar_url || "/storage/placeholder.png"}
                    alt={item.produk?.nama}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.produk?.nama}</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl mb-3">
                    Rp {Number(item.produk?.harga || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </p>
                  <div className="flex gap-2">
                    <Link 
                      href={`/product/${item.produk?.nama?.toLowerCase().replace(/\s+/g, '-')}/${btoa(String(item.produk?.id))}`}
                      className="flex-1"
                    >
                      <Button className="w-full" size="sm">
                        Lihat Detail
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(item.produk_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Security Section Component with Change Password
const SecuritySection = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.new_password_confirmation) {
      toast.error("Password baru dan konfirmasi password tidak cocok");
      return;
    }

    if (formData.new_password.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/change-password", formData);
      
      if (isSuccess(response)) {
        toast.success(getMessage(response));
        
        // Reset form
        setFormData({
          current_password: "",
          new_password: "",
          new_password_confirmation: ""
        });
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          Keamanan Akun
        </CardTitle>
        <CardDescription className="mt-2">Kelola keamanan dan password akun Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current_password">Password Lama</Label>
            <div className="relative">
              <Input
                id="current_password"
                name="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.current_password}
                onChange={handleChange}
                required
                className="pr-10"
                placeholder="Masukkan password lama"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">Password Baru</Label>
            <div className="relative">
              <Input
                id="new_password"
                name="new_password"
                type={showNewPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={handleChange}
                required
                minLength={6}
                className="pr-10"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Password harus minimal 6 karakter</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password_confirmation">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input
                id="new_password_confirmation"
                name="new_password_confirmation"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.new_password_confirmation}
                onChange={handleChange}
                required
                minLength={6}
                className="pr-10"
                placeholder="Masukkan ulang password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent/90"
            >
              {loading ? "Menyimpan..." : "Ubah Password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                current_password: "",
                new_password: "",
                new_password_confirmation: ""
              })}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const Profile = () => {
  const emitAuthLogout = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
  };

  // Get initial tab from URL query parameter
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("tab") || "profile";
    }
    return "profile";
  };

  const [user, setUser] = useState<any>({});
  const [activeMenu, setActiveMenu] = useState(getInitialTab());
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Address management states
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telepon: "",
    jenis_kelamin: "",
  });

  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  } = useNotifications();

  useEffect(() => {
    if (activeMenu === "notifications") {
      refreshNotifications();
    }
  }, [activeMenu, refreshNotifications]);

  const formatNotificationTime = (notification: NotificationItem) => {
    const baseDate = notification.sent_at || notification.created_at || new Date().toISOString();
    try {
      return formatDistanceToNow(new Date(baseDate), { addSuffix: true });
    } catch {
      return "Baru";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.post("/api/auth/me");
        const userData = response.data?.data || response.data;
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          telepon: userData.telepon || "",
          jenis_kelamin: userData.jenis_kelamin || "",
        });
      } catch (error: any) {
        console.error("Gagal memuat data profil:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          emitAuthLogout();
          router.visit("/login");
        }
      }
    };

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.visit("/login");
      return;
    }

    fetchData();
    if (activeMenu === "addresses") {
      fetchAddresses();
    }
  }, [activeMenu]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/api/customer/alamat");
      if (isSuccess(response)) {
        setAddresses(getData(response) || []);
      }
    } catch (error: any) {
      console.error("Gagal memuat alamat:", error);
      toast.error("Gagal memuat daftar alamat");
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressDialog(true);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setShowAddressDialog(true);
  };

  const handleSaveAddress = async (data: any) => {
    setAddressLoading(true);
    try {
      if (editingAddress) {
        // Update existing address
        const response = await api.put(`/api/customer/alamat/${editingAddress.id}`, data);
        if (isSuccess(response)) {
          toast.success("Alamat berhasil diperbarui!");
          setShowAddressDialog(false);
          fetchAddresses();
        }
      } else {
        // Create new address
        const response = await api.post("/api/customer/alamat", data);
        if (isSuccess(response)) {
          toast.success("Alamat berhasil ditambahkan!");
          setShowAddressDialog(false);
          fetchAddresses();
        }
      }
    } catch (error: any) {
      console.error("Gagal menyimpan alamat:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      const response = await api.delete(`/api/customer/alamat/${addressId}`);
      if (isSuccess(response)) {
        toast.success("Alamat berhasil dihapus!");
        setDeletingAddressId(null);
        fetchAddresses();
      }
    } catch (error: any) {
      console.error("Gagal menghapus alamat:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const response = await api.post(`/api/customer/alamat/${addressId}/set-default`);
      if (isSuccess(response)) {
        toast.success("Alamat utama berhasil diubah!");
        fetchAddresses();
      }
    } catch (error: any) {
      console.error("Gagal mengubah alamat utama:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await api.put("/api/customer/profile", formData);
      
      if (isSuccess(response)) {
        setUser(getData(response));
        setEditMode(false);
        toast.success("Profil berhasil diperbarui!");
      }
    } catch (error: any) {
      console.error("Gagal memperbarui profil:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      telepon: user.telepon || "",
      jenis_kelamin: user.jenis_kelamin || "",
    });
    setEditMode(false);
  };

  const logoutHandler = async () => {
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("token");
      emitAuthLogout();
      router.visit("/login");
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
      <SEOHead
        title="Profil Saya"
        description={`Kelola profil, alamat, pesanan, dan pengaturan akun ${import.meta.env.VITE_APP_NAME || 'Athleon'} Anda dengan mudah.`}
        keywords="profil, akun, pengaturan, athleon"
      />
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2">Akun Saya</h1>
            <p className="text-muted-foreground">Kelola informasi profil dan pengaturan akun Anda</p>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar Menu */}
            <aside>
              <Card className="sticky top-4">
                <CardContent className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{user.name || "User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <nav className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveMenu("profile");
                        router.visit("/profile?tab=profile", { preserveState: true, preserveScroll: true });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeMenu === "profile"
                          ? "bg-accent text-white font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span className="flex-1 text-left">Profil Saya</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${activeMenu === "profile" ? "opacity-100" : "opacity-0"}`} />
                    </button>

                    <button
                      onClick={() => {
                        setActiveMenu("addresses");
                        router.visit("/profile?tab=addresses", { preserveState: true, preserveScroll: true });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeMenu === "addresses"
                          ? "bg-accent text-white font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      <MapPin className="h-5 w-5" />
                      <span className="flex-1 text-left">Alamat Saya</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${activeMenu === "addresses" ? "opacity-100" : "opacity-0"}`} />
                    </button>

                    <button
                      onClick={() => {
                        setActiveMenu("wishlist");
                        router.visit("/profile?tab=wishlist", { preserveState: true, preserveScroll: true });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeMenu === "wishlist"
                          ? "bg-accent text-white font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Heart className="h-5 w-5" />
                      <span className="flex-1 text-left">Wishlist</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${activeMenu === "wishlist" ? "opacity-100" : "opacity-0"}`} />
                    </button>

                    <Separator className="my-3" />

                    <button
                      onClick={() => {
                        setActiveMenu("notifications");
                        router.visit("/profile?tab=notifications", { preserveState: true, preserveScroll: true });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeMenu === "notifications"
                          ? "bg-accent text-white font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                      <span className="flex-1 text-left">Notifikasi</span>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-secondary text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                      <ChevronRight className={`h-4 w-4 transition-transform ${activeMenu === "notifications" ? "opacity-100" : "opacity-0"}`} />
                    </button>

                    <button
                      onClick={() => {
                        setActiveMenu("security");
                        router.visit("/profile?tab=security", { preserveState: true, preserveScroll: true });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeMenu === "security"
                          ? "bg-accent text-white font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                      <span className="flex-1 text-left">Keamanan</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${activeMenu === "security" ? "opacity-100" : "opacity-0"}`} />
                    </button>

                    <Separator className="my-3" />

                    <button
                      onClick={logoutHandler}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="flex-1 text-left">Keluar</span>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div>
              {activeMenu === "profile" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Informasi Pribadi</CardTitle>
                        <CardDescription className="mt-2">Kelola informasi profil Anda</CardDescription>
                      </div>
                      {!editMode && (
                        <Button 
                          onClick={() => setEditMode(true)}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profil
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!editMode ? (
                      <>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Nama Lengkap</Label>
                            <p className="text-lg font-semibold">
                              {user.name || "-"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Email</Label>
                            <p className="text-lg font-semibold">
                              {user.email || "-"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Nomor Telepon</Label>
                            <p className="text-lg font-semibold">
                              {user.telepon || "-"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Jenis Kelamin</Label>
                            <p className="text-lg font-semibold capitalize">
                              {user.jenis_kelamin === "L" ? "Laki-Laki" : user.jenis_kelamin === "P" ? "Perempuan" : user.jenis_kelamin === "laki-laki" ? "Laki-Laki" : user.jenis_kelamin === "perempuan" ? "Perempuan" : user.jenis_kelamin || "-"}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Masukkan email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telepon">Nomor Telepon</Label>
                    <Input
                      id="telepon"
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      placeholder="Masukkan nomor telepon"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                    <Select
                      value={formData.jenis_kelamin}
                      onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-Laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="flex-1 bg-secondary hover:bg-secondary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={loading}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
              )}

              {activeMenu === "addresses" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Alamat Saya</CardTitle>
                      <CardDescription className="mt-2">Kelola alamat pengiriman Anda</CardDescription>
                    </div>
                    <Button onClick={handleAddAddress} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Tambah Alamat
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {addresses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">Belum Ada Alamat</p>
                        <p className="mb-4">Tambahkan alamat pengiriman untuk kemudahan berbelanja</p>
                        <Button onClick={handleAddAddress} variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Alamat Pertama
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address: any) => (
                          <Card key={address.id} className={address.is_default ? "border-primary border-2" : ""}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <MapPinned className="h-4 w-4 text-primary" />
                                  <span className="font-semibold">{address.label || "Alamat"}</span>
                                </div>
                                {address.is_default && (
                                  <Badge variant="default">Utama</Badge>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                                <p className="font-medium text-foreground">{address.nama_penerima}</p>
                                <p>{address.telepon_penerima}</p>
                                <p>{address.alamat_lengkap}</p>
                                <p>
                                  {address.kelurahan && `${address.kelurahan}, `}
                                  {address.kecamatan && `${address.kecamatan}, `}
                                  {address.kota}
                                </p>
                                <p>
                                  {address.provinsi} {address.kode_pos && `, ${address.kode_pos}`}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditAddress(address)}
                                  className="flex-1"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                {!address.is_default && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSetDefaultAddress(address.id)}
                                    className="flex-1"
                                  >
                                    Jadikan Utama
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingAddressId(address.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeMenu === "wishlist" && <WishlistSection />}

              {activeMenu === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Notifikasi</CardTitle>
                    <CardDescription className="mt-2">Pantau pembaruan terbaru terkait pesanan dan pembayaran Anda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/50 p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Notifikasi belum dibaca</p>
                        <p className="text-3xl font-black text-accent">{unreadCount}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshNotifications()}
                          disabled={notificationsLoading}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-secondary"
                          disabled={unreadCount === 0 || notificationsLoading}
                          onClick={markAllNotificationsAsRead}
                        >
                          Tandai semua dibaca
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {notificationsLoading && (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton key={`notif-skeleton-${index}`} className="h-24 w-full rounded-xl" />
                        ))}
                      </div>
                    )}

                    {!notificationsLoading && notifications.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-60" />
                        <p className="text-lg font-medium mb-2">Tidak Ada Notifikasi</p>
                        <p>Anda belum memiliki notifikasi baru</p>
                      </div>
                    )}

                    {!notificationsLoading && notifications.length > 0 && (
                      <ScrollArea className="max-h-[520px] pr-4">
                        <div className="space-y-4">
                          {notifications.map((notification) => {
                            const isUnread = !notification.read_at;
                            return (
                              <div
                                key={notification.id}
                                className={`rounded-xl border p-4 transition ${isUnread ? "border-secondary/40 bg-secondary/5" : "border-border bg-background"}`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-base font-semibold">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{formatNotificationTime(notification)}</p>
                                  </div>
                                  {isUnread && (
                                    <Badge variant="secondary" className="bg-secondary text-white">
                                      Baru
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  {isUnread && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markNotificationAsRead(notification.id)}
                                      disabled={notificationsLoading}
                                    >
                                      Tandai dibaca
                                    </Button>
                                  )}
                                  {(notification.pesanan_id || notification.pembayaran_id) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-secondary hover:text-secondary"
                                      onClick={() => router.visit("/orders")}
                                    >
                                      Lihat pesanan
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeMenu === "security" && (
                <SecuritySection />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Alamat" : "Tambah Alamat Baru"}</DialogTitle>
            <DialogDescription>
              {editingAddress ? "Perbarui informasi alamat Anda" : "Tambahkan alamat pengiriman baru"}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            initialData={editingAddress}
            onSubmit={handleSaveAddress}
            onCancel={() => setShowAddressDialog(false)}
            submitLabel={editingAddress ? "Perbarui Alamat" : "Simpan Alamat"}
            isLoading={addressLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAddressId} onOpenChange={() => setDeletingAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Alamat?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus alamat ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAddressId && handleDeleteAddress(deletingAddressId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
