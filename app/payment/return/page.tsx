'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const orderStatus = searchParams.get('order_status');
    if (orderStatus === 'PAID') setStatus('success');
    else if (orderStatus) setStatus('failed');
    else setStatus('failed');
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
        {status === 'loading' && <Loader2 className="w-16 h-16 animate-spin text-gray-400" />}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-gray-500">Your plan has been activated.</p>
            <Button onClick={() => router.push('/')} className="w-full mt-2">Go to Dashboard</Button>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-2xl font-bold">Payment Failed</h2>
            <p className="text-gray-500">Something went wrong. Please try again.</p>
            <Button onClick={() => router.push('/login')} className="w-full mt-2">Try Again</Button>
          </>
        )}
      </div>
    </div>
  );
}
