import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, ChevronDown, UserCheck, Users, User, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { customerCaseService, CustomerCase } from '../../services/customerCaseService';
import { TeamService } from '../../services/teamService';
import { useNotification } from '../../contexts/NotificationContext';

type ViewMode = 'all' | 'team' | 'telecaller';

interface CaseWithSelection extends CustomerCase {
  selected?: boolean;
  telecaller_name?: string;
  team_name?: string;
}

interface BulkAssignData {
  teamId: string;
  telecallerId: string;
  priority: string;
}

interface BulkReassignData {
  fromTeamId?: string;
  fromTelecallerId?: string;
  toTeamId: string;
  toTelecallerId: string;
  reason: string;
}

export const AssignCasesView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [cases, setCases] = useState<CaseWithSelection[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseWithSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    teamId: '',
    telecallerId: '',
    caseStatus: '',
    assignmentStatus: '',
    dpdMin: '',
    dpdMax: '',
    dateFrom: '',
    dateTo: '',
    priority: ''
  });

  const [teams, setTeams] = useState<any[]>([]);
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const [bulkAssignData, setBulkAssignData] = useState<BulkAssignData>({
    teamId: '',
    telecallerId: '',
    priority: 'medium'
  });

  const [bulkReassignData, setBulkReassignData] = useState<BulkReassignData>({
    toTeamId: '',
    toTelecallerId: '',
    reason: ''
  });

  const [unassignReason, setUnassignReason] = useState('');

  useEffect(() => {
    loadData();
  }, [user?.tenantId]);

  useEffect(() => {
    applyFilters();
  }, [cases, filters, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, filters]);

  const loadData = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);

      const teamData = await TeamService.getTeams(user.tenantId);
      const userTeams = teamData.filter(
        team => team.team_incharge_id === user.id && team.status === 'active'
      );
      setTeams(userTeams);

      let allCases: CustomerCase[] = [];
      for (const team of userTeams) {
        const teamCases = await customerCaseService.getTeamCases(user.tenantId, team.id);
        allCases = [...allCases, ...teamCases];
      }

      const allTelecallers: any[] = [];
      for (const team of userTeams) {
        if (team.telecallers && Array.isArray(team.telecallers)) {
          allTelecallers.push(...team.telecallers.map((t: any) => ({
            ...t,
            team_id: team.id,
            team_name: team.name
          })));
        }
      }
      setTelecallers(allTelecallers);

      const casesWithDetails = allCases.map(c => {
        const team = userTeams.find(t => t.id === c.team_id);
        const telecaller = allTelecallers.find(t => t.id === c.telecaller_id);

        return {
          ...c,
          team_name: team?.name || 'N/A',
          telecaller_name: telecaller?.name || '—'
        };
      });

      setCases(casesWithDetails);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.loan_id?.toLowerCase().includes(searchLower) ||
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.mobile_no?.includes(searchLower)
      );
    }

    if (filters.teamId) {
      filtered = filtered.filter(c => c.team_id === filters.teamId);
    }

    if (filters.telecallerId) {
      filtered = filtered.filter(c => c.telecaller_id === filters.telecallerId);
    }

    if (filters.caseStatus) {
      filtered = filtered.filter(c => c.case_status === filters.caseStatus);
    }

    if (filters.assignmentStatus === 'assigned') {
      filtered = filtered.filter(c => c.telecaller_id);
    } else if (filters.assignmentStatus === 'unassigned') {
      filtered = filtered.filter(c => !c.telecaller_id);
    }

    if (filters.dpdMin) {
      const min = parseInt(filters.dpdMin);
      filtered = filtered.filter(c => (c.dpd || 0) >= min);
    }

    if (filters.dpdMax) {
      const max = parseInt(filters.dpdMax);
      filtered = filtered.filter(c => (c.dpd || 0) <= max);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(c => c.created_at && c.created_at >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(c => c.created_at && c.created_at <= filters.dateTo + 'T23:59:59');
    }

    if (filters.priority) {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    if (viewMode === 'team' && filters.teamId) {
      filtered = filtered.filter(c => c.team_id === filters.teamId);
    }

    if (viewMode === 'telecaller' && filters.telecallerId) {
      filtered = filtered.filter(c => c.telecaller_id === filters.telecallerId);
    }

    setFilteredCases(filtered);
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCases(prev =>
      prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId]
    );
  };

  const handleSelectAll = () => {
    const currentPageCases = getCurrentPageCases();
    const currentPageIds = currentPageCases.map(c => c.id).filter((id): id is string => !!id);

    if (selectedCases.length === currentPageIds.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(currentPageIds);
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredCases.map(c => c.id).filter((id): id is string => !!id);
    setSelectedCases(allFilteredIds);
  };

  const getCurrentPageCases = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCases.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredCases.length / pageSize);

  const resetFilters = () => {
    setFilters({
      search: '',
      teamId: '',
      telecallerId: '',
      caseStatus: '',
      assignmentStatus: '',
      dpdMin: '',
      dpdMax: '',
      dateFrom: '',
      dateTo: '',
      priority: ''
    });
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignData.teamId || !bulkAssignData.telecallerId) {
      showNotification('Please select team and telecaller', 'error');
      return;
    }

    try {
      for (const caseId of selectedCases) {
        await customerCaseService.assignCase(caseId, {
          telecallerId: bulkAssignData.telecallerId
        });
      }

      showNotification(`Successfully assigned ${selectedCases.length} cases`, 'success');
      setShowAssignModal(false);
      setSelectedCases([]);
      setBulkAssignData({ teamId: '', telecallerId: '', priority: 'medium' });
      loadData();
    } catch (error) {
      console.error('Error assigning cases:', error);
      showNotification('Failed to assign cases', 'error');
    }
  };

  const handleBulkUnassign = async () => {
    if (!unassignReason.trim()) {
      showNotification('Please provide a reason', 'error');
      return;
    }

    try {
      for (const caseId of selectedCases) {
        await customerCaseService.assignCase(caseId, {
          telecallerId: undefined
        });
      }

      showNotification(`Successfully unassigned ${selectedCases.length} cases`, 'success');
      setShowUnassignModal(false);
      setSelectedCases([]);
      setUnassignReason('');
      loadData();
    } catch (error) {
      console.error('Error unassigning cases:', error);
      showNotification('Failed to unassign cases', 'error');
    }
  };

  const handleBulkReassign = async () => {
    if (!bulkReassignData.toTeamId || !bulkReassignData.toTelecallerId) {
      showNotification('Please select destination team and telecaller', 'error');
      return;
    }

    if (!bulkReassignData.reason.trim()) {
      showNotification('Please provide a reason', 'error');
      return;
    }

    try {
      for (const caseId of selectedCases) {
        await customerCaseService.assignCase(caseId, {
          telecallerId: bulkReassignData.toTelecallerId
        });
      }

      showNotification(`Successfully reassigned ${selectedCases.length} cases`, 'success');
      setShowReassignModal(false);
      setSelectedCases([]);
      setBulkReassignData({ toTeamId: '', toTelecallerId: '', reason: '' });
      loadData();
    } catch (error) {
      console.error('Error reassigning cases:', error);
      showNotification('Failed to reassign cases', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Assign Cases</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Cases
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'team'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Team View
            </button>
            <button
              onClick={() => setViewMode('telecaller')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'telecaller'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Telecaller View
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Loan ID, Customer, Mobile"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select
                value={filters.teamId}
                onChange={(e) => setFilters({ ...filters, teamId: e.target.value, telecallerId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
              <select
                value={filters.telecallerId}
                onChange={(e) => setFilters({ ...filters, telecallerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!filters.teamId && viewMode !== 'all'}
              >
                <option value="">All Telecallers</option>
                {telecallers
                  .filter(t => !filters.teamId || t.team_id === filters.teamId)
                  .map(telecaller => (
                    <option key={telecaller.id} value={telecaller.id}>
                      {telecaller.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Status</label>
              <select
                value={filters.assignmentStatus}
                onChange={(e) => setFilters({ ...filters, assignmentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Status</label>
              <select
                value={filters.caseStatus}
                onChange={(e) => setFilters({ ...filters, caseStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="pending">New</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DPD Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.dpdMin}
                  onChange={(e) => setFilters({ ...filters, dpdMin: e.target.value })}
                  placeholder="Min"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={filters.dpdMax}
                  onChange={(e) => setFilters({ ...filters, dpdMax: e.target.value })}
                  placeholder="Max"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              <X className="w-4 h-4 inline mr-2" />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filteredCases.length} cases | {selectedCases.length} selected
            </span>
            {selectedCases.length > 0 && (
              <button
                onClick={handleSelectAllFiltered}
                className="text-sm text-blue-600 hover:underline"
              >
                Select all {filteredCases.length} filtered cases
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

        {selectedCases.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedCases.length} cases selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Assign
                </button>
                <button
                  onClick={() => setShowUnassignModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  Unassign
                </button>
                <button
                  onClick={() => setShowReassignModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCases.length === getCurrentPageCases().length && getCurrentPageCases().length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telecaller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DPD</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getCurrentPageCases().map((caseItem) => (
                <tr key={caseItem.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCases.includes(caseItem.id!)}
                      onChange={() => handleSelectCase(caseItem.id!)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{caseItem.loan_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{caseItem.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{caseItem.mobile_no}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{caseItem.team_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{caseItem.telecaller_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      caseItem.case_status === 'closed' ? 'bg-green-100 text-green-800' :
                      caseItem.case_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {caseItem.case_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{caseItem.dpd || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">₹{caseItem.outstanding_amount || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Cases</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={bulkAssignData.teamId}
                  onChange={(e) => setBulkAssignData({ ...bulkAssignData, teamId: e.target.value, telecallerId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
                <select
                  value={bulkAssignData.telecallerId}
                  onChange={(e) => setBulkAssignData({ ...bulkAssignData, telecallerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!bulkAssignData.teamId}
                >
                  <option value="">Select Telecaller</option>
                  {telecallers
                    .filter(t => t.team_id === bulkAssignData.teamId)
                    .map(telecaller => (
                      <option key={telecaller.id} value={telecaller.id}>{telecaller.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={bulkAssignData.priority}
                  onChange={(e) => setBulkAssignData({ ...bulkAssignData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleBulkAssign}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm Assign
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Unassign Cases</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
              <textarea
                value={unassignReason}
                onChange={(e) => setUnassignReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason for unassigning"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkUnassign}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Confirm Unassign
              </button>
              <button
                onClick={() => setShowUnassignModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reassign Cases</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Team</label>
                <select
                  value={bulkReassignData.toTeamId}
                  onChange={(e) => setBulkReassignData({ ...bulkReassignData, toTeamId: e.target.value, toTelecallerId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Telecaller</label>
                <select
                  value={bulkReassignData.toTelecallerId}
                  onChange={(e) => setBulkReassignData({ ...bulkReassignData, toTelecallerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!bulkReassignData.toTeamId}
                >
                  <option value="">Select Telecaller</option>
                  {telecallers
                    .filter(t => t.team_id === bulkReassignData.toTeamId)
                    .map(telecaller => (
                      <option key={telecaller.id} value={telecaller.id}>{telecaller.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                <textarea
                  value={bulkReassignData.reason}
                  onChange={(e) => setBulkReassignData({ ...bulkReassignData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter reason for reassigning"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleBulkReassign}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm Reassign
              </button>
              <button
                onClick={() => setShowReassignModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
