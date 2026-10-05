import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';

window.addEventListener('error', (event) => {
  console.error('[PhysioVision Error]:', event.error || event.message);
  displayErrorOverlay((event.error?.stack || event.message || 'Unknown window error'));
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[PhysioVision Unhandled Rejection]:', event.reason);
  displayErrorOverlay(String(event.reason?.stack || event.reason || 'Unhandled Promise Rejection'));
});

function displayErrorOverlay(msg: string) {
  let errBox = document.getElementById('debug-error-box');
  if (!errBox) {
    errBox = document.createElement('div');
    errBox.id = 'debug-error-box';
    errBox.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;max-height:350px;overflow:auto;background:#fff1f2;border:2px solid #e11d48;color:#881337;padding:16px;border-radius:16px;z-index:99999;font-family:monospace;font-size:12px;white-space:pre-wrap;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);';
    document.body.appendChild(errBox);
  }
  errBox.innerHTML = `<strong>⚠️ PhysioVision Runtime Error Detected:</strong><br/><br/>${msg}<br/><br/><button onclick="this.parentElement.remove()" style="padding:6px 12px;background:#e11d48;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">ปิด (Dismiss)</button>`;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RootErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
    displayErrorOverlay(String(error.stack || error.message) + '\n\nComponent Stack:\n' + errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border-2 border-rose-200 p-8 space-y-5">
            <div className="flex items-center gap-3 text-rose-600 font-extrabold text-xl">
              <span className="text-3xl">⚠️</span>
              เกิดข้อผิดพลาดในการโหลดหน้าเว็บ (Render Error)
            </div>
            <p className="text-sm text-slate-600">
              พบปัญหาการทำงานของ JavaScript ในขณะแสดงผลหน้าเว็บ รายละเอียดข้อผิดพลาด:
            </p>
            <pre className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-900 text-xs overflow-auto max-h-60 whitespace-pre-wrap font-mono">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition"
            >
              รีเฟรชหน้าเว็บ (Reload Page)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Target container #root not found in document');
}
