import React, { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "../../services/supabase";

export function AdminLocationManagement() {
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('default_locations')
        .select('name')
        .order('name', { ascending: true });

      if (error) {
        // Table might not exist yet, fallback to defaults
        setLocations(["All Nepal", "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar"]);
        return;
      }

      if (data && data.length > 0) {
        setLocations(data.map((l: any) => l.name));
      } else {
        setLocations(["All Nepal", "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar"]);
      }
    } catch (err) {
      console.error("Error fetching default locations:", err);
      setLocations(["All Nepal", "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar"]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();

    const channel = supabase
      .channel('locations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'default_locations' }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      alert("Please enter a location name.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('default_locations')
        .insert({ name: newLocation.trim() });

      if (error) {
        // Table might not exist, update local state as fallback
        setLocations(prev => [...prev, newLocation.trim()]);
      } else {
        fetchLocations();
      }
      
      setNewLocation("");
      alert("Location added successfully!");
    } catch (err) {
      console.error("Error adding location:", err);
      alert("Failed to add location. Ensure you have default_locations table.");
    }
  };

  const handleRemoveLocation = async (loc: string) => {
    try {
      const { error } = await supabase
        .from('default_locations')
        .delete()
        .eq('name', loc);

      if (error) {
        setLocations(prev => prev.filter(l => l !== loc));
      } else {
        fetchLocations();
      }
      
      alert("Location removed!");
    } catch (err) {
      console.error("Error removing location:", err);
      alert("Failed to remove location.");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900 dark:text-main">Manage Default Locations</h3>
      <div className="flex gap-2">
        <input 
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="New Location"
          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm dark:text-main"
        />
        <button onClick={handleAddLocation} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {locations.map(loc => (
          <div key={loc} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-sm text-slate-800 dark:text-zinc-200">
            {loc}
            <button onClick={() => handleRemoveLocation(loc)} className="text-rose-500 hover:scale-110 active:scale-[0.98] active:nm-inset transition-all"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
