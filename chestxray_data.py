"""Dataset de ChestX-ray14 usado por ChestXray14_Model_Comparison.ipynb.

Vive en un modulo aparte (y no dentro del notebook) porque en Windows los workers del
DataLoader se lanzan con 'spawn' y necesitan poder importar la clase del Dataset; una clase
definida dentro del notebook no es importable desde esos procesos.
"""
import os
import zipfile
from pathlib import Path

import torch
import torch.utils.data as data
from PIL import Image

# ---- Cache de imagenes redimensionadas, generada en paralelo desde archive.zip ----
# (tambien aqui y no en el notebook: los procesos del Pool en Windows tienen que poder importar estas funciones)
_zip = None


def init_zip_worker(zip_path):
    """Cada proceso abre archive.zip una sola vez (leer su indice de 112k entradas es costoso)."""
    global _zip
    _zip = zipfile.ZipFile(zip_path)


def resize_from_zip(task):
    """Lee una radiografia del zip, la redimensiona a size x size (escala de grises) y la guarda como PNG.
    Escribe a un archivo temporal y luego lo renombra, para que una interrupcion no deje PNGs corruptos en la cache."""
    internal_name, dest, size = task
    with _zip.open(internal_name) as f:
        img = Image.open(f)
        img.load()
    img = img.convert("L").resize((size, size), Image.BILINEAR)
    tmp = dest + ".tmp"
    img.save(tmp, format="PNG", compress_level=1)
    os.replace(tmp, dest)


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
