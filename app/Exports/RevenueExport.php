<?php

namespace App\Exports;

use App\Models\Pesanan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class RevenueExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $filters;
    
    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }
    
    public function collection()
    {
        $startDate = $this->filters['start_date'] ?? now()->subMonths(6)->startOfMonth();
        $endDate = $this->filters['end_date'] ?? now()->endOfDay();
        
        return Pesanan::with(['user'])
            ->whereIn('status', ['Dikemas', 'Dikirim', 'Selesai'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();
    }
    
    public function headings(): array
    {
        return [
            'Order ID',
            'Tanggal',
            'Customer',
            'Status',
            'Subtotal',
            'Ongkir',
            'Total Pendapatan'
        ];
    }
    
    public function map($order): array
    {
        return [
            $order->id,
            Carbon::parse($order->created_at)->format('d/m/Y H:i'),
            $order->user->name,
            $order->status,
            $order->total_harga - $order->ongkir,
            $order->ongkir,
            $order->total_harga
        ];
    }
    
    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
