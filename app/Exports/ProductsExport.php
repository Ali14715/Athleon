<?php

namespace App\Exports;

use App\Models\Produk;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function collection()
    {
        return Produk::with(['kategori', 'varians'])->get();
    }
    
    public function headings(): array
    {
        return [
            'ID',
            'Nama Produk',
            'Kategori',
            'Harga',
            'Stok',
            'Total Varian',
            'Status'
        ];
    }
    
    public function map($product): array
    {
        return [
            $product->id,
            $product->nama,
            $product->kategori->nama ?? '-',
            'Rp ' . number_format($product->harga, 0, ',', '.'),
            $product->stok,
            $product->varians->count(),
            $product->stok > 0 ? 'Tersedia' : 'Habis'
        ];
    }
    
    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
