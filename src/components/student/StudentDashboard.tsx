import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Bus, Navigation, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import GoogleMap from '../GoogleMap';
import { getBusLocation, getDriverStatus } from '../../services/firebaseService';

interface StudentDashboardProps {
  student: any;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, onLogout }) => {
  const [busLocation, setBusLocation] = useState<any>(null);
  const [driverStatus, setDriverStatus] = useState<any>(null);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Bus stops for the selected route
  const busStops = [
    { id: '1', name: 'Gandhipuram Bus Stop', lat: 11.0168, lng: 76.9558 },
    { id: '2', name: 'RS Puram Junction', lat: 11.0045, lng: 76.9612 },
    { id: '3', name: 'Peelamedu', lat: 10.9965, lng: 76.9749 },
    { id: '4', name: 'VSB College', lat: 10.9932, lng: 76.9806 }
  ];

  // Real-time location tracking
  useEffect(() => {
    let locationInterval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;

    const trackBusLocation = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Get driver status first
        const driverData = await getDriverStatus(student.busRoute);
        setDriverStatus(driverData);
        
        if (driverData && driverData.isOnline && driverData.isTracking) {
          setIsDriverOnline(true);
          
          // Get live bus location
          const locationData = await getBusLocation(student.busRoute);
          if (locationData) {
            setBusLocation(locationData);
            setLastUpdate(new Date());
            setConnectionStatus('connected');
          }
        } else {
          setIsDriverOnline(false);
          setBusLocation(null);
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Error tracking bus location:', error);
        setConnectionStatus('disconnected');
        setIsDriverOnline(false);
      }
    };

    // Initial load
    trackBusLocation();

    // Set up real-time tracking (every 3 seconds when driver is online)
    locationInterval = setInterval(trackBusLocation, 3000);

    // Cleanup
    return () => {
      if (locationInterval) clearInterval(locationInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [student.busRoute]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">VSB College Bus Tracker</h1>
                <p className="text-sm text-gray-600">Welcome, {student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
                {getConnectionStatusIcon()}
                <span className="text-sm font-medium capitalize">{connectionStatus}</span>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Live Bus Location</h2>
                  <div className="flex items-center gap-2">
                    {isDriverOnline ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Live Tracking</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm">Driver Offline</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-96">
                {isDriverOnline && busLocation ? (
                  <GoogleMap
                    center={busLocation}
                    busLocation={busLocation}
                    busStops={busStops}
                    isLive={true}
                    driverName={driverStatus?.driverName}
                    busNumber={driverStatus?.busNumber}
                    showTraffic={true}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Bus Not Available</h3>
                      <p className="text-gray-500 max-w-sm">
                        {!isDriverOnline 
                          ? "Your bus driver is currently offline. Live tracking will appear when the driver starts their trip."
                          : "Connecting to bus location..."
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-medium">{student.studentId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Bus Route</p>
                    <p className="font-medium">Route {student.busRoute.slice(-1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Today's Attendance</p>
                    <p className="font-medium text-green-600">Marked Present</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bus Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bus Status</h3>
              
              {isDriverOnline && driverStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-600">Driver Online</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Driver Name</p>
                      <p className="font-medium">{driverStatus.driverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bus Number</p>
                      <p className="font-medium">{driverStatus.busNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{driverStatus.phone}</p>
                    </div>
                  </div>

                  {busLocation && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Live Location</span>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>Speed: {busLocation.speed?.toFixed(1) || '0'} km/h</div>
                        <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Driver Offline</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your bus driver hasn't started tracking yet. You'll see live updates when they begin their route.
                  </p>
                </div>
              )}
            </div>

            {/* Bus Stops */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bus Stops</h3>
              <div className="space-y-3">
                {busStops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === busStops.length - 1 ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-medium">{stop.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;