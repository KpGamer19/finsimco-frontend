import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://finsimco-backend.onrender.com');

export default function AdminPanel() {
  const [currentStage, setCurrentStage] = useState('Intro');
  const [isRunning, setIsRunning] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeView, setActiveView] = useState('Controls');
  const [monitoringData, setMonitoringData] = useState({});
  const [timeLeft, setTimeLeft] = useState(5400); 

  const stages = ['Intro', 'Preparation', 'Negotiation', 'Reflection'];

  useEffect(() => {
    socket.on('sync_global_state', (state) => {
      setCurrentStage(state.stage);
      setIsRunning(state.isRunning);
    });

    socket.on('sync_monitoring_data', (data) => {
      setMonitoringData(data);
    });

    socket.on('timer_update', (seconds) => {
      setTimeLeft(seconds);
    });

    return () => {
      socket.off('sync_global_state');
      socket.off('sync_monitoring_data');
      socket.off('timer_update');
    };
  }, []);

  const handlePlay = () => socket.emit('admin_update_state', { isRunning: true });
  const handlePause = () => socket.emit('admin_update_state', { isRunning: false });
  const handleStop = () => socket.emit('admin_update_state', { isRunning: false, stage: 'Intro' });
  const changeStage = (stage) => socket.emit('admin_update_state', { stage: stage });

  const sendAlert = () => {
    if (alertMessage.trim() === '') return;
    socket.emit('admin_send_alert', { message: alertMessage });
    setAlertMessage('');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addFiveMinutes = () => socket.emit('admin_set_time', timeLeft + 300);
  const resetTime = () => socket.emit('admin_set_time', 5400); 

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - XIMB Navy & Gold */}
        <div className="flex justify-between items-center mb-10 bg-slate-900 p-6 rounded-xl shadow-lg border-b-4 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-sm flex items-center justify-center font-bold text-slate-900 text-xl">X</div>
            <h1 className="text-2xl font-bold text-white tracking-wide">FIN<span className="text-amber-500">SIM</span> ADMIN</h1>
          </div>
          
          <div className="flex items-center space-x-4 bg-slate-800 p-2 rounded-lg border border-slate-700 shadow-inner">
            <div className="text-xl font-mono text-amber-400 font-bold px-4">{formatTime(timeLeft)}</div>
            <button onClick={addFiveMinutes} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm text-slate-200 transition-colors shadow-sm">+5 Min</button>
            <button onClick={resetTime} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm text-slate-200 transition-colors shadow-sm">Reset</button>
          </div>

          <div className="flex space-x-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button onClick={() => setActiveView('Controls')} className={`px-6 py-2 rounded font-bold transition-all ${activeView === 'Controls' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>Control Center</button>
            <button onClick={() => setActiveView('Monitoring')} className={`px-6 py-2 rounded font-bold transition-all ${activeView === 'Monitoring' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>Live Monitoring</button>
          </div>
        </div>

        {activeView === 'Controls' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-lg mb-6 font-bold text-slate-400 uppercase tracking-widest">Simulation Timeline</h2>
              <div className="flex items-center space-x-6 mb-10">
                <button onClick={handlePlay} className="text-emerald-600 hover:text-emerald-500 transition-colors"><svg className="w-12 h-12 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg></button>
                <button onClick={handlePause} className="text-amber-500 hover:text-amber-400 transition-colors"><svg className="w-12 h-12 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                <button onClick={handleStop} className="text-rose-600 hover:text-rose-500 transition-colors"><svg className="w-12 h-12 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg></button>
                <div className="text-lg font-mono bg-slate-50 border border-slate-200 px-6 py-3 rounded-lg shadow-inner">
                  Status: <span className={isRunning ? "text-emerald-600 font-bold" : "text-slate-500 font-bold"}>{isRunning ? "PLAYING" : "PAUSED"}</span>
                </div>
              </div>
              
              <div className="flex justify-between relative mt-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 transform -translate-y-1/2 rounded-full"></div>
                {stages.map((stage) => (
                  <div key={stage} onClick={() => changeStage(stage)} className={`cursor-pointer px-8 py-3 rounded-full text-sm font-bold transition-all border-2 ${currentStage === stage ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-700'}`}>{stage}</div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-xl shadow-xl border-t-4 border-amber-500">
              <h2 className="text-lg mb-4 font-bold text-slate-400 uppercase tracking-widest">Push Breaking News / Alerts</h2>
              <div className="flex space-x-4">
                <input type="text" placeholder="e.g., Central Bank just raised interest rates by 0.5%!" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-amber-500 transition-colors shadow-inner" value={alertMessage} onChange={(e) => setAlertMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendAlert()} />
                <button onClick={sendAlert} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-10 py-4 rounded-lg font-bold transition-all shadow-md">Broadcast</button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'Monitoring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(monitoringData).length === 0 ? (
              <div className="col-span-full text-center text-slate-500 py-16 text-xl font-medium bg-white rounded-xl border border-slate-200 border-dashed">No active connections detected.</div>
            ) : (
              Object.entries(monitoringData).map(([groupName, data]) => (
                <div key={groupName} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
                  <div className="bg-slate-900 px-5 py-4 font-bold text-white flex justify-between items-center border-b-2 border-amber-500">
                    {groupName}
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    {['loanAmount', 'interestRate', 'maturity', 'amortization'].map((field) => (
                      <div key={field} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-sm font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="flex items-center space-x-4">
                          <span className="font-mono text-slate-800 font-bold">{data.terms[field] || '-'}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border-2 ${data.approvals[field] ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'bg-transparent border-slate-300'}`}></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}