import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import AddGiftForm from '../components/AddGiftForm';
import ManageGifts from '../components/ManageGifts';
import ManageCategories from '../components/ManageCategories';
import ManageUsers from '../components/ManageUsers';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [activeSection, setActiveSection] = useState<'add-gift' | 'manage-gifts' | 'categories' | 'users'>('add-gift');

  // Verificar si es admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const handleGiftCreated = () => {
    showAlert('success', 'Regalo creado exitosamente. Puedes verlo en la sección de Regalos.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona regalos, categorías y usuarios de la boda
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSection('add-gift')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'add-gift'
                ? 'border-aqua-500 text-aqua-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agregar Regalo
          </button>
          <button
            onClick={() => setActiveSection('manage-gifts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'manage-gifts'
                ? 'border-aqua-500 text-aqua-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gestionar Regalos
          </button>
          <button
            onClick={() => setActiveSection('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'categories'
                ? 'border-aqua-500 text-aqua-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'users'
                ? 'border-aqua-500 text-aqua-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usuarios
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeSection === 'add-gift' && (
        <AddGiftForm onSuccess={handleGiftCreated} />
      )}

      {activeSection === 'manage-gifts' && (
        <ManageGifts />
      )}

      {activeSection === 'categories' && (
        <ManageCategories />
      )}

      {activeSection === 'users' && (
        <ManageUsers />
      )}
    </div>
  );
};

export default AdminPage;
