import sys
import json
import pandas as pd
import joblib
import warnings

# Suppress sklearn warnings to keep the JSON output clean
warnings.filterwarnings("ignore")

try:
    # 1. Read the JSON payload sent by Node.js via standard input
    input_data = sys.stdin.read()
    donors = json.loads(input_data)

    if not donors:
        print(json.dumps([]))
        sys.exit(0)

    # 2. Convert the JSON array into a Pandas DataFrame
    df = pd.DataFrame(donors)
    user_ids = df['user_id'] # Save the IDs to attach to the final scores

    # Handle the 'donated_earlier' feature dynamically if Node didn't send it
    if 'donated_earlier' not in df.columns:
        df['donated_earlier'] = df['donations_till_date'].apply(lambda x: 1 if x > 0 else 0)

    # 3. Order the columns EXACTLY how the Random Forest model was trained
    expected_columns = [
        'last_contacted_date', 'donations_till_date', 'total_calls',
        'frequency_in_days', 'donated_earlier', 'calls_to_donations_ratio', 'distance_km'
    ]
    
    # Drop user_id and grab only the features the model needs
    X = df[expected_columns]

    # 4. Load the exported model and predict
    # Make sure this path matches where you put the .joblib file!
    model = joblib.load('blood_donor_rf_model.joblib')
    predictions = model.predict(X)

    # 5. Format the final output back into JSON
    results = []
    for i, user_id in enumerate(user_ids):
        results.append({
            "user_id": user_id,
            "match_score": round(predictions[i] * 100, 2) # Scale to 0-100 percentage
        })

    # Sort the array so the highest scores are at the top
    results = sorted(results, key=lambda x: x['match_score'], reverse=True)

    # Print the JSON string so Node.js can read it
    print(json.dumps(results))

except Exception as e:
    # If anything breaks, return the error as JSON so Node doesn't crash
    print(json.dumps({"error": str(e)}))
    sys.exit(1)