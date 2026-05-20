import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { 
  onSnapshot, 
  doc, 
  setDoc
} from "firebase/firestore";
import { db } from "../../services/firebase";

export function AdminLocationManagement() {
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "locations"), (snap) => {
      if (snap.exists()) {
        setLocations(snap.data().list || []);
      }
    });
    return unsub;
  }, []);

  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      alert("Please enter a location name.");
      return;
    }
    
    try {
      const docRef = doc(db, "settings", "locations");
      
      // Use setDoc with merge: true to handle both create and update
      await setDoc(
        docRef, 
        { list: [...locations, newLocation.trim()] }, 
        { merge: true }
      );
      
      setNewLocation("");
      alert("Location added successfully!");
    } catch (err) {
      console.error("Error adding location:", err);
      alert("Failed to add location. Ensure you have admin privileges.");
    }
  };

  const handleRemoveLocation = async (loc: string) => {
    try {
      const docRef = doc(db, "settings", "locations");
      
      // You can also use setDoc here for consistency
      await setDoc(
        docRef, 
        { list: locations.filter(l => l !== loc) }, 
        { merge: true }
      );
      
      alert("Location removed!");
    } catch (err) {
      console.error("Error removing location:", err);
      alert("Failed to remove location. Ensure you have admin privileges.");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900 dark:text-zinc-100">Manage Default Locations</h3>
      <div className="flex gap-2">
        <input 
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="New Location"
          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm dark:text-zinc-100"
        />
        <button onClick={handleAddLocation} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
      </div>
      <div className="space-y-2">
        {locations.map(loc => (
          <div key={loc} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-sm text-slate-800 dark:text-zinc-200">
            {loc}
            <button onClick={() => handleRemoveLocation(loc)} className="text-rose-500"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
