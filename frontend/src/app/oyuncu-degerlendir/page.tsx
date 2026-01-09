'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/authService';
import ErrorMessage from '@/components/ErrorMessage';

interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

interface PlayerRating {
  userId: string;
  speedRating: number;
  techniqueRating: number;
  passingRating: number;
  physicalRating: number;
  showedUp: boolean;
  causedTrouble: boolean;
  wasLate: boolean;
  comment: string;
}

function PlayerEvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, PlayerRating>>({});
  const [currentRating, setCurrentRating] = useState<PlayerRating>({
    userId: '',
    speedRating: 50,
    techniqueRating: 50,
    passingRating: 50,
    physicalRating: 50,
    showedUp: true,
    causedTrouble: false,
    wasLate: false,
    comment: '',
  });

  useEffect(() => {
    if (!matchId) {
      router.push('/takimim');
      return;
    }

    const fetchPlayers = async () => {
      try {
        const token = authService.getToken();
        const response = await fetch(
          `http://localhost:5000/api/v1/reservations/${matchId}/players`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPlayers(data.data || []);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Oyuncular yüklenemedi. Rezervasyon bulunamadı veya size ait değil');
        }
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Oyuncular yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [matchId, router]);

  const handleSelectPlayer = (playerId: string) => {
    if (ratings[playerId]) {
      setCurrentRating(ratings[playerId]);
    } else {
      setCurrentRating({
        userId: playerId,
        speedRating: 50,
        techniqueRating: 50,
        passingRating: 50,
        physicalRating: 50,
        showedUp: true,
        causedTrouble: false,
        wasLate: false,
        comment: '',
      });
    }
    setSelectedPlayer(playerId);
  };

  const handleSaveRating = () => {
    if (!selectedPlayer) return;

    setRatings({
      ...ratings,
      [selectedPlayer]: { ...currentRating, userId: selectedPlayer },
    });

    // Otomatik olarak bir sonraki oyuncuya geç
    const currentIndex = players.findIndex((p) => p.userId === selectedPlayer);
    if (currentIndex < players.length - 1) {
      const nextPlayer = players[currentIndex + 1];
      handleSelectPlayer(nextPlayer.userId);
    } else {
      setSelectedPlayer('');
    }
  };

  const handleSubmitAllRatings = async () => {
    try {
      const token = authService.getToken();

      // Tüm değerlendirmeleri backend'e gönder
      for (const [userId, rating] of Object.entries(ratings)) {
        await fetch('http://localhost:5000/api/v1/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reservationId: matchId,
            ratedUserId: userId,
            speedRating: rating.speedRating,
            techniqueRating: rating.techniqueRating,
            passingRating: rating.passingRating,
            physicalRating: rating.physicalRating,
            showedUp: rating.showedUp,
            causedTrouble: rating.causedTrouble,
            wasLate: rating.wasLate,
            comment: rating.comment,
          }),
        });
      }

      alert('Değerlendirmeler başarıyla kaydedildi!');
      router.push('/takimim');
    } catch (error) {
      console.error('Error submitting ratings:', error);
      alert('Değerlendirmeler kaydedilirken bir hata oluştu.');
    }
  };

  const getOverallScore = () => {
    return Math.round(
      (currentRating.speedRating +
        currentRating.techniqueRating +
        currentRating.passingRating +
        currentRating.physicalRating) /
        4
    );
  };

  const getRatingLabel = (value: number) => {
    if (value >= 80) return 'Mükemmel';
    if (value >= 60) return 'İyi';
    if (value >= 40) return 'Orta';
    if (value >= 20) return 'Zayıf';
    return 'Çok Zayıf';
  };

  const getRatingColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-blue-500';
    if (value >= 40) return 'text-yellow-500';
    if (value >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-purple-600">Oyuncular yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <ErrorMessage
            title="Oyuncular Yüklenemedi"
            message={error}
            icon="error"
            action={{
              label: 'Rezervasyonlarıma Dön',
              onClick: () => router.push('/rezervasyonlarim'),
            }}
          />
        </div>
      </div>
    );
  }

  const selectedPlayerData = players.find((p) => p.userId === selectedPlayer);
  const ratedCount = Object.keys(ratings).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Oyuncu Değerlendir
              </h1>
              <p className="text-gray-600 mt-2">Maç performansını puanla</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Değerlendirilen</div>
              <div className="text-2xl font-bold text-purple-600">
                {ratedCount} / {players.length}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Oyuncu Listesi */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Oyuncular</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {players.map((player) => {
                  const isRated = !!ratings[player.userId];
                  const isSelected = selectedPlayer === player.userId;

                  return (
                    <button
                      key={player.userId}
                      onClick={() => handleSelectPlayer(player.userId)}
                      className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                          : isRated
                          ? 'bg-green-50 hover:bg-green-100 border-2 border-green-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          isSelected
                            ? 'bg-white text-purple-600'
                            : isRated
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {player.firstName[0]}
                        {player.lastName[0]}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">
                          {player.firstName} {player.lastName}
                        </div>
                        <div
                          className={`text-xs ${
                            isSelected ? 'text-white/80' : 'text-gray-500'
                          }`}
                        >
                          {isRated ? '✓ Değerlendirildi' : 'Bekliyor'}
                        </div>
                      </div>
                      {isRated && (
                        <div className="text-2xl">{isSelected ? '📝' : '✅'}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Değerlendirme Formu */}
          <div className="lg:col-span-2">
            {selectedPlayer ? (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                {/* Oyuncu Başlığı */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold">
                      {selectedPlayerData?.firstName[0]}
                      {selectedPlayerData?.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">
                        {selectedPlayerData?.firstName} {selectedPlayerData?.lastName}
                      </h2>
                      <p className="text-white/80">{selectedPlayerData?.email}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm opacity-80">Genel Puan</div>
                      <div className="text-4xl font-bold">{getOverallScore()}</div>
                      <div className="text-xs">/ 100</div>
                    </div>
                  </div>
                </div>

                {/* Katılım Durumu */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    ⚽ Katılım ve Davranış Durumu
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-all">
                      <input
                        type="checkbox"
                        checked={!currentRating.showedUp}
                        onChange={(e) =>
                          setCurrentRating({
                            ...currentRating,
                            showedUp: !e.target.checked,
                          })
                        }
                        className="w-5 h-5 accent-red-600"
                      />
                      <div>
                        <div className="font-semibold text-red-600">Maça Gelmedi</div>
                        <div className="text-xs text-gray-500">-15 Güven Puanı</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-all">
                      <input
                        type="checkbox"
                        checked={currentRating.causedTrouble}
                        onChange={(e) =>
                          setCurrentRating({
                            ...currentRating,
                            causedTrouble: e.target.checked,
                          })
                        }
                        className="w-5 h-5 accent-red-600"
                      />
                      <div>
                        <div className="font-semibold text-red-600">Kavga Çıkardı</div>
                        <div className="text-xs text-gray-500">-20 Güven Puanı</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-all">
                      <input
                        type="checkbox"
                        checked={currentRating.wasLate}
                        onChange={(e) =>
                          setCurrentRating({
                            ...currentRating,
                            wasLate: e.target.checked,
                          })
                        }
                        className="w-5 h-5 accent-orange-600"
                      />
                      <div>
                        <div className="font-semibold text-orange-600">Geç Kaldı</div>
                        <div className="text-xs text-gray-500">-5 Güven Puanı</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Performans Puanları */}
                <div className="space-y-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    ⭐ Performans Değerlendirmesi
                  </h3>

                  {/* Hız */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-gray-700 flex items-center gap-2">
                        ⚡ Hız
                      </label>
                      <span
                        className={`text-2xl font-bold ${getRatingColor(
                          currentRating.speedRating
                        )}`}
                      >
                        {currentRating.speedRating}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentRating.speedRating}
                      onChange={(e) =>
                        setCurrentRating({
                          ...currentRating,
                          speedRating: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Zayıf</span>
                      <span>Orta</span>
                      <span>İyi</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>

                  {/* Şut */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-gray-700 flex items-center gap-2">
                        💥 Şut
                      </label>
                      <span
                        className={`text-2xl font-bold ${getRatingColor(
                          currentRating.techniqueRating
                        )}`}
                      >
                        {currentRating.techniqueRating}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentRating.techniqueRating}
                      onChange={(e) =>
                        setCurrentRating({
                          ...currentRating,
                          techniqueRating: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Zayıf</span>
                      <span>Orta</span>
                      <span>İyi</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>

                  {/* Pas */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-gray-700 flex items-center gap-2">
                        🎯 Pas
                      </label>
                      <span
                        className={`text-2xl font-bold ${getRatingColor(
                          currentRating.passingRating
                        )}`}
                      >
                        {currentRating.passingRating}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentRating.passingRating}
                      onChange={(e) =>
                        setCurrentRating({
                          ...currentRating,
                          passingRating: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Zayıf</span>
                      <span>Orta</span>
                      <span>İyi</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>

                  {/* Fizik */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-gray-700 flex items-center gap-2">
                        💪 Fizik
                      </label>
                      <span
                        className={`text-2xl font-bold ${getRatingColor(
                          currentRating.physicalRating
                        )}`}
                      >
                        {currentRating.physicalRating}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentRating.physicalRating}
                      onChange={(e) =>
                        setCurrentRating({
                          ...currentRating,
                          physicalRating: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Zayıf</span>
                      <span>Orta</span>
                      <span>İyi</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>
                </div>

                {/* Yorum */}
                <div className="mb-6">
                  <label className="block font-semibold text-gray-700 mb-2">
                    Yorum (Opsiyonel)
                  </label>
                  <textarea
                    value={currentRating.comment}
                    onChange={(e) =>
                      setCurrentRating({ ...currentRating, comment: e.target.value })
                    }
                    placeholder="Oyuncunun performansı hakkında düşüncelerinizi yazın..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                    rows={4}
                  />
                </div>

                {/* Kaydet Butonu */}
                <button
                  onClick={handleSaveRating}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 hover:shadow-xl transform hover:scale-[1.02] transition-all"
                >
                  Kaydet ve Sonraki Oyuncu
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Oyuncu Seçin
                </h2>
                <p className="text-gray-600">
                  Soldaki listeden değerlendirmek istediğiniz oyuncuyu seçin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/takimim')}
            className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all"
          >
            İptal
          </button>
          <button
            onClick={handleSubmitAllRatings}
            disabled={ratedCount === 0}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
              ratedCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-xl transform hover:scale-[1.02]'
            }`}
          >
            Tüm Değerlendirmeleri Gönder ({ratedCount})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlayerEvaluationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
          <div className="text-xl text-purple-600">Yükleniyor...</div>
        </div>
      }
    >
      <PlayerEvaluationContent />
    </Suspense>
  );
}
