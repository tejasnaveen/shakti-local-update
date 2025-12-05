import React from 'react';
import { BarChart3, Users, FileText, BarChart, Settings, Bell } from 'lucide-react';
import Layout from '../Layout';
import { useTenantName } from '../../hooks/useTenantName';
import { Dashboard } from './Dashboard';
import { TeamsContainer } from './TeamsContainer';
import { CaseManagement } from './CaseManagement';
import { ReportsComponent } from './Reports';
import { Settings as SettingsComponent } from './Settings';
import { NotificationManager } from './NotificationManager';
import { User } from '../../contexts/AuthContext';

interface TeamInchargeDashboardProps {
  user: User;
  onLogout: () => void;
}

export const TeamInchargeDashboard: React.FC<TeamInchargeDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = React.useState('dashboard');
  const { tenantName } = useTenantName(user?.tenantId);

  const menuItems = [
    { name: 'Dashboard', icon: BarChart3, active: activeSection === 'dashboard', onClick: () => setActiveSection('dashboard') },
    { name: 'Teams', icon: Users, active: activeSection === 'teams', onClick: () => setActiveSection('teams') },
    { name: 'Case Management', icon: FileText, active: activeSection === 'case-management', onClick: () => setActiveSection('case-management') },
    { name: 'Reports', icon: BarChart, active: activeSection === 'reports', onClick: () => setActiveSection('reports') },
    { name: 'Notifications', icon: Bell, active: activeSection === 'notifications', onClick: () => setActiveSection('notifications') },
    { name: 'Settings', icon: Settings, active: activeSection === 'settings', onClick: () => setActiveSection('settings') },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'teams':
        return <TeamsContainer />;
      case 'case-management':
        return <CaseManagement />;
      case 'reports':
        return <ReportsComponent />;
      case 'settings':
        return <SettingsComponent />;
      case 'notifications':
        return <NotificationManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      menuItems={menuItems}
      title="Shakti - Team Incharge"
      roleColor="bg-green-500"
      tenantName={tenantName}
    >
      {renderContent()}
    </Layout>
  );
};

export default TeamInchargeDashboard;