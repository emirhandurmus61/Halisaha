'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { reservationService } from '@/services/reservation.service';
import { authService } from '@/services/auth.service';
import Notification from '@/components/Notification';

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // Yeni eklenen state'ler
  const [useTeam, setUseTeam] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [addPlayers, setAddPlayers] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    // Authentication kontrolü
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    // Bugünün tarihini varsayılan olarak set et
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    // Kullanıcının takımlarını yükle
    loadUserTeams();
  }, [router]);

  const loadUserTeams = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      console.log('Loading user team from:', `${apiUrl}/teams/my-team`);

      const response = await fetch(`${apiUrl}/teams/my-team`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      const data = await response.json();
      console.log('Team response:', data);

      if (data.success && data.data) {
        setUserTeam(data.data);
        console.log('User team loaded:', data.data);
      } else {
        setUserTeam(null);
        console.log('User has no team');
      }
    } catch (error) {
      console.error('Takım yüklenemedi:', error);
    }
  };

  const searchPlayers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      console.log('Searching players with query:', query);

      const response = await fetch(`${apiUrl}/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      const data = await response.json();
      console.log('Search response:', data);

      if (data.success) {
        setSearchResults(data.data || []);
        console.log('Search results:', data.data);
      }
    } catch (error) {
      console.error('Oyuncu arama hatası:', error);
    }
  };

  const addPlayer = (userId: string) => {
    if (!selectedPlayers.includes(userId)) {
      setSelectedPlayers([...selectedPlayers, userId]);
      setPlayerSearchQuery('');
      setSearchResults([]);
    }
  };

  const removePlayer = (userId: string) => {
    setSelectedPlayers(selectedPlayers.filter(id => id !== userId));
  };

  useEffect(() => {
    if (selectedDate && params.fieldId) {
      loadAvailableSlots();
    }
  }, [selectedDate, params.fieldId]);

  const loadAvailableSlots = async () => {
    try {
      const data = await reservationService.getAvailableSlots(
        params.fieldId as string,
        selectedDate
      );
      setBookedSlots(data.bookedSlots || []);
    } catch (error) {
      console.error('Müsait saatler yüklenemedi:', error);
    }
  };

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ];

  const isSlotBooked = (time: string) => {
    return bookedSlots.some(slot => {
      if (!slot.startTime || !slot.endTime) return false;
      const slotStart = slot.startTime.substring(0, 5);
      const slotEnd = slot.endTime.substring(0, 5);
      return time >= slotStart && time < slotEnd;
    });
  };

  const calculateEndTime = (startTime: string, hours: number) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = hour + hours;
    return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTime) {
      setError('Lütfen bir saat seçin');
      return;
    }

    setLoading(true);

    try {
      const endTime = calculateEndTime(selectedTime, duration);
      const basePrice = 500; // Örnek fiyat
      const totalPrice = basePrice * duration;

      const reservationData: any = {
        fieldId: params.fieldId as string,
        reservationDate: selectedDate,
        startTime: selectedTime,
        endTime: endTime,
        basePrice: basePrice,
        totalPrice: totalPrice,
        teamName: teamName || undefined,
      };

      // Takım seçildiyse ekle
      if (useTeam && userTeam) {
        reservationData.teamId = userTeam.team.id;
        reservationData.teamName = userTeam.team.name;
      }

      // Manuel oyuncu seçildiyse ekle
      if (addPlayers && selectedPlayers.length > 0) {
        reservationData.playerIds = selectedPlayers;
      }

      console.log('Creating reservation with data:', reservationData);

      await reservationService.create(reservationData);

      setNotification({
        type: 'success',
        title: 'Rezervasyon Başarılı!',
        message: 'Rezervasyonunuz başarıyla oluşturuldu. Rezervasyonlarım sayfasına yönlendiriliyorsunuz...'
      });
      setTimeout(() => {
        router.push('/rezervasyonlarim');
      }, 2000);
    } catch (error: any) {
      if (error.response?.data?.error === 'OVERLAPPING_RESERVATION') {
        setError('Bu saat aralığı için zaten bir rezervasyon bulunmaktadır.');
      } else {
        setError(error.response?.data?.message || 'Rezervasyon oluşturulamadı.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Modern Header with Glassmorphism */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/sahalar" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group">
              <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold">Sahalara Dön</span>
            </Link>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Halısaha
                </h1>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Rezervasyon Yap
          </h1>
          <p className="text-xl text-gray-600">
            Uygun tarih ve saati seçerek rezervasyonunuzu tamamlayın
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3 animate-shake">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900 mb-1">Hata</h4>
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Date Selection Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Tarih Seç</h2>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg font-medium"
                />
              </div>

              {/* Time Selection Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Saat Seç</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {timeSlots.map((time) => {
                    const booked = isSlotBooked(time);
                    const selected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => !booked && setSelectedTime(time)}
                        disabled={booked}
                        className={`
                          relative px-4 py-4 rounded-xl font-bold text-lg transition-all transform
                          ${selected
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-105 ring-4 ring-green-200'
                            : booked
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-green-500 hover:shadow-md hover:scale-105'
                          }
                        `}
                      >
                        {time}
                        {selected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded"></div>
                    <span className="text-sm text-gray-700 font-medium">Seçili</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                    <span className="text-sm text-gray-700 font-medium">Müsait</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <span className="text-sm text-gray-700 font-medium">Dolu</span>
                  </div>
                </div>
              </div>

              {/* Duration & Team Name Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Detaylar</h2>
                </div>

                <div className="space-y-5">
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Süre (Saat)
                    </label>
                    <div className="relative">
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all text-lg font-medium"
                      >
                        <option value={1}>1 Saat</option>
                        <option value={2}>2 Saat</option>
                        <option value={3}>3 Saat</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Team & Players Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Takım & Oyuncular (Opsiyonel)
                    </label>

                    {/* Takım Seçimi Toggle */}
                    {userTeam ? (
                      <div className={`relative p-5 rounded-2xl border-2 transition-all ${
                        useTeam
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-600 shadow-lg'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                            useTeam ? 'bg-white/20' : 'bg-blue-50'
                          }`}>
                            <svg className={`w-6 h-6 ${useTeam ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-lg font-bold ${useTeam ? 'text-white' : 'text-gray-900'}`}>
                                {userTeam.team?.name || userTeam.name}
                              </h3>
                              {userTeam.members && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  useTeam ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {userTeam.members.length} üye
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mb-3 ${useTeam ? 'text-blue-100' : 'text-gray-600'}`}>
                              {userTeam.members && userTeam.members.length > 0
                                ? `${userTeam.members.slice(0, 3).map((m: any) => m.firstName).join(', ')}${userTeam.members.length > 3 ? '...' : ''}`
                                : 'Takım üyeleri otomatik eklenecek'}
                            </p>
                            <label htmlFor="useTeam" className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                id="useTeam"
                                checked={useTeam}
                                onChange={(e) => setUseTeam(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className={`text-sm font-medium ${useTeam ? 'text-white' : 'text-gray-700'}`}>
                                {useTeam ? 'Takımla rezerve ediliyor' : 'Takımımla rezerve et'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Henüz bir takımınız yok</p>
                        <p className="text-xs text-gray-500 mt-1">Takım oluşturmak için Takımım sayfasını ziyaret edin</p>
                      </div>
                    )}

                    {/* Manuel Oyuncu Ekleme Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <input
                        type="checkbox"
                        id="addPlayers"
                        checked={addPlayers}
                        onChange={(e) => setAddPlayers(e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="addPlayers" className="flex-1 cursor-pointer">
                        <span className="font-semibold text-gray-900">Manuel oyuncu ekle</span>
                        <p className="text-xs text-gray-600 mt-0.5">Kullanıcı adıyla arama yaparak ekle</p>
                      </label>
                    </div>

                    {/* Oyuncu Arama */}
                    {addPlayers && (
                      <div className="animate-slideIn space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Kullanıcı adı ara..."
                            value={playerSearchQuery}
                            onChange={(e) => {
                              setPlayerSearchQuery(e.target.value);
                              searchPlayers(e.target.value);
                            }}
                            className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>

                        {/* Arama Sonuçları */}
                        {searchResults.length > 0 && (
                          <div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => addPlayer(user.id)}
                                className="w-full px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                                  <div className="text-xs text-gray-500">@{user.email?.split('@')[0]}</div>
                                </div>
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Seçili Oyuncular */}
                        {selectedPlayers.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Seçili Oyuncular ({selectedPlayers.length})</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedPlayers.map((playerId) => {
                                const player = searchResults.find(u => u.id === playerId);
                                return (
                                  <div
                                    key={playerId}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                                  >
                                    <span>{player?.firstName || 'Oyuncu'}</span>
                                    <button
                                      type="button"
                                      onClick={() => removePlayer(playerId)}
                                      className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <h3 className="text-2xl font-bold">Özet</h3>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-white/90 font-medium">Tarih:</span>
                        </div>
                        <span className="font-bold">
                          {selectedDate ? selectedDate.split('-').reverse().join('.') : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-white/90 font-medium">Saat:</span>
                        </div>
                        <span className="font-bold">{selectedTime || '-'}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-white/90 font-medium">Süre:</span>
                        </div>
                        <span className="font-bold">{duration} Saat</span>
                      </div>

                      {selectedTime && (
                        <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-white/90 font-medium">Bitiş:</span>
                          </div>
                          <span className="font-bold">
                            {calculateEndTime(selectedTime, duration)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t-2 border-white/20 pt-6 mb-6">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-white/90 text-lg font-medium">Toplam:</span>
                        <div className="text-right">
                          <div className="text-5xl font-bold">₺{500 * duration}</div>
                          <p className="text-white/80 text-sm mt-1">KDV Dahil</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedTime}
                      className="w-full px-6 py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Rezerve Ediliyor...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Rezervasyonu Tamamla
                        </>
                      )}
                    </button>

                    <p className="text-xs text-white/80 text-center mt-4">
                      Rezervasyon yapmakla{' '}
                      <Link href="/iptal-politikasi" className="text-white font-semibold underline hover:text-white/80">
                        iptal koşullarını
                      </Link>{' '}
                      kabul etmiş olursunuz.
                    </p>
                  </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Önemli Bilgi</h4>
                      <p className="text-sm text-blue-800">
                        Rezervasyonunuz onaylandıktan sonra e-posta ile bilgilendirme yapılacaktır. Lütfen spam klasörünüzü kontrol edin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
