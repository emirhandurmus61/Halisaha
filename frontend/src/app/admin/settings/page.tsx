'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';

export default function SystemSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'payments' | 'security'>('general');

  useEffect(() => {
    if (!authService.isAdmin()) {
      router.push('/');
      return;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Sistem Ayarları</h1>
          <p className="text-gray-600">Sistemin genel ayarlarını yönetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'general'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Genel
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'email'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    E-posta
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'payments'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Ödemeler
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'security'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Güvenlik
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Genel Ayarlar</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Adı</label>
                      <input
                        type="text"
                        defaultValue="Halısaha Yönetim ve Sosyal Ağı"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Açıklaması</label>
                      <textarea
                        rows={3}
                        defaultValue="Halı saha rezervasyonu ve futbol takımı yönetimi için kapsamlı platform"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bakım Modu</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-gray-700">Bakım modunu etkinleştir</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Bakım modu etkinleştirildiğinde, yalnızca adminler siteye erişebilir.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Kayıtlar</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-gray-700">Yeni kullanıcı kayıtlarına izin ver</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">E-posta Ayarları</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Sunucusu</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                        <input
                          type="number"
                          defaultValue="587"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Şifreleme</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                          <option>TLS</option>
                          <option>SSL</option>
                          <option>None</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                      <input
                        type="email"
                        placeholder="noreply@halisaha.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gönderen Adı</label>
                      <input
                        type="text"
                        defaultValue="Halısaha Platform"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Ödeme Ayarları</h2>
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-blue-900">Ödeme entegrasyonu geliştirme aşamasında</p>
                          <p className="text-sm text-blue-700 mt-1">
                            iyzico, Stripe ve PayTR entegrasyonları eklenecektir.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan Para Birimi</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option>TRY - Türk Lirası</option>
                        <option>USD - Amerikan Doları</option>
                        <option>EUR - Euro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform Komisyon Oranı (%)</label>
                      <input
                        type="number"
                        defaultValue="10"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Her rezervasyondan alınacak platform komisyon oranı
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rezervasyon Tutarı (TRY)</label>
                      <input
                        type="number"
                        defaultValue="50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Güvenlik Ayarları</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">JWT Token Süresi (saat)</label>
                      <input
                        type="number"
                        defaultValue="24"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Kullanıcı oturum süresini belirler
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Şifre Uzunluğu</label>
                      <input
                        type="number"
                        defaultValue="6"
                        min="6"
                        max="32"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">İki Faktörlü Kimlik Doğrulama</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-gray-700">2FA'yı zorunlu kıl (adminler için)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Oturum Limiti</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-gray-700">Her kullanıcı için maksimum 3 aktif oturum</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IP Tabanlı Kısıtlamalar</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-gray-700">Şüpheli IP'lerden gelen istekleri engelle</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Rate Limiting</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">İstek Limiti (dakika başına)</label>
                          <input
                            type="number"
                            defaultValue="100"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Login Denemesi (saat başına)</label>
                          <input
                            type="number"
                            defaultValue="5"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  İptal
                </button>
                <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
