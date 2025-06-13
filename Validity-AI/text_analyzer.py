# This Python script provides a Claim Plausibility Scorer using PyTorch and the Hugging Face Transformers library.
# It attempts to assign a score from 0 to 1 indicating how plausible a given text claim is.

# --- Installation Instructions ---
# Make sure you have Python installed. Then, install the necessary libraries using pip:
# pip install torch transformers

# --- Import Libraries ---
from transformers import pipeline
import torch
from typing import List, Dict

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
def analyze_claims_plausibility(claims: List[str]) -> List[Dict]:
    """
    Analyzes the plausibility of a list of text claims and assigns a score from 0 to 1 for each.
    A higher score indicates higher plausibility.

    Args:
        claims (List[str]): A list of input text claims to be analyzed.

    Returns:
        List[Dict]: A list of dictionaries, each containing the plausibility score for 'plausible claim',
                    the score for 'implausible claim', and the primary predicted label.
              Example: [
                  {'claim': 'I saw aliens in Area 51',
                   'plausible_score': 0.05,
                   'implausible_score': 0.95,
                   'predicted_label': 'implausible claim'},
                  {'claim': 'Water boils at 100 degrees Celsius',
                   'plausible_score': 0.98,
                   'implausible_score': 0.02,
                   'predicted_label': 'plausible claim'}
              ]
              Returns an error message if the model failed to load or input is invalid.
    """
    if plausibility_analyzer is None:
        return [{'error': 'Plausibility analysis model failed to load. Cannot perform analysis.'}]

    if not claims:
        return [] # Return empty list if no claims are provided

    results = []
    # Define the labels for classification.
    # Simplified labels to be more direct, enhancing model understanding for plausibility.
    candidate_labels = ["true", "false"]

    for claim_text in claims:
        if not claim_text.strip():
            results.append({
                'claim': claim_text,
                'plausible_score': 0.0,
                'implausible_score': 0.0,
                'predicted_label': 'empty claim',
                'message': 'Input claim is empty or just whitespace.'
            })
            continue

        print(f"\nAnalyzing claim: '{claim_text}'")

        try:
            # Perform zero-shot classification for each claim.
            # multi_label=False ensures that the scores sum to 1 and we get a single best label.
            # The hypothesis_template guides the model to evaluate the truthfulness of the statement.
            result = plausibility_analyzer(claim_text, candidate_labels, multi_label=False,
                                           hypothesis_template="This statement is {}.")

            # The result contains 'labels' and 'scores' lists, ordered by confidence.
            # We need to find the specific scores for 'true' and 'false'.
            plausible_score = 0.0
            implausible_score = 0.0

            # Iterate through the returned labels and scores to assign them correctly
            for i in range(len(result['labels'])):
                if result['labels'][i] == "true":
                    plausible_score = result['scores'][i]
                elif result['labels'][i] == "false":
                    implausible_score = result['scores'][i]

            # The overall predicted label is still the one with the highest confidence
            # We map 'true' to 'plausible claim' and 'false' to 'implausible claim'
            predicted_label_raw = result['labels'][0]
            predicted_label = 'plausible claim' if predicted_label_raw == "true" else 'implausible claim'


            print(f"Plausible Score: {plausible_score:.4f}")
            print(f"Implausible Score: {implausible_score:.4f}")
            print(f"Primary Predicted Label: '{predicted_label}'")

            results.append({
                'claim': claim_text,
                'plausible_score': plausible_score,
                'implausible_score': implausible_score,
                'predicted_label': predicted_label
            })

        except Exception as e:
            print(f"An error occurred during analysis for claim '{claim_text}': {e}")
            results.append({'claim': claim_text, 'error': f"An error occurred: {str(e)}"})

    return results

# --- Examples of Usage ---
if __name__ == "__main__":
    if plausibility_analyzer: # Only run examples if the model loaded successfully
        # Example list of claims to analyze
        claims_to_analyze = [
            "I saw aliens riding unicorns in Area 51 yesterday.",
            "The Earth revolves around the Sun.",
            "The mayor of the town has been secretly dumping sewage in Bob's house.",
            "Water boils at 100 degrees Celsius at standard atmospheric pressure.",
            "The global economy is expected to experience moderate growth next year.",
            "   ", # Empty text
            """
            Recent archaeological discoveries in the remote Amazon basin suggest that an ancient civilization,
            previously unknown to modern historians, built a complex network of underground cities.
            These cities, reportedly powered by a geothermal energy source and protected by advanced
            camouflage technology, remained hidden for millennia. Local indigenous legends
            have long spoken of such a place, but conclusive evidence was never found until now.
            Further expeditions are planned to verify these initial findings and explore the full extent
            of this incredible discovery, which could rewrite our understanding of pre-Columbian America.
            """
        ]

        all_analyses = analyze_claims_plausibility(claims_to_analyze)
        print("\n--- All Claims Analysis Results ---")
        for i, analysis in enumerate(all_analyses):
            print(f"Claim {i+1}: {analysis}")

    else:
        print("\nModel could not be loaded. Please check your internet connection and library installations.")
        print("You might need to manually download the model or check proxy settings if you are behind one.")

    print("\n--- Interpretation of Plausibility Scores ---")
    print("For each claim, you now receive two scores: 'plausible_score' and 'implausible_score'.")
    print("- 'plausible_score': Represents how likely the model considers the claim to be sensible or expected (i.e., 'true').")
    print("- 'implausible_score': Represents how unlikely the model considers the claim to be sensible or expected (i.e., 'false').")
    print("These two scores will sum close to 1, as the model is choosing between these two labels.")
    print("The 'predicted_label' indicates which of the two the model was most confident about.")
    print("Remember, this is a *model's inference of plausibility*, not a definitive fact-check.")
