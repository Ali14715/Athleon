import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus, Trash2, Loader2, ShoppingCart, Edit3 } from "lucide-react";
import { toast } from "sonner";
import api, { isSuccess, getData } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axios from "axios";

interface CartItem {
  id: number;
  produk_id: number;
  jumlah: number;
  varian_id?: number | null;
  varian_ids?: number[] | null;
  varian?: {
    id: number;
    nama_varian: string;
    nilai_varian: string;
    harga_tambahan: number;
    stok?: number;
  } | null;
  varians?: Array<{
    id: number;
    nama_varian: string;
    nilai_varian: string;
    harga_tambahan: number;
    stok?: number;
  }>;
  produk: {
    id: number;
    nama: string;
    harga: number;
    gambar?: string;
    kategori?: {
      id: number;
      nama: string;
      deskripsi?: string;
      gambar?: string;
      created_at?: string;
      updated_at?: string;
      gambar_url?: string;
    } | string;
    stok?: number;
  };
}

interface ProductVariant {
  id: number;
  produk_id: number;
  nama_varian: string;
  nilai_varian: string;
  harga_tambahan: number;
  stok: number;
}

interface Product {
  id: number;
  nama: string;
  harga: number;
  gambar?: string;
  kategori: {
    id: number;
    nama: string;
    deskripsi?: string;
    gambar?: string;
    created_at?: string;
    updated_at?: string;
    gambar_url?: string;
  } | string;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(null);
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Record<string, number>>({});
  const [updatingVariant, setUpdatingVariant] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    fetchCart();
  }, [token]);

  // Fetch recommended products when cartItems changes
  useEffect(() => {
    if (!loading) {
      fetchRecommendedProducts();
    }
  }, [cartItems, loading]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/customer/keranjang");
      
      if (isSuccess(response) && getData(response)) {
        const data = getData(response) as { items?: any[] };
        const items = data.items || [];
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch (error: any) {
      console.error("Gagal memuat keranjang:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        router.visit("/login");
      } else {
        toast.error("Gagal memuat keranjang");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedProducts = async () => {
    setLoadingRecommended(true);
    try {
      const response = await api.get("/api/produk");
      
      // Handle new API format: { status_code, message, data }
      let productsData = response.data?.data || response.data;
      
      // Handle paginated response with nested data
      if (productsData && typeof productsData === 'object') {
        if (Array.isArray(productsData.data)) {
          productsData = productsData.data;
        } else if (!Array.isArray(productsData)) {
          productsData = [];
        }
      } else if (!Array.isArray(productsData)) {
        productsData = [];
      }
      
      // Get product IDs that are currently in cart
      const cartProductIds = new Set(cartItems.map(item => item.produk_id));
      
      // Filter out products that are in cart
      const filteredProducts = productsData.filter(
        (product: Product) => !cartProductIds.has(product.id)
      );
      
      // Get 8 random products for recommendations
      const shuffled = [...filteredProducts].sort(() => 0.5 - Math.random());
      setRecommendedProducts(shuffled.slice(0, 8));
    } catch (error) {
      console.error("Error fetching recommended products:", error);
      setRecommendedProducts([]); // Set empty array on error
    } finally {
      setLoadingRecommended(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setActionLoading(itemId);
      const response = await api.put(
        `/api/customer/keranjang/${itemId}`,
        { jumlah: newQuantity }
      );

      if (isSuccess(response)) {
        fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success("Jumlah produk diperbarui");
      }
    } catch (error: any) {
      console.error("Gagal update jumlah:", error);
      toast.error("Gagal memperbarui jumlah");
    } finally {
      setActionLoading(null);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm("Hapus item ini dari keranjang?")) return;

    try {
      setActionLoading(itemId);
      const response = await api.delete(
        `/api/customer/keranjang/${itemId}`
      );

      if (isSuccess(response)) {
        fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success("Item dihapus dari keranjang");
      }
    } catch (error: any) {
      console.error("Gagal hapus item:", error);
      toast.error("Gagal menghapus item");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeVariant = async (item: CartItem) => {
    // Fetch available variants for this product
    try {
      const response = await axios.get(`/api/produk/${item.produk_id}`);
      const product = response.data?.data ?? response.data;
      if (product?.varians && Array.isArray(product.varians)) {
        setAvailableVariants(product.varians);
        setSelectedCartItem(item);
        
        // Pre-select current variants if they exist
        const currentSelection: Record<string, number> = {};
        if (item.varians && item.varians.length > 0) {
          item.varians.forEach(v => {
            currentSelection[v.nama_varian] = v.id;
          });
        } else if (item.varian) {
          currentSelection[item.varian.nama_varian] = item.varian.id;
        }
        setSelectedVariantIds(currentSelection);
        setVariantDialogOpen(true);
      } else {
        toast.error("Produk ini tidak memiliki varian");
      }
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      toast.error("Gagal memuat varian produk");
    }
  };

  const handleUpdateVariant = async () => {
    if (!selectedCartItem || Object.keys(selectedVariantIds).length === 0) {
      toast.error("Silakan pilih varian");
      return;
    }

    setUpdatingVariant(true);

    try {
      const variantIdsArray = Object.values(selectedVariantIds);
      
      const response = await api.put(
        `/api/customer/keranjang/${selectedCartItem.id}`,
        { 
          jumlah: selectedCartItem.jumlah,
          varian_ids: variantIdsArray
        }
      );

      if (isSuccess(response)) {
        fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success("Varian berhasil diubah");
        setVariantDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Gagal update varian:", error);
      toast.error("Gagal mengubah varian");
    } finally {
      setUpdatingVariant(false);
    }
  };

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));

  const total = selectedCartItems.reduce((sum, item) => {
    let itemPrice = Number(item.produk.harga) || 0;
    
    // Add price from all variants if using varians array
    if (item.varians && item.varians.length > 0) {
      itemPrice += item.varians.reduce((vSum, v) => vSum + (Number(v.harga_tambahan) || 0), 0);
    } else if (item.varian) {
      // Fallback to single varian
      itemPrice += Number(item.varian.harga_tambahan) || 0;
    }
    
    return sum + (itemPrice * item.jumlah);
  }, 0);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-secondary/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-secondary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-secondary to-primary animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Memuat Keranjang Belanja</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-emerald-400 dark:bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Mohon tunggu sebentar...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        title="Keranjang Belanja"
        description={`Kelola produk di keranjang belanja ${import.meta.env.VITE_APP_NAME || 'Athleon'} Anda sebelum melakukan checkout.`}
      />
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Keranjang Belanja</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Keranjang Anda kosong</p>
              <Link href="/catalog">
                <Button>Mulai Belanja</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Select All Header */}
                <div className="flex items-center gap-2 px-2 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Checkbox
                    id="select-all"
                    checked={cartItems.length > 0 && selectedItems.size === cartItems.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer select-none text-gray-900 dark:text-gray-100"
                  >
                    Pilih Semua ({selectedItems.size}/{cartItems.length})
                  </label>
                </div>

                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Checkbox */}
                        <div className="flex items-start pt-1">
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                          />
                        </div>
                        <Link href={`/product/${encodeURIComponent(item.produk.nama.toLowerCase().replace(/\s+/g, '-'))}/${btoa(String(item.produk.id))}`} className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity">
                          {item.produk.gambar ? (
                            <img 
                              src={
                                item.produk.gambar.startsWith('http') || item.produk.gambar.startsWith('/storage/') 
                                  ? item.produk.gambar 
                                  : `/storage/${item.produk.gambar}`
                              }
                              alt={item.produk.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground text-center flex items-center justify-center h-full">No Image</span>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${encodeURIComponent(item.produk.nama.toLowerCase().replace(/\s+/g, '-'))}/${btoa(String(item.produk.id))}`}>
                            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors cursor-pointer">{item.produk.nama}</h3>
                          </Link>
                          
                          {/* Display Variant Information */}
                          {((item.varians && item.varians.length > 0) || item.varian) && (
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {item.varians && item.varians.length > 0 ? (
                                // Display multiple variants (Size + Warna)
                                item.varians.map((v, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {v.nama_varian}: {v.nilai_varian}
                                  </span>
                                ))
                              ) : item.varian ? (
                                // Fallback to single variant
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {item.varian.nama_varian}: {item.varian.nilai_varian}
                                </span>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                                onClick={() => handleChangeVariant(item)}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Ubah Varian
                              </Button>
                            </div>
                          )}
                          
                          <p className="text-base sm:text-lg font-bold text-primary mb-2 sm:mb-4">
                            Rp {(() => {
                              let price = Number(item.produk.harga) || 0;
                              if (item.varians && item.varians.length > 0) {
                                price += item.varians.reduce((sum, v) => sum + (Number(v.harga_tambahan) || 0), 0);
                              } else if (item.varian) {
                                price += Number(item.varian.harga_tambahan) || 0;
                              }
                              return price.toLocaleString('id-ID', { maximumFractionDigits: 0 });
                            })()}
                            {((item.varians && item.varians.length > 0) || (item.varian && item.varian.harga_tambahan > 0)) && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (+{(() => {
                                  if (item.varians && item.varians.length > 0) {
                                    return item.varians.reduce((sum, v) => sum + (Number(v.harga_tambahan) || 0), 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
                                  } else if (item.varian) {
                                    return (Number(item.varian.harga_tambahan) || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
                                  }
                                  return '0';
                                })()})
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                  onClick={() => updateQuantity(item.id, item.jumlah - 1)}
                                  disabled={actionLoading === item.id || item.jumlah <= 1}
                                >
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                {actionLoading === item.id ? (
                                  <span className="w-12 sm:w-16 text-center">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min="1"
                                    max={(() => {
                                      // Get stock from variant if exists, otherwise from product
                                      if (item.varians && item.varians.length > 0) {
                                        return Math.min(...item.varians.map(v => v.stok || 999));
                                      }
                                      if (item.varian?.stok !== undefined) {
                                        return item.varian.stok;
                                      }
                                      return item.produk?.stok || 999;
                                    })()}
                                    value={item.jumlah}
                                    onChange={(e) => {
                                      const newQty = parseInt(e.target.value) || 1;
                                      let maxStock = item.produk?.stok || 999;
                                      // Get stock from variant if exists
                                      if (item.varians && item.varians.length > 0) {
                                        maxStock = Math.min(...item.varians.map(v => v.stok || 999));
                                      } else if (item.varian?.stok !== undefined) {
                                        maxStock = item.varian.stok;
                                      }
                                      if (newQty > maxStock) {
                                        toast.error(`Stok hanya tersedia ${maxStock}`);
                                        return;
                                      }
                                      if (newQty >= 1) {
                                        updateQuantity(item.id, newQty);
                                      }
                                    }}
                                    className="w-12 sm:w-16 text-center font-medium text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                                  />
                                )}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                  onClick={() => {
                                    let maxStock = item.produk?.stok || 999;
                                    // Get stock from variant if exists
                                    if (item.varians && item.varians.length > 0) {
                                      maxStock = Math.min(...item.varians.map(v => v.stok || 999));
                                    } else if (item.varian?.stok !== undefined) {
                                      maxStock = item.varian.stok;
                                    }
                                    if (item.jumlah >= maxStock) {
                                      toast.error(`Stok hanya tersedia ${maxStock}`);
                                      return;
                                    }
                                    updateQuantity(item.id, item.jumlah + 1);
                                  }}
                                  disabled={actionLoading === item.id}
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                              {(() => {
                                let displayStock = item.produk?.stok;
                                // Get stock from variant if exists
                                if (item.varians && item.varians.length > 0) {
                                  displayStock = Math.min(...item.varians.map(v => v.stok || 999));
                                } else if (item.varian?.stok !== undefined) {
                                  displayStock = item.varian.stok;
                                }
                                return displayStock !== undefined ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Stok: {displayStock}
                                  </p>
                                ) : null;
                              })()}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-10 sm:w-10 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Item Dipilih</span>
                        <span>{selectedItems.size} item</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>Rp {total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-secondary">Rp {total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-secondary hover:bg-secondary/90 text-white" 
                      size="lg"
                      disabled={selectedItems.size === 0}
                      onClick={() => {
                        if (selectedItems.size === 0) {
                          toast.error("Pilih minimal 1 item untuk checkout");
                          return;
                        }
                        
                        const selectedItemsArray = Array.from(selectedItems);
                        sessionStorage.setItem("canAccessCheckout", "true");
                        sessionStorage.setItem("selectedCartItems", JSON.stringify(selectedItemsArray));
                        router.visit("/checkout");
                      }}
                    >
                      Checkout ({selectedItems.size} item)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </div>

        {/* Recommended Products Section - Always show */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {cartItems.length > 0 ? "Rekomendasi Untuk Anda" : "Produk Yang Mungkin Anda Suka"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecommended ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Memuat produk rekomendasi...</p>
                </div>
              ) : recommendedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recommendedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.nama}
                      price={product.harga}
                      image={
                        product.gambar
                          ? (product.gambar.startsWith('http') || product.gambar.startsWith('/storage/') 
                              ? product.gambar 
                              : `/storage/${product.gambar}`)
                          : 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop'
                      }
                      category={product.kategori || 'Uncategorized'}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  <p>Tidak ada produk rekomendasi tersedia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Variant Change Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Varian</DialogTitle>
            <DialogDescription>
              Pilih varian baru untuk {selectedCartItem?.produk.nama}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Product Preview */}
            {selectedCartItem && (
              <div className="flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-4">
                {selectedCartItem.produk.gambar ? (
                  <img
                    src={
                      selectedCartItem.produk.gambar.startsWith('http') || selectedCartItem.produk.gambar.startsWith('/storage/') 
                        ? selectedCartItem.produk.gambar 
                        : `/storage/${selectedCartItem.produk.gambar}`
                    }
                    alt={selectedCartItem.produk.nama}
                    className="h-16 w-16 rounded-md object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">No Image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-2 text-slate-900 dark:text-slate-100">
                    {selectedCartItem.produk.nama}
                  </h4>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    Rp {(() => {
                      const basePrice = Number(selectedCartItem.produk.harga) || 0;
                      const selectedVariantsList = Object.values(selectedVariantIds)
                        .map(id => availableVariants.find(v => v.id === id))
                        .filter(Boolean);
                      const additionalPrice = selectedVariantsList.reduce((sum, v) => sum + (Number(v?.harga_tambahan) || 0), 0);
                      const totalPrice = basePrice + additionalPrice;
                      return totalPrice.toLocaleString("id-ID", { maximumFractionDigits: 0 });
                    })()}
                    {(() => {
                      const selectedVariantsList = Object.values(selectedVariantIds)
                        .map(id => availableVariants.find(v => v.id === id))
                        .filter(Boolean);
                      const additionalPrice = selectedVariantsList.reduce((sum, v) => sum + (Number(v?.harga_tambahan) || 0), 0);
                      return additionalPrice > 0 ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          (+Rp {additionalPrice.toLocaleString("id-ID", { maximumFractionDigits: 0 })})
                        </span>
                      ) : null;
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Variant Selection */}
            {(() => {
              // Group variants by type
              const variantGroups = availableVariants.reduce((acc, variant) => {
                if (!acc[variant.nama_varian]) {
                  acc[variant.nama_varian] = [];
                }
                acc[variant.nama_varian].push(variant);
                return acc;
              }, {} as Record<string, ProductVariant[]>);

              const variantGroupsCount = Object.keys(variantGroups).length;

              return (
                <>
                  {Object.entries(variantGroups).map(([variantType, variantOptions]) => (
                    <div key={variantType} className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {variantType}
                        <span className="text-rose-500 ml-1">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {variantOptions.map((variant) => {
                          const isSelected = selectedVariantIds[variantType] === variant.id;
                          const isOutOfStock = variant.stok <= 0;
                          
                          return (
                            <button
                              key={variant.id}
                              onClick={() => {
                                if (isOutOfStock) return;
                                setSelectedVariantIds(prev => ({
                                  ...prev,
                                  [variantType]: variant.id,
                                }));
                              }}
                              disabled={isOutOfStock}
                              className={`
                                relative rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all
                                ${isSelected 
                                  ? "border-emerald-600 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500 text-white" 
                                  : isOutOfStock
                                    ? "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                    : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-emerald-400 dark:hover:border-emerald-500"
                                }
                              `}
                            >
                              {variant.nilai_varian}
                              {isOutOfStock && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <span className="h-0.5 w-full bg-slate-400 dark:bg-slate-600 rotate-[-20deg]"></span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setVariantDialogOpen(false)}
                      disabled={updatingVariant}
                    >
                      Batal
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleUpdateVariant}
                      disabled={updatingVariant || Object.keys(selectedVariantIds).length < variantGroupsCount}
                    >
                      {updatingVariant ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memperbarui...
                        </>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
