'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';

interface Reservation {
  id: string;
  user_id: string;
  venue_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  venue_name: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ReservationManagement() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!authService.isAdmin()) {
      router.push('/');
      return;
    }
    fetchReservations();
  }, [pagination.page, filterStatus]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/reservations?page=${pagination.page}&limit=${pagination.limit}&status=${filterStatus}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setReservations(data.data.reservations);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reservationId: string, status: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/reservations/${reservationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchReservations();
        setShowModal(false);
      } else {
        alert(data.message || 'Rezervasyon durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      alert('Rezervasyon durumu güncellenirken bir hata oluştu');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      cancelled: 'İptal Edildi',
      completed: 'Tamamlandı',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours} saat ${diffMinutes > 0 ? diffMinutes + ' dk' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 flex items-center text-gray-600 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Admin Paneline Dön
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Rezervasyon Yönetimi</h1>
          <p className="text-gray-600">Tüm rezervasyonları görüntüleyin ve yönetin</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                <option value="pending">Beklemede</option>
                <option value="confirmed">Onaylandı</option>
                <option value="cancelled">İptal Edildi</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('');
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full md:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Filtreyi Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Rezervasyon bulunamadı</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Rezervasyon ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Kullanıcı</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Saha</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Tarih & Saat</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Süre</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Tutar</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Durum</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-mono text-gray-600">{reservation.id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{reservation.user_name}</p>
                          <p className="text-sm text-gray-500">{reservation.user_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{reservation.venue_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-800">{formatDate(reservation.start_time)}</p>
                          <p className="text-sm text-gray-600">{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-800">{getDuration(reservation.start_time, reservation.end_time)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-green-600">{formatPrice(reservation.total_price)}</p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setShowModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Detaylar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedReservation(reservation);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{reservation.user_name}</p>
                      <p className="text-sm text-gray-600">{reservation.venue_name}</p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Tarih</p>
                      <p className="font-medium">{formatDate(reservation.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Saat</p>
                      <p className="font-medium">{formatTime(reservation.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Süre</p>
                      <p className="font-medium">{getDuration(reservation.start_time, reservation.end_time)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tutar</p>
                      <p className="font-bold text-green-600">{formatPrice(reservation.total_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Toplam {pagination.total} rezervasyon - Sayfa {pagination.page} / {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Rezervasyon Detayları</h3>
                  <p className="text-sm opacity-90">ID: {selectedReservation.id}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-6">
                {/* User Info */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Kullanıcı Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-800">{selectedReservation.user_name}</p>
                    <p className="text-sm text-gray-600">{selectedReservation.user_email}</p>
                  </div>
                </div>

                {/* Venue Info */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Saha</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-800">{selectedReservation.venue_name}</p>
                  </div>
                </div>

                {/* Reservation Details */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Rezervasyon Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Tarih</p>
                      <p className="font-medium">{formatDate(selectedReservation.start_time)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Başlangıç Saati</p>
                      <p className="font-medium">{formatTime(selectedReservation.start_time)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Bitiş Saati</p>
                      <p className="font-medium">{formatTime(selectedReservation.end_time)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Süre</p>
                      <p className="font-medium">{getDuration(selectedReservation.start_time, selectedReservation.end_time)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Toplam Tutar</p>
                      <p className="font-bold text-green-600 text-lg">{formatPrice(selectedReservation.total_price)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Durum</p>
                      <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Durum Güncelle</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedReservation.id, 'pending')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedReservation.status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Beklemede
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReservation.id, 'confirmed')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedReservation.status === 'confirmed'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReservation.id, 'completed')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedReservation.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Tamamlandı
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReservation.id, 'cancelled')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedReservation.status === 'cancelled'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      İptal Et
                    </button>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Oluşturulma:</span>
                      <p>{formatDateTime(selectedReservation.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Son Güncelleme:</span>
                      <p>{formatDateTime(selectedReservation.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
