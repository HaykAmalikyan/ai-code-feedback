import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

client = InferenceClient(
    provider="auto",
    api_key=HF_API_TOKEN,
)

def build_system_prompt(language: str) -> str:
    return f"""
You are a friendly and encouraging {language} programming tutor for absolute beginners.
Your goal is to evaluate the provided {language} code and give detailed, helpful feedback.

SCORING RULES (be strict and consistent):
- 9-10: Completely correct, clean, readable. No errors at all.
- 7-8: Works correctly but has minor style issues only. No bugs.
- 5-6: Has logic errors OR bad practices but syntax is ok.
- 3-4: Has syntax errors OR multiple problems.
- 1-2: Completely broken, unreadable, or doesn't work at all.

IMPORTANT: If the code runs correctly without any bugs, the minimum score is 8.
If the code has zero syntax errors and zero logic errors, score it 9 or 10.

IMPORTANT RULES:
1. NEVER give the user the corrected code.
2. Explain errors in simple, encouraging language a beginner can understand.
3. Always explain WHY something is wrong, not just that it is wrong.
4. Give hints using the Socratic method to guide the user toward the solution.
5. Feedback must be at least 3-4 sentences long and detailed.
6. Tips must be at least 2-3 concrete suggestions with explanation of why they matter.
7. Be encouraging — remind the beginner that making mistakes is part of learning.
8. Output MUST be ONLY valid JSON with three keys:
   - "feedback": a detailed string with your explanation and hints (minimum 3-4 sentences).
   - "tips": a detailed string with concrete code quality improvements and why they matter (minimum 2-3 tips).
   - "score": an integer from 1 to 10 based on the scoring rules above.
Do not include any extra text outside the JSON.
"""

async def get_feedback(code: str, language: str = "Python", errors: list[str] = None) -> dict:
    if not HF_API_TOKEN:
        return {
            "feedback": f"HF_API_TOKEN is not set.",
            "tips": "Set up your Hugging Face token in the .env file.",
            "score": 5
        }

    system_prompt = build_system_prompt(language)
    generated_text = ""

    user_content = f"Evaluate this {language} code:\n\n```{language}\n{code}\n```"
    if errors:
        user_content += f"\n\nNote: The code editor detected the following syntax issues:\n" + "\n".join(f"- {e}" for e in errors)

    try:
        completion = client.chat.completions.create(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            max_tokens=1024,
            temperature=0.3,
        )

        generated_text = completion.choices[0].message.content
        clean_text = generated_text.strip()

        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]

        parsed_json = json.loads(clean_text.strip())
        return {
            "feedback": parsed_json.get("feedback", "No feedback provided."),
            "tips": parsed_json.get("tips", "No tips provided."),
            "score": int(parsed_json.get("score", 5))
        }

    except json.JSONDecodeError:
        print(f"JSON Parsing Error. Raw output: {generated_text}")
        return {
            "feedback": generated_text,
            "tips": "N/A",
            "score": 5
        }
    except Exception as e:
        print(f"Error calling HF API: {e}")
        return {
            "feedback": "An error occurred while contacting the AI service. Please try again later.",
            "tips": str(e),
            "score": 0
        }