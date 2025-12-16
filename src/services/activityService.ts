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
    todayTotalBreakMinutes: number;
    currentBreakStart: string | null;
    rawLoginTime: string;
    rawLastActive: string;
    totalIdleMinutes: number;
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
    async getActivityLogs(tenantId: string, page: number = 0, pageSize: number = 100): Promise<{ logs: ActivityLog[], hasMore: boolean }> {
        try {
            // Fetch active employees with pagination
            const { data: employees, error: empError } = await supabase
                .from(EMPLOYEE_TABLE)
                .select('id, name, emp_id, role, status')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .order('name', { ascending: true })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (empError) throw new Error(empError.message);

            if (!employees || employees.length === 0) {
                return { logs: [], hasMore: false };
            }

            const hasMore = employees.length === pageSize;

            // Fetch ALL activity sessions for today (00:00 to now) to get complete daily history
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: activities, error: actError } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .select('*')
                .eq('tenant_id', tenantId)
                .gte('login_time', today.toISOString())
                .order('login_time', { ascending: true }); // Order by time for correct sequence

            if (actError) console.error('Error fetching activities:', actError);

            // Group activities by employee
            const employeeActivities = new Map<string, any[]>();
            if (activities) {
                activities.forEach(act => {
                    const empActs = employeeActivities.get(act.employee_id) || [];
                    empActs.push(act);
                    employeeActivities.set(act.employee_id, empActs);
                });
            }

            const now = new Date();
            const activityLogs: ActivityLog[] = employees.map((emp) => {
                const empActs = employeeActivities.get(emp.id) || [];

                if (empActs.length === 0) {
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
                        todayTotalBreakMinutes: 0,
                        currentBreakStart: null,
                        rawLoginTime: '',
                        rawLastActive: '',
                        totalIdleMinutes: 0
                    };
                }

                // 1. Login Time: First session's login time
                const firstSession = empActs[0];
                const loginTime = parseUTCDate(firstSession.login_time);

                // 2. Current Status & Active Session
                // Find potential active session (no logout time)
                const activeSession = empActs.find(a => !a.logout_time);

                let currentStatus: 'Online' | 'Break' | 'Offline' | 'Idle' = 'Offline';
                let rawLastActive = '';
                let currentBreakStart = null;

                if (activeSession) {
                    currentStatus = activeSession.status;
                    rawLastActive = activeSession.last_active_time;
                    currentBreakStart = activeSession.current_break_start;

                    // Check for Real-time Idle (3 mins threshold)
                    const lastActiveTime = parseUTCDate(activeSession.last_active_time);
                    const minutesInactive = Math.floor((now.getTime() - lastActiveTime.getTime()) / 60000);

                    if (currentStatus === 'Online' && minutesInactive > 3) {
                        currentStatus = 'Idle';
                    } else if (currentStatus === 'Online' && minutesInactive > 5) {
                        // Logic handled by auto-logout triggers usually, but for display:
                        // currentStatus = 'Idle'; // Still idle until actually logged out
                    }
                } else {
                    // If no active session, valid status is Offline, but check last session
                    const lastSession = empActs[empActs.length - 1];
                    rawLastActive = lastSession.logout_time;
                }

                // 3. Total Logged-in Time
                let totalLoggedInMinutes = 0;
                let totalIdleMinutes = 0;

                empActs.forEach(act => {
                    const start = parseUTCDate(act.login_time);
                    const end = act.logout_time ? parseUTCDate(act.logout_time) : now;
                    const duration = Math.floor((end.getTime() - start.getTime()) / 60000);
                    totalLoggedInMinutes += Math.max(0, duration);

                    // Accumulate stored idle time
                    totalIdleMinutes += (act.total_idle_time || 0);

                    // Add current live idle time if applicable
                    if (!act.logout_time && currentStatus === 'Idle') {
                        const lastActive = parseUTCDate(act.last_active_time);
                        const currentIdle = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
                        totalIdleMinutes += currentIdle;
                    }
                });

                // 4. Total Break Calculation
                // Rule: Break = Time between sessions (Logout -> Next Login)
                let totalBreakMinutes = 0;
                for (let i = 0; i < empActs.length - 1; i++) {
                    const currentSessionEnd = empActs[i].logout_time ? parseUTCDate(empActs[i].logout_time) : null;
                    const nextSessionStart = parseUTCDate(empActs[i + 1].login_time);

                    if (currentSessionEnd) {
                        const breakDuration = Math.floor((nextSessionStart.getTime() - currentSessionEnd.getTime()) / 60000);
                        if (breakDuration > 0) {
                            totalBreakMinutes += breakDuration;
                        }
                    }
                }

                // Add "In-session" breaks (manual break mode)
                // The previous logic stored manual breaks in 'total_break_time'. 
                // We should include this if the user considers "Manual Break" distinct from "Logout".
                // Based on "For every logout–login cycle... Break start = Logout time", it implies logout IS the break.
                // However, the system has a "Take Break" button which keeps the session but changes status.
                // We should include 'total_break_time' from sessions too?
                // "Auto logout is counted as a Break".
                // Let's sum field `total_break_time` from DB which tracks manual breaks.
                const manualBreakMinutes = empActs.reduce((acc, curr) => acc + (curr.total_break_time || 0), 0);
                totalBreakMinutes += manualBreakMinutes;

                // If currently on "Break" status (manual break)
                if (currentStatus === 'Break' && currentBreakStart) {
                    const breakStart = parseUTCDate(currentBreakStart);
                    totalBreakMinutes += Math.floor((now.getTime() - breakStart.getTime()) / 60000);
                }

                // 5. Productive Time
                // Productive Time = Total Logged-in Time − Idle Time − Manual Break Time within session
                // (Note: Total Logged-in includes manual breaks, so we subtract them. 
                //  Inter-session breaks are NOT in Total Logged-in, so don't subtract those.)
                const sessionBreakMinutes = manualBreakMinutes + (currentStatus === 'Break' && currentBreakStart ? Math.floor((now.getTime() - parseUTCDate(currentBreakStart).getTime()) / 60000) : 0);

                const productiveMinutes = Math.max(0, totalLoggedInMinutes - totalIdleMinutes - sessionBreakMinutes);

                // Format helpers
                const formatDuration = (mins: number): string => {
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    if (h > 0) return `${h}h ${m}m`;
                    return `${m}m`;
                };

                return {
                    id: emp.id,
                    employeeName: emp.name,
                    teamName: emp.role === 'TeamIncharge' ? 'Team Incharge' : 'Telecaller Team',
                    status: currentStatus,
                    loginTime: formatTime(firstSession.login_time),
                    lastActive: rawLastActive ? getLastActiveText(rawLastActive) : 'N/A',
                    totalBreakTime: formatDuration(totalBreakMinutes),
                    productiveTime: formatDuration(productiveMinutes),
                    idleTime: formatDuration(totalIdleMinutes),
                    avatarColor: getRandomColor(emp.id),
                    todayTotalBreakMinutes: totalBreakMinutes,
                    currentBreakStart: currentBreakStart,
                    rawLoginTime: firstSession.login_time,
                    rawLastActive: rawLastActive || '',
                    totalIdleMinutes: totalIdleMinutes
                };
            });

            return { logs: activityLogs, hasMore };
        } catch (error) {
            console.error('Error in getActivityLogs:', error);
            throw error;
        }
    },

    // Simplified stats count - consistent with new logic if needed, but quick count is fine for now
    async getActivityStats(tenantId: string): Promise<{
        total: number;
        online: number;
        onBreak: number;
        idle: number;
    }> {
        try {
            // Re-using logs logic ensures consistency
            const { logs } = await this.getActivityLogs(tenantId, 0, 1000);

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

    // Update last active time (heartbeat)
    async updateLastActive(employeeId: string, tenantId: string): Promise<void> {
        try {
            const lastUpdateKey = `last_activity_update_${employeeId}`;
            const lastUpdate = localStorage.getItem(lastUpdateKey);
            const now = Date.now();

            // Throttle to 1 min
            if (lastUpdate && now - parseInt(lastUpdate) < 60000) {
                return;
            }

            // Get current session to handle Idle -> Online transition accumulation
            const { data: session } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .select('status, last_active_time, total_idle_time')
                .eq('employee_id', employeeId)
                .is('logout_time', null)
                .single();

            let updatePayload: any = {
                last_active_time: new Date().toISOString()
            };

            // If coming back from Idle (status was Idle, but now user is active), add to total_idle_time
            // Note: The 'status' column in DB might be 'Online' even if frontend thinks 'Idle' due to delay.
            // But if we explicitly set it to Idle in DB (auto-idle), this captures it.
            // If the user was just effectively idle but status didn't change in DB, we can't capture it easily here without more state.
            // However, the rule "Idle Time starts when status changes to Idle" implies we should rely on the status field.

            if (session && session.status === 'Idle') {
                const lastActive = parseUTCDate(session.last_active_time);
                const idleDuration = Math.floor((now - lastActive.getTime()) / 60000);

                updatePayload.status = 'Online'; // Auto-resume
                updatePayload.total_idle_time = (session.total_idle_time || 0) + idleDuration;
            }

            const { data, error } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .update(updatePayload)
                .eq('employee_id', employeeId)
                .is('logout_time', null)
                .select();

            if (error) throw error;

            localStorage.setItem(lastUpdateKey, now.toString());

            // Self-healing session creation
            if (!data || data.length === 0) {
                console.log('No active session found for heartbeat, creating new one');
                const { error: insertError } = await supabase.from(USER_ACTIVITY_TABLE).insert({
                    tenant_id: tenantId,
                    employee_id: employeeId,
                    login_time: new Date().toISOString(),
                    last_active_time: new Date().toISOString(),
                    status: 'Online',
                    total_break_time: 0,
                    total_idle_time: 0
                });
                if (insertError) {/* Handle conflict silently */ }
            }
        } catch (error) {
            console.error('Error updating last active:', error);
        }
    },

    // Set status to Idle explicitly
    async setIdle(employeeId: string): Promise<void> {
        try {
            await supabase
                .from(USER_ACTIVITY_TABLE)
                .update({
                    status: 'Idle'
                    // We don't update last_active_time here so we can calculate duration later
                })
                .eq('employee_id', employeeId)
                .is('logout_time', null);
        } catch (error) {
            console.error('Error setting idle:', error);
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
            const { data: session, error: fetchError } = await supabase
                .from(USER_ACTIVITY_TABLE)
                .select('current_break_start, total_break_time')
                .eq('employee_id', employeeId)
                .is('logout_time', null)
                .single();

            if (fetchError) throw fetchError;

            if (!session || !session.current_break_start) {
                return;
            }

            const breakStart = parseUTCDate(session.current_break_start);
            const now = new Date();
            const breakDuration = Math.floor((now.getTime() - breakStart.getTime()) / 60000);

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
