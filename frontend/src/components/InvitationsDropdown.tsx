'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

export default function InvitationsDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvitations();

    // Listen for invitation events
    const handleInvitationUpdate = () => {
      fetchInvitations();
    };

    window.addEventListener('invitationSent', handleInvitationUpdate);
    window.addEventListener('invitationResponded', handleInvitationUpdate);

    // Refresh invitations every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('invitationSent', handleInvitationUpdate);
      window.removeEventListener('invitationResponded', handleInvitationUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      if (data.success && data.data) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
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
        // Remove invitation from list
        setInvitations(invitations.filter(inv => inv.id !== invitationId));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('invitationResponded'));

        // Show success message
        if (accept) {
          alert('Takıma başarıyla katıldınız!');
          // Redirect to team page
          router.push('/takimim');
        } else {
          alert('Davet reddedildi');
        }
      } else {
        alert(data.message || 'İşlem başarısız oldu');
      }
    } catch (error) {
      console.error('Respond to invitation error:', error);
      alert('İşlem sırasında hata oluştu');
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-all group"
      >
        <svg
          className="w-6 h-6 text-gray-600 group-hover:text-green-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Badge */}
        {invitations.length > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-lg">
            {invitations.length > 9 ? '9+' : invitations.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Takım Davetleri</h3>
              {invitations.length > 0 && (
                <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  {invitations.length}
                </span>
              )}
            </div>
          </div>

          {/* Invitations List */}
          <div className="max-h-[480px] overflow-y-auto">
            {invitations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">Henüz davetiniz yok</p>
                <p className="text-xs text-gray-400 mt-1">Takım davetleri burada görünecek</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Team Info */}
                    <div className="flex items-start gap-3 mb-3">
                      {invitation.teamLogo ? (
                        <img
                          src={`${backendUrl}${invitation.teamLogo}`}
                          alt={invitation.teamName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-green-500 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {invitation.teamName}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          <span className="font-medium">{invitation.invitedBy.firstName} {invitation.invitedBy.lastName}</span>
                          <span className="text-gray-400"> sizi davet etti</span>
                        </p>
                        {invitation.message && (
                          <p className="text-xs text-gray-500 mt-1.5 italic line-clamp-2">
                            "{invitation.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          {formatDate(invitation.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(invitation.id, true)}
                        disabled={responding === invitation.id}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {responding === invitation.id ? 'İşleniyor...' : 'Kabul Et'}
                      </button>
                      <button
                        onClick={() => handleRespond(invitation.id, false)}
                        disabled={responding === invitation.id}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {responding === invitation.id ? 'İşleniyor...' : 'Reddet'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
