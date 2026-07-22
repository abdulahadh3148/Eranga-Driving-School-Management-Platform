import React, { useState } from 'react';
import { UserCheck, FileText, ShieldAlert } from 'lucide-react';
import PendingStudents from './PendingStudents';
import Medicals from './Medicals';
import LPermits from './LPermits';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('registrations');

  const tabs = [
    { id: 'registrations', label: 'New Registrations', icon: UserCheck },
    { id: 'medicals', label: 'Medical Certificates', icon: FileText },
    { id: 'lpermits', label: 'L-Permits', icon: ShieldAlert },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals Center</h1>
          <p className="text-gray-500 mt-1">Review and manage student registrations and documents.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="mt-6">
        {activeTab === 'registrations' && <PendingStudents />}
        {activeTab === 'medicals' && <Medicals />}
        {activeTab === 'lpermits' && <LPermits />}
      </div>
    </div>
  );
}
