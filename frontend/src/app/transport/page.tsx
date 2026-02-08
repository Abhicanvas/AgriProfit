"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    Truck,
    TrendingUp,
    Loader2,
    Search,
    Settings
} from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { commoditiesService } from "@/services/commodities"

const COMMODITIES = ["Wheat", "Rice", "Tomato", "Potato", "Onion", "Banana", "Coconut", "Pepper", "Cardamom", "Rubber"]

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

const STATE_TOLL_FACTORS: Record<string, number> = {
    "Uttar Pradesh": 0.86, "Maharashtra": 0.75, "Gujarat": 0.70, "Rajasthan": 0.65,
    "Madhya Pradesh": 0.60, "Karnataka": 0.55, "Andhra Pradesh": 0.55, "Telangana": 0.55,
    "Tamil Nadu": 0.50, "Haryana": 0.70, "Punjab": 0.55, "Bihar": 0.45, "West Bengal": 0.45,
    "Odisha": 0.40, "Jharkhand": 0.40, "Chhattisgarh": 0.35, "Kerala": 0.25, "Goa": 0.30,
    "Uttarakhand": 0.35, "Himachal Pradesh": 0.25, "Assam": 0.30, "Arunachal Pradesh": 0.15,
    "Manipur": 0.15, "Meghalaya": 0.15, "Mizoram": 0.10, "Nagaland": 0.15, "Tripura": 0.15,
    "Sikkim": 0.10,
}

const STATE_DISTRICTS: Record<string, string[]> = {
    "Kerala": ["Thiruvananthapuram", "Kollam", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Thanjavur", "Dindigul", "Krishnagiri"],
    "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru", "Hubli-Dharwad", "Belagavi", "Tumakuru", "Davangere", "Ballari", "Shivamogga", "Kalaburagi", "Hassan"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kadapa", "Tirupati", "Anantapur", "Rajahmundry", "Kakinada", "Eluru", "Ongole"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Medak"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Thane", "Satara", "Sangli", "Ahmednagar", "Jalgaon", "Amravati"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Mehsana", "Bharuch", "Morbi", "Kutch"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Satna", "Rewa", "Ratlam", "Chhindwara", "Dewas", "Khandwa", "Vidisha"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bharatpur", "Alwar", "Sikar", "Pali", "Bhilwara", "Nagaur", "Chittorgarh"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad", "Ghaziabad", "Noida", "Gorakhpur", "Mathura"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Samastipur"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol", "Bardhaman", "Malda", "Kharagpur", "Haldia", "Baharampur", "Raiganj", "Krishnanagar"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Koraput", "Angul"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur", "Kapurthala", "Sangrur"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa"],
    "Goa": ["North Goa", "South Goa"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Chaibasa"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee", "Kashipur", "Rudrapur", "Nainital", "Almora", "Pithoragarh"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Bilaspur", "Hamirpur", "Una", "Kangra", "Palampur"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Along", "Tezu", "Roing", "Changlang"],
    "Manipur": ["Imphal East", "Imphal West", "Thoubal", "Bishnupur", "Churachandpur", "Senapati", "Ukhrul", "Chandel"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Mamit", "Saiha"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Khowai", "Ambassa", "Belonia", "Sabroom"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Singtam", "Jorethang"],
}

const STATE_MANDIS: Record<string, { name: string; base_distance: number; price_factor: number }[]> = {
    "Kerala": [
        { name: "Ernakulam APMC", base_distance: 45, price_factor: 1.12 },
        { name: "Thrissur Mandi", base_distance: 75, price_factor: 1.08 },
        { name: "Kozhikode Market", base_distance: 150, price_factor: 1.15 },
        { name: "Palakkad APMC", base_distance: 120, price_factor: 1.1 },
        { name: "Thiruvananthapuram Mandi", base_distance: 200, price_factor: 1.18 },
    ],
    "Tamil Nadu": [
        { name: "Chennai Koyambedu", base_distance: 100, price_factor: 1.2 },
        { name: "Coimbatore APMC", base_distance: 500, price_factor: 1.15 },
        { name: "Madurai Mandi", base_distance: 450, price_factor: 1.1 },
        { name: "Salem Market", base_distance: 340, price_factor: 1.08 },
        { name: "Trichy APMC", base_distance: 320, price_factor: 1.05 },
    ],
    "Karnataka": [
        { name: "Bangalore APMC (Yeshwanthpur)", base_distance: 80, price_factor: 1.2 },
        { name: "Mysuru Mandi", base_distance: 150, price_factor: 1.12 },
        { name: "Hubli-Dharwad Market", base_distance: 400, price_factor: 1.05 },
        { name: "Mangaluru APMC", base_distance: 350, price_factor: 1.1 },
        { name: "Belgaum Mandi", base_distance: 500, price_factor: 1.02 },
    ],
    "Maharashtra": [
        { name: "Mumbai APMC (Vashi)", base_distance: 150, price_factor: 1.22 },
        { name: "Pune Mandi", base_distance: 100, price_factor: 1.18 },
        { name: "Nagpur APMC", base_distance: 280, price_factor: 1.1 },
        { name: "Nashik Market", base_distance: 180, price_factor: 1.12 },
        { name: "Aurangabad Mandi", base_distance: 230, price_factor: 1.08 },
    ],
    "Gujarat": [
        { name: "Ahmedabad APMC", base_distance: 80, price_factor: 1.18 },
        { name: "Surat Mandi", base_distance: 260, price_factor: 1.15 },
        { name: "Rajkot Market", base_distance: 200, price_factor: 1.1 },
        { name: "Vadodara APMC", base_distance: 110, price_factor: 1.12 },
        { name: "Jamnagar Mandi", base_distance: 280, price_factor: 1.05 },
    ],
}

interface TransportResult {
    mandi_name: string
    distance_km: number
    price_per_kg: number
    costs: {
        freight: number
        toll: number
        loading: number
        unloading: number
        additional: number
        total: number
    }
    net_profit: number
    vehicle_type: string
    arrival_time: string
    trips: number
}

export default function TransportPage() {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<TransportResult[] | null>(null)
    const [commoditySearch, setCommoditySearch] = useState("")
    const [isCommodityDropdownOpen, setIsCommodityDropdownOpen] = useState(false)
    const [showCostSettings, setShowCostSettings] = useState(false)

    const [form, setForm] = useState({
        commodity: "",
        quantity: "",
        unit: "kg",
        source_state: "Kerala",
        source_district: ""
    })

    const [costSettings, setCostSettings] = useState({
        freightRates: {
            tataAce: 15, miniTruck: 20, lcv: 28, truck: 25, tenWheeler: 32, multiAxle: 55
        },
        loadingPerQuintal: 3, loadingPerTrip: 100,
        unloadingPerQuintal: 2.5, unloadingPerTrip: 80,
        weighbridge: 80, parking: 40, misc: 50,
        tollPerPlaza: { light: 100, medium: 200, heavy: 350 },
        tollPlazaSpacing: 60,
    })

    const { data: allCommodities } = useQuery({
        queryKey: ["transport-commodities"],
        queryFn: () => commoditiesService.getAll({ limit: 500 }),
        staleTime: 300000,
    })

    const commodityNames = useMemo(() => allCommodities?.map((c: any) => c.name) || COMMODITIES, [allCommodities])
    const filteredCommodities = useMemo(() => {
        if (!commoditySearch) return commodityNames
        return commodityNames.filter((c: string) => c.toLowerCase().includes(commoditySearch.toLowerCase()))
    }, [commodityNames, commoditySearch])

    const currentDistricts = STATE_DISTRICTS[form.source_state] || []

    const getStateMandis = () => {
        return STATE_MANDIS[form.source_state] || STATE_MANDIS["Kerala"] || [
            { name: `${form.source_state} Central Mandi`, base_distance: 50, price_factor: 1.0 },
            { name: `${form.source_state} District Market`, base_distance: 100, price_factor: 1.05 },
            { name: `${form.source_state} APMC`, base_distance: 150, price_factor: 1.1 },
        ]
    }

    const handleCalculate = async () => {
        if (!form.commodity || !form.quantity || !form.source_district) {
            toast.error("Please fill all required fields")
            return
        }

        setLoading(true)
        const qty = parseFloat(form.quantity) * (form.unit === "ton" ? 1000 : form.unit === "quintal" ? 100 : 1)
        const basePrice = 45
        const stateMandis = getStateMandis()
        const districtIndex = currentDistricts.indexOf(form.source_district)
        const distanceVariance = districtIndex >= 0 ? (districtIndex * 15) : 0

        setTimeout(() => {
            const results = stateMandis.map((mandi) => {
                const distance = Math.max(20, mandi.base_distance + distanceVariance + Math.floor(Math.random() * 30 - 15))
                const pricePerKg = basePrice * mandi.price_factor + (Math.random() * 5)
                const tons = qty / 1000
                const quintals = qty / 100

                let vehicleType = "", vehicleCapacity = 0, freightRatePerKm = 0
                let tollRateCategory: 'light' | 'medium' | 'heavy' = 'light'

                if (tons <= 0.75) {
                    vehicleType = "Tata Ace (750kg)"; vehicleCapacity = 0.75
                    freightRatePerKm = costSettings.freightRates.tataAce; tollRateCategory = 'light'
                } else if (tons <= 2) {
                    vehicleType = "Mini Truck (2T)"; vehicleCapacity = 2
                    freightRatePerKm = costSettings.freightRates.miniTruck; tollRateCategory = 'light'
                } else if (tons <= 7) {
                    vehicleType = "LCV (7T)"; vehicleCapacity = 7
                    freightRatePerKm = costSettings.freightRates.lcv; tollRateCategory = 'medium'
                } else if (tons <= 12) {
                    vehicleType = "Truck (12T)"; vehicleCapacity = 12
                    freightRatePerKm = costSettings.freightRates.truck; tollRateCategory = 'medium'
                } else if (tons <= 20) {
                    vehicleType = "10-Wheeler (20T)"; vehicleCapacity = 20
                    freightRatePerKm = costSettings.freightRates.tenWheeler; tollRateCategory = 'heavy'
                } else {
                    vehicleType = "Multi-Axle (40T)"; vehicleCapacity = 40
                    freightRatePerKm = costSettings.freightRates.multiAxle; tollRateCategory = 'heavy'
                }

                const tripsRequired = Math.ceil(tons / vehicleCapacity)
                const baseFreightCost = Math.round(distance * freightRatePerKm * tripsRequired)
                const stateTollFactor = STATE_TOLL_FACTORS[form.source_state] || 0.5
                const estimatedPlazas = Math.floor((distance / costSettings.tollPlazaSpacing) * stateTollFactor)
                const tollCost = Math.round(estimatedPlazas * costSettings.tollPerPlaza[tollRateCategory] * tripsRequired)
                const loadingCost = Math.round(quintals * costSettings.loadingPerQuintal + costSettings.loadingPerTrip * tripsRequired)
                const unloadingCost = Math.round(quintals * costSettings.unloadingPerQuintal + costSettings.unloadingPerTrip * tripsRequired)
                const additionalCost = (costSettings.weighbridge * 2 + costSettings.parking + costSettings.misc) * tripsRequired
                const totalCosts = baseFreightCost + tollCost + loadingCost + unloadingCost + additionalCost
                const revenue = qty * pricePerKg
                const netProfit = Math.round(revenue - totalCosts)
                const minHours = Math.ceil(distance / 50), maxHours = Math.ceil(distance / 35)
                const arrivalTime = minHours === maxHours ? `~${minHours} hr${minHours > 1 ? 's' : ''}` : `${minHours}-${maxHours} hrs`

                return {
                    mandi_name: mandi.name, distance_km: distance, price_per_kg: pricePerKg,
                    costs: { freight: baseFreightCost, toll: tollCost, loading: loadingCost, unloading: unloadingCost, additional: additionalCost, total: totalCosts },
                    net_profit: netProfit, vehicle_type: vehicleType + (tripsRequired > 1 ? ` x${tripsRequired}` : ''),
                    arrival_time: arrivalTime, trips: tripsRequired,
                }
            })

            setResults(results.sort((a, b) => b.net_profit - a.net_profit))
            setLoading(false)
        }, 1000)
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Truck className="h-8 w-8 text-primary" />
                            Transport Cost Calculator
                        </h1>
                        <p className="text-muted-foreground">
                            Calculate transport costs and find the most profitable mandi for your produce
                        </p>
                    </div>

                    {/* Input Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-orange-600" />
                                Transport Cost Calculator
                            </CardTitle>
                            <CardDescription>Calculate transport costs and find the most profitable mandi for your produce</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Searchable Commodity */}
                                <div className="relative">
                                    <Label>Commodity *</Label>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search commodity..."
                                            value={form.commodity || commoditySearch}
                                            onChange={(e) => {
                                                setCommoditySearch(e.target.value)
                                                setForm({ ...form, commodity: "" })
                                            }}
                                            onFocus={() => setIsCommodityDropdownOpen(true)}
                                            className="pl-10"
                                        />
                                    </div>
                                    {isCommodityDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsCommodityDropdownOpen(false)} />
                                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-52 overflow-y-auto">
                                                {filteredCommodities.length === 0 ? (
                                                    <div className="px-3 py-2 text-sm text-muted-foreground">No commodities found</div>
                                                ) : (
                                                    filteredCommodities.map((c: string) => (
                                                        <div
                                                            key={c}
                                                            className={`relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${form.commodity === c ? "bg-accent text-accent-foreground font-medium" : ""}`}
                                                            onClick={() => {
                                                                setForm({ ...form, commodity: c })
                                                                setCommoditySearch("")
                                                                setIsCommodityDropdownOpen(false)
                                                            }}
                                                        >
                                                            {c}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div>
                                    <Label>Quantity *</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={form.quantity}
                                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                        />
                                        <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="quintal">Quintal</SelectItem>
                                                <SelectItem value="ton">Ton</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* State */}
                                <div>
                                    <Label>State</Label>
                                    <Select value={form.source_state} onValueChange={(v) => setForm({ ...form, source_state: v, source_district: "" })}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* District */}
                                <div>
                                    <Label>District *</Label>
                                    <Select value={form.source_district} onValueChange={(v) => setForm({ ...form, source_district: v })}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
                                        <SelectContent>
                                            {currentDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Calculate Button */}
                                <div>
                                    <Label>&nbsp;</Label>
                                    <Button onClick={handleCalculate} disabled={loading} className="w-full mt-1 bg-orange-600 hover:bg-orange-700">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                                        Calculate
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    {results && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Transport Comparison Results</span>
                                    <Badge variant="outline">{form.commodity} - {form.quantity} {form.unit}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mandi</TableHead>
                                                <TableHead className="text-right">Distance</TableHead>
                                                <TableHead className="text-right">Price/kg</TableHead>
                                                <TableHead className="text-right">Transport Cost</TableHead>
                                                <TableHead>Vehicle</TableHead>
                                                <TableHead>Est. Time</TableHead>
                                                <TableHead className="text-right">Net Profit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((r, i) => (
                                                <TableRow key={i} className={i === 0 ? "bg-green-50" : ""}>
                                                    <TableCell className="font-medium">
                                                        {r.mandi_name}
                                                        {i === 0 && <Badge className="ml-2 bg-green-600">Best Option</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-right">{r.distance_km} km</TableCell>
                                                    <TableCell className="text-right">₹{r.price_per_kg.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-red-600">₹{r.costs.total.toLocaleString()}</TableCell>
                                                    <TableCell><Badge variant="outline">{r.vehicle_type}</Badge></TableCell>
                                                    <TableCell className="text-muted-foreground">{r.arrival_time}</TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600">₹{r.net_profit.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Cost Breakdown */}
                                {results.length > 0 && (
                                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" /> Cost Breakdown (Best Option: {results[0].mandi_name})
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="space-y-1"><p className="text-muted-foreground">Freight Cost</p><p className="font-medium">₹{results[0].costs.freight.toLocaleString()}</p></div>
                                            <div className="space-y-1"><p className="text-muted-foreground">Toll Charges</p><p className="font-medium">₹{results[0].costs.toll.toLocaleString()}</p></div>
                                            <div className="space-y-1"><p className="text-muted-foreground">Loading (Hamali)</p><p className="font-medium">₹{results[0].costs.loading.toLocaleString()}</p></div>
                                            <div className="space-y-1"><p className="text-muted-foreground">Unloading</p><p className="font-medium">₹{results[0].costs.unloading.toLocaleString()}</p></div>
                                            <div className="space-y-1"><p className="text-muted-foreground">Additional Charges</p><p className="font-medium">₹{results[0].costs.additional.toLocaleString()}</p><p className="text-xs text-muted-foreground">(Weighbridge, Parking, Docs)</p></div>
                                            <div className="space-y-1 col-span-2 md:col-span-3 border-t pt-2 mt-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold">Total Transport Cost</p>
                                                    <p className="font-bold text-red-600 text-lg">₹{results[0].costs.total.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Customizable Cost Settings */}
                    <Card>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowCostSettings(!showCostSettings)}>
                            <CardTitle className="flex items-center justify-between text-base">
                                <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Customize Cost Parameters</span>
                                <Badge variant="outline" className="font-normal">{showCostSettings ? "Hide" : "Show"} Settings</Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Adjust freight rates, toll charges, and labor costs based on your local rates
                            </p>
                        </CardHeader>

                        {showCostSettings && (
                            <CardContent className="border-t">
                                <div className="space-y-6">
                                    {/* Freight Rates */}
                                    <div>
                                        <h4 className="font-semibold mb-3 text-sm">Freight Rates (₹ per km)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {Object.entries(costSettings.freightRates).map(([key, value]) => (
                                                <div key={key}>
                                                    <Label className="text-xs">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                                                    <Input
                                                        type="number"
                                                        value={value}
                                                        onChange={(e) => setCostSettings({ ...costSettings, freightRates: { ...costSettings.freightRates, [key]: parseFloat(e.target.value) || 0 } })}
                                                        className="mt-1 h-8"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Toll Charges */}
                                    <div>
                                        <h4 className="font-semibold mb-3 text-sm">Toll Charges (₹ per plaza)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs">Light Vehicle (Tata Ace, Mini Truck)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.tollPerPlaza.light}
                                                    onChange={(e) => setCostSettings({ ...costSettings, tollPerPlaza: { ...costSettings.tollPerPlaza, light: parseFloat(e.target.value) || 0 } })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Medium Vehicle (LCV, Truck)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.tollPerPlaza.medium}
                                                    onChange={(e) => setCostSettings({ ...costSettings, tollPerPlaza: { ...costSettings.tollPerPlaza, medium: parseFloat(e.target.value) || 0 } })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Heavy Vehicle (10-Wheeler, Multi-Axle)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.tollPerPlaza.heavy}
                                                    onChange={(e) => setCostSettings({ ...costSettings, tollPerPlaza: { ...costSettings.tollPerPlaza, heavy: parseFloat(e.target.value) || 0 } })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Toll Plaza Spacing (km)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.tollPlazaSpacing}
                                                    onChange={(e) => setCostSettings({ ...costSettings, tollPlazaSpacing: parseFloat(e.target.value) || 60 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Labor Costs */}
                                    <div>
                                        <h4 className="font-semibold mb-3 text-sm">Labor Costs (Hamali)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <Label className="text-xs">Loading (₹ per quintal)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.loadingPerQuintal}
                                                    onChange={(e) => setCostSettings({ ...costSettings, loadingPerQuintal: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Loading (₹ per trip)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.loadingPerTrip}
                                                    onChange={(e) => setCostSettings({ ...costSettings, loadingPerTrip: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Unloading (₹ per quintal)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.unloadingPerQuintal}
                                                    onChange={(e) => setCostSettings({ ...costSettings, unloadingPerQuintal: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Unloading (₹ per trip)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.unloadingPerTrip}
                                                    onChange={(e) => setCostSettings({ ...costSettings, unloadingPerTrip: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Charges */}
                                    <div>
                                        <h4 className="font-semibold mb-3 text-sm">Additional Charges (₹ per trip)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs">Weighbridge Fee</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.weighbridge}
                                                    onChange={(e) => setCostSettings({ ...costSettings, weighbridge: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Parking Charges</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.parking}
                                                    onChange={(e) => setCostSettings({ ...costSettings, parking: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Miscellaneous (Documentation, etc.)</Label>
                                                <Input
                                                    type="number"
                                                    value={costSettings.misc}
                                                    onChange={(e) => setCostSettings({ ...costSettings, misc: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 h-8"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reset Button */}
                                    <div className="flex justify-end pt-2 border-t">
                                        <Button variant="outline" size="sm" onClick={() => setCostSettings({
                                            freightRates: { tataAce: 15, miniTruck: 20, lcv: 28, truck: 25, tenWheeler: 32, multiAxle: 55 },
                                            loadingPerQuintal: 3, loadingPerTrip: 100, unloadingPerQuintal: 2.5, unloadingPerTrip: 80,
                                            weighbridge: 80, parking: 40, misc: 50,
                                            tollPerPlaza: { light: 100, medium: 200, heavy: 350 },
                                            tollPlazaSpacing: 60,
                                        })}>Reset to Default Rates</Button>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
