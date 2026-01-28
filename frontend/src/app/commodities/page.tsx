"use client"

// Debug: Log when this module loads
console.log('[CommoditiesPage] Module loading...')

import { useState, useEffect, useMemo } from 'react'
import {
    Search,
    Loader2,
    TrendingUp,
    TrendingDown,
    Package,
    Leaf,
    Filter,
    Grid3X3,
    List,
    ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { commoditiesService } from '@/services/commodities'
import { Commodity } from '@/types'

// Icon mapping for commodity categories
const categoryIcons: { [key: string]: string } = {
    'Grains': '🌾',
    'Vegetables': '🥬',
    'Fruits': '🍎',
    'Spices': '🌶️',
    'Cash Crops': '🌿',
    'Uncategorized': '📦',
}

// Icon mapping for specific commodities
const commodityIcons: { [key: string]: string } = {
    'rice': '🌾',
    'wheat': '🌾',
    'tomato': '🍅',
    'onion': '🧅',
    'potato': '🥔',
    'banana': '🍌',
    'coconut': '🥥',
    'cardamom': '🌿',
    'pepper': '🌶️',
    'rubber': '🌳',
}

function getCommodityIcon(name: string, category: string): string {
    return commodityIcons[name.toLowerCase()] || categoryIcons[category] || '🌱'
}

export default function CommoditiesPage() {
    console.log('[CommoditiesPage] Component rendering...')

    const [commodities, setCommodities] = useState<Commodity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Fetch commodities on mount
    useEffect(() => {
        console.log('[CommoditiesPage] useEffect triggered, fetching commodities...')
        console.log('[CommoditiesPage] API URL from env:', process.env.NEXT_PUBLIC_API_URL)

        // Direct fetch test
        console.log('[CommoditiesPage] Testing direct fetch to http://localhost:8000/commodities...')
        fetch('http://localhost:8000/commodities')
            .then(res => {
                console.log('[CommoditiesPage] Direct fetch response status:', res.status)
                return res.json()
            })
            .then(data => {
                console.log('[CommoditiesPage] Direct fetch data:', data?.length || 'array', 'items')
            })
            .catch(err => {
                console.error('[CommoditiesPage] Direct fetch error:', err)
            })

        async function fetchCommodities() {
            console.log('[CommoditiesPage] fetchCommodities starting...')
            try {
                setLoading(true)
                setError(null)
                console.log('[CommoditiesPage] Calling commoditiesService.getAll()...')
                const data = await commoditiesService.getAll()
                console.log('[CommoditiesPage] Received data:', data?.length || 0, 'items')
                setCommodities(data)
            } catch (err: any) {
                console.error('[CommoditiesPage] Failed to fetch commodities:', err)
                console.error('[CommoditiesPage] Error details:', err?.message, err?.response?.status)
                setError('Failed to load commodities. Please try again.')
            } finally {
                console.log('[CommoditiesPage] Fetch complete, setting loading to false')
                setLoading(false)
            }
        }

        fetchCommodities()
    }, [])

    // Get unique categories from commodities
    const categories = useMemo(() => {
        const cats = new Set(commodities.map(c => c.category))
        return Array.from(cats).sort()
    }, [commodities])

    // Filter commodities based on search and category
    const filteredCommodities = useMemo(() => {
        return commodities.filter(commodity => {
            const matchesSearch = searchQuery === '' ||
                commodity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (commodity.name_local && commodity.name_local.toLowerCase().includes(searchQuery.toLowerCase()))

            const matchesCategory = !selectedCategory || commodity.category === selectedCategory

            return matchesSearch && matchesCategory
        })
    }, [commodities, searchQuery, selectedCategory])

    // Handle commodity click
    const handleCommodityClick = (commodity: Commodity) => {
        console.log('Commodity clicked:', commodity)
        // TODO: Navigate to commodity detail page
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                                <Leaf className="h-7 w-7 text-primary" />
                                Commodities
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Browse agricultural commodities across Kerala
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                                {filteredCommodities.length} of {commodities.length} items
                            </Badge>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search commodities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-8 w-8 p-0"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-8 w-8 p-0"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            variant={selectedCategory === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                            className="rounded-full"
                        >
                            All
                        </Button>
                        {categories.map(category => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                                className="rounded-full"
                            >
                                {categoryIcons[category] || '📦'} {category}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading commodities...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-destructive/10 text-destructive rounded-lg p-6 text-center max-w-md">
                            <Package className="h-10 w-10 mx-auto mb-4" />
                            <p className="font-medium">{error}</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredCommodities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-muted rounded-lg p-8 text-center max-w-md">
                            <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                            <p className="font-medium text-foreground">No commodities found</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : 'No commodities in this category'}
                            </p>
                            {(searchQuery || selectedCategory) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSelectedCategory(null)
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {!loading && !error && filteredCommodities.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {filteredCommodities.map((commodity) => (
                            <Card
                                key={commodity.id}
                                className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden"
                                onClick={() => handleCommodityClick(commodity)}
                            >
                                <CardContent className="p-0">
                                    {/* Icon Section */}
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                                        <span className="text-5xl">
                                            {getCommodityIcon(commodity.name, commodity.category)}
                                        </span>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {commodity.name}
                                                </h3>
                                                {commodity.name_local && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {commodity.name_local}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="secondary" className="shrink-0 text-xs">
                                                {commodity.unit}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                {commodity.category}
                                            </span>

                                            {commodity.latest_price && (
                                                <div className="text-right">
                                                    <p className="font-semibold text-sm">
                                                        ₹{commodity.latest_price.toLocaleString()}
                                                    </p>
                                                    {commodity.price_change !== undefined && (
                                                        <p className={`text-xs flex items-center justify-end gap-0.5 ${
                                                            commodity.price_change >= 0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }`}>
                                                            {commodity.price_change >= 0 ? (
                                                                <TrendingUp className="h-3 w-3" />
                                                            ) : (
                                                                <TrendingDown className="h-3 w-3" />
                                                            )}
                                                            {commodity.price_change >= 0 ? '+' : ''}
                                                            {commodity.price_change.toFixed(1)}%
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {commodity.mandi && (
                                            <p className="text-xs text-muted-foreground mt-2 truncate">
                                                📍 {commodity.mandi}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* List View */}
                {!loading && !error && filteredCommodities.length > 0 && viewMode === 'list' && (
                    <div className="space-y-2">
                        {filteredCommodities.map((commodity) => (
                            <Card
                                key={commodity.id}
                                className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200"
                                onClick={() => handleCommodityClick(commodity)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                                            <span className="text-2xl">
                                                {getCommodityIcon(commodity.name, commodity.category)}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {commodity.name}
                                                </h3>
                                                <Badge variant="secondary" className="text-xs">
                                                    {commodity.unit}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {commodity.category}
                                                </span>
                                                {commodity.mandi && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            📍 {commodity.mandi}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        {commodity.latest_price && (
                                            <div className="text-right shrink-0">
                                                <p className="font-semibold">
                                                    ₹{commodity.latest_price.toLocaleString()}
                                                </p>
                                                {commodity.price_change !== undefined && (
                                                    <p className={`text-xs flex items-center justify-end gap-0.5 ${
                                                        commodity.price_change >= 0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }`}>
                                                        {commodity.price_change >= 0 ? (
                                                            <TrendingUp className="h-3 w-3" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3" />
                                                        )}
                                                        {commodity.price_change >= 0 ? '+' : ''}
                                                        {commodity.price_change.toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Arrow */}
                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
