import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const KNOWLEDGE_LEVELS = [
  "Casual",
  "Student",
  "Teacher",
  "Junior Developer",
  "Medior Developer",
  "Senior Developer",
  "Other"
];

export default function RatingModal({ user, setUser, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [knowledgeLevel, setKnowledgeLevel] = useState("");
  const [customKnowledgeLevel, setCustomKnowledgeLevel] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!knowledgeLevel) {
      setError("Please select your knowledge level.");
      return;
    }
    if (knowledgeLevel === "Other" && !customKnowledgeLevel.trim()) {
      setError("Please specify your background.");
      return;
    }
    const nonSpaceFeedback = feedback.replace(/\s/g, '');
    if (nonSpaceFeedback.length < 30) {
      setError("Please provide at least 30 characters of feedback (excluding spaces).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const finalKnowledgeLevel = knowledgeLevel === "Other" ? customKnowledgeLevel.trim() : knowledgeLevel;

    try {
      await axios.post(`${API_BASE_URL}/rate`, {
        firstName: user.firstName,
        lastName: user.lastName,
        appRating: rating,
        knowledgeLevel: finalKnowledgeLevel,
        feedback: feedback.trim()
      });

      const updatedUser = { ...user, hasRated: true };
      setUser(updatedUser);
      localStorage.setItem('codeFeedbackUser', JSON.stringify(updatedUser));

      setShowThankYou(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold">Rate the App</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting || showThankYou}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {showThankYou ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-gray-400">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-brand-500/10 border border-brand-500/20 text-brand-300 p-4 rounded-xl text-sm leading-relaxed">
                We would love to hear your feedback! This app was built as part of a bachelor thesis. Your rating helps us understand its impact — thank you for taking the time! 🙏
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  App Rating <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating) 
                            ? "fill-yellow-500 text-yellow-500" 
                            : "text-gray-600"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Knowledge Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Knowledge Level <span className="text-red-400">*</span>
                </label>
                <select
                  value={knowledgeLevel}
                  onChange={(e) => setKnowledgeLevel(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="" disabled>Select your level...</option>
                  {KNOWLEDGE_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {knowledgeLevel === "Other" && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Please describe your background <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customKnowledgeLevel}
                    onChange={(e) => setCustomKnowledgeLevel(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="e.g. Hobbyist for 10 years"
                  />
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Feedback <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="4"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors resize-y"
                  placeholder="What did you think of the app? What could be improved?"
                />
              </div>

              {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
