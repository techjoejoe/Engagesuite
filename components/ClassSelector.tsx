'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { getHostedClasses, Class } from '@/lib/classes';
import { User } from 'firebase/auth';

interface ClassSelectorProps {
  toolName: string;
  toolIcon: string;
}

export default function ClassSelector({ toolName, toolIcon }: ClassSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const hostedClasses = await getHostedClasses(currentUser.uid);
        setClasses(hostedClasses);
      } catch (err) {
        console.error('Error loading classes:', err);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSelectClass = (classId: string) => {
    // Build URL with classId param
    const params = new URLSearchParams(searchParams.toString());
    params.set('classId', classId);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{toolIcon}</div>
          <h1 className="text-2xl font-bold text-white mb-2">Launch {toolName}</h1>
          <p className="text-white/50">Select a class to use {toolName} with</p>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-lg font-bold text-white mb-2">No Classes Yet</h3>
            <p className="text-white/50 text-sm mb-6">Create a class first before launching tools.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectClass(cls.id)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{cls.name}</div>
                    <div className="text-white/40 text-sm">Code: {cls.code} | {cls.memberIds?.length || 0} students</div>
                  </div>
                  <div className="text-indigo-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Launch →
                  </div>
                </div>
              </button>
            ))}

            <div className="text-center pt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
