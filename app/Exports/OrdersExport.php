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

class OrdersExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $filters;
    
    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }
    
    public function collection()
    {
        $query = Pesanan::with(['user', 'items.produk']);
        
        // Apply filters
        if (isset($this->filters['start_date']) && isset($this->filters['end_date'])) {
            $query->whereBetween('created_at', [
                $this->filters['start_date'],
                Carbon::parse($this->filters['end_date'])->endOfDay()
            ]);
        }
        
        if (isset($this->filters['status']) && $this->filters['status'] !== 'all') {
            $query->where('status', $this->filters['status']);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
    
    public function headings(): array
    {
        return [
            'Order ID',
            'Tanggal',
            'Nama Customer',
            'Email',
            'Status',
            'Metode Pembayaran',
            'Total',
            'Ongkir',
            'Grand Total'
        ];
    }
    
    public function map($order): array
    {
        return [
            $order->id,
            Carbon::parse($order->created_at)->format('d/m/Y H:i'),
            $order->user->name,
            $order->user->email,
            $order->status,
            $order->metode_pembayaran,
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
