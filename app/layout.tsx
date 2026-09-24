import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'ระบบติดตามชั่วโมงสหกิจและกิจกรรม | CSMJU2030',
  description:
    'CSMJU Co-op Prep & Activity Hours Tracking System — สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        <NavBar />

        <main className="min-h-[calc(100vh-76px)] lg:ml-[250px]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}