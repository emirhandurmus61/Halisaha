'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';

interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  price_per_hour: number;
  field_type: string;
  field_size: string;
  has_parking: boolean;
  has_locker_room: boolean;
  has_lighting: boolean;
  opening_time: string;
  closing_time: string;
  images: string[];
  rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
  owner_id: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface VenueFormData {
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  pricePerHour: string;
  fieldType: string;
  fieldSize: string;
  hasParking: boolean;
  hasLockerRoom: boolean;
  hasLighting: boolean;
  openingTime: string;
  closingTime: string;
  ownerId: string;
  isActive: boolean;
}

export default function VenueManagement() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit' | 'delete'>('view');
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    pricePerHour: '',
    fieldType: 'artificial',
    fieldSize: '5v5',
    hasParking: false,
    hasLockerRoom: false,
    hasLighting: false,
    openingTime: '09:00',
    closingTime: '23:00',
    ownerId: '',
    isActive: true,
  });

  useEffect(() => {
    if (!authService.isAdmin()) {
      router.push('/');
      return;
    }
    fetchVenues();
  }, [pagination.page, searchTerm]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/venues?page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setVenues(data.data.venues);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenue = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:5000/api/v1/admin/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        fetchVenues();
        setShowModal(false);
        resetForm();
        alert('Saha başarıyla eklendi');
      } else {
        alert(data.message || 'Saha eklenemedi');
      }
    } catch (error) {
      console.error('Error adding venue:', error);
      alert('Saha eklenirken bir hata oluştu');
    }
  };

  const handleUpdateVenue = async () => {
    if (!selectedVenue) return;

    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/venues/${selectedVenue.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchVenues();
        setShowModal(false);
        resetForm();
        alert('Saha başarıyla güncellendi');
      } else {
        alert(data.message || 'Saha güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating venue:', error);
      alert('Saha güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteVenue = async () => {
    if (!selectedVenue) return;

    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/venues/${selectedVenue.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchVenues();
        setShowModal(false);
        setSelectedVenue(null);
        alert('Saha başarıyla silindi');
      } else {
        alert(data.message || 'Saha silinemedi');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      alert('Saha silinirken bir hata oluştu');
    }
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description,
      location: venue.location,
      phone: venue.phone,
      email: venue.email || '',
      pricePerHour: (venue.price_per_hour || 0).toString(),
      fieldType: venue.field_type,
      fieldSize: venue.field_size,
      hasParking: venue.has_parking,
      hasLockerRoom: venue.has_locker_room,
      hasLighting: venue.has_lighting,
      openingTime: venue.opening_time,
      closingTime: venue.closing_time,
      ownerId: venue.owner_id,
      isActive: venue.is_active,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const openDeleteModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setModalMode('delete');
    setShowModal(true);
  };

  const openViewModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setModalMode('view');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      phone: '',
      email: '',
      pricePerHour: '',
      fieldType: 'artificial',
      fieldSize: '5v5',
      hasParking: false,
      hasLockerRoom: false,
      hasLighting: false,
      openingTime: '09:00',
      closingTime: '23:00',
      ownerId: '',
      isActive: true,
    });
    setSelectedVenue(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const getFieldTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      grass: 'Çim',
      artificial: 'Suni Çim',
      parquet: 'Parke',
      concrete: 'Beton',
    };
    return types[type] || type;
  };

  const getFieldSizeName = (size: string) => {
    const sizes: { [key: string]: string } = {
      '5v5': 'Halı Saha (5v5)',
      '7v7': 'Halı Saha (7v7)',
      '11v11': 'Stadyum (11v11)',
    };
    return sizes[size] || size;
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Saha Yönetimi</h1>
              <p className="text-gray-600">Sahaları ekleyin, düzenleyin ve yönetin</p>
            </div>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Saha Ekle
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
              <input
                type="text"
                placeholder="Saha adı..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full md:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : venues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">Henüz saha bulunmuyor</p>
            <button
              onClick={openAddModal}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              İlk Sahayı Ekle
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Venue Image */}
                  <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
                    {venue.images && venue.images.length > 0 ? (
                      <img
                        src={`http://localhost:5000${venue.images[0]}`}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      {venue.is_active ? (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                          Pasif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Venue Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{venue.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{venue.location}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Saha Tipi</span>
                        <span className="font-medium">{getFieldTypeName(venue.field_type)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Boyut</span>
                        <span className="font-medium">{getFieldSizeName(venue.field_size)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Saatlik Ücret</span>
                        <span className="font-bold text-green-600">{formatPrice(venue.price_per_hour)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => openViewModal(venue)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Görüntüle
                      </button>
                      <button
                        onClick={() => openEditModal(venue)}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => openDeleteModal(venue)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Toplam {pagination.total} saha - Sayfa {pagination.page} / {pagination.totalPages}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-bold">
                  {modalMode === 'add' && 'Yeni Saha Ekle'}
                  {modalMode === 'edit' && 'Saha Düzenle'}
                  {modalMode === 'delete' && 'Saha Sil'}
                  {modalMode === 'view' && 'Saha Detayları'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              {modalMode === 'delete' && selectedVenue ? (
                <div>
                  <p className="text-gray-700 mb-4">
                    <strong>{selectedVenue.name}</strong> sahasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      <strong>Uyarı:</strong> Bu saha ile ilgili tüm rezervasyonlar da etkilenecektir.
                    </p>
                  </div>
                </div>
              ) : modalMode === 'view' && selectedVenue ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Saha Adı</p>
                      <p className="font-medium">{selectedVenue.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Konum</p>
                      <p className="font-medium">{selectedVenue.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium">{selectedVenue.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedVenue.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Saha Tipi</p>
                      <p className="font-medium">{getFieldTypeName(selectedVenue.field_type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Saha Boyutu</p>
                      <p className="font-medium">{getFieldSizeName(selectedVenue.field_size)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Saatlik Ücret</p>
                      <p className="font-medium text-green-600">{formatPrice(selectedVenue.price_per_hour)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Çalışma Saatleri</p>
                      <p className="font-medium">{selectedVenue.opening_time} - {selectedVenue.closing_time}</p>
                    </div>
                  </div>
                  {selectedVenue.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Açıklama</p>
                      <p className="text-gray-700">{selectedVenue.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Özellikler</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${selectedVenue.has_parking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {selectedVenue.has_parking ? '✓' : '✗'} Otopark
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${selectedVenue.has_locker_room ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {selectedVenue.has_locker_room ? '✓' : '✗'} Soyunma Odası
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${selectedVenue.has_lighting ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {selectedVenue.has_lighting ? '✓' : '✗'} Aydınlatma
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saha Adı *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Konum *</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saatlik Ücret (₺) *</label>
                      <input
                        type="number"
                        value={formData.pricePerHour}
                        onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saha Tipi *</label>
                      <select
                        value={formData.fieldType}
                        onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="grass">Çim</option>
                        <option value="artificial">Suni Çim</option>
                        <option value="parquet">Parke</option>
                        <option value="concrete">Beton</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saha Boyutu *</label>
                      <select
                        value={formData.fieldSize}
                        onChange={(e) => setFormData({ ...formData, fieldSize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="5v5">Halı Saha (5v5)</option>
                        <option value="7v7">Halı Saha (7v7)</option>
                        <option value="11v11">Stadyum (11v11)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Açılış Saati *</label>
                      <input
                        type="time"
                        value={formData.openingTime}
                        onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kapanış Saati *</label>
                      <input
                        type="time"
                        value={formData.closingTime}
                        onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {modalMode === 'add' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saha Sahibi ID *</label>
                      <input
                        type="text"
                        value={formData.ownerId}
                        onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Kullanıcı ID'sini girin"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Özellikler</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hasParking}
                          onChange={(e) => setFormData({ ...formData, hasParking: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-gray-700">Otopark</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hasLockerRoom}
                          onChange={(e) => setFormData({ ...formData, hasLockerRoom: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-gray-700">Soyunma Odası</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hasLighting}
                          onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-gray-700">Aydınlatma</span>
                      </label>
                      {modalMode === 'edit' && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="ml-2 text-gray-700">Aktif</span>
                        </label>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              {modalMode === 'add' && (
                <button
                  onClick={handleAddVenue}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Saha Ekle
                </button>
              )}
              {modalMode === 'edit' && (
                <button
                  onClick={handleUpdateVenue}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Güncelle
                </button>
              )}
              {modalMode === 'delete' && (
                <button
                  onClick={handleDeleteVenue}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
