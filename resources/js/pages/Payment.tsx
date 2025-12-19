import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import api, { isSuccess, getData, getErrorMessage } from "@/lib/api";

// Declare Midtrans Snap global
declare global {
  interface Window {
    snap: any;
  }
}

const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";
const MIDTRANS_SNAP_URL = import.meta.env.VITE_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";

const Payment = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get("order_id");

    if (!orderIdParam) {
      toast.error("Order ID tidak ditemukan");
      router.visit("/orders");
      return;
    }

    setOrderId(orderIdParam);

    if (!MIDTRANS_CLIENT_KEY) {
      toast.error("Konfigurasi Midtrans belum tersedia");
      setLoading(false);
      return;
    }

    loadMidtransScript();
  }, []);

  const loadMidtransScript = () => {
    if (document.getElementById("midtrans-snap-script")) {
      setLoading(false);
      createPayment();
      return;
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = MIDTRANS_SNAP_URL;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    script.onload = () => {
      setLoading(false);
      createPayment();
    };
    script.onerror = () => {
      toast.error("Gagal memuat Midtrans");
      setLoading(false);
    };
    document.body.appendChild(script);
  };

  const createPayment = async () => {
    if (!orderId) return;

    setProcessing(true);

    try {
      const response = await api.post("/api/customer/payment/create-token", {
        order_id: orderId,
      });

      const data = getData(response) as { snap_token?: string };
      if (isSuccess(response) && data.snap_token && window.snap) {
        window.snap.pay(data.snap_token, {
          onSuccess: async function () {
            toast.success("Pembayaran berhasil!");
            setPaymentStatus("success");
            
            // Check payment status from backend
            try {
              await api.post("/api/customer/payment/check-status", {
                order_id: orderId,
              });
            } catch (error) {
              console.error("Failed to check payment status:", error);
            }
            
            setTimeout(() => {
              router.visit("/orders");
            }, 2000);
          },
          onPending: function () {
            toast.info("Menunggu pembayaran...");
            setPaymentStatus("pending");
            setTimeout(() => {
              router.visit("/orders");
            }, 2000);
          },
          onError: function () {
            toast.error("Pembayaran gagal");
            setPaymentStatus("error");
          },
          onClose: function () {
            toast.info("Jendela pembayaran ditutup");
            setProcessing(false);
          },
        });
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(getErrorMessage(error));
      setPaymentStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        title="Pembayaran"
        description={`Lakukan pembayaran untuk pesanan Anda di ${import.meta.env.VITE_APP_NAME || 'Athleon'} dengan berbagai metode pembayaran.`}
        keywords="pembayaran, payment, midtrans"
      />
      <Navbar />

      <main className="flex-1 py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                {paymentStatus === null && (
                  <>
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-secondary" />
                      </div>
                      <h1 className="text-2xl font-bold mb-2">
                        Memproses <span className="text-secondary">Pembayaran</span>
                      </h1>
                      <p className="text-muted-foreground">
                        Jendela pembayaran akan terbuka otomatis
                      </p>
                    </div>

                    {processing && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Membuat transaksi...</span>
                      </div>
                    )}
                  </>
                )}

                {paymentStatus === "success" && (
                  <>
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h1 className="text-2xl font-bold mb-2 text-green-600">
                        Pembayaran Berhasil!
                      </h1>
                      <p className="text-muted-foreground">
                        Terima kasih, pesanan Anda sedang diproses
                      </p>
                    </div>
                  </>
                )}

                {paymentStatus === "error" && (
                  <>
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <h1 className="text-2xl font-bold mb-2 text-red-600">
                        Pembayaran Gagal
                      </h1>
                      <p className="text-muted-foreground mb-4">
                        Terjadi kesalahan saat memproses pembayaran
                      </p>
                      <Button 
                        onClick={() => router.visit("/orders")}
                        className="bg-secondary hover:bg-secondary/90 text-white"
                      >
                        Lihat Pesanan
                      </Button>
                    </div>
                  </>
                )}

                {paymentStatus === "pending" && (
                  <>
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h1 className="text-2xl font-bold mb-2 text-yellow-600">
                        Menunggu Pembayaran
                      </h1>
                      <p className="text-muted-foreground">
                        Silakan selesaikan pembayaran Anda
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;

