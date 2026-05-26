# AI Code Feedback

AI Code Feedback is a full-stack application that provides intelligent code evaluation and feedback using an AI model. Users can submit their code to receive automated reviews, helping them learn and improve their coding skills. 

The application consists of a React frontend built with Vite and Tailwind CSS, and a Python backend built with FastAPI, which integrates with a Hugging Face AI model for generating the feedback and Firebase for data storage.

## Local Setup Instructions

Follow these steps to get the project running on your local machine.

### Prerequisites
- Node.js
- Python 3
- Hugging Face API key and Firebase credentials (configured in `.env` and `firebase-credentials.json` in the `backend` folder)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HaykAmalikyan/ai-code-feedback.git
   cd ai-code-feedback
   ```

2. **Start the Backend:**
   Open a terminal and run the following commands:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Start the Frontend:**
   Open a second terminal and run the following commands:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Once both servers are running, the frontend will typically be accessible at `http://localhost:5173` and the backend at `http://localhost:8000`.