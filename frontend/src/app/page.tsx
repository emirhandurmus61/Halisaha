import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Modern & Clean */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Halısaha
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Saha Rezervasyon</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/sahalar" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Sahalar
              </Link>
              <Link href="/giris" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                Üye Ol
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern Gradient */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  ⚽ Türkiye'nin En Hızlı Rezervasyon Platformu
                </span>
              </div>

              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-gray-900">Halısaha</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Rezervasyonu
                </span>
                <br />
                <span className="text-gray-900">Çok Kolay!</span>
              </h2>

              <p className="text-xl text-gray-600 leading-relaxed">
                Dilediğin sahayı anında rezerve et, oyuncu bul, takım kur ve maçlarını takip et.
                Modern halısaha yönetim platformu.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/kayit" className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center">
                  Hemen Başla
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/sahalar" className="px-8 py-4 bg-white text-gray-900 rounded-2xl text-lg font-semibold hover:shadow-xl border-2 border-gray-200 hover:border-green-500 transition-all flex items-center justify-center">
                  Sahaları İncele
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-green-600">6+</div>
                  <div className="text-sm text-gray-600">Tesis</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">10+</div>
                  <div className="text-sm text-gray-600">Saha</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">Güvenli</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  {/* Mock Calendar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-gray-900">Rezervasyon Yap</div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Bugün
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-600 mb-2">
                    <div>Pzt</div>
                    <div>Sal</div>
                    <div>Çar</div>
                    <div>Per</div>
                    <div>Cum</div>
                    <div>Cmt</div>
                    <div>Paz</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {[...Array(35)].map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                          i === 15
                            ? 'bg-green-500 text-white font-bold'
                            : i > 7 && i < 28
                            ? 'bg-gray-100 text-gray-900 hover:bg-green-100 cursor-pointer'
                            : 'text-gray-300'
                        }`}
                      >
                        {i > 7 && i < 28 ? i - 7 : ''}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">14:00 - 15:00</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Müsait</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">16:00 - 17:00</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Müsait</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Neden <span className="text-green-600">Halısaha?</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern teknoloji ile halısaha deneyimini bir üst seviyeye taşıyoruz
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-white hover:shadow-2xl transition-all border border-green-100 hover:border-green-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Kolay Rezervasyon</h4>
              <p className="text-gray-600 leading-relaxed">
                İstediğin saha ve saati seç, anında rezerve et. Çifte rezervasyon engelleme sistemi ile %100 güvenli.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-white hover:shadow-2xl transition-all border border-green-100 hover:border-green-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Oyuncu Bul</h4>
              <p className="text-gray-600 leading-relaxed">
                Eksik oyuncunu hemen bul veya açık maçlara katıl. Sosyal ağ özelliği ile yeni arkadaşlar edin.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-white hover:shadow-2xl transition-all border border-green-100 hover:border-green-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">İstatistikler & ELO</h4>
              <p className="text-gray-600 leading-relaxed">
                Maç istatistiklerini takip et, ELO puanını yükselt, rozetler kazan. Oyuncu performansını ölç.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-600 to-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hemen Başla, İlk Maçını Bul!
          </h3>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Ücretsiz üye ol, sahayı rezerve et ve oyuncu topla. Hepsi bu kadar basit.
          </p>
          <Link href="/kayit" className="inline-flex items-center px-8 py-4 bg-white text-green-600 rounded-2xl text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all">
            Ücretsiz Üye Ol
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white">Halısaha</h1>
              </div>
              <p className="text-gray-400 max-w-md">
                Modern halısaha yönetim ve sosyal ağ platformu. Rezervasyon yap, oyuncu bul, maç kaydet.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/sahalar" className="hover:text-green-400 transition-colors">Sahalar</Link></li>
                <li><Link href="/oyuncu-bul" className="hover:text-green-400 transition-colors">Oyuncu Bul</Link></li>
                <li><Link href="/giris" className="hover:text-green-400 transition-colors">Giriş Yap</Link></li>
                <li><Link href="/kayit" className="hover:text-green-400 transition-colors">Üye Ol</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Gizlilik</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Şartlar</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 Halısaha. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
