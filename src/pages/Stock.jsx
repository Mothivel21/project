import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Truck, LogOut, Package } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Stock() {
  const [activeTab, setActiveTab] = useState('supplier');
  const [suppliers, setSuppliers] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const navigate = useNavigate();

  const [supplierForm, setSupplierForm] = useState({
    supplier_code: '', supplier_name: '', address: '', city: '', state: '', pin_code: '', gst_no: ''
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    chassis_no: '', engine_no: '', model_code: '', model_name: '', variant: '', color: '', hsn_code: '', supplier_code: ''
  });

  useEffect(() => {
    fetchSuppliers();
    if (activeTab === 'stock') {
      fetchStock();
    }
  }, [activeTab]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.table('vehicle_master').select('*, supplier_master(*)');
      if (error) throw error;
      setStockData(data);
    } catch (err) {
      console.error("Error fetching stock:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setFormMessage(null);
    
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(supplierForm.pin_code)) {
      setFormMessage({ type: 'error', text: 'Invalid PIN Code. Must be exactly 6 digits (Indian Format).' });
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (supplierForm.gst_no && !gstRegex.test(supplierForm.gst_no)) {
      setFormMessage({ type: 'error', text: 'Invalid GST Number format.' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      if (!res.ok) throw new Error("Failed to save supplier");
      setFormMessage({ type: 'success', text: 'Supplier added successfully!' });
      setSupplierForm({ supplier_code: '', supplier_name: '', address: '', city: '', state: '', pin_code: '', gst_no: '' });
      fetchSuppliers();
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage(null);
    
    if (!vehicleForm.supplier_code) {
      setFormMessage({ type: 'error', text: 'Please select a supplier.' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm)
      });
      if (!res.ok) throw new Error("Failed to save vehicle");
      setFormMessage({ type: 'success', text: 'Vehicle registered successfully!' });
      setVehicleForm({ chassis_no: '', engine_no: '', model_code: '', model_name: '', variant: '', color: '', hsn_code: '', supplier_code: '' });
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportStock = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/export_stock`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Stock_Report.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export stock");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">AutoStock Pro</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-700/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('supplier')}
            className={`flex-1 py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-200 ${
              activeTab === 'supplier' 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' 
                : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Truck className="w-5 h-5" />
            <span className="font-semibold">Supplier Entry</span>
          </button>
          <button 
            onClick={() => setActiveTab('vehicle')}
            className={`flex-1 py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-200 ${
              activeTab === 'vehicle' 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' 
                : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="font-semibold">Vehicle Entry</span>
          </button>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-200 ${
              activeTab === 'stock' 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' 
                : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="font-semibold">Stock View</span>
          </button>
        </div>

        {formMessage && (
          <div className={`p-4 rounded-xl mb-6 border animate-fade-in ${
            formMessage.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formMessage.text}</span>
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
          
          {activeTab === 'supplier' && (
            <div className="p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Supplier Master</h2>
                <p className="text-slate-400 mt-1 text-sm">Add a new supplier to the catalog</p>
              </div>
              <form onSubmit={handleSupplierSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Supplier Code</label>
                  <input required type="text" value={supplierForm.supplier_code} onChange={e => setSupplierForm({...supplierForm, supplier_code: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. SUP001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Supplier Name</label>
                  <input required type="text" value={supplierForm.supplier_name} onChange={e => setSupplierForm({...supplierForm, supplier_name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Enter full name" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Address</label>
                  <textarea value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" rows="3" placeholder="Full street address"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
                  <input type="text" value={supplierForm.city} onChange={e => setSupplierForm({...supplierForm, city: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="City name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
                  <input type="text" value={supplierForm.state} onChange={e => setSupplierForm({...supplierForm, state: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="State name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">PIN Code</label>
                  <input type="text" value={supplierForm.pin_code} onChange={e => setSupplierForm({...supplierForm, pin_code: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="6 digit code" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">GST No (India)</label>
                  <input type="text" value={supplierForm.gst_no} onChange={e => setSupplierForm({...supplierForm, gst_no: e.target.value.toUpperCase()})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-700/50">
                  <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                    <Plus className="w-5 h-5" />
                    Save Supplier Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Vehicle Master</h2>
                <p className="text-slate-400 mt-1 text-sm">Register a new vehicle into the stock</p>
              </div>
              <form onSubmit={handleVehicleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <div className="lg:col-span-3 mb-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Supplier Partner</label>
                  <select required value={vehicleForm.supplier_code} onChange={e => setVehicleForm({...vehicleForm, supplier_code: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none">
                    <option value="" disabled>Select the originating supplier</option>
                    {suppliers.map(sup => (
                      <option key={sup.supplier_code} value={sup.supplier_code}>
                        {sup.supplier_name} - {sup.supplier_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Chassis No (VIN)</label>
                  <input required type="text" value={vehicleForm.chassis_no} onChange={e => setVehicleForm({...vehicleForm, chassis_no: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono" placeholder="VIN..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Engine No</label>
                  <input required type="text" value={vehicleForm.engine_no} onChange={e => setVehicleForm({...vehicleForm, engine_no: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono" placeholder="Engine number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Model Code</label>
                  <input type="text" value={vehicleForm.model_code} onChange={e => setVehicleForm({...vehicleForm, model_code: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. M01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Model Name</label>
                  <input type="text" value={vehicleForm.model_name} onChange={e => setVehicleForm({...vehicleForm, model_name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Model name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Variant</label>
                  <input type="text" value={vehicleForm.variant} onChange={e => setVehicleForm({...vehicleForm, variant: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. LXI / VXI" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
                  <input type="text" value={vehicleForm.color} onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Color" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">HSN Code</label>
                  <input type="text" value={vehicleForm.hsn_code} onChange={e => setVehicleForm({...vehicleForm, hsn_code: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="HSN code" />
                </div>
                <div className="md:col-span-2 lg:col-span-3 mt-6 pt-6 border-t border-slate-700/50">
                  <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                    <Plus className="w-5 h-5" />
                    Register Vehicle
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="flex flex-col h-[650px]">
              <div className="p-6 md:p-8 border-b border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Current Stock</h2>
                  <p className="text-slate-400 mt-1 text-sm">Overview of all registered vehicles</p>
                </div>
                <button 
                  onClick={handleExportStock}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-900/20">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/80 backdrop-blur-sm sticky top-0 shadow-sm z-0">
                      <tr>
                        <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-slate-400 whitespace-nowrap border-b border-slate-700">Chassis No</th>
                        <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-slate-400 whitespace-nowrap border-b border-slate-700">Model Details</th>
                        <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-slate-400 whitespace-nowrap border-b border-slate-700">Color</th>
                        <th className="py-4 px-6 font-semibold text-xs uppercase tracking-wider text-slate-400 whitespace-nowrap border-b border-slate-700">Supplier Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {stockData.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                              <Package className="w-12 h-12 text-slate-600 mb-3" />
                              <p>No vehicles found in stock.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        stockData.map((vehicle) => (
                          <tr key={vehicle.chassis_no} className="hover:bg-slate-800/50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="font-mono text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{vehicle.chassis_no}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">Eng: {vehicle.engine_no}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm font-semibold text-white">{vehicle.model_name || 'N/A'}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{vehicle.model_code} • {vehicle.variant}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-sm" style={{ backgroundColor: vehicle.color?.toLowerCase() || 'transparent' }}></div>
                                <span className="text-sm text-slate-300 capitalize">{vehicle.color || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-slate-300">{vehicle.supplier_master?.supplier_name || 'N/A'}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{vehicle.supplier_master?.city || ''} {vehicle.supplier_master?.state ? `• ${vehicle.supplier_master?.state}` : ''}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
