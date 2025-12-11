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
        // Eager load kategori untuk memastikan relasi terload dengan benar
        return Produk::with(['kategori', 'varians'])
            ->orderBy('idKategori')
            ->orderBy('nama')
            ->get();
    }
    
    public function headings(): array
    {
        return [
            'ID',
            'Nama Produk',
            'Kategori',
            'Jenis Kelamin',
            'Harga',
            'Stok',
            'Total Varian',
            'Status'
        ];
    }
    
    public function map($product): array
    {
        // Pastikan kategori diambil dengan benar
        $kategoriNama = '-';
        if ($product->kategori && $product->kategori->nama) {
            $kategoriNama = $product->kategori->nama;
        } elseif ($product->idKategori) {
            // Fallback: coba ambil langsung dari database jika relasi gagal
            $kategori = \App\Models\Kategori::find($product->idKategori);
            $kategoriNama = $kategori ? $kategori->nama : 'ID: ' . $product->idKategori;
        }
        
        return [
            $product->id,
            $product->nama,
            $kategoriNama,
            $product->jenisKelamin ?? '-',
            'Rp ' . number_format($product->harga, 0, ',', '.'),
            $product->stok,
            $product->varians ? $product->varians->count() : 0,
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
