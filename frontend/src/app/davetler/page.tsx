'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { authService } from '@/services/auth.service';

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  teamDescription?: string;
  message?: string;
  invitedBy: {
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/giris');
      return;
    }

    fetchInvitations();
  }, [router]);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/teams/my-invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    setResponding(invitationId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiUrl}/teams/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accept }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        // Remove the invitation from the list
        setInvitations(invitations.filter(inv => inv.id !== invitationId));

        // If accepted, redirect to team page
        if (accept) {
          setTimeout(() => {
            router.push('/takimim');
          }, 1500);
        }
      } else {
        alert(data.message || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Respond to invitation error:', error);
      alert('İşlem sırasında bir hata oluştu');
    } finally {
      setResponding(null);
    }
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Takım Davetleri</h1>
          <p className="text-gray-600">Aldığınız takım davetlerini görüntüleyin ve yanıtlayın</p>
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Davet Bulunmuyor</h2>
            <p className="text-gray-600">Şu anda bekleyen bir takım davetiniz yok.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Team Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      {invitation.teamLogo ? (
                        <img
                          src={invitation.teamLogo}
                          alt={invitation.teamName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">{invitation.teamName}</h3>
                        <p className="text-sm text-gray-600">
                          {invitation.invitedBy.firstName} {invitation.invitedBy.lastName} tarafından davet edildi
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          @{invitation.invitedBy.username}
                        </p>
                      </div>
                    </div>

                    {invitation.teamDescription && (
                      <p className="text-gray-700 mb-4">{invitation.teamDescription}</p>
                    )}

                    {invitation.message && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Mesaj:</p>
                        <p className="text-gray-900">{invitation.message}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-3">
                    <button
                      onClick={() => respondToInvitation(invitation.id, true)}
                      disabled={responding === invitation.id}
                      className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {responding === invitation.id ? 'İşleniyor...' : 'Kabul Et'}
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, false)}
                      disabled={responding === invitation.id}
                      className="flex-1 md:flex-none px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
