from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv
import joblib
import numpy as np
import pandas as pd  

class GraphSAGE(torch.nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim, dropout):
        super(GraphSAGE, self).__init__()
        self.conv1 = SAGEConv(input_dim, hidden_dim)
        self.bn1 = torch.nn.BatchNorm1d(hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, hidden_dim)
        self.bn2 = torch.nn.BatchNorm1d(hidden_dim)
        self.conv3 = SAGEConv(hidden_dim, output_dim)
        self.dropout = dropout

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.conv3(x, edge_index)
        return x

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

device = torch.device("cpu")
scaler = joblib.load("scaler.pkl")
model = GraphSAGE(14, 256, 3, 0.4)
model.load_state_dict(torch.load("model_gnn.pth", map_location=device))
model.eval()

class UserInput(BaseModel):
    age: float; gender: int; alcohol: int; high_calorie_food: int
    vegetable_consumption: float; meal_per_day: float; calorie_monitoring: int
    smoking: int; water_intake: float; family_history: int
    physical_activity: float; screen_time: float; snacking: int; transport: int

@app.post("/predict")
async def predict(data: UserInput):
    try:
        # PERBAIKAN 1: Bungkus data ke dictionary dengan KEY/Nama Fitur yang jelas
        raw_dict = {
            "age": data.age,
            "gender": data.gender,
            "alcohol": data.alcohol,
            "high_calorie_food": data.high_calorie_food,
            "vegetable_consumption": data.vegetable_consumption,
            "meal_per_day": data.meal_per_day,
            "calorie_monitoring": data.calorie_monitoring,
            "smoking": data.smoking,
            "water_intake": data.water_intake,
            "family_history": data.family_history,
            "physical_activity": data.physical_activity,
            "screen_time": data.screen_time,
            "snacking": data.snacking,
            "transport": data.transport
        }
        
        # PERBAIKAN 2: Ubah ke DataFrame agar StandardScaler menerima Feature Names yang valid
        df_input = pd.DataFrame([raw_dict])
        feat_scaled = scaler.transform(df_input)
        
        x_nodes = []
        x_nodes.append(feat_scaled[0])
        for _ in range(4):
            noise = np.random.normal(0, 0.05, feat_scaled[0].shape)
            x_nodes.append(feat_scaled[0] + noise)
            
        x = torch.tensor(np.array(x_nodes), dtype=torch.float)
        
        edge_index = torch.tensor([[0, 0, 0, 0, 1, 2, 3, 4],
                                   [1, 2, 3, 4, 0, 0, 0, 0]], dtype=torch.long)

        with torch.no_grad():
            output = model(x, edge_index)
            logits = output[0]
            probs = F.softmax(logits, dim=0)
            
            p_rendah = probs[0].item()
            p_sedang = probs[1].item()
            p_tinggi = probs[2].item()
            
            print(f"RAW PROBS -> R: {p_rendah:.2f}, S: {p_sedang:.2f}, T: {p_tinggi:.2f}")

            if p_tinggi > 0.30:
                final_res = "Tinggi"
            elif p_rendah > 0.40:
                final_res = "Rendah"
            else:
                final_res = "Sedang"

        return {"risk_level": final_res, "probs": [p_rendah, p_sedang, p_tinggi]}

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}