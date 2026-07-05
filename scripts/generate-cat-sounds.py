#!/usr/bin/env python3
"""Generate cute cat sound variations from existing sounds."""

from pydub import AudioSegment
from pydub.effects import speedup, normalize
import os

SOUNDS_DIR = "renderer/sounds"

def pitch_shift(sound, octaves):
    """Shift pitch by changing sample rate."""
    new_sample_rate = int(sound.frame_rate * (2.0 ** octaves))
    return sound._spawn(sound.raw_data, overrides={'frame_rate': new_sample_rate}).set_frame_rate(sound.frame_rate)

def make_cute_variant(input_file, output_file, pitch_change=0, speed_change=1.0, volume_change=0):
    """Create a cute variant of a sound."""
    try:
        sound = AudioSegment.from_mp3(input_file)
        
        # Change pitch
        if pitch_change != 0:
            sound = pitch_shift(sound, pitch_change)
        
        # Change speed
        if speed_change != 1.0:
            sound = speedup(sound, speed_change, 150)
        
        # Change volume
        if volume_change != 0:
            sound = sound + volume_change
        
        # Normalize
        sound = normalize(sound)
        
        # Export
        sound.export(output_file, format="mp3", bitrate="128k")
        print(f"Created: {os.path.basename(output_file)}")
        return True
    except Exception as e:
        print(f"Error processing {input_file}: {e}")
        return False

def main():
    # 从现有 meow 生成可爱变体
    base_meows = [
        "meow1.mp3",
        "meow3.mp3",
        "meow4.mp3",
    ]
    
    variants_created = 0
    
    for i, base_file in enumerate(base_meows, 1):
        input_path = os.path.join(SOUNDS_DIR, base_file)
        if not os.path.exists(input_path):
            continue
        
        # 高音可爱版 (小猫)
        output = os.path.join(SOUNDS_DIR, f"kitten_meow{i}.mp3")
        if make_cute_variant(input_path, output, pitch_change=0.3, speed_change=1.1):
            variants_created += 1
        
        # 低沉版 (大猫)
        output = os.path.join(SOUNDS_DIR, f"adult_meow{i}.mp3")
        if make_cute_variant(input_path, output, pitch_change=-0.2, speed_change=0.9):
            variants_created += 1
        
        # 快速短促版 (调皮)
        output = os.path.join(SOUNDS_DIR, f"playful_meow{i}.mp3")
        if make_cute_variant(input_path, output, pitch_change=0.15, speed_change=1.3, volume_change=3):
            variants_created += 1
    
    # 生成呼噜声变体
    purr_path = os.path.join(SOUNDS_DIR, "purr1.mp3")
    if os.path.exists(purr_path):
        # 轻柔呼噜
        output = os.path.join(SOUNDS_DIR, "soft_purr.mp3")
        if make_cute_variant(purr_path, output, pitch_change=0.1, speed_change=0.8, volume_change=-5):
            variants_created += 1
        
        # 开心呼噜
        output = os.path.join(SOUNDS_DIR, "happy_purr.mp3")
        if make_cute_variant(purr_path, output, pitch_change=0.2, speed_change=1.1, volume_change=3):
            variants_created += 1
    
    # 生成开心音效变体
    happy_path = os.path.join(SOUNDS_DIR, "happy1.mp3")
    if os.path.exists(happy_path):
        output = os.path.join(SOUNDS_DIR, "excited_cat.mp3")
        if make_cute_variant(happy_path, output, pitch_change=0.25, speed_change=1.15):
            variants_created += 1
        
        output = os.path.join(SOUNDS_DIR, "gentle_happy.mp3")
        if make_cute_variant(happy_path, output, pitch_change=-0.1, speed_change=0.85, volume_change=-3):
            variants_created += 1
    
    print(f"\nTotal variants created: {variants_created}")

if __name__ == "__main__":
    main()
