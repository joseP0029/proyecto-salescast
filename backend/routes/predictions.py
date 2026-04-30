import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from database import get_db
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
        train_lightgbm_model(dataset.file_path, model_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")
        
    ml_model = models.MLModel(
        dataset_id=dataset.id,
        organization_id=current_user.organization_id,
        model_path=model_path
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
    for p in preds:
        db_pred = models.Prediction(
            model_id=ml_model.id,
            target_date=p['target_date'],
            predicted_value=p['predicted_value'],
            store_nbr=p['store_nbr'],
            family=p['family']
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
