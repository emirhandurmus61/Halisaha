'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileDropdown from './ProfileDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import { authService } from '@/services/auth.service';

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAdmin(authService.isAdmin());
    setIsAuthenticated(authService.isAuthenticated());
  }, [pathname]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Halısaha
              </h1>
              <p className="text-xs text-gray-500">Saha Rezervasyon</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  isActive('/dashboard')
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Ana Sayfa
              </Link>
            )}
            <Link
              href="/sahalar"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/sahalar')
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Sahalar
            </Link>
            <Link
              href="/rezervasyonlarim"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/rezervasyonlarim')
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Rezervasyonlarım
            </Link>
            <Link
              href="/oyuncu-bul"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/oyuncu-bul')
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Oyuncu Bul
            </Link>
            <Link
              href="/rakip-bul"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/rakip-bul')
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Rakip Bul
            </Link>
            <Link
              href="/takimim"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/takimim')
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Takımım
            </Link>
          </nav>

          {/* Profile Dropdown & Notifications or Login/Register Buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationsDropdown />
                <ProfileDropdown />
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                    title="Admin Paneli"
                  >
                    <svg className="w-6 h-6 text-gray-700 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="absolute -bottom-8 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Admin
                    </span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Üye Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
