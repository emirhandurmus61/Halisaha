'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { authService } from '@/services/auth.service';

interface OpponentListing {
  id: string;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  teamElo: number;
  teamTotalMatches: number;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  title: string;
  description?: string;
  preferredDateStart: string;
  preferredDateEnd: string;
  preferredTimes: string[];
  city?: string;
  district?: string;
  minEloRating?: number;
  maxEloRating?: number;
  matchType: string;
  fieldSize?: string;
  matchDuration: number;
  costSharing: string;
  estimatedCost?: number;
  status: string;
  createdAt: string;
}

interface MatchProposal {
  id: string;
  opponentListingId: string;
  proposerTeamId: string;
  proposerTeamName: string;
  proposerTeamLogo?: string;
  proposerTeamElo?: number;
  proposedBy?: {
    firstName: string;
    lastName: string;
  };
  targetTeamId: string;
  targetTeamName: string;
  targetTeamLogo?: string;
  targetTeamElo?: number;
  proposedDate: string;
  proposedTime: string;
  venueName?: string;
  message?: string;
  matchDuration: number;
  fieldSize?: string;
  costSharing: string;
  estimatedCost?: number;
  status: string;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  listing?: OpponentListing;
}

export default function OpponentSearchPage() {
  const router = useRouter();
  const [listings, setListings] = useState<OpponentListing[]>([]);
  const [myListings, setMyListings] = useState<OpponentListing[]>([]);
  const [sentProposals, setSentProposals] = useState<MatchProposal[]>([]);
  const [receivedProposals, setReceivedProposals] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'sent' | 'received'>('all');

  // Filters
  const [filters, setFilters] = useState({
    city: '',
    district: '',
    matchType: '',
    fieldSize: '',
  });

  // Create Listing Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    preferredDateStart: '',
    preferredDateEnd: '',
    city: '',
    district: '',
    matchType: 'friendly',
    fieldSize: 'halısaha_5',
    matchDuration: 60,
    costSharing: 'split',
    estimatedCost: '',
  });

  // Edit Listing Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListing, setEditingListing] = useState<OpponentListing | null>(null);
  const [updating, setUpdating] = useState(false);

  // Match Proposal Modal
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<OpponentListing | null>(null);
  const [proposalForm, setProposalForm] = useState({
    proposedDate: '',
    proposedTime: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    // Sadece ilanları getir (kimlik doğrulama gerekmez)
    fetchListings();

    // Giriş yapmış kullanıcılar için ekstra veriler
    if (authenticated) {
      checkTeam();
      fetchMyListings();
      fetchSentProposals();
      fetchReceivedProposals();
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchListings();
    }
  }, [filters]);

  const checkTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/teams/my-team`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setHasTeam(data.success && data.data);
    } catch (error) {
      console.error('Check team error:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const queryParams = new URLSearchParams();
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.district) queryParams.append('district', filters.district);
      if (filters.matchType) queryParams.append('matchType', filters.matchType);
      if (filters.fieldSize) queryParams.append('fieldSize', filters.fieldSize);

      // Token isteğe bağlı - giriş yapmamış kullanıcılar da görebilir
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/opponent-search/listings/search?${queryParams}`, {
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setListings(data.data.listings);
      }
    } catch (error) {
      console.error('Fetch listings error:', error);
      setToast({ message: 'İlanlar yüklenirken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/listings/my-team`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMyListings(data.data);
      }
    } catch (error) {
      console.error('Fetch my listings error:', error);
    }
  };

  const fetchSentProposals = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/proposals/sent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSentProposals(data.data);
      }
    } catch (error) {
      console.error('Fetch sent proposals error:', error);
    }
  };

  const fetchReceivedProposals = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/proposals/received`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setReceivedProposals(data.data);
      }
    } catch (error) {
      console.error('Fetch received proposals error:', error);
    }
  };

  const handleCreateListing = async () => {
    if (!listingForm.title || !listingForm.preferredDateStart || !listingForm.preferredDateEnd) {
      setToast({ message: 'Lütfen zorunlu alanları doldurun', type: 'error' });
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/listings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingForm),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'İlan başarıyla oluşturuldu!', type: 'success' });
        setShowCreateModal(false);
        setListingForm({
          title: '',
          description: '',
          preferredDateStart: '',
          preferredDateEnd: '',
          city: '',
          district: '',
          matchType: 'friendly',
          fieldSize: 'halısaha_5',
          matchDuration: 60,
          costSharing: 'split',
          estimatedCost: '',
        });
        fetchListings();
        fetchMyListings();
        setActiveTab('mine'); // Switch to "my listings" tab
      } else {
        setToast({ message: data.message || 'İlan oluşturulamadı', type: 'error' });
      }
    } catch (error) {
      console.error('Create listing error:', error);
      setToast({ message: 'İlan oluşturulurken hata oluştu', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditListing = (listing: OpponentListing) => {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description || '',
      preferredDateStart: listing.preferredDateStart ? listing.preferredDateStart.split('T')[0] : '',
      preferredDateEnd: listing.preferredDateEnd ? listing.preferredDateEnd.split('T')[0] : '',
      city: listing.city || '',
      district: listing.district || '',
      matchType: listing.matchType,
      fieldSize: listing.fieldSize || 'halısaha_5',
      matchDuration: listing.matchDuration,
      costSharing: listing.costSharing,
      estimatedCost: listing.estimatedCost?.toString() || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateListing = async () => {
    if (!editingListing) return;

    if (!listingForm.title || !listingForm.preferredDateStart || !listingForm.preferredDateEnd) {
      setToast({ message: 'Lütfen zorunlu alanları doldurun', type: 'error' });
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingForm),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'İlan başarıyla güncellendi!', type: 'success' });
        setShowEditModal(false);
        setEditingListing(null);
        setListingForm({
          title: '',
          description: '',
          preferredDateStart: '',
          preferredDateEnd: '',
          city: '',
          district: '',
          matchType: 'friendly',
          fieldSize: 'halısaha_5',
          matchDuration: 60,
          costSharing: 'split',
          estimatedCost: '',
        });
        fetchListings();
        fetchMyListings();
      } else {
        setToast({ message: data.message || 'İlan güncellenemedi', type: 'error' });
      }
    } catch (error) {
      console.error('Update listing error:', error);
      setToast({ message: 'İlan güncellenirken hata oluştu', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendProposal = async () => {
    if (!selectedListing || !proposalForm.proposedDate || !proposalForm.proposedTime) {
      setToast({ message: 'Lütfen tarih ve saat seçin', type: 'error' });
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/proposals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opponentListingId: selectedListing.id,
          targetTeamId: selectedListing.teamId,
          proposedDate: proposalForm.proposedDate,
          proposedTime: proposalForm.proposedTime,
          message: proposalForm.message,
          matchDuration: selectedListing.matchDuration,
          fieldSize: selectedListing.fieldSize,
          costSharing: selectedListing.costSharing,
          estimatedCost: selectedListing.estimatedCost,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Maç teklifi başarıyla gönderildi!', type: 'success' });
        setShowProposalModal(false);
        setSelectedListing(null);
        setProposalForm({ proposedDate: '', proposedTime: '', message: '' });
      } else {
        setToast({ message: data.message || 'Maç teklifi gönderilemedi', type: 'error' });
      }
    } catch (error) {
      console.error('Send proposal error:', error);
      setToast({ message: 'Maç teklifi gönderilirken hata oluştu', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  const matchTypeLabels: Record<string, string> = {
    friendly: 'Dostluk',
    competitive: 'Rekabetçi',
    tournament: 'Turnuva',
  };

  const fieldSizeLabels: Record<string, string> = {
    'halısaha_5': '5\'lik Halısaha',
    'halısaha_7': '7\'lik Halısaha',
    'halısaha_8': '8\'lik Halısaha',
    'halısaha_11': '11\'lik Halısaha',
  };

  const costSharingLabels: Record<string, string> = {
    split: 'Yarı Yarıya',
    home_pays: 'Ev Sahibi Öder',
    away_pays: 'Deplasman Öder',
    free: 'Ücretsiz',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Rakip Bul</h1>
            <p className="text-sm sm:text-base text-gray-600">Takımınız için uygun rakipler bulun ve maç teklifleri gönderin</p>
          </div>

          {isAuthenticated && hasTeam && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">İlan Oluştur</span>
              <span className="sm:hidden">Oluştur</span>
            </button>
          )}
        </div>

        {/* Info messages */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">Giriş Yapın</h3>
                <p className="text-sm sm:text-base text-blue-700">İlanları görüntüleyebilirsiniz. Maç teklifi göndermek için giriş yapmalısınız.</p>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && !hasTeam && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-1">Takım Gerekli</h3>
                <p className="text-sm sm:text-base text-yellow-700">Rakip arama ilanı oluşturmak ve maç teklifi göndermek için bir takıma sahip olmalısınız.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 md:px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="hidden sm:inline">Tüm İlanlar</span>
            <span className="sm:hidden">İlanlar</span>
            <span className="ml-1">({listings.length})</span>
          </button>
          {isAuthenticated && hasTeam && (
            <>
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-4 md:px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'mine'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                İlanlarım ({myListings.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 md:px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'sent'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">Gönderilen Teklifler</span>
                <span className="sm:hidden">Gönderilen</span>
                <span className="ml-1">({sentProposals.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 md:px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'received'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">Gelen Teklifler</span>
                <span className="sm:hidden">Gelen</span>
                <span className="ml-1">({receivedProposals.length})</span>
              </button>
            </>
          )}
        </div>

        {/* Filters - Only show on "all" tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Filtrele</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Şehir (örn: Trabzon)"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="İlçe"
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
              />
              <select
                value={filters.matchType}
                onChange={(e) => setFilters({ ...filters, matchType: e.target.value })}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
              >
                <option value="">Tüm Maç Tipleri</option>
                <option value="friendly">Dostluk</option>
                <option value="competitive">Rekabetçi</option>
                <option value="tournament">Turnuva</option>
              </select>
              <select
                value={filters.fieldSize}
                onChange={(e) => setFilters({ ...filters, fieldSize: e.target.value })}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
              >
                <option value="">Tüm Saha Boyutları</option>
                <option value="halısaha_5">5'lik</option>
                <option value="halısaha_7">7'lik</option>
                <option value="halısaha_8">8'lik</option>
                <option value="halısaha_11">11'lik</option>
              </select>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {activeTab === 'all' && (
          <>
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz İlan Yok</h3>
                <p className="text-gray-600">Filtreleri değiştirmeyi deneyin veya ilk ilanı siz oluşturun</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-green-200 flex flex-col h-auto min-h-[400px]"
              >
                {/* Team Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    {listing.teamLogo ? (
                      <img
                        src={`${backendUrl}${listing.teamLogo}`}
                        alt={listing.teamName}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{listing.teamName}</h3>
                      <div className="flex items-center gap-3 text-sm opacity-90 mt-1">
                        <span>ELO: {listing.teamElo}</span>
                        <span>•</span>
                        <span>{listing.teamTotalMatches} Maç</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Listing Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{listing.title}</h4>
                  {listing.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(listing.preferredDateStart).toLocaleDateString('tr-TR')} - {new Date(listing.preferredDateEnd).toLocaleDateString('tr-TR')}</span>
                    </div>

                    {listing.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{listing.city}{listing.district && `, ${listing.district}`}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {matchTypeLabels[listing.matchType] || listing.matchType}
                      </span>
                      {listing.fieldSize && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {fieldSizeLabels[listing.fieldSize] || listing.fieldSize}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{costSharingLabels[listing.costSharing]}</span>
                      {listing.estimatedCost && <span className="font-semibold">({listing.estimatedCost} ₺)</span>}
                    </div>
                  </div>

                  <div className="mt-auto pt-3">
                    <button
                      onClick={() => {
                        // Giriş kontrolü
                        if (!isAuthenticated) {
                          setToast({ message: 'Teklif göndermek için giriş yapmalısınız', type: 'info' });
                          setTimeout(() => router.push('/giris'), 1500);
                          return;
                        }

                        // Takım kontrolü
                        if (!hasTeam) {
                          setToast({ message: 'Teklif göndermek için bir takıma sahip olmalısınız', type: 'error' });
                          return;
                        }

                        setSelectedListing(listing);
                        setShowProposalModal(true);
                      }}
                      className="w-full px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Maç Teklifi Gönder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {/* My Listings */}
        {activeTab === 'mine' && (
          <>
            {myListings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz İlanınız Yok</h3>
                <p className="text-gray-600 mb-4">Rakip arama ilanı oluşturarak başlayın</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  İlan Oluştur
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-green-200 flex flex-col h-auto min-h-[400px]"
                  >
                    {/* Team Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        {listing.teamLogo ? (
                          <img
                            src={`${backendUrl}${listing.teamLogo}`}
                            alt={listing.teamName}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-white/30"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{listing.teamName}</h3>
                          <div className="flex items-center gap-3 text-sm opacity-90 mt-1">
                            <span>ELO: {listing.teamElo}</span>
                            <span>•</span>
                            <span>{listing.teamTotalMatches} Maç</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Listing Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{listing.title}</h4>
                      {listing.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                      )}

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(listing.preferredDateStart).toLocaleDateString('tr-TR')} - {new Date(listing.preferredDateEnd).toLocaleDateString('tr-TR')}</span>
                        </div>

                        {listing.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{listing.city}{listing.district && `, ${listing.district}`}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            {matchTypeLabels[listing.matchType] || listing.matchType}
                          </span>
                          {listing.fieldSize && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {fieldSizeLabels[listing.fieldSize] || listing.fieldSize}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status === 'active' ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        İlan tarihi: {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
                      </div>

                      <div className="mt-auto space-y-2">
                        <button
                          onClick={() => router.push('/mac-teklifleri')}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Gelen Teklifleri Görüntüle
                        </button>
                        <button
                          onClick={() => handleEditListing(listing)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          İlanı Düzenle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sent Proposals */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentProposals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Teklif Göndermediniz</h3>
                <p className="text-gray-600">İlanlara göz atın ve maç teklifi gönderin</p>
              </div>
            ) : (
              sentProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-green-200"
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      {/* Team Info */}
                      <div className="flex items-center gap-4">
                        {proposal.targetTeamLogo ? (
                          <img
                            src={`${backendUrl}${proposal.targetTeamLogo}`}
                            alt={proposal.targetTeamName}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-green-500"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">{proposal.targetTeamName}</h3>
                          <p className="text-sm text-gray-600">Teklif Gönderildi</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${
                        proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {proposal.status === 'pending' ? 'Beklemede' :
                         proposal.status === 'accepted' ? 'Kabul Edildi' :
                         'Reddedildi'}
                      </span>
                    </div>

                    {/* Proposal Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Tarih</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(proposal.proposedDate).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Saat</div>
                        <div className="font-semibold text-gray-900">{proposal.proposedTime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Süre</div>
                        <div className="font-semibold text-gray-900">{proposal.matchDuration} dk</div>
                      </div>
                      {proposal.fieldSize && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Saha</div>
                          <div className="font-semibold text-gray-900">{fieldSizeLabels[proposal.fieldSize] || proposal.fieldSize}</div>
                        </div>
                      )}
                    </div>

                    {proposal.message && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Mesaj:</div>
                        <p className="text-gray-700">{proposal.message}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Gönderim: {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Received Proposals */}
        {activeTab === 'received' && (
          <div className="space-y-4">
            {receivedProposals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Teklif Almadınız</h3>
                <p className="text-gray-600">İlan oluşturun ve teklifleri bekleyin</p>
              </div>
            ) : (
              receivedProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-green-200"
                >
                  <div className="p-6">
                    {/* Team Header with Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      {/* Team Info */}
                      <div className="flex items-start gap-4">
                        {proposal.proposerTeamLogo ? (
                          <img
                            src={`${backendUrl}${proposal.proposerTeamLogo}`}
                            alt={proposal.proposerTeamName}
                            className="w-20 h-20 rounded-xl object-cover border-2 border-green-500"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-2xl text-gray-900 mb-1">{proposal.proposerTeamName}</h3>
                          {proposal.proposerTeamElo && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                                ELO: {proposal.proposerTeamElo}
                              </span>
                            </div>
                          )}
                          {proposal.proposedBy && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span>
                                <span className="font-medium">Gönderen:</span> {proposal.proposedBy.firstName} {proposal.proposedBy.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${
                        proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {proposal.status === 'pending' ? 'Beklemede' :
                         proposal.status === 'accepted' ? 'Kabul Edildi' :
                         'Reddedildi'}
                      </span>
                    </div>

                    {/* Proposal Details */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Teklif Detayları</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Tarih
                          </div>
                          <div className="font-semibold text-gray-900">
                            {new Date(proposal.proposedDate).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Saat
                          </div>
                          <div className="font-semibold text-gray-900">{proposal.proposedTime}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Süre</div>
                          <div className="font-semibold text-gray-900">{proposal.matchDuration} dk</div>
                        </div>
                        {proposal.fieldSize && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Saha</div>
                            <div className="font-semibold text-gray-900">{fieldSizeLabels[proposal.fieldSize] || proposal.fieldSize}</div>
                          </div>
                        )}
                        {proposal.venueName && (
                          <div className="col-span-2">
                            <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Saha
                            </div>
                            <div className="font-semibold text-gray-900">{proposal.venueName}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Maliyet Paylaşımı</div>
                          <div className="font-semibold text-gray-900">{costSharingLabels[proposal.costSharing]}</div>
                        </div>
                        {proposal.estimatedCost && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Tahmini Maliyet</div>
                            <div className="font-semibold text-gray-900">{proposal.estimatedCost} ₺</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {proposal.message && (
                      <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <div className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          Mesaj
                        </div>
                        <p className="text-gray-700">{proposal.message}</p>
                      </div>
                    )}

                    {/* Response */}
                    {proposal.status === 'pending' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
                              const response = await fetch(`${apiUrl}/opponent-search/proposals/${proposal.id}/respond`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ response: 'rejected' }),
                              });
                              const data = await response.json();
                              if (data.success) {
                                setToast({ message: 'Teklif reddedildi', type: 'info' });
                                fetchReceivedProposals();
                              }
                            } catch (error) {
                              setToast({ message: 'Hata oluştu', type: 'error' });
                            }
                          }}
                          className="flex-1 px-6 py-3 border-2 border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-all"
                        >
                          Reddet
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
                              const response = await fetch(`${apiUrl}/opponent-search/proposals/${proposal.id}/respond`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ response: 'accepted' }),
                              });
                              const data = await response.json();
                              if (data.success) {
                                setToast({ message: 'Teklif kabul edildi!', type: 'success' });
                                fetchReceivedProposals();
                              }
                            } catch (error) {
                              setToast({ message: 'Hata oluştu', type: 'error' });
                            }
                          }}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                          Kabul Et
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Rakip Arama İlanı Oluştur</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  placeholder="Rakip Lazım Gün Saat Farketmez"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Açıklama</label>
                <textarea
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  placeholder="Dostluk temelli bir maç yapmak isiteyenler gelsin"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={listingForm.preferredDateStart}
                    onChange={(e) => setListingForm({ ...listingForm, preferredDateStart: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={listingForm.preferredDateEnd}
                    onChange={(e) => setListingForm({ ...listingForm, preferredDateEnd: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şehir</label>
                  <input
                    type="text"
                    value={listingForm.city}
                    onChange={(e) => setListingForm({ ...listingForm, city: e.target.value })}
                    placeholder="İstanbul"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">İlçe</label>
                  <input
                    type="text"
                    value={listingForm.district}
                    onChange={(e) => setListingForm({ ...listingForm, district: e.target.value })}
                    placeholder="Kadıköy"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Maç Tipi</label>
                  <select
                    value={listingForm.matchType}
                    onChange={(e) => setListingForm({ ...listingForm, matchType: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="friendly">Dostluk</option>
                    <option value="competitive">Rekabetçi</option>
                    <option value="tournament">Turnuva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Saha Boyutu</label>
                  <select
                    value={listingForm.fieldSize}
                    onChange={(e) => setListingForm({ ...listingForm, fieldSize: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="halısaha_5">5&apos;lik Halısaha</option>
                    <option value="halısaha_7">7&apos;lik Halısaha</option>
                    <option value="halısaha_8">8&apos;lik Halısaha</option>
                    <option value="halısaha_11">11&apos;lik Halısaha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Maç Süresi (dk)</label>
                  <input
                    type="number"
                    value={listingForm.matchDuration}
                    onChange={(e) => setListingForm({ ...listingForm, matchDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tahmini Maliyet (₺)</label>
                  <input
                    type="number"
                    value={listingForm.estimatedCost}
                    onChange={(e) => setListingForm({ ...listingForm, estimatedCost: e.target.value })}
                    placeholder="200"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Maliyet Paylaşımı</label>
                <select
                  value={listingForm.costSharing}
                  onChange={(e) => setListingForm({ ...listingForm, costSharing: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                >
                  <option value="split">Yarı Yarıya</option>
                  <option value="home_pays">Ev Sahibi Öder</option>
                  <option value="away_pays">Deplasman Öder</option>
                  <option value="free">Ücretsiz</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-5 py-3 text-sm border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                disabled={creating}
              >
                İptal
              </button>
              <button
                onClick={handleCreateListing}
                disabled={creating}
                className="flex-1 px-5 py-3 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {creating ? 'Oluşturuluyor...' : 'İlanı Yayınla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditModal && editingListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">İlanı Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingListing(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  placeholder="Örn: Cumartesi günü rakip arıyoruz"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  placeholder="İlan detayları..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={listingForm.preferredDateStart}
                    onChange={(e) => setListingForm({ ...listingForm, preferredDateStart: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={listingForm.preferredDateEnd}
                    onChange={(e) => setListingForm({ ...listingForm, preferredDateEnd: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Şehir</label>
                  <input
                    type="text"
                    value={listingForm.city}
                    onChange={(e) => setListingForm({ ...listingForm, city: e.target.value })}
                    placeholder="İstanbul"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">İlçe</label>
                  <input
                    type="text"
                    value={listingForm.district}
                    onChange={(e) => setListingForm({ ...listingForm, district: e.target.value })}
                    placeholder="Kadıköy"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maç Tipi</label>
                  <select
                    value={listingForm.matchType}
                    onChange={(e) => setListingForm({ ...listingForm, matchType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="friendly">Dostluk</option>
                    <option value="competitive">Rekabetçi</option>
                    <option value="tournament">Turnuva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Saha Boyutu</label>
                  <select
                    value={listingForm.fieldSize}
                    onChange={(e) => setListingForm({ ...listingForm, fieldSize: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="halısaha_5">5&apos;lik Halısaha</option>
                    <option value="halısaha_7">7&apos;lik Halısaha</option>
                    <option value="halısaha_8">8&apos;lik Halısaha</option>
                    <option value="halısaha_11">11&apos;lik Halısaha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maç Süresi (dk)</label>
                  <input
                    type="number"
                    value={listingForm.matchDuration}
                    onChange={(e) => setListingForm({ ...listingForm, matchDuration: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tahmini Maliyet (₺)</label>
                  <input
                    type="number"
                    value={listingForm.estimatedCost}
                    onChange={(e) => setListingForm({ ...listingForm, estimatedCost: e.target.value })}
                    placeholder="200"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Maliyet Paylaşımı</label>
                <select
                  value={listingForm.costSharing}
                  onChange={(e) => setListingForm({ ...listingForm, costSharing: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                >
                  <option value="split">Yarı Yarıya</option>
                  <option value="home_pays">Ev Sahibi Öder</option>
                  <option value="away_pays">Deplasman Öder</option>
                  <option value="free">Ücretsiz</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingListing(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                disabled={updating}
              >
                İptal
              </button>
              <button
                onClick={handleUpdateListing}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {updating ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Proposal Modal */}
      {showProposalModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Maç Teklifi Gönder</h3>
              <button
                onClick={() => {
                  setShowProposalModal(false);
                  setSelectedListing(null);
                  setProposalForm({ proposedDate: '', proposedTime: '', message: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div className="font-bold text-gray-900 mb-1">{selectedListing.teamName}</div>
              <div className="text-sm text-gray-600">{selectedListing.title}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={proposalForm.proposedDate}
                  onChange={(e) => setProposalForm({ ...proposalForm, proposedDate: e.target.value })}
                  min={selectedListing.preferredDateStart}
                  max={selectedListing.preferredDateEnd}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Saat <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {['16:00', '17:00', '18:00', '19:00',
                    '20:00', '21:00', '22:00', '23:00',
                    '00:00', '01:00', '02:00', '03:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setProposalForm({ ...proposalForm, proposedTime: time })}
                      className={`relative px-4 py-3 rounded-xl font-semibold text-base transition-all ${
                        proposalForm.proposedTime === time
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-400 hover:shadow-md'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mesaj</label>
                <textarea
                  value={proposalForm.message}
                  onChange={(e) => setProposalForm({ ...proposalForm, message: e.target.value })}
                  placeholder="Teklif ile ilgili notlarınız..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowProposalModal(false);
                  setSelectedListing(null);
                  setProposalForm({ proposedDate: '', proposedTime: '', message: '' });
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                disabled={sending}
              >
                İptal
              </button>
              <button
                onClick={handleSendProposal}
                disabled={sending}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {sending ? 'Gönderiliyor...' : 'Gönder'}
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
