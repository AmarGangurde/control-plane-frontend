import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CreateApp() {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [port, setPort] = useState(80);
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
      const res = await api.apps.create({ name, image, port, planId: selectedPlan });
      setCreateMsg({ type: 'success', text: `Deployed: ${res.url}` });
      window.dispatchEvent(new Event('apps:reload'));
      setName('');
      setImage('');
      setPort(80);
    } catch (e) {
      setCreateMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
      <h3 className="text-lg font-semibold mb-4">Deploy New App</h3>

      {createMsg && (
        <div className={`p-3 rounded mb-4 ${createMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Docker Image</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g. nginx:latest"
            value={image}
            onChange={e => setImage(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Container Port</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={port}
            onChange={e => setPort(+e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {plans.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`border rounded p-4 cursor-pointer transition-colors ${selectedPlan === p.id
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'hover:border-blue-300 hover:bg-gray-50'
                  }`}
              >
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-600 mt-1">{p.cpu} CPU / {p.memory} RAM</div>
                <div className="text-xs text-gray-500 mt-2">₹{p.price_per_hour}/hr</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={submit}
          disabled={loading || !image || !name}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Deploying...' : 'Deploy App'}
        </button>
      </div>
    </div>
  );
}
