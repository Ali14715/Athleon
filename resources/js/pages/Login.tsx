import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import { getErrorMessage, isSuccess, getMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, User, Phone, Moon, Sun } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

// Prefer env-provided API URL; fall back to same-origin (no localhost hardcode)
const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";
const API_URL = `${(import.meta.env.VITE_API_URL || runtimeOrigin)}/api/auth`;

const Login = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register State
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerTelepon, setRegisterTelepon] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.visit("/profile");
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email: loginEmail,
        password: loginPassword,
      });

      if (isSuccess(res)) {
        // Token is in res.data.data.token with new API format
        const loginData = res.data?.data || res.data;
        const token = loginData.token;
        
        if (token) {
          localStorage.setItem("token", token);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:login"));
          }
          toast.success("Login berhasil!");
          router.visit("/");
        } else {
          toast.error("Token tidak ditemukan dalam response");
        }
      } else {
        toast.error(getMessage(res) || "Login gagal!");
      }
    } catch (error: any) {
      // Error handled by toast - no need to log to console
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast.error("Password dan konfirmasi tidak cocok!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register`, {
        name: registerName,
        email: registerEmail,
        telepon: registerTelepon,
        password: registerPassword,
        password_confirmation: registerConfirmPassword,
      });

      if (isSuccess(res)) {
        toast.success("Registrasi berhasil! Silakan login.");
        setActiveTab("login");
        setRegisterName("");
        setRegisterEmail("");
        setRegisterTelepon("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
      } else {
        toast.error(getMessage(res) || "Registrasi gagal!");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900">
      <SEOHead 
        title={activeTab === "login" ? "Login" : "Daftar Akun"}
        description={activeTab === "login" 
          ? `Login ke akun ${import.meta.env.VITE_APP_NAME || 'Athleon'} Anda untuk akses penuh ke fitur belanja, tracking pesanan, dan penawaran eksklusif.`
          : `Daftar akun ${import.meta.env.VITE_APP_NAME || 'Athleon'} sekarang dan nikmati kemudahan berbelanja perlengkapan olahraga dengan promo menarik.`}
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
            Your Ultimate Sports Gear Destination
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Temukan perlengkapan olahraga terbaik untuk mencapai performa maksimal Anda.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; 2025 Athleon. All rights reserved.
        </div>
      </div>

      {/* Right Side - Forms */}
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg h-12">
              <TabsTrigger 
                value="login"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all duration-200 font-medium text-gray-600 dark:text-gray-400"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all duration-200 font-medium text-gray-600 dark:text-gray-400"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-5 animate-in fade-in-50 duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Login untuk melanjutkan</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="nama@email.com" 
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
                      Lupa password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      autoComplete="current-password"
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-lg font-medium shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-200 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="mb-5">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Create Account</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Daftar untuk memulai belanja</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="reg-name" 
                      placeholder="Masukkan nama lengkap" 
                      className="pl-11 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="reg-email" 
                      type="email" 
                      placeholder="email@example.com" 
                      className="pl-11 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="reg-phone" 
                      placeholder="08xxxxxxxxxx" 
                      className="pl-11 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                      value={registerTelepon}
                      onChange={(e) => setRegisterTelepon(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-pass" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input 
                        id="reg-pass" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm" className="text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input 
                        id="reg-confirm" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-lg font-medium shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-200 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;
