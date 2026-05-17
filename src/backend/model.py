import pickle
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class ECGNet(nn.Module):
    def __init__(self, num_classes: int = 5):
        super().__init__()
        self.conv1 = nn.Conv1d(1, 32, kernel_size=5, padding=2)
        self.bn1 = nn.BatchNorm1d(32)
        self.conv2 = nn.Conv1d(32, 64, kernel_size=5, padding=2)
        self.bn2 = nn.BatchNorm1d(64)
        self.conv3 = nn.Conv1d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm1d(128)
        self.pool = nn.MaxPool1d(2)
        self.gap = nn.AdaptiveAvgPool1d(1)
        self.dropout = nn.Dropout(0.3)
        self.fc1 = nn.Linear(128, 64)
        self.fc2 = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = self.gap(x).squeeze(-1)
        x = self.dropout(F.relu(self.fc1(x)))
        return self.fc2(x)


def load_artifacts(artifacts_dir: Path) -> tuple:
    checkpoint = torch.load(
        artifacts_dir / "ecg_model.pt",
        map_location="cpu",
        weights_only=False,
    )
    model = ECGNet(num_classes=checkpoint["num_classes"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    with open(artifacts_dir / "scaler.pkl", "rb") as f:
        scaler = pickle.load(f)

    with open(artifacts_dir / "meta.pkl", "rb") as f:
        meta = pickle.load(f)

    return model, scaler, meta


def run_inference(signal: list[float], model: ECGNet, scaler, meta: dict) -> dict:
    arr = np.array(signal, dtype=np.float32).reshape(1, -1)
    arr = scaler.transform(arr)
    x = torch.tensor(arr, dtype=torch.float32).unsqueeze(1)

    with torch.no_grad():
        probs = F.softmax(model(x), dim=1).cpu().numpy()[0]

    cls_id = int(probs.argmax())
    conf = float(probs[cls_id])
    threshold = meta.get("low_conf_threshold", 0.6)
    label = meta["class_names"][cls_id] if conf >= threshold else "не уверен"

    return {"class": label, "confidence": round(conf, 4)}
