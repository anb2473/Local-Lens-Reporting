# This Python script provides a Claim Plausibility Scorer using PyTorch and the Hugging Face Transformers library.
# It attempts to assign a score from 0 to 1 indicating how plausible a given text claim is.

# --- Installation Instructions ---
# Make sure you have Python installed. Then, install the necessary libraries using pip:
# pip install torch transformers hf_xet
# **NOTE:** hf_xet is not required, but will increase efficiency
# **NOTE:** This system MUST be run as an administrator to properly work
# **NOTE:** You must have a stable internet connection in order to download the model
#           ( In the event in which the model throws a failed to download error, simply
#            retry and ensure you are connected to the internet )

# --- Import Libraries ---
from transformers import pipeline
import torch

# --- Global Plausibility Analyzer ---
# We initialize the pipeline once to avoid reloading the model for every analysis.
# 'zero-shot-classification' allows us to classify text into arbitrary labels
# without specific training for those labels.
# We specify device='cpu' to ensure it runs even without a GPU.
# For GPU: device=0 (for the first GPU) or 'cuda'.
try:
    # A larger model like 'facebook/bart-large-mnli' is generally good for zero-shot tasks
    # due to its training on Natural Language Inference, which helps with plausibility.
    plausibility_analyzer = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device='cpu')
    print("Plausibility analysis model loaded successfully.")
except Exception as e:
    print(f"Error loading plausibility analysis model: {e}")
    plausibility_analyzer = None # Set to None if loading fails

# --- Function to Analyze Claim Plausibility ---
def analyze_claim_plausibility(claim_text: str) -> dict:
    """
    Analyzes the plausibility of a given text claim and assigns a score from 0 to 1.
    A higher score indicates higher plausibility.

    Args:
        claim_text (str): The input text claim to be analyzed.

    Returns:
        dict: A dictionary containing the plausibility score and the primary label.
              Example: {'plausibility_score': 0.95, 'predicted_label': 'plausible claim'}
              Returns an error message if the model failed to load or input is invalid.
    """
    if plausibility_analyzer is None:
        return {'error': 'Plausibility analysis model failed to load. Cannot perform analysis.'}

    if not claim_text.strip():
        return {'plausibility_score': 0.0, 'predicted_label': 'empty claim', 'message': 'Input claim is empty or just whitespace.'}

    print(f"\nAnalyzing claim: '{claim_text}'")

    # Define the labels for classification.
    # The model will evaluate how well the claim aligns with these concepts.
    candidate_labels = ["plausible claim", "implausible claim"]

    try:
        # Perform zero-shot classification.
        # multi_label=False ensures that the scores sum to 1 and we get a single best label.
        result = plausibility_analyzer(claim_text, candidate_labels, multi_label=False)

        # The result typically contains 'labels' and 'scores' lists,
        # ordered by confidence. The first item is the most confident prediction.
        predicted_label = result['labels'][0]
        predicted_score = result['scores'][0]

        # We want the score for "plausible claim" as our validity score.
        # If the top predicted label is 'implausible claim', we need to return its
        # complement for the 'plausibility_score'.
        plausibility_score = predicted_score if predicted_label == "plausible claim" else (1 - predicted_score)

        print(f"Predicted Label: '{predicted_label}' (Confidence: {predicted_score:.4f})")
        print(f"Calculated Plausibility Score (0-1): {plausibility_score:.4f}")

        return {'plausibility_score': plausibility_score, 'predicted_label': predicted_label}

    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return {'error': f"An error occurred during analysis: {str(e)}"}

# --- Examples of Usage ---
if __name__ == "__main__":
    if plausibility_analyzer: # Only run examples if the model loaded successfully
        # Example 1: Obviously implausible claim
        claim1 = "I saw aliens riding unicorns in Area 51 yesterday."
        analysis1 = analyze_claim_plausibility(claim1)
        print(f"Analysis for claim 1: {analysis1}")

        # Example 2: Highly plausible claim based on common knowledge
        claim2 = "The Earth revolves around the Sun."
        analysis2 = analyze_claim_plausibility(claim2)
        print(f"Analysis for claim 2: {analysis2}")

        # Example 3: A claim that might be plausible but lacks specific evidence/context
        claim3 = "The mayor of the town has been secretly dumping sewage in Bob's house."
        analysis3 = analyze_claim_plausibility(claim3)
        print(f"Analysis for claim 3: {analysis3}")

        # Example 4: A more neutral or generally accepted statement
        claim4 = "Water boils at 100 degrees Celsius at standard atmospheric pressure."
        analysis4 = analyze_claim_plausibility(claim4)
        print(f"Analysis for claim 4: {analysis4}")

        # Example 5: A slightly ambiguous or less certain claim
        claim5 = "The global economy is expected to experience moderate growth next year."
        analysis5 = analyze_claim_plausibility(claim5)
        print(f"Analysis for claim 5: {analysis5}")

        # Example 6: Empty text
        claim6 = "   "
        analysis6 = analyze_claim_plausibility(claim6)
        print(f"Analysis for claim 6: {analysis6}")

        # Example 7: A very long paragraph with a claim
        claim7 = """
        Recent archaeological discoveries in the remote Amazon basin suggest that an ancient civilization,
        previously unknown to modern historians, built a complex network of underground cities.
        These cities, reportedly powered by a geothermal energy source and protected by advanced
        camouflage technology, remained hidden for millennia. Local indigenous legends
        have long spoken of such a place, but conclusive evidence was never found until now.
        Further expeditions are planned to verify these initial findings and explore the full extent
        of this incredible discovery, which could rewrite our understanding of pre-Columbian America.
        """
        analysis7 = analyze_claim_plausibility(claim7)
        print(f"Analysis for claim 7: {analysis7}")

    else:
        print("\nModel could not be loaded. Please check your internet connection and library installations.")
        print("You might need to manually download the model or check proxy settings if you are behind one.")

    print("\n--- Interpretation of 'Plausibility Score' ---")
    print("The 'plausibility_score' represents how likely the model considers the claim to be,")
    print("based on the patterns and general knowledge it learned during its training.")
    print("- A score closer to 1 (e.g., > 0.7-0.8) suggests the claim sounds plausible/sensible.")
    print("- A score closer to 0 (e.g., < 0.2-0.3) suggests the claim sounds implausible/unlikely.")
    print("It's important to understand this is a *model's inference of plausibility*, not a definitive fact-check.")
