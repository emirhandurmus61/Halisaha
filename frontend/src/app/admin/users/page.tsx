'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'player' | 'venue_owner' | 'admin';
  trust_score: number;
  elo_rating: number;
  total_matches_played: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string;
  profile_data: any;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    if (!authService.isAdmin()) {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [pagination.page, searchTerm, filterUserType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/users?page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}&userType=${filterUserType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        setShowModal(false);
      } else {
        alert(data.message || 'Kullanıcı durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Kullanıcı durumu güncellenirken bir hata oluştu');
    }
  };

  const handleUpdateUserType = async (userId: string, userType: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/users/${userId}/type`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userType }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        setShowModal(false);
      } else {
        alert(data.message || 'Kullanıcı tipi güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      alert('Kullanıcı tipi güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        setShowModal(false);
      } else {
        alert(data.message || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Kullanıcı silinirken bir hata oluştu');
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      venue_owner: 'bg-blue-100 text-blue-800',
      player: 'bg-green-100 text-green-800',
    };
    const labels = {
      admin: 'Admin',
      venue_owner: 'Saha Sahibi',
      player: 'Oyuncu',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[userType as keyof typeof badges]}`}>
        {labels[userType as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Aktif
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Pasif
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600">Tüm kullanıcıları görüntüleyin ve yönetin</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
              <input
                type="text"
                placeholder="İsim, email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Tipi</label>
              <select
                value={filterUserType}
                onChange={(e) => {
                  setFilterUserType(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                <option value="player">Oyuncu</option>
                <option value="venue_owner">Saha Sahibi</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterUserType('');
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Kullanıcı</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">İletişim</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Tip</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Durum</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">İstatistikler</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Kayıt Tarihi</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.is_verified && (
                              <span className="text-xs text-green-600 flex items-center mt-1">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Doğrulanmış
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone || '-'}</p>
                        </td>
                        <td className="px-6 py-4">{getUserTypeBadge(user.user_type)}</td>
                        <td className="px-6 py-4">{getStatusBadge(user.is_active)}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-600">ELO: <span className="font-medium">{user.elo_rating}</span></p>
                            <p className="text-gray-600">Maç: <span className="font-medium">{user.total_matches_played}</span></p>
                            <p className="text-gray-600">Güven: <span className="font-medium">{user.trust_score}</span></p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setModalAction('edit');
                                setShowModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setModalAction('delete');
                                setShowModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Sil"
                              disabled={user.user_type === 'admin'}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {users.map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalAction('edit');
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalAction('delete');
                            setShowModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          disabled={user.user_type === 'admin'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getUserTypeBadge(user.user_type)}
                      {getStatusBadge(user.is_active)}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">ELO</p>
                        <p className="font-medium">{user.elo_rating}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Maç</p>
                        <p className="font-medium">{user.total_matches_played}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Güven</p>
                        <p className="font-medium">{user.trust_score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Toplam {pagination.total} kullanıcı - Sayfa {pagination.page} / {pagination.totalPages}
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
      </div>

      {/* Edit/Delete Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            {modalAction === 'edit' ? (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Kullanıcı Düzenle</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Tipi</label>
                    <select
                      defaultValue={selectedUser.user_type}
                      onChange={(e) => handleUpdateUserType(selectedUser.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="player">Oyuncu</option>
                      <option value="venue_owner">Saha Sahibi</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleUpdateUserStatus(selectedUser.id, true)}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          selectedUser.is_active
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Aktif
                      </button>
                      <button
                        onClick={() => handleUpdateUserStatus(selectedUser.id, false)}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          !selectedUser.is_active
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Pasif
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Kullanıcıyı Sil</h3>
                <p className="text-gray-600 mb-6">
                  <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
