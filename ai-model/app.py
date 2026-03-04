from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
from datetime import datetime

# ── Optimisation 8: suppress repr noise, avoid implicit casting overhead ──────
np.set_printoptions(suppress=True)

app = Flask(__name__)
CORS(app)

# ── Optimisation 1: models loaded ONCE at startup ────────────────────────────
repair_model   = joblib.load('models/repair_model.pkl')
cost_min_model = joblib.load('models/cost_min_model.pkl')
cost_max_model = joblib.load('models/cost_max_model.pkl')
label_encoder  = joblib.load('models/label_encoder.pkl')

with open('models/repair_classes.json') as f:
    repair_classes = json.load(f)

with open('models/options.json') as f:
    options = json.load(f)

# ── Optimisation 4: column lists defined once at global scope ─────────────────
CAT_COLS = ['vehicle_type', 'make', 'model', 'fuel_type', 'transmission', 'severity_level']
NUM_COLS = ['year', 'vehicle_age_years', 'mileage', 'engine_size_cc', 'symptom_count']
TEXT_COL = 'symptoms'
ALL_COLS = CAT_COLS + NUM_COLS + [TEXT_COL]

COST_CATS = ['vehicle_type', 'severity_level', 'probable_cause']
COST_NUMS = ['year', 'vehicle_age_years', 'mileage', 'engine_size_cc', 'symptom_count']
COST_COLS = COST_CATS + COST_NUMS

# ── Optimisation 6: compute current year once at startup ──────────────────────
CURRENT_YEAR = datetime.now().year

# ── Optimisation 9: warm-up – prevent first-call latency spike ───────────────
def _warmup():
    """Run a silent dummy prediction so the sklearn pipelines are JIT-compiled."""
    try:
        dummy_row = {
            'vehicle_type': 'car', 'make': 'Toyota', 'model': 'Corolla',
            'fuel_type': 'gasoline', 'transmission': 'automatic',
            'severity_level': 'moderate', 'year': CURRENT_YEAR,
            'vehicle_age_years': 3, 'mileage': 50000,
            'engine_size_cc': 1600, 'symptom_count': 2,
            'symptoms': 'noise,vibration', 'probable_cause': 'engine',
        }
        repair_df = pd.DataFrame.from_records([{col: dummy_row[col] for col in ALL_COLS}])
        cost_df   = pd.DataFrame.from_records([{col: dummy_row[col] for col in COST_COLS}])
        repair_model.predict_proba(repair_df)
        cost_min_model.predict(cost_df)
        cost_max_model.predict(cost_df)
    except Exception:
        pass  # warmup failure must never crash the app

_warmup()


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Auto Repair AI is running'})


@app.route('/options', methods=['GET'])
def get_options():
    return jsonify(options)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        body = request.json

        # ── Optimisation 6: use pre-computed CURRENT_YEAR ─────────────────────
        body['vehicle_age_years'] = CURRENT_YEAR - int(body.get('year', 2015))
        body['symptom_count']     = len(body.get('symptoms', '').split(','))

        # ── Optimisation 5: from_records is slightly faster than DataFrame([…]) ─
        repair_df = pd.DataFrame.from_records([{col: body[col] for col in ALL_COLS}])
        cost_df   = pd.DataFrame.from_records([{col: body[col] for col in COST_COLS}])

        # Repair prediction
        proba = repair_model.predict_proba(repair_df)[0]

        # ── Optimisation 7: argpartition is O(n) vs O(n log n) for argsort ────
        top3_idx = np.argpartition(-proba, 3)[:3]
        top3_idx = top3_idx[np.argsort(-proba[top3_idx])]

        # Cost prediction
        cost_min = round(float(cost_min_model.predict(cost_df)[0]))
        cost_max = round(float(cost_max_model.predict(cost_df)[0]))

        if cost_max < cost_min:
            cost_max = int(cost_min * 1.5)

        predictions = []
        for idx in top3_idx:
            predictions.append({
                'repair':             label_encoder.inverse_transform([idx])[0],
                'confidence_percent': round(float(proba[idx]) * 100, 1),
                'cost_min_mad':       cost_min,
                'cost_max_mad':       cost_max,
            })

        return jsonify({'success': True, 'predictions': predictions})

    except KeyError as e:
        return jsonify({'success': False, 'error': f'Missing field: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Entry point  (dev only – use waitress/gunicorn in production)
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('Auto Repair AI running on http://localhost:5000')
    # ── Optimisation 2: debug=False removes reloader & extra overhead ─────────
    app.run(debug=False, port=5000)