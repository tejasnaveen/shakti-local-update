import { supabase } from '../lib/supabase';
import { EMPLOYEE_TABLE, USER_ACTIVITY_TABLE } from '../models';

export interface ActivityLog {
    id: string;
    employeeName: string;
    teamName: string;
    status: 'Online' | 'Break' | 'Offline' | 'Idle';
    loginTime: string;
    lastActive: string;
    totalBreakTime: string;
    productiveTime: string;
    idleTime: string;
    avatarColor: string;
}

const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500',
];

function getRandomColor(seed: string): string {
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function parseUTCDate(dateString: string): Date {
    if (!dateString) return new Date();
    // If it doesn't contain Z or +, assume it's UTC and append Z to ensure it's parsed as UTC
    // This fixes the issue where UTC times are treated as local times
    if (!dateString.includes('Z') && !dateString.includes('+')) {
        return new Date(dateString + 'Z');
    }
    return new Date(dateString);
}

function formatTime(dateString: string): string {
    const date = parseUTCDate(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function getLastActiveText(lastActiveTime: string): string {
    const now = new Date();
    const lastActive = parseUTCDate(lastActiveTime);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else {
        const hours = Math.floor(diffMins / 60);
        return `${hours}h ago`;
    }
}

export const activityService = {
    async getActivityLogs(tenantId: string): Promise<ActivityLog[]> {
        try {
            // Fetch all active employees
            const { data: employees, error: empError } = await supabase
                .from(EMPLOYEE_TABLE)
                .select('id, name, emp_id, role, status')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (empError) {
                console.error('Error fetching employees:', empError);
                throw new Error(empError.message);
            }

            if (!employees || employees.length === 0) {
                return [];
            }

            // Fetch current activity sessions (not logged out)
            const { data: activities, error: actError } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .select('*')
                .eq('tenant_id', tenantId)
                .is('logout_time', null)
                .order('login_time', { ascending: false });

            if (actError) {
                console.error('Error fetching activities:', actError);
                // Don't throw, just continue with empty activities
            }

            const activityMap = new Map();
            if (activities) {
                activities.forEach(activity => {
                    activityMap.set(activity.employee_id, activity);
                });
            }

            const now = new Date();
            const activityLogs: ActivityLog[] = employees.map((emp) => {
                const activity = activityMap.get(emp.id);

                if (!activity) {
                    // Employee has never logged in or is logged out
                    return {
                        id: emp.id,
                        employeeName: emp.name,
                        teamName: emp.role === 'TeamIncharge' ? 'Team Incharge' : 'Telecaller Team',
                        status: 'Offline',
                        loginTime: 'N/A',
                        lastActive: 'N/A',
                        totalBreakTime: '0m',
                        productiveTime: '0h 0m',
                        idleTime: '0m',
                        avatarColor: getRandomColor(emp.id),
                    };
                }

                // Calculate status based on last active time
                const lastActiveTime = parseUTCDate(activity.last_active_time);
                const minutesInactive = Math.floor((now.getTime() - lastActiveTime.getTime()) / 60000);

                let status: 'Online' | 'Break' | 'Offline' | 'Idle' = activity.status;
                let idleTime = '0m';

                // Auto-detect Offline status if inactive for more than 5 minutes (Handles closed tabs)
                if (minutesInactive > 5) {
                    status = 'Offline';
                }
                // Auto-detect idle status if inactive for more than 3 minutes
                else if (status === 'Online' && minutesInactive > 3) {
                    status = 'Idle';
                    idleTime = `${minutesInactive}m`;
                }

                // Calculate productive time
                const loginTime = parseUTCDate(activity.login_time);
                const totalMinutes = Math.floor((now.getTime() - loginTime.getTime()) / 60000);
                const productiveMinutes = Math.max(0, totalMinutes - (activity.total_break_time || 0) - (status === 'Idle' ? minutesInactive : 0));

                // Format time durations properly
                const formatDuration = (minutes: number): string => {
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    if (hours > 0) {
                        return `${hours}h ${mins}m`;
                    }
                    return `${mins}m`;
                };

                return {
                    id: emp.id,
                    employeeName: emp.name,
                    teamName: emp.role === 'TeamIncharge' ? 'Team Incharge' : 'Telecaller Team',
                    status,
                    loginTime: formatTime(activity.login_time),
                    lastActive: getLastActiveText(activity.last_active_time),
                    totalBreakTime: formatDuration(activity.total_break_time || 0),
                    productiveTime: formatDuration(productiveMinutes),
                    idleTime,
                    avatarColor: getRandomColor(emp.id),
                };
            });

            return activityLogs;
        } catch (error) {
            console.error('Error in getActivityLogs:', error);
            throw error;
        }
    },

    async getActivityStats(tenantId: string): Promise<{
        total: number;
        online: number;
        onBreak: number;
        idle: number;
    }> {
        try {
            const logs = await this.getActivityLogs(tenantId);

            return {
                total: logs.length,
                online: logs.filter(l => l.status === 'Online').length,
                onBreak: logs.filter(l => l.status === 'Break').length,
                idle: logs.filter(l => l.status === 'Idle').length,
            };
        } catch (error) {
            console.error('Error in getActivityStats:', error);
            throw error;
        }
    },

    // Track logout
    async trackLogout(employeeId: string, reason?: string): Promise<void> {
        try {
            const updateData: { logout_time: string; status: string; logout_reason?: string } = {
                logout_time: new Date().toISOString(),
                status: 'Offline'
            };

            if (reason) {
                updateData.logout_reason = reason;
            }

            await supabase
                .from(USER_ACTIVITY_TABLE)
                .update(updateData)
                .eq('employee_id', employeeId)
                .is('logout_time', null);
        } catch (error) {
            console.error('Error tracking logout:', error);
        }
    },

    // Update last active time (for heartbeat)
    // If no active session exists (e.g. user logged in before feature was added), create one
    async updateLastActive(employeeId: string, tenantId: string): Promise<void> {
        try {
            // Throttle updates: Check if we updated recently (in local storage or memory) to avoid hammering DB
            const lastUpdateKey = `last_activity_update_${employeeId}`;
            const lastUpdate = localStorage.getItem(lastUpdateKey);
            const now = Date.now();

            // Only update if more than 1 minute has passed
            if (lastUpdate && now - parseInt(lastUpdate) < 60000) {
                return;
            }

            const { data, error } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .update({
                    last_active_time: new Date().toISOString()
                })
                .eq('employee_id', employeeId)
                .is('logout_time', null)
                .select();

            if (error) throw error;

            // Update local storage timestamp
            localStorage.setItem(lastUpdateKey, now.toString());

            // If no active session found, create one (Self-healing)
            if (!data || data.length === 0) {
                console.log('No active session found for heartbeat, creating new one');
                const { error: insertError } = await supabase.from(USER_ACTIVITY_TABLE).insert({
                    tenant_id: tenantId,
                    employee_id: employeeId,
                    login_time: new Date().toISOString(),
                    last_active_time: new Date().toISOString(),
                    status: 'Online',
                    total_break_time: 0
                });

                if (insertError) {
                    // Ignore 409 Conflict (race condition where session was created by another request)
                    const isConflict =
                        insertError.code === '23505' ||
                        insertError.message?.includes('Conflict') ||
                        (insertError as { status?: number }).status === 409;

                    if (isConflict) {
                        // console.log('Session already exists (race condition), ignoring.');
                    } else {
                        console.error('Error creating self-healing session:', insertError);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating last active:', error);
        }
    },

    // Start a break for an employee
    async startBreak(employeeId: string): Promise<void> {
        try {
            const now = new Date().toISOString();

            const { error } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .update({
                    status: 'Break',
                    current_break_start: now,
                    last_active_time: now
                })
                .eq('employee_id', employeeId)
                .is('logout_time', null);

            if (error) throw error;
        } catch (error) {
            console.error('Error starting break:', error);
            throw error;
        }
    },

    // End a break for an employee
    async endBreak(employeeId: string): Promise<void> {
        try {
            // Get current session to calculate break duration
            const { data: session, error: fetchError } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .select('current_break_start, total_break_time')
                .eq('employee_id', employeeId)
                .is('logout_time', null)
                .single();

            if (fetchError) throw fetchError;

            if (!session || !session.current_break_start) {
                console.warn('No active break found for employee');
                return;
            }

            // Calculate break duration in minutes
            const breakStart = parseUTCDate(session.current_break_start);
            const now = new Date();
            const breakDuration = Math.floor((now.getTime() - breakStart.getTime()) / 60000);

            // Update session: clear break start, add to total break time, set status to Online
            const { error: updateError } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .update({
                    status: 'Online',
                    current_break_start: null,
                    total_break_time: (session.total_break_time || 0) + breakDuration,
                    last_active_time: now.toISOString()
                })
                .eq('employee_id', employeeId)
                .is('logout_time', null);

            if (updateError) throw updateError;
        } catch (error) {
            console.error('Error ending break:', error);
            throw error;
        }
    },

    // Get office hours for a tenant
    async getOfficeHours(tenantId: string): Promise<{
        officeStartTime: string;
        officeEndTime: string;
        timezone: string;
        workingDays: number[];
    } | null> {
        try {
            const { data, error } = await supabase
                .from('office_settings')
                .select('office_start_time, office_end_time, timezone, working_days')
                .eq('tenant_id', tenantId)
                .single();

            if (error) {
                // If no settings found, return default
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return {
                officeStartTime: data.office_start_time,
                officeEndTime: data.office_end_time,
                timezone: data.timezone,
                workingDays: data.working_days
            };
        } catch (error) {
            console.error('Error fetching office hours:', error);
            return null;
        }
    },

    // Save office hours for a tenant
    async saveOfficeHours(
        tenantId: string,
        officeStartTime: string,
        officeEndTime: string,
        timezone: string = 'Asia/Kolkata',
        workingDays: number[] = [1, 2, 3, 4, 5, 6]
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('office_settings')
                .upsert({
                    tenant_id: tenantId,
                    office_start_time: officeStartTime,
                    office_end_time: officeEndTime,
                    timezone,
                    working_days: workingDays,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'tenant_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving office hours:', error);
            throw error;
        }
    },
};
