'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { authService } from '@/services/auth.service';

interface MatchProposal {
  id: string;
  proposedDate: string;
  proposedTime: string;
  venueName?: string;
  matchDuration: number;
  fieldSize?: string;
  message?: string;
  costSharing: string;
  estimatedCost?: number;
  status: string;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
}

interface ReceivedProposal extends MatchProposal {
  proposingTeamId: string;
  proposingTeamName: string;
  proposingTeamLogo?: string;
  proposingTeamElo: number;
  proposedBy: {
    firstName: string;
    lastName: string;
  };
}

interface SentProposal extends MatchProposal {
  targetTeamId: string;
  targetTeamName: string;
  targetTeamLogo?: string;
  targetTeamElo: number;
}

export default function MatchProposalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedProposals, setReceivedProposals] = useState<ReceivedProposal[]>([]);
  const [sentProposals, setSentProposals] = useState<SentProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    fetchProposals();
  }, [router]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${apiUrl}/opponent-search/proposals/received`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/opponent-search/proposals/sent`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const receivedData = await receivedRes.json();
      const sentData = await sentRes.json();

      if (receivedData.success) {
        setReceivedProposals(receivedData.data);
      }

      if (sentData.success) {
        setSentProposals(sentData.data);
      }
    } catch (error) {
      console.error('Fetch proposals error:', error);
      setToast({ message: 'Teklifler yüklenirken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (proposalId: string, accept: boolean, responseMessage?: string) => {
    setResponding(proposalId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/opponent-search/proposals/${proposalId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accept, responseMessage }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: accept ? 'Teklif kabul edildi!' : 'Teklif reddedildi',
          type: accept ? 'success' : 'info',
        });
        fetchProposals();
      } else {
        setToast({ message: data.message || 'İşlem başarısız', type: 'error' });
      }
    } catch (error) {
      console.error('Respond to proposal error:', error);
      setToast({ message: 'Yanıt gönderilirken hata oluştu', type: 'error' });
    } finally {
      setResponding(null);
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Kabul Edildi', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'İptal Edildi', color: 'bg-gray-100 text-gray-800' },
    expired: { label: 'Süresi Doldu', color: 'bg-gray-100 text-gray-800' },
  };

  const fieldSizeLabels: Record<string, string> = {
    'halısaha_5': '5\'lik',
    'halısaha_7': '7\'lik',
    'halısaha_8': '8\'lik',
    'halısaha_11': '11\'lik',
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Maç Teklifleri</h1>
          <p className="text-gray-600">Gelen ve gönderilen maç tekliflerinizi yönetin</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'received'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gelen Teklifler ({receivedProposals.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'sent'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gönderilen Teklifler ({sentProposals.length})
          </button>
        </div>

        {/* Received Proposals */}
        {activeTab === 'received' && (
          <div className="space-y-4">
            {receivedProposals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Teklif Yok</h3>
                <p className="text-gray-600">Size gelen maç teklifleri burada görünecek</p>
              </div>
            ) : (
              receivedProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-green-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Team Info */}
                      <div className="flex items-center gap-4">
                        {proposal.proposingTeamLogo ? (
                          <img
                            src={`${backendUrl}${proposal.proposingTeamLogo}`}
                            alt={proposal.proposingTeamName}
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
                          <h3 className="font-bold text-xl text-gray-900">{proposal.proposingTeamName}</h3>
                          <p className="text-sm text-gray-600">
                            ELO: {proposal.proposingTeamElo} • Gönderen: {proposal.proposedBy.firstName} {proposal.proposedBy.lastName}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm ${statusLabels[proposal.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[proposal.status]?.label || proposal.status}
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

                    {proposal.venueName && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Saha: {proposal.venueName}</span>
                        </div>
                      </div>
                    )}

                    {proposal.message && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Mesaj:</div>
                        <p className="text-gray-700">{proposal.message}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>{costSharingLabels[proposal.costSharing]}</span>
                      {proposal.estimatedCost && <span className="font-semibold">{proposal.estimatedCost} ₺</span>}
                    </div>

                    {/* Response */}
                    {proposal.status === 'pending' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRespond(proposal.id, false)}
                          disabled={responding === proposal.id}
                          className="flex-1 px-6 py-3 border-2 border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          {responding === proposal.id ? 'İşleniyor...' : 'Reddet'}
                        </button>
                        <button
                          onClick={() => handleRespond(proposal.id, true)}
                          disabled={responding === proposal.id}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {responding === proposal.id ? 'İşleniyor...' : 'Kabul Et'}
                        </button>
                      </div>
                    ) : proposal.responseMessage && (
                      <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                        <div className="text-sm font-semibold text-blue-800 mb-1">Yanıtınız:</div>
                        <p className="text-blue-700">{proposal.responseMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Teklif Yok</h3>
                <p className="text-gray-600">Gönderdiğiniz maç teklifleri burada görünecek</p>
              </div>
            ) : (
              sentProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-green-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
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
                          <p className="text-sm text-gray-600">ELO: {proposal.targetTeamElo}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm ${statusLabels[proposal.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[proposal.status]?.label || proposal.status}
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
                        <div className="text-sm font-semibold text-gray-700 mb-1">Mesajınız:</div>
                        <p className="text-gray-700">{proposal.message}</p>
                      </div>
                    )}

                    {proposal.responseMessage && (
                      <div className={`p-4 rounded-xl border-2 ${
                        proposal.status === 'accepted'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`text-sm font-semibold mb-1 ${
                          proposal.status === 'accepted' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          Yanıt:
                        </div>
                        <p className={proposal.status === 'accepted' ? 'text-green-700' : 'text-red-700'}>
                          {proposal.responseMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

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
