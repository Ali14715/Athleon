import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, Loader2, TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "@/lib/api";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalUsers?: number;
  totalRevenue: number;
  pendingOrders: number;
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
    completedOrders: 0,
    cancelledOrders: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/api/admin/dashboard");
      setStats(response.data.stats || {});
      setRecentOrders(response.data.recentOrders || []);
      setSalesData(response.data.salesData || []);
      setTopProducts(response.data.topProducts || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = (type: 'orders' | 'products' | 'revenue', format: 'pdf' | 'excel') => {
    const token = localStorage.getItem('token');
    const timestamp = new Date().getTime();
    const url = `/api/admin/export/${type}/${format}?timestamp=${timestamp}`;
    
    // Open download in new window
    window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${url}&token=${token}`, '_blank');
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
      subtext: `${stats.pendingOrders || 0} pending`,
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
    { name: 'Pending', value: stats.pendingOrders || 0, color: '#f59e0b' },
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
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Laporan Pesanan</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport('orders', 'pdf')} className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('orders', 'excel')} className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Laporan Produk</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport('products', 'pdf')} className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('products', 'excel')} className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Laporan Pendapatan</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport('revenue', 'pdf')} className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('revenue', 'excel')} className="flex-1">
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
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 gap-3 hover:shadow-md"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-[#1E293B]">Order #{order.id}</p>
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
