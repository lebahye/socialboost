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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock user data
const mockUsers = [
  {
    id: '1',
    telegramId: 123456789,
    username: 'johndoe',
    xAccount: 'johndoe',
    isVerified: true,
    joinDate: new Date('2023-01-15'),
    isPremium: true,
    premiumUntil: new Date('2024-12-31'),
    credits: 3500,
  },
  {
    id: '2',
    telegramId: 234567890,
    username: 'janedoe',
    xAccount: 'janexyz',
    isVerified: true,
    joinDate: new Date('2023-02-20'),
    isPremium: false,
    premiumUntil: undefined,
    credits: 1200,
  },
  {
    id: '3',
    telegramId: 345678901,
    username: 'bobsmith',
    xAccount: 'bobsm',
    isVerified: false,
    joinDate: new Date('2023-03-10'),
    isPremium: false,
    premiumUntil: undefined,
    credits: 500,
  },
  {
    id: '4',
    telegramId: 456789012,
    username: 'alicejones',
    xAccount: 'alicejones',
    isVerified: true,
    joinDate: new Date('2023-04-05'),
    isPremium: true,
    premiumUntil: new Date('2024-10-05'),
    credits: 4200,
  },
  {
    id: '5',
    telegramId: 567890123,
    username: 'sarahmiller',
    xAccount: 'sarahm',
    isVerified: true,
    joinDate: new Date('2023-05-15'),
    isPremium: false,
    premiumUntil: undefined,
    credits: 900,
  }
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null);
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.xAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telegramId.toString().includes(searchTerm);

    const matchesPremium = filterPremium === null || user.isPremium === filterPremium;
    const matchesVerified = filterVerified === null || user.isVerified === filterVerified;

    return matchesSearch && matchesPremium && matchesVerified;
  });

  // Actions
  const togglePremium = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        if (user.isPremium) {
          // Remove premium
          return {
            ...user,
            isPremium: false,
            premiumUntil: undefined
          };
        }

        // Add premium for 1 year
        const premiumUntil = new Date();
        premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
        return {
          ...user,
          isPremium: true,
          premiumUntil
        };
      }
      return user;
    }));
  };

  const toggleVerification = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          isVerified: !user.isVerified
        };
      }
      return user;
    }));
  };

  const addCredits = (userId: string, amount: number) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          credits: user.credits + amount
        };
      }
      return user;
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by username, X account, or Telegram ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterPremium === true ? "default" : "outline"}
                onClick={() => setFilterPremium(filterPremium === true ? null : true)}
                size="sm"
              >
                Premium
              </Button>
              <Button
                variant={filterPremium === false ? "default" : "outline"}
                onClick={() => setFilterPremium(filterPremium === false ? null : false)}
                size="sm"
              >
                Not Premium
              </Button>
              <Button
                variant={filterVerified === true ? "default" : "outline"}
                onClick={() => setFilterVerified(filterVerified === true ? null : true)}
                size="sm"
              >
                Verified
              </Button>
              <Button
                variant={filterVerified === false ? "default" : "outline"}
                onClick={() => setFilterVerified(filterVerified === false ? null : false)}
                size="sm"
              >
                Not Verified
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>X Account</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>@{user.xAccount}</TableCell>
                      <TableCell>{user.telegramId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {user.isPremium ? (
                            <Badge className="bg-yellow-500">Premium</Badge>
                          ) : (
                            <Badge variant="outline">Standard</Badge>
                          )}
                          {user.isVerified ? (
                            <Badge className="bg-green-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 text-red-500">Unverified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.credits.toLocaleString()}</TableCell>
                      <TableCell>{user.joinDate.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePremium(user.id)}
                          >
                            {user.isPremium ? 'Remove Premium' : 'Add Premium'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVerification(user.id)}
                          >
                            {user.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addCredits(user.id, 500)}
                            title="Add 500 credits"
                          >
                            +Credits
                          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{users.filter(u => u.isPremium).length}</div>
              <div className="text-sm text-muted-foreground">Premium Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{users.filter(u => u.isVerified).length}</div>
              <div className="text-sm text-muted-foreground">Verified Users</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{users.reduce((sum, user) => sum + user.credits, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Credits</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
