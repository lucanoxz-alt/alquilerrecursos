// src/components/layout/AdminLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function AdminLayout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}