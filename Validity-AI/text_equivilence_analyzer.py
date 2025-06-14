# This Python script provides a Text Meaning Similarity Checker using PyTorch and
# the Hugging Face Transformers library.
# It assesses how semantically similar two text blocks are.

# --- Installation Instructions ---
# Make sure you have Python installed. Then, install the necessary libraries using pip:
# pip install torch transformers

# --- Import Libraries ---
from transformers import pipeline
import torch
from typing import Dict, Any

# --- Global Model Initialization ---
# Initialize the semantic similarity checker
try:
    # Using 'facebook/bart-large-mnli' for zero-shot text classification.
    # This model is well-suited for Natural Language Inference (NLI) tasks,
    # which can be adapted for semantic similarity.
    similarity_analyzer = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device='cpu')
    print("Text Similarity analysis model loaded successfully.")
except Exception as e:
    print(f"Error loading text similarity analysis model: {e}")
    similarity_analyzer = None

# --- Function to Check Semantic Similarity of Two Text Blocks ---
def check_text_meaning_similarity(text1: str, text2: str) -> Dict[str, Any]:
    """
    Checks if two text blocks have the same meaning (semantic similarity).

    Args:
        text1 (str): The first text block.
        text2 (str): The second text block.

    Returns:
        Dict[str, Any]: A dictionary containing the similarity scores and the primary predicted label.
              Example: {
                  'text1': 'The cat sat on the mat.',
                  'text2': 'A feline was on the rug.',
                  'same_meaning_score': 0.92,
                  'different_meaning_score': 0.08,
                  'predicted_label': 'same meaning'
              }
              Returns an error message if the model fails to load or inputs are invalid.
    """
    if similarity_analyzer is None:
        return {'error': 'Text analysis model failed to load. Cannot perform similarity analysis.'}

    if not text1.strip() or not text2.strip():
        return {
            'same_meaning_score': 0.0,
            'different_meaning_score': 0.0,
            'predicted_label': 'invalid input',
            'message': 'Both text inputs must not be empty.'
        }

    print(f"\nChecking similarity between '{text1}' and '{text2}'...")

    # Concatenate texts for the model to evaluate their combined meaning against the labels.
    # The hypothesis template helps frame the comparison.
    # The model will internally try to infer if 'text2' entails or contradicts 'text1' given the hypothesis.
    candidate_labels = ["same meaning", "different meaning"]

    try:
        result = similarity_analyzer(
            text1, # Use text1 as the main sequence
            candidate_labels,
            multi_label=False,
            # Frame the hypothesis using text2. The model tries to see if text1 implies/contradicts
            # the hypothesis formed by text2 and the label.
            hypothesis_template=f"This means the same as: {text2}. It is {{}}."
        )

        same_meaning_score = 0.0
        different_meaning_score = 0.0

        # Extract scores based on the labels
        for i in range(len(result['labels'])):
            if result['labels'][i] == "same meaning":
                same_meaning_score = result['scores'][i]
            elif result['labels'][i] == "different meaning":
                different_meaning_score = result['scores'][i]

        predicted_label = result['labels'][0]

        print(f"Same Meaning Score: {same_meaning_score:.4f}")
        print(f"Different Meaning Score: {different_meaning_score:.4f}")
        print(f"Primary Predicted Label: '{predicted_label}'")

        return {
            'text1': text1,
            'text2': text2,
            'same_meaning_score': same_meaning_score,
            'different_meaning_score': different_meaning_score,
            'predicted_label': predicted_label
        }

    except Exception as e:
        print(f"An error occurred during text similarity analysis: {e}")
        return {'text1': text1, 'text2': text2, 'error': f"An error occurred: {str(e)}"}


# --- Examples of Usage ---
if __name__ == "__main__":
    if similarity_analyzer: # Only run examples if the model loaded successfully
        # Example 1: Similar meaning
        text_sim1_a = "The quick brown fox jumps over the lazy dog."
        text_sim1_b = "A speedy brown fox leaps over a lethargic canine."
        similarity_analysis1 = check_text_meaning_similarity(text_sim1_a, text_sim1_b)
        print(f"Similarity Analysis 1: {similarity_analysis1}")

        # Example 2: Different meaning
        text_sim2_a = "The capital of France is Paris."
        text_sim2_b = "Mount Everest is the highest mountain in the world."
        similarity_analysis2 = check_text_meaning_similarity(text_sim2_a, text_sim2_b)
        print(f"Similarity Analysis 2: {similarity_analysis2}")

        # Example 3: Subtle difference
        text_sim3_a = "He bought a new car."
        text_sim3_b = "He acquired a new vehicle."
        similarity_analysis3 = check_text_meaning_similarity(text_sim3_a, text_sim3_b)
        print(f"Similarity Analysis 3: {similarity_analysis3}")

        # Example 4: Contradictory meaning
        text_sim4_a = "The sun rises in the east."
        text_sim4_b = "The sun sets in the east."
        similarity_analysis4 = check_text_meaning_similarity(text_sim4_a, text_sim4_b)
        print(f"Similarity Analysis 4: {similarity_analysis4}")

        # Example 5: Shorter, simple texts
        text_sim5_a = "Hello there."
        text_sim5_b = "Hi."
        similarity_analysis5 = check_text_meaning_similarity(text_sim5_a, text_sim5_b)
        print(f"Similarity Analysis 5: {similarity_analysis5}")

        # Example 6: Very different concepts
        text_sim6_a = "Quantum physics is fascinating."
        text_sim6_b = "Cooking is an art."
        similarity_analysis6 = check_text_meaning_similarity(text_sim6_a, text_sim6_b)
        print(f"Similarity Analysis 6: {similarity_analysis6}")

    else:
        print("\nModel could not be loaded. Please check your internet connection and library installations.")
        print("You might need to manually download the model or check proxy settings if you are behind one.")

    print("\n--- Interpretation of Text Meaning Similarity Scores ---")
    print("The 'same_meaning_score' indicates the model's confidence that the two provided texts convey the same semantic meaning.")
    print("- A higher 'same_meaning_score' (closer to 1) suggests strong semantic equivalence.")
    print("- A higher 'different_meaning_score' (closer to 1) suggests distinct semantic meanings.")
    print("These two scores will sum close to 1, as the model is choosing between these two labels.")
