import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, MapPin, Trash2, Check, Edit3 } from "lucide-react";
import { toast } from "sonner";
import api, { isSuccess, getData, getErrorMessage } from "@/lib/api";

interface Address {
  id: number;
  label: string;
  nama_penerima: string;
  telepon_penerima: string;
  alamat_lengkap: string;
  kota: string;
  provinsi: string;
  kecamatan: string;
  kelurahan?: string;
  kode_pos: string;
  area_id?: string;
  latitude?: string;
  longitude?: string;
  is_default: boolean;
}

interface Province {
  code: string;
  name: string;
}

interface City {
  code: string;
  province_code: string;
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

interface AddressSelectorProps {
  onSelectAddress: (address: Address | null) => void;
  selectedAddressId?: number;
}

export default function AddressSelector({
  onSelectAddress,
  selectedAddressId,
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(
    selectedAddressId
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  // Form states for new address
  const [formData, setFormData] = useState({
    label: "",
    nama_penerima: "",
    telepon_penerima: "",
    alamat_lengkap: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kelurahan: "",
    kode_pos: "",
    is_default: false,
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [, setSelectedProvinceCode] = useState<string>("");
  const [, setSelectedCityCode] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/api/customer/alamat");
      if (isSuccess(response)) {
        const addressData = getData(response) as Address[];
        setAddresses(addressData);
        
        // Auto-select default address if no selection
        if (!selectedId) {
          const defaultAddr = addressData.find((a: Address) => a.is_default);
          if (defaultAddr) {
            setSelectedId(defaultAddr.id);
            onSelectAddress(defaultAddr);
            
            // Show warning if default address has no area_id
            if (!defaultAddr.area_id) {
              toast.warning(`Alamat "${defaultAddr.label}" tidak memiliki Area ID. Metode pengiriman mungkin tidak tersedia. Silakan perbarui alamat.`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await api.get("/api/wilayah/provinces");
      // Handle new API format: { status_code, message, data }
      const responseData = response.data?.data || response.data;
      const provincesData = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      setProvinces(provincesData);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      toast.error("Gagal memuat data provinsi");
    }
  };

  const fetchCities = async (provinceCode: string) => {
    setLoadingCities(true);
    setCities([]);
    setDistricts([]);
    setVillages([]);
    
    try {
      const response = await api.get(`/api/wilayah/cities/${provinceCode}`);
      // Handle new API format: { status_code, message, data }
      const responseData = response.data?.data || response.data;
      const citiesData = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      setCities(citiesData);
      
      if (citiesData.length === 0) {
        toast.info("Tidak ada data kota untuk provinsi ini");
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Gagal memuat data kota");
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchDistricts = async (cityCode: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setVillages([]);
    
    try {
      const response = await api.get(`/api/wilayah/districts/${cityCode}`);
      // Handle new API format: { status_code, message, data }
      const responseData = response.data?.data || response.data;
      const districtsData = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      setDistricts(districtsData);
      
      if (districtsData.length === 0) {
        toast.info("Tidak ada data kecamatan untuk kota ini");
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      toast.error("Gagal memuat data kecamatan");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchVillages = async (districtCode: string) => {
    setLoadingVillages(true);
    setVillages([]);
    
    try {
      const response = await api.get(`/api/wilayah/villages/${districtCode}`);
      // Handle new API format: { status_code, message, data }
      const responseData = response.data?.data || response.data;
      const villagesData = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      setVillages(villagesData);
    } catch (error) {
      console.error("Error fetching villages:", error);
      toast.error("Gagal memuat data kelurahan/desa");
    } finally {
      setLoadingVillages(false);
    }
  };

  const handleSelectAddress = (addressId: number) => {
    setSelectedId(addressId);
    const address = addresses.find((a) => a.id === addressId);
    
    // Warn user if selected address has no area_id
    if (address && !address.area_id) {
      toast.warning(`Alamat "${address.label}" tidak memiliki Area ID. Metode pengiriman mungkin tidak tersedia. Silakan perbarui alamat.`);
    }
    
    onSelectAddress(address || null);
  };

  const handleProvinceChange = (value: string) => {
    const province = provinces.find((p) => p.code === value);
    setSelectedProvinceCode(value);
    setSelectedCityCode("");
    setSelectedDistrictCode("");
    setFormData({
      ...formData,
      provinsi: province?.name || "",
      kota: "",
      kecamatan: "",
      kelurahan: "",
    });
    setCities([]);
    setDistricts([]);
    setVillages([]);
    if (value) {
      fetchCities(value);
    }
  };

  const handleCityChange = (value: string) => {
    const city = cities.find((c) => c.code === value);
    setSelectedCityCode(value);
    setSelectedDistrictCode("");
    setFormData({
      ...formData,
      kota: city?.name || "",
      kecamatan: "",
      kelurahan: "",
    });
    setDistricts([]);
    setVillages([]);
    if (value) {
      fetchDistricts(value);
    }
  };

  const handleDistrictChange = (value: string) => {
    const district = districts.find((d) => d.code === value);
    setSelectedDistrictCode(value);
    setFormData({
      ...formData,
      kecamatan: district?.name || "",
      kelurahan: "",
    });
    setVillages([]);
    if (value) {
      fetchVillages(value);
    }
  };

  const handleVillageChange = (value: string) => {
    const village = villages.find((v) => v.code === value);
    setFormData({
      ...formData,
      kelurahan: village?.name || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling to parent forms (e.g., checkout form)
    
    // Custom validation
    if (!formData.provinsi || !formData.kota || !formData.kecamatan) {
      toast.error("Silakan lengkapi provinsi, kota, dan kecamatan");
      return;
    }
    
    setIsLoading(true);

    try {
      // Prepare payload with all location data to get area_id from backend
      const payload: any = {
        label: formData.label,
        nama_penerima: formData.nama_penerima,
        telepon_penerima: formData.telepon_penerima,
        alamat_lengkap: formData.alamat_lengkap,
        provinsi: formData.provinsi,
        kota: formData.kota,
        kecamatan: formData.kecamatan || null,
        kelurahan: formData.kelurahan || null,
        kode_pos: formData.kode_pos || null,
        is_default: formData.is_default,
      };
      
      // Backend will automatically fetch area_id from Biteship based on kelurahan/kecamatan + kota
      let response;
      if (editingAddressId) {
        response = await api.put(`/api/customer/alamat/${editingAddressId}`, payload);
      } else {
        response = await api.post("/api/customer/alamat", payload);
      }

      if (isSuccess(response)) {
        toast.success(editingAddressId ? "Alamat berhasil diperbarui" : "Alamat berhasil ditambahkan");
        setIsDialogOpen(false);
        setEditingAddressId(null);
        fetchAddresses();
        
        // Reset form
        setFormData({
          label: "",
          nama_penerima: "",
          telepon_penerima: "",
          alamat_lengkap: "",
          provinsi: "",
          kota: "",
          kecamatan: "",
          kelurahan: "",
          kode_pos: "",
          is_default: false,
        });
        setSelectedProvinceCode("");
        setSelectedCityCode("");
        setSelectedDistrictCode("");
        setCities([]);
        setDistricts([]);
        setVillages([]);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus alamat ini?")) return;

    try {
      const response = await api.delete(`/api/customer/alamat/${id}`);
      if (isSuccess(response)) {
        toast.success("Alamat berhasil dihapus");
        fetchAddresses();
        if (selectedId === id) {
          setSelectedId(undefined);
          onSelectAddress(null);
        }
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await api.post(`/api/customer/alamat/${id}/set-default`);
      if (isSuccess(response)) {
        toast.success("Alamat default berhasil diubah");
        fetchAddresses();
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = async (address: Address) => {
    setEditingAddressId(address.id);
    
    // Populate form with existing data
    setFormData({
      label: address.label,
      nama_penerima: address.nama_penerima,
      telepon_penerima: address.telepon_penerima,
      alamat_lengkap: address.alamat_lengkap,
      provinsi: address.provinsi,
      kota: address.kota,
      kecamatan: address.kecamatan,
      kelurahan: address.kelurahan || "",
      kode_pos: address.kode_pos,
      is_default: address.is_default,
    });
    
    try {
      // Load cascade data properly with await
      const province = provinces.find(p => p.name === address.provinsi);
      if (province) {
        setSelectedProvinceCode(province.code);
        
        // Fetch cities and wait
        const citiesResponse = await api.get(`/api/wilayah/cities/${province.code}`);
        if (citiesResponse.data?.data) {
          const loadedCities = citiesResponse.data.data;
          setCities(loadedCities);
          
          // Find and select city
          const city = loadedCities.find((c: City) => c.name === address.kota);
          if (city) {
            setSelectedCityCode(city.code);
            
            // Fetch districts and wait
            const districtsResponse = await api.get(`/api/wilayah/districts/${city.code}`);
            const districtsData = districtsResponse.data?.data || (Array.isArray(districtsResponse.data) ? districtsResponse.data : []);
            setDistricts(districtsData);
            
            // Find and select district
            const district = districtsData.find((d: District) => d.name === address.kecamatan);
            if (district) {
              setSelectedDistrictCode(district.code);
              
              // Fetch villages if needed
              if (address.kelurahan) {
                const villagesResponse = await api.get(`/api/wilayah/villages/${district.code}`);
                if (villagesResponse.data?.data) {
                  setVillages(villagesResponse.data.data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading address data:", error);
      toast.error("Gagal memuat data wilayah untuk alamat ini");
    }
    
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Pilih Alamat Pengiriman</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAddressId(null);
            setFormData({
              label: "",
              nama_penerima: "",
              telepon_penerima: "",
              alamat_lengkap: "",
              provinsi: "",
              kota: "",
              kecamatan: "",
              kelurahan: "",
              kode_pos: "",
              is_default: false,
            });
            setSelectedProvinceCode("");
            setSelectedCityCode("");
            setSelectedDistrictCode("");
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Alamat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddressId ? "Edit Alamat" : "Tambah Alamat Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="label">Label Alamat *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="Rumah / Kantor / Lainnya"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama_penerima">Nama Penerima *</Label>
                  <Input
                    id="nama_penerima"
                    value={formData.nama_penerima}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_penerima: e.target.value })
                    }
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telepon_penerima">Nomor Telepon *</Label>
                  <Input
                    id="telepon_penerima"
                    value={formData.telepon_penerima}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telepon_penerima: e.target.value,
                      })
                    }
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provinsi">
                    Provinsi <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={provinces.find(p => p.name === formData.provinsi)?.code || ""}
                    onValueChange={handleProvinceChange}
                  >
                    <SelectTrigger id="provinsi">
                      <SelectValue placeholder="Pilih Provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Memuat provinsi...
                        </div>
                      ) : (
                        provinces.map((prov) => (
                          <SelectItem key={prov.code} value={prov.code}>
                            {prov.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {provinces.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {provinces.length} provinsi tersedia
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="kota">
                    Kota/Kabupaten <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={cities.find(c => c.name === formData.kota)?.code || ""}
                    onValueChange={handleCityChange}
                    disabled={!formData.provinsi || loadingCities}
                  >
                    <SelectTrigger id="kota">
                      <SelectValue
                        placeholder={
                          loadingCities
                            ? "Memuat..."
                            : !formData.provinsi
                            ? "Pilih provinsi dulu"
                            : cities.length === 0
                            ? "Tidak ada data kota"
                            : "Pilih Kota/Kabupaten"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCities ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Memuat kota...
                        </div>
                      ) : cities.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {formData.provinsi
                            ? "Tidak ada data kota"
                            : "Pilih provinsi terlebih dahulu"}
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
                  {cities.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {cities.length} kota tersedia
                    </p>
                  )}
                  {formData.provinsi && !loadingCities && cities.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Tidak ada data kota untuk provinsi ini
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kecamatan">
                    Kecamatan <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedDistrictCode}
                    onValueChange={handleDistrictChange}
                    disabled={!formData.kota || loadingDistricts}
                  >
                    <SelectTrigger id="kecamatan">
                      <SelectValue
                        placeholder={
                          loadingDistricts
                            ? "Memuat..."
                            : !formData.kota
                            ? "Pilih kota dulu"
                            : districts.length === 0
                            ? "Tidak ada data kecamatan"
                            : "Pilih Kecamatan"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingDistricts ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Memuat kecamatan...
                        </div>
                      ) : districts.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {formData.kota
                            ? "Tidak ada data kecamatan"
                            : "Pilih kota terlebih dahulu"}
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
                  {districts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {districts.length} kecamatan tersedia
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="kelurahan">Kelurahan/Desa</Label>
                  <Select
                    value={villages.find(v => v.name === formData.kelurahan)?.code || ""}
                    onValueChange={handleVillageChange}
                    disabled={!formData.kecamatan || loadingVillages}
                  >
                    <SelectTrigger id="kelurahan">
                      <SelectValue
                        placeholder={
                          loadingVillages
                            ? "Memuat..."
                            : !formData.kecamatan
                            ? "Pilih kecamatan dulu"
                            : villages.length === 0
                            ? "Tidak ada data kelurahan"
                            : "Pilih Kelurahan/Desa"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingVillages ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Memuat kelurahan...
                        </div>
                      ) : villages.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {formData.kecamatan
                            ? "Tidak ada data kelurahan"
                            : "Pilih kecamatan terlebih dahulu"}
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
                  {villages.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {villages.length} kelurahan tersedia
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="kode_pos">Kode Pos *</Label>
                <Input
                  id="kode_pos"
                  value={formData.kode_pos}
                  onChange={(e) =>
                    setFormData({ ...formData, kode_pos: e.target.value })
                  }
                  placeholder="12345"
                  required
                />
              </div>

              <div>
                <Label htmlFor="alamat_lengkap">Alamat Lengkap *</Label>
                <Textarea
                  id="alamat_lengkap"
                  value={formData.alamat_lengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat_lengkap: e.target.value })
                  }
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan, dll"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Jadikan alamat utama
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Menyimpan..." : "Simpan Alamat"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            Belum ada alamat tersimpan
          </p>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Alamat Pertama
          </Button>
        </Card>
      ) : (
        <RadioGroup
          value={selectedId?.toString()}
          onValueChange={(value) => handleSelectAddress(Number(value))}
          className="space-y-3"
        >
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedId === address.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-gray-300"
              }`}
              onClick={() => handleSelectAddress(address.id)}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={address.id.toString()} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{address.label}</span>
                    {address.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Utama
                      </span>
                    )}
                    {!address.area_id && (
                      <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-300" title="Alamat ini tidak memiliki Area ID. Pengiriman mungkin tidak tersedia.">
                        ⚠️ Area ID Hilang
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{address.nama_penerima}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.telepon_penerima}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {address.alamat_lengkap}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.kota}, {address.provinsi} {address.kode_pos}
                  </p>
                  {!address.area_id && (
                    <p className="text-xs text-amber-600 mt-1">
                      Silakan edit alamat ini untuk memperbarui Area ID
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!address.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(address.id);
                      }}
                      title="Jadikan alamat utama"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(address);
                    }}
                    title="Edit alamat"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(address.id);
                    }}
                    title="Hapus alamat"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
