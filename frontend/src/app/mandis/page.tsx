"use client"

import { useState, useEffect, useMemo } from 'react'
import {
    Search,
    Loader2,
    Store,
    MapPin,
    Building2,
    Grid3X3,
    List,
    ChevronRight,
    Navigation
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mandisService } from '@/services/mandis'
import { Mandi } from '@/types'

// District colors for visual distinction
const districtColors: { [key: string]: string } = {
    'Thiruvananthapuram': 'bg-blue-100 text-blue-800',
    'Ernakulam': 'bg-green-100 text-green-800',
    'Kozhikode': 'bg-purple-100 text-purple-800',
    'Thrissur': 'bg-orange-100 text-orange-800',
    'Palakkad': 'bg-pink-100 text-pink-800',
    'Kannur': 'bg-yellow-100 text-yellow-800',
    'Kollam': 'bg-indigo-100 text-indigo-800',
    'Alappuzha': 'bg-cyan-100 text-cyan-800',
    'Kottayam': 'bg-teal-100 text-teal-800',
    'Idukki': 'bg-emerald-100 text-emerald-800',
    'Wayanad': 'bg-lime-100 text-lime-800',
    'Malappuram': 'bg-amber-100 text-amber-800',
}

function getDistrictColor(district: string): string {
    return districtColors[district] || 'bg-gray-100 text-gray-800'
}

export default function MandisPage() {
    const [mandis, setMandis] = useState<Mandi[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Fetch mandis on mount
    useEffect(() => {
        console.log('[MandisPage] useEffect triggered, fetching mandis...')

        async function fetchMandis() {
            console.log('[MandisPage] fetchMandis starting...')
            try {
                setLoading(true)
                setError(null)
                console.log('[MandisPage] Calling mandisService.getAll()...')
                const data = await mandisService.getAll()
                console.log('[MandisPage] Received data:', data?.length || 0, 'items')
                setMandis(data)
            } catch (err: any) {
                console.error('[MandisPage] Failed to fetch mandis:', err)
                setError('Failed to load mandis. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchMandis()
    }, [])

    // Get unique districts from mandis
    const districts = useMemo(() => {
        const dists = new Set(mandis.map(m => m.district))
        return Array.from(dists).sort()
    }, [mandis])

    // Filter mandis based on search and district
    const filteredMandis = useMemo(() => {
        return mandis.filter(mandi => {
            const matchesSearch = searchQuery === '' ||
                mandi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mandi.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (mandi.address && mandi.address.toLowerCase().includes(searchQuery.toLowerCase()))

            const matchesDistrict = !selectedDistrict || mandi.district === selectedDistrict

            return matchesSearch && matchesDistrict
        })
    }, [mandis, searchQuery, selectedDistrict])

    // Handle mandi click
    const handleMandiClick = (mandi: Mandi) => {
        console.log('Mandi clicked:', mandi)
        // TODO: Navigate to mandi detail page
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                                <Store className="h-7 w-7 text-primary" />
                                Mandis
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Agricultural markets across Kerala
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                                {filteredMandis.length} of {mandis.length} markets
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
                                placeholder="Search mandis by name, district..."
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

                    {/* District Filters */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            variant={selectedDistrict === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedDistrict(null)}
                            className="rounded-full"
                        >
                            All Districts
                        </Button>
                        {districts.map(district => (
                            <Button
                                key={district}
                                variant={selectedDistrict === district ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedDistrict(district)}
                                className="rounded-full"
                            >
                                {district}
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
                        <p className="text-muted-foreground">Loading mandis...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-destructive/10 text-destructive rounded-lg p-6 text-center max-w-md">
                            <Store className="h-10 w-10 mx-auto mb-4" />
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
                {!loading && !error && filteredMandis.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-muted rounded-lg p-8 text-center max-w-md">
                            <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                            <p className="font-medium text-foreground">No mandis found</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : 'No mandis in this district'}
                            </p>
                            {(searchQuery || selectedDistrict) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSelectedDistrict(null)
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {!loading && !error && filteredMandis.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {filteredMandis.map((mandi) => (
                            <Card
                                key={mandi.id}
                                className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden"
                                onClick={() => handleMandiClick(mandi)}
                            >
                                <CardContent className="p-0">
                                    {/* Icon Section */}
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                                        <Store className="h-12 w-12 mx-auto text-primary" />
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {mandi.name}
                                                </h3>
                                                {mandi.market_code && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Code: {mandi.market_code}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <Badge className={`text-xs ${getDistrictColor(mandi.district)}`}>
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {mandi.district}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {mandi.state}
                                            </Badge>
                                        </div>

                                        {mandi.address && (
                                            <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                                                {mandi.address}
                                            </p>
                                        )}

                                        {(mandi.latitude && mandi.longitude) && (
                                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Navigation className="h-3 w-3" />
                                                <span>{mandi.latitude.toFixed(4)}, {mandi.longitude.toFixed(4)}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* List View */}
                {!loading && !error && filteredMandis.length > 0 && viewMode === 'list' && (
                    <div className="space-y-2">
                        {filteredMandis.map((mandi) => (
                            <Card
                                key={mandi.id}
                                className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200"
                                onClick={() => handleMandiClick(mandi)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                                            <Store className="h-6 w-6 text-primary" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {mandi.name}
                                                </h3>
                                                {mandi.market_code && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {mandi.market_code}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <Badge className={`text-xs ${getDistrictColor(mandi.district)}`}>
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {mandi.district}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {mandi.state}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        {mandi.address && (
                                            <div className="hidden md:block text-right shrink-0 max-w-xs">
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {mandi.address}
                                                </p>
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
