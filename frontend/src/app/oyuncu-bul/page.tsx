'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { playerSearchService } from '@/services/player-search.service';
import { authService } from '@/services/auth.service';
import { PlayerSearch } from '@/types/player-search.types';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';

export default function PlayerSearchPage() {
  const router = useRouter();
  const [mySearches, setMySearches] = useState<PlayerSearch[]>([]);
  const [otherSearches, setOtherSearches] = useState<PlayerSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'others'>('others');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    // Authentication kontrolü
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    loadSearches();
  }, [router]);

  const loadSearches = async () => {
    try {
      setLoading(true);

      // Paralel olarak hem kendi aramalarımızı hem diğerlerini çek
      const [mySearchesData, allSearchesData] = await Promise.all([
        playerSearchService.getMySearches(),
        playerSearchService.getAll()
      ]);

      // Benim aramalarım backend'den geldi
      setMySearches(mySearchesData);

      // Diğer aramalar = Tüm aramalar - Benim aramalarım
      const others = allSearchesData.filter(s => s.userId !== currentUser?.userId);
      setOtherSearches(others);
    } catch (error) {
      console.error('Oyuncu aramaları yüklenemedi:', error);
      setError('Oyuncu aramaları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Join modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedSearchForJoin, setSelectedSearchForJoin] = useState<PlayerSearch | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [joiningSearch, setJoiningSearch] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleOpenJoinModal = (search: PlayerSearch) => {
    setSelectedSearchForJoin(search);
    setJoinMessage('');
    setShowJoinModal(true);
  };

  const handleJoinSearch = async () => {
    if (!selectedSearchForJoin) return;

    setJoiningSearch(true);
    try {
      await playerSearchService.join(selectedSearchForJoin.id, joinMessage.trim() ? { message: joinMessage.trim() } : undefined);
      setToast({
        message: 'Katılım isteğiniz başarıyla gönderildi! Organizatör inceleyecektir.',
        type: 'success'
      });
      setShowJoinModal(false);
      setJoinMessage('');
      loadSearches();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Katılım isteği gönderilirken bir hata oluştu',
        type: 'error'
      });
    } finally {
      setJoiningSearch(false);
    }
  };

  // Filter logic
  const getFilteredSearches = (searches: PlayerSearch[]) => {
    return searches.filter(search => {
      if (selectedCity && search.venue?.city !== selectedCity) return false;
      if (selectedDistrict && search.venue?.district !== selectedDistrict) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesVenue = search.venue?.name?.toLowerCase().includes(query);
        const matchesCity = search.venue?.city?.toLowerCase().includes(query);
        const matchesDistrict = search.venue?.district?.toLowerCase().includes(query);
        const matchesDescription = search.description?.toLowerCase().includes(query);
        const matchesOrganizer = search.organizerName?.toLowerCase().includes(query);

        if (!matchesVenue && !matchesCity && !matchesDistrict && !matchesDescription && !matchesOrganizer) {
          return false;
        }
      }

      return true;
    });
  };

  const getUniqueCities = () => {
    const allSearches = [...mySearches, ...otherSearches];
    const cities = allSearches
      .map(s => s.venue?.city)
      .filter((city, index, self) => city && self.indexOf(city) === index);
    return cities as string[];
  };

  const getUniqueDistricts = () => {
    const allSearches = [...mySearches, ...otherSearches];
    let districts = allSearches
      .map(s => s.venue?.district)
      .filter((district, index, self) => district && self.indexOf(district) === index);

    if (selectedCity) {
      districts = allSearches
        .filter(s => s.venue?.city === selectedCity)
        .map(s => s.venue?.district)
        .filter((district, index, self) => district && self.indexOf(district) === index);
    }

    return districts as string[];
  };

  const filteredMySearches = getFilteredSearches(mySearches);
  const filteredOtherSearches = getFilteredSearches(otherSearches);
  const currentSearches = activeTab === 'my' ? filteredMySearches : filteredOtherSearches;

  const getSkillLevelBadge = (level?: string) => {
    if (!level) return null;

    const levelMap: { [key: string]: { text: string; className: string } } = {
      beginner: { text: 'Başlangıç', className: 'bg-green-100 text-green-800' },
      intermediate: { text: 'Orta', className: 'bg-blue-100 text-blue-800' },
      advanced: { text: 'İleri', className: 'bg-purple-100 text-purple-800' },
      professional: { text: 'Profesyonel', className: 'bg-red-100 text-red-800' },
    };

    const levelInfo = levelMap[level] || { text: level, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${levelInfo.className}`}>
        {levelInfo.text}
      </span>
    );
  };

  const renderSearchCard = (search: PlayerSearch, showJoinButton: boolean = true) => {
    const spotsLeft = search.playersNeeded - (search.joinedCount || 0);
    const isFull = spotsLeft <= 0;

    return (
      <div
        key={search.id}
        className={`bg-white rounded-2xl border-2 border-gray-100 hover:border-green-200 transition-all overflow-hidden ${isFull ? 'opacity-60' : ''}`}
      >
        {/* Top Bar with Organizer & Badge */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {search.organizerName || 'Organizatör'}
              </h3>
              {search.organizerElo && (
                <p className="text-sm text-gray-600">ELO: {search.organizerElo}</p>
              )}
            </div>
            {search.preferredSkillLevel && getSkillLevelBadge(search.preferredSkillLevel)}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Venue & Field Info */}
          {search.venue && (
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{search.venue.name}</p>
                  <p className="text-sm text-gray-600">
                    {search.venue.district}, {search.venue.city}
                  </p>
                  {search.field && (
                    <p className="text-xs text-gray-500 mt-1">{search.field.name} • {search.field.fieldType}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Match Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">Tarih</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {new Date(search.matchDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">Saat</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {search.matchTime.substring(0, 5)}
              </p>
            </div>
          </div>

          {/* Players Needed */}
          <div className={`mb-4 px-4 py-3 rounded-xl ${isFull ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'}`}>
            <div className="flex items-center justify-center gap-2">
              <svg className={`w-5 h-5 ${isFull ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={`font-bold ${isFull ? 'text-red-700' : 'text-green-700'}`}>
                {isFull ? 'Dolu' : `${spotsLeft} Kişi Aranıyor`}
              </span>
            </div>
          </div>

          {/* Preferred Positions */}
          {search.preferredPositions && search.preferredPositions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Aranan Pozisyonlar:</p>
              <div className="flex flex-wrap gap-2">
                {search.preferredPositions.map((pos, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {search.description && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-3">{search.description}</p>
            </div>
          )}

          {/* Join Button or My Search Badge */}
          {showJoinButton ? (
            <button
              onClick={() => handleOpenJoinModal(search)}
              disabled={isFull}
              className={`w-full px-5 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg'
              }`}
            >
              {isFull ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Dolu
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Katılma İsteği Gönder
                </>
              )}
            </button>
          ) : (
            <Link href="/rezervasyonlarim">
              <button className="w-full px-5 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                İstekleri Yönet
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Oyuncu aramaları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Oyuncu Bul
          </h2>
          <p className="text-xl text-gray-600">
            Maça katılmak için oyuncu arayanları burada bulabilirsiniz
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-2 inline-flex gap-2">
            <button
              onClick={() => setActiveTab('others')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'others'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Diğer Aramalar ({otherSearches.length})
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'my'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Benim Aramalarım ({mySearches.length})
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tesis, şehir veya organizatör ara..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedDistrict('');
                }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors bg-white"
              >
                <option value="">Tüm Şehirler</option>
                {getUniqueCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">İlçe</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity && getUniqueDistricts().length === 0}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Tüm İlçeler</option>
                {getUniqueDistricts().map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t-2 border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-green-600">{currentSearches.length}</span> oyuncu araması bulundu
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3">
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

        {/* Searches List */}
        {currentSearches.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === 'my' ? 'Henüz oyuncu aramanız yok' : 'Arama sonucu bulunamadı'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'my'
                ? 'Rezervasyonlarınızdan oyuncu araması oluşturabilirsiniz!'
                : 'Farklı filtreler deneyerek yeni aramalar bulabilirsiniz.'}
            </p>
            <Link href="/rezervasyonlarim">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Rezervasyonlarıma Git
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSearches.map((search) => renderSearchCard(search, activeTab === 'others'))}
          </div>
        )}
      </main>

      {/* Join Request Modal */}
      {showJoinModal && selectedSearchForJoin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Katılma İsteği Gönder
                </h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Match Info */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Maç Bilgileri
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {selectedSearchForJoin.venue && (
                    <div className="col-span-2">
                      <p className="text-xs text-green-700 font-medium mb-1">Tesis & Saha</p>
                      <p className="text-sm font-bold text-green-900">
                        {selectedSearchForJoin.venue.name}
                      </p>
                      {selectedSearchForJoin.field && (
                        <p className="text-xs text-green-700">
                          {selectedSearchForJoin.field.name} • {selectedSearchForJoin.field.fieldType}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-green-700 font-medium mb-1">Tarih</p>
                    <p className="text-sm font-bold text-green-900">
                      {new Date(selectedSearchForJoin.matchDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-green-700 font-medium mb-1">Saat</p>
                    <p className="text-sm font-bold text-green-900">
                      {selectedSearchForJoin.matchTime.substring(0, 5)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-green-700 font-medium mb-1">Aranan Oyuncu</p>
                    <p className="text-sm font-bold text-green-900">
                      {selectedSearchForJoin.playersNeeded} Kişi
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-green-700 font-medium mb-1">Organizatör</p>
                    <p className="text-sm font-bold text-green-900">
                      {selectedSearchForJoin.organizerName}
                    </p>
                  </div>
                </div>

                {selectedSearchForJoin.description && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-xs text-green-700 font-medium mb-1">Açıklama</p>
                    <p className="text-sm text-green-900">{selectedSearchForJoin.description}</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Katılım Mesajınız
                  <span className="text-gray-500 font-normal ml-2">(Opsiyonel)</span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Kendinizi tanıtın ve neden katılmak istediğinizi belirtin
                </p>
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Örnek: Merhaba, uzun süredir futbol oynuyorum. Orta saha pozisyonunda oynuyorum ve aramaya katılmak isterim..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors resize-none"
                  maxLength={500}
                />
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>Organizatör mesajınızı görecektir</span>
                  <span>{joinMessage.length}/500</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-blue-900 mb-1">Bilgilendirme</h5>
                    <p className="text-sm text-blue-800">
                      İsteğiniz organizatöre gönderilecektir. Organizatör profilinizi inceleyip isteğinizi onaylayacak veya reddedecektir. Onay sonrasında iletişim bilgileri paylaşılacaktır.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                disabled={joiningSearch}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
              <button
                onClick={handleJoinSearch}
                disabled={joiningSearch}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joiningSearch ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    İstek Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
