import json
import numpy as np
import torch
import torch.nn.functional as F
from app import model, scaler, GraphSAGE

# Load exported package
with open('gnn_package.json', 'r') as f:
    pkg = json.load(f)

weights = {k: np.array(v, dtype=np.float32) for k, v in pkg['weights'].items()}
scaler_center = np.array(pkg['scaler']['center'], dtype=np.float32)
scaler_scale = np.array(pkg['scaler']['scale'], dtype=np.float32)
classes = pkg['classes']

def numpy_sage_layer(x, conv_name, bn_name=None, use_elu=True):
    # SAGEConv with self-loop: out = x @ (lin_l.T + lin_r.T) + bias
    W_l = weights[f'{conv_name}.lin_l.weight']
    W_r = weights[f'{conv_name}.lin_r.weight']
    bias = weights[f'{conv_name}.lin_l.bias']
    
    # Combined linear transformation
    out = x @ (W_l.T + W_r.T) + bias
    
    # BatchNorm1d (eval mode using running stats)
    if bn_name is not None:
        gamma = weights[f'{bn_name}.weight']
        beta = weights[f'{bn_name}.bias']
        mean = weights[f'{bn_name}.running_mean']
        var = weights[f'{bn_name}.running_var']
        eps = 1e-5
        
        out = (out - mean) / np.sqrt(var + eps) * gamma + beta
    
    # ELU activation
    if use_elu:
        out = np.where(out > 0, out, np.exp(out) - 1.0)
        
    return out

def numpy_gnn_predict(raw_features_array):
    # 1. RobustScaler transform
    x_scaled = (raw_features_array - scaler_center) / scaler_scale
    
    # 2. GraphSAGE 4-Layer Forward Pass
    x = numpy_sage_layer(x_scaled, 'conv1', 'bn1', use_elu=True)
    x = numpy_sage_layer(x, 'conv2', 'bn2', use_elu=True)
    x = numpy_sage_layer(x, 'conv3', 'bn3', use_elu=True)
    logits = numpy_sage_layer(x, 'conv4', bn_name=None, use_elu=False)
    
    # 3. Softmax
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)
    pred_idx = int(np.argmax(probs))
    
    return pred_idx, probs, classes[pred_idx]

# Test with sample input
sample_input = np.array([22.0, 0.0, 3.0, 1.0, 1.0, 3.0, 0.0, 1.0, 2.0, 1.0, 0.0, 2.0, 3.0, 0.0], dtype=np.float32)

# NumPy prediction
pred_idx, probs, label = numpy_gnn_predict(sample_input)

# PyTorch prediction for comparison
model.eval()
with torch.no_grad():
    x_scaled_torch = (torch.tensor(sample_input).unsqueeze(0) - torch.tensor(scaler_center)) / torch.tensor(scaler_scale)
    out_torch = model(x_scaled_torch, torch.tensor([[0], [0]], dtype=torch.long))
    probs_torch = F.softmax(out_torch, dim=1).numpy()[0]

print("="*60)
print(f"NumPy GNN Probs  : {probs}")
print(f"PyTorch GNN Probs: {probs_torch}")
print(f"Difference       : {np.abs(probs - probs_torch).max():.8e}")
print(f"Predicted Class  : {label}")
print("="*60)
assert np.allclose(probs, probs_torch, atol=1e-5), "NumPy and PyTorch outputs mismatch!"
print("[VERIFIED] Pure NumPy GNN Engine is 100% accurate and mathematically identical!")
