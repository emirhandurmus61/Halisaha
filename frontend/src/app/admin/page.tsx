'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

interface Stats {
  totalUsers: number;
  totalVenues: number;
  totalReservations: number;
  totalRevenue: number;
  activeUsers: number;
  pendingReservations: number;
}

interface DetailedStats {
  dailyReservations: { date: string; count: string }[];
  userTypeDistribution: { user_type: string; count: string }[];
  popularVenues: { id: string; name: string; reservation_count: string; total_revenue: string }[];
  monthlyRevenue: { month: string; revenue: string; reservation_count: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVenues: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingReservations: 0,
  });
  const [detailedStats, setDetailedStats] = useState<DetailedStats>({
    dailyReservations: [],
    userTypeDistribution: [],
    popularVenues: [],
    monthlyRevenue: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'analytics'>('overview');

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      router.push('/dashboard');
      return;
    }

    fetchStats();
    fetchDetailedStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/admin/statistics/detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDetailedStats(data.data);
      }
    } catch (error) {
      console.error('Fetch detailed stats error:', error);
    }
  };

  const menuItems = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle, düzenle ve yönet',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600',
      stats: `${stats.totalUsers} Kullanıcı`,
    },
    {
      title: 'Saha Yönetimi',
      description: 'Sahaları yönet, ekle ve düzenle',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: '/admin/venues',
      color: 'from-green-500 to-emerald-600',
      stats: `${stats.totalVenues} Saha`,
    },
    {
      title: 'Rezervasyon Yönetimi',
      description: 'Tüm rezervasyonları görüntüle ve yönet',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/admin/reservations',
      color: 'from-purple-500 to-purple-600',
      stats: `${stats.totalReservations} Rezervasyon`,
    },
    {
      title: 'İstatistikler',
      description: 'Detaylı raporlar ve analizler',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/admin/statistics',
      color: 'from-orange-500 to-orange-600',
      stats: `₺${stats.totalRevenue.toLocaleString()} Gelir`,
    },
    {
      title: 'Sistem Ayarları',
      description: 'Uygulama ayarlarını yapılandır',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/admin/settings',
      color: 'from-gray-500 to-gray-600',
      stats: 'Yapılandır',
    },
    {
      title: 'Takım Yönetimi',
      description: 'Takımları görüntüle ve yönet',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/admin/teams',
      color: 'from-indigo-500 to-indigo-600',
      stats: 'Takımlar',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
              <p className="text-gray-600 mt-1">Sistem yönetim merkezi</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeView === 'overview'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeView === 'analytics'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Detaylı Analitik
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+{stats.activeUsers} aktif kullanıcı</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Saha</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalVenues}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rezervasyonlar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReservations}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">{stats.pendingReservations} beklemede</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₺{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Overview - Menu Grid */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200"
              >
                <div className="p-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500">{item.stats}</span>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            {/* Kullanıcı Tipi Dağılımı */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Kullanıcı Tipi Dağılımı
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {detailedStats.userTypeDistribution.map((item, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {item.user_type === 'player' ? 'Oyuncu' : item.user_type === 'venue_owner' ? 'Tesis Sahibi' : 'Admin'}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.user_type === 'player' ? 'bg-blue-500' :
                          item.user_type === 'venue_owner' ? 'bg-green-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${(parseInt(item.count) / stats.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* En Popüler Sahalar */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                En Popüler Sahalar
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Saha Adı</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Rezervasyon</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Gelir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedStats.popularVenues.slice(0, 5).map((venue, index) => (
                      <tr key={venue.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{venue.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">{venue.reservation_count}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          ₺{parseFloat(venue.total_revenue || '0').toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aylık Gelir Trendi */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Aylık Gelir Trendi (Son 6 Ay)
              </h3>
              <div className="space-y-3">
                {detailedStats.monthlyRevenue.slice(0, 6).map((month, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-700">
                      {new Date(month.month).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full flex items-center justify-end pr-3 transition-all"
                        style={{
                          width: `${Math.min((parseFloat(month.revenue) / (detailedStats.monthlyRevenue[0] ? parseFloat(detailedStats.monthlyRevenue[0].revenue) : 1)) * 100, 100)}%`
                        }}
                      >
                        <span className="text-xs font-bold text-white">
                          {month.reservation_count} Rez.
                        </span>
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ₺{parseFloat(month.revenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Son 7 Günün Rezervasyonları */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Günlük Rezervasyon Aktivitesi (Son 7 Gün)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {detailedStats.dailyReservations.slice(0, 7).reverse().map((day, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-100 text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{day.count}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
