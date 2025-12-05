import React, { useState, useEffect } from 'react';
import {
    Clock,
    Users,
    Coffee,
    AlertCircle,
    Search,
    Calendar,
    Filter,
    Download,
    CheckCircle2
} from 'lucide-react';
import { activityService, ActivityLog } from '../../../services/activityService';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { USER_ACTIVITY_TABLE } from '../../../models';

export const ActivityTracker: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activityData, setActivityData] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [officeHours, setOfficeHours] = useState<{ start: string; end: string } | null>(null);

    const fetchActivityData = React.useCallback(async () => {
        if (!user?.tenantId) return;

        try {
            setError(null);
            const data = await activityService.getActivityLogs(user.tenantId);
            setActivityData(data);

            // Fetch office hours
            const hours = await activityService.getOfficeHours(user.tenantId);
            if (hours) {
                setOfficeHours({
                    start: hours.officeStartTime,
                    end: hours.officeEndTime
                });
            }
        } catch (err) {
            console.error('Error fetching activity data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch activity data');
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        fetchActivityData();

        if (!user?.tenantId) return;

        // Subscribe to realtime changes
        const channel = supabase
            .channel('activity_tracker_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: USER_ACTIVITY_TABLE,
                    filter: `tenant_id=eq.${user.tenantId}`
                },
                () => {
                    // Refresh data on any change (login, logout, heartbeat)
                    fetchActivityData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.tenantId, fetchActivityData]);

    const filteredData = activityData.filter(log => {
        const matchesSearch = log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.teamName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: activityData.length,
        online: activityData.filter(d => d.status === 'Online').length,
        onBreak: activityData.filter(d => d.status === 'Break').length,
        idle: activityData.filter(d => d.status === 'Idle').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading activity data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Error loading activity data</p>
                    <p className="text-gray-600 text-sm mt-2">{error}</p>
                    <button
                        onClick={fetchActivityData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleExport = () => {
        const headers = ['Employee', 'Team', 'Status', 'Login Time', 'Last Active', 'Total Break', 'Productive Time', 'Idle Time'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                `"${row.employeeName}"`,
                `"${row.teamName}"`,
                row.status,
                `"${row.loginTime}"`,
                `"${row.lastActive}"`,
                `"${row.totalBreakTime}"`,
                `"${row.productiveTime}"`,
                `"${row.idleTime}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `activity_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-blue-600" />
                        Activity Tracker
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Monitor real-time telecaller status and productivity</p>
                </div>
                <div className="flex items-center gap-3">
                    {officeHours && (
                        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-900 font-medium">
                                    Office Hours: {officeHours.start} - {officeHours.end}
                                </span>
                            </div>
                        </div>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <Calendar className="w-4 h-4" />
                        Today
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                    <p className="text-sm text-gray-600">Total Employees Tracked</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Active Now</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.online}</h3>
                    <p className="text-sm text-gray-600">Currently Online</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Coffee className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">On Break</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.onBreak}</h3>
                    <p className="text-sm text-gray-600">Currently on Break</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">Idle</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.idle}</h3>
                    <p className="text-sm text-gray-600">Idle &gt; 3 mins</p>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees or teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                            <option value="All">All Status</option>
                            <option value="Online">Online</option>
                            <option value="Break">On Break</option>
                            <option value="Idle">Idle</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Employee</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Login Time</th>
                                <th className="px-6 py-4 font-semibold">Last Active</th>
                                <th className="px-6 py-4 font-semibold">Total Break</th>
                                <th className="px-6 py-4 font-semibold">Productive Time</th>
                                <th className="px-6 py-4 font-semibold">Idle Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredData.length > 0 ? (
                                filteredData.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${log.avatarColor}`}>
                                                    {log.employeeName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{log.employeeName}</p>
                                                    <p className="text-xs text-gray-500">{log.teamName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${log.status === 'Online' ? 'bg-green-100 text-green-800' :
                                                    log.status === 'Break' ? 'bg-orange-100 text-orange-800' :
                                                        log.status === 'Idle' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                          ${log.status === 'Online' ? 'bg-green-600' :
                                                        log.status === 'Break' ? 'bg-orange-600' :
                                                            log.status === 'Idle' ? 'bg-red-600' :
                                                                'bg-gray-600'}`}></span>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.loginTime}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.lastActive}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.totalBreakTime}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-green-600">{log.productiveTime}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-medium ${log.idleTime !== '0m' ? 'text-red-500' : 'text-gray-400'}`}>
                                                {log.idleTime}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">No activity logs found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
