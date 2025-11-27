import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Search, Filter, Package, ChevronRight, Clock, CheckCircle, Star, Truck, AlertTriangle } from "lucide-react";
import api, { isSuccess, getData, getErrorMessage } from "@/lib/api";

interface ItemPesanan {
  id: number;
  produk_id: number;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  produk: {
    id: number;
    nama: string;
    harga: number;
  };
}

interface Order {
  id: number;
  tanggal_pesanan: string;
  total_harga: number;
  status: "Belum Dibayar" | "Dikemas" | "Dikirim" | "Selesai" | "Dibatalkan";
  alamat_pengiriman: string;
  metode_pembayaran: string;
  metode_pengiriman: string;
  nama_penerima: string;
  nomor_telepon: string;
  tracking_number?: string;
  items: ItemPesanan[];
  pembayaran?: {
    snap_token?: string;
    transaction_id?: string;
  };
  pengiriman?: {
    id: number;
    nomor_resi?: string;
    kurir?: string;
    status?: string;
  };
  rating?: number | null;
  rating_feedback?: string | null;
}

// Helper function to format order ID nicely
const formatOrderId = (id: number): string => {
  const timestamp = Date.now().toString().slice(-6);
  const paddedId = id.toString().padStart(4, '0');
  return `ATH${paddedId}${timestamp.slice(0, 3)}`;
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<number | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Cancel modal
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.visit("/login");
      return;
    }

    // No need to check URL params since callback is clean now

    // Initial load with auto-check payment enabled (especially after payment)
    const loadOrders = async () => {
      setLoading(true);
      try {
        await fetchOrders(true); // Auto-check all pending Midtrans payments
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [token]);

  // Apply filters whenever orders, status, search, or sort changes
  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "Semua") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search query (order ID or customer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(query) ||
          order.nama_penerima.toLowerCase().includes(query)
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.tanggal_pesanan).getTime() - new Date(a.tanggal_pesanan).getTime();
        case "oldest":
          return new Date(a.tanggal_pesanan).getTime() - new Date(b.tanggal_pesanan).getTime();
        case "highest":
          return b.total_harga - a.total_harga;
        case "lowest":
          return a.total_harga - b.total_harga;
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery, sortBy]);

  const fetchOrders = async (autoCheckPayment = false) => {
    try {
      if (!autoCheckPayment) {
        setLoading(true);
      }
      const response = await api.get("/api/customer/pesanan");
      
      if (isSuccess(response)) {
        const ordersData = getData(response) as Order[];
        setOrders(ordersData);
        
        // Auto-check payment status for pending Midtrans payments (only on initial load)
        if (autoCheckPayment) {
          const pendingMidtransOrders = ordersData.filter(
            (order: Order) => order.status === "Belum Dibayar" && order.metode_pembayaran === "midtrans"
          );
          
          if (pendingMidtransOrders.length > 0) {
            // Check status for each pending order
            await Promise.all(
              pendingMidtransOrders.map(async (order: Order) => {
                try {
                  await api.post("/api/customer/payment/check-status", {
                    order_id: order.id
                  });
                } catch (error) {
                  console.log(`Auto-check payment status failed for order ${order.id}`);
                }
              })
            );
            
            // Small delay to ensure database has been updated
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh immediately after checks complete
            const refreshResponse = await api.get("/api/customer/pesanan");
            if (isSuccess(refreshResponse)) {
              setOrders(getData(refreshResponse));
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Gagal memuat pesanan:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        router.visit("/login");
      } else {
        toast.error("Gagal memuat data pesanan");
      }
    } finally {
      if (!autoCheckPayment) {
        setLoading(false);
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setActionLoading(orderToCancel.id);
      const response = await api.post(`/api/customer/pesanan/${orderToCancel.id}/cancel`);
      
      if (isSuccess(response)) {
        toast.success("Pesanan berhasil dibatalkan");
        setCancelDialogOpen(false);
        setOrderToCancel(null);
        fetchOrders(false);
      }
    } catch (error: any) {
      console.error("Gagal membatalkan pesanan:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckPaymentStatus = async (orderId: number) => {
    try {
      setCheckingPayment(orderId);
      const response = await api.post("/api/customer/payment/check-status", {
        order_id: orderId
      });
      
      if (isSuccess(response)) {
        const { order_status, payment_status } = getData(response) as { order_status: string; payment_status: string };
        
        // Show appropriate message based on status
        if (payment_status === 'paid') {
          toast.success(`Pembayaran berhasil! Status order: ${order_status}`);
        } else if (payment_status === 'pending') {
          toast.info("Pembayaran masih menunggu konfirmasi");
        } else {
          toast.success("Status pembayaran berhasil diperbarui");
        }
        
        // Wait a bit to ensure DB is updated, then refresh
        await new Promise(resolve => setTimeout(resolve, 300));
        await fetchOrders(false);
      }
    } catch (error: any) {
      console.error("Gagal memeriksa status pembayaran:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setCheckingPayment(null);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    if (!confirm("Apakah Anda sudah menerima pesanan ini?")) return;

    try {
      setActionLoading(orderId);
      const response = await api.put(
        `/api/customer/pesanan/${orderId}/status`,
        { status: "Selesai" }
      );
      
      if (isSuccess(response)) {
        toast.success("Pesanan dikonfirmasi selesai");
        fetchOrders(false);
      }
    } catch (error: any) {
      console.error("Gagal konfirmasi pesanan:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayNow = (order: Order) => {
    if (!order.pembayaran?.snap_token) {
      toast.error("Token pembayaran tidak ditemukan");
      return;
    }

    // Redirect to Midtrans payment page
    const redirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${order.pembayaran.snap_token}`;
    window.location.href = redirectUrl;
  };

  const getStatusBadge = (status: Order["status"]) => {
    const variants: Record<Order["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "Belum Dibayar": { label: "Belum Dibayar", variant: "outline" },
      "Dikemas": { label: "Dikemas", variant: "secondary" },
      "Dikirim": { label: "Dikirim", variant: "default" },
      "Selesai": { label: "Selesai", variant: "default" },
      "Dibatalkan": { label: "Dibatalkan", variant: "destructive" },
    };
    
    const { label, variant } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <main className="flex-1 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-secondary/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-secondary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-secondary to-primary animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl font-bold">Memuat Status Pesanan</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
            <p className="text-muted-foreground">Mohon tunggu sebentar...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOHead
        title="Pesanan Saya"
        description={`Lihat status dan riwayat pesanan Anda di ${import.meta.env.VITE_APP_NAME || 'Athleon'}. Track pengiriman dan kelola pesanan dengan mudah.`}
      />
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Status Pesanan</h1>

          {/* Filter Section */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Filter & Pencarian</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari Order ID atau Nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua Status</SelectItem>
                    <SelectItem value="Belum Dibayar">Belum Dibayar</SelectItem>
                    <SelectItem value="Dikemas">Dikemas</SelectItem>
                    <SelectItem value="Dikirim">Dikirim</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                    <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                    <SelectItem value="highest">Harga Tertinggi</SelectItem>
                    <SelectItem value="lowest">Harga Terendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Info */}
              {(statusFilter !== "Semua" || searchQuery) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filter aktif:</span>
                  {statusFilter !== "Semua" && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter("Semua")}>
                      {statusFilter} ✕
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                      "{searchQuery}" ✕
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("Semua");
                      setSearchQuery("");
                    }}
                    className="text-xs h-6"
                  >
                    Reset Semua
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Count */}
          {orders.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Menampilkan {filteredOrders.length} dari {orders.length} pesanan
            </p>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">Belum ada pesanan</p>
              <Button onClick={() => router.visit("/catalog")}>
                Mulai Belanja
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">Tidak ada pesanan yang sesuai dengan filter</p>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("Semua");
                  setSearchQuery("");
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.visit(`/orders/${order.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Order Info */}
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{formatOrderId(order.id)}</p>
                            {getStatusBadge(order.status)}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.tanggal_pesanan).toLocaleDateString('id-ID', { 
                              day: 'numeric',
                              month: 'short', 
                              year: 'numeric'
                            })}
                          </p>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {order.items.length} item • {order.metode_pengiriman}
                          </p>
                          
                          <p className="text-base font-bold text-primary mt-2">
                            Rp {order.total_harga.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                          </p>
                          
                          {/* Tracking Preview for Shipped Orders */}
                          {order.status === "Dikirim" && (order.tracking_number || order.pengiriman?.nomor_resi) && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-2 text-xs">
                                <Truck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold text-blue-700 dark:text-blue-300">Resi:</span>
                                <span className="font-mono text-blue-900 dark:text-blue-200">
                                  {order.tracking_number || order.pengiriman?.nomor_resi}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Rating Display for Completed Orders */}
                          {order.status === "Selesai" && order.rating && (
                            <div className="mt-2 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <= (order.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'fill-gray-300 text-gray-300 dark:fill-gray-700 dark:text-gray-700'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">Sudah diulas</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right: Arrow */}
                      <div className="flex items-center">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    {(order.status === "Belum Dibayar" || order.status === "Dikirim") && (
                      <div className="mt-3 pt-3 border-t flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {order.status === "Belum Dibayar" && order.metode_pembayaran === "midtrans" && order.pembayaran?.snap_token && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handlePayNow(order)}
                          >
                            Bayar Sekarang
                          </Button>
                        )}
                        {order.status === "Belum Dibayar" && order.metode_pembayaran === "midtrans" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCheckPaymentStatus(order.id)}
                            disabled={checkingPayment === order.id}
                          >
                            {checkingPayment === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cek Status"}
                          </Button>
                        )}
                        {order.status === "Belum Dibayar" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setOrderToCancel(order);
                              setCancelDialogOpen(true);
                            }}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Batalkan"}
                          </Button>
                        )}
                        {order.status === "Dikirim" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                              <><CheckCircle className="h-4 w-4 mr-1" />Pesanan Diterima</>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Cancel Order Confirmation Modal */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <DialogTitle>Batalkan Pesanan</DialogTitle>
                <DialogDescription className="mt-1">
                  Apakah Anda yakin ingin membatalkan pesanan ini?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {orderToCancel && (
            <div className="my-4 rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pesanan ID:</span>
                <span className="font-medium">#{orderToCancel.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">
                  Rp {orderToCancel.total_harga.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{orderToCancel.status}</Badge>
              </div>
            </div>
          )}
          
          <DialogDescription className="text-sm text-muted-foreground">
            Setelah dibatalkan, pesanan tidak dapat dikembalikan. Jika sudah melakukan pembayaran, 
            dana akan dikembalikan dalam 3-5 hari kerja.
          </DialogDescription>
          
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
              disabled={actionLoading === orderToCancel?.id}
            >
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={actionLoading === orderToCancel?.id}
            >
              {actionLoading === orderToCancel?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ya, Batalkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
