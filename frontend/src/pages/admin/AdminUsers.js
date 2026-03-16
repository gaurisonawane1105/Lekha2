import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import api from '../../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await api.put(`/api/admin/users/${userId}/toggle`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Student: 'bg-blue-50 text-blue-700',
      Guide: 'bg-purple-50 text-purple-700',
      HOD: 'bg-orange-50 text-orange-700',
      Admin: 'bg-red-50 text-red-700',
    };
    return colors[role] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 mb-2" data-testid="users-title">
          User Management
        </h1>
        <p className="text-slate-600">Manage system users and their access</p>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">No users found</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Role</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Joined</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50 transition-colors" data-testid={`user-row-${user.user_id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role_name)}`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                          <UserCheck size={16} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 text-sm">
                          <UserX size={16} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Button
                        onClick={() => toggleUserStatus(user.user_id)}
                        variant="outline"
                        size="sm"
                        data-testid={`toggle-user-${user.user_id}`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
