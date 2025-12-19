import { Link } from "@inertiajs/react";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-100 via-gray-50 to-white dark:from-[#1E293B] dark:via-[#0f172a] dark:to-[#1E293B] text-gray-700 dark:text-[#D1D5DB] border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#059669] to-emerald-400 bg-clip-text text-transparent inline-block">Athleon</h3>
            <p className="text-sm text-gray-600 dark:text-[#D1D5DB]/80">
              Pakaian olahraga berkualitas untuk setiap atlet.
            </p>
          </div>

          {/* Kategori */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Kategori</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-[#D1D5DB]/80">
              <li><Link href="/catalog?category=futsal" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Futsal</Link></li>
              <li><Link href="/catalog?category=padel" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Padel</Link></li>
              <li><Link href="/catalog?category=basket" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Basket</Link></li>
              <li><Link href="/catalog?category=renang" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Renang</Link></li>
              <li><Link href="/catalog?category=esport" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Esport</Link></li>
              <li><Link href="/catalog?category=badminton" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Badminton</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Layanan</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-[#D1D5DB]/80">
              <li><Link href="/profile" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Profil Saya</Link></li>
              <li><Link href="/orders" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Status Pesanan</Link></li>
              <li><Link href="/cart" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Keranjang</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Ikuti Kami</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/10 mt-8 pt-8 text-center text-sm text-gray-500 dark:text-[#D1D5DB]/60">
          <p>&copy; 2025 Athleon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
