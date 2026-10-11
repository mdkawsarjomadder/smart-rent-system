import { Suspense } from 'react';
import FlatDetailsContent from './FlatDetailsContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FlatDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8 flex justify-center items-center">
          <p className="text-slate-500 font-medium">Loading apartment details...</p>
        </main>
      }
    >
      <FlatDetailsContent params={params} />
    </Suspense>
  );
}