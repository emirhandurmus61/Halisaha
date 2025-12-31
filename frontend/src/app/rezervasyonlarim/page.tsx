'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reservationService } from '@/services/reservation.service';
import { playerSearchService } from '@/services/player-search.service';
import { authService } from '@/services/auth.service';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';

interface Reservation {
  id: string;
  fieldId: string;
  userId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  teamName?: string;
  createdAt: string;
  field?: {
    name: string;
    fieldType: string;
  };
  venue?: {
    name: string;
    address: string;
  };
}

export default function MyReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Player search modal states
  const [showPlayerSearchModal, setShowPlayerSearchModal] = useState(false);
  const [selectedReservationForSearch, setSelectedReservationForSearch] = useState<Reservation | null>(null);
  const [playersNeeded, setPlayersNeeded] = useState(1);
  const [description, setDescription] = useState('');
  const [preferredPositions, setPreferredPositions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Requests modal states
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedReservationForRequests, setSelectedReservationForRequests] = useState<Reservation | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Profile detail modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Authentication kontrolü
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    loadReservations();
  }, [router]);

  const loadReservations = async () => {
    try {
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch (error) {
      console.error('Rezervasyonlar yüklenemedi:', error);
      setError('Rezervasyonlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await reservationService.cancel(reservationId);
      alert('Rezervasyon başarıyla iptal edildi');
      loadReservations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Rezervasyon iptal edilemedi');
    }
  };

  const handleOpenPlayerSearchModal = (reservation: Reservation) => {
    setSelectedReservationForSearch(reservation);
    setShowPlayerSearchModal(true);
  };

  const handleOpenRequestsModal = async (reservation: Reservation) => {
    setSelectedReservationForRequests(reservation);
    setShowRequestsModal(true);
    setLoadingRequests(true);

    try {
      const requestsData = await playerSearchService.getPendingRequests(reservation.id);
      setRequests(requestsData);
    } catch (error) {
      console.error('İstekler yüklenemedi:', error);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await playerSearchService.acceptRequest(requestId);
      setToast({
        message: 'İstek başarıyla kabul edildi!',
        type: 'success'
      });
      // Reload requests
      if (selectedReservationForRequests) {
        const requestsData = await playerSearchService.getPendingRequests(selectedReservationForRequests.id);
        setRequests(requestsData);
      }
      // Close profile modal if open
      setShowProfileModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'İstek kabul edilemedi',
        type: 'error'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await playerSearchService.rejectRequest(requestId);
      setToast({
        message: 'İstek reddedildi',
        type: 'info'
      });
      // Reload requests
      if (selectedReservationForRequests) {
        const requestsData = await playerSearchService.getPendingRequests(selectedReservationForRequests.id);
        setRequests(requestsData);
      }
      // Close profile modal if open
      setShowProfileModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'İstek reddedilemedi',
        type: 'error'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleOpenProfileModal = (request: any) => {
    setSelectedRequest(request);
    setShowProfileModal(true);
  };

  const handleContactPlayer = (request: any) => {
    if (request.user?.phone) {
      window.open(`https://wa.me/${request.user.phone.replace(/\D/g, '')}`, '_blank');
    } else {
      setToast({
        message: 'Kullanıcının telefon numarası bulunamadı',
        type: 'error'
      });
    }
  };

  const handleCreatePlayerSearch = async () => {
    if (!selectedReservationForSearch || playersNeeded < 1 || !description.trim()) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    setSubmitting(true);
    try {
      await playerSearchService.create({
        reservationId: selectedReservationForSearch.id,
        playersNeeded,
        description: description.trim(),
        preferredPositions: preferredPositions.length > 0 ? preferredPositions : undefined,
      });

      alert('Oyuncu aramanız başarıyla oluşturuldu!');
      setShowPlayerSearchModal(false);
      resetPlayerSearchForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Oyuncu araması oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPlayerSearchForm = () => {
    setSelectedReservationForSearch(null);
    setPlayersNeeded(1);
    setDescription('');
    setPreferredPositions([]);
  };

  const togglePosition = (position: string) => {
    setPreferredPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; className: string; icon: string } } = {
      pending: {
        text: 'Beklemede',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳'
      },
      confirmed: {
        text: 'Onaylandı',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✓'
      },
      cancelled: {
        text: 'İptal Edildi',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: '✕'
      },
      completed: {
        text: 'Tamamlandı',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '✓'
      },
      no_show: {
        text: 'Gelmedi',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '⊘'
      },
    };

    const statusInfo = statusMap[status] || {
      text: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '•'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border ${statusInfo.className}`}>
        <span>{statusInfo.icon}</span>
        {statusInfo.text}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const paymentMap: { [key: string]: { text: string; className: string } } = {
      pending: { text: 'Ödeme Bekliyor', className: 'bg-orange-100 text-orange-800' },
      paid: { text: 'Ödendi', className: 'bg-green-100 text-green-800' },
      refunded: { text: 'İade Edildi', className: 'bg-purple-100 text-purple-800' },
      failed: { text: 'Başarısız', className: 'bg-red-100 text-red-800' },
    };

    const paymentInfo = paymentMap[paymentStatus] || {
      text: paymentStatus,
      className: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${paymentInfo.className}`}>
        {paymentInfo.text}
      </span>
    );
  };

  const isPastReservation = (date: string, endTime: string) => {
    if (!date || !endTime) return false;
    try {
      // date formatı: "YYYY-MM-DD", endTime formatı: "HH:MM:SS"
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = endTime.split(':').map(Number);

      if (!year || !month || !day || hours === undefined || minutes === undefined) return false;

      const reservationDateTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();

      return reservationDateTime < now;
    } catch {
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih Belirtilmemiş';
    try {
      // dateString zaten "YYYY-MM-DD" formatında geliyor
      const [year, month, day] = dateString.split('-').map(Number);
      if (!year || !month || !day) return 'Geçersiz Tarih';

      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return 'Geçersiz Tarih';

      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Geçersiz Tarih';
    }
  };

  const canCancelReservation = (reservation: Reservation) => {
    return (
      reservation.status === 'pending' || reservation.status === 'confirmed'
    ) && !isPastReservation(reservation.reservationDate, reservation.endTime);
  };

  const getFilteredReservations = () => {
    if (filter === 'upcoming') {
      return reservations.filter(r => !isPastReservation(r.reservationDate, r.endTime));
    }
    if (filter === 'past') {
      return reservations.filter(r => isPastReservation(r.reservationDate, r.endTime));
    }
    return reservations;
  };

  const filteredReservations = getFilteredReservations();
  const upcomingCount = reservations.filter(r => !isPastReservation(r.reservationDate, r.endTime)).length;
  const pastCount = reservations.filter(r => isPastReservation(r.reservationDate, r.endTime)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Rezervasyonlar yükleniyor...</p>
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
            Rezervasyonlarım
          </h2>
          <p className="text-xl text-gray-600">
            Geçmiş ve gelecek rezervasyonlarınızı buradan yönetebilirsiniz
          </p>
        </div>

        {/* Stats Overview - Modern Minimal Design */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Reservations */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Toplam Rezervasyon</p>
              <p className="text-3xl font-bold text-gray-900">{reservations.length}</p>
            </div>

            {/* Upcoming Reservations */}
            <div className="text-center sm:text-left border-l-0 sm:border-l-2 sm:border-gray-100 sm:pl-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Gelecek Rezervasyonlar</p>
              <p className="text-3xl font-bold text-blue-600">{upcomingCount}</p>
            </div>

            {/* Past Reservations */}
            <div className="text-center sm:text-left border-l-0 sm:border-l-2 sm:border-gray-100 sm:pl-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">Geçmiş Rezervasyonlar</p>
              <p className="text-3xl font-bold text-gray-600">{pastCount}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs - Minimal Design */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all border-2 ${
              filter === 'all'
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tümü
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-bold ${
              filter === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {reservations.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all border-2 ${
              filter === 'upcoming'
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Gelecek
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-bold ${
              filter === 'upcoming'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {upcomingCount}
            </span>
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all border-2 ${
              filter === 'past'
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Geçmiş
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-bold ${
              filter === 'past'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {pastCount}
            </span>
          </button>
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

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'upcoming' ? 'Gelecek rezervasyon yok' :
               filter === 'past' ? 'Geçmiş rezervasyon yok' :
               'Henüz rezervasyon yok'}
            </h3>
            <p className="text-gray-600 mb-6">
              Hemen bir saha rezerve ederek maç planlamaya başlayın!
            </p>
            <Link href="/sahalar">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Sahalara Gözat
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((reservation) => {
              const isPast = isPastReservation(reservation.reservationDate, reservation.endTime);
              const canCancel = canCancelReservation(reservation);

              return (
                <div
                  key={reservation.id}
                  className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-green-200 transition-all overflow-hidden"
                >
                  {/* Top Bar with Status */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {reservation.venue?.name || 'Tesis Adı'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {reservation.field?.name || 'Saha Adı'} • {reservation.field?.fieldType || ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {getStatusBadge(reservation.status)}
                        {getPaymentBadge(reservation.paymentStatus)}
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Info Grid */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Date */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs font-medium">Tarih</span>
                            </div>
                            <p className="text-base font-bold text-gray-900">
                              {formatDate(reservation.reservationDate)}
                            </p>
                          </div>

                          {/* Time */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-medium">Saat</span>
                            </div>
                            <p className="text-base font-bold text-gray-900">
                              {reservation.startTime.substring(0, 5)} - {reservation.endTime.substring(0, 5)}
                            </p>
                          </div>

                          {/* Team Name */}
                          {reservation.teamName && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-xs font-medium">Takım</span>
                              </div>
                              <p className="text-base font-bold text-gray-900 truncate">{reservation.teamName}</p>
                            </div>
                          )}

                          {/* Price */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-green-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="text-xs font-medium">Tutar</span>
                            </div>
                            <p className="text-xl font-bold text-green-600">₺{reservation.totalPrice}</p>
                          </div>
                        </div>

                        {isPast && (
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Rezervasyon tarihi geçmiş</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:flex-wrap">
                        {!isPast && (reservation.status === 'confirmed' || reservation.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handleOpenPlayerSearchModal(reservation)}
                              className="w-full lg:w-auto px-4 py-2.5 border-2 border-green-200 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="whitespace-nowrap">Oyuncu Bul</span>
                            </button>
                            <button
                              onClick={() => handleOpenRequestsModal(reservation)}
                              className="w-full lg:w-auto px-4 py-2.5 border-2 border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm relative"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="whitespace-nowrap">İstekleri Gör</span>
                            </button>
                          </>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="w-full lg:w-auto px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="whitespace-nowrap">İptal Et</span>
                          </button>
                        )}
                        <Link href={`/sahalar/${reservation.fieldId}`} className="w-full lg:w-auto">
                          <button className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="whitespace-nowrap">Detaylar</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Player Search Modal */}
      {showPlayerSearchModal && selectedReservationForSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Oyuncu Araması Oluştur</h3>
                  <p className="text-sm text-gray-600 mt-1">Bu rezervasyonunuz için oyuncu arayın</p>
                </div>
                <button
                  onClick={() => {
                    setShowPlayerSearchModal(false);
                    resetPlayerSearchForm();
                  }}
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Reservation Info Display */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Rezervasyon Bilgileri
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700 font-medium">Tesis & Saha</p>
                    <p className="text-sm font-bold text-green-900">{selectedReservationForSearch.venue?.name} - {selectedReservationForSearch.field?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium">Tarih</p>
                    <p className="text-sm font-bold text-green-900">
                      {new Date(selectedReservationForSearch.reservationDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium">Saat</p>
                    <p className="text-sm font-bold text-green-900">
                      {selectedReservationForSearch.startTime.substring(0, 5)} - {selectedReservationForSearch.endTime.substring(0, 5)}
                    </p>
                  </div>
                  {selectedReservationForSearch.teamName && (
                    <div>
                      <p className="text-xs text-green-700 font-medium">Takım</p>
                      <p className="text-sm font-bold text-green-900">{selectedReservationForSearch.teamName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Players Needed */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Kaç Kişi Aranıyor? <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={playersNeeded}
                  onChange={(e) => setPlayersNeeded(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Örn: 3"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Açıklama <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Nasıl oyuncular arıyorsunuz? Oyunculara ne söylemek istersiniz?</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors resize-none"
                  placeholder="Örn: Rahat bir maç için 2 oyuncu arıyoruz. Seviye orta düzey olabilir. Arkadaşça bir ortam istiyoruz."
                />
                <p className="text-xs text-gray-500 mt-2">{description.length} karakter</p>
              </div>

              {/* Preferred Positions */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Aranan Pozisyonlar (Opsiyonel)
                </label>
                <p className="text-xs text-gray-600 mb-3">Hangi pozisyonlar için oyuncu arıyorsunuz?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Kaleci', 'Defans', 'Orta Saha', 'Forvet'].map((position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => togglePosition(position)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                        preferredPositions.includes(position)
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {position}
                    </button>
                  ))}
                </div>
                {preferredPositions.length > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    {preferredPositions.length} pozisyon seçildi
                  </p>
                )}
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-1">Bilgi</h4>
                    <p className="text-sm text-blue-800">
                      Aramanız "Oyuncu Bul" sayfasında yayınlanacak. Diğer kullanıcılar aramanızı görerek katılma isteği gönderebilecek.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowPlayerSearchModal(false);
                  resetPlayerSearchForm();
                }}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleCreatePlayerSearch}
                disabled={submitting || playersNeeded < 1 || !description.trim()}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aramayı Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Modal */}
      {showRequestsModal && selectedReservationForRequests && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Katılım İstekleri</h3>
                  <p className="text-sm text-green-50 mt-1">
                    {selectedReservationForRequests.venue?.name} - {selectedReservationForRequests.field?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingRequests ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 font-medium">İstekler yükleniyor...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Henüz İstek Yok</h4>
                  <p className="text-gray-600">Bu rezervasyon için henüz katılım isteği gönderilmemiş.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => {
                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'pending':
                          return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-200">⏳ Beklemede</span>;
                        case 'accepted':
                          return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-800 border-2 border-green-200">✓ Kabul Edildi</span>;
                        case 'rejected':
                          return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-800 border-2 border-red-200">✕ Reddedildi</span>;
                        default:
                          return null;
                      }
                    };

                    return (
                      <div
                        key={request.id}
                        onClick={() => handleOpenProfileModal(request)}
                        className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
                              {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">{request.user?.name || 'İsimsiz Kullanıcı'}</h4>
                              <p className="text-sm text-gray-600">{request.user?.email || 'Email yok'}</p>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {request.message && (
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-blue-900 line-clamp-2">{request.message}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium group-hover:text-green-600 transition-colors">Detayları görüntüle</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-100">
              <button
                onClick={() => setShowRequestsModal(false)}
                className="w-full px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {showProfileModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white/30">
                    {selectedRequest.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {selectedRequest.user?.name || 'İsimsiz Kullanıcı'}
                    </h3>
                    <p className="text-sm text-green-50">{selectedRequest.user?.email || 'Email yok'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                {selectedRequest.status === 'pending' && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-200">
                    ⏳ İstek Beklemede
                  </span>
                )}
                {selectedRequest.status === 'accepted' && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-100 text-green-800 border-2 border-green-200">
                    ✓ İstek Kabul Edildi
                  </span>
                )}
                {selectedRequest.status === 'rejected' && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-100 text-red-800 border-2 border-red-200">
                    ✕ İstek Reddedildi
                  </span>
                )}
              </div>

              {/* Player Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Oyuncu Bilgileri
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <p className="text-xs text-green-700 font-bold uppercase">ELO Puanı</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {selectedRequest.user?.elo || 'Yok'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <p className="text-xs text-blue-700 font-bold uppercase">Telefon</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {selectedRequest.user?.phone || 'Yok'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Message */}
              {selectedRequest.message && (
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Katılım Mesajı
                  </h4>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900 leading-relaxed">{selectedRequest.message}</p>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Bilgilendirme</h4>
                    <p className="text-sm text-gray-700">
                      Bu oyuncuyu maça kabul etmek veya reddetmek için aşağıdaki butonları kullanabilirsiniz.
                      Oyuncu ile iletişime geçmek için WhatsApp butonunu kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="bg-gray-50 px-6 py-5 border-t-2 border-gray-100">
              {selectedRequest.status === 'pending' ? (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleContactPlayer(selectedRequest)}
                    className="px-5 py-3 border-2 border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(selectedRequest.id)}
                    disabled={processingRequest === selectedRequest.id}
                    className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingRequest === selectedRequest.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Kabul Et
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    disabled={processingRequest === selectedRequest.id}
                    className="px-5 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingRequest === selectedRequest.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reddet
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
                >
                  Kapat
                </button>
              )}
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
