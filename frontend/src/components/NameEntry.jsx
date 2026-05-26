import { useState } from 'react';
import { ArrowRight, User } from 'lucide-react';

export default function NameEntry({ onStart }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.');
      return;
    }
    onStart(firstName.trim(), lastName.trim());
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-dark-800 p-8 rounded-2xl shadow-xl border border-dark-700 w-full max-w-md">
        <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-brand-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to CodeFeedback</h2>
        <p className="text-gray-400 text-center mb-8">
          Your personal AI programming tutor. Let's start with your name.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="e.g. Jane"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="e.g. Doe"
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors group"
          >
            Start Learning
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
