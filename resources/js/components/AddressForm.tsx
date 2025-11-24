import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Province {
  code: string;
  name: string;
}

interface City {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
}

interface Village {
  code: string;
  name: string;
}

interface AddressFormProps {
  initialData?: {
    label?: string;
    nama_penerima?: string;
    telepon_penerima?: string;
    provinsi?: string;
    kota?: string;
    kecamatan?: string;
    kelurahan?: string;
    kode_pos?: string;
    alamat_lengkap?: string;
    is_default?: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function AddressForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Simpan Alamat",
  isLoading = false,
}: AddressFormProps) {
  const [formData, setFormData] = useState({
    label: initialData?.label || "",
    nama_penerima: initialData?.nama_penerima || "",
    telepon_penerima: initialData?.telepon_penerima || "",
    provinsi: initialData?.provinsi || "",
    kota: initialData?.kota || "",
    kecamatan: initialData?.kecamatan || "",
    kelurahan: initialData?.kelurahan || "",
    kode_pos: initialData?.kode_pos || "",
    alamat_lengkap: initialData?.alamat_lengkap || "",
    is_default: initialData?.is_default || false,
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedCityCode, setSelectedCityCode] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");
  const [selectedVillageCode, setSelectedVillageCode] = useState<string>("");
  
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Load cascading data when editing (initialData exists)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialData || !initialData.provinsi || provinces.length === 0) return;

      // Find province by name
      const province = provinces.find(p => p.name === initialData.provinsi);
      if (province) {
        setSelectedProvinceCode(province.code);
        
        // Load cities for this province
        if (initialData.kota) {
          try {
            const citiesResponse = await axios.get(`/api/wilayah/cities/${province.code}`);
            if (citiesResponse.data?.data) {
              setCities(citiesResponse.data.data);
              
              // Find city by name
              const city = citiesResponse.data.data.find((c: City) => c.name === initialData.kota);
              if (city) {
                setSelectedCityCode(city.code);
                
                // Load districts for this city
                if (initialData.kecamatan) {
                  try {
                    const districtsResponse = await axios.get(`/api/wilayah/districts/${city.code}`);
                    if (districtsResponse.data?.data) {
                      setDistricts(districtsResponse.data.data);
                      
                      // Find district by name
                      const district = districtsResponse.data.data.find((d: District) => d.name === initialData.kecamatan);
                      if (district) {
                        setSelectedDistrictCode(district.code);
                        
                        // Load villages for this district
                        if (initialData.kelurahan) {
                          try {
                            const villagesResponse = await axios.get(`/api/wilayah/villages/${district.code}`);
                            if (villagesResponse.data?.data) {
                              setVillages(villagesResponse.data.data);
                              
                              // Find village by name
                              const village = villagesResponse.data.data.find((v: Village) => v.name === initialData.kelurahan);
                              if (village) {
                                setSelectedVillageCode(village.code);
                              }
                            }
                          } catch (error) {
                            console.error("Failed to load initial villages:", error);
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Failed to load initial districts:", error);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Failed to load initial cities:", error);
          }
        }
      }
    };

    loadInitialData();
  }, [provinces, initialData]);

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await axios.get("/api/wilayah/provinces");
      
      if (response.data?.data) {
        setProvinces(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
      toast.error("Gagal memuat data provinsi");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceCode: string) => {
    setLoadingCities(true);
    setCities([]);
    setDistricts([]);
    setVillages([]);
    setFormData(prev => ({ ...prev, kota: "", kecamatan: "", kelurahan: "" }));

    try {
      const response = await axios.get(`/api/wilayah/cities/${provinceCode}`);
      
      if (response.data?.data) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      toast.error("Gagal memuat data kota/kabupaten");
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchDistricts = async (cityCode: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setVillages([]);
    setFormData(prev => ({ ...prev, kecamatan: "", kelurahan: "" }));

    try {
      const response = await axios.get(`/api/wilayah/districts/${cityCode}`);
      console.log('Districts response:', response.data);
      
      if (response.data?.data) {
        setDistricts(response.data.data);
        if (response.data.data.length === 0) {
          toast.info("Tidak ada data kecamatan untuk kota ini");
        }
      } else if (Array.isArray(response.data)) {
        // Handle if response.data is directly an array
        setDistricts(response.data);
        if (response.data.length === 0) {
          toast.info("Tidak ada data kecamatan untuk kota ini");
        }
      }
    } catch (error) {
      console.error("Failed to fetch districts:", error);
      toast.error("Gagal memuat data kecamatan");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchVillages = async (districtCode: string) => {
    setLoadingVillages(true);
    setVillages([]);
    setFormData(prev => ({ ...prev, kelurahan: "" }));

    try {
      const response = await axios.get(`/api/wilayah/villages/${districtCode}`);
      
      if (response.data?.data) {
        setVillages(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch villages:", error);
      toast.error("Gagal memuat data kelurahan/desa");
    } finally {
      setLoadingVillages(false);
    }
  };

  const handleProvinceChange = (value: string) => {
    const province = provinces.find(p => p.code === value);
    if (province) {
      setSelectedProvinceCode(value);
      setSelectedCityCode("");
      setSelectedDistrictCode("");
      setSelectedVillageCode("");
      setFormData(prev => ({ ...prev, provinsi: province.name, kota: "", kecamatan: "", kelurahan: "" }));
      fetchCities(value);
    }
  };

  const handleCityChange = (value: string) => {
    const city = cities.find(c => c.code === value);
    if (city) {
      setSelectedCityCode(value);
      setSelectedDistrictCode("");
      setSelectedVillageCode("");
      setFormData(prev => ({ ...prev, kota: city.name, kecamatan: "", kelurahan: "" }));
      fetchDistricts(value);
    }
  };

  const handleDistrictChange = (value: string) => {
    const district = districts.find(d => d.code === value);
    if (district) {
      setSelectedDistrictCode(value);
      setSelectedVillageCode("");
      setFormData(prev => ({ ...prev, kecamatan: district.name, kelurahan: "" }));
      fetchVillages(value);
    }
  };

  const handleVillageChange = (value: string) => {
    const village = villages.find(v => v.code === value);
    if (village) {
      setSelectedVillageCode(value);
      setFormData(prev => ({ ...prev, kelurahan: village.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.nama_penerima || !formData.telepon_penerima || 
        !formData.provinsi || !formData.kota || !formData.kecamatan || 
        !formData.alamat_lengkap) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
              Data Wilayah Resmi Indonesia
            </p>
            <p className="text-emerald-700 dark:text-emerald-300">
              Menggunakan data Kepmendagri No 300.2.2-2138 Tahun 2025 dari Wilayah.id
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Label */}
        <div className="md:col-span-2">
          <Label htmlFor="label">Label Alamat (Opsional)</Label>
          <Input
            id="label"
            placeholder="Contoh: Rumah, Kantor, Kos"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          />
        </div>

        {/* Nama Penerima */}
        <div>
          <Label htmlFor="nama_penerima">Nama Penerima <span className="text-red-500">*</span></Label>
          <Input
            id="nama_penerima"
            required
            placeholder="Nama lengkap penerima"
            value={formData.nama_penerima}
            onChange={(e) => setFormData({ ...formData, nama_penerima: e.target.value })}
          />
        </div>

        {/* Nomor Telepon */}
        <div>
          <Label htmlFor="telepon_penerima">Nomor Telepon <span className="text-red-500">*</span></Label>
          <Input
            id="telepon_penerima"
            required
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={formData.telepon_penerima}
            onChange={(e) => setFormData({ ...formData, telepon_penerima: e.target.value })}
          />
        </div>

        {/* Provinsi */}
        <div>
          <Label htmlFor="provinsi">Provinsi <span className="text-red-500">*</span></Label>
          <Select onValueChange={handleProvinceChange} disabled={loadingProvinces} value={selectedProvinceCode}>
            <SelectTrigger id="provinsi">
              <SelectValue placeholder={loadingProvinces ? "Memuat provinsi..." : formData.provinsi || "Pilih Provinsi"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {loadingProvinces ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                  Memuat provinsi...
                </div>
              ) : provinces.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  <MapPin className="h-4 w-4 mx-auto mb-1 opacity-50" />
                  Tidak ada data provinsi
                </div>
              ) : (
                provinces.map((province) => (
                  <SelectItem key={province.code} value={province.code}>
                    {province.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {provinces.length > 0 && !loadingProvinces && (
            <p className="text-xs text-muted-foreground mt-1">
              {provinces.length} provinsi tersedia
            </p>
          )}
        </div>

        {/* Kota/Kabupaten */}
        <div>
          <Label htmlFor="kota">Kota/Kabupaten <span className="text-red-500">*</span></Label>
          <Select 
            onValueChange={handleCityChange} 
            disabled={!selectedProvinceCode || loadingCities}
            value={selectedCityCode}
          >
            <SelectTrigger id="kota">
              <SelectValue 
                placeholder={
                  loadingCities 
                    ? "Memuat kota..." 
                    : !selectedProvinceCode
                    ? "Pilih provinsi dulu"
                    : formData.kota || "Pilih Kota/Kabupaten"
                } 
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {loadingCities ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                  Memuat kota...
                </div>
              ) : cities.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {selectedProvinceCode ? "Tidak ada data kota" : "Pilih provinsi terlebih dahulu"}
                </div>
              ) : (
                cities.map((city) => (
                  <SelectItem key={city.code} value={city.code}>
                    {city.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {cities.length > 0 && !loadingCities && (
            <p className="text-xs text-muted-foreground mt-1">
              {cities.length} kota/kabupaten tersedia
            </p>
          )}
        </div>

        {/* Kecamatan */}
        <div>
          <Label htmlFor="kecamatan">Kecamatan <span className="text-red-500">*</span></Label>
          <Select 
            onValueChange={handleDistrictChange}
            disabled={!selectedCityCode || loadingDistricts}
            value={selectedDistrictCode}
          >
            <SelectTrigger id="kecamatan">
              <SelectValue 
                placeholder={
                  loadingDistricts 
                    ? "Memuat kecamatan..." 
                    : !selectedCityCode
                    ? "Pilih kota dulu"
                    : formData.kecamatan || "Pilih Kecamatan"
                } 
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {loadingDistricts ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                  Memuat kecamatan...
                </div>
              ) : districts.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {selectedCityCode ? "Tidak ada data kecamatan" : "Pilih kota terlebih dahulu"}
                </div>
              ) : (
                districts.map((district) => (
                  <SelectItem key={district.code} value={district.code}>
                    {district.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {districts.length > 0 && !loadingDistricts && (
            <p className="text-xs text-muted-foreground mt-1">
              {districts.length} kecamatan tersedia
            </p>
          )}
        </div>

        {/* Kelurahan/Desa */}
        <div>
          <Label htmlFor="kelurahan">Kelurahan/Desa</Label>
          <Select 
            onValueChange={handleVillageChange}
            disabled={!selectedDistrictCode || loadingVillages}
            value={selectedVillageCode}
          >
            <SelectTrigger id="kelurahan">
              <SelectValue 
                placeholder={
                  loadingVillages 
                    ? "Memuat kelurahan..." 
                    : !selectedDistrictCode
                    ? "Pilih kecamatan dulu"
                    : formData.kelurahan || "Pilih Kelurahan/Desa"
                } 
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {loadingVillages ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                  Memuat kelurahan...
                </div>
              ) : villages.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {selectedDistrictCode ? "Tidak ada data kelurahan" : "Pilih kecamatan terlebih dahulu"}
                </div>
              ) : (
                villages.map((village) => (
                  <SelectItem key={village.code} value={village.code}>
                    {village.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {villages.length > 0 && !loadingVillages && (
            <p className="text-xs text-muted-foreground mt-1">
              {villages.length} kelurahan/desa tersedia
            </p>
          )}
        </div>

        {/* Kode Pos */}
        <div>
          <Label htmlFor="kode_pos">Kode Pos</Label>
          <Input
            id="kode_pos"
            type="number"
            placeholder="Contoh: 12345"
            value={formData.kode_pos}
            onChange={(e) => setFormData({ ...formData, kode_pos: e.target.value })}
          />
        </div>

        {/* Alamat Lengkap */}
        <div className="md:col-span-2">
          <Label htmlFor="alamat_lengkap">Alamat Lengkap <span className="text-red-500">*</span></Label>
          <Textarea
            id="alamat_lengkap"
            required
            placeholder="Jalan, nomor rumah, RT/RW, patokan, dll"
            rows={3}
            value={formData.alamat_lengkap}
            onChange={(e) => setFormData({ ...formData, alamat_lengkap: e.target.value })}
          />
        </div>

        {/* Set as Default */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm">Jadikan alamat utama</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
