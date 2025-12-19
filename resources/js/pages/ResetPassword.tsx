import { useEffect, useState } from "react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Moon, Sun, KeyRound } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

interface ResetPasswordProps {
  token?: string | null;
  email?: string | null;
}

const ResetPassword = ({ email: initialEmail }: ResetPasswordProps) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!otpSent || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast.error("Masukkan email terlebih dahulu");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/send-otp", { email });
      toast.success("Kode OTP telah dikirim ke email Anda.");
      setOtpSent(true);
      setTimeLeft(response.data?.expires_in ?? 600);
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!otp) {
      toast.error("Masukkan kode OTP terlebih dahulu");
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error("Password dan konfirmasi tidak sama");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/auth/reset-password-otp", {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });

      toast.success("Password berhasil diperbarui. Silakan login kembali.");
      router.visit("/login");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendLoading || timeLeft > 0) return;
    setResendLoading(true);
    try {
      const response = await axios.post("/api/auth/send-otp", { email });
      toast.success("Kode OTP baru telah dikirim.");
      setTimeLeft(response.data?.expires_in ?? 600);
      setOtp("");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900">
      <SEOHead
        title={otpSent ? "Reset Password" : "Lupa Password"}
        description={`Kelola reset password akun ${import.meta.env.VITE_APP_NAME || 'Athleon'} dengan aman melalui kode OTP.`}
        keywords="reset password, lupa password, athleon"
      />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#059669] via-emerald-600 to-emerald-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15)_0%,transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">ATHLEON</h1>
            <div className="h-1 w-20 bg-white/30 rounded-full"></div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-snug">
            {otpSent ? "Buat Password Baru" : "Pulihkan Akses Anda"}
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            {otpSent
              ? "Masukkan kode OTP yang kami kirim dan buat password baru Anda."
              : "Masukkan email Anda dan kami akan mengirimkan kode OTP untuk reset password."}
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; 2025 Athleon. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 min-h-screen p-6 sm:p-8 lg:p-12 flex items-center justify-center bg-white dark:bg-gray-900 relative">
        {/* Dark Mode Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-800"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mb-2">ATHLEON</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Sports Partner</p>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {otpSent ? "Reset Password" : "Lupa Password"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {otpSent
                ? "Verifikasi kode OTP lalu buat password baru untuk akun Anda"
                : "Masukkan email terdaftar untuk menerima kode OTP reset password"}
            </p>
          </div>

          <form onSubmit={otpSent ? handleResetSubmit : handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-11 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  readOnly={otpSent}
                />
              </div>
            </div>

            {otpSent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kode OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Masukkan 6 digit kode"
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg tracking-[0.4em]"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {timeLeft > 0
                      ? `Kode OTP berlaku hingga ${formatTime(timeLeft)}. Jika belum menerima, kirim ulang setelah waktu habis.`
                      : "Kode OTP sudah kadaluarsa? Kirim ulang untuk mendapatkan kode baru."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password_confirmation"
                      type="password"
                      placeholder="Ulangi password baru"
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-lg font-medium shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-200 mt-6"
              disabled={loading}
            >
              {loading ? "Loading..." : otpSent ? "Simpan Password Baru" : "Kirim Kode OTP"}
            </Button>

            {!otpSent && (
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
                  Kembali ke Login
                </Link>
              </div>
            )}

            {otpSent && (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tidak menerima kode?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleResendOtp}
                  disabled={resendLoading || timeLeft > 0}
                >
                  {resendLoading
                    ? "Mengirim..."
                    : timeLeft > 0
                      ? `Kirim ulang dalam ${formatTime(timeLeft)}`
                      : "Kirim Ulang OTP"}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
