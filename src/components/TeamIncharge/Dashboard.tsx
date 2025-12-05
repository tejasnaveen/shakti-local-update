import React, { useState, useEffect } from 'react';
import { Users, FileText, Phone, Target, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TeamService } from '../../services/teamService';
import { customerCaseService } from '../../services/customerCaseService';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardMetrics {
  activeTeams: number;
  totalTelecallers: number;
  activeCases: number;
  callsToday: number;
  caseStatus: {
    pending: number;
    inProgress: number;
    resolved: number;
    highPriority: number;
  };
}

interface TeamCollection {
  team_id: string;
  team_name: string;
  total_collected: number;
  [key: string]: unknown;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeTeams: 0,
    totalTelecallers: 0,
    activeCases: 0,
    callsToday: 0,
    caseStatus: {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      highPriority: 0
    }
  });
  const [teamCollections, setTeamCollections] = useState<TeamCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardMetrics = React.useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setIsLoading(true);

      const newMetrics: DashboardMetrics = {
        activeTeams: 0,
        totalTelecallers: 0,
        activeCases: 0,
        callsToday: 0,
        caseStatus: {
          pending: 0,
          inProgress: 0,
          resolved: 0,
          highPriority: 0
        }
      };

      // Fetch active teams
      try {
        const teams = await TeamService.getTeams(user.tenantId);
        newMetrics.activeTeams = teams.filter(team => team.status === 'active').length;
      } catch (error) {
        console.error('Error fetching teams:', error);
      }

      // Fetch total telecallers
      try {
        const telecallers = await TeamService.getAllTelecallers(user.tenantId);
        newMetrics.totalTelecallers = telecallers.length;
      } catch (error) {
        console.error('Error fetching telecallers:', error);
      }

      // Fetch active cases (not closed)
      let allCases: Array<{ status?: string; case_status?: string; priority?: string }> = [];
      try {
        allCases = await customerCaseService.getAllCases(user.tenantId);
        newMetrics.activeCases = allCases.filter(caseItem =>
          caseItem.status !== 'closed' && caseItem.case_status !== 'closed'
        ).length;
      } catch (error) {
        console.error('Error fetching cases:', error);
      }

      // Fetch calls today
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

        const { count: callsToday } = await supabase
          .from('case_call_logs')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenantId)
          .gte('created_at', startOfDay)
          .lt('created_at', endOfDay);

        newMetrics.callsToday = callsToday || 0;
      } catch (error) {
        console.error('Error fetching calls today:', error);
      }

      // Fetch case status counts
      if (allCases.length > 0) {
        newMetrics.caseStatus.pending = allCases.filter(c => c.case_status === 'pending').length;
        newMetrics.caseStatus.inProgress = allCases.filter(c => c.case_status === 'in_progress').length;
        newMetrics.caseStatus.resolved = allCases.filter(c => c.case_status === 'resolved').length;
        newMetrics.caseStatus.highPriority = allCases.filter(c => c.priority === 'high' || c.priority === 'urgent').length;
      }

      setMetrics(newMetrics);

      // Fetch team collections for donut chart
      try {
        const collections = await TeamService.getTeamCollections(user.tenantId);
        setTeamCollections(collections);
      } catch (error) {
        console.error('Error fetching team collections:', error);
        setTeamCollections([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchDashboardMetrics();
    }
  }, [user?.tenantId, fetchDashboardMetrics]);
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Teams</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : metrics.activeTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Telecallers</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : metrics.totalTelecallers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3 mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : metrics.activeCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3 mr-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Today</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : metrics.callsToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance and Case Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Collections</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : teamCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="w-12 h-12 mb-2 text-gray-300" />
              <p className="text-center">No collection data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teamCollections}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total_collected"
                    nameKey="team_name"
                  >
                    {teamCollections.map((_, index) => {
                      const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => {
                      const data = entry.payload as TeamCollection;
                      return `${value}: ₹${data.total_collected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">Pending Cases</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{isLoading ? '...' : metrics.caseStatus.pending}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="font-medium text-gray-900">In Progress</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{isLoading ? '...' : metrics.caseStatus.inProgress}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium text-gray-900">Resolved Today</span>
              </div>
              <span className="text-xl font-bold text-green-600">{isLoading ? '...' : metrics.caseStatus.resolved}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-red-500 mr-3" />
                <span className="font-medium text-gray-900">High Priority</span>
              </div>
              <span className="text-xl font-bold text-red-600">{isLoading ? '...' : metrics.caseStatus.highPriority}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};