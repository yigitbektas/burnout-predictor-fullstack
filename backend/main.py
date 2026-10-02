import pickle
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# React Native'in API'ye erişebilmesi için CORS izinleri
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("burnout_model.pkl", "rb" ) as f:
    artifacts = pickle.load(f)


model = artifacts["model"]
feature_names = artifacts["feature_names"]   

class BurnoutRequest(BaseModel):
    Age: float
    Gender: str
    Education_Level: str
    Employment_Status: str
    Monthly_Income_USD: float
    Work_Hours_Per_Week: int
    Remote_Work: str
    Job_Satisfaction: float
    Work_Life_Balance: float
    Sleep_Hours: float
    Sleep_Quality: str
    Stress_Level: str
    Anxiety_Score: float
    Depression_Score: float
    Mood_Score: float
    Emotional_Stability: int
    Physical_Activity_Hours: float
    Exercise_Frequency: str  
    Meditation_Minutes: float
    Screen_Time_Hours: float
    Social_Media_Hours: float
    Gaming_Hours: float
    Coffee_Cups_Per_Day: int
    Alcohol_Consumption: str  
    Smoking: str  
    Healthy_Diet: str  
    Chronic_Stress: str  
    Family_History_Mental_Illness: str 
    Therapy_Attendance: str 
    Support_System: str  
    Life_Satisfaction: float
    Productivity_Score: float
    Absenteeism_Days: int

@app.post("/predict")
def predict_burnout(data: BurnoutRequest):
    try:
        raw_data = data.model_dump()

        edu_map = {
            "High School": 0,
            "Diploma": 1,
            "Bachelor": 2,
            "Master": 3,
            "PhD": 4,
        }
        quality_map = {"Poor": 0, "Average": 1, "Good": 2, "Excellent": 3}
        stress_map = {"Low": 0, "Moderate": 1, "High": 2}
        exercise_map = {"Never": 0, "Rarely": 1, "Weekly": 2, "Daily": 3}

        raw_data["Education_Level"] = edu_map.get(raw_data["Education_Level"], 0) #edu level varsa yaz yoksa 0 yaz.
        raw_data["Sleep_Quality"] = quality_map.get(raw_data["Sleep_Quality"], 0)
        raw_data["Support_System"] = quality_map.get(raw_data["Support_System"], 0)
        raw_data["Stress_Level"] = stress_map.get(raw_data["Stress_Level"], 0)
        raw_data["Exercise_Frequency"] = exercise_map.get(raw_data["Exercise_Frequency"], 0)

        binary_fields = [
            "Alcohol_Consumption",
            "Smoking",
            "Healthy_Diet",
            "Chronic_Stress",
            "Family_History_Mental_Illness",
            "Therapy_Attendance",
        ]

        for col in binary_fields:
            raw_data[col] = 1 if raw_data[col] == "Yes" else 0

        df_single = pd.DataFrame([raw_data])
        
        df_single = pd.get_dummies(
            df_single,
            columns=["Gender", "Remote_Work", "Employment_Status"],
            drop_first=True,
            dtype=int,
        )

        for col in feature_names:
            if col not in df_single.columns:
                df_single[col] = 0

        df_single = df_single[feature_names]

        pred_score = float(model.predict(df_single)[0])
        final_score = round(float(np.clip(pred_score, 0.0, 100.0)), 2)

        if final_score < 40:
            risk_level = "Low"
            risk_label = "Do not worry, your burnout risk is low."
            risk_color = "green"
        elif final_score < 70:
            risk_level = "Moderate"
            risk_label = "You have a moderate risk of burnout. Consider taking preventive measures."
            risk_color = "orange"
        else:
            risk_level = "High"
            risk_label = "You have a high risk of burnout. Please seek professional help."
            risk_color = "red"

        return {
            "burnout_score": final_score,
            "risk_level": risk_level,
            "risk_label": risk_label,
            "risk_color": risk_color,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})


        
    

