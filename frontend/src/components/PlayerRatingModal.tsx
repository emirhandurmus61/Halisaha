'use client';

import { useState } from 'react';

interface PlayerRatingModalProps {
  reservationId: string;
  players: { id: string; firstName: string; lastName: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlayerRatingModal({
  reservationId,
  players,
  onClose,
  onSuccess
}: PlayerRatingModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [ratings, setRatings] = useState({
    speed: 50,
    technique: 50,
    passing: 50,
    physical: 50
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      setError('Lütfen bir oyuncu seçin');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      console.log('Submitting rating:', {
        reservationId,
        ratedUserId: selectedPlayer,
        ratings
      });

      const response = await fetch(`${apiUrl}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId,
          ratedUserId: selectedPlayer,
          speedRating: ratings.speed,
          techniqueRating: ratings.technique,
          passingRating: ratings.passing,
          physicalRating: ratings.physical,
          comment: comment || undefined
        })
      });

      const data = await response.json();
      console.log('Rating response:', data);

      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Değerlendirme kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Rating error:', error);
      setError('Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSubmitting(false);
    }
  };

  const RatingSlider = ({ label, value, onChange, color }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color.includes('green') ? '#10b981' :
                        color.includes('blue') ? '#3b82f6' :
                        color.includes('purple') ? '#a855f7' : '#f97316'} 0%, ${color.includes('green') ? '#10b981' :
                        color.includes('blue') ? '#3b82f6' :
                        color.includes('purple') ? '#a855f7' : '#f97316'} ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Zayıf</span>
        <span>Orta</span>
        <span>İyi</span>
        <span>Mükemmel</span>
      </div>
    </div>
  );

  const avgRating = Math.round((ratings.speed + ratings.technique + ratings.passing + ratings.physical) / 4);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Oyuncu Değerlendir</h2>
                <p className="text-purple-100 text-sm">Maç performansını puanla</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3 animate-shake">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-1">Hata</h4>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Player Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Oyuncu Seç</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">Oyuncu seçin...</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.firstName} {player.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Overall Rating Display */}
          <div className="flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Genel Puan</div>
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {avgRating}
              </div>
              <div className="text-sm text-gray-500 mt-1">/ 100</div>
            </div>
          </div>

          {/* Rating Sliders */}
          <div className="space-y-6">
            <RatingSlider
              label="⚡ Hız"
              value={ratings.speed}
              onChange={(val: number) => setRatings({ ...ratings, speed: val })}
              color="text-green-600"
            />
            <RatingSlider
              label="⚽ Şut"
              value={ratings.technique}
              onChange={(val: number) => setRatings({ ...ratings, technique: val })}
              color="text-blue-600"
            />
            <RatingSlider
              label="🎯 Pas"
              value={ratings.passing}
              onChange={(val: number) => setRatings({ ...ratings, passing: val })}
              color="text-purple-600"
            />
            <RatingSlider
              label="💪 Fizik"
              value={ratings.physical}
              onChange={(val: number) => setRatings({ ...ratings, physical: val })}
              color="text-orange-600"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Yorum (Opsiyonel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Oyuncu hakkında düşünceleriniz..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedPlayer}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : 'Değerlendir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
