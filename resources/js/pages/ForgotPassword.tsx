import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2, Lock, KeyRound, Moon, Sun } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import api, { getErrorMessage, isSuccess, getMessage } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const ForgotPassword = () => {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/send-otp", { email });

      if (isSuccess(res)) {
        toast.success("Kode OTP telah dikirim ke email Anda!");
        setStep("otp");
        setTimeLeft(res.data.expires_in || 600);
      } else {
        toast.error(getMessage(res) || "Gagal mengirim OTP");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/verify-otp", { email, otp });

      if (isSuccess(res)) {
        toast.success("Kode OTP valid!");
        setStep("password");
      } else {
        toast.error(getMessage(res) || "Kode OTP tidak valid");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
      toast.error("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/reset-password-otp", {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (isSuccess(res)) {
        toast.success("Password berhasil direset!");
        setStep("success");
      } else {
        toast.error(getMessage(res) || "Gagal reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/send-otp", { email });
      if (isSuccess(res)) {
        toast.success("Kode OTP baru telah dikirim!");
        setTimeLeft(res.data.expires_in || 600);
        setOtp("");
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900">
      <SEOHead
        title="Lupa Password"
        description={`Reset password akun ${import.meta.env.VITE_APP_NAME || 'Athleon'} Anda dengan mudah dan aman.`}
      />
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#059669] via-emerald-600 to-emerald-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15)_0%,transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="relative z-10">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali ke Login</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">ATHLEON</h1>
            <div className="h-1 w-20 bg-white/30 rounded-full"></div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-snug">
            Lupa Password?
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Jangan khawatir! Kami akan mengirimkan kode verifikasi OTP ke email Anda untuk reset password dengan aman.
          </p>
          
          {/* Step Indicator */}
          <div className="mt-8 flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'email' || step === 'otp' || step === 'password' || step === 'success' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'} font-semibold transition-colors`}>
              1
            </div>
            <div className={`h-1 flex-1 rounded-full ${step === 'otp' || step === 'password' || step === 'success' ? 'bg-white' : 'bg-white/20'} transition-colors`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'otp' || step === 'password' || step === 'success' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'} font-semibold transition-colors`}>
              2
            </div>
            <div className={`h-1 flex-1 rounded-full ${step === 'password' || step === 'success' ? 'bg-white' : 'bg-white/20'} transition-colors`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'password' || step === 'success' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'} font-semibold transition-colors`}>
              3
            </div>
          </div>
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
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mb-2">ATHLEON</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Sports Partner</p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-5 duration-500">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 mb-4">
                  <Mail className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Masukkan alamat email yang terdaftar untuk menerima kode OTP
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alamat Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="contoh@email.com" 
                      className="pl-12 h-14 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-base transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Kami akan mengirimkan kode verifikasi 6 digit ke email ini
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white h-14 rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Mengirim...
                    </span>
                  ) : (
                    "Kirim Kode OTP"
                  )}
                </Button>

                <div className="text-center pt-6">
                  <Link 
                    href="/login" 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-2 group transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Kembali ke halaman login
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-5 duration-500">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 mb-4">
                  <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Verifikasi Kode OTP</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Kami telah mengirim kode 6 digit ke<br />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="otp" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Masukkan Kode OTP</Label>
                  <div className="relative">
                    <Input 
                      id="otp" 
                      type="text" 
                      placeholder="●●●●●●" 
                      className="h-20 text-center text-4xl tracking-[1rem] font-bold border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl transition-all"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                  {timeLeft > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Berlaku: {formatTime(timeLeft)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-red-600 dark:text-red-400 font-medium">
                      Kode OTP telah kedaluwarsa
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white h-14 rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memverifikasi...
                    </span>
                  ) : (
                    "Verifikasi Kode"
                  )}
                </Button>

                <div className="flex flex-col items-center gap-3 pt-4">
                  {timeLeft === 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/20 h-11 px-6 rounded-lg font-semibold transition-all"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                    >
                      Kirim Ulang Kode OTP
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Belum menerima kode? Tunggu {formatTime(timeLeft)}
                    </p>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-2 group transition-colors"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Ubah Alamat Email
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-5 duration-500">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 mb-4">
                  <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Buat Password Baru</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Pastikan password Anda kuat dan mudah diingat
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password Baru</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Minimal 6 karakter" 
                      className="pl-12 h-14 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-base transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">Password minimal 6 karakter</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Konfirmasi Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <Input 
                      id="password_confirmation" 
                      type="password" 
                      placeholder="Ulangi password baru" 
                      className="pl-12 h-14 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-base transition-all"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                    />
                  </div>
                  {passwordConfirmation.length > 0 && password !== passwordConfirmation && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">Password tidak cocok</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Syarat Password:</p>
                  <ul className="space-y-1.5">
                    <li className={`text-xs flex items-center gap-2 ${password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${password.length >= 6 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-gray-400'}`}></div>
                      Minimal 6 karakter
                    </li>
                    <li className={`text-xs flex items-center gap-2 ${password === passwordConfirmation && password.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${password === passwordConfirmation && password.length > 0 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-gray-400'}`}></div>
                      Password dan konfirmasi cocok
                    </li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white h-14 rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Mereset Password...
                    </span>
                  ) : (
                    "Reset Password Sekarang"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center space-y-8 animate-in fade-in-50 zoom-in-95 duration-500">
              <div className="relative mx-auto w-28 h-28">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-full flex items-center justify-center">
                  <div className="absolute inset-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  Berhasil!
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Password Berhasil Direset
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-sm mx-auto">
                  Selamat! Password Anda telah berhasil diubah. Anda sekarang dapat login dengan password baru Anda.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white h-14 rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => router.visit("/login")}
                >
                  Login Sekarang
                </Button>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Anda akan diarahkan ke halaman login
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;