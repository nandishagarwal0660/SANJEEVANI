import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Sanjivani - Clinical Triage',
  description: 'Clinical-grade multilingual health triage system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-sand-50">
      <body className={`${inter.variable} ${plusJakarta.variable} font-body text-slate-800 antialiased min-h-screen bg-sand-50`}>
        {children}
      </body>
    </html>
  );
}
