'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountAddressesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500">
      Loading Saved Addresses...
    </div>
  );
}
