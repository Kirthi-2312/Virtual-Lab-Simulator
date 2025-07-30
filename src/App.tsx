import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelector from './components/RoleSelector';
import StudentLogin from './components/student/StudentLogin';
import StudentDashboard from './components/student/StudentDashboard';
import DriverLogin from './components/driver/DriverLogin';
import DriverDashboard from './components/driver/DriverDashboard';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'student' | 'driver' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedUser && savedRole) {
      setCurrentUser(JSON.parse(savedUser));
      setUserRole(savedRole as 'student' | 'driver' | 'admin');
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: any, role: 'student' | 'driver' | 'admin') => {
    setCurrentUser(userData);
    setUserRole(role);
    
    // Save to localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show their dashboard
  if (currentUser && userRole) {
    switch (userRole) {
      case 'student':
        return <StudentDashboard student={currentUser} onLogout={handleLogout} />;
      case 'driver':
        return <DriverDashboard driver={currentUser} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard admin={currentUser} onLogout={handleLogout} />;
      default:
        return <RoleSelector onRoleSelect={setUserRole} />;
    }
  }

  // Show login based on selected role
  if (userRole) {
    switch (userRole) {
      case 'student':
        return (
          <StudentLogin 
            onLogin={(userData) => handleLogin(userData, 'student')} 
          />
        );
      case 'driver':
        return (
          <DriverLogin 
            onLogin={(userData) => handleLogin(userData, 'driver')} 
          />
        );
      case 'admin':
        return (
          <AdminLogin 
            onLogin={(userData) => handleLogin(userData, 'admin')} 
          />
        );
      default:
        return <RoleSelector onRoleSelect={setUserRole} />;
    }
  }

  // Show role selector by default
  return <RoleSelector onRoleSelect={setUserRole} />;
}

export default App;