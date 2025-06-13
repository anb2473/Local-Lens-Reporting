# This Python script demonstrates a text analysis tool using PyTorch and the Hugging Face Transformers library.
# It analyzes the "validity" of a text block by performing sentiment analysis, classifying it as positive, negative, or neutral.

# --- Installation Instructions ---
# Make sure you have Python installed. Then, install the necessary libraries using pip:
# pip install torch transformers

# --- Import Libraries ---
from transformers import pipeline
import torch

# --- Function to Analyze Text Validity (Sentiment) ---
def analyze_text_validity_sentiment(text_block: str):
    """
    Analyzes the "validity" of a text block by determining its sentiment.
    A strong positive or negative sentiment indicates a clear, "valid" stance.

    Args:
        text_block (str): The input text to be analyzed.

    Returns:
        dict: A dictionary containing the predicted sentiment label and score.
              Example: {'label': 'POSITIVE', 'score': 0.999}
    """
    if not text_block.strip():
        return {'label': 'NEUTRAL', 'score': 1.0, 'message': 'Input text is empty or just whitespace.'}

    print(f"\nAnalyzing text: '{text_block}'")

    try:
        # Load a pre-trained sentiment analysis model using the pipeline API.
        # 'sentiment-analysis' automatically picks a suitable model (e.g., DistilBERT finetuned on SST-2).
        # We specify device='cpu' to ensure it runs even without a GPU.
        # For GPU: device=0 (for the first GPU) or 'cuda'.
        sentiment_analyzer = pipeline("sentiment-analysis", device='cpu')

        # Perform sentiment prediction
        # The pipeline returns a list of dictionaries, usually with one dictionary for the input text.
        result = sentiment_analyzer(text_block)

        # Extract the relevant information (label and score)
        sentiment_label = result[0]['label']
        sentiment_score = result[0]['score']

        print(f"Sentiment: {sentiment_label} (Score: {sentiment_score:.4f})")

        return {'label': sentiment_label, 'score': sentiment_score}

    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return {'label': 'ERROR', 'score': 0.0, 'message': str(e)}

# --- Examples of Usage ---
if __name__ == "__main__":
    # Example 1: Positive sentiment
    text1 = "This product is absolutely fantastic! I love all its features."
    analysis1 = analyze_text_validity_sentiment(text1)
    print(f"Result for text 1: {analysis1}")

    # Example 2: Negative sentiment
    text2 = "I am extremely disappointed with the service; it was terrible and slow."
    analysis2 = analyze_text_validity_sentiment(text2)
    print(f"Result for text 2: {analysis2}")

    # Example 3: Neutral/Ambiguous sentiment
    text3 = "The meeting is scheduled for tomorrow at 10 AM. Please bring your notes."
    analysis3 = analyze_text_validity_sentiment(text3)
    print(f"Result for text 3: {analysis3}")

    # Example 4: Mixed or subtle sentiment
    text4 = "It's okay, I guess. Not great, not terrible."
    analysis4 = analyze_text_validity_sentiment(text4)
    print(f"Result for text 4: {analysis4}")

    # Example 5: Empty text
    text5 = "   "
    analysis5 = analyze_text_validity_sentiment(text5)
    print(f"Result for text 5: {analysis5}")

    # Example 6: More complex text
    text6 = "While the initial setup was a bit tricky, the performance has been outstanding, exceeding my expectations."
    analysis6 = analyze_text_validity_sentiment(text6)
    print(f"Result for text 6: {analysis6}")

    print("\n--- Interpretation of 'Validity' ---")
    print("In this context, 'validity' is interpreted as the clarity and strength of the sentiment expressed.")
    print("- High scores (e.g., > 0.9) for POSITIVE or NEGATIVE labels indicate a 'valid' and clear emotional stance.")
    print("- A 'NEUTRAL' label or lower scores for POSITIVE/NEGATIVE might indicate less clear sentiment.")
