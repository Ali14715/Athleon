<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pendapatan</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #059669; }
        .summary { margin-bottom: 20px; padding: 15px; background-color: #f3f4f6; }
        .summary-item { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #059669; color: white; }
        .total { text-align: right; font-weight: bold; margin-top: 20px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ATHLEON</h1>
        <h2>Laporan Pendapatan</h2>
        <p>Periode: {{ \Carbon\Carbon::parse($start_date)->format('d/m/Y') }} - {{ \Carbon\Carbon::parse($end_date)->format('d/m/Y') }}</p>
        <p>Tanggal Cetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>
    
    <div class="summary">
        <h3>Ringkasan</h3>
        <div class="summary-item">Total Pesanan: <strong>{{ $total_orders }}</strong></div>
        <div class="summary-item">Total Pendapatan: <strong>Rp {{ number_format($total_revenue, 0, ',', '.') }}</strong></div>
        <div class="summary-item">Rata-rata per Pesanan: <strong>Rp {{ number_format($avg_order_value, 0, ',', '.') }}</strong></div>
    </div>
    
    <h3>Detail Pendapatan per Bulan</h3>
    <table>
        <thead>
            <tr>
                <th>Bulan</th>
                <th>Jumlah Pesanan</th>
                <th>Total Pendapatan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($revenue_by_month as $month => $data)
            <tr>
                <td>{{ \Carbon\Carbon::parse($month . '-01')->format('F Y') }}</td>
                <td>{{ $data['count'] }}</td>
                <td>Rp {{ number_format($data['revenue'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <h3>Detail Pesanan</h3>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
            <tr>
                <td>{{ $order->id }}</td>
                <td>{{ $order->created_at->format('d/m/Y') }}</td>
                <td>{{ $order->user->name }}</td>
                <td>{{ $order->status }}</td>
                <td>Rp {{ number_format($order->total_harga, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
