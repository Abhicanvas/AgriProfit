"use client"

import React from "react"
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from "recharts"
import { ForecastPoint } from "@/services/forecasts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ForecastChartProps {
    data: ForecastPoint[]
    currentPrice: number
}

export function ForecastChart({ data, currentPrice }: ForecastChartProps) {
    // Prepare data for chart: lower and upper bounds need to be numbers for Area range
    // Actually Recharts Area with type="range" expects [min, max] in dataKey, 
    // OR we can stack areas. 
    // Simpler approach: Area for confidence interval (transparent fill), Line for prediction.
    // Data structure: { date, predicted_price, range: [lower, upper] }

    // Data structure: { date, predicted_price, range: [lower, upper] }

    if (!data) return null;

    const chartData = data.map(point => ({
        ...point,
        range: [point.lower_bound, point.upper_bound],
        formattedDate: new Date(point.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }))

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickMargin={10}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value: any, name: any) => {
                            if (name === "Confidence Range" && Array.isArray(value)) {
                                return [`₹${Number(value[0]).toFixed(2)} - ₹${Number(value[1]).toFixed(2)}`, String(name)]
                            }
                            return [`₹${Number(value).toFixed(2)}`, String(name)]
                        }}
                    />
                    <Legend />

                    <ReferenceLine y={currentPrice} label="Current Price" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />

                    <Area
                        type="monotone"
                        dataKey="range"
                        fill="hsl(var(--primary)/0.1)"
                        stroke="none"
                        name="Confidence Range"
                    />
                    <Line
                        type="monotone"
                        dataKey="predicted_price"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                        name="Predicted Price"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}
