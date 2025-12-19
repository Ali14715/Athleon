import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RelatedProducts from "@/components/RelatedProducts";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Check,
  Minus,
  Plus,
  ChevronRight as ChevronRightIcon,
  Star
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { getErrorMessage, isSuccess } from "@/lib/api";

interface CategoryData {
  id?: number;
  nama: string;
}

interface SizeChartItem {
  size: string;
  chest?: string;
  length?: string;
  shoulder?: string;
}

interface ProductVariant {
  id: number;
  produk_id: number;
  nama_varian: string;
  nilai_varian: string;
  harga_tambahan: number;
  stok: number;
}

interface ProductData {
  id: number;
  nama: string;
  harga: number | string;
  kategori?: string | CategoryData | null;
  kategori_id?: number;
  idKategori?: number; // Database field name
  gambar?: string | null;
  gambar_url?: string | null;
  galeri?: string[] | null;
  galeri_urls?: string[] | null;
  deskripsi?: string | null;
  stok: number | string;
  varians?: ProductVariant[];
  varian?: string[] | null;
  panduan_ukuran?: SizeChartItem[] | null;
  average_rating?: number;
  rating_count?: number;
}

interface WishlistItem {
  id: number;
  produk_id: number;
}

const ProductDetail = ({ id }: { id: string }) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    // ID is already decoded by PageController
    fetchProduct(id);
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !product?.id) {
      setIsWishlisted(false);
      return;
    }

    const fetchWishlistStatus = async () => {
      try {
        const response = await axios.get("/api/customer/wishlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const wishlistItems: WishlistItem[] = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setIsWishlisted(wishlistItems.some((item) => item.produk_id === product.id));
      } catch (error) {
        console.error("Gagal mengambil wishlist:", error);
        setIsWishlisted(false);
      }
    };

    fetchWishlistStatus();
  }, [product?.id]);

  const fetchProduct = async (productId: string | number) => {
    try {
      const response = await axios.get(`/api/produk/${productId}`);
      const payload = response.data?.data ?? response.data;

      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid respons produk");
      }

      setProduct(payload as ProductData);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Produk tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };



  const handleAddToCart = async () => {
    // Get variant types from product
    const variantTypes = Array.from(
      new Set(product?.varians?.map(v => v.nama_varian) || [])
    );

    // Check if all required variants are selected
    for (const variantType of variantTypes) {
      if (!selectedVariants[variantType]) {
        toast.error(`Silakan pilih ${variantType} terlebih dahulu`);
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    if (!product) return;

    setAddingToCart(true);

    try {
      // Get all selected variant IDs as array
      const selectedVariantIds = Object.values(selectedVariants).filter(id => id !== undefined);

      const response = await axios.post(
        "/api/customer/keranjang",
        {
          produk_id: product.id,
          jumlah: quantity,
          varian_ids: selectedVariantIds.length > 0 ? selectedVariantIds : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (isSuccess(response)) {
        toast.success("Produk berhasil ditambahkan ke keranjang!");
        
        // Trigger event untuk update badge di navbar
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error: any) {
      console.error("Gagal menambahkan ke keranjang:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        router.visit("/login");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    // Get variant types from product
    const variantTypes = Array.from(
      new Set(product?.varians?.map(v => v.nama_varian) || [])
    );

    // Check if all required variants are selected
    for (const variantType of variantTypes) {
      if (!selectedVariants[variantType]) {
        toast.error(`Silakan pilih ${variantType} terlebih dahulu`);
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    if (!product) return;

    setBuyingNow(true);

    try {
      // Get all selected variant IDs as array
      const selectedVariantIds = Object.values(selectedVariants).filter(id => id !== undefined);

      // Store buy-now item data in sessionStorage for checkout
      const buyNowData = {
        produk_id: product.id,
        jumlah: quantity,
        varian_ids: selectedVariantIds.length > 0 ? selectedVariantIds : undefined,
      };
      
      sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowData));
      sessionStorage.setItem("canAccessCheckout", "true");
      
      toast.success("Menuju ke halaman checkout");
      router.visit("/checkout");
    } catch (error: any) {
      console.error("Gagal memproses pembelian:", error);
      toast.error("Gagal memproses pembelian");
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    setWishlistLoading(true);

    try {
      if (isWishlisted) {
        await axios.delete(`/api/customer/wishlist/${product.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsWishlisted(false);
        toast.success("Produk dihapus dari wishlist");
      } else {
        await axios.post(
          "/api/customer/wishlist",
          { produk_id: product.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsWishlisted(true);
        toast.success("Produk ditambahkan ke wishlist");
      }
    } catch (error: any) {
      console.error("Gagal memperbarui wishlist:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        router.visit("/login");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.nama,
      text: product.deskripsi || "Lihat produk terbaru dari ATHLEON",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Share dibatalkan", error);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link produk disalin");
    } catch (error) {
      console.error("Gagal menyalin link", error);
      toast.error("Tidak dapat menyalin link");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > availableStock) {
      setQuantity(availableStock);
      toast.warning(`Maksimal ${availableStock} pcs tersedia`);
    } else {
      setQuantity(value);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Produk tidak ditemukan.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryName = typeof product.kategori === "object"
    ? product.kategori?.nama ?? ""
    : product.kategori ?? "";
  const categorySlug = categoryName ? categoryName.toLowerCase() : "";
  const categoryQuery = categorySlug ? encodeURIComponent(categorySlug) : "";
  const price = Number(product.harga ?? 0);
  const availableStock = Number(product.stok ?? 0) || 0;
  
  // Get size chart from database
  const sizeChart = Array.isArray(product.panduan_ukuran) && product.panduan_ukuran.length > 0
    ? product.panduan_ukuran
    : [];
  
  // Build gallery images array using accessor URLs
  const galleryImages: string[] = [];
  
  // Use galeri_urls accessor if available (has proper URLs with /storage/ prefix)
  const galleryUrls = Array.isArray(product.galeri_urls) ? product.galeri_urls : [];
  
  if (galleryUrls.length > 0) {
    galleryImages.push(...galleryUrls);
  }
  
  // If no gallery images, use the main image accessor or placeholder
  if (galleryImages.length === 0) {
    const productImage = product.gambar_url || 
      (product.gambar && product.gambar !== 'placeholder.svg'
        ? product.gambar.startsWith("http") || product.gambar.startsWith("/")
          ? product.gambar
          : `/storage/${product.gambar.replace(/^\/+/, "")}`
        : `/storage/placeholder.svg`);
    galleryImages.push(productImage);
  }
  
  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead 
        title={product?.nama || "Detail Produk"}
        description={product?.deskripsi || `Detail produk ${product?.nama || 'olahraga'} di ${import.meta.env.VITE_APP_NAME || 'Athleon'}. Lihat spesifikasi, harga, varian, dan review produk.`}
        keywords={`${product?.nama}, ${categoryName}, ${import.meta.env.VITE_APP_NAME || 'athleon'}, toko olahraga, beli ${product?.nama}`}
      />
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">Beranda</Link>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <Link href="/catalog" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">Katalog</Link>
            {categoryName && (
              <>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <Link href={`/catalog?category=${categoryQuery}`} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">{categoryName}</Link>
              </>
            )}
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{product.nama}</span>
          </div>

          {/* Product Section */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 mb-16">
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <img
                  src={galleryImages[selectedImageIndex]}
                  alt={`${product.nama} - Image ${selectedImageIndex + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/storage/placeholder.svg'; }}
                />
                
                {/* Navigation Arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center transition-all"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center transition-all"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    
                    {/* Image Counter */}
                    <Badge className="absolute bottom-4 right-4 bg-black/80 dark:bg-white/80 text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 font-semibold shadow-lg">
                      {selectedImageIndex + 1} / {galleryImages.length}
                    </Badge>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {galleryImages.map((img, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square overflow-hidden rounded-lg border bg-white dark:bg-gray-800 transition-all ${
                        selectedImageIndex === index
                          ? "border-emerald-600 dark:border-emerald-500 border-2 ring-2 ring-emerald-200 dark:ring-emerald-900"
                          : "border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.nama} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/storage/placeholder.svg'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Category */}
              <div className="flex items-center gap-3">
                {categoryName && (
                  <Badge className="font-semibold uppercase tracking-wider px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900">
                    {categoryName}
                  </Badge>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-3">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                  {product.nama}
                </h1>
                
                {/* Rating Display */}
                {product.average_rating !== undefined && product.average_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(product.average_rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-base text-gray-700 dark:text-gray-300 font-semibold">
                      {product.average_rating.toFixed(1)}
                    </span>
                    {product.rating_count !== undefined && product.rating_count > 0 && (
                      <span className="text-base text-gray-500 dark:text-gray-400">
                        ({product.rating_count} ulasan)
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                    Rp {price.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </span>
                  {availableStock > 0 ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 gap-2 border border-green-300 dark:border-green-700">
                      <Check className="h-3 w-3" />
                      Tersedia
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border border-red-300 dark:border-red-700">Stok habis</Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
                {product.deskripsi || "Produk berkualitas premium untuk kebutuhan olahraga Anda."}
              </p>

              <Separator className="my-6" />

              {/* Variant Selection */}
              {product.varians && product.varians.length > 0 && (() => {
                // Group variants by type
                const variantGroups = product.varians.reduce((acc, variant) => {
                  if (!acc[variant.nama_varian]) {
                    acc[variant.nama_varian] = [];
                  }
                  acc[variant.nama_varian].push(variant);
                  return acc;
                }, {} as Record<string, ProductVariant[]>);

                return (
                  <div className="space-y-4">
                    {Object.entries(variantGroups).map(([variantType, variants]) => (
                      <div key={variantType} className="space-y-3">
                        <Label className="text-base font-semibold text-gray-900 dark:text-white">Pilih {variantType}</Label>
                        <div className="flex flex-wrap gap-2">
                          {variants.map((variant) => {
                            const isSelected = selectedVariants[variantType] === variant.id;
                            const isOutOfStock = variant.stok === 0;
                            
                            return (
                              <button
                                key={variant.id}
                                onClick={() => {
                                  if (!isOutOfStock) {
                                    setSelectedVariants(prev => ({
                                      ...prev,
                                      [variantType]: variant.id
                                    }));
                                  }
                                }}
                                disabled={isOutOfStock}
                                className={`min-w-[48px] px-4 h-12 rounded-lg border-2 text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg"
                                    : isOutOfStock
                                    ? "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed line-through"
                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                }`}
                              >
                                {variant.nilai_varian}
                                {variant.harga_tambahan > 0 && (
                                  <span className="ml-1 text-xs opacity-80">
                                    (+Rp{variant.harga_tambahan.toLocaleString("id-ID", { maximumFractionDigits: 0 })})
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Quantity */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 dark:text-white">Jumlah</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={availableStock === 0}
                    className="h-12 w-12 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {availableStock} pcs tersedia
                  </span>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleBuyNow}
                  className="h-14 w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
                  size="lg"
                  disabled={buyingNow || availableStock === 0}
                >
                  {buyingNow ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : availableStock === 0 ? (
                    "Stok Habis"
                  ) : (
                    "Beli Sekarang"
                  )}
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="h-14 w-full text-base font-semibold border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  size="lg"
                  disabled={addingToCart || availableStock === 0}
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Menambahkan...
                    </>
                  ) : availableStock === 0 ? (
                    "Stok Habis"
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Masukkan Keranjang
                    </>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant={isWishlisted ? "default" : "outline"}
                    className={`flex-1 h-12 gap-2 ${
                      isWishlisted 
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100" 
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                  >
                    {wishlistLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart
                        className="h-4 w-4"
                        fill={isWishlisted ? "currentColor" : "none"}
                      />
                    )}
                    {isWishlisted ? "Tersimpan" : "Wishlist"}
                  </Button>
                  <Button variant="outline" className="flex-1 h-12 gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    Bagikan
                  </Button>
                </div>
              </div>

            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            {/* Description */}
            <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 ${sizeChart.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Deskripsi Produk</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.deskripsi || "Produk berkualitas premium dengan material terbaik. Dirancang khusus untuk performa maksimal dalam aktivitas olahraga Anda."}
              </p>
            </div>

            {/* Size Chart */}
            {sizeChart.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Panduan Ukuran</h2>
                <div className="space-y-2">
                  {sizeChart.map((row) => (
                    <div key={row.size} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{row.size}</span>
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600">{row.size}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {row.chest && (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Dada</p>
                            <p>{row.chest} cm</p>
                          </div>
                        )}
                        {row.length && (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Panjang</p>
                            <p>{row.length} cm</p>
                          </div>
                        )}
                        {row.shoulder && (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Bahu</p>
                            <p>{row.shoulder} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                  * Toleransi ukuran ±1-2 cm
                </p>
              </div>
            )}
          </div>

          {/* Related Products */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Produk Terkait</h2>
                <p className="text-gray-600 dark:text-gray-400">Produk lain yang mungkin Anda suka</p>
              </div>
              <Link href={`/catalog?category=${categoryQuery}`}>
                <Button variant="outline" className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Lihat Semua
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <RelatedProducts 
              categoryId={
                product.idKategori ?? 
                product.kategori_id ?? 
                (typeof product.kategori === 'object' && product.kategori?.id ? product.kategori.id : 0)
              } 
              currentProductId={product.id} 
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
