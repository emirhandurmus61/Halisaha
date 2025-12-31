'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  position: string;
  status: 'pending' | 'accepted' | 'rejected';
  joined_at: string;
  player_name: string;
  player_email: string;
  elo_rating: number;
  total_matches_played: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  captain_id: string;
  logo_url: string;
  team_level: string;
  city: string;
  district: string;
  is_active: boolean;
  created_at: string;
  captain_name: string;
  captain_email: string;
  member_count: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TeamManagement() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authService.isAdmin()) {
      router.push('/');
      return;
    }
    fetchTeams();
  }, [pagination.page, searchTerm]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/teams?page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTeams(data.data.teams);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId: string) => {
    try {
      setLoadingDetails(true);
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/teams/${teamId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.data.members);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Bu takımı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(
        `http://localhost:5000/api/v1/admin/teams/${teamId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchTeams();
        setShowModal(false);
      } else {
        alert(data.message || 'Takım silinemedi');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Takım silinirken bir hata oluştu');
    }
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

  const getTeamLevelBadge = (level: string) => {
    const badges: { [key: string]: string } = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
      professional: 'bg-red-100 text-red-800',
    };
    const labels: { [key: string]: string } = {
      beginner: 'Başlangıç',
      intermediate: 'Orta',
      advanced: 'İleri',
      professional: 'Profesyonel',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[level] || 'bg-gray-100 text-gray-800'}`}>
        {labels[level] || level}
      </span>
    );
  };

  const getMemberStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels: { [key: string]: string } = {
      pending: 'Beklemede',
      accepted: 'Kabul Edildi',
      rejected: 'Reddedildi',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Takım Yönetimi</h1>
          <p className="text-gray-600">Tüm takımları görüntüleyin ve yönetin</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
              <input
                type="text"
                placeholder="Takım adı..."
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

        {/* Teams Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Takım bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowModal(true);
                    fetchTeamDetails(team.id);
                  }}
                >
                  {/* Team Logo */}
                  <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    {team.logo_url ? (
                      <img
                        src={`http://localhost:5000${team.logo_url}`}
                        alt={team.name}
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{team.name}</h3>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {team.city}{team.district ? `, ${team.district}` : ''}
                    </div>

                    {team.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{team.description}</p>
                    )}

                    <div className="mb-4">
                      {getTeamLevelBadge(team.team_level)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Kaptan</span>
                        <span className="font-medium">{team.captain_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Üye Sayısı</span>
                        <span className="font-medium">{team.member_count || 0}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Kayıt: {formatDate(team.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Toplam {pagination.total} takım - Sayfa {pagination.page} / {pagination.totalPages}
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

      {/* Team Details Modal */}
      {showModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {selectedTeam.logo_url ? (
                    <img
                      src={`http://localhost:5000${selectedTeam.logo_url}`}
                      alt={selectedTeam.name}
                      className="w-16 h-16 object-contain bg-white bg-opacity-20 rounded-lg p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{selectedTeam.name}</h3>
                    <div className="flex items-center text-sm opacity-90">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {selectedTeam.city}{selectedTeam.district ? `, ${selectedTeam.district}` : ''}
                    </div>
                  </div>
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
            <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Team Info */}
                {selectedTeam.description && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Açıklama</h4>
                    <p className="text-gray-600">{selectedTeam.description}</p>
                  </div>
                )}

                {/* Team Details */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Takım Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Seviye</p>
                      <div className="mt-1">{getTeamLevelBadge(selectedTeam.team_level)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Kayıt Tarihi</p>
                      <p className="font-medium">{formatDate(selectedTeam.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Captain Info */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Kaptan Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-800">{selectedTeam.captain_name}</p>
                    <p className="text-sm text-gray-600">{selectedTeam.captain_email}</p>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Takım Üyeleri ({teamMembers.length})</h4>
                  {loadingDetails ? (
                    <div className="py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Henüz üye yok</p>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-800">{member.player_name}</p>
                              <p className="text-sm text-gray-600">{member.player_email}</p>
                            </div>
                            {getMemberStatusBadge(member.status)}
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500">Pozisyon</p>
                              <p className="text-sm font-medium">{member.position || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ELO</p>
                              <p className="text-sm font-medium">{member.elo_rating}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Maç Sayısı</p>
                              <p className="text-sm font-medium">{member.total_matches_played}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Takım ID:</span>
                    <p className="font-mono text-xs mt-1">{selectedTeam.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between">
              <button
                onClick={() => handleDeleteTeam(selectedTeam.id)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Takımı Sil
              </button>
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
