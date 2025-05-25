from gpt4all import GPT4All
import re
import json

model = None

def parse_mcq_output(response_text):
    try:
        pattern = re.compile(
            r"(\d+)\.\s*(.*?)\s*\(A\)\s*(.*?)\s*\(B\)\s*(.*?)\s*\(C\)\s*(.*?)\s*\(D\)\s*(.*?)\s*(True or False)?",
            re.DOTALL
        )
        matches = pattern.findall(response_text)

        mcqs = []
        for match in matches:
            question_number, question, a, b, c, d, true_or_false = match
            if true_or_false:  # If the question is True/False
                mcqs.append({
                    "question": question.strip(),
                    "options": [a.strip(), b.strip(), c.strip(), d.strip()],
                    "answer": true_or_false.strip()
                })
            else:
                mcqs.append({
                    "question": question.strip(),
                    "options": [a.strip(), b.strip(), c.strip(), d.strip()],
                    "answer": "A"  # Assuming the correct answer is always A if not specified
                })

        return json.dumps(mcqs)
    except Exception as e:
        print(f"Error in parse_mcq_output: {e}")
        return json.dumps({"error": f"Failed to parse response: {str(e)}"})

def load_model():
    global model
    if model is None:
        model = GPT4All("orca-mini-3b-gguf2-q4_0.gguf")

def generate_mcqs_from_text(text: str) -> list:
    load_model()
    
    prompt = f"""
    From the following passage, generate 2 multiple choice questions.
    Each question must have 4 options (A, B, C, D) and the correct answer.
    Return the response in below format:
    Multiple Choice Questions:
    1. Which country has the most official languages recognized by their government? (A) Zimbabwe; B) Switzerland; C) Bolivia; D) Mexico
    2. Neil, you've been finding out about some of the benefits of being a polyglot. True or False?

    Passage:
    {text}
    """

    # Step 1: Try to get the model's response
    response = model.generate(prompt, max_tokens=512, temp=0.7)
    # Step 2: Try to parse the response as JSON directly
    try:
        json_data = json.loads(response)
        if isinstance(json_data, list):
            return json_data
    except Exception:
        pass

    # Step 3: If it’s a stringified JSON list, try to parse again
    try:
        inner_json = json.loads(response.strip())
        if isinstance(inner_json, str):
            return json.loads(inner_json)
    except Exception:
        pass

    # Step 4: Fallback to regex parsing
    try:
        parsed_json = json.loads(parse_mcq_output(response))
        return parsed_json
    except Exception as e:
        print("Final fallback failed:", e)
        return [{"error": "Unable to parse output"}]
