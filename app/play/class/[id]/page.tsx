'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onClassChange, getClassByCode, Class } from '@/lib/classes';
import { onAuthStateChange } from '@/lib/auth';
import UserDash from '@/components/student/UserDash';

export default function StudentClassDashboard() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [classData, setClassData] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                const storedId = localStorage.getItem('userId');
                if (storedId) setUserId(storedId);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let isMounted = true;

        const setupSubscription = async () => {
            let targetClassId = id;

            // If it looks like a short code (not starting with 'class_'), try to resolve it
            if (!id.startsWith('class_')) {
                try {
                    const classObj = await getClassByCode(id);
                    if (!isMounted) return;

                    if (classObj) {
                        targetClassId = classObj.id;
                    } else {
                        setLoading(false); // Class not found
                        return;
                    }
                } catch (error) {
                    console.error('Error resolving class code:', error);
                    if (isMounted) setLoading(false);
                    return;
                }
            }

            if (!isMounted) return;

            unsubscribe = onClassChange(targetClassId, (data) => {
                if (isMounted) {
                    console.log('Class data updated:', data.currentActivity);
                    setClassData(data);
                    setLoading(false);
                }
            });
        };

        setupSubscription();

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Loading Class...</p>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full border border-gray-100">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Class Not Found</h2>
                    <p className="text-gray-500">This class doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return <UserDash classData={classData} userId={userId} />;
}
