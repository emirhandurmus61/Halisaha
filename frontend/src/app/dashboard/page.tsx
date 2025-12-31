'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { User } from '@/types/user.types';
import Card from '@/components/ui/Card';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Authentication kontrolü
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center gap-3">
            Hoş geldin, {user?.firstName}!
            <span className="text-5xl">👋</span>
          </h2>
          <p className="text-xl text-gray-600 mt-3">
            Bugün hangi sahada oynamak istersin?
          </p>
        </div>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* ELO Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-green-100 text-sm font-medium">ELO Puanı</p>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{user?.eloRating || 1000}</p>
              <p className="text-green-100 text-xs">↗ Harika gidiyorsun!</p>
            </div>
          </div>

          {/* Matches Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-100">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600 text-sm font-medium">Toplam Maç</p>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{user?.totalMatchesPlayed || 0}</p>
              <p className="text-gray-500 text-xs">Oynanmış maçlar</p>
            </div>
          </div>

          {/* Streak Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-orange-100 text-sm font-medium">Seri (Streak)</p>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1 flex items-center gap-2">
                {user?.currentStreak || 0} <span className="text-2xl">🔥</span>
              </p>
              <p className="text-orange-100 text-xs">Devam et!</p>
            </div>
          </div>

          {/* Trust Score Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-100">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600 text-sm font-medium">Güven Puanı</p>
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{user?.trustScore || 100}</p>
              <p className="text-gray-500 text-xs">Mükemmel!</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Modern Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Rezervasyon Yap */}
          <Link href="/sahalar" className="group">
            <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-green-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Rezervasyon Yap</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  İstediğin sahayı seç ve hemen rezerve et
                </p>

                <div className="flex items-center text-green-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Başla</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Oyuncu Bul */}
          <Link href="/oyuncu-bul" className="group">
            <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-blue-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Oyuncu Bul</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Eksik oyuncunu hemen bul veya maça katıl
                </p>

                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Keşfet</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Profilim */}
          <Link href="/profil" className="group">
            <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-purple-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Profilim</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  İstatistiklerini gör ve profilini düzenle
                </p>

                <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Görüntüle</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold mb-2">💡 İpucu</h4>
              <p className="text-green-100 leading-relaxed">
                Rezervasyon yaparken tarih ve saat bilgilerini dikkatlice kontrol et.
                Oyuncu bul özelliği ile eksik oyuncularını hızlıca tamamlayabilirsin!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
