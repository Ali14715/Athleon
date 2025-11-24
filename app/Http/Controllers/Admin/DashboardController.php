<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Produk;
use App\Models\Pesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Produk::count();
        $totalOrders = Pesanan::count();
        $totalCustomers = User::where('role', 'customer')->count();
        
        // Total pendapatan dari pesanan yang sudah selesai
        $totalRevenue = Pesanan::whereIn('status', ['dikirim', 'selesai'])
            ->sum('total_harga');
        
        // Hitung pesanan berdasarkan status
        $pendingOrders = Pesanan::where('status', 'menunggu')->count();
        $completedOrders = Pesanan::where('status', 'selesai')->count();
        $cancelledOrders = Pesanan::where('status', 'dibatalkan')->count();
        
        // Monthly revenue (bulan ini)
        $monthlyRevenue = Pesanan::whereIn('status', ['dikirim', 'selesai'])
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('total_harga');
        
        // Revenue growth (perbandingan dengan bulan lalu)
        $lastMonthRevenue = Pesanan::whereIn('status', ['dikirim', 'selesai'])
            ->whereMonth('created_at', Carbon::now()->subMonth()->month)
            ->whereYear('created_at', Carbon::now()->subMonth()->year)
            ->sum('total_harga');
        
        $revenueGrowth = $lastMonthRevenue > 0 
            ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : 0;
        
        // Sales data untuk chart (6 bulan terakhir)
        $salesData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->format('M Y');
            
            $penjualan = Pesanan::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();
            
            $pendapatan = Pesanan::whereIn('status', ['dikirim', 'selesai'])
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->sum('total_harga');
            
            $salesData[] = [
                'name' => $month,
                'penjualan' => $penjualan,
                'pendapatan' => (int)$pendapatan,
            ];
        }
        
        // Pesanan terbaru
        $recentOrders = Pesanan::with(['user'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'user' => [
                        'name' => $order->user->name,
                        'email' => $order->user->email,
                    ],
                    'status' => $order->status,
                    'total' => $order->total_harga,
                    'total_harga' => $order->total_harga,
                    'created_at' => $order->created_at,
                ];
            });
        
        // Top products
        $topProducts = DB::table('item_pesanan')
            ->join('produk', 'item_pesanan.produk_id', '=', 'produk.id')
            ->select('produk.nama', DB::raw('SUM(item_pesanan.jumlah) as sold'))
            ->groupBy('produk.id', 'produk.nama')
            ->orderBy('sold', 'desc')
            ->take(5)
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->nama,
                    'sold' => (int)$item->sold,
                ];
            });

        return response()->json([
            'stats' => [
                'totalProducts' => $totalProducts,
                'totalOrders' => $totalOrders,
                'totalCustomers' => $totalCustomers,
                'totalRevenue' => $totalRevenue,
                'pendingOrders' => $pendingOrders,
                'completedOrders' => $completedOrders,
                'cancelledOrders' => $cancelledOrders,
                'monthlyRevenue' => $monthlyRevenue,
                'revenueGrowth' => round($revenueGrowth, 2),
            ],
            'recentOrders' => $recentOrders,
            'salesData' => $salesData,
            'topProducts' => $topProducts,
        ]);
    }
}
