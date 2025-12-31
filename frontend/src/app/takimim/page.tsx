'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { authService } from '@/services/auth.service';
import { User } from '@/types/user.types';

interface TeamMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: string;
  position?: string;
  jerseyNumber?: number;
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  eloRating: number;
  totalMatchesPlayed: number;
  trustScore: number;
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  captainId: string;
  isPublic: boolean;
  allowJoinRequests: boolean;
  createdAt: string;
}

interface TeamStats {
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  eloRating: number;
  winRate: string;
  memberCount: number;
}

interface TeamData {
  team: Team;
  members: TeamMember[];
  stats: TeamStats;
}

interface PlayerSearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  eloRating: number;
  totalMatchesPlayed: number;
  trustScore: number;
  hasTeam: boolean;
}

export default function MyTeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Team Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: ''
  });

  // Team Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ description: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Invite Player Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    setUser(authService.getCurrentUser());
    fetchTeamData();
  }, [router]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/teams/my-team`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setTeamData(data.data);
      }
    } catch (error) {
      console.error('Fetch team error:', error);
      setError('Takım bilgileri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      alert('Takım adı zorunludur');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamForm),
      });

      const data = await response.json();

      if (data.success) {
        alert('Takım başarıyla oluşturuldu!');
        setShowCreateModal(false);
        setTeamForm({ name: '', description: '' });
        fetchTeamData();
      } else {
        alert(data.message || 'Takım oluşturulamadı');
      }
    } catch (error) {
      console.error('Create team error:', error);
      alert('Takım oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const searchPlayers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      console.log('Searching for:', searchUsername);
      console.log('API URL:', `${apiUrl}/teams/search-players?username=${encodeURIComponent(searchUsername)}`);

      const response = await fetch(`${apiUrl}/teams/search-players?username=${encodeURIComponent(searchUsername)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setSearchResults(data.data);
        console.log('Search results set:', data.data);
      } else {
        console.log('Search failed:', data.message);
      }
    } catch (error) {
      console.error('Search players error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Otomatik arama için useEffect (debounce ile)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchUsername.trim()) {
        searchPlayers();
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms bekle, kullanıcı yazmayı bitirince ara

    return () => clearTimeout(delayDebounceFn);
  }, [searchUsername]);

  const handleInvitePlayer = async () => {
    if (!selectedPlayer) return;

    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/teams/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          message: inviteMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: `${selectedPlayer.firstName} ${selectedPlayer.lastName} kullanıcısına davet gönderildi!`,
          type: 'success'
        });
        setShowInviteModal(false);
        setSelectedPlayer(null);
        setInviteMessage('');
        setSearchUsername('');
        setSearchResults([]);

        // Dispatch event to notify invitations dropdown
        window.dispatchEvent(new CustomEvent('invitationSent'));
      } else {
        setToast({
          message: data.message || 'Davet gönderilemedi',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Invite player error:', error);
      setToast({
        message: 'Davet gönderilirken hata oluştu',
        type: 'error'
      });
    } finally {
      setInviting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTeam = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      // Update description
      if (settingsForm.description !== teamData?.team.description) {
        await fetch(`${apiUrl}/teams/update`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: settingsForm.description }),
        });
      }

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        await fetch(`${apiUrl}/teams/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      }

      alert('Takım bilgileri başarıyla güncellendi!');
      setShowSettingsModal(false);
      setLogoFile(null);
      setLogoPreview(null);
      fetchTeamData();
    } catch (error) {
      console.error('Update team error:', error);
      alert('Güncelleme sırasında hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const openSettingsModal = () => {
    if (teamData?.team) {
      setSettingsForm({ description: teamData.team.description || '' });
      setLogoPreview(null);
      setLogoFile(null);
      setShowSettingsModal(true);
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

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

  // No Team - Show Create Team Section
  if (!teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Henüz Bir Takımınız Yok</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Kendi takımınızı oluşturun veya bir takıma katılın
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Takım Oluştur
            </button>
          </div>
        </main>

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Takım Oluştur</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
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
                    Takım Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    placeholder="Takım adını girin"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                    placeholder="Takımınız hakkında kısa bir açıklama"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  disabled={creating}
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={creating || !teamForm.name.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Has Team - Show Team Details
  const { team, members, stats } = teamData;
  const currentUser = authService.getCurrentUser();
  const isCaptain = currentUser?.userId === team.captainId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Team Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-xl p-8 md:p-12 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {team.logoUrl ? (
              <img
                src={`${backendUrl}${team.logoUrl}`}
                alt={team.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/30">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{team.name}</h1>
              {team.description && (
                <p className="text-white/90 text-sm md:text-base">{team.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 text-center">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                <div className="text-sm opacity-90">Oyuncu</div>
                <div className="text-2xl font-bold">{stats.memberCount}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                <div className="text-sm opacity-90">ELO</div>
                <div className="text-2xl font-bold">{stats.eloRating}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Always visible, captain gets full access */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={() => {
                setShowInviteModal(true);
                setSearchUsername('');
                setSearchResults([]);
                setSelectedPlayer(null);
              }}
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Oyuncu Davet Et
            </button>
            <button
              onClick={() => router.push('/rakip-bul')}
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rakip Bul
            </button>
            <button
              onClick={openSettingsModal}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Takım Ayarları
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-600 mb-1">Toplam Maç</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalMatches}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-green-600 mb-1">Galibiyet</div>
            <div className="text-3xl font-bold text-green-600">{stats.totalWins}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-yellow-600 mb-1">Beraberlik</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.totalDraws}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-red-600 mb-1">Mağlubiyet</div>
            <div className="text-3xl font-bold text-red-600">{stats.totalLosses}</div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Takım Üyeleri</h2>
            {isCaptain && (
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setSearchUsername('');
                  setSearchResults([]);
                  setSelectedPlayer(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Oyuncu Davet Et
              </button>
            )}
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all"
              >
                {member.profilePicture ? (
                  <img
                    src={`${backendUrl}${member.profilePicture}`}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-green-500"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">
                      {member.firstName} {member.lastName}
                    </h3>
                    {member.role === 'captain' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-lg">
                        KAPTAN
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600">ELO</div>
                    <div className="font-bold text-green-600">{member.eloRating}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Maç</div>
                    <div className="font-bold">{member.matchesPlayed}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Gol</div>
                    <div className="font-bold">{member.goalsScored}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Asist</div>
                    <div className="font-bold">{member.assists}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Invite Player Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Oyuncu Davet Et</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSearchUsername('');
                  setSearchResults([]);
                  setSelectedPlayer(null);
                  setInviteMessage('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!selectedPlayer ? (
              <>
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Kullanıcı adı ile ara..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                  />
                  {searching && (
                    <p className="text-sm text-gray-500 mt-2">Aranıyor...</p>
                  )}
                </div>

                {/* Search Results */}
                <div className="space-y-2">
                  {searchResults.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all"
                    >
                      {player.profilePicture ? (
                        <img
                          src={`${backendUrl}${player.profilePicture}`}
                          alt={`${player.firstName} ${player.lastName}`}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold">
                            {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="font-bold text-gray-900">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-sm text-gray-600">@{player.username}</div>
                        <div className="text-xs text-gray-500">
                          ELO: {player.eloRating} • {player.totalMatchesPlayed} Maç
                        </div>
                      </div>

                      {player.hasTeam ? (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                          Takımı Var
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedPlayer(player)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                        >
                          Davet Et
                        </button>
                      )}
                    </div>
                  ))}

                  {searchResults.length === 0 && searchUsername && !searching && (
                    <p className="text-center text-gray-500 py-8">Oyuncu bulunamadı</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Selected Player - Send Invitation */}
                <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-4">
                    {selectedPlayer.profilePicture ? (
                      <img
                        src={`${backendUrl}${selectedPlayer.profilePicture}`}
                        alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedPlayer.firstName.charAt(0)}{selectedPlayer.lastName.charAt(0)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">
                        {selectedPlayer.firstName} {selectedPlayer.lastName}
                      </div>
                      <div className="text-sm text-gray-600">@{selectedPlayer.username}</div>
                    </div>

                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Davet Mesajı (Opsiyonel)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Oyuncuya bir mesaj yazın..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                    maxLength={200}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    disabled={inviting}
                  >
                    Geri
                  </button>
                  <button
                    onClick={handleInvitePlayer}
                    disabled={inviting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {inviting ? 'Gönderiliyor...' : 'Davet Gönder'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Team Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Takım Ayarları</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Takım Logosu
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview || teamData?.team.logoUrl ? (
                    <img
                      src={logoPreview || `${backendUrl}${teamData?.team.logoUrl}`}
                      alt="Team logo"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-green-500"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                      <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors inline-block text-sm"
                    >
                      Logo Değiştir
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ description: e.target.value })}
                  placeholder="Takımınız hakkında kısa bir açıklama"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settingsForm.description.length}/200 karakter
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                disabled={updating}
              >
                İptal
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Kaydediliyor...' : 'Kaydet'}
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
