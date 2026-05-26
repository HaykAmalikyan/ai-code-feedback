import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut } from 'lucide-react';
import NameEntry from './components/NameEntry';
import MainScreen from './components/MainScreen';
import { API_BASE_URL } from './config';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('codeFeedbackUser');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  });

  // Verify hasRated status on initial load if user exists
  useEffect(() => {
    if (user) {
      axios.post(`${API_BASE_URL}/login`, {
        firstName: user.firstName,
        lastName: user.lastName
      }).then(res => {
        if (res.data.hasRated !== user.hasRated) {
          const updatedUser = { ...user, hasRated: res.data.hasRated };
          setUser(updatedUser);
          localStorage.setItem('codeFeedbackUser', JSON.stringify(updatedUser));
        }
      }).catch(err => console.error("Error fetching user data:", err));
    }
  }, []);

  const handleStart = async (firstName, lastName) => {
    const newUser = { firstName, lastName, hasRated: false };
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { firstName, lastName });
      newUser.hasRated = res.data.hasRated;
    } catch (err) {
      console.error("Error logging in:", err);
    }
    setUser(newUser);
    localStorage.setItem('codeFeedbackUser', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('codeFeedbackUser');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
            CodeFeedback
          </h1>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-medium">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
                {user.firstName} {user.lastName}
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 text-xs"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!user ? (
          <NameEntry onStart={handleStart} />
        ) : (
          <MainScreen user={user} setUser={setUser} />
        )}
      </main>
    </div>
  );
}

export default App;
