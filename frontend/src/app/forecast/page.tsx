"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Loader2,
    AlertTriangle,
    BarChart3,
    Info,
} from "lucide-react"
import { forecastService, type ForecastResponse } from "@/services/forecast"
import ForecastChart from "@/components/ForecastChart"

// Indian states + districts (reuse same pattern as transport page)
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

const STATE_DISTRICTS: Record<string, string[]> = {
    "Kerala": ["Thiruvananthapuram", "Kollam", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"],
    "Karnataka": ["Bangalore", "Mysore", "Hassan", "Mangalore", "Belgaum", "Hubli", "Dharwad", "Gulbarga", "Shimoga", "Davangere", "Bellary", "Raichur", "Tumkur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Thanjavur", "Dindigul", "Kanchipuram", "Cuddalore"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Sangli", "Satara", "Jalgaon", "Ahmednagar", "Latur", "Amravati"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Mehsana", "Bharuch", "Morbi", "Kutch"],
    "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Eluru", "Anantapur"],
    "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Medak", "Rangareddy"],
    "Uttar Pradesh": ["Lucknow", "Agra", "Varanasi", "Kanpur", "Allahabad", "Meerut", "Bareilly", "Gorakhpur", "Jhansi", "Aligarh", "Mathura", "Moradabad"],
}

const COMMODITIES = [
    "Wheat", "Rice", "Tomato", "Potato", "Onion", "Banana", "Coconut",
    "Pepper", "Cardamom", "Rubber", "Ginger", "Turmeric",
]

const DIRECTION_CONFIG = {
    up: {
        label: "Rising",
        icon: TrendingUp,
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    down: {
        label: "Falling",
        icon: TrendingDown,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
    flat: {
        label: "Stable",
        icon: ArrowRight,
        className: "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300",
    },
}

const CONFIDENCE_CONFIG = {
    Green: {
        label: "High Confidence",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    Yellow: {
        label: "Moderate Confidence",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    },
    Red: {
        label: "Low Confidence",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
}

export default function ForecastPage() {
    const [commodity, setCommodity] = useState("")
    const [state, setState] = useState("")
    const [district, setDistrict] = useState("")
    const [horizon, setHorizon] = useState(14)

    const canFetch = commodity && district

    const {
        data: forecast,
        isLoading,
        isError,
        error,
    } = useQuery<ForecastResponse>({
        queryKey: ["forecast", commodity, district, horizon],
        queryFn: () => forecastService.getForecast(commodity, district, horizon),
        enabled: !!canFetch,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    })

    const dirConfig = forecast ? DIRECTION_CONFIG[forecast.direction] : null
    const confConfig = forecast ? CONFIDENCE_CONFIG[forecast.confidence_colour] : null

    return (
        <div className="min-h-screen bg-background p-4 lg:p-8">
            <div className="container mx-auto max-w-5xl">

                {/* ---- Header ---- */}
                <div className="mb-8" id="forecast-header">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                            <BarChart3 className="h-6 w-6 text-violet-500" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Price Forecast
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm lg:text-base max-w-2xl">
                        XGBoost-powered price predictions for agricultural commodities.
                        Select a commodity and district to see the forecast.
                    </p>
                </div>

                {/* ---- Selectors ---- */}
                <div className="flex flex-wrap gap-3 mb-8" id="forecast-selectors">
                    {/* Commodity */}
                    <select
                        id="commodity-select"
                        value={commodity}
                        onChange={(e) => setCommodity(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-w-[180px]"
                    >
                        <option value="">Select Commodity</option>
                        {COMMODITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* State */}
                    <select
                        id="state-select"
                        value={state}
                        onChange={(e) => {
                            setState(e.target.value)
                            setDistrict("")
                        }}
                        className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-w-[180px]"
                    >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    {/* District */}
                    <select
                        id="district-select"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        disabled={!state}
                        className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-w-[180px] disabled:opacity-50"
                    >
                        <option value="">Select District</option>
                        {(STATE_DISTRICTS[state] || []).map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    {/* Horizon */}
                    <select
                        id="horizon-select"
                        value={horizon}
                        onChange={(e) => setHorizon(Number(e.target.value))}
                        className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-w-[120px]"
                    >
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                    </select>
                </div>

                {/* ---- Empty state ---- */}
                {!canFetch && (
                    <div className="flex flex-col items-center justify-center py-20 text-center" id="forecast-empty">
                        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h2 className="text-lg font-medium text-muted-foreground mb-2">
                            Select a commodity and district
                        </h2>
                        <p className="text-sm text-muted-foreground/70 max-w-md">
                            Choose a commodity and district to view the XGBoost price forecast
                            with predicted direction, price range, and confidence level.
                        </p>
                    </div>
                )}

                {/* ---- Loading ---- */}
                {canFetch && isLoading && (
                    <div className="flex flex-col items-center justify-center py-20" id="forecast-loading">
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin mb-4" />
                        <p className="text-sm text-muted-foreground">Generating forecast...</p>
                    </div>
                )}

                {/* ---- Error ---- */}
                {canFetch && isError && (
                    <div className="flex flex-col items-center justify-center py-20 text-center" id="forecast-error">
                        <AlertTriangle className="h-8 w-8 text-red-400 mb-4" />
                        <p className="text-sm text-red-400">
                            Failed to load forecast: {(error as Error)?.message || "Unknown error"}
                        </p>
                    </div>
                )}

                {/* ---- Forecast Result ---- */}
                {canFetch && forecast && (
                    <div className="space-y-6" id="forecast-result">

                        {/* Fallback Banner (UI-05) — show when tier_label is seasonal average fallback */}
                        {forecast.tier_label === "seasonal average fallback" && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" id="fallback-banner">
                                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                        Limited Data Coverage
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                        {forecast.coverage_message ?? "Insufficient price history. Showing seasonal averages."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-3" id="forecast-badges">
                            {/* Direction badge */}
                            {dirConfig && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${dirConfig.className}`}>
                                    <dirConfig.icon className="h-4 w-4" />
                                    {dirConfig.label}
                                </span>
                            )}

                            {/* Confidence badge */}
                            {confConfig && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${confConfig.className}`}>
                                    {confConfig.label}
                                </span>
                            )}

                            {/* Tier badge */}
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                                {forecast.tier_label === "full model" ? "🤖 ML Model" : "📊 Seasonal Average"}
                            </span>

                            {/* Horizon */}
                            <span className="text-sm text-muted-foreground">
                                {forecast.horizon_days}-day forecast
                            </span>
                        </div>

                        {/* Price Range Card */}
                        {forecast.price_mid && (
                            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm" id="price-range-card">
                                <div className="flex items-baseline gap-2 mb-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                        Predicted Price Range
                                    </h3>
                                </div>
                                <div className="flex items-baseline gap-4 flex-wrap">
                                    {forecast.price_low && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Low</p>
                                            <p className="text-lg font-semibold text-muted-foreground">
                                                ₹{forecast.price_low.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Mid</p>
                                        <p className="text-2xl font-bold">
                                            ₹{forecast.price_mid.toFixed(2)}
                                        </p>
                                    </div>
                                    {forecast.price_high && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">High</p>
                                            <p className="text-lg font-semibold text-muted-foreground">
                                                ₹{forecast.price_high.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chart */}
                        {forecast.forecast_points && forecast.forecast_points.length > 0 && (
                            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                                    Forecast Chart
                                </h3>
                                <ForecastChart
                                    forecastPoints={forecast.forecast_points}
                                    confidenceColour={forecast.confidence_colour}
                                    commodity={forecast.commodity}
                                />
                            </div>
                        )}

                        {/* Data freshness note */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-2" id="data-freshness">
                            <Info className="h-3.5 w-3.5 flex-shrink-0" />
                            <p>
                                Data last updated: {forecast.last_data_date}.
                                Forecasts are directional signals, not precise predictions.
                                Actual prices may vary.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
