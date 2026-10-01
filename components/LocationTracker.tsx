import React, { useEffect } from 'react';
// @ts-ignore
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
// @ts-ignore
import { User } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

interface LocationTrackerProps {
  user: User | null;
  isWorking: boolean;
  onStatusChange?: (status: 'tracking' | 'error' | 'denied' | 'idle') => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ user, isWorking, onStatusChange }) => {
  useEffect(() => {
    if (!user || !isWorking) {
      onStatusChange?.('idle');
      return;
    }

    let watchId: number;

    const startTracking = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        onStatusChange?.('error');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          onStatusChange?.('tracking');
          try {
            await setDoc(doc(db, "locations", user.uid), {
              uid: user.uid,
              email: user.email,
              latitude,
              longitude,
              lastUpdated: serverTimestamp(),
              status: 'active'
            }, { merge: true });
          } catch (error) {
            console.error("Firestore Location Update Error:", error);
          }
        },
        (error) => {
          let errorMsg = "Unknown geolocation error";
          let status: 'error' | 'denied' = 'error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "User denied the request for Geolocation.";
              status = 'denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMsg = "The request to get user location timed out.";
              break;
          }
          console.error("Geolocation Error:", errorMsg, error);
          onStatusChange?.(status);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    };

    startTracking();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user, isWorking]);

  return null; // This component doesn't render anything
};

export default LocationTracker;
