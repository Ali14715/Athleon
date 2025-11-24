import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Mail
} from "lucide-react";
import api from "@/lib/api";

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
}

interface TrackingHistory {
  date: string;
  status: string;
  description: string;
  location?: string;
}

interface Props {
  orderId: number;
}

const OrderDetail = ({ orderId }: Props) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingHistory[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/customer/pesanan/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
        
        // Fetch tracking if status is "Dikirim" and has tracking number
        if (response.data.data.status === "Dikirim" && response.data.data.tracking_number) {
          fetchTracking();
        }
      }
    } catch (error: any) {
      console.error("Error fetching order detail:", error);
      toast.error(error.response?.data?.message || "Gagal memuat detail pesanan");
      router.visit("/orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    try {
      setTrackingLoading(true);
      const response = await api.get(`/api/customer/pesanan/${orderId}/tracking`);
      
      if (response.data.success && response.data.data?.history) {
        setTrackingData(response.data.data.history);
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
      if (response.data.success) {
        toast.success("Pesanan berhasil dibatalkan");
        fetchOrderDetail();
      }
    } catch (error: any) {
      console.error("Error canceling order:", error);
      toast.error(error.response?.data?.message || "Gagal membatalkan pesanan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setActionLoading(true);
      setShowCompleteDialog(false);
      const response = await api.post(`/api/customer/pesanan/${order?.id}/complete`);
      if (response.data.success) {
        toast.success("Pesanan selesai");
        fetchOrderDetail();
      }
    } catch (error: any) {
      console.error("Error completing order:", error);
      toast.error(error.response?.data?.message || "Gagal menyelesaikan pesanan");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      "Belum Dibayar": { variant: "destructive", icon: <Clock className="w-3 h-3" /> },
      "Dikemas": { variant: "secondary", icon: <Package className="w-3 h-3" /> },
      "Dikirim": { variant: "default", icon: <Truck className="w-3 h-3" /> },
      "Selesai": { variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
      "Dibatalkan": { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    };

    const config = variants[status] || variants["Belum Dibayar"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Pesanan tidak ditemukan</p>
            <Button onClick={() => router.visit("/orders")} className="mt-4">
              Kembali ke Daftar Pesanan
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.visit("/orders")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pesanan #{order.id}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
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
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Item Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.produk.gambar_url ? (
                          <img
                            src={item.produk.gambar_url}
                            alt={item.produk.nama}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.produk.nama}</h3>
                        {((item.varians && item.varians.length > 0) || item.varian_label) && (
                          <div className="flex gap-2 mt-1">
                            {item.varians && item.varians.length > 0 ? (
                              item.varians.map((varian, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {varian.jenis}: {varian.nilai}
                                </Badge>
                              ))
                            ) : item.varian_label ? (
                              <Badge variant="outline" className="text-xs">
                                {item.varian_label}
                              </Badge>
                            ) : null}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-500">x{item.jumlah}</p>
                          <p className="font-medium text-gray-900">
                            Rp {((item.subtotal || item.harga_satuan * item.jumlah) || 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      Rp {(order.total_harga - order.ongkir).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ongkir</span>
                    <span className="text-gray-900">Rp {order.ongkir.toLocaleString("id-ID")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">Rp {order.total_harga.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Tracking */}
            {order.status === "Dikirim" && order.pengiriman?.nomor_resi && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Status Pengiriman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Nomor Resi</p>
                        <p className="font-mono font-semibold">{order.pengiriman.nomor_resi}</p>
                      </div>
                      <Badge variant="default">{order.pengiriman.kurir}</Badge>
                    </div>

                    {trackingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : trackingData && trackingData.length > 0 ? (
                      <div className="space-y-4">
                        {trackingData.map((track, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  idx === 0 ? "bg-primary" : "bg-gray-300"
                                }`}
                              />
                              {idx < trackingData.length - 1 && (
                                <div className="w-0.5 h-full bg-gray-200 flex-1 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium text-gray-900">{track.status}</p>
                              <p className="text-xs text-gray-500 mt-1">{track.description}</p>
                              {track.location && (
                                <p className="text-xs text-gray-400 mt-1">📍 {track.location}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{track.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Informasi Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Penerima</p>
                  <p className="font-medium text-gray-900">{order.nama_penerima}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telepon
                  </p>
                  <p className="font-medium text-gray-900">{order.nomor_telepon}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alamat</p>
                  <p className="text-sm text-gray-900">{order.alamat_pengiriman}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Kurir</p>
                  <p className="font-medium text-gray-900">{order.metode_pengiriman}</p>
                </div>
                {order.tracking_number && (
                  <div>
                    <p className="text-sm text-gray-600">Nomor Resi</p>
                    <p className="font-mono font-medium text-emerald-600">{order.tracking_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Metode Pembayaran</p>
                  <p className="font-medium text-gray-900 uppercase">{order.metode_pembayaran}</p>
                </div>
                
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {order.status === "Belum Dibayar" && order.metode_pembayaran !== "cod" && (
                    <Button
                      onClick={handlePayNow}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Bayar Sekarang"
                      )}
                    </Button>
                  )}

                  {(order.status === "Belum Dibayar" || order.status === "Dikemas") && (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      disabled={actionLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      Batalkan Pesanan
                    </Button>
                  )}

                  {order.status === "Dikirim" && (
                    <Button
                      onClick={() => setShowCompleteDialog(true)}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      Pesanan Diterima
                    </Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Pesanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penerimaan</AlertDialogTitle>
            <AlertDialogDescription>
              Konfirmasi bahwa Anda telah menerima pesanan ini dengan kondisi baik?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOrder}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Ya, Terima Pesanan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
