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
    public function index(Request $request)
    {
        // Parse filter parameters
        $startDate = $request->has('start_date') && $request->start_date 
            ? Carbon::parse($request->start_date)->startOfDay() 
            : null;
        $endDate = $request->has('end_date') && $request->end_date 
            ? Carbon::parse($request->end_date)->endOfDay() 
            : null;
        $statusFilter = $request->has('status') && $request->status !== 'all' 
            ? $request->status 
            : null;
        
        $totalProducts = Produk::count();
        
        // Base query untuk pesanan dengan filter
        $ordersQuery = Pesanan::query();
        if ($startDate && $endDate) {
            $ordersQuery->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $ordersQuery->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $ordersQuery->where('created_at', '<=', $endDate);
        }
        if ($statusFilter) {
            $ordersQuery->where('status', $statusFilter);
        }
        
        $totalOrders = (clone $ordersQuery)->count();
        $totalUsers = User::where('role', 'customer')->count();
        
        // Total pendapatan dari pesanan yang sudah selesai (dengan filter)
        $revenueQuery = Pesanan::whereIn('status', ['Dikirim', 'Selesai']);
        if ($startDate && $endDate) {
            $revenueQuery->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $revenueQuery->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $revenueQuery->where('created_at', '<=', $endDate);
        }
        $totalRevenue = $revenueQuery->sum('total_harga');
        
        // Hitung pesanan berdasarkan status (dengan filter tanggal)
        $statusBaseQuery = Pesanan::query();
        if ($startDate && $endDate) {
            $statusBaseQuery->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $statusBaseQuery->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $statusBaseQuery->where('created_at', '<=', $endDate);
        }
        
        $pendingOrders = (clone $statusBaseQuery)->where('status', 'Belum Dibayar')->count();
        $packingOrders = (clone $statusBaseQuery)->where('status', 'Dikemas')->count();
        $shippedOrders = (clone $statusBaseQuery)->where('status', 'Dikirim')->count();
        $completedOrders = (clone $statusBaseQuery)->where('status', 'Selesai')->count();
        $cancelledOrders = (clone $statusBaseQuery)->where('status', 'Dibatalkan')->count();
        
        // Monthly revenue dan growth - berdasarkan filter atau default bulan ini
        if ($startDate && $endDate) {
            // Jika ada filter tanggal, gunakan range tersebut
            $monthlyRevenue = Pesanan::whereIn('status', ['Dikirim', 'Selesai'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_harga');
            
            // Calculate periode sebelumnya untuk perbandingan
            $daysDiff = $startDate->diffInDays($endDate);
            $prevStartDate = (clone $startDate)->subDays($daysDiff + 1);
            $prevEndDate = (clone $startDate)->subDay();
            
            $lastPeriodRevenue = Pesanan::whereIn('status', ['Dikirim', 'Selesai'])
                ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
                ->sum('total_harga');
        } else {
            // Default: bulan ini vs bulan lalu
            $monthlyRevenue = Pesanan::whereIn('status', ['Dikirim', 'Selesai'])
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('total_harga');
            
            $lastPeriodRevenue = Pesanan::whereIn('status', ['Dikirim', 'Selesai'])
                ->whereMonth('created_at', Carbon::now()->subMonth()->month)
                ->whereYear('created_at', Carbon::now()->subMonth()->year)
                ->sum('total_harga');
        }
        
        $revenueGrowth = $lastPeriodRevenue > 0 
            ? (($monthlyRevenue - $lastPeriodRevenue) / $lastPeriodRevenue) * 100 
            : 0;
        
        // Sales data untuk chart
        $salesData = [];
        if ($startDate && $endDate) {
            // Group by month dalam range
            $current = (clone $startDate)->startOfMonth();
            $end = (clone $endDate)->endOfMonth();
            
            while ($current <= $end) {
                $monthStart = (clone $current)->startOfMonth();
                $monthEnd = (clone $current)->endOfMonth();
                
                // Adjust untuk filter tanggal
                if ($monthStart < $startDate) $monthStart = $startDate;
                if ($monthEnd > $endDate) $monthEnd = $endDate;
                
                $penjualan = Pesanan::whereBetween('created_at', [$monthStart, $monthEnd])->count();
                
                $pendapatan = Pesanan::whereIn('status', ['Dikirim', 'Selesai'])
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('total_harga');
                
                $salesData[] = [
                    'name' => $current->format('M Y'),
                    'penjualan' => $penjualan,
                    'pendapatan' => (int)$pendapatan,
                ];
                
                $current->addMonth();
            }
        } else {
            // Default: 6 bulan terakhir
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->format('M Y');
                
                $penjualan = Pesanan::whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count();
                
                $pendapatan = Pesanan::whereIn('status', ['Dikirim', 'Selesai'])
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->sum('total_harga');
                
                $salesData[] = [
                    'name' => $month,
                    'penjualan' => $penjualan,
                    'pendapatan' => (int)$pendapatan,
                ];
            }
        }
        
        // Pesanan terbaru (dengan filter)
        $recentOrdersQuery = Pesanan::with(['user']);
        if ($startDate && $endDate) {
            $recentOrdersQuery->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $recentOrdersQuery->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $recentOrdersQuery->where('created_at', '<=', $endDate);
        }
        if ($statusFilter) {
            $recentOrdersQuery->where('status', $statusFilter);
        }
        
        $recentOrders = $recentOrdersQuery
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'user' => [
                        'name' => $order->user->name ?? 'Unknown',
                        'email' => $order->user->email ?? '',
                    ],
                    'status' => $order->status,
                    'total' => $order->total_harga,
                    'total_harga' => $order->total_harga,
                    'created_at' => $order->created_at,
                ];
            });
        
        // Top products (dengan filter tanggal)
        $topProductsQuery = DB::table('item_pesanan')
            ->join('produk', 'item_pesanan.produk_id', '=', 'produk.id')
            ->join('pesanan', 'item_pesanan.pesanan_id', '=', 'pesanan.id');
        
        if ($startDate && $endDate) {
            $topProductsQuery->whereBetween('pesanan.created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $topProductsQuery->where('pesanan.created_at', '>=', $startDate);
        } elseif ($endDate) {
            $topProductsQuery->where('pesanan.created_at', '<=', $endDate);
        }
        
        $topProducts = $topProductsQuery
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

        return $this->successResponse([
            'stats' => [
                'totalProducts' => $totalProducts,
                'totalOrders' => $totalOrders,
                'totalUsers' => $totalUsers,
                'totalRevenue' => $totalRevenue,
                'pendingOrders' => $pendingOrders,
                'packingOrders' => $packingOrders,
                'shippedOrders' => $shippedOrders,
                'completedOrders' => $completedOrders,
                'cancelledOrders' => $cancelledOrders,
                'monthlyRevenue' => $monthlyRevenue,
                'revenueGrowth' => round($revenueGrowth, 2),
            ],
            'recentOrders' => $recentOrders,
            'salesData' => $salesData,
            'topProducts' => $topProducts,
            'filters' => [
                'start_date' => $startDate ? $startDate->format('Y-m-d') : null,
                'end_date' => $endDate ? $endDate->format('Y-m-d') : null,
                'status' => $statusFilter,
            ],
        ], 'Dashboard data retrieved successfully');
    }
}
