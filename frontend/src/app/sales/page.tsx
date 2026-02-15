'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService, RecordSaleData } from '@/services/sales';
import { commoditiesService } from '@/services/commodities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from 'sonner';
import { IndianRupee, TrendingUp, ShoppingCart, Trash2 } from 'lucide-react';

export default function SalesPage() {
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState<RecordSaleData>({
        commodity_id: '',
        quantity: 0,
        unit: 'kg',
        price_per_unit: 0,
        buyer_name: '',
        sale_date: new Date().toISOString().split('T')[0]
    });

    const { data: sales, isLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: salesService.getSalesHistory,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    const { data: analytics } = useQuery({
        queryKey: ['sales-analytics'],
        queryFn: salesService.getAnalytics,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: commodities } = useQuery({
        queryKey: ['commodities'],
        queryFn: () => commoditiesService.getAll({ limit: 500 }),
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    });

    const addMutation = useMutation({
        mutationFn: salesService.recordSale,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Update inventory too
            setIsAddOpen(false);
            toast.success('Sale recorded successfully');
        },
        onError: () => toast.error('Failed to record sale')
    });

    const deleteMutation = useMutation({
        mutationFn: salesService.deleteSale,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });
            toast.success('Sale deleted');
        },
        onError: () => toast.error('Failed to delete sale')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.commodity_id || formData.quantity <= 0 || formData.price_per_unit <= 0) return;
        addMutation.mutate(formData);
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-black">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold tracking-tight">Sales & Revenue</h1>
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                                    <ShoppingCart className="h-4 w-4" /> Record Sale
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Record New Sale</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Commodity</Label>
                                        <Select
                                            value={formData.commodity_id}
                                            onValueChange={(v) => setFormData({ ...formData, commodity_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select commodity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {commodities?.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={formData.quantity || ''}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Unit</Label>
                                            <Select
                                                value={formData.unit}
                                                onValueChange={(v) => setFormData({ ...formData, unit: v })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kg">kg</SelectItem>
                                                    <SelectItem value="quintal">quintal</SelectItem>
                                                    <SelectItem value="ton">ton</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Price per kg (₹)</Label>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={formData.price_per_unit || ''}
                                            onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Totals are calculated in kg (1 quintal = 100 kg, 1 ton = 1000 kg).
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Buyer Name (Optional)</Label>
                                        <Input
                                            value={formData.buyer_name}
                                            onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                                            placeholder="e.g. Local Mandi"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-green-600" disabled={addMutation.isPending}>
                                        {addMutation.isPending ? 'Recording...' : 'Confirm Sale'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <IndianRupee className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{analytics?.total_revenue?.toLocaleString() || '0'}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics?.total_sales_count || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold truncate">{analytics?.top_selling_commodity || '-'}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>History of your sold produce.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Commodity</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Price/kg</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Buyer</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={7} className="text-center">Loading sales...</TableCell></TableRow>
                                        ) : sales?.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center h-24">No sales recorded yet.</TableCell></TableRow>
                                        ) : (
                                            sales?.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="font-medium">{sale.commodity_name || 'Loading...'}</TableCell>
                                                    <TableCell>{sale.quantity} {sale.unit}</TableCell>
                                                    <TableCell>₹{sale.price_per_unit}</TableCell>
                                                    <TableCell className="text-green-600 font-bold">₹{sale.total_amount.toLocaleString()}</TableCell>
                                                    <TableCell>{sale.buyer_name || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                if (window.confirm('Delete this sale record?')) {
                                                                    deleteMutation.mutate(sale.id);
                                                                }
                                                            }}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
