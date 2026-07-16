import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { logout, user, isAuthenticated } = useAuth();

  const tabs = [
    { id: 'evento', label: 'Evento' },
    { id: 'regalos', label: 'Regalos' },
    ...(user?.role === 'admin' ? [
      { id: 'reportes', label: 'Reportes' },
      { id: 'admin', label: 'Administración' }
    ] : [])
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-aqua-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-700">
                  Bienvenido, {user.username}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700 font-medium' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
