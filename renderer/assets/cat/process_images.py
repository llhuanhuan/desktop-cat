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
from rembg import remove

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

def process_image(input_path, output_path):
    """处理单张图片：去背景 + 调整尺寸"""
    print(f"处理: {input_path.name}")

    # 读取图片
    with Image.open(input_path) as img:
        # 去除背景 (rembg 使用 AI 模型)
        img_no_bg = remove(img)

        # 调整尺寸，保持宽高比
        img_no_bg.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)

        # 创建透明背景的目标图片
        result = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))

        # 居中粘贴
        x = (TARGET_SIZE[0] - img_no_bg.width) // 2
        y = (TARGET_SIZE[1] - img_no_bg.height) // 2
        result.paste(img_no_bg, (x, y), img_no_bg)

        # 保存
        result.save(output_path, "PNG")
        print(f"  -> {output_path.name} ({result.width}x{result.height})")

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
