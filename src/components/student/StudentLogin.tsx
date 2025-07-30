import React, { useState } from 'react';
import { User, Lock, Bus, AlertCircle } from 'lucide-react';
import { signInStudent } from '../../services/firebaseService';

interface StudentLoginProps {
  onLogin: (studentData: any) => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    busRoute: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const busRoutes = [
    { id: 'route1', name: 'Route 1 - Coimbatore to VSB College', stops: ['Gandhipuram', 'RS Puram', 'Peelamedu', 'VSB College'] },
    { id: 'route2', name: 'Route 2 - Saravanampatti to VSB College', stops: ['Saravanampatti', 'Kalapatti', 'Thudiyalur', 'VSB College'] },
    { id: 'route3', name: 'Route 3 - Singanallur to VSB College', stops: ['Singanallur', 'Hopes College', 'Vadavalli', 'VSB College'] }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.studentId || !formData.password || !formData.busRoute) {
        throw new Error('Please fill in all fields');
      }

      // Sign in student
      const result = await signInStudent(formData.studentId, formData.password, formData.busRoute);
      
      if (result.success) {
        // Mark attendance for today
        const attendanceData = {
          studentId: formData.studentId,
          date: new Date().toISOString().split('T')[0],
          loginTime: new Date().toISOString(),
          busRoute: formData.busRoute,
          status: 'present'
        };

        // Store attendance in Firebase (this would be implemented in firebaseService)
        console.log('Attendance marked:', attendanceData);

        onLogin({
          ...result.student,
          busRoute: formData.busRoute,
          attendanceMarked: true
        });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">VSB College</h1>
          <p className="text-gray-600 mt-2">Student Bus Tracking Login</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your student ID"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Bus Route
            </label>
            <select
              name="busRoute"
              value={formData.busRoute}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose your bus route</option>
              {busRoutes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing In...
              </div>
            ) : (
              'Sign In & Mark Attendance'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            By signing in, your attendance will be automatically marked for today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;