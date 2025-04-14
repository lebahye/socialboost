"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import UserManagement from '@/components/admin/UserManagement';
import CampaignManagement from '@/components/admin/CampaignManagement';
import RevenueManagement from '@/components/admin/RevenueManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // In a real app, this would verify against a database or auth service
  const verifyAdmin = () => {
    // Demo password for illustration - in production use proper authentication
    if (password === 'admin123') {
      setIsAdmin(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  // If not authenticated, show login screen
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Authentication</CardTitle>
            <CardDescription>Enter your admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  onKeyDown={(e) => e.key === 'Enter' && verifyAdmin()}
                />
                {error && <div className="text-sm text-red-500">{error}</div>}
              </div>
              <Button className="w-full" onClick={verifyAdmin}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, campaigns, and revenue
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsAdmin(false)}>
            Logout
          </Button>
        </div>
        <Separator className="my-6" />
      </header>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignManagement />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
