import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Info, DollarSign, TrendingUp, Edit2, Check, X } from 'lucide-react';
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<OpportunityQuoteItem>>({});

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

  const startEditing = (item: OpportunityQuoteItem) => {
    setEditingId(item.id);
    setEditValues({
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      item_type: item.item_type,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEditing = () => {
    if (editingId && editValues.item_name?.trim()) {
      updateItem.mutate(
        { id: editingId, ...editValues },
        {
          onSuccess: () => {
            setEditingId(null);
            setEditValues({});
          },
        }
      );
    }
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
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : parseFloat(e.target.value);
                    setNewItem({ ...newItem, quantity: isNaN(value) ? 1 : value });
                  }}
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
                      const isEditing = editingId === item.id;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {isEditing ? (
                              <Input
                                value={editValues.item_name || ''}
                                onChange={(e) => setEditValues({ ...editValues, item_name: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              item.item_name
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="1"
                                value={editValues.quantity || 0}
                                onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || 1 })}
                                className="h-8 text-right"
                              />
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editValues.unit_price || 0}
                                onChange={(e) => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) || 0 })}
                                className="h-8 text-right"
                              />
                            ) : (
                              `$${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editValues.unit_cost || 0}
                                onChange={(e) => setEditValues({ ...editValues, unit_cost: parseFloat(e.target.value) || 0 })}
                                className="h-8 text-right"
                              />
                            ) : (
                              `$${item.unit_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={editValues.item_type === 'one_time' ? 'default' : 'outline'}
                                  onClick={() => setEditValues({ ...editValues, item_type: 'one_time' })}
                                  className="flex-1 h-7 text-xs"
                                >
                                  One-time
                                </Button>
                                <Button
                                  size="sm"
                                  variant={editValues.item_type === 'monthly' ? 'default' : 'outline'}
                                  onClick={() => setEditValues({ ...editValues, item_type: 'monthly' })}
                                  className="flex-1 h-7 text-xs"
                                >
                                  Monthly
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                                {item.item_type === 'one_time' ? 'One-time' : 'Monthly'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">
                            <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={saveEditing}
                                  className="h-8 w-8"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEditing}
                                  className="h-8 w-8"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(item)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
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
                  {totals.totalOneTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total MRR</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {totals.totalMRR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">One-Time Profit</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${totals.totalOneTimeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <DollarSign className="h-5 w-5" />
                  {totals.totalOneTimeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">MRR Profit</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${totals.totalMRRProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <DollarSign className="h-5 w-5" />
                  {totals.totalMRRProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
