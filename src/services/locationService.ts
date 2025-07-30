interface LocationData {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  accuracy: number;
}

class LocationService {
  private watchId: number | null = null;
  private previousLocation: GeolocationCoordinates | null = null;
  private previousTimestamp: number | null = null;

  // Get current position once
  getCurrentPosition(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { coords } = position;
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
            speed: this.calculateSpeed(coords),
            timestamp: Date.now(),
            accuracy: coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Start watching position with callback
  startWatching(callback: (location: LocationData) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { coords } = position;
          const locationData: LocationData = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            speed: this.calculateSpeed(coords),
            timestamp: Date.now(),
            accuracy: coords.accuracy
          };
          
          callback(locationData);
          resolve();
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      );
    });
  }

  // Stop watching position
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.previousLocation = null;
      this.previousTimestamp = null;
    }
  }

  // Calculate speed based on distance and time
  private calculateSpeed(coords: GeolocationCoordinates): number {
    if (!this.previousLocation || !this.previousTimestamp) {
      this.previousLocation = coords;
      this.previousTimestamp = Date.now();
      return coords.speed || 0;
    }

    const distance = this.calculateDistance(
      this.previousLocation.latitude,
      this.previousLocation.longitude,
      coords.latitude,
      coords.longitude
    );

    const timeDiff = (Date.now() - this.previousTimestamp) / 1000; // seconds
    const speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0; // km/h

    this.previousLocation = coords;
    this.previousTimestamp = Date.now();

    return Math.round(speed * 10) / 10; // Round to 1 decimal place
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Check if geolocation is available
  isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }
}

export default new LocationService();