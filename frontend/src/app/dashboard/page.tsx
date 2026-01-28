"use client"

import React, { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  MapPin,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Mail,
  ArrowUpRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  Wheat,
  Store,
  MessageSquare,
  IndianRupee,
  Activity,
  Leaf,
  Menu,
  X,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { analyticsService, DashboardData, MarketCoverage } from "@/services/analytics"
import { commoditiesService, CommodityWithPrice } from "@/services/commodities"
import { notificationsService, Activity as ActivityType } from "@/services/notifications"

// TypeScript Interfaces
interface StatCard {
  value: string
  label: string
  trend: string
  isHighlighted?: boolean
  icon: React.ReactNode
}

interface Commodity {
  id: string
  name: string
  price: number
  change: number
  mandi: string
  icon: string
}

interface ActivityItem {
  id: string
  type: "price" | "post" | "forecast"
  title: string
  timestamp: string
  detail?: string
}

interface ChartData {
  day: string
  value: number
}

// Default/fallback data
const defaultChartData: ChartData[] = [
  { day: "S", value: 2800 },
  { day: "M", value: 3200 },
  { day: "T", value: 3500 },
  { day: "W", value: 3100 },
  { day: "T", value: 3800 },
  { day: "F", value: 3400 },
  { day: "S", value: 3600 },
]

const quickActions = [
  {
    icon: <Wheat className="h-6 w-6" />,
    title: "View Commodities",
    description: "Browse all products",
  },
  {
    icon: <IndianRupee className="h-6 w-6" />,
    title: "Check Prices",
    description: "Latest market prices",
  },
  {
    icon: <Store className="h-6 w-6" />,
    title: "Browse Mandis",
    description: "Explore markets",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Community Posts",
    description: "Join discussions",
  },
]

// Navigation Items
const menuItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", active: true, badge: null },
  { icon: <ShoppingCart className="h-5 w-5" />, label: "Commodities", active: false, badge: "12+" },
  { icon: <MapPin className="h-5 w-5" />, label: "Mandis", active: false, badge: null },
  { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", active: false, badge: null },
  { icon: <Users className="h-5 w-5" />, label: "Community", active: false, badge: null },
]

const generalItems = [
  { icon: <Settings className="h-5 w-5" />, label: "Settings" },
  { icon: <HelpCircle className="h-5 w-5" />, label: "Help" },
  { icon: <LogOut className="h-5 w-5" />, label: "Logout" },
]

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [marketCoverage, setMarketCoverage] = useState<MarketCoverage>({ active: 85, pending: 10, inactive: 5 })
  const [chartData, setChartData] = useState<ChartData[]>(defaultChartData)

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel
        const [dashboard, commoditiesData, activitiesData] = await Promise.all([
          analyticsService.getDashboard().catch(() => null),
          commoditiesService.getTopCommodities(5).catch(() => []),
          notificationsService.getRecentActivity(5).catch(() => []),
        ])

        if (dashboard) {
          setDashboardData(dashboard)
          setMarketCoverage(analyticsService.getMarketCoverage(dashboard.market_summary))

          // Generate chart data from price records count
          const baseValue = dashboard.market_summary.total_price_records / 7
          setChartData([
            { day: "S", value: Math.round(baseValue * 0.8) },
            { day: "M", value: Math.round(baseValue * 0.95) },
            { day: "T", value: Math.round(baseValue * 1.05) },
            { day: "W", value: Math.round(baseValue * 0.9) },
            { day: "T", value: Math.round(baseValue * 1.15) },
            { day: "F", value: Math.round(baseValue * 1.0) },
            { day: "S", value: Math.round(baseValue * 1.1) },
          ])
        }

        // Transform commodities data
        if (commoditiesData.length > 0) {
          setCommodities(commoditiesData.map((c: CommodityWithPrice) => ({
            id: c.id,
            name: c.name,
            price: c.price,
            change: parseFloat(String(c.change)),
            mandi: c.mandi,
            icon: c.icon
          })))
        }

        // Transform activities data
        if (activitiesData.length > 0) {
          setActivities(activitiesData.map((a: ActivityType) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            timestamp: a.timestamp,
            detail: a.detail
          })))
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Build stats data from dashboard response
  const statsData: StatCard[] = dashboardData ? [
    {
      value: dashboardData.market_summary.total_commodities.toString(),
      label: "Total Commodities",
      trend: `↗ ${dashboardData.top_commodities.length} tracked`,
      isHighlighted: true,
      icon: <Wheat className="h-5 w-5" />,
    },
    {
      value: dashboardData.market_summary.total_mandis.toString(),
      label: "Active Mandis",
      trend: `↗ ${dashboardData.top_mandis.length} most active`,
      icon: <Store className="h-5 w-5" />,
    },
    {
      value: dashboardData.market_summary.total_price_records.toLocaleString(),
      label: "Price Records",
      trend: `Updated ${new Date(dashboardData.market_summary.last_updated).toLocaleDateString()}`,
      icon: <Activity className="h-5 w-5" />,
    },
    {
      value: dashboardData.market_summary.total_forecasts.toString(),
      label: "Price Forecasts",
      trend: "Next 14 days",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ] : [
    { value: "-", label: "Total Commodities", trend: "Loading...", isHighlighted: true, icon: <Wheat className="h-5 w-5" /> },
    { value: "-", label: "Active Mandis", trend: "Loading...", icon: <Store className="h-5 w-5" /> },
    { value: "-", label: "Price Records", trend: "Loading...", icon: <Activity className="h-5 w-5" /> },
    { value: "-", label: "Price Forecasts", trend: "Loading...", icon: <TrendingUp className="h-5 w-5" /> },
  ]

  // Donut chart data for market coverage
  const donutData = [
    { name: "Active", value: marketCoverage.active, fill: "var(--color-primary)" },
    { name: "Pending", value: marketCoverage.pending, fill: "var(--color-accent)" },
    { name: "Inactive", value: marketCoverage.inactive, fill: "var(--color-muted)" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AgriProfit</span>
            <button
              className="lg:hidden ml-auto p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Menu
            </p>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className={`ml-auto text-xs ${
                        item.active ? "bg-primary-foreground/20 text-primary-foreground" : ""
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* General */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              General
            </p>
            <nav className="space-y-1">
              {generalItems.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile App Promo */}
          <div className="mt-auto">
            <div className="relative overflow-hidden rounded-xl bg-primary p-5">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-foreground/10" />
              <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-primary-foreground/10" />
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center mb-3">
                  <Leaf className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="font-semibold text-primary-foreground mb-1">
                  Download our Mobile App
                </p>
                <p className="text-xs text-primary-foreground/70 mb-4">
                  Get easy access anytime
                </p>
                <Button
                  size="sm"
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-4 py-2 w-64 lg:w-80">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search commodities, mandis..."
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
                />
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-card px-1.5 text-[10px] font-medium text-muted-foreground">
                  ⌘F
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
              </Button>
              <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-border">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>RM</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Rajan Menon</p>
                  <p className="text-xs text-muted-foreground">rajan@agriprofit.in</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor commodity prices across Kerala mandis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Commodity
              </Button>
              <Button variant="outline">Import Data</Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {statsData.map((stat, index) => (
              <Card
                key={stat.label}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  stat.isHighlighted
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <CardContent className="p-5 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          stat.isHighlighted
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stat.label}
                      </p>
                      <p className="text-3xl lg:text-4xl font-bold">{stat.value}</p>
                      <p
                        className={`text-xs mt-2 flex items-center gap-1 ${
                          stat.isHighlighted
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stat.trend.includes("↗") && (
                          <TrendingUp className="h-3 w-3" />
                        )}
                        {stat.trend.replace("↗ ", "")}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        stat.isHighlighted
                          ? "bg-primary-foreground/20"
                          : "bg-muted"
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-5 w-5 ${
                          stat.isHighlighted
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
                {stat.isHighlighted && (
                  <>
                    <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
                    <div className="absolute -right-4 bottom-4 h-16 w-16 rounded-full bg-primary-foreground/5" />
                  </>
                )}
              </Card>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Price Trends Chart */}
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Weekly Price Trends</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary">
                  View Details
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 lg:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 4
                                ? "var(--color-primary)"
                                : "var(--color-accent)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Commodities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Top Commodities</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary">
                  + View All
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : commodities.length > 0 ? (
                    commodities.map((commodity) => (
                      <div
                        key={commodity.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{commodity.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{commodity.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {commodity.mandi}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            ₹{commodity.price.toLocaleString()}
                          </p>
                          <p
                            className={`text-xs flex items-center justify-end gap-1 ${
                              commodity.change >= 0
                                ? "text-primary"
                                : "text-destructive"
                            }`}
                          >
                            {commodity.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {commodity.change >= 0 ? "+" : ""}
                            {commodity.change}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No commodities found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activities.length > 0 ? (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            activity.type === "price"
                              ? "bg-primary/10 text-primary"
                              : activity.type === "forecast"
                              ? "bg-accent text-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {activity.type === "price" && (
                            <IndianRupee className="h-4 w-4" />
                          )}
                          {activity.type === "forecast" && (
                            <TrendingUp className="h-4 w-4" />
                          )}
                          {activity.type === "post" && (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.detail}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.timestamp}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No recent activity. Login to see your notifications.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted hover:bg-accent transition-colors text-center group"
                    >
                      <div className="p-3 rounded-lg bg-card text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {action.icon}
                      </div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Coverage */}
            <Card className="lg:col-span-2 xl:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Market Coverage</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-center">
                  <div className="relative h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          dataKey="value"
                          stroke="none"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{marketCoverage.active}%</span>
                      <span className="text-xs text-muted-foreground">Markets Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <span className="text-xs text-muted-foreground">Inactive</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Tracker */}
            <Card className="lg:col-span-2 xl:col-span-3 bg-primary text-primary-foreground overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Market Session Active</h3>
                    <p className="text-sm text-primary-foreground/70">
                      Track live prices during trading hours
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-4xl lg:text-5xl font-mono font-bold">
                      <Clock className="inline-block h-8 w-8 mr-3 opacity-70" />
                      01:24:08
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        className="h-12 w-12 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      </Button>
                      <Button
                        size="icon"
                        className="h-12 w-12 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary-foreground/10" />
              <div className="absolute -right-8 top-24 h-24 w-24 rounded-full bg-primary-foreground/5" />
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
