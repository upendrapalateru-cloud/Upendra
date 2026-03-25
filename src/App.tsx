import React, { useState, useEffect, createContext, useContext, Component } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate 
} from 'react-router-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { 
  Truck, 
  User, 
  Package, 
  LogOut, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  Search,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { UserProfile, Order, Quote, UserRole } from './types';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Contexts ---
interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };

  return (
    <button 
      className={cn(
        'px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden', className)}>
    {children}
  </div>
);

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>}
    <input 
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
      {...props}
    />
  </div>
);

// --- Views ---

const Landing = () => {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Truck className="w-12 h-12 text-indigo-600" />
        </div>
        <h1 className="text-5xl font-bold mb-4 tracking-tight">LorryLink</h1>
        <p className="text-indigo-100 text-lg mb-12 leading-relaxed">
          The smart way to book logistics and supply. Connect directly with lorry owners and manage your deliveries seamlessly.
        </p>
        <Button 
          onClick={login}
          className="w-full py-4 bg-white text-indigo-600 hover:bg-indigo-50 text-lg shadow-xl"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </Button>
      </motion.div>
    </div>
  );
};

const RoleSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !name || !phone) return;
    setLoading(true);
    try {
      // Check if user is the designated admin
      const finalRole = user.email === "upendrapalateru@gmail.com" ? "admin" : role;
      
      const profile: any = {
        uid: user.uid,
        email: user.email,
        name,
        phone,
        role: finalRole as UserRole,
        createdAt: Timestamp.now()
      };

      if (finalRole === 'owner') {
        profile.vehicleDetails = vehicleDetails;
      }

      await setDoc(doc(db, 'users', user.uid), profile);
      window.location.reload(); // Refresh to update context
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete your profile</h2>
        <p className="text-gray-500 mb-8">Tell us how you'll be using LorryLink.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                role === 'customer' ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-100 text-gray-500 hover:border-gray-200"
              )}
            >
              <User className="w-8 h-8" />
              <span className="font-semibold">Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                role === 'owner' ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-gray-100 text-gray-500 hover:border-gray-200"
              )}
            >
              <Truck className="w-8 h-8" />
              <span className="font-semibold">Lorry Owner</span>
            </button>
          </div>

          <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
          
          {role === 'owner' && (
            <Input 
              label="Vehicle Details (Model, Capacity, etc.)" 
              value={vehicleDetails} 
              onChange={e => setVehicleDetails(e.target.value)} 
              required 
            />
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Get Started"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

const CustomerDashboard = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'orders'), 
      where('customerId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));
  }, [profile]);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Shipments</h1>
          <p className="text-gray-500">Manage your active and past deliveries</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-5 h-5" />
          New Order
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Clock className="animate-spin text-indigo-600" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
          <p className="text-gray-500 mb-6">Create your first shipment to get quotes from lorry owners.</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>Create Order</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} role="customer" />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
};

const CreateOrderModal = ({ onClose }: { onClose: () => void }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    productWorth: '',
    offeredPrice: '',
    pickupLocation: '',
    dropLocation: '',
    deliveryDate: '',
    additionalRequirements: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const orderData = {
        customerId: profile.uid,
        productName: form.productName,
        productWorth: Number(form.productWorth),
        offeredPrice: Number(form.offeredPrice),
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        deliveryDate: Timestamp.fromDate(new Date(form.deliveryDate)),
        additionalRequirements: form.additionalRequirements,
        status: 'pending',
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, 'orders'), orderData);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Shipment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <LogOut className="w-6 h-6 rotate-180" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Product Name" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} required />
            <Input label="Product Worth ($)" type="number" value={form.productWorth} onChange={e => setForm({...form, productWorth: e.target.value})} required />
            <Input label="Offered Price for Delivery ($)" type="number" value={form.offeredPrice} onChange={e => setForm({...form, offeredPrice: e.target.value})} required />
            <Input label="Delivery Date" type="datetime-local" value={form.deliveryDate} onChange={e => setForm({...form, deliveryDate: e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Pickup Location" value={form.pickupLocation} onChange={e => setForm({...form, pickupLocation: e.target.value})} required />
            <Input label="Drop Location" value={form.dropLocation} onChange={e => setForm({...form, dropLocation: e.target.value})} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Additional Requirements</label>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32"
              value={form.additionalRequirements}
              onChange={e => setForm({...form, additionalRequirements: e.target.value})}
              placeholder="Any specific instructions for the carrier..."
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Post Shipment"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const OwnerDashboard = () => {
  const { profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myQuotes, setMyQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-quotes'>('browse');

  useEffect(() => {
    if (!profile) return;
    
    // Browse available orders (pending or quoted)
    const qAvailable = query(
      collection(db, 'orders'), 
      where('status', 'in', ['pending', 'quoted']),
      orderBy('createdAt', 'desc')
    );
    
    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      setAvailableOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });

    return () => unsubAvailable();
  }, [profile]);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Carrier Hub</h1>
        <p className="text-gray-500">Find loads and manage your quotes</p>
      </header>

      <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('browse')}
          className={cn(
            "flex-1 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'browse' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Browse Orders
        </button>
        <button 
          onClick={() => setActiveTab('my-quotes')}
          className={cn(
            "flex-1 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'my-quotes' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          My Quotes
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Clock className="animate-spin text-indigo-600" /></div>
      ) : activeTab === 'browse' ? (
        <div className="space-y-4">
          {availableOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
              <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No available orders at the moment.</p>
            </div>
          ) : (
            availableOrders.map(order => (
              <OrderCard key={order.id} order={order} role="owner" />
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-500">Quote tracking coming soon.</p>
        </div>
      )}
    </div>
  );
};

const TrackingMap = ({ location, label }: { location: { lat: number; lng: number }; label: string }) => {
  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer center={[location.lat, location.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[location.lat, location.lng]} radius={10} pathOptions={{ color: 'indigo', fillColor: 'indigo', fillOpacity: 0.8 }}>
          <Popup>
            {label}
          </Popup>
        </CircleMarker>
        <MapUpdater center={[location.lat, location.lng]} />
      </MapContainer>
    </div>
  );
};

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const OrderCard = ({ order, role }: { order: Order; role: 'customer' | 'owner' | 'admin'; key?: string }) => {
  const { user } = useAuth();
  const [showQuotes, setShowQuotes] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  useEffect(() => {
    if (showQuotes || role === 'customer') {
      const q = query(collection(db, `orders/${order.id}/quotes`), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        setQuotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quote)));
      });
    }
  }, [showQuotes, order.id, role]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    quoted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-gray-100 text-gray-700'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{order.productName}</h3>
              <p className="text-sm text-gray-500">Posted {format(order.createdAt.toDate(), 'MMM d, h:mm a')}</p>
            </div>
          </div>
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", statusColors[order.status])}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">From:</span>
              <span className="text-sm text-gray-900">{order.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">To:</span>
              <span className="text-sm text-gray-900">{order.dropLocation}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Delivery:</span>
              <span className="text-sm text-gray-900">{format(order.deliveryDate.toDate(), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Budget:</span>
              <span className="text-sm font-bold text-indigo-600">${order.offeredPrice}</span>
            </div>
          </div>
        </div>

        {order.additionalRequirements && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic">
            "{order.additionalRequirements}"
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4">
            {role === 'customer' && (
              <button 
                onClick={() => setShowQuotes(!showQuotes)}
                className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                {quotes.length} Quotes Received
                <ChevronRight className={cn("w-4 h-4 transition-transform", showQuotes && "rotate-90")} />
              </button>
            )}
            {order.status === 'accepted' && order.currentLocation && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                <ShieldCheck className="w-4 h-4" />
                Live Tracking Available
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {role === 'owner' && order.status !== 'accepted' && order.status !== 'completed' && (
              <Button onClick={() => setShowQuoteForm(true)} size="sm">
                Send Quote
              </Button>
            )}
            {role === 'owner' && order.status === 'accepted' && order.acceptedOwnerId === user?.uid && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={async () => {
                  if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                      try {
                        await updateDoc(doc(db, 'orders', order.id), {
                          currentLocation: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          },
                          lastLocationUpdate: Timestamp.now()
                        });
                        alert("Location updated successfully!");
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
                      }
                    });
                  } else {
                    alert("Geolocation is not supported by this browser.");
                  }
                }}
              >
                Update My Location
              </Button>
            )}
          </div>
        </div>

        {order.status === 'accepted' && order.currentLocation && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Live Tracking
            </h4>
            <TrackingMap 
              location={order.currentLocation} 
              label={`Current Location of ${order.productName}`} 
            />
            {order.lastLocationUpdate && (
              <p className="text-xs text-gray-500 text-right">
                Last updated: {format(order.lastLocationUpdate.toDate(), 'MMM d, h:mm a')}
              </p>
            )}
          </div>
        )}

        {showQuotes && role === 'customer' && (
          <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2">
            {quotes.map(quote => (
              <div key={quote.id} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{quote.ownerName}</p>
                  <p className="text-sm text-gray-500">Quoted: <span className="font-bold text-indigo-600">${quote.quoteValue}</span></p>
                </div>
                {order.status === 'pending' || order.status === 'quoted' ? (
                  <Button 
                    variant="secondary" 
                    className="py-2 px-4 text-sm"
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'orders', order.id), {
                          status: 'accepted',
                          acceptedQuoteId: quote.id,
                          acceptedOwnerId: quote.ownerId
                        });
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
                      }
                    }}
                  >
                    Accept
                  </Button>
                ) : order.acceptedQuoteId === quote.id && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Accepted
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showQuoteForm && (
          <QuoteFormModal 
            order={order} 
            onClose={() => setShowQuoteForm(false)} 
          />
        )}
      </AnimatePresence>
    </Card>
  );
};

const QuoteFormModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quoteValue, setQuoteValue] = useState(order.offeredPrice.toString());
  const [minQuoteValue, setMinQuoteValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const quoteData = {
        orderId: order.id,
        ownerId: profile.uid,
        ownerName: profile.name,
        quoteValue: Number(quoteValue),
        minQuoteValue: Number(minQuoteValue) || Number(quoteValue),
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, `orders/${order.id}/quotes`), quoteData);
      await updateDoc(doc(db, 'orders', order.id), { status: 'quoted' });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${order.id}/quotes`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Quote</h2>
        <p className="text-gray-500 mb-6">Submit your offer for {order.productName}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Quote Value ($)" 
            type="number" 
            value={quoteValue} 
            onChange={e => setQuoteValue(e.target.value)} 
            required 
          />
          <Input 
            label="Minimum Acceptable Value ($)" 
            type="number" 
            value={minQuoteValue} 
            onChange={e => setMinQuoteValue(e.target.value)} 
            placeholder="Optional"
          />
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Sending..." : "Submit Quote"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => { unsubUsers(); unsubOrders(); };
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-gray-500">Global overview of users and shipments</p>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Users Management
        </h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold uppercase",
                      user.role === 'admin' ? "bg-purple-100 text-purple-700" : 
                      user.role === 'owner' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          Shipments Overview
        </h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Route</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.productName}</td>
                  <td className="px-6 py-4 text-gray-600">{order.pickupLocation} → {order.dropLocation}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{order.status}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">${order.offeredPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
};

// --- Main App & Navigation ---

const AppContent = () => {
  const { profile, loading, logout } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Truck className="w-12 h-12 text-indigo-600 animate-bounce" />
        <p className="text-gray-500 font-medium">Loading LorryLink...</p>
      </div>
    </div>
  );

  if (!profile) return <RoleSelection />;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">LorryLink</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{profile.name}</span>
              <span className="text-xs text-gray-500 capitalize">{profile.role}</span>
            </div>
            <button 
              onClick={logout}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main>
        {profile.role === 'customer' && <CustomerDashboard />}
        {profile.role === 'owner' && <OwnerDashboard />}
        {profile.role === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading) return null;

  return (
    <Router>
      <AuthProvider>
        {!user ? <Landing /> : <AppContent />}
      </AuthProvider>
    </Router>
  );
}
