import json
import random
from dotenv import load_dotenv
from google import genai
from PIL import Image

def read_json(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)

    # Check if the loaded data is an array (list)
    if not isinstance(data, list):
        raise RuntimeError("The JSON file content is not an array of objects.")

    return data

def generate_random_timestamp():
    """
    Generates a random timestamp in the format "HH:MM:SS"
    where:
    - HH (Hours) is between 0 and 2 (inclusive).
    - MM (Minutes) is between 0 and 59 (inclusive).
    - SS (Seconds) is between 0 and 59 (inclusive).
    """
    # Generate random values
    hours = random.randint(0, 2)
    minutes = random.randint(0, 59)
    seconds = random.randint(0, 59)

    # Format the numbers as two-digit strings with leading zeros
    return f"{hours:02}:{minutes:02}:{seconds:02}"

def update_json_timestamps(data: list[dict]):
    """
    Takes in a parsed JSON file containing an array of shots,
    and updates the 'timestamp' field for each object
    in the array with a randomly generated timestamp, and saves it.
    """
    # Iterate through the array and update the timestamp
    print(f"Updating timestamps for {len(data)} shots...")
    for item in data:
        # Check if the item is an object (dictionary)
        if isinstance(item, dict):
            new_timestamp = generate_random_timestamp()
            item['timestamp'] = new_timestamp
        else:
            print(f"Warning: Skipping non-object element: {item}")
    print("Successfully updated timestamps")

def generate_image_description(movie_title: str, year: int, image_path: str, prompt_text: str, model_name: str = 'gemini-2.5-flash'):
    """
    Takes in a text prompt, loads an image, and returns the response to a multimodal
    request to the Gemini API.
    """
    print(f"Generating image description for {movie_title} ({year}) at {image_path} with {model_name}")
    # Initialize the client (SDK automatically uses GEMINI_API_KEY env var set in .env)
    client = genai.Client()

    # Load the image using PIL (Pillow)
    # For small images, passing the PIL Image object directly is easiest.
    img = Image.open(image_path)

    # Construct the multimodal prompt and call the API
    # The 'contents' argument accepts a list of text strings and image objects
    response = client.models.generate_content(
        model=model_name,
        contents=[
            prompt_text, # Text part
            img          # Image part (PIL Image object)
        ]
    )

    return response.text

def update_image_descriptions(data: list[dict], prompt_file_path: str, model_name: str = 'gemini-2.5-flash'):
    for shot in data:
        movie_title = shot['movie_title']
        year = shot['year']
        # Read the prompt text from the .txt file and replace variables
        with open(prompt_file_path, 'r', encoding='utf-8') as f:
            prompt_text = f.read().format(movie_title=movie_title, year=year)
        image_path = f"images/{shot['id']}.jpg"
        shot["description"] = generate_image_description(movie_title, year, image_path, prompt_text, model_name)
    print("Successfully updated image descriptions")

# To run the script, run `python3 add_metadata.py` in your terminal
if __name__ == "__main__":
    JSON_FILE_PATH = 'metadata.json'
    PROMPT_FILE_PATH = 'image_description_prompt.txt'
    random.seed(160)
    load_dotenv()

    data = read_json(JSON_FILE_PATH)

    update_json_timestamps(data)
    update_image_descriptions(data, PROMPT_FILE_PATH)

    # Write the updated data back to the JSON file
    with open(JSON_FILE_PATH, 'w') as f:
        # Use indent=4 for a human-readable, pretty-printed JSON output
        json.dump(data, f, indent=4)

    print(f"Successfully wrote updated metadata to {JSON_FILE_PATH}")
