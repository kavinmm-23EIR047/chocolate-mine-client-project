import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Package, LogOut, ExternalLink, ShieldCheck,
  MapPin, Settings, Bell, CreditCard, ChevronRight,
  ShoppingBag, Star, Heart, Trash2, X
} from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { OrderStatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import MapSelector from '../components/MapSelector';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!user) {
      navigate('/login');
      return;
    }

    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          const response = await api.get('/orders/my');
          setOrders(response.data.data);
        } catch (err) {
          toast.error('Failed to fetch orders');
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }

    if (activeTab === 'addresses') fetchAddresses();
  }, [user, navigate, activeTab]);

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'profile', label: 'Account Info', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-20">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">

        {/* Sidebar Navigation */}
        <div className="lg:w-80 shrink-0">
          <div className="card-premium p-5 sm:p-8 sticky top-28">
            <div className="text-center mb-6 sm:mb-10">
              <div className="relative inline-block group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mb-4 mx-auto border border-primary/10 group-hover:bg-primary/10 transition-all">
                  <User size={36} className="sm:w-10 sm:h-10" />
                </div>
                <button className="absolute bottom-4 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-surface rounded-full shadow-premium flex items-center justify-center text-primary hover:scale-110 transition-transform border border-border">
                  <Settings size={12} className="sm:w-[14px] sm:h-[14px]" />
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-heading leading-tight break-words px-2">{user.name}</h2>
              <p className="text-[10px] text-muted font-black mt-1 uppercase tracking-widest">{user.role}</p>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'orders' ? navigate('/orders') : setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-[11px] transition-all uppercase tracking-widest ${activeTab === tab.id
                      ? 'bg-primary text-button-text shadow-premium translate-x-1'
                      : 'text-muted/80 hover:bg-surface hover:text-primary'
                    }`}
                >
                  <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="truncate">{tab.label}</span>
                  {(activeTab === tab.id || tab.id === 'orders') && <ChevronRight size={12} className="ml-auto opacity-50 shrink-0" />}
                </button>
              ))}

              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-border/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-[11px] text-error hover:bg-error-light transition-all uppercase tracking-widest"
                >
                  <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tighter uppercase break-words">Address Book</h2>
                    <p className="text-[10px] text-muted font-black mt-1 uppercase tracking-widest">Manage your saved delivery locations</p>
                  </div>
                  <Button
                    onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                    className="bg-primary text-button-text hover:brightness-110 px-5 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-normal"
                  >
                    ADD NEW ADDRESS
                  </Button>
                </div>

                {addressLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                      <div key={addr._id} className={`bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border-2 transition-all shadow-card group ${addr.isDefault ? 'border-primary' : 'border-border/40 hover:border-primary/30'}`}>
                        <div className="flex justify-between items-start gap-3 mb-4 sm:mb-6 flex-wrap">
                          <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-normal break-words ${addr.isDefault ? 'bg-primary text-button-text' : 'bg-surface text-muted border border-border shadow-sm'}`}>
                            {addr.type}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }} className="p-2 bg-surface hover:bg-primary/10 rounded-xl text-primary transition-all border border-border/50 shadow-sm">
                              <Settings size={14} />
                            </button>
                            <button onClick={() => handleDeleteAddress(addr._id)} className="p-2 bg-error-light hover:bg-error text-error hover:text-button-text rounded-xl transition-all border border-error/10 shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-black text-heading text-lg sm:text-xl mb-1 break-words">{addr.fullName}</h4>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-4 sm:mb-6 break-words">{addr.phone}</p>
                        <p className="text-sm font-bold text-heading/80 leading-relaxed break-words whitespace-normal">
                          {addr.houseNo}, {addr.street}<br />
                          {addr.city}, {addr.pincode}
                        </p>
                        {addr.isDefault && (
                          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/20 flex items-center gap-2 text-success flex-wrap">
                            <ShieldCheck size={14} className="text-success shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Default Delivery Location</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 sm:space-y-8"
              >
                <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tighter uppercase break-words">Account Information</h2>
                <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-border/50 shadow-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 sm:gap-y-8">
                    <div className="space-y-2 min-w-0">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Full Name</label>
                      <div className="bg-surface border border-border/60 p-4 sm:p-5 rounded-2xl font-black text-heading shadow-sm break-words whitespace-normal overflow-x-auto">
                        {user.name}
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Email Address</label>
                      <div className="bg-surface border border-border/60 p-4 sm:p-5 rounded-2xl font-black text-heading shadow-sm break-all whitespace-normal overflow-x-auto">
                        {user.email}
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Phone Number</label>
                      <div className="bg-surface border border-border/60 p-4 sm:p-5 rounded-2xl font-black text-heading shadow-sm break-words whitespace-normal">
                        {user.phone || 'Not provided'}
                      </div>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Member Since</label>
                      <div className="bg-surface border border-border/60 p-4 sm:p-5 rounded-2xl font-black text-heading shadow-sm break-words whitespace-normal">
                        Recently Joined
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/30 flex justify-end">
                    <Button className="bg-primary text-button-text hover:brightness-110 shadow-premium uppercase tracking-[0.2em] text-[10px] sm:text-[11px] font-black px-8 sm:px-12 py-4 sm:py-6 whitespace-normal">
                      EDIT PROFILE
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-card border border-border/20">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-info-light text-info rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border border-info/10">
                      <ShieldCheck size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <p className="font-black text-sm text-heading uppercase tracking-widest break-words">Verified</p>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Identity secure</p>
                  </div>
                  <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-card border border-border/20">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-warning-light text-warning rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border border-warning/10">
                      <Star size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <p className="font-black text-sm text-heading uppercase tracking-widest break-words">Gold Member</p>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">12 orders completed</p>
                  </div>
                  <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-card border border-border/20">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border border-primary/10">
                      <CreditCard size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <p className="font-black text-sm text-heading uppercase tracking-widest break-words">The Chocolate Mine Wallet</p>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">₹450.00 Balance</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Address Form Modal */}
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
        className="bg-card rounded-2xl sm:rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-premium border border-border"
      >
        <div className="p-4 sm:p-6 md:p-8 border-b border-border/50 flex justify-between items-center bg-surface/5 gap-3 flex-wrap">
          <h3 className="text-xl sm:text-2xl font-black text-heading uppercase tracking-tighter break-words">
            {address ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface shadow-premium flex items-center justify-center hover:bg-error hover:text-button-text transition-all border border-border/50 shrink-0"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="md:col-span-2 w-full bg-surface/10 border-2 border-dashed border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center text-button-text shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-xs sm:text-sm uppercase tracking-tight text-heading break-words">
                    {formData.lat ? 'Location Captured' : 'Pin location on map'}
                  </span>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 opacity-60">Use Google Maps for precise delivery</p>
                </div>
              </div>
            </button>

            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Full Name</label>
              <input
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Recipient Name"
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Phone Number</label>
              <input
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contact Number"
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">House/Flat No</label>
              <input
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.houseNo}
                onChange={e => setFormData({ ...formData, houseNo: e.target.value })}
                placeholder="e.g. 102, Green Apartments"
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Street Address</label>
              <input
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.street}
                onChange={e => setFormData({ ...formData, street: e.target.value })}
                placeholder="e.g. MG Road, Near Park"
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Landmark</label>
              <input
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.landmark || ''}
                onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="e.g. Opp. Central Mall"
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Pincode</label>
              <input
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="6-digit code"
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Address Type</label>
              <select
                className="input-field w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Home">Home (Personal)</option>
                <option value="Work">Work (Office)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex items-center gap-3 bg-surface/5 p-3 sm:p-4 rounded-2xl border border-border/30 flex-wrap">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 sm:w-5 sm:h-5 accent-primary rounded-lg border-border shrink-0"
            />
            <label htmlFor="isDefault" className="text-[10px] font-black text-heading uppercase tracking-widest break-words">
              Make this my primary delivery address
            </label>
          </div>

          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-3 sm:py-5 uppercase tracking-widest text-xs font-black border-2 border-border hover:bg-surface"
              onClick={onClose}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 sm:py-5 bg-primary text-button-text hover:brightness-110 shadow-premium uppercase tracking-widest text-xs font-black"
            >
              SAVE ADDRESS
            </Button>
          </div>
        </form>

        <AnimatePresence>
          {showMap && (
            <div className="fixed inset-0 z-[300] bg-background/90 backdrop-blur-xl p-4 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl sm:rounded-[3rem] w-full max-w-5xl h-[85vh] overflow-hidden relative shadow-premium border border-border"
              >
                <MapSelector onSelect={(data) => {
                  setFormData({ ...formData, lat: data.position.lat, lng: data.position.lng, street: data.address });
                  setShowMap(false);
                }} />
                <button
                  onClick={() => setShowMap(false)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-surface rounded-full shadow-premium flex items-center justify-center hover:bg-error hover:text-button-text transition-all border border-border/50"
                >
                  <X size={18} className="sm:w-6 sm:h-6" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Profile;