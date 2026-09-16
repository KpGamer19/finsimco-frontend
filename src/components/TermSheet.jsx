import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';

const socket = io('https://finsimco-backend.onrender.com');

export default function TermSheet() {
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!location.state) {
    navigate('/');
    return null;
  }

  const { group, role } = location.state;

  const [terms, setTerms] = useState({ loanAmount: '', interestRate: '', maturity: '', amortization: '' });
  const [approvals, setApprovals] = useState({ loanAmount: false, interestRate: false, maturity: false, amortization: false });
  const [currentStage, setCurrentStage] = useState('Intro');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('Case Study');
  const [timeLeft, setTimeLeft] = useState(5400); 
  
  const [alerts, setAlerts] = useState([
    { id: 1, text: "System initialized. Waiting for negotiation phase to begin...", time: new Date().toLocaleTimeString() }
  ]);

  useEffect(() => {
    socket.emit('join_room', group);

    socket.on('sync_global_state', (state) => {
      setCurrentStage(state.stage);
      setIsRunning(state.isRunning);
    });

    socket.on('timer_update', (seconds) => {
      setTimeLeft(seconds);
    });

    socket.on('receive_alert', (alertData) => {
      setAlerts((prev) => [{ id: Date.now(), text: alertData.message, time: new Date().toLocaleTimeString() }, ...prev]);
      setActiveTab('Alerts');
    });

    socket.on('receive_term_update', (data) => setTerms((prev) => ({ ...prev, [data.field]: data.value })));
    socket.on('receive_approval_update', (data) => setApprovals((prev) => ({ ...prev, [data.field]: data.value })));

    return () => {
      socket.off('sync_global_state');
      socket.off('timer_update');
      socket.off('receive_alert');
      socket.off('receive_term_update');
      socket.off('receive_approval_update');
    };
  }, [group]);

  const handleInputChange = (field, value) => {
    if (!isRunning || role === 'Borrower') return; 
    setTerms((prev) => ({ ...prev, [field]: value }));
    socket.emit('send_term_update', { room: group, field: field, value: value });
  };

  const toggleApproval = (field) => {
    if (!isRunning || role === 'Lender') return; 
    const newValue = !approvals[field];
    setApprovals((prev) => ({ ...prev, [field]: newValue }));
    socket.emit('send_approval_update', { room: group, field: field, value: newValue });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const generateFeedback = () => {
    const feedback = [];
    const amount = Number(terms.loanAmount.replace(/,/g, ''));
    if (amount >= 400000000 && amount <= 600000000) {
      feedback.push({ success: true, text: `Optimal Loan Amount (€${amount.toLocaleString()}). Properly balances capital structure.` });
    } else {
      feedback.push({ success: false, text: `Suboptimal Loan Amount (€${amount.toLocaleString() || 0}). Industry standard for the target is €400M - €600M.` });
    }

    const rate = Number(terms.interestRate);
    if (rate >= 4.5 && rate <= 5.5) {
      feedback.push({ success: true, text: `Competitive Interest Rate (${rate}%). Fair for both lender and borrower risk profiles.` });
    } else {
      feedback.push({ success: false, text: `Aggressive Interest Rate (${rate || 0}%). Standard market rate is between 4.5% and 5.5%.` });
    }

    const years = Number(terms.maturity);
    if (years >= 3.5 && years <= 4.5) {
      feedback.push({ success: true, text: `Standard Maturity (${years} Years). Aligns well with typical SaaS refinancing timelines.` });
    } else {
      feedback.push({ success: false, text: `High-Risk Maturity (${years || 0} Years). Should ideally be structured between 3.5 to 4.5 years.` });
    }
    return feedback;
  };

  if (currentStage === 'Reflection') {
    const reportCard = generateFeedback();
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-sans">
        <div className="w-16 h-16 bg-amber-500 rounded-md flex items-center justify-center font-bold text-slate-900 text-4xl mb-6">X</div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wide uppercase">Simulation Complete</h1>
        <p className="text-amber-400 text-xl mb-10 font-mono">Final Performance Review: {group}</p>
        
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border-t-8 border-amber-500">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-slate-100 pb-4 uppercase tracking-wider text-sm">Automated Assessment</h2>
          <div className="space-y-4">
            {reportCard.map((item, index) => (
              <div key={index} className={`p-5 rounded-lg border-l-4 shadow-sm ${item.success ? 'bg-emerald-50 border-emerald-500 text-slate-800' : 'bg-rose-50 border-rose-500 text-slate-800'}`}>
                <div className="flex items-start space-x-4">
                  <span className={`text-xl font-bold ${item.success ? 'text-emerald-600' : 'text-rose-600'}`}>{item.success ? '✓' : '✕'}</span>
                  <span className="font-medium leading-relaxed">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const TermRow = ({ label, field, placeholder }) => {
    const inputDisabled = !isRunning || role === 'Borrower';
    const buttonDisabled = !isRunning || role === 'Lender';
    
    let buttonClass = 'px-8 py-3 rounded-lg font-bold transition-all duration-200 shadow-sm ';
    if (!isRunning) {
      buttonClass += 'bg-slate-200 text-slate-400 cursor-not-allowed';
    } else {
      buttonClass += approvals[field] ? 'bg-amber-500 text-slate-900 shadow-md transform scale-[1.02] ' : 'bg-slate-100 text-slate-500 border border-slate-200 ';
      buttonClass += buttonDisabled ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-200 hover:text-slate-800';
    }
    
    return (
      <div className="flex items-center justify-between bg-white p-5 mb-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-1/3 text-slate-800 font-bold text-lg">{label}</div>
        <div className="w-1/3 px-4">
          <input 
            type="text" 
            disabled={inputDisabled} 
            className={`w-full border-2 rounded-lg p-3 text-lg focus:outline-none focus:border-amber-500 transition-colors ${inputDisabled ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900 font-medium shadow-inner'}`} 
            placeholder={placeholder} 
            value={terms[field]} 
            onChange={(e) => handleInputChange(field, e.target.value)} 
          />
        </div>
        <div className="w-1/3 text-right">
          <button disabled={buttonDisabled} onClick={() => toggleApproval(field)} className={buttonClass}>{approvals[field] ? 'CONFIRMED' : 'TBD'}</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar - XIMB Theme */}
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b-4 border-amber-500 shadow-md z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amber-500 rounded-sm flex items-center justify-center font-bold text-slate-900 text-lg">X</div>
            <div className="text-xl font-bold tracking-wide">FIN<span className="text-amber-500">SIM</span></div>
          </div>
          <div className="bg-slate-800 px-4 py-1.5 rounded-md font-mono text-amber-400 font-bold border border-slate-700 shadow-inner">
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className={`px-5 py-1.5 text-sm font-bold rounded-full uppercase tracking-widest shadow-sm ${isRunning ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
          {isRunning ? `ACTIVE: ${currentStage}` : `PAUSED: ${currentStage}`}
        </div>
        
        <div className="bg-slate-800 px-5 py-1.5 rounded-md font-bold text-sm border border-slate-700 text-slate-300 flex items-center space-x-2">
          <span className="text-amber-500">{group}</span>
          <span className="text-slate-500">|</span>
          <span>{role.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-1/4 bg-white border-r border-slate-200 flex flex-col shadow-lg z-0">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button onClick={() => setActiveTab('Case Study')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'Case Study' ? 'bg-white text-slate-900 border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-100'}`}>Briefing</button>
            <button onClick={() => setActiveTab('Alerts')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'Alerts' ? 'bg-white text-slate-900 border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-100'}`}>Alerts</button>
          </div>
          <div className="p-8 overflow-y-auto">
            {activeTab === 'Case Study' ? (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-5 uppercase tracking-wider flex items-center"><span className="w-2 h-6 bg-amber-500 mr-3 rounded-sm"></span> Target Profile</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">The target SaaS company is aiming to refinance part of its capital structure to support upcoming international expansion.</p>
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-slate-900">
                  <p className="text-sm text-slate-900 font-bold uppercase tracking-wider mb-2">Objective:</p>
                  <p className="text-sm text-slate-700 leading-relaxed">Negotiate a favorable debt facility. Review standard industry benchmarks closely before locking your final terms.</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-5 uppercase tracking-wider flex items-center"><span className="w-2 h-6 bg-amber-500 mr-3 rounded-sm"></span> System Alerts</h3>
                <div className="flex flex-col space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-slate-900 hover:shadow-md transition-shadow">
                      <div className="text-xs text-slate-400 mb-2 font-mono font-semibold">{alert.time}</div>
                      <div className="text-sm text-slate-800 font-medium leading-relaxed">{alert.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Workspace */}
        <div className="w-3/4 p-12 overflow-y-auto bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Debt Facility Term Sheet</h2>
              <p className="text-slate-500 font-medium">Establish mutually agreeable parameters for the proposed capital injection.</p>
            </div>
            
            <div className="space-y-2">
              <TermRow label="Loan Amount (€)" field="loanAmount" placeholder="e.g., 400000000" />
              <TermRow label="Interest Rate (%)" field="interestRate" placeholder="e.g., 4.5" />
              <TermRow label="Maturity (Years)" field="maturity" placeholder="e.g., 5" />
              <TermRow label="Amortization" field="amortization" placeholder="e.g., Bullet" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}