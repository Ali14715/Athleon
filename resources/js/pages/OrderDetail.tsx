import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  MapPin, 
  Phone, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  User,
  // Mail removed - unused
  ShoppingBag
} from "lucide-react";
import api, { isSuccess, getData, getErrorMessage } from "@/lib/api";

interface ItemPesanan {
  id: number;
  produk_id: number;
  jumlah: number;
  harga_satuan: number;
  subtotal?: number;
  varian_id?: number | null;
  varian_label?: string | null;
  harga_varian?: number;
  varians?: Array<{
    jenis: string;
    nilai: string;
  }>;
  produk: {
    id: number;
    nama: string;
    harga: number;
    gambar_url?: string;
  };
}

interface Pembayaran {
  id: number;
  status: string;
  snap_token?: string;
  transaction_id?: string;
  tanggal_bayar?: string;
}

interface Pengiriman {
  id: number;
  nomor_resi?: string;
  kurir?: string;
  layanan?: string;
  estimasi_sampai?: string;
  status?: string;
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
  kurir_code?: string;
  kurir_service?: string;
  items: ItemPesanan[];
  pembayaran?: Pembayaran;
  pengiriman?: Pengiriman;
  ongkir: number;
  rating?: number | null;
  rating_feedback?: string | null;
}

interface TrackingHistory {
  date: string;
  desc: string;
  location?: string;
}

interface TrackingSummary {
  awb: string;
  courier: string;
  service: string;
  status: string;
  date: string;
  desc: string;
}

interface TrackingDetail {
  origin?: string;
  destination?: string;
  shipper?: string;
  receiver?: string;
}

interface Props {
  id: number;
}

// Helper function to format order ID nicely
const formatOrderId = (id: number): string => {
  const timestamp = Date.now().toString().slice(-6);
  const paddedId = id.toString().padStart(4, '0');
  return `ATH${paddedId}${timestamp.slice(0, 3)}`;
};

const OrderDetail = ({ id }: Props) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingHistory[] | null>(null);
  const [trackingSummary, setTrackingSummary] = useState<TrackingSummary | null>(null);
  const [trackingDetail, setTrackingDetail] = useState<TrackingDetail | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  useEffect(() => {
    if ((order?.status === "Dikirim" || order?.status === "Selesai") && (order?.tracking_number || order?.pengiriman?.nomor_resi) && order?.kurir_code) {
      fetchTracking();
    }
  }, [order?.id, order?.status, order?.tracking_number, order?.kurir_code]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/customer/pesanan/${id}`);
      if (isSuccess(response)) {
        const orderData = getData(response) as Order;
        setOrder(orderData);
        
        // Fetch tracking if order is shipped and has tracking number
        if (orderData.status === "Dikirim" && (orderData.tracking_number || orderData.pengiriman?.nomor_resi)) {
          // Small delay to let order state update
          setTimeout(() => fetchTracking(), 100);
        }
      }
    } catch (error: any) {
      console.error("Error fetching order detail:", error);
      toast.error(getErrorMessage(error));
      router.visit("/orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    if (!order?.tracking_number || !order?.kurir_code) return;
    
    try {
      setTrackingLoading(true);
      
      // Check cache first (1 hour)
      const cacheKey = `tracking_${order.tracking_number}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (now - timestamp < oneHour) {
          setTrackingData(data.history || []);
          setTrackingSummary(data.summary || null);
          setTrackingDetail(data.detail || null);
          setTrackingLoading(false);
          return;
        }
      }
      
      // Map courier codes to BinderByte format
      const courierMap: Record<string, string> = {
        'jne': 'jne',
        'jnt': 'jnt',
        'j&t': 'jnt',
        'sicepat': 'sicepat',
        'tiki': 'tiki',
        'pos': 'pos',
        'anteraja': 'anteraja',
        'ninja': 'ninja',
        'lion': 'lion',
        'pcp': 'pcp',
        'jet': 'jet',
        'spx': 'spx',
        'shopee': 'spx',
      };
      
      const courierCode = courierMap[order.kurir_code.toLowerCase()] || order.kurir_code.toLowerCase();
      
      const response = await api.get('/api/tracking', {
        params: {
          courier: courierCode,
          awb: order.tracking_number
        }
      });
      
      if (isSuccess(response) && getData(response)) {
        const data = getData(response) as { history?: any[]; summary?: any; detail?: any };
        setTrackingData(data.history || []);
        setTrackingSummary(data.summary || null);
        setTrackingDetail(data.detail || null);
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data,
          timestamp: Date.now()
        }));
      }
    } catch (error: any) {
      console.error("Error fetching tracking:", error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!order?.pembayaran?.snap_token) {
      toast.error("Token pembayaran tidak tersedia");
      return;
    }

    // @ts-ignore
    window.snap.pay(order.pembayaran.snap_token, {
      onSuccess: function () {
        toast.success("Pembayaran berhasil!");
        fetchOrderDetail();
      },
      onPending: function () {
        toast.info("Menunggu pembayaran...");
      },
      onError: function () {
        toast.error("Pembayaran gagal!");
      },
      onClose: function () {
        toast.info("Jendela pembayaran ditutup");
      },
    });
  };

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);
      setShowCancelDialog(false);
      const response = await api.post(`/api/customer/pesanan/${order?.id}/cancel`);
      if (isSuccess(response)) {
        toast.success("Pesanan berhasil dibatalkan");
        fetchOrderDetail();
      }
    } catch (error: any) {
      console.error("Error canceling order:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setActionLoading(true);
      setShowCompleteDialog(false);
      const response = await api.post(`/api/customer/pesanan/${order?.id}/complete`);
      if (isSuccess(response)) {
        toast.success("Pesanan selesai");
        fetchOrderDetail();
      }
    } catch (error: any) {
      console.error("Error completing order:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!order) return;

    try {
      setSubmittingRating(true);
      const response = await api.post(`/api/customer/pesanan/${order.id}/rating`, {
        rating,
        review: reviewText
      });
      
      if (isSuccess(response)) {
        toast.success("Terima kasih atas review Anda!");
        setShowRatingDialog(false);
        setRating(5);
        setReviewText("");
      }
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
      "Belum Dibayar": { variant: "destructive", icon: <Clock className="w-3.5 h-3.5" />, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
      "Dikemas": { variant: "secondary", icon: <Package className="w-3.5 h-3.5" />, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
      "Dikirim": { variant: "default", icon: <Truck className="w-3.5 h-3.5" />, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
      "Selesai": { variant: "outline", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
      "Dibatalkan": { variant: "destructive", icon: <XCircle className="w-3.5 h-3.5" />, color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
    };

    const config = variants[status] || variants["Belum Dibayar"];
    return (
      <Badge className={`flex items-center gap-1.5 px-3 py-1 font-semibold ${config.color} border`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat detail pesanan...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Pesanan tidak ditemukan</p>
            <Button onClick={() => router.visit("/orders")} className="bg-emerald-600 hover:bg-emerald-700">
              Kembali ke Daftar Pesanan
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.visit("/orders")}
            className="mb-6 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Pesanan Saya
          </Button>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      {formatOrderId(order.id)}
                    </h1>
                    <div className="flex items-center gap-2 text-emerald-50 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.tanggal_pesanan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="border-0 shadow-lg dark:bg-gray-900">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Item Pesanan
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {order.items.length} produk dalam pesanan ini
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const itemTotal = item.subtotal || (item.harga_satuan * item.jumlah);
                    const hasVariant = (item.varians && item.varians.length > 0) || item.varian_label;
                    
                    return (
                      <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Link href={`/product/${encodeURIComponent(item.produk.nama.toLowerCase().replace(/\s+/g, '-'))}/${btoa(String(item.produk.id))}`} className="w-24 h-24 bg-white dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0 shadow-sm hover:opacity-80 transition-opacity">
                          {item.produk.gambar_url ? (
                            <img
                              src={item.produk.gambar_url}
                              alt={item.produk.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                            </div>
                          )}
                        </Link>
                        <div className="flex-1">
                          <Link href={`/product/${encodeURIComponent(item.produk.nama.toLowerCase().replace(/\s+/g, '-'))}/${btoa(String(item.produk.id))}`}>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary transition-colors cursor-pointer">{item.produk.nama}</h3>
                          </Link>
                          {hasVariant && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {item.varians && item.varians.length > 0 ? (
                                item.varians.map((varian, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                                    {varian.jenis}: {varian.nilai}
                                  </Badge>
                                ))
                              ) : item.varian_label ? (
                                <Badge variant="outline" className="text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                                  {item.varian_label}
                                </Badge>
                              ) : null}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Jumlah: <span className="font-medium text-gray-900 dark:text-white">{item.jumlah}x</span>
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Harga satuan: <span className="font-medium text-gray-900 dark:text-white">Rp {item.harga_satuan.toLocaleString("id-ID")}</span>
                              </p>
                            </div>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              Rp {itemTotal.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-6 dark:bg-gray-700" />

                <div className="space-y-3 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal Produk</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Rp {(order.total_harga - order.ongkir).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Biaya Pengiriman</span>
                    <span className="font-medium text-gray-900 dark:text-white">Rp {order.ongkir.toLocaleString("id-ID")}</span>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total Pembayaran</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {order.total_harga.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Tracking - Show for Dikirim and Selesai status */}
            {(order.status === "Dikirim" || order.status === "Selesai") && (order.tracking_number || order.pengiriman?.nomor_resi) && (
              <Card className="border-0 shadow-lg dark:bg-gray-900">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Status Pengiriman
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Tracking Summary */}
                    {trackingSummary ? (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nomor Resi</p>
                            <p className="font-mono font-bold text-lg text-blue-700 dark:text-blue-300">{trackingSummary.awb}</p>
                          </div>
                          <Badge className="bg-blue-600 hover:bg-blue-600 text-white">{trackingSummary.courier}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`font-semibold ${
                            trackingSummary.status === 'DELIVERED' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' 
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                          }`}>
                            {trackingSummary.status}
                          </Badge>
                          {trackingSummary.service && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">• {trackingSummary.service}</span>
                          )}
                        </div>
                        {trackingSummary.desc && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{trackingSummary.desc}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nomor Resi</p>
                          <p className="font-mono font-bold text-lg text-blue-700 dark:text-blue-400">
                            {order.tracking_number || order.pengiriman?.nomor_resi}
                          </p>
                        </div>
                        {order.pengiriman?.kurir && (
                          <Badge className="bg-blue-600 text-white">{order.pengiriman.kurir}</Badge>
                        )}
                      </div>
                    )}

                    {/* Tracking Detail (Origin & Destination) */}
                    {trackingDetail && (trackingDetail.origin || trackingDetail.destination) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {trackingDetail.origin && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Dari</p>
                            <p className="text-xs text-gray-900 dark:text-white leading-relaxed">{trackingDetail.origin}</p>
                          </div>
                        )}
                        {trackingDetail.destination && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Ke</p>
                            <p className="text-xs text-gray-900 dark:text-white leading-relaxed">{trackingDetail.destination}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tracking History */}
                    {trackingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : trackingData && trackingData.length > 0 ? (
                      <div className="space-y-1 pl-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Riwayat Pengiriman</p>
                        {trackingData.map((track, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full border-2 ${
                                  idx === 0 
                                    ? "bg-emerald-500 border-emerald-500 dark:bg-emerald-400 dark:border-emerald-400 shadow-lg shadow-emerald-500/50" 
                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                }`}
                              />
                              {idx < trackingData.length - 1 && (
                                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 flex-1 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-5">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{track.desc}</p>
                              {track.location && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📍 {track.location}</p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-gray-500">{track.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        Informasi tracking belum tersedia
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-6">
            {/* Shipping Info */}
            <Card className="border-0 shadow-lg dark:bg-gray-900">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Informasi Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Penerima
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">{order.nama_penerima}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telepon
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">{order.nomor_telepon}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Alamat Lengkap</p>
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{order.alamat_pengiriman}</p>
                </div>
                <Separator className="dark:bg-gray-700" />
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Kurir Pengiriman</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{order.metode_pengiriman}</p>
                </div>
                {order.tracking_number && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">Nomor Resi</p>
                    <p className="font-mono font-bold text-emerald-900 dark:text-emerald-300">{order.tracking_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-0 shadow-lg dark:bg-gray-900">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Metode Pembayaran</p>
                  <p className="font-semibold text-gray-900 dark:text-white uppercase">{order.metode_pembayaran}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-0 shadow-lg dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {order.status === "Belum Dibayar" && order.metode_pembayaran !== "cod" && (
                    <Button
                      onClick={handlePayNow}
                      disabled={actionLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-lg"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Bayar Sekarang
                        </>
                      )}
                    </Button>
                  )}

                  {(order.status === "Belum Dibayar" || order.status === "Dikemas") && (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      disabled={actionLoading}
                      variant="destructive"
                      className="w-full h-12 font-semibold"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Batalkan Pesanan
                    </Button>
                  )}

                  {order.status === "Dikirim" && (
                    <Button
                      onClick={() => setShowCompleteDialog(true)}
                      disabled={actionLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Pesanan Diterima
                    </Button>
                  )}

                  {order.status === "Selesai" && !order.rating && (
                    <Button
                      onClick={() => setShowRatingDialog(true)}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Beri Rating & Ulasan
                    </Button>
                  )}

                  {order.status === "Selesai" && order.rating && (
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        Rating Anda
                      </p>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (order.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-300 dark:fill-gray-700 text-gray-300 dark:text-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                      {order.rating_feedback && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{order.rating_feedback}"</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Batalkan Pesanan?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Batalkan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Order Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Konfirmasi Penerimaan</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Konfirmasi bahwa Anda telah menerima pesanan ini dengan kondisi baik?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOrder}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Terima Pesanan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Beri Rating & Ulasan</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Bagikan pengalaman Anda dengan pesanan ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold dark:text-gray-300">Rating Anda</Label>
              <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-all hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-300 dark:fill-gray-700 text-gray-300 dark:text-gray-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {rating === 5 && "Luar biasa! ⭐"}
                {rating === 4 && "Sangat Baik 👍"}
                {rating === 3 && "Baik 😊"}
                {rating === 2 && "Cukup 😐"}
                {rating === 1 && "Kurang 😞"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review" className="text-sm font-semibold dark:text-gray-300">
                Ulasan Anda (Opsional)
              </Label>
              <Textarea
                id="review"
                placeholder="Ceritakan pengalaman Anda dengan produk ini..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {submittingRating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Rating"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;
