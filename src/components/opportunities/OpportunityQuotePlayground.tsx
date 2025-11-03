import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Info, DollarSign, TrendingUp } from 'lucide-react';
import {
  useOpportunityQuoteItems,
  useCreateQuoteItem,
  useUpdateQuoteItem,
  useDeleteQuoteItem,
  type OpportunityQuoteItem,
} from '@/hooks/useOpportunityQuoteItems';

interface OpportunityQuotePlaygroundProps {
  opportunityId: string;
}

export const OpportunityQuotePlayground = ({ opportunityId }: OpportunityQuotePlaygroundProps) => {
  const { data: items = [], isLoading } = useOpportunityQuoteItems(opportunityId);
  const createItem = useCreateQuoteItem();
  const updateItem = useUpdateQuoteItem();
  const deleteItem = useDeleteQuoteItem();

  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
    unit_cost: 0,
    item_type: 'one_time' as 'one_time' | 'monthly',
  });

  const handleAddItem = () => {
    if (!newItem.item_name.trim()) return;
    
    createItem.mutate({
      opportunity_id: opportunityId,
      ...newItem,
    });

    setNewItem({
      item_name: '',
      quantity: 1,
      unit_price: 0,
      unit_cost: 0,
      item_type: 'one_time',
    });
  };

  const handleUpdateItem = (id: string, field: keyof OpportunityQuoteItem, value: any) => {
    updateItem.mutate({ id, [field]: value });
  };

  const handleDeleteItem = (id: string) => {
    deleteItem.mutate({ id, opportunityId });
  };

  const calculateItemTotals = (item: OpportunityQuoteItem) => {
    const revenue = item.quantity * item.unit_price;
    const cost = item.quantity * item.unit_cost;
    const profit = revenue - cost;
    return { revenue, cost, profit };
  };

  const calculateOverallTotals = () => {
    let totalOneTime = 0;
    let totalMRR = 0;
    let totalOneTimeProfit = 0;
    let totalMRRProfit = 0;

    items.forEach((item) => {
      const { revenue, profit } = calculateItemTotals(item);
      if (item.item_type === 'one_time') {
        totalOneTime += revenue;
        totalOneTimeProfit += profit;
      } else {
        totalMRR += revenue;
        totalMRRProfit += profit;
      }
    });

    return { totalOneTime, totalMRR, totalOneTimeProfit, totalMRRProfit };
  };

  const totals = calculateOverallTotals();

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Quote Playground</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Build and visualize your opportunity quote with detailed line items.
                    Track revenue, costs, and profits for both one-time and recurring charges.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Item Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-3">
                <label className="text-sm font-medium">Item</label>
                <Input
                  placeholder="Item name"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Qty</label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Unit Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Unit Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={newItem.item_type === 'one_time' ? 'default' : 'outline'}
                    onClick={() => setNewItem({ ...newItem, item_type: 'one_time' })}
                    className="flex-1 whitespace-nowrap"
                  >
                    One-time
                  </Button>
                  <Button
                    size="sm"
                    variant={newItem.item_type === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setNewItem({ ...newItem, item_type: 'monthly' })}
                    className="flex-1 whitespace-nowrap"
                  >
                    Monthly
                  </Button>
                </div>
              </div>
              <Button onClick={handleAddItem} disabled={!newItem.item_name.trim()} className="md:col-span-1">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const { revenue, profit } = calculateItemTotals(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                              {item.item_type === 'one_time' ? 'One-time' : 'Monthly'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">${revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${profit.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No line items yet. Add your first item above to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totals Overview */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total One-Time</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {totals.totalOneTime.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total MRR</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {totals.totalMRR.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">One-Time Profit</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${totals.totalOneTimeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <DollarSign className="h-5 w-5" />
                  {totals.totalOneTimeProfit.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">MRR Profit</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${totals.totalMRRProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <DollarSign className="h-5 w-5" />
                  {totals.totalMRRProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
