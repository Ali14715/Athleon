import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, Loader2, TrendingUp, TrendingDown, FileText, Download, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "@/lib/api";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalUsers?: number;
  totalRevenue: number;
  pendingOrders: number;
  packingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  monthlyRevenue?: number;
  revenueGrowth?: number;
  orderGrowth?: number;
}

interface Order {
  id: number;
  user: { name: string; email: string };
  status: string;
  total: number;
  total_harga: number;
  created_at: string;
}

interface SalesData {
  name: string;
  penjualan: number;
  pendapatan: number;
}

interface ProductSales {
  name: string;
  sold: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    packingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states for dashboard data
  const [dashboardFilters, setDashboardFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });
  // Filter states for export (uses same values as dashboard filters)
  const [showExportFilters, setShowExportFilters] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (filters?: { startDate: string; endDate: string; status: string }) => {
    setLoading(true);
    try {
      const currentFilters = filters || dashboardFilters;
      let url = "/api/admin/dashboard";
      const params = new URLSearchParams();
      
      if (currentFilters.startDate) {
        params.append('start_date', currentFilters.startDate);
      }
      if (currentFilters.endDate) {
        params.append('end_date', currentFilters.endDate);
      }
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.append('status', currentFilters.status);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      const data = response.data.data || response.data; // Handle nested API response
      setStats(data.stats || {});
      setRecentOrders(data.recentOrders || []);
      setSalesData(data.salesData || []);
      setTopProducts(data.topProducts || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const applyDashboardFilters = () => {
    fetchDashboardData(dashboardFilters);
  };
  
  const clearDashboardFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      status: 'all'
    };
    setDashboardFilters(emptyFilters);
    fetchDashboardData(emptyFilters);
  };
  
  const handleExport = (type: 'orders' | 'products' | 'revenue', format: 'pdf' | 'excel') => {
    const token = localStorage.getItem('token');
    const timestamp = new Date().getTime();
    let url = `/api/admin/export/${type}/${format}?timestamp=${timestamp}`;
    
    // Add filters for orders and revenue exports (use dashboard filters)
    if (type === 'orders' || type === 'revenue') {
      if (dashboardFilters.startDate) {
        url += `&start_date=${dashboardFilters.startDate}`;
      }
      if (dashboardFilters.endDate) {
        url += `&end_date=${dashboardFilters.endDate}`;
      }
      if (dashboardFilters.status && dashboardFilters.status !== 'all') {
        url += `&status=${encodeURIComponent(dashboardFilters.status)}`;
      }
    }
    
    // Open download in new window
    window.open(`${(import.meta.env.VITE_API_URL || window.location.origin)}${url}&token=${token}`, '_blank');
  };

    const statCards = [
    {
      title: "Total Produk",
      value: stats.totalProducts || 0,
      icon: Package,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-[#059669] to-emerald-600",
      trend: null,
    },
    {
      title: "Total Pesanan",
      value: stats.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-[#059669] to-emerald-500",
      subtext: `${stats.pendingOrders || 0} diproses`,
      trend: stats.orderGrowth,
    },
    {
      title: "Total Pengguna",
      value: stats.totalUsers || 0,
      icon: Users,
      color: "text-[#1E293B]",
      bgColor: "bg-gradient-to-br from-[#1E293B] to-slate-700",
      trend: null,
    },
    {
      title: "Total Pendapatan",
      value: `Rp ${Number(stats.totalRevenue || 0).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-500 to-[#059669]",
      trend: stats.revenueGrowth,
    },
  ];

  const orderStatusData = [
    { name: 'Selesai', value: stats.completedOrders || 0, color: '#10b981' },
    { name: 'Dikemas', value: stats.packingOrders || 0, color: '#f59e0b' },
    { name: 'Dikirim', value: stats.shippedOrders || 0, color: '#3b82f6' },
    { name: 'Dibatalkan', value: stats.cancelledOrders || 0, color: '#ef4444' },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      menunggu: "secondary",
      diproses: "default",
      dikirim: "default",
      selesai: "default",
      dibatalkan: "destructive",
    };
    return statusMap[status] || "secondary";
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Export Buttons */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Filter Laporan
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportFilters(!showExportFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showExportFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Export Filters - using dashboard filters */}
            {showExportFilters && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="exportStartDate" className="text-sm font-medium">Tanggal Mulai</Label>
                    <Input
                      id="exportStartDate"
                      type="date"
                      value={dashboardFilters.startDate}
                      onChange={(e) => setDashboardFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="exportEndDate" className="text-sm font-medium">Tanggal Akhir</Label>
                    <Input
                      id="exportEndDate"
                      type="date"
                      value={dashboardFilters.endDate}
                      onChange={(e) => setDashboardFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="exportStatus" className="text-sm font-medium">Status Pesanan</Label>
                    <Select
                      value={dashboardFilters.status}
                      onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="Belum Dibayar">Belum Dibayar</SelectItem>
                        <SelectItem value="Dikemas">Dikemas</SelectItem>
                        <SelectItem value="Dikirim">Dikirim</SelectItem>
                        <SelectItem value="Selesai">Selesai</SelectItem>
                        <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDashboardFilters}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyDashboardFilters}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Filter className="h-4 w-4" />
                    Terapkan ke Dashboard
                  </Button>
                </div>
                {(dashboardFilters.startDate || dashboardFilters.endDate || dashboardFilters.status !== 'all') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Filter aktif:</span>
                    {dashboardFilters.startDate && (
                      <Badge variant="secondary" className="text-xs">Dari: {dashboardFilters.startDate}</Badge>
                    )}
                    {dashboardFilters.endDate && (
                      <Badge variant="secondary" className="text-xs">Sampai: {dashboardFilters.endDate}</Badge>
                    )}
                    {dashboardFilters.status !== 'all' && (
                      <Badge variant="secondary" className="text-xs">Status: {dashboardFilters.status}</Badge>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Laporan Pesanan</p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">Export data pesanan dengan filter yang dipilih</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleExport('orders', 'pdf')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" onClick={() => handleExport('orders', 'excel')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Laporan Produk</p>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">Export semua data produk dan kategori</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleExport('products', 'pdf')} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" onClick={() => handleExport('products', 'excel')} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <FileText className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Laporan Pendapatan</p>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">Export laporan pendapatan dengan filter</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleExport('revenue', 'pdf')} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" onClick={() => handleExport('revenue', 'excel')} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <FileText className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.title}</CardTitle>
                <div className={`p-3 rounded-xl ${card.bgColor} shadow-lg`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</div>
                {card.subtext && <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>}
                {card.trend !== null && card.trend !== undefined && card.trend !== 0 && (
                  <div className={`flex items-center text-xs font-medium mt-2 ${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(card.trend).toFixed(1)}% dari bulan lalu
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Sales Chart */}
          <Card className="col-span-full lg:col-span-1 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Penjualan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg, white)', 
                      border: '1px solid var(--tooltip-border, #e5e7eb)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: 'var(--tooltip-text, #1f2937)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="penjualan" fill="url(#colorPenjualan)" name="Jumlah Penjualan" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorPenjualan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          <Card className="col-span-full lg:col-span-1 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Tren Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`}
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg, white)', 
                      border: '1px solid var(--tooltip-border, #e5e7eb)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: 'var(--tooltip-text, #1f2937)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="pendapatan" stroke="#059669" strokeWidth={3} name="Pendapatan" dot={{ fill: '#059669', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="col-span-full lg:col-span-1 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Distribusi Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg, white)', 
                      border: '1px solid var(--tooltip-border, #e5e7eb)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: 'var(--tooltip-text, #1f2937)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="col-span-full lg:col-span-1 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="name" type="category" width={100} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg, white)', 
                      border: '1px solid var(--tooltip-border, #e5e7eb)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: 'var(--tooltip-text, #1f2937)'
                    }}
                  />
                  <Bar dataKey="sold" fill="url(#colorSold)" name="Terjual" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="colorSold" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada pesanan
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30 transition-all duration-300 gap-3 hover:shadow-md"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground break-words">
                        {order.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground break-all">
                        {order.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right sm:space-y-2">
                      <Badge variant={getStatusBadge(order.status) as any} className="whitespace-nowrap shadow-sm">
                        {order.status}
                      </Badge>
                      <p className="font-bold text-[#059669] text-sm sm:text-base whitespace-nowrap">
                        Rp {order.total.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
