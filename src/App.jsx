import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import TermSheet from './components/TermSheet';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The main page is now the Login screen */}
        <Route path="/" element={<Login />} />
        
        {/* The workspace is where the Term Sheet lives */}
        <Route path="/workspace" element={<TermSheet />} />
        
        {/* The Admin Panel remains on its secure route */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;