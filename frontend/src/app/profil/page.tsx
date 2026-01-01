'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { User } from '@/types/user.types';
import Navbar from '@/components/Navbar';

interface PlayerRatings {
  totalRatingsReceived: number;
  avgSpeed: number;
  avgTechnique: number;
  avgPassing: number;
  avgPhysical: number;
  avgOverall: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [ratings, setRatings] = useState<PlayerRatings | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Fetch user ratings
    if (currentUser?.id) {
      fetchUserRatings(currentUser.id);
    }

    // Listen for profile updates
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) {
        setUser({ ...updatedUser });
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, [router]);

  const fetchUserRatings = async (userId: string) => {
    try {
      setLoadingRatings(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/ratings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setRatings(data.data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası seçin!');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır!');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/users/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Update user state with new profile picture
        setUser(prev => prev ? {
          ...prev,
          profileData: data.data.profileData
        } : null);

        // Update localStorage
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          currentUser.profileData = data.data.profileData;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        // Trigger a custom event to notify other components (like Navbar)
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { profileData: data.data.profileData }
        }));
      } else {
        alert(data.message || 'Profil resmi yüklenirken hata oluştu!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Profil resmi yüklenirken hata oluştu!');
    } finally {
      setUploading(false);
    }
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

  if (!user) return null;

  const profilePicture = user.profileData?.profilePicture;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  const stats = [
    {
      label: 'ELO Puanı',
      value: user.eloRating || 1000,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'Toplam Maç',
      value: user.totalMatchesPlayed || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Güncel Seri',
      value: user.currentStreak || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      label: 'En Uzun Seri',
      value: user.longestStreak || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      label: 'Güven Puanı',
      value: user.trustScore || 100,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'from-indigo-400 to-blue-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      label: 'Rozet Sayısı',
      value: user.profileData?.badges ? Object.keys(user.profileData.badges).length : 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'from-yellow-400 to-amber-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    }
  ];

  // Player abilities for the stats card - using dynamic ratings
  const playerAbilities = [
    {
      label: 'Hız',
      value: ratings?.avgSpeed || 0,
      color: 'from-green-500 to-emerald-600',
      barColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
    },
    {
      label: 'Şut',
      value: ratings?.avgTechnique || 0,
      color: 'from-blue-500 to-cyan-600',
      barColor: 'bg-gradient-to-r from-blue-500 to-cyan-600'
    },
    {
      label: 'Pas',
      value: ratings?.avgPassing || 0,
      color: 'from-purple-500 to-pink-600',
      barColor: 'bg-gradient-to-r from-purple-500 to-pink-600'
    },
    {
      label: 'Fizik',
      value: ratings?.avgPhysical || 0,
      color: 'from-orange-500 to-red-600',
      barColor: 'bg-gradient-to-r from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />

      {/* Hero Section - Profile Header */}
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMTIgMTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMTIgMTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAyMmMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0yNCAwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMCAxMmMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTEyIDBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-105">
                {profilePicture ? (
                  <img
                    src={`${backendUrl}${profilePicture}`}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl md:text-6xl font-black bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => document.getElementById('profilePictureInput')?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Profil resmini değiştir"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </button>

              {/* Hidden File Input */}
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />

              <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-xl">⭐</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                @{user.username}
              </h1>
              <p className="text-white/90 text-lg mb-4">{user.firstName} {user.lastName}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <span className="text-white/90 text-sm">
                    Üyelik: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <span className="text-white/90 text-sm capitalize">{user.role || 'user'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Oyuncu İstatistikleri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${stat.bgColor} ${stat.textColor} rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <div className={`px-3 py-1 ${stat.bgColor} ${stat.textColor} rounded-full text-xs font-bold`}>
                      STAT
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-4xl font-black ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Abilities Card */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Oyuncu Yetenekleri</h2>
            {ratings && ratings.totalRatingsReceived > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <span className="text-white text-sm font-semibold">
                  {ratings.totalRatingsReceived} değerlendirme
                </span>
              </div>
            )}
          </div>

          {loadingRatings ? (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white font-medium">Yetenekler yükleniyor...</p>
                </div>
              </div>
            </div>
          ) : ratings && ratings.totalRatingsReceived > 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Overall Rating Circle */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl">
                      <div className="w-40 h-40 rounded-full bg-gray-900 flex flex-col items-center justify-center">
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-amber-500">
                          {ratings.avgOverall || Math.round(playerAbilities.reduce((acc, ability) => acc + ability.value, 0) / playerAbilities.length)}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold mt-1">GENEL</span>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-4 border-gray-900 shadow-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Ability Bars */}
                <div className="space-y-6">
                  {playerAbilities.map((ability, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-lg">{ability.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-8 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                            <span className={`text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${ability.color}`}>
                              {ability.value}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${ability.barColor} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                          style={{ width: `${ability.value}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 shadow-2xl border border-gray-700 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Henüz değerlendirme yok</h3>
              <p className="text-gray-400 mb-6">Maçlara katıl ve diğer oyuncuların seni değerlendirmesini sağla!</p>
              <Link href="/sahalar">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Maç Bul
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/rezervasyonlarim">
              <div className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Rezervasyonlarım</h3>
                </div>
                <p className="text-white/80 text-sm">Aktif ve geçmiş rezervasyonlarını gör</p>
                <div className="mt-4 flex items-center text-white/90 group-hover:translate-x-2 transition-transform">
                  <span className="text-sm font-semibold">Görüntüle</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/sahalar">
              <div className="group bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Saha Ara</h3>
                </div>
                <p className="text-white/80 text-sm">En yakın sahaları keşfet ve rezerve et</p>
                <div className="mt-4 flex items-center text-white/90 group-hover:translate-x-2 transition-transform">
                  <span className="text-sm font-semibold">Sahalara Git</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/oyuncu-bul">
              <div className="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Oyuncu Bul</h3>
                </div>
                <p className="text-white/80 text-sm">Maçın için eksik oyuncu bul</p>
                <div className="mt-4 flex items-center text-white/90 group-hover:translate-x-2 transition-transform">
                  <span className="text-sm font-semibold">Ara</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Achievements Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Başarılar ve Rozetler</h2>
          {user.profileData?.badges && Object.keys(user.profileData.badges).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.entries(user.profileData.badges).map(([key, value]) => (
                <div key={key} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform">
                    🏆
                  </div>
                  <p className="font-bold text-gray-900 mb-1">{key}</p>
                  <p className="text-sm text-gray-600">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Henüz rozet kazanılmadı</h3>
              <p className="text-gray-600 mb-6">Maçlara katıl ve rozetler kazan!</p>
              <Link href="/sahalar">
                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Şimdi Başla
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
