<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Produk</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #059669; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #059669; color: white; }
        .footer { text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ATHLEON</h1>
        <h2>Laporan Produk</h2>
        <p>Tanggal Cetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Varian</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
            <tr>
                <td>{{ $product->id }}</td>
                <td>{{ $product->nama }}</td>
                <td>{{ $product->kategori->nama ?? '-' }}</td>
                <td>Rp {{ number_format($product->harga, 0, ',', '.') }}</td>
                <td>{{ $product->stok }}</td>
                <td>{{ $product->varians->count() }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p>Total Produk: {{ $products->count() }}</p>
    </div>
</body>
</html>
