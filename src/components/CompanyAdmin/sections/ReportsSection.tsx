import React, { useState, useRef } from 'react';
import { BarChart3, DollarSign, Users } from 'lucide-react';
import { ReportsModal } from '../../shared/reports';
import { TeamPerformanceMetrics } from '../../TeamIncharge/TeamPerformanceMetrics';
import { useAuth } from '../../../contexts/AuthContext';
import { TeamMetricsReportModal } from '../../TeamIncharge/modals/TeamMetricsReportModal';

type ReportTab = 'cases' | 'payments' | 'analytics' | 'team' | 'telecaller';

export const ReportsSection: React.FC = () => {
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showTeamMetricsModal, setShowTeamMetricsModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ReportTab>('analytics');
  const { user } = useAuth();
  const metricsRef = useRef<HTMLDivElement>(null);

  const openReportModal = (tab: ReportTab) => {
    setSelectedTab(tab);
    setShowReportsModal(true);
  };

  const scrollToMetrics = () => {
    metricsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={scrollToMetrics}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-blue-700">Team Performance Metrics</h4>
                <p className="text-sm text-gray-600 mt-0.5">View team performance below</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => openReportModal('payments')}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-green-700">Collection Analytics</h4>
                <p className="text-sm text-gray-600 mt-0.5">Payment and collection insights</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowTeamMetricsModal(true)}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-purple-700">Team Metrics</h4>
                <p className="text-sm text-gray-600 mt-0.5">Detailed team analytics</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div ref={metricsRef}>
        <TeamPerformanceMetrics />
      </div>

      {showReportsModal && user && (
        <ReportsModal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
          tenantId={user.tenantId || ''}
          userRole="company_admin"
          userId={user.id}
          companyName={''}
          initialTab={selectedTab}
        />
      )}

      {showTeamMetricsModal && user && (
        <TeamMetricsReportModal
          isOpen={showTeamMetricsModal}
          onClose={() => setShowTeamMetricsModal(false)}
          tenantId={user.tenantId || ''}
        />
      )}
    </div>
  );
};