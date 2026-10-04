"""Render Taro's animation clips from the rigged kitten.

    /Applications/Blender.app/Contents/MacOS/Blender -b art/taro/model/taro-kitten.blend \
        -P art/taro/taro_clips.py -- CLIP [CLIP ...] [--still] [--size 720]

Build the .blend first with taro_rig.py. Writes transparent PNG frames to
art/taro/out/<clip>/frame_0001.png …; encode them with encode.sh. See
plans/2026-10-04_taro-rig-and-clips.plan.md.

Every clip is one 96-frame cycle of the idle loop with one moment layered on top. The moment
fades in and out inside the cycle, so every clip starts and ends on the idle's own first frame
and the site can cut from any clip to any other at a loop boundary.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
STILL = "--still" in argv
SIZE = int(argv[argv.index("--size") + 1]) if "--size" in argv else 720
CLIP_NAMES = [a for a in argv if not a.startswith("--") and not a.isdigit()]

FRAMES = 96  # 4 s at 24 fps
TAU = 2 * math.pi
r = math.radians

scene = bpy.context.scene
rig = bpy.data.objects["rig"]
taro = bpy.data.objects["taro"]
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.frame_start, scene.frame_end = 1, FRAMES

# Breathing scales the chest bone; the neck and shoulders must not inherit it.
for name in ("spine.003",):
    rig.data.bones[name].inherit_scale = "NONE"

# --- camera --------------------------------------------------------------------------------

# Three-quarter front from Taro's left, a little above, close enough to fill most of the frame
# with room for the head to turn and the tail to swish.
cam = scene.camera
cam.data.lens = 85
target = Vector((0, -0.02, 0.43))
direction = Vector((0.9, -1.0, 0.35)).normalized()
cam.location = target + direction * 2.75
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()

# --- motion --------------------------------------------------------------------------------


def wave(t, cycles, phase=0.0):
    """A sine with a whole number of cycles per clip, so the loop closes."""
    return math.sin(TAU * cycles * t + phase)


def bump(t, centre, width):
    """A smooth pulse, 0 well away from centre and 1 at it. Width is the half-width in t."""
    x = (t - centre) / width
    return 0.0 if abs(x) >= 1 else (0.5 + 0.5 * math.cos(math.pi * x)) ** 2


def idle(t):
    """The base loop: two breaths, a slow look around, an easy tail sway."""
    pose = {}
    breath = 0.5 - 0.5 * math.cos(TAU * 2 * t)  # 0 at t=0, two breaths a cycle
    pose["spine.002"] = {"scale": (1 + 0.035 * breath, 1, 1 + 0.035 * breath)}
    pose["spine.005"] = {"rot": (r(4) * wave(t, 2, -math.pi / 2) + r(4), r(14) * wave(t, 1), 0)}
    pose["spine.004"] = {"rot": (0, r(5) * wave(t, 1), 0)}
    for i in range(1, 5):
        pose[f"tail.{i:03d}"] = {"rot": (r(-6) if i == 1 else 0,
                                         0,
                                         r(7) * wave(t, 1, -0.7 * i))}
    return pose


def add(pose, bone, rot=(0, 0, 0)):
    entry = pose.setdefault(bone, {})
    old = entry.get("rot", (0, 0, 0))
    entry["rot"] = tuple(a + b for a, b in zip(old, rot))


def ear_flick(t):
    pose = idle(t)
    # Two quick flicks of the left ear, then one of the right.
    k = bump(t, 0.35, 0.05) + bump(t, 0.47, 0.05)
    add(pose, "ear.L", (r(-30) * k, 0, r(18) * k))
    k = bump(t, 0.7, 0.05)
    add(pose, "ear.R", (r(-25) * k, 0, r(-15) * k))
    return pose


def tail_swish(t):
    pose = idle(t)
    # A bigger travelling wave along the tail, up and across, over the middle of the cycle.
    env = bump(t, 0.5, 0.38)
    for i in range(1, 5):
        add(pose, f"tail.{i:03d}", (r(-14) * env if i <= 2 else 0, 0,
                                    r(22) * env * math.sin(TAU * 3 * t - 0.9 * i)))
    return pose


def look_up(t):
    pose = idle(t)
    # Something above catches Taro's eye: head up and to the side, ears forward, a hold, back.
    env = bump(t, 0.5, 0.4)
    env = min(1.0, env * 1.6)
    add(pose, "spine.005", (r(-24) * env, r(-18) * env, r(6) * env))
    add(pose, "spine.004", (r(-8) * env, 0, 0))
    add(pose, "ear.L", (r(10) * env, 0, 0))
    add(pose, "ear.R", (r(10) * env, 0, 0))
    return pose


CLIPS = {"idle": idle, "ear-flick": ear_flick, "tail-swish": tail_swish, "look-up": look_up}


def apply(pose):
    for pb in rig.pose.bones:
        p = pose.get(pb.name, {})
        pb.rotation_euler = p.get("rot", (0, 0, 0))
        pb.scale = p.get("scale", (1, 1, 1))


def bake(fn):
    rig.animation_data_clear()
    for f in range(1, FRAMES + 1):
        apply(fn((f - 1) / FRAMES))
        for pb in rig.pose.bones:
            pb.keyframe_insert("rotation_euler", frame=f)
            pb.keyframe_insert("scale", frame=f)


for name in CLIP_NAMES:
    bake(CLIPS[name])
    out = os.path.join(HERE, "out", name)
    os.makedirs(out, exist_ok=True)
    if STILL:
        for f in (1, 25, 49, 73):
            scene.frame_set(f)
            scene.render.filepath = os.path.join(out, f"still_{f:04d}.png")
            bpy.ops.render.render(write_still=True)
    else:
        scene.render.filepath = os.path.join(out, "frame_")
        bpy.ops.render.render(animation=True)
    print(f"TARO rendered {name}")
