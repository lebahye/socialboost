"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { PaymentRecord } from '@/lib/models/user';

// Mock payment data
const mockPayments: PaymentRecord[] = [
  {
    id: 'payment1',
    date: new Date('2023-09-15'),
    amount: 99.99,
    description: 'Yearly Premium Subscription - User123',
    status: 'completed',
    transactionId: 'tx_year_123456'
  },
  {
    id: 'payment2',
    date: new Date('2023-09-20'),
    amount: 9.99,
    description: 'Monthly Premium Subscription - User456',
    status: 'completed',
    transactionId: 'tx_month_789012'
  },
  {
    id: 'payment3',
    date: new Date('2023-09-25'),
    amount: -50,
    description: 'Credit Redemption - User789',
    status: 'completed',
    transactionId: 'tx_cashout_345678'
  },
  {
    id: 'payment4',
    date: new Date('2023-09-28'),
    amount: 9.99,
    description: 'Monthly Premium Subscription - User234',
    status: 'pending',
    transactionId: 'tx_month_901234'
  },
  {
    id: 'payment5',
    date: new Date('2023-10-01'),
    amount: -25,
    description: 'Credit Redemption - User567',
    status: 'pending',
    transactionId: 'tx_cashout_567890'
  },
  {
    id: 'payment6',
    date: new Date('2023-10-05'),
    amount: 99.99,
    description: 'Yearly Premium Subscription - User890',
    status: 'failed',
    transactionId: 'tx_year_234567'
  }
];

export default function RevenueManagement() {
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments);
  const [filterType, setFilterType] = useState<'all' | 'subscription' | 'redemption'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);

  // New payout form state
  const [newPayout, setNewPayout] = useState({
    userId: '',
    amount: 10,
    description: 'Credit Redemption',
    transactionId: ''
  });

  // Stats
  const totalRevenue = payments
    .filter(p => p.amount > 0 && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayouts = payments
    .filter(p => p.amount < 0 && p.status === 'completed')
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  const pendingPayouts = payments
    .filter(p => p.amount < 0 && p.status === 'pending')
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesType =
      filterType === 'all' ||
      (filterType === 'subscription' && payment.amount > 0) ||
      (filterType === 'redemption' && payment.amount < 0);

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;

    return matchesType && matchesStatus;
  });

  // Create new payout
  const handleCreatePayout = () => {
    const payment: PaymentRecord = {
      id: `payment${payments.length + 1}`,
      date: new Date(),
      amount: -newPayout.amount, // Negative for payouts
      description: `${newPayout.description} - ${newPayout.userId}`,
      status: 'pending',
      transactionId: newPayout.transactionId || `tx_payout_${Date.now()}`
    };

    setPayments([payment, ...payments]);

    // Reset form
    setNewPayout({
      userId: '',
      amount: 10,
      description: 'Credit Redemption',
      transactionId: ''
    });

    setIsPayoutDialogOpen(false);
  };

  // Update payment status
  const updatePaymentStatus = (id: string, status: 'completed' | 'pending' | 'failed') => {
    setPayments(payments.map(payment => {
      if (payment.id === id) {
        return {
          ...payment,
          status
        };
      }
      return payment;
    }));

    // Close dialog if open
    setSelectedPayment(null);
  };

  // Get appropriate badge for payment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">From completed subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">${totalPayouts.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Completed redemptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(totalRevenue - totalPayouts).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Revenue minus payouts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                View and manage all payment transactions
              </CardDescription>
            </div>
            <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Manual Payout</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Manual Payout</DialogTitle>
                  <DialogDescription>
                    Process a manual payout for a user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="userId" className="text-sm font-medium">
                      User ID
                    </label>
                    <Input
                      id="userId"
                      value={newPayout.userId}
                      onChange={(e) => setNewPayout({...newPayout, userId: e.target.value})}
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium">
                      Amount (USD)
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      value={newPayout.amount}
                      onChange={(e) => setNewPayout({...newPayout, amount: Number.parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input
                      id="description"
                      value={newPayout.description}
                      onChange={(e) => setNewPayout({...newPayout, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="transactionId" className="text-sm font-medium">
                      Transaction ID (Optional)
                    </label>
                    <Input
                      id="transactionId"
                      value={newPayout.transactionId}
                      onChange={(e) => setNewPayout({...newPayout, transactionId: e.target.value})}
                      placeholder="External transaction reference"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsPayoutDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePayout}>Process Payout</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={filterType === 'all' ? "default" : "outline"}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All Transactions
            </Button>
            <Button
              variant={filterType === 'subscription' ? "default" : "outline"}
              onClick={() => setFilterType('subscription')}
              size="sm"
            >
              Subscriptions
            </Button>
            <Button
              variant={filterType === 'redemption' ? "default" : "outline"}
              onClick={() => setFilterType('redemption')}
              size="sm"
            >
              Redemptions
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button
              variant={filterStatus === 'all' ? "default" : "outline"}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All Status
            </Button>
            <Button
              variant={filterStatus === 'completed' ? "default" : "outline"}
              onClick={() => setFilterStatus('completed')}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={filterStatus === 'pending' ? "default" : "outline"}
              onClick={() => setFilterStatus('pending')}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'failed' ? "default" : "outline"}
              onClick={() => setFilterStatus('failed')}
              size="sm"
            >
              Failed
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No payments found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell className={payment.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {payment.amount > 0 ? `+${formatCurrency(payment.amount)}` : `-${formatCurrency(payment.amount)}`}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            Details
                          </Button>
                          {payment.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-600"
                              onClick={() => updatePaymentStatus(payment.id, 'completed')}
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Transaction Date</div>
                  <div className="font-medium">{formatDate(selectedPayment.date)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="font-medium">{selectedPayment.description}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className={`font-medium text-lg ${selectedPayment.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {selectedPayment.amount > 0 ? `+${formatCurrency(selectedPayment.amount)}` : `-${formatCurrency(selectedPayment.amount)}`}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Transaction ID</div>
                <div className="font-mono text-sm">{selectedPayment.transactionId}</div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="pt-4 space-y-2">
                  <h3 className="font-medium">Update Status</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => updatePaymentStatus(selectedPayment.id, 'completed')}
                    >
                      Mark as Completed
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => updatePaymentStatus(selectedPayment.id, 'failed')}
                    >
                      Mark as Failed
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Payouts</CardTitle>
          <CardDescription>Payouts waiting for approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">${pendingPayouts.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({payments.filter(p => p.amount < 0 && p.status === 'pending').length} transactions)
              </span>
            </div>
            {pendingPayouts > 0 && (
              <Button variant="outline" size="sm" onClick={() => setFilterStatus('pending')}>
                View Pending Transactions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
