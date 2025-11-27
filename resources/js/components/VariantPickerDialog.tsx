import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { getErrorMessage, isSuccess } from "@/lib/api";
import { router } from "@inertiajs/react";
import { formatRupiah } from "@/lib/utils";

interface ProductVariant {
  id: number;
  produk_id: number;
  nama_varian: string;
  nilai_varian: string;
  harga_tambahan: number;
  stok: number;
}

interface VariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
  basePrice: number;
  productImage?: string;
  onSuccess?: () => void;
  mode?: 'cart' | 'buy';
}

const VariantPickerDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  basePrice,
  productImage,
  onSuccess,
  mode = 'cart',
}: VariantPickerDialogProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [maxStock, setMaxStock] = useState(999);

  useEffect(() => {
    if (open) {
      fetchVariants();
      setSelectedVariants({});
      setQuantity(1);
    }
  }, [open, productId]);

  // Update max stock when variants are selected
  useEffect(() => {
    const selectedVariantsList = Object.values(selectedVariants)
      .map(id => variants.find(v => v.id === id))
      .filter(Boolean);
    
    if (selectedVariantsList.length > 0) {
      // Get minimum stock from all selected variants
      const minStock = Math.min(...selectedVariantsList.map(v => v?.stok || 999));
      setMaxStock(minStock);
      // Adjust quantity if it exceeds new max stock
      if (quantity > minStock) {
        setQuantity(minStock);
      }
    } else {
      setMaxStock(999);
    }
  }, [selectedVariants, variants]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/produk/${productId}`);
      const product = response.data?.data ?? response.data;
      if (product?.varians && Array.isArray(product.varians)) {
        setVariants(product.varians);
      } else {
        setVariants([]);
      }
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      toast.error("Gagal memuat varian produk");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    // Group variants by type to validate all are selected
    const variantTypes = Array.from(new Set(variants.map(v => v.nama_varian)));
    
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

    setAdding(true);

    try {
      // Send array of all selected variant IDs (e.g., [12, 15] for Size XL + Warna Merah)
      const selectedVariantIds = Object.values(selectedVariants);

      // Use different endpoint based on mode
      const endpoint = mode === 'buy' ? "/api/customer/buy-now" : "/api/customer/keranjang";
      
      const response = await axios.post(
        endpoint,
        {
          produk_id: productId,
          jumlah: quantity,
          varian_ids: selectedVariantIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (isSuccess(response)) {
        if (mode === 'buy') {
          // Clear any previous cart checkout data
          sessionStorage.removeItem('selectedCartItems');
          
          // Store buy-now item data in sessionStorage for checkout
          const buyNowData = {
            produk_id: productId,
            jumlah: quantity,
            varian_ids: selectedVariantIds,
          };
          sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowData));
          sessionStorage.setItem("canAccessCheckout", "true");
          toast.success("Menuju ke halaman checkout");
          router.visit("/checkout");
        } else {
          toast.success(`${quantity} produk berhasil ditambahkan ke keranjang!`);
          window.dispatchEvent(new Event("cartUpdated"));
          onOpenChange(false);
          if (onSuccess) onSuccess();
        }
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
      setAdding(false);
    }
  };

  // Group variants by type
  const variantGroups = variants.reduce((acc, variant) => {
    if (!acc[variant.nama_varian]) {
      acc[variant.nama_varian] = [];
    }
    acc[variant.nama_varian].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  // Calculate total price with selected variants (sum all harga_tambahan)
  const selectedVariantsList = Object.values(selectedVariants)
    .map(id => variants.find(v => v.id === id))
    .filter(Boolean);
  const additionalPrice = selectedVariantsList.reduce((sum, v) => sum + (v?.harga_tambahan || 0), 0);
  const totalPrice = basePrice + additionalPrice;

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && mode === 'buy') {
      // User cancelled buy-now, clear any stale sessionStorage
      sessionStorage.removeItem('buyNowItem');
      sessionStorage.removeItem('canAccessCheckout');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Varian</DialogTitle>
          <DialogDescription>
            Pilih ukuran dan warna untuk {productName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Preview */}
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {productImage && (
                <img
                  src={productImage}
                  alt={productName}
                  className="h-16 w-16 rounded-md object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-2">{productName}</h4>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {formatRupiah(totalPrice)}
                  {additionalPrice > 0 && (
                    <span className="text-xs text-slate-500 ml-1">
                      (+{formatRupiah(additionalPrice)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Variant Selection */}
            {Object.entries(variantGroups).map(([variantType, variantOptions]) => (
              <div key={variantType} className="space-y-3">
                <Label className="text-sm font-semibold">
                  {variantType}
                  <span className="text-rose-500 ml-1">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {variantOptions.map((variant) => {
                    const isSelected = selectedVariants[variantType] === variant.id;
                    const isOutOfStock = variant.stok <= 0;
                    
                    return (
                      <button
                        key={variant.id}
                        onClick={() => {
                          if (isOutOfStock) return;
                          setSelectedVariants(prev => ({
                            ...prev,
                            [variantType]: variant.id,
                          }));
                        }}
                        disabled={isOutOfStock}
                        className={`
                          relative rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all
                          ${isSelected 
                            ? "border-slate-900 bg-slate-900 text-white" 
                            : isOutOfStock
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                          }
                        `}
                      >
                        {variant.nilai_varian}
                        {isOutOfStock && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="h-0.5 w-full bg-slate-400 rotate-[-20deg]"></span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Jumlah
                <span className="text-rose-500 ml-1">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-lg"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  min="1"
                  max={maxStock}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 1) {
                      setQuantity(1);
                    } else if (value > maxStock) {
                      setQuantity(maxStock);
                      toast.warning(`Maksimal ${maxStock} pcs tersedia`);
                    } else {
                      setQuantity(value);
                    }
                  }}
                  className="w-20 h-10 text-center text-lg font-semibold border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock}
                  className="h-10 w-10 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 ml-2">
                  {maxStock < 999 ? `${maxStock} pcs tersedia` : 'Tersedia'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={adding}
              >
                Batal
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={adding || Object.keys(selectedVariants).length < Object.keys(variantGroups).length}
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === 'buy' ? 'Memproses...' : 'Menambahkan...'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    {mode === 'buy' ? 'Beli Sekarang' : 'Tambah ke Keranjang'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VariantPickerDialog;
