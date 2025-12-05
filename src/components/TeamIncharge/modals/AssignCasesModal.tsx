import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, X, Search, Users, CheckCircle, Eye, Trash2, RotateCcw, AlertTriangle, Maximize, Minimize, UserX, Filter, Package } from 'lucide-react';
import { customerCaseService } from '../../../services/customerCaseService';
import { TeamService } from '../../../services/teamService';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import { useAuth } from '../../../contexts/AuthContext';
import type { TeamInchargeCase } from '../../../types/caseManagement';

interface AssignCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExpandedCase {
  [key: string]: boolean;
}

interface ReassignModalState {
  isOpen: boolean;
  caseId: string;
  currentTelecaller: string;
  caseDetails: Record<string, unknown>;
}

export const AssignCasesModal: React.FC<AssignCasesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [allCases, setAllCases] = useState<TeamInchargeCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<TeamInchargeCase[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; team_incharge_id: string; status: string; telecallers?: Array<{ id: string; name: string; emp_id: string }> }>>([]);
  const [telecallers, setTelecallers] = useState<Array<{ id: string; name: string; emp_id: string }>>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [assignmentProgress, setAssignmentProgress] = useState(0);
  const [assignmentResult, setAssignmentResult] = useState<{ total: number; success: number; errors: number; errorDetails: Array<{ caseId: string; error: string }>; action: string } | null>(null);
  const [expandedCases, setExpandedCases] = useState<ExpandedCase>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ caseId: string, caseDetails: Record<string, unknown> } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [reassignModal, setReassignModal] = useState<ReassignModalState>({ isOpen: false, caseId: '', currentTelecaller: '', caseDetails: {} });
  const [actionType, setActionType] = useState<'assign' | 'unassign' | 'change_team'>('assign');

  // Load cases for a team
  const loadTeamCases = useCallback(async (teamId: string) => {
    if (!user?.tenantId) {
      console.error('No tenantId available');
      return;
    }

    console.log('Loading cases for team:', teamId, 'tenant:', user.tenantId);

    try {
      setIsLoading(true);
      const cases = await customerCaseService.getTeamCases(user.tenantId, teamId);
      console.log('Loaded cases:', cases.length, cases);
      setAllCases(cases);
    } catch (error: unknown) {
      console.error('Error loading team cases:', error);
      showNotification(notificationHelpers.error(
        'Error',
        error instanceof Error ? error.message : 'Failed to load team cases'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId, showNotification]);

  const loadInitialData = useCallback(async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    console.log('Loading initial data for user:', user);

    try {
      setIsLoading(true);

      // Load teams for this tenant
      console.log('Loading teams for tenantId:', user.tenantId);
      const teamData = await TeamService.getTeams(user.tenantId!);
      console.log('Loaded team data:', teamData);

      const userTeams = teamData.filter((team) =>
        team.team_incharge_id === user!.id && team.status === 'active'
      );
      console.log('Filtered user teams:', userTeams);

      setTeams(userTeams);

      if (userTeams.length > 0) {
        const firstTeam = userTeams[0];
        setSelectedTeam(firstTeam.id);
        setTelecallers(firstTeam.telecallers || []);
        await loadTeamCases(firstTeam.id);
      }
    } catch (error: unknown) {
      console.error('Error loading initial data:', error);
      showNotification(notificationHelpers.error(
        'Error',
        error instanceof Error ? error.message : 'Failed to load initial data'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification, loadTeamCases]);

  const applyFilters = useCallback(() => {
    let filtered = [...allCases];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(case_ =>
        case_.case_data?.customerName?.toString().toLowerCase().includes(searchLower) ||
        case_.case_data?.loanId?.toString().toLowerCase().includes(searchLower) ||
        case_.case_data?.mobileNo?.toString().includes(searchTerm)
      );
    }

    setFilteredCases(filtered);
    setSelectedCases(new Set()); // Clear selections when filters change
  }, [allCases, searchTerm]);

  useEffect(() => {
    if (isOpen && user?.tenantId && user?.id) {
      loadInitialData();
    }
  }, [isOpen, user?.tenantId, user?.id, loadInitialData, loadTeamCases]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleTeamChange = async (teamId: string) => {
    setSelectedTeam(teamId);
    setSelectedTelecaller('');
    setSearchTerm('');
    setActionType('assign');

    // Update telecallers for selected team
    const selectedTeamData = teams.find(t => t.id === teamId);
    setTelecallers(selectedTeamData?.telecallers || []);

    // Load team cases (both assigned and unassigned)
    await loadTeamCases(teamId);
  };

  const handleCaseSelect = (caseId: string) => {
    const newSelected = new Set(selectedCases);
    if (newSelected.has(caseId)) {
      newSelected.delete(caseId);
    } else {
      newSelected.add(caseId);
    }
    setSelectedCases(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCases.size === filteredCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(filteredCases.map(c => c.id!)));
    }
  };

  const handleBulkAssignment = async () => {
    if (actionType === 'assign' && (!selectedTelecaller || selectedCases.size === 0)) {
      showNotification(notificationHelpers.error(
        'Missing Data',
        'Please select a telecaller and at least one case'
      ));
      return;
    }

    if (actionType === 'unassign' && selectedCases.size === 0) {
      showNotification(notificationHelpers.error(
        'Missing Data',
        'Please select at least one case to unassign'
      ));
      return;
    }

    if (actionType === 'change_team' && (!selectedTelecaller || selectedCases.size === 0)) {
      showNotification(notificationHelpers.error(
        'Missing Data',
        'Please select a new team and at least one case'
      ));
      return;
    }

    try {
      setIsLoading(true);
      setAssignmentProgress(0);
      setAssignmentResult(null);

      const selectedCaseIds = Array.from(selectedCases);
      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ caseId: string; error: string }> = [];

      for (let i = 0; i < selectedCaseIds.length; i++) {
        const caseId = selectedCaseIds[i];
        try {
          if (actionType === 'assign') {
            await customerCaseService.assignCase(caseId, {
              caseId,
              telecallerId: selectedTelecaller,
              assignedBy: user!.id
            });
          } else if (actionType === 'unassign') {
            await customerCaseService.assignCase(caseId, {
              caseId,
              telecallerId: null,
              assignedBy: user!.id
            });
          } else if (actionType === 'change_team') {
            await customerCaseService.updateCase(caseId, {
              team_id: selectedTelecaller
            });
          }
          successCount++;
        } catch (error: unknown) {
          errorCount++;
          errors.push({
            caseId: caseId.substring(0, 8),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        setAssignmentProgress(((i + 1) / selectedCaseIds.length) * 100);
      }

      setAssignmentResult({
        total: selectedCaseIds.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors,
        action: actionType
      });

      if (successCount > 0) {
        const actionText = actionType === 'assign' ? 'assigned' :
          actionType === 'unassign' ? 'unassigned' : 'moved';
        showNotification(notificationHelpers.success(
          'Operation Complete',
          `Successfully ${actionText} ${successCount} cases`
        ));
        await loadTeamCases(selectedTeam);
        onSuccess();
      }

      if (errorCount > 0) {
        showNotification(notificationHelpers.warning(
          'Operation Completed with Errors',
          `${errorCount} cases failed to ${actionType}`
        ));
      }
    } catch (error: unknown) {
      console.error('Bulk operation error:', error);
      showNotification(notificationHelpers.error(
        'Operation Failed',
        error instanceof Error ? error.message : `Failed to ${actionType} cases`
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCase = (caseId: string) => {
    setExpandedCases(prev => ({
      ...prev,
      [caseId]: !prev[caseId]
    }));
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      setIsLoading(true);
      await customerCaseService.deleteCase(caseId);
      showNotification(notificationHelpers.success(
        'Case Deleted',
        'Case has been successfully deleted'
      ));
      await loadTeamCases(selectedTeam);
      onSuccess();
    } catch (error: unknown) {
      console.error('Delete case error:', error);
      showNotification(notificationHelpers.error(
        'Delete Failed',
        error instanceof Error ? error.message : 'Failed to delete case'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCases.size === 0) {
      showNotification(notificationHelpers.error(
        'No Cases Selected',
        'Please select at least one case to delete'
      ));
      return;
    }

    try {
      setIsLoading(true);
      setAssignmentProgress(0);
      setAssignmentResult(null);

      const selectedCaseIds = Array.from(selectedCases);
      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ caseId: string; error: string }> = [];

      for (let i = 0; i < selectedCaseIds.length; i++) {
        const caseId = selectedCaseIds[i];
        try {
          await customerCaseService.deleteCase(caseId);
          successCount++;
        } catch (error: unknown) {
          errorCount++;
          errors.push({
            caseId: caseId.substring(0, 8),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        setAssignmentProgress(((i + 1) / selectedCaseIds.length) * 100);
      }

      setAssignmentResult({
        total: selectedCaseIds.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors,
        action: 'delete'
      });

      if (successCount > 0) {
        showNotification(notificationHelpers.success(
          'Bulk Delete Complete',
          `Successfully deleted ${successCount} cases`
        ));
        await loadTeamCases(selectedTeam);
        setSelectedCases(new Set());
        onSuccess();
      }

      if (errorCount > 0) {
        showNotification(notificationHelpers.warning(
          'Delete Completed with Errors',
          `${errorCount} cases failed to delete`
        ));
      }
    } catch (error: unknown) {
      console.error('Bulk delete error:', error);
      showNotification(notificationHelpers.error(
        'Bulk Delete Failed',
        error instanceof Error ? error.message : 'Failed to delete cases'
      ));
    } finally {
      setIsLoading(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleReassignCase = async (caseId: string, newTelecallerId: string) => {
    try {
      setIsLoading(true);
      await customerCaseService.assignCase(caseId, {
        caseId,
        telecallerId: newTelecallerId,
        assignedBy: user!.id
      });
      showNotification(notificationHelpers.success(
        'Case Reassigned',
        'Case has been reassigned successfully'
      ));
      await loadTeamCases(selectedTeam);
      setReassignModal({ isOpen: false, caseId: '', currentTelecaller: '', caseDetails: {} });
      onSuccess();
    } catch (error: unknown) {
      console.error('Reassignment error:', error);
      showNotification(notificationHelpers.error(
        'Reassignment Failed',
        error instanceof Error ? error.message : 'Failed to reassign case'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const resetModal = () => {
    setAllCases([]);
    setFilteredCases([]);
    setTeams([]);
    setTelecallers([]);
    setSelectedTeam('');
    setSelectedTelecaller('');
    setSearchTerm('');
    setSelectedCases(new Set());
    setAssignmentProgress(0);
    setAssignmentResult(null);
    setExpandedCases({});
    setShowDeleteConfirm(null);
    setShowBulkDeleteConfirm(false);
    setReassignModal({ isOpen: false, caseId: '', currentTelecaller: '', caseDetails: {} });
    setActionType('assign');
    setIsMaximized(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getCaseStatusBadge = (case_: TeamInchargeCase) => {
    if (case_.telecaller_id) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
          <UserCheck className="w-3 h-3 mr-1.5" />
          Assigned
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300 shadow-sm">
          <AlertTriangle className="w-3 h-3 mr-1.5" />
          Unassigned
        </span>
      );
    }
  };

  // Filter cases based on action type
  const getApplicableCases = () => {
    if (actionType === 'assign') {
      return filteredCases.filter(case_ => !case_.telecaller_id);
    } else if (actionType === 'unassign') {
      return filteredCases.filter(case_ => case_.telecaller_id);
    } else {
      return filteredCases;
    }
  };

  const applicableCases = getApplicableCases();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-2xl w-full transition-all duration-300 transform ${isMaximized
        ? 'h-screen rounded-none'
        : 'max-w-7xl mx-4 max-h-[95vh]'
        } overflow-hidden border-2 border-gray-100`}>

        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 border-b-4 border-emerald-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center">
                  Case Management Hub
                </h3>
                <p className="text-emerald-100 text-sm mt-1">
                  {selectedTeam && teams.find(t => t.id === selectedTeam)?.name || 'Select a team to begin'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMaximize}
                className="p-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={handleClose}
                className="p-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Controls */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-200">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cases</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allCases.length}</p>
                </div>
                <div className="bg-purple-100 rounded-lg p-3">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unassigned</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{allCases.filter(c => !c.telecaller_id).length}</p>
                </div>
                <div className="bg-orange-100 rounded-lg p-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{allCases.filter(c => c.telecaller_id).length}</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{selectedCases.size}</p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
            <div className="flex items-center mb-4">
              <Filter className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters & Actions</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Team Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-gray-400"
                  disabled={isLoading}
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Action Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => {
                    setActionType(e.target.value as 'assign' | 'unassign' | 'change_team');
                    setSelectedTelecaller('');
                    setSelectedCases(new Set());
                  }}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-gray-400"
                  disabled={isLoading}
                >
                  <option value="assign">Assign Cases</option>
                  <option value="unassign">Unassign Cases</option>
                  <option value="change_team">Change Team</option>
                </select>
              </div>

              {/* Telecaller Selection (for assign only) */}
              {actionType === 'assign' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Assign to Telecaller</label>
                  <select
                    value={selectedTelecaller}
                    onChange={(e) => setSelectedTelecaller(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-gray-400"
                    disabled={isLoading || !selectedTeam}
                  >
                    <option value="">Select Telecaller</option>
                    {telecallers.map((telecaller) => (
                      <option key={telecaller.id} value={telecaller.id}>
                        {telecaller.name} ({telecaller.emp_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* New Team Selection (for change_team only) */}
              {actionType === 'change_team' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Move to Team</label>
                  <select
                    value={selectedTelecaller}
                    onChange={(e) => setSelectedTelecaller(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-gray-400"
                    disabled={isLoading}
                  >
                    <option value="">Select New Team</option>
                    {teams.filter(team => team.id !== selectedTeam).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search */}
              <div className={actionType === 'unassign' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Search Cases</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Customer name, loan ID, or mobile..."
                    className="pl-10 pr-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all w-full bg-white hover:border-gray-400"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Progress */}
          {isLoading && assignmentProgress > 0 && (
            <div className="mt-4 bg-white rounded-xl p-5 shadow-md border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-3"></div>
                <span className="text-gray-900 font-semibold">
                  {actionType === 'assign' ? 'Assigning cases...' :
                    actionType === 'unassign' ? 'Unassigning cases...' : 'Moving cases...'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                  style={{ width: `${assignmentProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2 font-medium">{Math.round(assignmentProgress)}% complete</p>
            </div>
          )}

          {/* Assignment Results */}
          {assignmentResult && (
            <div className="mt-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-5 shadow-md">
              <h5 className="font-bold text-emerald-900 mb-3 flex items-center text-lg">
                <CheckCircle className="w-6 h-6 mr-2" />
                Operation Complete
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600">{assignmentResult.success}</div>
                  <div className="text-sm text-emerald-700 font-medium mt-1">
                    Successfully {assignmentResult.action === 'assign' ? 'Assigned' : 'Unassigned'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-red-200">
                  <div className="text-3xl font-bold text-red-600">{assignmentResult.errors}</div>
                  <div className="text-sm text-red-700 font-medium mt-1">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mt-5 pt-5 border-t-2 border-gray-200">
            <div className="text-sm font-medium text-gray-700">
              <span className="text-gray-900 font-semibold">{applicableCases.length}</span> {actionType === 'assign' ? 'unassigned' :
                actionType === 'unassign' ? 'assigned' : ''} cases available
              {selectedCases.size > 0 && (
                <span className="ml-2 text-emerald-600">• <span className="font-bold">{selectedCases.size}</span> selected</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Bulk Delete Button */}
              {selectedCases.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete {selectedCases.size} Cases
                </button>
              )}

              {/* Main Action Button */}
              <button
                onClick={handleBulkAssignment}
                disabled={
                  (actionType === 'assign' && (!selectedTelecaller || selectedCases.size === 0)) ||
                  (actionType === 'unassign' && selectedCases.size === 0) ||
                  (actionType === 'change_team' && (!selectedTelecaller || selectedCases.size === 0)) ||
                  isLoading
                }
                className={`px-8 py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center ${actionType === 'assign' ? 'bg-gradient-to-r from-emerald-600 to-green-600' :
                  actionType === 'unassign' ? 'bg-gradient-to-r from-orange-600 to-amber-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                  }`}
              >
                {actionType === 'assign' ? (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Assign {selectedCases.size} Cases
                  </>
                ) : actionType === 'unassign' ? (
                  <>
                    <UserX className="w-5 h-5 mr-2" />
                    Unassign {selectedCases.size} Cases
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Move {selectedCases.size} Cases
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Cases Table */}
        <div className={`flex-1 overflow-hidden ${isMaximized ? 'h-[calc(100vh-520px)]' : ''}`}>
          {isLoading && allCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading cases...</p>
            </div>
          ) : applicableCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50">
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
                {actionType === 'assign' ? (
                  <UserCheck className="w-16 h-16 text-gray-300 mb-4 mx-auto" />
                ) : actionType === 'unassign' ? (
                  <UserX className="w-16 h-16 text-gray-300 mb-4 mx-auto" />
                ) : (
                  <Users className="w-16 h-16 text-gray-300 mb-4 mx-auto" />
                )}
                <p className="text-xl font-bold text-gray-700 mb-2">
                  No {actionType === 'assign' ? 'unassigned' :
                    actionType === 'unassign' ? 'assigned' : ''} cases found
                </p>
                <p className="text-sm text-gray-500">
                  {allCases.length === 0
                    ? 'No cases available for this team'
                    : actionType === 'assign'
                      ? 'All cases are already assigned'
                      : actionType === 'unassign'
                        ? 'No cases are currently assigned'
                        : 'No cases available to move'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className={`overflow-auto ${isMaximized ? 'h-full' : 'max-h-96'}`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCases.size === applicableCases.length && applicableCases.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-emerald-500 cursor-pointer"
                        disabled={isLoading}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Case Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicableCases.map((case_, index) => {
                    const details = case_.case_data || {};
                    const isSelected = selectedCases.has(case_.id!);
                    const isExpanded = expandedCases[case_.id!];

                    return (
                      <React.Fragment key={case_.id}>
                        <tr className={`transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50 hover:shadow-md`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCaseSelect(case_.id!)}
                              className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-emerald-500 cursor-pointer"
                              disabled={isLoading}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {String(details.customerName || 'N/A')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{String(details.loanId)}</span>
                              <span className="mx-2">•</span>
                              <span>{String(details.mobileNo)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCaseStatusBadge(case_)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {case_.telecaller ? (
                              <div className="flex items-center">
                                <div className="bg-blue-100 rounded-full p-1.5 mr-2">
                                  <UserCheck className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">{case_.telecaller.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              <Package className="w-3 h-3 mr-1" />
                              {case_.product_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewCase(case_.id!)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all transform hover:scale-110"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {case_.telecaller && (
                                <button
                                  onClick={() => setReassignModal({
                                    isOpen: true,
                                    caseId: case_.id!,
                                    currentTelecaller: case_.telecaller?.name || '',
                                    caseDetails: details
                                  })}
                                  className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all transform hover:scale-110"
                                  title="Reassign Case"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setShowDeleteConfirm({ caseId: case_.id!, caseDetails: details })}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110"
                                title="Delete Case"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Enhanced Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-emerald-500">
                              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                                  <div className="bg-emerald-100 rounded-lg p-2 mr-3">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  Complete Case Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(details).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{key}</span>
                                      <span className="text-sm text-gray-900 font-medium">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reassignment Modal */}
        {reassignModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-200 transform transition-all">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 rounded-xl p-3 mr-4">
                  <RotateCcw className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Reassign Case</h3>
                  <p className="text-sm text-gray-500 mt-1">Transfer case to another telecaller</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Customer:</span> {String(reassignModal.caseDetails.customerName)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Current Telecaller:</span> {reassignModal.currentTelecaller}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select New Telecaller</label>
                <select
                  id="reassign-telecaller"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  defaultValue=""
                >
                  <option value="" disabled>Choose telecaller...</option>
                  {telecallers.map((telecaller) => (
                    <option key={telecaller.id} value={telecaller.id}>
                      {telecaller.name} ({telecaller.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setReassignModal({ isOpen: false, caseId: '', currentTelecaller: '', caseDetails: {} })}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const select = document.getElementById('reassign-telecaller') as HTMLSelectElement;
                    if (select.value) {
                      handleReassignCase(reassignModal.caseId, select.value);
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:opacity-90 font-medium transition-all shadow-lg"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-red-200 transform transition-all">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 rounded-xl p-3 mr-4">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Bulk Delete</h3>
                  <p className="text-sm text-gray-500 mt-1">This will delete multiple cases</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  You are about to delete {selectedCases.size} case{selectedCases.size > 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-red-700">
                  This action cannot be undone and will permanently remove all selected cases from the system.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:opacity-90 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Deleting...' : `Delete ${selectedCases.size} Cases`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-red-200 transform transition-all">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 rounded-xl p-3 mr-4">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete the case for <strong className="text-gray-900">{String(showDeleteConfirm.caseDetails.customerName)}</strong>?
                <br />
                <span className="text-red-600 font-semibold">This action cannot be undone.</span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteCase(showDeleteConfirm.caseId);
                    setShowDeleteConfirm(null);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:opacity-90 font-medium transition-all shadow-lg"
                >
                  Delete Case
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};