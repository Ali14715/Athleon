import { useState, useEffect } from "react";
import { ShoppingCart, Loader2, Star } from "lucide-react";
import { Link, router } from "@inertiajs/react";
import { toast } from "sonner";
import axios from "axios";
import { getErrorMessage, isSuccess } from "@/lib/api";
import VariantPickerDialog from "@/components/VariantPickerDialog";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string | { nama: string; [key: string]: any };
  hasVariants?: boolean;
  rating?: number;
  ratingCount?: number;
}

const ProductCard = ({ id, name, price, image, category, hasVariants: hasVariantsProp, rating, ratingCount }: ProductCardProps) => {
  const categoryName = typeof category === 'string' ? category : category?.nama || 'Produk';
  const [loading, setLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [hasVariants, setHasVariants] = useState(hasVariantsProp ?? false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'cart' | 'buy'>('cart');

  useEffect(() => {
    // Only check if product has variants if not provided as prop
    if (hasVariantsProp !== undefined) {
      return;
    }
    
    const checkVariants = async () => {
      try {
        const response = await axios.get(`/api/produk/${id}`);
        const product = response.data?.data ?? response.data;
        setHasVariants(product?.varians && product.varians.length > 0);
      } catch (error) {
        console.error("Failed to check variants:", error);
      }
    };
    checkVariants();
  }, [id, hasVariantsProp]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    // If product has variants, open the picker dialog
    if (hasVariants) {
      setDialogMode('cart');
      setVariantDialogOpen(true);
      return;
    }

    // Otherwise, add directly to cart
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/customer/keranjang",
        {
          produk_id: id,
          jumlah: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (isSuccess(response)) {
        toast.success("Produk ditambahkan ke keranjang");
        // Trigger refresh cart count
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error: any) {
      console.error("Gagal tambah ke keranjang:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        router.visit("/login");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.visit("/login");
      return;
    }

    // If product has variants, open the picker dialog in buy mode
    if (hasVariants) {
      setDialogMode('buy');
      setVariantDialogOpen(true);
      return;
    }

    // Store buy-now item directly without API call
    setBuyLoading(true);

    try {
      // Clear any previous checkout data
      sessionStorage.removeItem('selectedCartItems');
      
      // Store buy-now item data in sessionStorage for checkout
      const buyNowData = {
        produk_id: id,
        jumlah: 1,
        varian_ids: undefined,
      };
      
      sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowData));
      sessionStorage.setItem('canAccessCheckout', 'true');
      toast.success("Menuju ke halaman checkout");
      router.visit("/checkout");
    } catch (error: any) {
      console.error("Gagal menambahkan produk:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        router.visit("/login");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setBuyLoading(false);
    }
  };

  const productLink = `/product/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}/${btoa(String(id))}`;

  return (
    <>
      <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
        <Link href={productLink} preserveScroll className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
          <span className="absolute top-3 left-3 px-3 py-1 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-md">
            {categoryName}
          </span>
        </Link>

        <div className="p-4 flex flex-col gap-3 flex-1">
          <Link href={productLink} preserveScroll className="flex-1">
            <h3 className="text-gray-900 dark:text-white font-semibold text-base line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {name}
            </h3>
          </Link>

          <div className="flex flex-col gap-2 mt-auto">
            {/* Rating Display */}
            {rating !== undefined && rating > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {rating.toFixed(1)}
                </span>
                {ratingCount !== undefined && ratingCount > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({ratingCount})
                  </span>
                )}
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">
                Rp {Number(price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex-1"
                onClick={handleBuyNow}
                disabled={buyLoading}
                title="Buy now"
              >
                {buyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-sm">Beli</span>
                )}
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-600 dark:border-emerald-400 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                onClick={handleAddToCart}
                disabled={loading}
                title="Add to cart"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Picker Dialog */}
      <VariantPickerDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        productId={id}
        productName={name}
        basePrice={price}
        productImage={image}
        mode={dialogMode}
      />
    </>
  );
};

export default ProductCard;
