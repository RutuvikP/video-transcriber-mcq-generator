from gpt4all import GPT4All
import re
import json

model = None

def parse_mcq_output(response_text):
    try:
        # Use regex to find all question blocks
        pattern = re.compile(
            r"Question:\s*(.*?)\n.*?A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*?)\n.*?Answer:\s*([A-D])",
            re.DOTALL
        )
        matches = pattern.findall(response_text)

        mcqs = []
        for match in matches:
            question, a, b, c, d, answer = match
            mcqs.append({
                "question": question.strip(),
                "options": [a.strip(), b.strip(), c.strip(), d.strip()],
                "answer": answer.strip()
            })

        return json.dumps(mcqs)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse response: {str(e)}"})

def load_model():
    global model
    if model is None:
        model = GPT4All("orca-mini-3b-gguf2-q4_0.gguf")  # Will auto-download into ~/.cache

def generate_mcqs_from_text(text: str) -> list:
    load_model()
    
    prompt = f"""
    From the following passage, generate 2 multiple choice questions.
    Each question must have 4 options (A, B, C, D) and the correct answer.
    Return the response in below format:
    [
     {{
      "question": "Your question here",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
     }},
     {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "B"
     }}
    ]

    Passage:
    {text}
    """

    response = model.generate(prompt, max_tokens=512, temp=0.7)

    # Step 1: Try to parse as JSON directly
    try:
        json_data = json.loads(response)
        if isinstance(json_data, list):
           return json_data
    except Exception:
        pass

    # Step 2: If it’s a stringified JSON list like the Postman example
    try:
       inner_json = json.loads(response.strip())
       if isinstance(inner_json, str):
         return json.loads(inner_json)
    except Exception:
      pass

    # Step 3: Fallback to regex parsing
    try:
       parsed_json = json.loads(parse_mcq_output(response))  # parse_mcq_output still returns string
       return parsed_json
    except Exception as e:
       print("Final fallback failed:", e)
       return [{"error": "Unable to parse output"}]
