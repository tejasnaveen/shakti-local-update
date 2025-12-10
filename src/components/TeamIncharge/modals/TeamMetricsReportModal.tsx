import React, { useState, useEffect } from 'react';
import { X, Search, Filter, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../utils/dateUtils';
import * as XLSX from 'xlsx';

interface TeamMetricsReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
}

interface Team {
    id: string;
    name: string;
}

interface Telecaller {
    id: string;
    name: string;
}

interface CaseDetail {
    id: string;
    [key: string]: any; // Allow indexing
}

export const TeamMetricsReportModal: React.FC<TeamMetricsReportModalProps> = ({
    isOpen,
    onClose,
    tenantId
}) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [telecallers, setTelecallers] = useState<Telecaller[]>([]);

    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [selectedTelecallerId, setSelectedTelecallerId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [reportData, setReportData] = useState<CaseDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Load Teams
    useEffect(() => {
        if (isOpen && tenantId) {
            const loadTeams = async () => {
                const { data } = await supabase
                    .from('teams')
                    .select('id, name')
                    .eq('tenant_id', tenantId)
                    .eq('status', 'active');
                setTeams(data || []);
            };
            loadTeams();
        }
    }, [isOpen, tenantId]);

    // Load Telecallers when Team changes
    useEffect(() => {
        if (selectedTeamId) {
            const loadTelecallers = async () => {
                const { data } = await supabase
                    .from('employees')
                    .select('id, name')
                    .eq('team_id', selectedTeamId)
                    .eq('role', 'Telecaller')
                    .eq('status', 'active');
                setTelecallers(data || []);
                setSelectedTelecallerId(''); // Reset telecaller selection
            };
            loadTelecallers();
        } else {
            setTelecallers([]);
            setSelectedTelecallerId('');
        }
    }, [selectedTeamId]);

    const handleShowReport = async () => {
        if (!selectedTeamId || !selectedTelecallerId) {
            alert('Please select both Team and Telecaller');
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            // 1. Fetch Cases
            let casesQuery = supabase
                .from('customer_cases')
                .select('*')
                .eq('telecaller_id', selectedTelecallerId);

            if (startDate) {
                casesQuery = casesQuery.gte('updated_at', `${startDate}T00:00:00`);
            }
            if (endDate) {
                casesQuery = casesQuery.lte('updated_at', `${endDate}T23:59:59`);
            }

            const { data: cases, error: casesError } = await casesQuery;
            if (casesError) throw casesError;

            if (!cases || cases.length === 0) {
                setReportData([]);
                return;
            }

            // 2. Fetch Latest Call Logs for these cases
            const caseIds = cases.map(c => c.id);
            const { data: logs, error: logsError } = await supabase
                .from('case_call_logs')
                .select('case_id, call_status, ptp_date, created_at, call_notes')
                .in('case_id', caseIds)
                .order('created_at', { ascending: false });

            if (logsError) console.error('Error fetching logs:', logsError);

            // 3. Map logs to cases (get latest log per case)
            const latestLogMap = new Map();
            logs?.forEach(log => {
                if (!latestLogMap.has(log.case_id)) {
                    latestLogMap.set(log.case_id, log);
                }
            });

            // 4. Map data to CaseDetail interface - INCLUDE ALL DATA
            const mappedData: CaseDetail[] = cases.map(item => {
                const latestLog = latestLogMap.get(item.id);
                const telecallerName = telecallers.find(t => t.id === item.telecaller_id)?.name || 'Unknown';

                // Merge everything into one object
                return {
                    ...item, // Spread all original columns
                    latest_call_status: latestLog?.call_status || item.latest_call_status || 'New',
                    latest_ptp_date: latestLog?.ptp_date || item.latest_ptp_date || '',
                    latest_call_date: latestLog?.created_at || item.latest_call_date || '',
                    latest_call_notes: latestLog?.call_notes || item.latest_call_notes || '',
                    telecaller_name: telecallerName,
                    // Ensure numeric amounts for table display
                    amount_collected: item.total_collected_amount || 0,
                    outstanding_amount: parseFloat(item.outstanding_amount || '0'),
                    case_status: item.case_status || item.status || 'New'
                };
            });

            setReportData(mappedData);

        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (reportData.length === 0) return;

        const telecallerName = telecallers.find(t => t.id === selectedTelecallerId)?.name || 'Telecaller';
        const fileName = `${telecallerName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Format data for export - keep everything but format dates
        const exportData = reportData.map(item => {
            const row: any = {};

            // Helper to safely get nested values (case insensitive checks)
            const getValue = (keys: string[]) => {
                for (const key of keys) {
                    // Check top level
                    if (item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];

                    // Check in case_data
                    if (item.case_data) {
                        if (item.case_data[key] !== undefined && item.case_data[key]) return item.case_data[key];
                        if (item.case_data[key.toLowerCase()] !== undefined && item.case_data[key.toLowerCase()]) return item.case_data[key.toLowerCase()];
                        if (item.case_data[key.toUpperCase()] !== undefined && item.case_data[key.toUpperCase()]) return item.case_data[key.toUpperCase()];
                    }
                }
                return 0; // Default to 0 for numbers
            };

            // Deep search for Employment Type
            let employmentType = '';
            if (item.loan_type) employmentType = item.loan_type;

            const empKeys = ['Employment Type', 'EMPLOYMENT TYPE', 'employment_type', 'employmentType'];
            for (const key of empKeys) {
                if (item.custom_fields && item.custom_fields[key]) {
                    employmentType = item.custom_fields[key];
                    break;
                }
                if (item.case_data && item.case_data[key]) {
                    employmentType = item.case_data[key];
                    break;
                }
            }

            // Deep search for Outstanding Amount
            const getOutstanding = () => {
                const keys = ['outstanding_amount', 'total_outstanding', 'TOTAL OUTSTANDING', 'total_due', 'pending_dues', 'totalOutstanding'];
                for (const key of keys) {
                    if (item[key]) return item[key];
                    if (item.case_data) {
                        if (item.case_data[key]) return item.case_data[key];
                    }
                }
                return 0;
            };

            // Explicitly order important columns first if desired, or just dump everything
            // Let's add standard headers first
            row['Loan ID'] = item.loan_id;
            row['Customer Name'] = item.customer_name;
            row['Mobile'] = item.mobile_no;
            row['Telecaller'] = `${item.telecaller_name} (${item.telecaller_id})`; // Name (ID)
            row['Case Status'] = item.case_status;
            row['Last Call Status'] = item.latest_call_status;
            row['PTP Date'] = item.latest_ptp_date ? new Date(item.latest_ptp_date).toLocaleDateString('en-IN') : '';
            row['Last Call Date'] = item.latest_call_date ? new Date(item.latest_call_date).toLocaleDateString('en-IN') : '';
            row['Call Notes'] = item.latest_call_notes;
            row['Total Collected'] = item.amount_collected;
            row['Outstanding'] = getOutstanding();

            // Standardize columns using helpers
            row['DPD'] = getValue(['dpd', 'DPD']);
            row['POS'] = getValue(['pos_amount', 'pos', 'POS']);
            row['EMI'] = getValue(['emi_amount', 'emi', 'EMI']);
            row['Employment Type'] = employmentType;

            // Add all other fields dynamically
            Object.keys(item).forEach(key => {
                // Skip fields we already added or complex objects
                if (['id', 'loan_id', 'customer_name', 'mobile_no', 'telecaller_name', 'case_status',
                    'latest_call_status', 'latest_ptp_date', 'latest_call_date', 'latest_call_notes',
                    'amount_collected', 'outstanding_amount', 'status', 'telecaller_id', 'tenant_id',
                    'dpd', 'pos_amount', 'emi_amount', 'case_data', 'custom_fields'].includes(key)) {
                    return;
                }

                const val = item[key];
                if (val && typeof val === 'object' && !(val instanceof Date)) {
                    // try to look inside custom fields/case data for Employment Type if needed
                    // Already handled above
                } else {
                    row[key] = val;
                }
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Team Metrics");
        XLSX.writeFile(wb, fileName);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Team Metrics Report</h2>
                        <p className="text-sm text-gray-600">Detailed case analysis by Team and Telecaller</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Select Team</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
                        <select
                            value={selectedTelecallerId}
                            onChange={(e) => setSelectedTelecallerId(e.target.value)}
                            disabled={!selectedTeamId}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">Select Telecaller</option>
                            {telecallers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={handleShowReport}
                        disabled={isLoading || !selectedTeamId || !selectedTelecallerId}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Show
                            </>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {!hasSearched ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Filter className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select filters and click Show to view the report</p>
                        </div>
                    ) : reportData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Search className="w-16 h-16 mb-4 opacity-20" />
                            <p>No records found for the selected criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Results ({reportData.length} cases)
                                </h3>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Download Excel
                                </button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTP Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.loan_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.customer_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${item.case_status === 'closed' ? 'bg-green-100 text-green-800' :
                                                            item.case_status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                        {item.case_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.latest_call_status}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.latest_ptp_date ? new Date(item.latest_ptp_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                    {formatIndianCurrency(item.amount_collected)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                    {formatIndianCurrency(item.outstanding_amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
