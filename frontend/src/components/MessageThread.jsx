import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Button from './Button';
import Banner from './Banner';
import './MessageThread.css';

function formatTime(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function MessageThread({ studentId, canPrescribe = false }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [showPrescribe, setShowPrescribe] = useState(false);
  const [rx, setRx] = useState({ drug_name: '', dosage: '', instructions: '' });
  const bottomRef = useRef(null);

  function load() {
    api.get(`/messages/${studentId}`, token).then((data) => setMessages(data.messages));
  }

  useEffect(load, [studentId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setSending(true);
    try {
      await api.post(`/messages/${studentId}`, { body: text.trim() }, token);
      setText('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handlePrescribe(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post(`/messages/${studentId}/prescribe`, rx, token);
      setRx({ drug_name: '', dosage: '', instructions: '' });
      setShowPrescribe(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="thread">
      <Banner tone="error">{error}</Banner>

      <div className="thread-scroll">
        {messages === null ? (
          <p className="muted small">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="muted small thread-empty">
            No messages yet. {canPrescribe ? 'Start the conversation below.' : 'Send a message if you have a question for the clinic.'}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`thread-row ${mine ? 'mine' : ''}`}>
                <div className={`thread-bubble ${m.type === 'prescription' ? 'is-prescription' : ''}`}>
                  {m.type === 'prescription' ? (
                    <div className="rx-card">
                      <div className="rx-card-label">Prescription</div>
                      <div className="rx-card-drug">{m.drug_name} — {m.dosage}</div>
                      {m.instructions && <div className="rx-card-instructions">{m.instructions}</div>}
                    </div>
                  ) : (
                    <div className="thread-text">{m.body}</div>
                  )}
                  <div className="thread-meta muted">
                    {mine ? 'You' : m.sender_name} · {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {showPrescribe && canPrescribe && (
        <form className="rx-form" onSubmit={handlePrescribe}>
          <h3 style={{ marginBottom: 12 }}>Issue a prescription</h3>
          <div className="rx-form-grid">
            <input
              required
              placeholder="Drug name (e.g. Amoxicillin)"
              value={rx.drug_name}
              onChange={(e) => setRx({ ...rx, drug_name: e.target.value })}
            />
            <input
              required
              placeholder="Dosage (e.g. 500mg, 3x daily for 5 days)"
              value={rx.dosage}
              onChange={(e) => setRx({ ...rx, dosage: e.target.value })}
            />
          </div>
          <textarea
            rows={2}
            placeholder="Additional instructions (optional)"
            value={rx.instructions}
            onChange={(e) => setRx({ ...rx, instructions: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button type="submit" size="sm" loading={sending}>Send prescription</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowPrescribe(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <form className="thread-composer" onSubmit={handleSend}>
        {canPrescribe && !showPrescribe && (
          <Button type="button" size="sm" variant="secondary" onClick={() => setShowPrescribe(true)}>
            Prescribe
          </Button>
        )}
        <input
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="sm" loading={sending} disabled={!text.trim()}>Send</Button>
      </form>
    </div>
  );
}
