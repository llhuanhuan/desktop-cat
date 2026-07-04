#!/usr/bin/env python3
"""
处理猫咪主题图片
- 去除白色背景
- 统一尺寸为 256x256
- 保持透明背景
"""

import os
from pathlib import Path
from PIL import Image
import numpy as np

# 目录路径
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "processed"
OUTPUT_DIR.mkdir(exist_ok=True)

# 目标尺寸
TARGET_SIZE = (256, 256)

# 要处理的图片
IMAGES = [
    "idle.png",
    "thinking.png",
    "working.png",
    "happy.png",
    "error.png",
    "sleeping.png",
    "notification.png",
    "waking.png",
]

def remove_white_background(img):
    """使用洪水填充从边缘去除白色背景，保留猫咪身上的白色"""
    arr = np.array(img)

    # 确保是 RGBA 格式
    if arr.shape[2] == 3:  # RGB
        alpha = np.ones((arr.shape[0], arr.shape[1], 1), dtype=np.uint8) * 255
        arr = np.concatenate([arr, alpha], axis=2)

    h, w = arr.shape[:2]
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    # 判断是否为浅色背景像素 (RGB > 230)
    def is_bg_pixel(y, x):
        return r[y, x] > 230 and g[y, x] > 230 and b[y, x] > 230

    # 从四条边开始洪水填充
    visited = np.zeros((h, w), dtype=bool)
    from collections import deque
    queue = deque()

    # 将四条边上符合条件的像素加入队列
    for x in range(w):
        if is_bg_pixel(0, x):
            queue.append((0, x))
        if is_bg_pixel(h-1, x):
            queue.append((h-1, x))
    for y in range(h):
        if is_bg_pixel(y, 0):
            queue.append((y, 0))
        if is_bg_pixel(y, w-1):
            queue.append((y, w-1))

    # 洪水填充
    while queue:
        y, x = queue.popleft()
        if y < 0 or y >= h or x < 0 or x >= w:
            continue
        if visited[y, x]:
            continue
        if not is_bg_pixel(y, x):
            continue

        visited[y, x] = True
        arr[y, x, 3] = 0  # 设为透明

        # 向四个方向扩展
        queue.append((y-1, x))
        queue.append((y+1, x))
        queue.append((y, x-1))
        queue.append((y, x+1))

    return Image.fromarray(arr)

def process_image(input_path, output_path):
    """处理单张图片：去背景 + 调整尺寸"""
    print(f"处理: {input_path.name}")

    # 读取图片
    with Image.open(input_path) as img:
        # 去除白色背景
        img_no_bg = remove_white_background(img)

        # 调整尺寸，保持宽高比，使用 NEAREST 避免产生半透明像素
        img_no_bg.thumbnail(TARGET_SIZE, Image.Resampling.NEAREST)

        # 创建透明背景的目标图片
        result = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))

        # 居中粘贴
        x = (TARGET_SIZE[0] - img_no_bg.width) // 2
        y = (TARGET_SIZE[1] - img_no_bg.height) // 2
        result.paste(img_no_bg, (x, y), img_no_bg)

        # 保存
        result.save(output_path, "PNG")

        # 统计非透明像素
        arr = np.array(result)
        non_transparent = np.sum(arr[:,:,3] > 0)
        total_pixels = arr.shape[0] * arr.shape[1]
        ratio = non_transparent / total_pixels * 100
        print(f"  -> {output_path.name} ({result.width}x{result.height}), 非透明: {ratio:.1f}%")

def main():
    print("=== 猫咪主题图片处理 ===\n")

    for img_name in IMAGES:
        input_path = SCRIPT_DIR / img_name
        output_path = OUTPUT_DIR / img_name

        if not input_path.exists():
            print(f"跳过: {img_name} (文件不存在)")
            continue

        try:
            process_image(input_path, output_path)
        except Exception as e:
            print(f"错误: {img_name} - {e}")

    print(f"\n处理完成！输出目录: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
