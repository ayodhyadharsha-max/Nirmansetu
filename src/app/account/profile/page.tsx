'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500">
      Loading Customer Profile...
    </div>
  );
}
