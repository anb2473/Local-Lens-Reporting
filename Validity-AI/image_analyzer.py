# This Python script provides an Image Content Plausibility Scorer using PyTorch and
# the Hugging Face Transformers library.
# It works by first generating a text description (caption) of an image
# and then analyzing the plausibility of that caption using a zero-shot classification model.

# --- Installation Instructions ---
# Make sure you have Python installed. Then, install the necessary libraries using pip:
# pip install torch transformers Pillow

# --- Import Libraries ---
from transformers import pipeline, AutoProcessor, AutoModelForCausalLM
import torch
from typing import List, Dict, Any
import base64
from io import BytesIO
from PIL import Image

# --- Global Models Initialization ---
# Initialize the image captioning model
try:
    # A common and capable image captioning model.
    # Explicitly load processor and model for better control over preprocessing
    processor_captioner = AutoProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    model_captioner = AutoModelForCausalLM.from_pretrained("Salesforce/blip-image-captioning-base")
    # If using GPU: model_captioner.to('cuda')
    captioner = pipeline("image-to-text", model=model_captioner, processor=processor_captioner, device='cpu')
    print("Image Captioning model loaded successfully.")
except Exception as e:
    print(f"Error loading image captioning model: {e}")
    captioner = None
    processor_captioner = None # ensure both are None if one fails

# Initialize the text plausibility analyzer (same as in the previous tool)
try:
    # Using 'facebook/bart-large-mnli' for zero-shot text classification.
    plausibility_analyzer = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device='cpu')
    print("Text Plausibility analysis model loaded successfully.")
except Exception as e:
    print(f"Error loading text plausibility analysis model: {e}")
    plausibility_analyzer = None

# --- Function to Analyze Image Content Plausibility ---
def analyze_image_plausibility(image_base64_string: str) -> Dict[str, Any]:
    """
    Analyzes the plausibility of the content depicted in an image.
    It first generates a text caption for the image and then assesses the caption's plausibility.

    Args:
        image_base64_string (str): The image data encoded as a base64 string (e.g., from a PNG or JPEG).

    Returns:
        Dict[str, Any]: A dictionary containing the generated caption, its plausibility scores,
                        and the primary predicted label.
              Example: {
                  'caption': 'A man riding a bicycle',
                  'plausible_score': 0.95,
                  'implausible_score': 0.05,
                  'predicted_label': 'plausible content'
              }
              Returns an error message if models fail to load or input is invalid.
    """
    if captioner is None or plausibility_analyzer is None:
        return {'error': 'One or more analysis models failed to load. Cannot perform analysis.'}

    if not image_base64_string.strip():
        return {'plausible_score': 0.0, 'implausible_score': 0.0, 'predicted_label': 'empty input', 'message': 'Input image data is empty.'}

    print("\nStarting image plausibility analysis...")

    try:
        # 1. Decode Base64 string to image
        # Remove common data URI prefixes if present
        if ',' in image_base64_string and 'base64,' in image_base64_string:
            _, image_data = image_base64_string.split('base64,', 1)
        else:
            image_data = image_base64_string

        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))

        # IMPORTANT: Convert image to RGB to ensure compatibility with models expecting 3 channels.
        # Some images (like transparent PNGs or grayscale) might have different modes (RGBA, L)
        # which can cause issues with models expecting a consistent RGB input.
        if image.mode != "RGB":
            image = image.convert("RGB")
        print(f"Image mode after conversion: {image.mode}, size: {image.size}")


        # 2. Generate caption for the image
        print("Generating image caption...")
        # The pipeline automatically handles preprocessing when processor is provided
        caption_result = captioner(image)
        # The captioner typically returns a list of dictionaries, extract the generated_text
        generated_caption = caption_result[0]['generated_text'] if caption_result else "No caption generated."
        print(f"Generated Caption: '{generated_caption}'")

        # 3. Analyze the plausibility of the generated caption
        print("Analyzing plausibility of the caption...")
        # Simplified labels for direct truthfulness/plausibility assessment.
        candidate_labels = ["true", "false"]
        text_plausibility_result = plausibility_analyzer(generated_caption, candidate_labels, multi_label=False,
                                                          hypothesis_template="This statement is {}.")

        plausible_score = 0.0
        implausible_score = 0.0

        for i in range(len(text_plausibility_result['labels'])):
            if text_plausibility_result['labels'][i] == "true":
                plausible_score = text_plausibility_result['scores'][i]
            elif text_plausibility_result['labels'][i] == "false":
                implausible_score = text_plausibility_result['scores'][i]

        predicted_label_raw = text_plausibility_result['labels'][0]
        predicted_label = 'plausible content' if predicted_label_raw == "true" else 'implausible content'

        print(f"Plausible Score: {plausible_score:.4f}")
        print(f"Implausible Score: {implausible_score:.4f}")
        print(f"Primary Predicted Label: '{predicted_label}'")

        return {
            'caption': generated_caption,
            'plausible_score': plausible_score,
            'implausible_score': implausible_score,
            'predicted_label': predicted_label
        }

    except Exception as e:
        print(f"An error occurred during image analysis: {e}")
        return {'error': f"An error occurred during analysis: {str(e)}"}

# --- Example of Usage ---
if __name__ == "__main__":
    if captioner and plausibility_analyzer: # Only run examples if both models loaded successfully
        # IMPORTANT: Replace this with an actual Base64 encoded image string.
        # A 1x1 white PNG:
        example_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwAB/2+BqAAAAAASUVORK5CYII="


        print("\n--- Example 1: Placeholder Image (should now result in a generic caption without error) ---")
        analysis1 = analyze_image_plausibility(example_image_base64)
        print(f"Analysis for placeholder image: {analysis1}")

        # To get more meaningful results, you would replace `example_image_base64`
        # with actual base64 data of images like:
        # - A photograph of a cat playing with a ball (should be plausible)
        # - An AI-generated image of a flying purple elephant (should be implausible caption)
        # - A real photo of a street scene
        # - A photo with obvious manipulation

        # How to get a base64 string from an image file:
        # import base64
        # with open("path/to/your/image.jpg", "rb") as image_file:
        #     encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        # print(encoded_string) # Use this output as the input for analyze_image_plausibility

    else:
        print("\nOne or both models could not be loaded. Please check your internet connection,")
        print("Hugging Face access, and library installations. You might need to manually")
        print("download the models or check proxy settings if you are behind one.")

    print("\n--- Interpretation of Image Content Plausibility Scores ---")
    print("This tool first generates a text caption for the image. The 'plausible_score'")
    print("and 'implausible_score' then reflect how likely the *generated caption* is to be")
    print("a sensible or expected claim, based on the model's general knowledge.")
    print("- A higher 'plausible_score' (closer to 1) suggests the image content is commonly seen or believable.")
    print("- A higher 'implausible_score' (closer to 1) suggests the image content is unusual or unlikely.")
    print("\n**Important Note:** This is an assessment of the *plausibility of the image's description*,")
    print("not a direct detection of image manipulation, deepfakes, or factual truth.")
    print("For instance, a highly realistic deepfake of a normal event might get a high 'plausible_score'.")
