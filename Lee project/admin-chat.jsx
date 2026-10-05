import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowLeftRight, Trash2 } from 'lucide-react';

const ADMIN_META = {
  A: { label: 'Admin A', color: '#45B8AC' },
  B: { label: 'Admin B', color: '#E8935A' },
};

const STORAGE_KEY = 'chat-messages';
const POLL_MS = 2500;

export default function AdminChatApp() {
  const [adminId, setAdminId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const sendingRef = useRef(false);

  const otherAdminId = adminId === 'A' ? 'B' : 'A';

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  const isNearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  const fetchMessages = async () => {
    if (sendingRef.current) return;
    try {
      const result = await window.storage.get(STORAGE_KEY, true);
      const parsed = result && result.value ? JSON.parse(result.value) : [];
      const shouldScroll = isNearBottom();
      setMessages(parsed);
      if (shouldScroll) scrollToBottom();
    } catch (e) {
      // no messages yet, or a transient read error — leave current state as-is
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminId) scrollToBottom();
  }, [adminId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !adminId) return;

    setSending(true);
    setError(null);

    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      admin: adminId,
      text: trimmed,
      ts: Date.now(),
    };

    try {
      let current = [];
      try {
        const result = await window.storage.get(STORAGE_KEY, true);
        if (result && result.value) current = JSON.parse(result.value);
      } catch (e) {
        current = [];
      }
      const updated = [...current, newMsg];
      const saved = await window.storage.set(STORAGE_KEY, JSON.stringify(updated), true);
      if (!saved) throw new Error('Save failed');

      setMessages(updated);
      setInput('');
      scrollToBottom();
    } catch (e) {
      setError('Could not send — check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const confirmClear = async () => {
    try {
      const saved = await window.storage.set(STORAGE_KEY, JSON.stringify([]), true);
      if (!saved) throw new Error('Clear failed');
      setMessages([]);
    } catch (e) {
      setError('Could not clear the conversation.');
    } finally {
      setConfirmingClear(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="ta-app h-screen w-full flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        .ta-app { background-color: #0E1520; }
        .ta-sans { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .ta-mono { font-family: 'IBM Plex Mono', 'SFMono-Regular', monospace; }

        .ta-text { color: #E4E8EE; }
        .ta-muted { color: #7C8AA0; }
        .ta-hint { color: #57647A; }
        .ta-error { color: #E0645A; }

        .ta-header { border-color: #232D3F; }
        .ta-confirm { border-color: #232D3F; background-color: rgba(224,100,90,0.06); }

        .ta-live-dot { background-color: #45B8AC; animation: ta-pulse 1.8s ease-in-out infinite; }
        @keyframes ta-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .ta-live-dot { animation: none; opacity: 0.8; } }

        .ta-icon-btn { color: #7C8AA0; transition: background-color 0.2s ease, color 0.2s ease; }
        .ta-icon-btn:hover { background-color: rgba(255,255,255,0.06); color: #E4E8EE; }

        .ta-danger-btn { background-color: #E0645A; color: #0E1520; font-weight: 600; transition: opacity 0.2s ease; }
        .ta-danger-btn:hover { opacity: 0.85; }
        .ta-cancel-btn { border: 1px solid #232D3F; color: #7C8AA0; background: transparent; transition: color 0.2s ease, border-color 0.2s ease; }
        .ta-cancel-btn:hover { color: #E4E8EE; border-color: #7C8AA0; }

        .ta-scroll::-webkit-scrollbar { width: 8px; }
        .ta-scroll::-webkit-scrollbar-track { background: transparent; }
        .ta-scroll::-webkit-scrollbar-thumb { background-color: #232D3F; border-radius: 8px; }
        .ta-scroll::-webkit-scrollbar-thumb:hover { background-color: #2c3a52; }

        .ta-card { background-color: #161E2B; border: 1px solid #232D3F; }
        .ta-picker-btn { background-color: #161E2B; border: 1px solid #232D3F; transition: border-color 0.2s ease, background-color 0.2s ease; }
        .ta-picker-btn:hover { border-color: #7C8AA0; background-color: #1D2636; }

        .ta-badge { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 0.5rem; background-color: var(--accent); color: #0E1520; flex-shrink: 0; }
        .ta-avatar { background-color: var(--accent); color: #0E1520; }
        .ta-pill { border: 1px solid var(--accent); color: var(--accent); }

        .ta-bubble { background-color: #1D2636; color: #E4E8EE; }
        .ta-bubble-mine { border-right: 3px solid var(--accent); }
        .ta-bubble-theirs { border-left: 3px solid var(--accent); }

        .ta-inputwrap { background-color: #161E2B; border: 1px solid #232D3F; transition: border-color 0.2s ease; }
        .ta-inputwrap:focus-within { border-color: #45B8AC; }
        .ta-textarea { color: #E4E8EE; background: transparent; }
        .ta-textarea::placeholder { color: #57647A; }

        .ta-send { background-color: #45B8AC; color: #0E1520; transition: opacity 0.2s ease, transform 0.1s ease; }
        .ta-send:hover:not(:disabled) { transform: translateY(-1px); }
        .ta-send:disabled { opacity: 0.35; cursor: not-allowed; }

        .ta-icon-btn:focus-visible,
        .ta-send:focus-visible,
        .ta-picker-btn:focus-visible,
        .ta-danger-btn:focus-visible,
        .ta-cancel-btn:focus-visible {
          outline: 2px solid #45B8AC;
          outline-offset: 2px;
        }
      `}</style>

      {!adminId ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="ta-card w-full max-w-sm rounded-2xl p-6 sm:p-8">
            <p className="ta-muted ta-sans text-xs font-medium mb-2">Admin Chat</p>
            <h1 className="ta-text ta-sans text-xl font-semibold mb-2">Choose your seat</h1>
            <p className="ta-muted ta-sans text-sm mb-6">
              Open this in a second tab and pick the other seat to try it out, or send the link to a teammate.
            </p>
            <div className="flex flex-col gap-3">
              {['A', 'B'].map((id) => (
                <button
                  key={id}
                  onClick={() => setAdminId(id)}
                  className="ta-picker-btn flex items-center gap-3 rounded-xl px-4 py-3 text-left"
                >
                  <span
                    className="ta-badge ta-mono text-sm font-semibold"
                    style={{ '--accent': ADMIN_META[id].color }}
                  >
                    {id}
                  </span>
                  <span className="ta-text ta-sans text-sm font-medium">
                    Join as {ADMIN_META[id].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="ta-header flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="ta-live-dot inline-block w-1.5 h-1.5 rounded-full" />
              <span className="ta-text ta-sans text-base font-semibold">Admin Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="ta-pill ta-mono text-xs px-2 py-1 rounded-full"
                style={{ '--accent': ADMIN_META[adminId].color }}
              >
                {ADMIN_META[adminId].label}
              </span>
              <button
                onClick={() => setAdminId(null)}
                className="ta-icon-btn p-2 rounded-full"
                title="Switch admin"
                aria-label="Switch admin"
              >
                <ArrowLeftRight size={16} />
              </button>
              <button
                onClick={() => setConfirmingClear(true)}
                className="ta-icon-btn p-2 rounded-full"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {confirmingClear && (
            <div className="ta-confirm flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b flex-shrink-0">
              <span className="ta-error ta-sans text-xs">Clear the conversation for both admins?</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={confirmClear} className="ta-danger-btn ta-sans text-xs px-3 py-1.5 rounded-full">
                  Clear
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="ta-cancel-btn ta-sans text-xs px-3 py-1.5 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div ref={listRef} className="ta-scroll flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
              {initializing ? (
                <div className="flex items-center justify-center pt-16 sm:pt-24">
                  <p className="ta-muted ta-sans text-sm">Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-16 sm:pt-24">
                  <p className="ta-muted ta-sans text-sm">
                    No messages yet. Say hello to {ADMIN_META[otherAdminId].label}.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((m) => {
                    const mine = m.admin === adminId;
                    const meta = ADMIN_META[m.admin] || ADMIN_META.A;
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                        {!mine && (
                          <span
                            className="ta-avatar ta-mono text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ '--accent': meta.color }}
                          >
                            {m.admin}
                          </span>
                        )}
                        <div className="flex flex-col" style={{ maxWidth: '75%' }}>
                          <div
                            className={`ta-bubble ${mine ? 'ta-bubble-mine' : 'ta-bubble-theirs'} ta-sans text-sm leading-relaxed rounded-xl px-3 py-2`}
                            style={{ '--accent': meta.color }}
                          >
                            {m.text}
                          </div>
                          <span className={`ta-hint ta-mono text-xs mt-1 ${mine ? 'text-right' : 'text-left'}`}>
                            {formatTime(m.ts)}
                          </span>
                        </div>
                        {mine && (
                          <span
                            className="ta-avatar ta-mono text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ '--accent': meta.color }}
                          >
                            {m.admin}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
            <div className="max-w-2xl mx-auto w-full">
              {error && <p className="ta-error ta-sans text-xs mb-2">{error}</p>}
              <div className="ta-inputwrap flex items-end gap-2 rounded-2xl px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${ADMIN_META[otherAdminId].label}...`}
                  rows={1}
                  className="ta-textarea ta-sans flex-1 text-sm resize-none outline-none py-1.5 max-h-40"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="ta-send flex-shrink-0 rounded-full p-2"
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
