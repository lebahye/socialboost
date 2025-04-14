"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/models/user';

interface HeaderProps {
  user?: User;
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-blue-600 font-bold text-xl">SocialBoost</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium hover:text-blue-600 ${isActive('/') ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium hover:text-blue-600 ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/campaigns"
              className={`text-sm font-medium hover:text-blue-600 ${isActive('/campaigns') ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Campaigns
            </Link>
            <Link
              href="/premium"
              className={`text-sm font-medium hover:text-blue-600 ${isActive('/premium') ? 'text-blue-600' : 'text-gray-700'}`}
            >
              Premium
            </Link>
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium">{user.username || 'User'}</div>
                  <div className="text-xs text-gray-500">{user.credits} credits</div>
                </div>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              </div>
            ) : (
              <Link href="https://t.me/YourBotUsername">
                <Button>Connect Telegram</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/campaigns"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/campaigns') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Campaigns
            </Link>
            <Link
              href="/premium"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/premium') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Premium
            </Link>

            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {user.username ? user.username[0].toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.username || 'User'}</div>
                    <div className="text-sm font-medium text-gray-500">{user.credits} credits</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="https://t.me/YourBotUsername"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connect Telegram
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
