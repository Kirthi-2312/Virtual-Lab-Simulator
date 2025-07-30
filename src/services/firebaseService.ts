import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit,
  deleteDoc,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { db, auth } from '../config/firebase';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  busNumber: string;
  route: string;
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: number;
    accuracy: number;
  };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  busNumber: string;
  boardingPoint: string;
  phone: string;
  isLoggedIn: boolean;
  lastLogin?: number;
}

export interface LiveLocation {
  driverId: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  accuracy: number;
  isActive: boolean;
}

class FirebaseService {
  // Authentication
  async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async signUp(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  // Driver Operations
  async createDriver(driver: Omit<Driver, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'drivers'), driver);
    return docRef.id;
  }

  async updateDriverStatus(driverId: string, isOnline: boolean): Promise<void> {
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, { 
      isOnline,
      lastUpdated: Date.now()
    });
  }

  async getDriver(driverId: string): Promise<Driver | null> {
    const driverRef = doc(db, 'drivers', driverId);
    const driverSnap = await getDoc(driverRef);
    
    if (driverSnap.exists()) {
      return { id: driverSnap.id, ...driverSnap.data() } as Driver;
    }
    return null;
  }

  async getDriverByEmail(email: string): Promise<Driver | null> {
    const q = query(collection(db, 'drivers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Driver;
    }
    return null;
  }

  // Student Operations
  async createStudent(student: Omit<Student, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'students'), student);
    return docRef.id;
  }

  async updateStudentLogin(studentId: string, isLoggedIn: boolean): Promise<void> {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, { 
      isLoggedIn,
      lastLogin: isLoggedIn ? Date.now() : null
    });
  }

  async getStudent(studentId: string): Promise<Student | null> {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      return { id: studentSnap.id, ...studentSnap.data() } as Student;
    }
    return null;
  }

  async getStudentByEmail(email: string): Promise<Student | null> {
    const q = query(collection(db, 'students'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Student;
    }
    return null;
  }

  // Live Location Operations
  async updateLiveLocation(locationData: LiveLocation): Promise<void> {
    const locationRef = doc(db, 'liveLocations', locationData.driverId);
    await setDoc(locationRef, locationData, { merge: true });
  }

  async stopLiveLocation(driverId: string): Promise<void> {
    const locationRef = doc(db, 'liveLocations', driverId);
    await updateDoc(locationRef, { 
      isActive: false,
      stoppedAt: Date.now()
    });
  }

  // Real-time Location Listener
  subscribeToLiveLocation(busNumber: string, callback: (location: LiveLocation | null) => void) {
    const q = query(
      collection(db, 'liveLocations'), 
      where('busNumber', '==', busNumber),
      where('isActive', '==', true),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({ ...doc.data() } as LiveLocation);
      } else {
        callback(null);
      }
    });
  }

  // Admin Operations
  async getAllStudents(): Promise<Student[]> {
    const q = query(collection(db, 'students'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  }

  async getAllDrivers(): Promise<Driver[]> {
    const q = query(collection(db, 'drivers'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
  }

  async deleteStudent(studentId: string): Promise<void> {
    await deleteDoc(doc(db, 'students', studentId));
  }

  async deleteDriver(driverId: string): Promise<void> {
    await deleteDoc(doc(db, 'drivers', driverId));
  }

  // Get live locations for admin
  subscribeToAllLiveLocations(callback: (locations: LiveLocation[]) => void) {
    const q = query(
      collection(db, 'liveLocations'),
      where('isActive', '==', true),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({ ...doc.data() } as LiveLocation));
      callback(locations);
    });
  }
}

export default new FirebaseService();