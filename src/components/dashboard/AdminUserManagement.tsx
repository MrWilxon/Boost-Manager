import React, { useState, useEffect } from "react";
import { 
  Users2, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Search, 
  Mail, 
  Phone, 
  User, 
  Wallet,
  History
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { TableRowSkeleton } from "../common/Skeleton";
import { motion, AnimatePresence } from "motion/react";

export function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null
  });

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers = (data || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.whatsapp,
        role: u.role,
        balance: Number(u.balance),
        createdAt: u.created_at,
        businessName: u.business_name || '',
      }));

      setUsers(mappedUsers);
    } catch (e) {
      console.error("Error fetching profiles:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('profiles-changes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      alert("Role updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update role.");
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteConfirm({ isOpen: true, userId });
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirm.userId) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteConfirm.userId);

      if (error) throw error;

      setDeleteConfirm({ isOpen: false, userId: null });
      alert("User profile deleted.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete user profile.");
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { id, username, balance, email, phone, role, businessName } = editingUser;
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          balance: Number(balance),
          email,
          whatsapp: phone,
          role,
          business_name: businessName,
        })
        .eq('id', id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingUser(null);
      alert("User updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update user.");
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone || "").includes(searchQuery)
  );

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users2 className="text-indigo-600" />
            User Management
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
            Monitor and manage registered users and their balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600">
              <Users2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Users</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by username, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold transition-all shadow-sm group-hover:shadow-md"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 font-bold text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-6 py-5">User Profile</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Role & Status</th>
                <th className="px-6 py-5">Balance</th>
                <th className="px-6 py-5 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-full text-slate-300">
                        <Users2 size={40} />
                      </div>
                      <p className="text-slate-400 font-bold italic">No users found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                          {user.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{user.username || 'Anonymous'}</p>
                          <p className="text-[10px] font-mono text-slate-400">UID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                          <Mail size={12} />
                          <span className="text-xs font-semibold">{user.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                          <Phone size={12} />
                          <span className="text-xs font-semibold">{user.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 transition-all outline-none cursor-pointer ${
                          user.role === 'Admin'
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/30 text-amber-600'
                            : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500'
                        }`}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block leading-none mb-1">Current Balance</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">रू{user.balance?.toLocaleString() || 0}</span>
                        </div>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-zinc-900 rounded-lg transition-all border border-slate-100 dark:border-zinc-800"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const username = user.username || 'Anonymous';
                            const event = new CustomEvent('view-user-history', {
                              detail: { username }
                            });
                            window.dispatchEvent(event);
                          }}
                          className="p-2 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-all"
                          title="View History"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 bg-white dark:bg-zinc-900 text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit User Profile</h3>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">UID: {editingUser.id}</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={editingUser.username || ''}
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Balance (NPR)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-3 text-slate-400" size={14} />
                      <input
                        type="number"
                        value={editingUser.balance || 0}
                        onChange={(e) => setEditingUser({...editingUser, balance: Number(e.target.value)})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-black outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={14} />
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={editingUser.phone || ''}
                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role</label>
                    <select
                      value={editingUser.role || 'User'}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Business Name</label>
                  <input
                    type="text"
                    value={editingUser.businessName || ''}
                    onChange={(e) => setEditingUser({...editingUser, businessName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder="Enter business name..."
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DeleteConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null })}
        onConfirm={confirmDeleteUser}
        title="Delete User Profile?"
        message="Are you sure you want to delete this user profile? Their data will be lost forever."
        warning="This action only deletes their profile data from Supabase. It does NOT delete their login account from Supabase Auth."
      />
    </div>
  );
}
