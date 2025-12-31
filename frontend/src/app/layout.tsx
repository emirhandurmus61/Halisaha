import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Halısaha - Rezervasyon ve Sosyal Ağ',
  description: 'Halısaha rezervasyonu yap, oyuncu bul, takım kur',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
