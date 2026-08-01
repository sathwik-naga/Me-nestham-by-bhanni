import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DeliveryEstimator() {
  const [pincode, setPincode] = useState('');
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit Indian pincode.');
      setEstimation(null);
      return;
    }

    setError('');
    setLoading(true);

    // Simulate pincode estimation lookup (Express delivery 2-4 days)
    setTimeout(() => {
      setLoading(false);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);

      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      setEstimation({
        dateStr: deliveryDate.toLocaleDateString('en-IN', options),
        deliveryType: 'Express Insured Delivery',
        codAvailable: true,
      });
    }, 400);
  };

  return (
    <div className="p-4 bg-brand-secondary/40 border border-brand-border rounded-2xl flex flex-col gap-3 font-accent text-left text-xs">
      <div className="flex items-center gap-2 font-bold text-brand-text">
        <Truck size={16} className="text-brand-primary" />
        <span>Delivery & Shipping Estimator</span>
      </div>

      <form onSubmit={handleCheckPincode} className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          className="flex-1 bg-brand-card border border-brand-border px-3 py-2 rounded-xl outline-none text-brand-text font-mono focus:border-brand-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {error && (
        <div className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {estimation && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 size={14} />
            <span>Estimated Delivery by {estimation.dateStr}</span>
          </div>
          <span className="text-[11px] text-brand-text-muted">
            {estimation.deliveryType} • Cash on Delivery Available
          </span>
        </div>
      )}
    </div>
  );
}
