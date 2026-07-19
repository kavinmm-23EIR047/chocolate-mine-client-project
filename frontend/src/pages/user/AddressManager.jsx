import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Settings, Trash2, ShieldCheck, LogOut, CreditCard } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import MapSelector from '../../components/MapSelector';

const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const res = await api.get('/users/addresses');
      setAddresses(res.data.data);
    } catch (err) {
      toast.error('Failed to load addresses');
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-heading tracking-tighter uppercase">Address Book</h1>
          <p className="text-[11px] text-muted font-black mt-1 uppercase tracking-widest">Manage your saved delivery locations</p>
        </div>
        <Button onClick={() => { setEditingAddress(null); setShowAddressForm(true); }} className="bg-primary text-button-text shadow-premium uppercase tracking-widest text-[11px] font-black px-10 py-5">
          ADD NEW ADDRESS
        </Button>
      </div>

      {addressLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses saved"
          message="Add your home or work address for faster checkouts."
          action={<Button onClick={() => setShowAddressForm(true)}>ADD ADDRESS</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {addresses.map((addr) => (
            <div key={addr._id} className={`card-premium p-6 border-2 transition-all bg-card ${addr.isDefault ? 'border-secondary' : 'border-border/50 hover:border-secondary/30'}`}>
              <div className="flex justify-between items-start mb-4">
                <Badge variant={addr.isDefault ? 'secondary' : 'outline'}>{addr.type}</Badge>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }} className="p-3 bg-surface hover:bg-primary/10 rounded-xl text-primary transition-all border border-border/50 shadow-sm"><Settings size={16} /></button>
                  <button onClick={() => handleDeleteAddress(addr._id)} className="p-3 bg-error-light hover:bg-error text-error hover:text-white rounded-xl transition-all border border-error/10 shadow-sm"><Trash2 size={16} /></button>
                </div>
              </div>
              <h4 className="font-black text-heading text-xl mb-1 uppercase tracking-tight">{addr.fullName}</h4>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-6">{addr.phone}</p>
              <p className="text-sm font-bold text-heading/80 leading-relaxed italic">
                {addr.houseNo}, {addr.street}<br />
                {addr.city}, {addr.pincode}
              </p>
              {addr.isDefault && (
                <div className="mt-8 pt-6 border-t border-border/20 flex items-center gap-2 text-success">
                  <ShieldCheck size={14} className="text-success" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Default Delivery Location</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddressForm && (
        <AddressModal
          address={editingAddress}
          onClose={() => setShowAddressForm(false)}
          onSuccess={() => { setShowAddressForm(false); fetchAddresses(); }}
        />
      )}
    </div>
  );
};

const AddressModal = ({ address, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(address || {
    fullName: '', phone: '', houseNo: '', street: '', landmark: '', pincode: '', type: 'Home', isDefault: false
  });
  const [showMap, setShowMap] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (address) {
        await api.patch(`/users/addresses/${address._id}`, formData);
        toast.success('Address updated');
      } else {
        await api.post('/users/addresses', formData);
        toast.success('Address added');
      }
      onSuccess();
    } catch {
      toast.error('Failed to save address');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-border/50 flex justify-between items-center bg-card-soft">
          <h3 className="text-2xl font-black text-heading uppercase tracking-tighter">
            {address ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-surface shadow-premium flex items-center justify-center hover:bg-error hover:text-white transition-all border border-border/50">
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="md:col-span-2 w-full bg-card-soft border-2 border-dashed border-secondary/20 rounded-2xl p-6 hover:bg-secondary/5 transition-all group"
            >

              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-button-text shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-sm uppercase tracking-tight text-heading">
                    {formData.lat ? 'Location Captured' : 'Pin location on map'}
                  </span>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Use Google Maps for precise delivery</p>
                </div>
              </div>
            </button>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Full Name</label>
              <input className="input-field" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Recipient Name" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Phone Number</label>
              <input className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Contact Number" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">House/Flat No</label>
              <input className="input-field" value={formData.houseNo} onChange={e => setFormData({ ...formData, houseNo: e.target.value })} placeholder="e.g. 102, Green Apartments" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Street Address</label>
              <input className="input-field" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} placeholder="e.g. MG Road, Near Park" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Landmark</label>
              <input className="input-field" value={formData.landmark || ''} onChange={e => setFormData({ ...formData, landmark: e.target.value })} placeholder="e.g. Opp. Central Mall" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Pincode</label>
              <input className="input-field" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="6-digit code" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Address Type</label>
              <select className="input-field appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="Home">Home (Personal)</option>
                <option value="Work">Work (Office)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 bg-surface/5 p-4 rounded-2xl border border-border/30">
            <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="w-5 h-5 accent-primary rounded-lg border-border" />
            <label htmlFor="isDefault" className="text-[10px] font-black text-heading uppercase tracking-widest">Make this my primary delivery address</label>
          </div>

          <div className="mt-12 flex gap-6">
            <Button type="button" variant="outline" className="flex-1 py-5 uppercase tracking-widest text-xs font-black border-2 border-border" onClick={onClose}>CANCEL</Button>
            <Button type="submit" className="flex-1 py-5 bg-primary text-button-text hover:brightness-110 shadow-premium uppercase tracking-widest text-xs font-black">SAVE ADDRESS</Button>
          </div>
        </form>

        <AnimatePresence>
          {showMap && (
            <div className="fixed inset-0 z-[300] bg-background/90 backdrop-blur-xl p-4 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-[3rem] w-full max-w-5xl h-[85vh] overflow-hidden relative shadow-premium border border-border"
              >
                <MapSelector onSelect={(data) => {
                  setFormData({ ...formData, lat: data.position.lat, lng: data.position.lng, street: data.address });
                  setShowMap(false);
                }} />
                <button onClick={() => setShowMap(false)} className="absolute top-6 right-6 z-10 w-12 h-12 bg-surface rounded-full shadow-premium flex items-center justify-center hover:bg-error hover:text-white transition-all border border-border/50">
                  <LogOut size={24} className="rotate-180" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AddressManager;
