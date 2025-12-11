import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
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

export const AssignCasesModal: React.FC<AssignCasesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [allCases, setAllCases] = useState<TeamInchargeCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<TeamInchargeCase[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; team_incharge_id: string; status: string; telecallers?: Array<{ id: string; name: string; emp_id: string }> }>>([]);
  const [telecallers, setTelecallers] = useState<Array<{ id: string; name: string; emp_id: string }>>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());


  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [actionType, setActionType] = useState<'assign' | 'unassign' | 'change_team' | 'view_only'>('assign');

  // Load cases for a team
  const loadTeamCases = useCallback(async (teamId: string) => {
    if (!user?.tenantId) {
      console.error('No tenantId available');
      return;
    }

    try {
      setIsLoading(true);
      const cases = await customerCaseService.getTeamCases(user.tenantId, teamId);
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

    try {
      setIsLoading(true);
      const teamData = await TeamService.getTeams(user.tenantId!);
      const userTeams = teamData.filter((team) =>
        team.team_incharge_id === user!.id && team.status === 'active'
      );

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
  }, [isOpen, user?.tenantId, user?.id, loadInitialData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleTeamChange = async (teamId: string) => {
    setSelectedTeam(teamId);
    setSelectedTelecaller('');
    setSearchTerm('');
    setActionType('assign');

    const selectedTeamData = teams.find(t => t.id === teamId);
    setTelecallers(selectedTeamData?.telecallers || []);

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
    // Only select currently visible cases
    const visibleCaseIds = applicableCases.map(c => c.id!);
    const allSelected = visibleCaseIds.every(id => selectedCases.has(id));

    if (allSelected) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(visibleCaseIds));
    }
  };

  const handleBulkAssignment = async () => {
    if (actionType === 'assign' && (!selectedTelecaller || selectedCases.size === 0)) {
      showNotification(notificationHelpers.error('Missing Data', 'Please select a telecaller and at least one case'));
      return;
    }
    if (actionType === 'unassign' && selectedCases.size === 0) {
      showNotification(notificationHelpers.error('Missing Data', 'Please select at least one case to unassign'));
      return;
    }
    if (actionType === 'change_team' && (!selectedTelecaller || selectedCases.size === 0)) {
      showNotification(notificationHelpers.error('Missing Data', 'Please select a new team and at least one case'));
      return;
    }

    try {
      setIsLoading(true);



      const selectedCaseIds = Array.from(selectedCases);
      let successCount = 0;
      let errorCount = 0;


      for (let i = 0; i < selectedCaseIds.length; i++) {
        const caseId = selectedCaseIds[i];
        try {
          if (actionType === 'assign') {
            await customerCaseService.assignCase(caseId, { caseId, telecallerId: selectedTelecaller, assignedBy: user!.id });
          } else if (actionType === 'unassign') {
            await customerCaseService.assignCase(caseId, { caseId, telecallerId: null, assignedBy: user!.id });
          } else if (actionType === 'change_team') {
            await customerCaseService.updateCase(caseId, { team_id: selectedTelecaller });
          }
          successCount++;
        } catch {
          errorCount++;

        }

      }



      if (successCount > 0) {
        showNotification(notificationHelpers.success('Operation Complete', `Successfully processed ${successCount} cases`));
        await loadTeamCases(selectedTeam);
        onSuccess();
      }
      if (errorCount > 0) {
        showNotification(notificationHelpers.warning('Operation Completed with Errors', `${errorCount} cases failed`));
      }
    } catch (error: unknown) {
      console.error('Bulk operation error:', error);
      showNotification(notificationHelpers.error('Operation Failed', error instanceof Error ? error.message : 'Failed to process cases'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!window.confirm('Are you sure you want to delete this case? This cannot be undone.')) return;
    try {
      setIsLoading(true);
      await customerCaseService.deleteCase(caseId);
      showNotification(notificationHelpers.success('Case Deleted', 'Case has been successfully deleted'));
      await loadTeamCases(selectedTeam);
      onSuccess();
    } catch (error: unknown) {
      console.error('Delete case error:', error);
      showNotification(notificationHelpers.error('Delete Failed', error instanceof Error ? error.message : 'Failed to delete case'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCases.size === 0) return;
    try {
      setIsLoading(true);



      const selectedCaseIds = Array.from(selectedCases);
      let successCount = 0;
      let errorCount = 0;


      for (let i = 0; i < selectedCaseIds.length; i++) {
        const caseId = selectedCaseIds[i];
        try {
          await customerCaseService.deleteCase(caseId);
          successCount++;
        } catch {
          errorCount++;

        }

      }



      if (successCount > 0) {
        showNotification(notificationHelpers.success('Bulk Delete Complete', `Successfully deleted ${successCount} cases`));
        await loadTeamCases(selectedTeam);
        setSelectedCases(new Set());
        onSuccess();
      }
      if (errorCount > 0) {
        showNotification(notificationHelpers.warning('Delete Completed with Errors', `${errorCount} cases failed to delete`));
      }
    } catch (error: unknown) {
      console.error('Bulk delete error:', error);
      showNotification(notificationHelpers.error('Bulk Delete Failed', error instanceof Error ? error.message : 'Failed to delete cases'));
    } finally {
      setIsLoading(false);
      setShowBulkDeleteConfirm(false);
    }
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


    setShowBulkDeleteConfirm(false);
    setActionType('assign');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Filter cases based on action type
  const getApplicableCases = () => {
    let result = filteredCases;
    if (actionType === 'assign') {
      result = filteredCases.filter(case_ => !case_.telecaller_id);
    } else if (actionType === 'unassign') {
      result = filteredCases.filter(case_ => case_.telecaller_id);
    } else if (actionType === 'view_only') {
      if (selectedTelecaller) {
        result = filteredCases.filter(case_ => case_.telecaller_id === selectedTelecaller);
      }
    }
    return result;
  };

  const applicableCases = getApplicableCases();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden border-2 border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Case Management Hub</h3>
            <p className="text-sm text-gray-500">
              {selectedTeam && teams.find(t => t.id === selectedTeam)?.name}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value as 'assign' | 'unassign' | 'change_team' | 'view_only');
                setSelectedTelecaller('');
                setSelectedCases(new Set());
              }}
              className="border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="assign">Assign Cases</option>
              <option value="unassign">Unassign Cases</option>
              <option value="change_team">Change Team</option>
              <option value="view_only">View / Delete (Incharge)</option>
            </select>

            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {actionType === 'assign' || actionType === 'change_team' ? 'Select Target Telecaller/Team' : 'Filter by Telecaller'}
              </option>
              {actionType === 'change_team'
                ? teams.filter(t => t.id !== selectedTeam).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))
                : telecallers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))
              }
            </select>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-gray-700">
              Showing <b>{applicableCases.length}</b> cases
              {selectedCases.size > 0 && <span> | <b>{selectedCases.size}</b> selected</span>}
            </div>

            <div className="space-x-2">
              {actionType === 'view_only' && selectedTelecaller && applicableCases.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium shadow-sm transition-colors"
                >
                  Delete All {applicableCases.length} Cases
                </button>
              )}

              {actionType !== 'view_only' && (
                <button
                  onClick={handleBulkAssignment}
                  disabled={selectedCases.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 shadow-sm transition-colors"
                >
                  Execute {actionType === 'assign' ? 'Assign' : actionType === 'unassign' ? 'Unassign' : 'Move'} ({selectedCases.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Delete Confirm Modal Overlay */}
        {showBulkDeleteConfirm && (
          <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl border border-red-200 max-w-sm text-center">
              <h4 className="text-xl font-bold text-red-600 mb-2">Confirm Bulk Delete</h4>
              <p className="mb-4 text-gray-700">Are you sure you want to delete {applicableCases.length} cases? This action CANNOT be undone.</p>
              <div className="flex justify-center space-x-3">
                <button onClick={() => setShowBulkDeleteConfirm(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button onClick={handleBulkDelete} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  {isLoading ? 'Deleting...' : 'Yes, Delete All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div className="bg-white rounded border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={applicableCases.length > 0 && selectedCases.size === applicableCases.length}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {applicableCases.slice(0, 500).map((case_) => {
                  const details = case_.case_data || {};
                  return (
                    <tr key={case_.id} className={`hover:bg-blue-50 transition-colors ${selectedCases.has(case_.id!) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCases.has(case_.id!)}
                          onChange={() => handleCaseSelect(case_.id!)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-sm text-gray-900">{String(details.customerName || '-')}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{String(details.loanId)} | {String(details.mobileNo)}</div>
                        <div className="text-xs text-purple-600 mt-1">{case_.product_name}</div>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {case_.telecaller ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {case_.telecaller.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${case_.status === 'closed' ? 'bg-green-100 text-green-800' :
                          case_.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            case_.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {case_.status?.replace('_', ' ') || 'new'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        <button
                          onClick={() => handleDeleteCase(case_.id!)}
                          className="text-red-600 hover:text-red-900 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {applicableCases.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No cases found matching your criteria.</td></tr>
                )}
                {applicableCases.length > 500 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500 text-sm bg-gray-50">
                      Showing first 500 of {applicableCases.length} cases. Use filters to narrow down results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};