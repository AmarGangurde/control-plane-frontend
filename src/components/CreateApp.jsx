import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CreateApp() {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('p-tiny');
  const [loading, setLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  useEffect(() => {
    // fetch plans
    api.billing.plans().then(setPlans).catch(console.error);
  }, []);

  const submit = async () => {
    setLoading(true);
    setCreateMsg(null);
    try {
      const res = await api.apps.create({ name, image, port: 80, planId: selectedPlan });
      setCreateMsg({ type: 'success', text: `Deployed: ${res.url}` });
      window.dispatchEvent(new Event('apps:reload'));
      setName('');
      setImage('');
    } catch (e) {
      setCreateMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 p-8 rounded-3xl border border-white/5 mb-10">
      <h3 className="text-xl font-black mb-6 tracking-tight">Deploy New App</h3>

      {createMsg && (
        <div className={`p-4 rounded-xl mb-6 font-medium ${createMsg.type === 'success'
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
          {createMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. my-awesome-app"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Docker Image</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. nginx:latest"
            value={image}
            onChange={e => setImage(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Select Plan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {plans.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${selectedPlan === p.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
              >
                <div className="font-bold text-white">{p.name}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{p.cpu} CPU / {p.memory} RAM</div>
                <div className="text-[10px] text-blue-400 mt-2 font-black uppercase tracking-wider">₹{p.price_per_hour}/hr</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={submit}
          disabled={loading || !image || !name}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-500 disabled:opacity-50 font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          {loading ? 'Deploying...' : 'Deploy App'}
        </button>
      </div>
    </div>
  );
}
