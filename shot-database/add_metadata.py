import json
import random

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

def update_json_timestamps(file_path):
    """
    Loads a JSON file, updates the 'timestamp' field for each object
    in the array with a randomly generated timestamp, and saves it.
    """
    try:
        # 1. Load the data from the JSON file
        with open(file_path, 'r') as f:
            data = json.load(f)

    except FileNotFoundError:
        print(f"Error: File not found at path '{file_path}'")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from file '{file_path}'. Ensure it's valid JSON.")
        return
    except Exception as e:
        print(f"An unexpected error occurred during loading: {e}")
        return

    # Check if the loaded data is an array (list)
    if not isinstance(data, list):
        print("Error: The JSON file content is not an array of objects.")
        return

    # 2. Iterate through the array and update the timestamp
    print(f"Processing {len(data)} objects...")
    for item in data:
        # Check if the item is an object (dictionary)
        if isinstance(item, dict):
            new_timestamp = generate_random_timestamp()
            item['timestamp'] = new_timestamp
        else:
            print(f"Warning: Skipping non-object element: {item}")


    # 3. Write the updated data back to the JSON file
    try:
        # Using 'w' to overwrite the existing file
        with open(file_path, 'w') as f:
            # Use indent=4 for a human-readable, pretty-printed JSON output
            json.dump(data, f, indent=4)

        print(f"\nSuccessfully updated timestamps and saved to '{file_path}'.")
    except Exception as e:
        print(f"An error occurred during saving: {e}")


# To run the script, run `python3 add_metadata.py` in your terminal
if __name__ == "__main__":
    JSON_FILE_PATH = 'metadata.json'
    random.seed(160)
    update_json_timestamps(JSON_FILE_PATH)
