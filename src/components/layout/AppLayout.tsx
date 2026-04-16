import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CheckinModal from './CheckinModal';
import { useUIStore } from '../../stores/uiStore';

export default function AppLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className={`
        flex flex-col flex-1 min-w-0 transition-all duration-300
        ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'}
      `}>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Global Checkin Modal checks if user needs to check in today */}
      <CheckinModal />
    </div>
  );
}
