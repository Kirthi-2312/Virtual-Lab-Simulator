import React, { useState, useEffect } from 'react';
import { MapPin, Play, Square, Users, Navigation, Wifi, Clock, Truck, AlertCircle } from 'lucide-react';
import GoogleMap from '../GoogleMap';
import { startLocationTracking, stopLocationTracking, updateDriverStatus } from '../../services/firebaseService';
import { getCurrentLocation, watchPosition } from '../../services/locationService';

interface DriverDashboardProps {
  driver: any;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ driver, onLogout }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [passengerCount, setPassengerCount] = useState(0);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permission.state);
        
        permission.addEventListener('change', () => {
          setLocationPermission(permission.state);
        });
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await getCurrentLocation();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
        heading: position.coords.heading || 0
      });
      setLocationPermission('granted');
      setLocationError('');
    } catch (error: any) {
      setLocationError(error.message);
      setLocationPermission('denied');
    }
  };

  const startTracking = async () => {
    try {
      setLocationError('');
      
      // Request location permission if not granted
      if (locationPermission !== 'granted') {
        await requestLocationPermission();
      }

      // Get initial location
      const position = await getCurrentLocation();
      const initialLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
        heading: position.coords.heading || 0
      };

      setCurrentLocation(initialLocation);

      // Start continuous location tracking
      const id = watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
            heading: position.coords.heading || 0
          };
          
          setCurrentLocation(newLocation);
          
          // Update location in Firebase
          startLocationTracking(driver.busRoute || 'route1', newLocation, {
            driverId: driver.driverId,
            driverName: driver.name,
            busNumber: driver.busNumber,
            phone: driver.phone
          });
        },
        (error) => {
          console.error('Location tracking error:', error);
          setLocationError('Failed to get location. Please check GPS settings.');
        }
      );

      setWatchId(id);
      setIsTracking(true);
      setTripStartTime(new Date());

      // Update driver status in Firebase
      await updateDriverStatus(driver.driverId, {
        isOnline: true,
        isTracking: true,
        busNumber: driver.busNumber,
        driverName: driver.name,
        phone: driver.phone,
        lastSeen: new Date().toISOString()
      });

    } catch (error: any) {
      setLocationError(error.message);
      console.error('Error starting tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }

      setIsTracking(false);
      setTripStartTime(null);

      // Stop location tracking in Firebase
      await stopLocationTracking(driver.busRoute || 'route1');

      // Update driver status
      await updateDriverStatus(driver.driverId, {
        isOnline: true,
        isTracking: false,
        busNumber: driver.busNumber,
        driverName: driver.name,
        phone: driver.phone,
        lastSeen: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const getTripDuration = () => {
    if (!tripStartTime) return '00:00:00';
    
    const now = new Date();
    const diff = now.getTime() - tripStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Bus stops for the route
  const busStops = [
    { id: '1', name: 'Gandhipuram Bus Stop', lat: 11.0168, lng: 76.9558 },
    { id: '2', name: 'RS Puram Junction', lat: 11.0045, lng: 76.9612 },
    { id: '3', name: 'Peelamedu', lat: 10.9965, lng: 76.9749 },
    { id: '4', name: 'VSB College', lat: 10.9932, lng: 76.9806 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 w-10 h-10 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Driver Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {driver.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isTracking ? 'text-green-600' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">{isTracking ? 'Live Tracking' : 'Offline'}</span>
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
                  <h2 className="text-lg font-semibold text-gray-800">Live Location Tracking</h2>
                  <div className="flex items-center gap-3">
                    {locationPermission === 'granted' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm">GPS Connected</span>
                      </div>
                    )}
                    {isTracking && currentLocation && (
                      <div className="text-sm text-gray-600">
                        Speed: {currentLocation.speed?.toFixed(1) || '0'} km/h
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-96">
                {currentLocation ? (
                  <GoogleMap
                    center={currentLocation}
                    busLocation={currentLocation}
                    busStops={busStops}
                    isLive={isTracking}
                    driverName={driver.name}
                    busNumber={driver.busNumber}
                    showTraffic={true}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      {locationPermission === 'denied' ? (
                        <>
                          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">Location Access Denied</h3>
                          <p className="text-gray-500 max-w-sm mb-4">
                            Please enable location access in your browser settings to start tracking.
                          </p>
                          <button
                            onClick={requestLocationPermission}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Request Location Access
                          </button>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">Start Location Tracking</h3>
                          <p className="text-gray-500 max-w-sm">
                            Click "Start Tracking" to begin sharing your live location with students.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Tracking Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Trip Controls</h3>
              
              {locationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{locationError}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={locationPermission === 'denied'}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Live Tracking
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    Stop Tracking
                  </button>
                )}

                {isTracking && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-medium">Live Tracking Active</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Students can now see your live location on their app.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trip Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Trip Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bus Number</span>
                  <span className="font-medium">{driver.busNumber}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Route</span>
                  <span className="font-medium">Route {driver.busRoute?.slice(-1) || '1'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trip Duration</span>
                  <span className="font-medium font-mono">{getTripDuration()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Speed</span>
                  <span className="font-medium">
                    {currentLocation?.speed?.toFixed(1) || '0'} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* Passenger Count */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Passenger Count</h3>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Current Passengers</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPassengerCount(Math.max(0, passengerCount - 1))}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold text-xl w-8 text-center">{passengerCount}</span>
                  <button
                    onClick={() => setPassengerCount(passengerCount + 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm">Update passenger count as needed</span>
              </div>
            </div>

            {/* Location Status */}
            {currentLocation && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">GPS Status</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latitude</span>
                    <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longitude</span>
                    <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update</span>
                    <span>{new Date(currentLocation.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;