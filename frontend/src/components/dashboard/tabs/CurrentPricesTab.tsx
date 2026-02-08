"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowUpRight, ArrowDownRight, Search } from "lucide-react"
import { pricesService, MarketPrice } from "@/services/prices"
import { mandisService } from "@/services/mandis"
import { toast } from "sonner"

export function CurrentPricesTab() {
    const [prices, setPrices] = useState<MarketPrice[]>([])
    const [states, setStates] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [statesLoading, setStatesLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [stateFilter, setStateFilter] = useState("all")
    const [displayCount, setDisplayCount] = useState(10)

    // Load states on mount
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const statesList = await mandisService.getStates()
                setStates(statesList.sort())
            } catch (error) {
                console.error("Failed to load states", error)
                // Fallback to hardcoded list
                setStates(["Kerala", "Tamil Nadu", "Karnataka", "Delhi", "Maharashtra"])
            } finally {
                setStatesLoading(false)
            }
        }
        fetchStates()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { prices } = await pricesService.getCurrentPrices({
                commodity: search || undefined,
                state: stateFilter !== "all" ? stateFilter : undefined
            })
            setPrices(prices)
        } catch (error) {
            toast.error("Failed to load prices")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchData()
            setDisplayCount(10) // Reset display count when filters change
        }, 500)
        return () => clearTimeout(timer)
    }, [search, stateFilter])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search commodity..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={stateFilter} onValueChange={setStateFilter} disabled={statesLoading}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All States</SelectItem>
                        {statesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : states.length > 0 ? (
                            states.map((state) => (
                                <SelectItem key={state} value={state}>
                                    {state}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="none" disabled>No states found</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[640px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Commodity</TableHead>
                                <TableHead>Mandi</TableHead>
                                <TableHead className="text-right">Price (₹/kg)</TableHead>
                                <TableHead className="text-right">Change</TableHead>
                                <TableHead className="text-right">Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : prices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No prices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                prices.slice(0, displayCount).map((price, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <Link 
                                                href={`/commodities/${price.commodity_id}`}
                                                className="hover:text-primary hover:underline transition-colors"
                                            >
                                                {price.commodity}
                                            </Link>
                                            <div className="text-xs text-muted-foreground sm:hidden">
                                                {price.state}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {price.mandi_name}
                                            <div className="text-xs text-muted-foreground hidden sm:block">
                                                {price.district}, {price.state}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            ₹{price.price_per_kg.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={`flex items-center justify-end gap-1 ${price.change_percent >= 0 ? "text-green-600" : "text-red-600"
                                                }`}>
                                                {price.change_percent >= 0 ? (
                                                    <ArrowUpRight className="h-4 w-4" />
                                                ) : (
                                                    <ArrowDownRight className="h-4 w-4" />
                                                )}
                                                <span className="font-medium">{Math.abs(price.change_percent)}%</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {price.change_amount > 0 ? "+" : ""}
                                                ₹{price.change_amount.toFixed(2)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {new Date(price.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {!loading && prices.length > displayCount && (
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={() => setDisplayCount(prev => prev + 10)}
                        variant="outline"
                        className="gap-2"
                    >
                        Load More ({prices.length - displayCount} remaining)
                    </Button>
                </div>
            )}
        </div>
    )
}
