import { useState } from 'react';
import { apiFetch } from '../api/client';

export default function CreateApp() {
  const [image, setImage] = useState('');
  const [port, setPort] = useState(80);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await apiFetch('/apps', {
        method: 'POST',
        body: JSON.stringify({ image, port })
      });

      setMessage(`Created ${res.id} — ${res.url}`);
      // notify app list to reload
      window.dispatchEvent(new Event('apps:reload'));
      setImage('');
      setPort(80);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Create App</h3>
      {message && <div className="error">{message}</div>}
      <input
        placeholder="docker image (e.g. nginx)"
        value={image}
        onChange={e => setImage(e.target.value)}
      />
      <input
        type="number"
        value={port}
        onChange={e => setPort(+e.target.value)}
      />
      <button onClick={submit} disabled={loading}>{loading ? 'Deploying…' : 'Deploy'}</button>
    </div>
  );
}
