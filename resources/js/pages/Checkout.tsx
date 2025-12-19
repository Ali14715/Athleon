import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AddressSelector from "@/components/AddressSelector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Package, MapPin, CreditCard, Truck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api, { isSuccess, getData, getErrorMessage } from "@/lib/api";

// Declare Midtrans Snap on window
declare global {
  interface Window {
    snap: any;
  }
}

interface CartItem {
  id: number;
  produk_id: number;
  nama: string;
  harga: number;
  jumlah: number;
  subtotal: number;
  gambar?: string;
  varian?: {
    id: number;
    nama_varian: string;
    nilai_varian: string;
    harga_tambahan: number;
  } | null;
  varians?: Array<{
    id: number;
    nama_varian: string;
    nilai_varian: string;
    harga_tambahan: number;
  }>;
}

interface CheckoutSummary {
  items: CartItem[];
  subtotal: number;
  ongkir: number;
  total: number;
  user: {
    name: string;
    email: string;
    telepon: string;
    alamat: string;
  };
}

interface Address {
  id: number;
  label: string;
  nama_penerima: string;
  telepon_penerima: string;
  alamat_lengkap: string;
  kota: string;
  provinsi: string;
  kecamatan: string;
  kelurahan?: string;
  kode_pos: string;
  area_id?: string;
  latitude?: string;
  longitude?: string;
  is_default: boolean;
}

interface ShippingRate {
  company: string;
  courier_name: string;
  courier_code: string;
  courier_service_code: string;
  type: string;
  description: string;
  duration: string;
  shipment_duration_range: string;
  shipment_duration_unit: string;
  price: number;
}

const Checkout = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  
  // Form states
  const [metodePembayaran, setMetodePembayaran] = useState("midtrans");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    const canAccessCheckout = sessionStorage.getItem("canAccessCheckout");
    if (!canAccessCheckout) {
      toast.error("Akses checkout hanya dari keranjang atau beli sekarang");
      router.visit("/cart");
      return;
    }

    fetchCheckoutSummary();
    
    return () => {
      sessionStorage.removeItem("canAccessCheckout");
    };
  }, []);

  useEffect(() => {
    // Fetch shipping rates when address is selected
    if (selectedAddress) {
      if (selectedAddress.area_id) {
        fetchShippingRates();
      } else {
        // Clear shipping rates and show warning if area_id is missing
        setShippingRates([]);
        setSelectedShipping(null);
        toast.warning("Area ID tidak tersedia untuk alamat ini. Silakan perbarui alamat atau hubungi admin.");
      }
    }
  }, [selectedAddress]);

  const fetchCheckoutSummary = async () => {
    try {
      // Check which checkout mode based on canAccessCheckout flag
      const buyNowItemStr = sessionStorage.getItem("buyNowItem");
      const selectedCartItemsStr = sessionStorage.getItem("selectedCartItems");
      
      let response;
      
      // If there are selected cart items, prioritize cart checkout (clear any stale buy-now data)
      if (selectedCartItemsStr) {
        // This is a cart checkout - clear any stale buy-now data
        if (buyNowItemStr) {
          sessionStorage.removeItem("buyNowItem");
        }
        // Regular cart checkout
        const selectedCartItems = selectedCartItemsStr ? JSON.parse(selectedCartItemsStr) : [];
        
        if (selectedCartItems.length === 0) {
          toast.error("Tidak ada item yang dipilih untuk checkout");
          router.visit("/cart");
          return;
        }
        
        // Build URL manually to ensure proper format
        const baseUrl = "/api/customer/checkout/summary";
        const queryParams = selectedCartItems.map((id: number) => `item_ids[]=${id}`).join('&');
        const fullUrl = `${baseUrl}?${queryParams}`;
        
        response = await api.get(fullUrl);
      } else if (buyNowItemStr) {
        // Buy-now checkout
        const buyNowItem = JSON.parse(buyNowItemStr);
        response = await api.get("/api/customer/checkout/summary", {
          params: {
            buy_now: true,
            produk_id: buyNowItem.produk_id,
            jumlah: buyNowItem.jumlah,
            varian_ids: buyNowItem.varian_ids
          }
        });
      } else {
        // No checkout data found
        toast.error("Data checkout tidak ditemukan");
        router.visit("/cart");
        return;
      }
      
      if (response && isSuccess(response)) {
        const data = getData(response) as CheckoutSummary;
        setSummary(data);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error));
      router.visit("/cart");
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingRates = async () => {
    if (!selectedAddress?.area_id) {
      toast.error("Silakan pilih alamat terlebih dahulu");
      return;
    }

    setLoadingRates(true);
    setShippingRates([]);
    setSelectedShipping(null);

    try {
      const payload: any = {
        destination_area_id: selectedAddress.area_id,
      };

      // Add optional fields if available
      if (selectedAddress.kode_pos) {
        payload.destination_postal_code = selectedAddress.kode_pos;
      }
      if (selectedAddress.latitude) {
        payload.destination_latitude = selectedAddress.latitude;
      }
      if (selectedAddress.longitude) {
        payload.destination_longitude = selectedAddress.longitude;
      }

      // Check if this is a buy-now checkout
      const buyNowItemStr = sessionStorage.getItem("buyNowItem");
      if (buyNowItemStr) {
        const buyNowItem = JSON.parse(buyNowItemStr);
        payload.buy_now = true;
        payload.produk_id = buyNowItem.produk_id;
        payload.jumlah = buyNowItem.jumlah;
        if (buyNowItem.varian_ids) {
          payload.varian_ids = buyNowItem.varian_ids;
        }
      }

      const response = await api.post("/api/customer/checkout/shipping-rates", payload);

      if (isSuccess(response)) {
        const responseData = getData(response) as { pricing?: any[] };
        const pricing = responseData?.pricing || [];
        setShippingRates(pricing);
        
        if (pricing.length === 0) {
          toast.info("Tidak ada layanan pengiriman tersedia untuk alamat ini");
        }
      }
    } catch (error: any) {
      console.error("Error fetching shipping rates:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingRates(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAddress) {
      toast.error("Silakan pilih alamat pengiriman");
      return;
    }

    if (!selectedShipping) {
      toast.error("Silakan pilih layanan pengiriman");
      return;
    }

    setProcessing(true);

    try {
      // Check which checkout mode - prioritize cart items
      const selectedCartItemsStr = sessionStorage.getItem("selectedCartItems");
      const buyNowItemStr = sessionStorage.getItem("buyNowItem");
      
      let requestData: any = {
        nama_penerima: selectedAddress.nama_penerima,
        nomor_telepon: selectedAddress.telepon_penerima,
        alamat_pengiriman: `${selectedAddress.alamat_lengkap}, ${selectedAddress.kota}, ${selectedAddress.provinsi} ${selectedAddress.kode_pos}`,
        metode_pembayaran: metodePembayaran,
        metode_pengiriman: selectedShipping.courier_name,
        shipping_cost: selectedShipping.price,
        shipping_courier_code: selectedShipping.courier_code,
        shipping_courier_service: selectedShipping.courier_service_code,
      };
      
      if (selectedCartItemsStr) {
        // Regular cart checkout - prioritize this over buy-now
        const selectedCartItems = selectedCartItemsStr ? JSON.parse(selectedCartItemsStr) : [];
        
        if (selectedCartItems.length === 0) {
          toast.error("Tidak ada item yang dipilih untuk checkout");
          return;
        }
        
        requestData.item_ids = selectedCartItems;
      } else if (buyNowItemStr) {
        // Buy-now checkout
        const buyNowItem = JSON.parse(buyNowItemStr);
        requestData.buy_now = true;
        requestData.produk_id = buyNowItem.produk_id;
        requestData.jumlah = buyNowItem.jumlah;
        requestData.varian_ids = buyNowItem.varian_ids;
      } else {
        toast.error("Data checkout tidak ditemukan");
        return;
      }

      const response = await api.post("/api/customer/checkout/process", requestData);

      if (isSuccess(response)) {
        const orderData = getData(response) as { order_id: string; total: number; snap_token?: string };
        
        // Show immediate success toast with order info
        toast.success(`Pesanan #${orderData.order_id} berhasil dibuat! Total: Rp ${orderData.total.toLocaleString('id-ID')}`);
        
        // Clear session storage
        sessionStorage.removeItem("selectedCartItems");
        sessionStorage.removeItem("buyNowItem");
        sessionStorage.removeItem("canAccessCheckout");
        
        // Dispatch cart update event (only for cart checkout, not buy-now)
        if (!buyNowItemStr) {
          window.dispatchEvent(new Event('cartUpdated'));
        }
        
        // Trigger notification refresh event (if using notification context)
        window.dispatchEvent(new Event('notificationUpdate'));
        
        // Handle Midtrans payment - redirect to payment page
        if (metodePembayaran === "midtrans" && orderData.snap_token) {
          const redirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderData.snap_token}`;
          window.location.href = redirectUrl;
        } else {
          router.visit("/orders");
        }
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotal = () => {
    if (!summary) return 0;
    const shippingCost = selectedShipping?.price || 0;
    return summary.subtotal + shippingCost;
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

  if (!summary) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        title="Checkout"
        description={`Selesaikan pembelian Anda di ${import.meta.env.VITE_APP_NAME || 'Athleon'}. Pilih metode pembayaran dan pengiriman yang Anda inginkan.`}
        keywords="checkout, pembayaran, pengiriman, order"
      />
      <Navbar />

      <main className="flex-1 py-8 md:py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Checkout</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Keranjang</span>
                <span>→</span>
                <span className="text-primary font-medium">Checkout</span>
                <span>→</span>
                <span>Pembayaran</span>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Forms */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Shipping Address Selector */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        Alamat Pengiriman
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AddressSelector
                        onSelectAddress={setSelectedAddress}
                        selectedAddressId={selectedAddress?.id}
                      />
                    </CardContent>
                  </Card>

                  {/* Shipping Method */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                          Metode Pengiriman
                        </div>
                        {selectedAddress && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={fetchShippingRates}
                            disabled={loadingRates}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loadingRates ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedAddress ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Pilih alamat terlebih dahulu untuk melihat opsi pengiriman</p>
                        </div>
                      ) : loadingRates ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="mt-3 text-muted-foreground">Memuat tarif pengiriman...</p>
                        </div>
                      ) : shippingRates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Tidak ada layanan pengiriman tersedia</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={fetchShippingRates}
                            className="mt-3"
                          >
                            Coba Lagi
                          </Button>
                        </div>
                      ) : (
                        <RadioGroup
                          value={selectedShipping ? `${selectedShipping.courier_code}-${selectedShipping.courier_service_code}` : ""}
                          onValueChange={(value) => {
                            const rate = shippingRates.find(r => `${r.courier_code}-${r.courier_service_code}` === value);
                            setSelectedShipping(rate || null);
                          }}
                          className="space-y-3"
                        >
                          {shippingRates.map((rate) => {
                            const uniqueId = `${rate.courier_code}-${rate.courier_service_code}`;
                            return (
                              <div
                                key={uniqueId}
                                className="flex items-center space-x-3 p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                              >
                                <RadioGroupItem value={uniqueId} id={uniqueId} />
                                <Label 
                                  htmlFor={uniqueId} 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => setSelectedShipping(rate)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-sm">{rate.courier_name} - {rate.type}</div>
                                      <div className="text-xs text-muted-foreground">{rate.description}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Estimasi: {rate.shipment_duration_range} {rate.shipment_duration_unit}
                                      </div>
                                    </div>
                                    <div className="font-bold text-primary">{formatRupiah(rate.price)}</div>
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Method */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        Metode Pembayaran
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={metodePembayaran} onValueChange={setMetodePembayaran}>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                          <RadioGroupItem value="midtrans" id="midtrans" />
                          <Label htmlFor="midtrans" className="flex-1 cursor-pointer">
                            <div className="font-semibold text-sm">Midtrans Payment Gateway</div>
                            <div className="text-xs text-muted-foreground">Credit Card, E-Wallet, Bank Transfer, QRIS</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex-1 cursor-pointer">
                            <div className="font-semibold text-sm">Cash on Delivery (COD)</div>
                            <div className="text-xs text-muted-foreground">Bayar saat barang diterima</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Order Summary */}
                <div>
                  <Card className="sticky top-4 shadow-md">
                    <CardHeader className="pb-3 bg-slate-50">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        Ringkasan Pesanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {summary.items.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                            <img
                              src={item.gambar && item.gambar !== 'placeholder.svg' ? (item.gambar.startsWith('http') ? item.gambar : `/storage/${item.gambar}`) : '/storage/placeholder.svg'}
                              onError={(e) => { e.currentTarget.src = '/storage/placeholder.svg'; }}
                              alt={item.nama}
                              className="w-14 h-14 object-cover rounded-md border"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight mb-1">{item.nama}</p>
                              {/* Display multiple variants */}
                              {item.varians && item.varians.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {item.varians.map((v, idx) => (
                                    <span key={idx} className="inline-flex items-center text-xs bg-white border px-2 py-0.5 rounded-full">
                                      {v.nama_varian}: <strong className="ml-1">{v.nilai_varian}</strong>
                                    </span>
                                  ))}
                                </div>
                              ) : item.varian ? (
                                <span className="inline-flex items-center text-xs bg-white border px-2 py-0.5 rounded-full mb-1">
                                  {item.varian.nama_varian}: <strong className="ml-1">{item.varian.nilai_varian}</strong>
                                </span>
                              ) : null}
                              <p className="text-xs text-muted-foreground">
                                {item.jumlah}x • {formatRupiah(item.harga)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{formatRupiah(item.subtotal)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">{formatRupiah(summary.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ongkir</span>
                          <span className={`font-bold ${selectedShipping ? 'text-primary' : 'text-muted-foreground'}`}>
                            {selectedShipping ? formatRupiah(selectedShipping.price) : 'Pilih kurir'}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-3 border-t border-slate-200">
                          <span>Total Pembayaran</span>
                          <span className="text-primary text-lg">{formatRupiah(calculateTotal())}</span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={processing || !selectedAddress || !selectedShipping}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                        size="lg"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          "Bayar Sekarang"
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Dengan melanjutkan, Anda menyetujui syarat dan ketentuan kami
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
