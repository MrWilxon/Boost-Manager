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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${apiUrl}/api/admin/profiles`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const { data } = await res.json();

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
    String(user.phone || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-main flex items-center gap-3">
            <Users2 className="text-indigo-500" />
            User Management
          </h2>
          <p className="text-muted text-sm font-bold mt-1">
            Monitor and manage registered users and their balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="nm-inset rounded-2xl p-4 flex items-center gap-4 border border-white/5">
            <div className="p-3 nm-flat rounded-xl text-indigo-500">
              <Users2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest">Total Users</p>
              <p className="text-xl font-black text-main">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted group-focus-within:text-indigo-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by username, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-6 py-4 nm-inset text-main placeholder-zinc-600 rounded-2xl outline-none text-sm font-bold transition-all border border-transparent focus:border-indigo-500/30 focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),_inset_-4px_-4px_8px_rgba(255,255,255,0.02)]"
        />
      </div>

      {/* Users Table */}
      <div className="nm-flat rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto table-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#161719] border-b border-black/30 font-black text-[10px] uppercase tracking-widest text-muted">
                <th className="px-6 py-5">User Profile</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Role & Status</th>
                <th className="px-6 py-5">Balance</th>
                <th className="px-6 py-5 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 nm-inset rounded-full text-zinc-600">
                        <Users2 size={40} />
                      </div>
                      <p className="text-muted font-bold italic">No users found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[#1C1E21] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 nm-inset rounded-xl flex items-center justify-center text-indigo-500 font-black text-xs border border-white/5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
                          {user.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-main">{user.username || 'Anonymous'}</p>
                          <p className="text-[10px] font-mono text-muted">UID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted">
                          <Mail size={12} />
                          <span className="text-xs font-bold">{user.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted">
                          <Phone size={12} />
                          <span className="text-xs font-bold">{user.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-all outline-none cursor-pointer nm-inset ${
                          user.role === 'Admin'
                            ? 'text-amber-500 border border-amber-500/20 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]'
                            : 'text-muted border border-white/5'
                        }`}
                      >
                        <option value="User" className="bg-surface text-muted">User</option>
                        <option value="Admin" className="bg-surface text-amber-500">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 nm-inset border border-emerald-500/10 rounded-xl shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]">
                          <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest block leading-none mb-1">Current Balance</span>
                          <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">रू{user.balance?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(user)}
                          className="w-8 h-8 nm-flat rounded-lg flex items-center justify-center text-muted hover:text-indigo-400 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const username = user.username || 'Anonymous';
                            const event = new CustomEvent('view-user-history', {
                              detail: { username }
                            });
                            window.dispatchEvent(event);
                          }}
                          className="w-8 h-8 nm-flat rounded-lg flex items-center justify-center text-muted hover:text-emerald-400 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all"
                          title="View History"
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="w-8 h-8 nm-flat rounded-lg flex items-center justify-center text-muted hover:text-rose-500 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all"
                        >
                          <Trash2 size={14} />
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
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg nm-flat p-8 rounded-3xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-main">Edit User Profile</h3>
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mt-1">UID: {editingUser.id}</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 nm-flat rounded-full flex items-center justify-center text-muted hover:text-rose-500 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 text-muted" size={14} />
                      <input
                        type="text"
                        value={editingUser.username || ''}
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Balance (NPR)</label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-3.5 text-muted" size={14} />
                      <input
                        type="number"
                        value={editingUser.balance || 0}
                        onChange={(e) => setEditingUser({...editingUser, balance: Number(e.target.value)})}
                        className="w-full pl-11 pr-4 py-3 nm-inset text-emerald-400 rounded-xl text-sm font-black outline-none border border-transparent focus:border-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-muted" size={14} />
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 text-muted" size={14} />
                      <input
                        type="text"
                        value={editingUser.phone || ''}
                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Role</label>
                    <select
                      value={editingUser.role || 'User'}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full px-4 py-3 nm-inset text-amber-500 rounded-xl text-sm font-black outline-none border border-transparent focus:border-amber-500/30"
                    >
                      <option value="User" className="bg-surface text-muted">User</option>
                      <option value="Admin" className="bg-surface text-amber-500">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Business Name</label>
                  <input
                    type="text"
                    value={editingUser.businessName || ''}
                    onChange={(e) => setEditingUser({...editingUser, businessName: e.target.value})}
                    className="w-full px-4 py-3 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30"
                    placeholder="Enter business name..."
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-4 nm-flat rounded-2xl flex items-center justify-center gap-2 text-indigo-400 font-black tracking-widest uppercase hover:text-indigo-300 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all"
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
