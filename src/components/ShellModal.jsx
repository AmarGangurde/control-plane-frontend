import { useEffect, useRef, useCallback } from 'react';
import { X, SquareTerminal, Wifi, WifiOff, Loader } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

/**
 * ShellModal — xterm.js terminal connected to a pod shell via Socket.IO.
 *
 * Props:
 *   socket   — the connected socket.io Socket instance
 *   appId    — app UUID
 *   appName  — display name
 *   container — container name ('app' | 'proxy-sidecar')
 *   onClose  — callback to close the modal
 */
export default function ShellModal({ socket, appId, appName, container = 'app', onClose }) {
  const termRef   = useRef(null);  // DOM div
  const xtermRef  = useRef(null);  // Terminal instance
  const fitRef    = useRef(null);  // FitAddon instance
  const statusRef = useRef('connecting'); // 'connecting' | 'ready' | 'error' | 'exited'

  const setStatus = (s) => {
    statusRef.current = s;
    // Update the tiny status dot in the header
    const dot = document.getElementById(`shell-status-dot-${appId}`);
    const txt = document.getElementById(`shell-status-txt-${appId}`);
    if (!dot || !txt) return;
    const map = {
      connecting: ['bg-amber-400 animate-pulse', 'Connecting…'],
      ready:      ['bg-emerald-400 animate-pulse', 'Connected'],
      error:      ['bg-red-400', 'Error'],
      exited:     ['bg-slate-500', 'Exited'],
    };
    const [cls, label] = map[s] || map.exited;
    dot.className = `h-2 w-2 rounded-full ${cls}`;
    txt.textContent = label;
  };

  const handleResize = useCallback(() => {
    try {
      fitRef.current?.fit();
      const { cols, rows } = xtermRef.current;
      socket.emit('shell:resize', { appId, cols, rows });
    } catch (_) {}
  }, [socket, appId]);

  useEffect(() => {
    // ── Init xterm ────────────────────────────────────────────────────────────
    const xterm = new Terminal({
      theme: {
        background: '#020617',
        foreground: '#e2e8f0',
        cursor:     '#60a5fa',
        selectionBackground: 'rgba(96,165,250,0.3)',
        black:   '#1e293b', red:     '#f87171', green:  '#4ade80', yellow: '#facc15',
        blue:    '#60a5fa', magenta: '#a78bfa', cyan:   '#34d399', white:  '#e2e8f0',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(termRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitRef.current   = fitAddon;

    // ── Socket events ─────────────────────────────────────────────────────────
    const onReady = ({ appId: id }) => {
      if (id !== appId) return;
      setStatus('ready');
      xterm.write('\r\n\x1b[1;32m✓ Connected to pod shell\x1b[0m\r\n\r\n');
      xterm.focus();
    };

    const onOutput = ({ appId: id, data }) => {
      if (id !== appId) return;
      xterm.write(data);
    };

    const onError = ({ appId: id, message }) => {
      if (id !== appId) return;
      setStatus('error');
      xterm.write(`\r\n\x1b[1;31m✗ Error: ${message}\x1b[0m\r\n`);
    };

    const onExit = ({ appId: id }) => {
      if (id !== appId) return;
      setStatus('exited');
      xterm.write('\r\n\x1b[1;33m[Session ended]\x1b[0m\r\n');
    };

    socket.on('shell:ready',  onReady);
    socket.on('shell:output', onOutput);
    socket.on('shell:error',  onError);
    socket.on('shell:exit',   onExit);

    // ── Send input → socket ───────────────────────────────────────────────────
    const inputDispose = xterm.onData((data) => {
      socket.emit('shell:input', { appId, data });
    });

    // ── Ensure socket is connected ────────────────────────────────────────────
    const wasConnected = socket.connected;
    if (!wasConnected) socket.connect();

    // ── Start the shell session ───────────────────────────────────────────────
    // Wait a tick for socket to connect if it wasn't already
    const startShell = () => socket.emit('shell:start', { appId, container });
    if (socket.connected) {
      startShell();
    } else {
      socket.once('connect', startShell);
    }

    // ── Resize observer ───────────────────────────────────────────────────────
    const ro = new ResizeObserver(handleResize);
    if (termRef.current) ro.observe(termRef.current);

    return () => {
      // Cleanup
      socket.off('shell:ready',  onReady);
      socket.off('shell:output', onOutput);
      socket.off('shell:error',  onError);
      socket.off('shell:exit',   onExit);
      socket.off('connect', startShell); // remove pending connect listener if modal closed early
      inputDispose.dispose();
      ro.disconnect();
      socket.emit('shell:stop', { appId });
      xterm.dispose();
    };
  }, [socket, appId, container, handleResize]);

  const containerLabel = container === 'proxy-sidecar' ? '⇄ proxy-sidecar' : 'app';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-[#020617] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/20 p-2 rounded-lg text-emerald-400">
              <SquareTerminal size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Pod Shell</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {appName} <span className="text-emerald-500/60 font-mono">· {containerLabel}</span>
              </p>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 ml-3 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
              <span id={`shell-status-dot-${appId}`} className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span id={`shell-status-txt-${appId}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connecting…</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Terminal */}
        <div
          ref={termRef}
          className="flex-1 overflow-hidden"
          style={{ padding: '8px' }}
        />
      </div>
    </div>
  );
}
