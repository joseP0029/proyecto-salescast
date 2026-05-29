import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from sqlalchemy import func

from database import get_db
import json
import models, schemas
from routes.auth import get_current_user
from ml_service import train_lightgbm_model, generate_predictions

router = APIRouter()

UPLOAD_DIR = "uploads"
MODELS_DIR = "models_storage"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
    file_path = os.path.join(UPLOAD_DIR, f"org_{current_user.organization_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    dataset = models.Dataset(
        organization_id=current_user.organization_id,
        filename=file.filename,
        file_path=file_path
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return dataset

@router.post("/train/{dataset_id}", response_model=schemas.ModelResponse)
def train_model(
    dataset_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.organization_id == current_user.organization_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    model_path = os.path.join(MODELS_DIR, f"model_org_{current_user.organization_id}_ds_{dataset_id}.pkl")
    
    try:
        model_data = train_lightgbm_model(dataset.file_path, model_path)
        feature_importances_json = json.dumps(model_data.get('feature_importances', {}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")
        
    ml_model = models.MLModel(
        dataset_id=dataset.id,
        organization_id=current_user.organization_id,
        model_path=model_path,
        feature_importances=feature_importances_json
    )
    db.add(ml_model)
    db.commit()
    db.refresh(ml_model)
    
    return ml_model

@router.post("/predict", response_model=List[schemas.PredictionResponse])
def predict(
    req: schemas.PredictionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ml_model = db.query(models.MLModel).filter(
        models.MLModel.id == req.model_id,
        models.MLModel.organization_id == current_user.organization_id
    ).first()
    
    if not ml_model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    try:
        preds = generate_predictions(ml_model.model_path, req.days_to_predict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")
        
    # Save predictions to DB
    db_predictions = []
    run_timestamp = datetime.now(timezone.utc)
    for p in preds:
        db_pred = models.Prediction(
            model_id=ml_model.id,
            target_date=p['target_date'],
            predicted_value=p['predicted_value'],
            store_nbr=p['store_nbr'],
            family=p['family'],
            created_at=run_timestamp
        )
        db.add(db_pred)
        db_predictions.append(db_pred)
        
    db.commit()
    
    return preds

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    datasets = db.query(models.Dataset).filter(models.Dataset.organization_id == current_user.organization_id).all()
    models_list = db.query(models.MLModel).filter(models.MLModel.organization_id == current_user.organization_id).all()
    
    return {
        "datasets": datasets,
        "models": models_list
    }

@router.get("/runs", response_model=List[schemas.PredictionRunResponse])
def get_prediction_runs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene el historial agrupado de predicciones (las 'sesiones' o 'lotes')"""
    # Join with MLModel to filter by organization
    runs = db.query(
        models.Prediction.model_id,
        models.Prediction.created_at,
        func.count(models.Prediction.id).label('prediction_count')
    ).join(models.MLModel).filter(
        models.MLModel.organization_id == current_user.organization_id
    ).group_by(
        models.Prediction.model_id,
        models.Prediction.created_at
    ).order_by(models.Prediction.created_at.desc()).all()
    
    return [
        {"model_id": r.model_id, "created_at": r.created_at, "prediction_count": r.prediction_count}
        for r in runs
    ]

@router.get("/runs/{model_id}/{created_at}")
def get_prediction_run_details(
    model_id: int,
    created_at: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene los detalles y los insights de un lote específico de predicciones"""
    ml_model = db.query(models.MLModel).filter(
        models.MLModel.id == model_id,
        models.MLModel.organization_id == current_user.organization_id
    ).first()
    
    if not ml_model:
        raise HTTPException(status_code=404, detail="Model not found or unauthorized")
        
    preds = db.query(models.Prediction).filter(
        models.Prediction.model_id == model_id,
        models.Prediction.created_at == created_at
    ).all()
    
    # Parse feature importances
    feature_importances = {}
    if ml_model.feature_importances:
        try:
            feature_importances = json.loads(ml_model.feature_importances)
        except:
            pass
            
    # Compute dynamic insights
    total_projected = sum(p.predicted_value for p in preds)
    
    # Aggregate sales by date to find peak day and trend
    sales_by_date = {}
    for p in preds:
        date_str = p.target_date.strftime("%Y-%m-%d")
        sales_by_date[date_str] = sales_by_date.get(date_str, 0) + p.predicted_value
        
    peak_day = None
    if sales_by_date:
        peak_day = max(sales_by_date.items(), key=lambda x: x[1])[0]
        
    # Simple trend calculation (comparing first half vs second half)
    trend = "stable"
    if len(sales_by_date) > 1:
        dates = sorted(list(sales_by_date.keys()))
        mid = len(dates) // 2
        first_half = sum(sales_by_date[d] for d in dates[:mid])
        second_half = sum(sales_by_date[d] for d in dates[mid:])
        if second_half > first_half * 1.05:
            trend = "upward"
        elif second_half < first_half * 0.95:
            trend = "downward"
    
    insights = {
        "feature_importances": feature_importances,
        "total_projected": total_projected,
        "peak_day": peak_day,
        "trend": trend
    }
    
    return {
        "predictions": [schemas.PredictionResponse.model_validate(p) for p in preds],
        "insights": insights
    }

@router.delete("/runs/{model_id}/{created_at}", status_code=204)
def delete_prediction_run(
    model_id: int,
    created_at: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Elimina un lote específico de predicciones"""
    ml_model = db.query(models.MLModel).filter(
        models.MLModel.id == model_id,
        models.MLModel.organization_id == current_user.organization_id
    ).first()
    
    if not ml_model:
        raise HTTPException(status_code=404, detail="Model not found or unauthorized")
        
    db.query(models.Prediction).filter(
        models.Prediction.model_id == model_id,
        models.Prediction.created_at == created_at
    ).delete(synchronize_session=False)
    db.commit()
    
    return None
