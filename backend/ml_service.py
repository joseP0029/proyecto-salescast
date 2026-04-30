import pandas as pd
import lightgbm as lgb
import joblib
import os
from datetime import timedelta
import numpy as np

def train_lightgbm_model(dataset_path: str, model_path: str):
    """
    Trains a LightGBM model on the given dataset and saves it to model_path.
    Expects columns: id, date, store_nbr, family, sales, onpromotion
    """
    df = pd.read_csv(dataset_path)
    
    # 1. Clean Data
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date', 'sales']) # Drop rows without date or sales
    
    # Fill NAs for other columns
    df['store_nbr'] = df['store_nbr'].fillna(-1).astype(int)
    df['family'] = df['family'].fillna('UNKNOWN').astype('category')
    df['onpromotion'] = df['onpromotion'].fillna(0).astype(int)
    
    # 2. Extract Temporal Features
    df['day'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['dayofweek'] = df['date'].dt.dayofweek
    
    # Sort by date
    df = df.sort_values(by='date')
    last_date = df['date'].max()
    
    # Unique combinations to forecast for
    unique_combinations = df[['store_nbr', 'family']].drop_duplicates()
    
    # 3. Prepare for training
    features = ['store_nbr', 'family', 'onpromotion', 'day', 'month', 'year', 'dayofweek']
    target = 'sales'
    
    X = df[features]
    y = df[target]
    
    # Train model
    # Use categorical feature explicitly if needed, but lightgbm handles pandas categories
    model = lgb.LGBMRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # 4. Save model and metadata
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    model_data = {
        'model': model,
        'unique_combinations': unique_combinations,
        'last_date': last_date,
        'features': features
    }
    joblib.dump(model_data, model_path)
    return model_data

def generate_predictions(model_path: str, days_to_predict: int):
    """
    Loads the trained model and predicts sales for the next N days for all store/family combinations.
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError("Model file not found")
        
    model_data = joblib.load(model_path)
    model = model_data['model']
    unique_combinations = model_data['unique_combinations']
    last_date = model_data['last_date']
    features = model_data['features']
    
    # Generate future dates
    future_dates = [last_date + timedelta(days=i) for i in range(1, days_to_predict + 1)]
    
    predictions_list = []
    
    for date in future_dates:
        # Create a dataframe for this date with all combinations
        pred_df = unique_combinations.copy()
        pred_df['date'] = date
        # Assume no promotion for future days for simplicity, or could try to infer
        pred_df['onpromotion'] = 0 
        
        pred_df['day'] = pred_df['date'].dt.day
        pred_df['month'] = pred_df['date'].dt.month
        pred_df['year'] = pred_df['date'].dt.year
        pred_df['dayofweek'] = pred_df['date'].dt.dayofweek
        
        X_pred = pred_df[features]
        
        preds = model.predict(X_pred)
        # Ensure no negative sales predictions
        preds = np.maximum(preds, 0)
        
        pred_df['predicted_sales'] = preds
        
        for _, row in pred_df.iterrows():
            predictions_list.append({
                'target_date': row['date'],
                'store_nbr': int(row['store_nbr']),
                'family': str(row['family']),
                'predicted_value': float(row['predicted_sales'])
            })
            
    return predictions_list
