'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsSummary, AnalyticsFilter } from '@/lib/analytics';
import HostMenu from '@/components/HostMenu';
import { onAuthStateChange } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<AnalyticsFilter['range']>('30d');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (!user) {
                router.push('/login');
            } else {
                loadStats();
            }
        });
        return () => unsubscribe();
    }, [router, filter]);

    const loadStats = async () => {
        setLoading(true);
        const data = await getAnalyticsSummary({ range: filter });
        setStats(data);
        setLoading(false);
    };

    const downloadCSV = () => {
        if (!stats) return;

        // Flatten data for CSV
        const rows = [
            ['Metric', 'Value'],
            ['Total Users', stats.totalUsers],
            ['New Users', stats.newUsers],
            ['Active Classes', stats.classes.active],
            ['Expired Classes', stats.classes.expired],
            ['Total Points Awarded', stats.pointStats.total],
            [],
            ['Activity Type', 'Launches'],
            ...Object.entries(stats.activityStats.byType).map(([Type, Count]) => [Type, Count]),
            [],
            ['Date', 'Points Awarded'],
            ...Object.entries(stats.pointStats.byDate).map(([Date, Points]) => [Date, Points]),
            [],
            ['Top Scanners (ID)', 'Name', 'Points'],
            ...stats.topScanners.map((s: any) => [s.id, s.name, s.points])
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `analytics_report_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <HostMenu currentPage="Analytics" />
                <div className="animate-pulse text-xl font-semibold text-white/70 dark:text-gray-300">Loading Report...</div>
            </div>
        );
    }

    if (!stats) return null;

    // Helper for simple bar charts
    const BarChart = ({ data, color = 'bg-blue-500', label = 'Count' }: { data: Record<string, number>, color?: string, label?: string }) => {
        const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])); // Sort by date
        if (entries.length === 0) return <div className="text-gray-400 italic py-4">No data for this period</div>;

        const max = Math.max(...Object.values(data) as number[], 1);

        return (
            <div className="flex items-end gap-1 h-32 w-full pt-4">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex-1 flex flex-col items-center group relative">
                        <div
                            className={`w-full max-w-[20px] ${color} rounded-t-sm opacity-80 hover:opacity-100 transition-all`}
                            style={{ height: `${(val / max) * 100}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                            {key}: {val} {label}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-transparent p-6 transition-colors duration-300">
            <HostMenu currentPage="Analytics" />

            <div className="container mx-auto max-w-6xl mt-8 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white dark:text-white">
                            Super Admin Analytics
                        </h1>
                        <p className="text-white/60 dark:text-gray-400">System-wide performance metrics</p>
                    </div>

                    <div className="flex gap-2">
                        {(['7d', '30d', '90d', 'all'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setFilter(r)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === r
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/10 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                        <Button
                            variant="secondary"
                            onClick={downloadCSV}
                            className="ml-2 !bg-slate-800 !text-white hover:!bg-slate-700 dark:!bg-white dark:!text-slate-900 border border-slate-700 dark:border-white/20"
                        >
                            ⬇ Export CSV
                        </Button>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Users</div>
                        <div className="text-3xl font-black text-white dark:text-white">{stats.totalUsers}</div>
                        <div className="text-sm text-green-500 font-bold">+{stats.newUsers} new</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Active Classes</div>
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.classes.active}</div>
                        <div className="text-sm text-white/60">of {stats.classes.total} total</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expired Classes</div>
                        <div className="text-3xl font-black text-red-500">{stats.classes.expired}</div>
                        <div className="text-sm text-white/60">Archived</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Points Awarded</div>
                        <div className="text-3xl font-black text-yellow-500">{stats.pointStats.total}</div>
                        <div className="text-sm text-white/60">in selected period</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Points Over Time */}
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-white dark:text-white mb-4">Points Awarded (Daily)</h3>
                        <BarChart data={stats.pointStats.byDate} color="bg-yellow-400" label="Points" />
                    </div>

                    {/* Activity Launches */}
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-white dark:text-white mb-4">Activities Launched (Daily)</h3>
                        {/* We need to aggregate all activities by date for this simple chart */}
                        <BarChart
                            data={Object.entries(stats.activityStats.byDate).reduce((acc: Record<string, number>, [date, types]: [string, any]) => {
                                acc[date] = Object.values(types).reduce((a: any, b: any) => a + b, 0) as number;
                                return acc;
                            }, {})}
                            color="bg-purple-500"
                            label="Launches"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity Breakdown */}
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-white dark:text-white mb-6">Activity Popularity</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.activityStats.byType).length === 0 && <p className="text-white/60 italic">No activity data.</p>}
                            {Object.entries(stats.activityStats.byType).map(([type, count]: [string, any]) => (
                                <div key={type}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                                        <span className="text-white/60 dark:text-gray-400 font-mono">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(count / Math.max(...Object.values(stats.activityStats.byType) as number[], 1)) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Scanners */}
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/10 dark:border-slate-700 overflow-hidden">
                        <h3 className="text-lg font-bold text-white dark:text-white mb-6">Top Scanners (Lifetime)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-white/60 uppercase bg-white/5 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Rank</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topScanners.length === 0 && (
                                        <tr><td colSpan={3} className="text-center py-4 text-white/60">No scanner data available.</td></tr>
                                    )}
                                    {stats.topScanners.map((student: any, index: number) => (
                                        <tr key={index} className="border-b border-white/10 dark:border-slate-700 last:border-0 hover:bg-white/5 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-400">#{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-white dark:text-white">{student.name}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{student.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
