import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';

export interface AnalyticsEvent {
    id?: string;
    type: string;
    activityType?: string;
    classId?: string;
    userId?: string;
    points?: number;
    timestamp: any;
}

export interface AnalyticsFilter {
    range: '7d' | '30d' | '90d' | 'all' | 'custom';
    startDate?: Date;
    endDate?: Date;
}

// Log generic activity start
export const logActivityUsage = async (activityType: string, classId: string) => {
    try {
        await addDoc(collection(db, 'analytics_events'), {
            type: 'activity_start',
            activityType,
            classId,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging analytics:', error);
    }
};

// Log point transaction (for central reporting)
export const logPointTransaction = async (userId: string, points: number, source: string, classId?: string) => {
    try {
        await addDoc(collection(db, 'analytics_events'), {
            type: 'point_awarded',
            userId,
            points,
            source, // e.g. 'qr_code', 'manual', 'game'
            classId,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging point transaction:', error);
    }
};

// Alias for compatibility
export const logEvent = async (eventName: string, data: any) => {
    try {
        await addDoc(collection(db, 'analytics_events'), {
            type: eventName,
            ...data,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging event:', error);
    }
};

// Helper: Get start date based on range
const getStartDate = (filter: AnalyticsFilter): Date => {
    if (filter.startDate) return filter.startDate;
    const now = new Date();
    switch (filter.range) {
        case '7d': return new Date(now.setDate(now.getDate() - 7));
        case '90d': return new Date(now.setDate(now.getDate() - 90));
        case 'all': return new Date(0); // Epoch
        case '30d':
        default: return new Date(now.setDate(now.getDate() - 30));
    }
};

export const getAnalyticsSummary = async (filter: AnalyticsFilter = { range: '30d' }) => {
    try {
        const startDate = getStartDate(filter);
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = filter.endDate ? Timestamp.fromDate(filter.endDate) : Timestamp.now();

        // 1. Fetch Analytics Events (Activities & Points)
        // Note: For high volume, this should uses aggregation queries, but for now fetching docs is fine.
        const eventsRef = collection(db, 'analytics_events');
        const qEvents = query(
            eventsRef,
            where('timestamp', '>=', startTimestamp),
            where('timestamp', '<=', endTimestamp),
            orderBy('timestamp', 'asc') // Time series data
        );
        const eventsSnap = await getDocs(qEvents);

        const activityUsage: Record<string, number> = {};
        const activityByDate: Record<string, Record<string, number>> = {}; // date -> type -> count
        const pointsByDate: Record<string, number> = {};
        let totalPointsAwarded = 0;

        eventsSnap.forEach(doc => {
            const data = doc.data();
            const dateKey = data.timestamp?.toDate().toISOString().split('T')[0] || 'Unknown';

            // Activity Stats
            if (data.type === 'activity_start' && data.activityType) {
                activityUsage[data.activityType] = (activityUsage[data.activityType] || 0) + 1;

                if (!activityByDate[dateKey]) activityByDate[dateKey] = {};
                activityByDate[dateKey][data.activityType] = (activityByDate[dateKey][data.activityType] || 0) + 1;
            }

            // Point Stats
            if (data.type === 'point_awarded') {
                const pts = data.points || 0;
                pointsByDate[dateKey] = (pointsByDate[dateKey] || 0) + pts;
                totalPointsAwarded += pts;
            }
        });

        // 2. Class Stats (Snapshot, not time-series unless we track creationDate)
        const classesSnap = await getDocs(collection(db, 'classes'));
        let activeClasses = 0;
        let expiredClasses = 0;
        const now = new Date();

        classesSnap.forEach(doc => {
            const data = doc.data();
            // Check if expired (assuming expiresAt field exists, or logic based on creation)
            // If no expiresAt, assume active? Or use 'status' field?
            // Let's assume expiresAt exists as per previous work.
            if (data.expiresAt) {
                const expires = data.expiresAt.toDate();
                if (expires < now) expiredClasses++;
                else activeClasses++;
            } else {
                activeClasses++; // Default to active if no expiration
            }
        });

        // 3. User Stats
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;
        // Naive "active" check: created or active timestamp > startDate
        // (Requires fetching all users, could be heavy. Optimization: Use 'count' aggregation if available)
        // For "New Users", we filter by createdAt
        let newUsers = 0;
        const topScanners: any[] = []; // Placeholder, would require client-side sorting of all users or specific query

        usersSnap.forEach(doc => {
            const u = doc.data();
            if (u.createdAt >= startDate.getTime()) {
                newUsers++;
            }
            // Add to potential top scanners list (simplified)
            if (u.lifetimePoints > 0) {
                topScanners.push({
                    name: u.displayName || u.email || 'User',
                    points: u.lifetimePoints,
                    id: doc.id
                });
            }
        });

        // Sort Top Scanners
        topScanners.sort((a, b) => b.points - a.points);

        return {
            totalUsers,
            newUsers,
            classes: {
                active: activeClasses,
                expired: expiredClasses,
                total: activeClasses + expiredClasses
            },
            activityStats: {
                total: Object.values(activityUsage).reduce((a, b) => a + b, 0),
                byType: activityUsage,
                byDate: activityByDate
            },
            pointStats: {
                total: totalPointsAwarded,
                byDate: pointsByDate
            },
            topScanners: topScanners.slice(0, 10) // Top 10
        };

    } catch (error) {
        console.error('Error getting analytics summary:', error);
        return {
            totalUsers: 0,
            newUsers: 0,
            classes: { active: 0, expired: 0, total: 0 },
            activityStats: { total: 0, byType: {}, byDate: {} },
            pointStats: { total: 0, byDate: {} },
            topScanners: []
        };
    }
};
