import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

type OrderStatus = "Belum Dibayar" | "Sudah Dibayar" | "Dikemas" | "Dikirim" | "Selesai" | "Dibatalkan";

interface Order {
  id: number;
  user: {
    id?: number;
    name: string;
    email: string;
  };
  status: OrderStatus;
  total?: number;
  total_harga?: number;
  ongkir?: number;
  created_at: string;
  updated_at?: string;
  tracking_number?: string | null;
  alamat_pengiriman?: string;
  nama_penerima?: string;
  nomor_telepon?: string;
  kurir_code?: string;
  kurir_service?: string;
  metode_pembayaran?: string;
  metode_pengiriman?: string;
  rating?: number | null;
  rating_feedback?: string | null;
  pembayaran?: {
    id: number;
    metode: string;
    status: string;
    jumlah_bayar: string | number;
    snap_token?: string;
    transaction_id?: string;
    external_id?: string;
  } | null;
  pengiriman?: {
    id: number;
    metode: string;
    ongkir: number;
    estimasi?: string;
    kurir?: string;
  } | null;
  itemPesanan?: Array<{
    id: number;
    produk: {
      id?: number;
      nama: string;
      harga: number;
      gambar_url?: string;
    };
    jumlah: number;
    harga_satuan: number;
    harga_varian?: number | null;
    varian_label?: string | null;
    subtotal?: number;
    varians?: Array<{ jenis: string; nilai: string }>;
  }>;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    perPage: 10,
    currentPage: 1,
    lastPage: 1,
  });

  const formatCurrency = (value?: number | null) => {
    const numeric = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    return `Rp ${numeric.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
  };

  const formatDateTime = (value?: string) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchOrders = useCallback(
    async (pageParam: number, searchTerm: string) => {
      setLoading(true);
      try {
        const response = await api.get("/api/admin/pesanan", {
          params: {
            page: pageParam,
            per_page: pagination.perPage,
            search: searchTerm || undefined,
          },
        });

        // Handle nested API response: { status_code, message, data: { data: [...], pagination: {...} } }
        let ordersArray: any[] = [];
        let paginationData: any = null;

        if (Array.isArray(response.data)) {
          // Direct array response
          ordersArray = response.data;
        } else if (response.data?.data) {
          // Check if data.data is array or nested object with data array
          if (Array.isArray(response.data.data)) {
            ordersArray = response.data.data;
            paginationData = response.data.pagination;
          } else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
            // Nested: data.data.data is the array
            ordersArray = response.data.data.data;
            paginationData = response.data.data.pagination || response.data.pagination;
          }
        }

        const normalised = ordersArray.map((order: any) => ({
          ...order,
          total: order.total ?? order.total_harga ?? 0,
          itemPesanan: order.itemPesanan ?? order.items ?? [],
          user: order.user ?? { name: "-", email: "-" },
        }));

        setOrders(normalised);

        if (paginationData) {
          setPagination({
            total: paginationData.total ?? normalised.length,
            perPage: paginationData.per_page ?? pagination.perPage,
            currentPage: paginationData.current_page ?? pageParam,
            lastPage: paginationData.last_page ?? 1,
          });
        } else {
          const totalItems = normalised.length;
          const lastPage = Math.max(1, Math.ceil(totalItems / pagination.perPage));
          setPagination((prev) => ({
            ...prev,
            total: totalItems,
            currentPage: pageParam,
            lastPage,
          }));
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Gagal memuat pesanan");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.perPage]
  );

  useEffect(() => {
    fetchOrders(page, search);
  }, [fetchOrders, page, search]);

  const openDetailDialog = async (order: Order) => {
    setDetailOpen(true);
    setSelectedOrder(null);
    setLoadingDetail(true);
    
    try {
      const response = await api.get(`/api/admin/orders/${order.id}`);
      const detailedOrder = response.data.data || response.data;
      
      setSelectedOrder({
        ...detailedOrder,
        total: detailedOrder.total ?? detailedOrder.total_harga ?? 0,
        itemPesanan: detailedOrder.itemPesanan ?? detailedOrder.items ?? [],
        user: detailedOrder.user ?? { name: "-", email: "-" },
      });
      setTrackingNumber(detailedOrder.tracking_number || "");
    } catch (error) {
      console.error("Error fetching order detail:", error);
      toast.error("Gagal memuat detail pesanan");
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/api/admin/pesanan/${orderId}/status`, { status: newStatus });
      
      toast.success("Status pesanan berhasil diupdate");
      fetchOrders(page, search);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengupdate status pesanan");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      toast.error("Nomor resi tidak boleh kosong");
      return;
    }

    setUpdatingTracking(true);
    try {
      await api.put(`/api/admin/pesanan/${selectedOrder.id}/tracking`, { 
        tracking_number: trackingNumber.trim() 
      });
      
      toast.success("Nomor resi berhasil diupdate");
      fetchOrders(page, search);
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, tracking_number: trackingNumber.trim() });
      }
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast.error("Gagal mengupdate nomor resi");
    } finally {
      setUpdatingTracking(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      "Belum Dibayar": { variant: "secondary", label: "Belum Dibayar" },
      "Sudah Dibayar": { variant: "default", label: "Sudah Dibayar" },
      "Dikemas": { variant: "default", label: "Dikemas" },
      "Dikirim": { variant: "default", label: "Dikirim" },
      "Selesai": { variant: "default", label: "Selesai" },
      "Dibatalkan": { variant: "destructive", label: "Dibatalkan" },
    };
    const statusInfo = statusMap[status];
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const canPrev = pagination.currentPage > 1;
  const canNext = pagination.currentPage < pagination.lastPage;

  if (loading) {
    return (
      <AdminLayout title="Manajemen Pesanan">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Pesanan">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Filter Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari berdasarkan ID, status, nama atau email pelanggan"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="shadow-sm">
                  Cari
                </Button>
                <Button type="button" variant="outline" onClick={handleResetSearch} className="shadow-sm">
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Daftar Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada pesanan
                </p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Order #{order.id}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.user?.name ?? "-"} - {order.user?.email ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-primary">
                        {formatCurrency(order.total ?? order.total_harga)}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shadow-sm"
                        onClick={() => openDetailDialog(order)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {orders.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan halaman {pagination.currentPage} dari {pagination.lastPage} ({pagination.total} pesanan)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => canPrev && setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canPrev}
              >
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => canNext && setPage((prev) => Math.min(pagination.lastPage, prev + 1))}
                disabled={!canNext}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan #{selectedOrder?.id ?? "..."}</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedOrder && (
            <div className="space-y-6">
              {/* Order Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedOrder.updated_at && (
                    <span>Terakhir diupdate: {formatDateTime(selectedOrder.updated_at)}</span>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-base">Informasi Pelanggan</h3>
                  <div className="space-y-1 text-sm bg-muted/30 p-3 rounded-lg">
                    <p><strong>ID Pelanggan:</strong> #{selectedOrder.user?.id ?? "-"}</p>
                    <p><strong>Nama:</strong> {selectedOrder.user?.name ?? "-"}</p>
                    <p><strong>Email:</strong> {selectedOrder.user?.email ?? "-"}</p>
                    <p><strong>Tanggal Pesanan:</strong> {formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="font-semibold mb-2 text-base">Informasi Pembayaran</h3>
                  <div className="space-y-1 text-sm bg-muted/30 p-3 rounded-lg">
                    <p><strong>Metode:</strong> {selectedOrder.metode_pembayaran ?? selectedOrder.pembayaran?.metode ?? "-"}</p>
                    {selectedOrder.pembayaran && (
                      <>
                        <p><strong>Status:</strong> <Badge variant={selectedOrder.pembayaran.status === "success" || selectedOrder.pembayaran.status === "paid" ? "default" : "secondary"}>{selectedOrder.pembayaran.status}</Badge></p>
                        <p><strong>Jumlah:</strong> {formatCurrency(Number(selectedOrder.pembayaran.jumlah_bayar))}</p>
                        {selectedOrder.pembayaran.transaction_id && (
                          <p className="text-xs"><strong>Transaction ID:</strong> {selectedOrder.pembayaran.transaction_id}</p>
                        )}
                        {selectedOrder.pembayaran.external_id && (
                          <p className="text-xs"><strong>External ID:</strong> {selectedOrder.pembayaran.external_id}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Item Pesanan</h3>
                <div className="space-y-2">
                  {(selectedOrder.itemPesanan ?? []).map((item) => {
                    // Calculate price properly with fallback to produk.harga
                    const pricePerUnit = item.harga_varian ?? item.harga_satuan ?? item.produk?.harga ?? 0;
                    const itemSubtotal = item.subtotal ?? (item.jumlah * pricePerUnit);
                    
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between items-start p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium mb-1">{item.produk.nama}</p>
                          {/* Display variant badges */}
                          {item.varians && item.varians.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.varians.map((varian: any, idx: number) => (
                                <span key={idx} className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                  {varian.jenis}: {varian.nilai}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Fallback to varian_label if varians array not available */}
                          {item.varian_label && (!item.varians || item.varians.length === 0) && (
                            <span className="inline-block mr-2 mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {item.varian_label}
                            </span>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Jumlah: {item.jumlah} x {formatCurrency(pricePerUnit)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {formatCurrency(itemSubtotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="font-semibold mb-2 text-base">Informasi Pengiriman</h3>
                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Penerima</p>
                      <p><strong>{selectedOrder.nama_penerima ?? "-"}</strong></p>
                      <p className="text-sm">{selectedOrder.nomor_telepon ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Kurir</p>
                      {selectedOrder.kurir_code ? (
                        <>
                          <p><strong>{selectedOrder.kurir_code.toUpperCase()}</strong> - {selectedOrder.kurir_service}</p>
                          {selectedOrder.tracking_number && (
                            <p className="text-xs mt-1">
                              <span className="text-muted-foreground">Resi:</span>{" "}
                              <span className="font-mono font-medium">{selectedOrder.tracking_number}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm pt-2 border-t">
                    <p className="text-muted-foreground text-xs mb-1">Alamat Lengkap</p>
                    <p>{selectedOrder.alamat_pengiriman ?? "-"}</p>
                  </div>
                  {selectedOrder.pengiriman && (
                    <div className="text-xs pt-2 border-t text-muted-foreground">
                      <p>Ongkir: {formatCurrency(selectedOrder.pengiriman.ongkir)}</p>
                      {selectedOrder.pengiriman.estimasi && (
                        <p>Estimasi: {selectedOrder.pengiriman.estimasi}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal Produk:</span>
                    <span>
                      {formatCurrency(
                        (selectedOrder.total ?? selectedOrder.total_harga ?? 0) - (selectedOrder.ongkir ?? 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ongkos Kirim:</span>
                    <span>{formatCurrency(selectedOrder.ongkir ?? 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">
                      {formatCurrency(selectedOrder.total ?? selectedOrder.total_harga)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating & Feedback (if completed) */}
              {selectedOrder.status === "Selesai" && selectedOrder.rating && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-base">Rating & Ulasan</h3>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-lg ${i < (selectedOrder.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium">{selectedOrder.rating}/5</span>
                    </div>
                    {selectedOrder.rating_feedback && (
                      <p className="text-sm text-muted-foreground italic">"{selectedOrder.rating_feedback}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h3 className="font-semibold mb-2">Update Status</h3>
                <div className="flex items-center gap-4">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedOrder.id, value as OrderStatus)
                    }
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Belum Dibayar">Belum Dibayar</SelectItem>
                      
                      <SelectItem value="Dikemas">Dikemas</SelectItem>
                      <SelectItem value="Dikirim">Dikirim</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
                      <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>

              {/* Tracking Number */}
              {(selectedOrder.status === "Dikirim" || selectedOrder.status === "Selesai") && (
                <div>
                  <h3 className="font-semibold mb-2">Nomor Resi Pengiriman</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Masukkan nomor resi"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      disabled={updatingTracking}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdateTracking}
                      disabled={updatingTracking || !trackingNumber.trim()}
                      size="sm"
                    >
                      {updatingTracking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Update Resi"
                      )}
                    </Button>
                  </div>
                  {selectedOrder.tracking_number && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Resi saat ini: <span className="font-medium">{selectedOrder.tracking_number}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
