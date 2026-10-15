"""Dataset de ChestX-ray14 usado por ChestXray14_Model_Comparison.ipynb.

Vive en un modulo aparte (y no dentro del notebook) porque en Windows los workers del
DataLoader se lanzan con 'spawn' y necesitan poder importar la clase del Dataset; una clase
definida dentro del notebook no es importable desde esos procesos.
"""
from pathlib import Path

import torch
import torch.utils.data as data
from PIL import Image


class ChestXray14Dataset(data.Dataset):
    def __init__(self, df, images_dir, image_col, transform):
        self.df = df.reset_index(drop=True)
        self.images_dir = Path(images_dir)
        self.image_col = image_col
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = self.images_dir / row[self.image_col]
        image = Image.open(img_path).convert("RGB")
        image = self.transform(image)
        label = torch.from_numpy(row["label_vector"])
        return image, label
