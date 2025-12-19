<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Produk</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #059669; }
        .header h2 { margin: 5px 0; color: #333; }
        .summary { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
        .summary p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #059669; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .status-tersedia { color: #059669; font-weight: bold; }
        .status-habis { color: #dc2626; font-weight: bold; }
        .footer { text-align: right; margin-top: 20px; font-size: 11px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ATHLEON</h1>
        <h2>Laporan Produk</h2>
        <p>Tanggal Cetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>
    
    <div class="summary">
        <p><strong>Total Produk:</strong> {{ $products->count() }}</p>
        <p><strong>Produk Tersedia:</strong> {{ $products->where('stok', '>', 0)->count() }}</p>
        <p><strong>Produk Habis:</strong> {{ $products->where('stok', '<=', 0)->count() }}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Jenis Kelamin</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Varian</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
            @php
                $kategoriNama = '-';
                if ($product->idKategori) {
                    $kat = \App\Models\Kategori::find($product->idKategori);
                    $kategoriNama = $kat ? $kat->nama : '-';
                }
            @endphp
            <tr>
                <td>{{ $product->id }}</td>
                <td>{{ $product->nama }}</td>
                <td>{{ $kategoriNama }}</td>
                <td>{{ $product->jenisKelamin ?? '-' }}</td>
                <td>Rp {{ number_format($product->harga, 0, ',', '.') }}</td>
                <td>{{ $product->stok }}</td>
                <td>{{ $product->varians ? $product->varians->count() : 0 }}</td>
                <td class="{{ $product->stok > 0 ? 'status-tersedia' : 'status-habis' }}">
                    {{ $product->stok > 0 ? 'Tersedia' : 'Habis' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p>Total Produk: {{ $products->count() }} | Dicetak dari sistem Athleon</p>
    </div>
</body>
</html>
