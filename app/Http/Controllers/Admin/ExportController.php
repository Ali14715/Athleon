<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\OrdersExport;
use App\Exports\ProductsExport;
use App\Exports\RevenueExport;
use Carbon\Carbon;

class ExportController extends Controller
{
    /**
     * Export orders to PDF
     */
    public function ordersPdf(Request $request)
    {
        $query = Pesanan::with(['user', 'items.produk']);
        
        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date,
                Carbon::parse($request->end_date)->endOfDay()
            ]);
        }
        
        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        $orders = $query->orderBy('created_at', 'desc')->get();
        
        $pdf = Pdf::loadView('exports.orders-pdf', [
            'orders' => $orders,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => $request->status
        ]);
        
        $timestamp = $request->has('timestamp') ? $request->timestamp : now()->format('Y-m-d');
        return $pdf->download('laporan_pesanan_' . $timestamp . '.pdf');
    }
    
    /**
     * Export orders to Excel
     */
    public function ordersExcel(Request $request)
    {
        $timestamp = $request->has('timestamp') ? $request->timestamp : now()->format('Y-m-d');
        return Excel::download(
            new OrdersExport($request->all()), 
            'laporan_pesanan_' . $timestamp . '.xlsx'
        );
    }
    
    /**
     * Export products to PDF
     */
    public function productsPdf(Request $request)
    {
        // Eager load kategori dan varians untuk memastikan relasi terload
        $products = Produk::with(['kategori', 'varians'])
            ->orderBy('idKategori')
            ->orderBy('nama')
            ->get();
        
        $pdf = Pdf::loadView('exports.products-pdf', [
            'products' => $products
        ]);
        
        $timestamp = $request->has('timestamp') ? $request->timestamp : now()->format('Y-m-d');
        return $pdf->download('laporan_produk_' . $timestamp . '.pdf');
    }
    
    /**
     * Export products to Excel
     */
    public function productsExcel(Request $request)
    {
        $timestamp = $request->has('timestamp') ? $request->timestamp : now()->format('Y-m-d');
        return Excel::download(
            new ProductsExport(), 
            'laporan_produk_' . $timestamp . '.xlsx'
        );
    }
    
    /**
     * Export revenue report to PDF
     */
    public function revenuePdf(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonths(6)->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfDay();
        
        $orders = Pesanan::with(['user'])
            ->whereIn('status', ['Dikemas', 'Dikirim', 'Selesai'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $totalRevenue = $orders->sum('total_harga');
        $totalOrders = $orders->count();
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        
        // Revenue by month
        $revenueByMonth = $orders->groupBy(function($order) {
            return Carbon::parse($order->created_at)->format('Y-m');
        })->map(function($monthOrders) {
            return [
                'count' => $monthOrders->count(),
                'revenue' => $monthOrders->sum('total_harga')
            ];
        });
        
        $pdf = Pdf::loadView('exports.revenue-pdf', [
            'orders' => $orders,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => $avgOrderValue,
            'revenue_by_month' => $revenueByMonth
        ]);
        
        $timestamp = $request->has('timestamp') ? $request->timestamp : now()->format('Y-m-d');
        return $pdf->download('laporan_pendapatan_' . $timestamp . '.pdf');
    }
    
    /**
     * Export revenue report to Excel
     */
    public function revenueExcel(Request $request)
    {
        $timestamp = $request->has('timestamp') ? $request->timestamp : now()->format('Y-m-d');
        return Excel::download(
            new RevenueExport($request->all()), 
            'laporan_pendapatan_' . $timestamp . '.xlsx'
        );
    }
}
