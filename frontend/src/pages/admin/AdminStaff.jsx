import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Mail, Trash2, Edit2, ShieldCheck, Key, ChevronDown } from 'lucide-react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    active: true
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllStaff();
      setStaff(res.data.data);
    } catch (err) {
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'staff', active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setIsEditing(true);
    setCurrentId(member._id);
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // blank by default
      phone: member.phone || '',
      role: member.role || 'staff',
      active: member.active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await adminService.updateStaff(currentId, formData);
        toast.success('Staff account updated');
      } else {
        await adminService.createStaff(formData);
        toast.success('Staff account created');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await adminService.deleteStaff(id);
      toast.success('Staff member deleted');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to delete staff');
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      await adminService.updateStaff(member._id, { active: !member.active });
      toast.success(`Staff ${!member.active ? 'activated' : 'deactivated'}`);
      fetchStaff();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading tracking-tight">Staff Command</h2>
          <p className="text-sm text-muted font-bold uppercase tracking-widest">Kitchen & Administration Roles</p>
        </div>
        <Button icon={UserPlus} onClick={handleOpenCreate}>New Member</Button>
      </div>

      {loading ? <TableSkeleton rows={5} cols={4} /> : staff.length === 0 ? (
        <EmptyState 
          icon={Shield} 
          title="No staff members" 
          message="Begin by adding your first kitchen or delivery team member." 
          action={<Button icon={UserPlus} onClick={handleOpenCreate}>Add Staff</Button>}
        />
      ) : (
        <>
        {/* Desktop Table */}
        <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-border/20 text-left">
                  <th className="px-6 py-4 text-xs font-black text-muted uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-black text-muted uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-xs font-black text-muted uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-xs font-black text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((member, i) => (
                  <motion.tr 
                    key={member._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-border/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center font-black text-secondary uppercase">
                            {member.name.charAt(0)}
                         </div>
                         <span className="font-bold text-heading">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-heading">{member.email}</div>
                      <div className="text-xs text-muted font-medium">{member.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={member.role === 'admin' ? 'danger' : 'outline'} className="uppercase text-[10px]">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                        onClick={() => handleToggleStatus(member)}
                        className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all ${member.active ? 'text-success' : 'text-error'}`}
                       >
                          {member.active ? <ShieldCheck size={14} /> : <Shield size={14} />}
                          {member.active ? 'Active' : 'Disabled'}
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 shrink-0">
                          <button 
                            onClick={() => handleOpenEdit(member)}
                            className="p-2 hover:bg-border rounded-xl text-muted hover:text-secondary transition-all shrink-0"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(member._id)}
                            className="p-2 hover:bg-error/10 rounded-xl text-muted hover:text-error transition-all shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden flex flex-col gap-3">
          {staff.map((member) => (
            <details key={`mobile-${member._id}`} className="bg-card border border-border rounded-2xl overflow-hidden group">
              <summary className="p-4 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center font-black text-secondary uppercase shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-heading text-sm block">{member.name}</span>
                    <Badge variant={member.role === 'admin' ? 'danger' : 'outline'} className="uppercase text-[9px] mt-1">
                      {member.role}
                    </Badge>
                  </div>
                </div>
                <ChevronDown size={20} className="text-muted group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              
              <div className="px-4 pb-4 pt-1 space-y-3">
                <div className="h-px w-full bg-border/50 mb-3" />
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Email</span>
                  <span className="text-sm font-bold text-heading">{member.email}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Phone</span>
                  <span className="text-xs text-muted font-medium">{member.phone || 'No phone'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Status</span>
                  <button 
                    onClick={() => handleToggleStatus(member)}
                    className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all ${member.active ? 'text-success' : 'text-error'}`}
                  >
                    {member.active ? <ShieldCheck size={14} /> : <Shield size={14} />}
                    {member.active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleOpenEdit(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-border/50 hover:bg-border rounded-lg text-xs font-bold transition-colors text-heading"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(member._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error rounded-lg text-xs font-bold transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
        </>
      )}

      {/* Staff Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? "Edit Staff Member" : "Register New Staff"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Full Name</label>
            <input 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold"
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Email Address</label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold"
                placeholder="staff@chocolatemine.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Phone Number</label>
              <input 
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Account Password'}
            </label>
            <div className="relative">
               <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
               <input 
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl pl-12 pr-4 py-3 outline-none focus:border-secondary transition-all font-bold"
                  placeholder="••••••••"
               />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Assigned Role</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold"
            >
              <option value="staff">Kitchen/Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-4 rounded-xl shadow-xl mt-4" 
            loading={submitting}
          >
            {isEditing ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStaff;
