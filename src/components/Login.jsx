import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [group, setGroup] = useState('Group1');
  const [role, setRole] = useState('Lender');
  const navigate = useNavigate();

  const handleJoin = () => {
    // We send the student to the workspace and pass their choices along in the background
    navigate('/workspace', { state: { group, role } });
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-xl w-96">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join Simulation</h1>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Select Group</label>
          <select 
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={group} 
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="Group1">Group 1</option>
            <option value="Group2">Group 2</option>
            <option value="Group3">Group 3</option>
          </select>
        </div>

        <div className="mb-8">
          <label className="block text-gray-700 font-semibold mb-2">Select Role</label>
          <select 
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Lender">Lender</option>
            <option value="Borrower">Borrower</option>
          </select>
        </div>

        <button 
          onClick={handleJoin}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 transition-colors"
        >
          Enter Workspace
        </button>
      </div>
    </div>
  );
}