"""Taro, Ya's grey tabby: a stand-in built from primitives, toon-shaded with ink lines,
rendered as a seamless transparent idle loop.

    Blender -b -P taro_blender.py -- <out_dir> [--still]

Colours are the Riverbanks tokens; the loop is FRAMES long and every motion is a whole number of
sine cycles over it, so frame FRAMES+1 equals frame 1.
"""

import math
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/taro"
STILL = "--still" in argv

FRAMES = 96  # 4 s at 24 fps
SIZE = 720
TAU = 2 * math.pi


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


INK = "#1c1917"
FUR = "#9aa09c"
FUR_DARK = "#62696a"
BELLY = "#e9e4d8"
EAR = "#d9a48a"
NOSE = "#c4553d"

# --- scene ---------------------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps = 24

# Ink lines: silhouettes and borders only, even weight, like ligne claire.
scene.render.use_freestyle = True
scene.render.line_thickness_mode = "ABSOLUTE"
scene.render.line_thickness = 2.4
view_layer = scene.view_layers[0]
view_layer.use_freestyle = True
fs = view_layer.freestyle_settings
fs.crease_angle = math.radians(120)
lineset = fs.linesets[0] if fs.linesets else fs.linesets.new("ink")
lineset.select_silhouette = True
lineset.select_border = True
lineset.select_crease = False
lineset.select_contour = True
lineset.select_external_contour = True
if lineset.linestyle is None:
    lineset.linestyle = bpy.data.linestyles.new("ink")
lineset.linestyle.color = hex_rgb(INK)[:3]
lineset.linestyle.thickness = 2.4

world = bpy.data.worlds.new("world")
world.color = (1, 1, 1)
scene.world = world

# --- toon material -------------------------------------------------------------------------


def toon(name, base, stripes=None, shade=0.78, direction="Z"):
    """Two flat tones from a diffuse light test; optional tabby stripes from a wave texture."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    diffuse = nt.nodes.new("ShaderNodeBsdfDiffuse")
    to_rgb = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (shade, shade, shade, 1)
    ramp.color_ramp.elements[1].position = 0.45
    ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    mult = nt.nodes.new("ShaderNodeMixRGB")
    mult.blend_type = "MULTIPLY"
    mult.inputs[0].default_value = 1.0
    emit = nt.nodes.new("ShaderNodeEmission")

    nt.links.new(diffuse.outputs[0], to_rgb.inputs[0])
    nt.links.new(to_rgb.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mult.inputs[1])

    if stripes:
        coord = nt.nodes.new("ShaderNodeTexCoord")
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.wave_type = "BANDS"
        wave.bands_direction = direction
        wave.inputs["Scale"].default_value = stripes
        wave.inputs["Distortion"].default_value = 4.0
        wave.inputs["Detail"].default_value = 0.5
        step = nt.nodes.new("ShaderNodeValToRGB")
        step.color_ramp.interpolation = "CONSTANT"
        step.color_ramp.elements[0].position = 0.0
        step.color_ramp.elements[0].color = hex_rgb(FUR_DARK)
        step.color_ramp.elements[1].position = 0.22
        step.color_ramp.elements[1].color = hex_rgb(base)
        nt.links.new(coord.outputs["Object"], wave.inputs["Vector"])
        nt.links.new(wave.outputs["Fac"], step.inputs[0])
        nt.links.new(step.outputs[0], mult.inputs[2])
    else:
        mult.inputs[2].default_value = hex_rgb(base)

    nt.links.new(mult.outputs[0], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return m


M_FUR = toon("fur", FUR, stripes=1.1, direction="X")
M_HEAD = toon("head", FUR, stripes=1.6, direction="X")
M_PLAIN = toon("fur-plain", FUR)
M_DARK = toon("fur-dark", FUR_DARK)
M_BELLY = toon("belly", BELLY)
M_EAR = toon("ear", EAR)
M_NOSE = toon("nose", NOSE)
M_EYE = toon("eye", INK, shade=1.0)

# --- model ---------------------------------------------------------------------------------


def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    bpy.context.collection.objects.link(e)
    if parent:
        e.parent = parent
    return e


def sphere(name, loc, scale, mat, parent=None, segs=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=segs // 2, location=(0, 0, 0))
    o = bpy.context.object
    o.name = name
    bpy.ops.object.shade_smooth()
    o.scale = scale
    o.location = loc
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o


def cone(name, loc, r, depth, rot, mat, parent=None, verts=4):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, depth=depth, location=(0, 0, 0))
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    o.location = loc
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o


def cylinder(name, loc, r, depth, mat, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=r, depth=depth, location=(0, 0, 0))
    o = bpy.context.object
    o.name = name
    bpy.ops.object.shade_smooth()
    o.location = loc
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o


# Blender is Z-up; the cat faces -Y (towards the camera).
cat = empty("Taro", (0, 0, 0))
body = sphere("body", (0, 0, 0.95), (1.0, 0.85, 1.05), M_FUR, cat)
sphere("chest", (0, -0.52, 1.15), (0.55, 0.4, 0.75), M_BELLY, cat)
for s in (-1, 1):
    sphere(f"haunch{s}", (0.62 * s, -0.05, 0.45), (0.5, 0.62, 0.45), M_FUR, cat)
    cylinder(f"leg{s}", (0.3 * s, -0.62, 0.55), 0.17, 1.0, M_PLAIN, cat)
    sphere(f"paw{s}", (0.3 * s, -0.72, 0.08), (0.22, 0.27, 0.13), M_BELLY, cat, segs=32)

head = empty("head", (0, -0.15, 2.15), cat)
sphere("skull", (0, 0, 0), (0.71, 0.62, 0.59), M_HEAD, head)
sphere("muzzle", (0, -0.42, -0.2), (0.37, 0.24, 0.24), M_BELLY, head, segs=32)
ears = []
for s in (-1, 1):
    pivot = empty(f"ear{s}", (0.42 * s, 0.02, 0.5), head)
    cone(f"earout{s}", (0, 0, 0.05), 0.26, 0.5, (0, -0.38 * s, math.pi / 4), M_HEAD, pivot)
    cone(f"earin{s}", (0, -0.07, 0.03), 0.15, 0.32, (0, -0.38 * s, math.pi / 4), M_EAR, pivot)
    ears.append(pivot)
eyes = []
for s in (-1, 1):
    eyes.append(sphere(f"eye{s}", (0.25 * s, -0.55, 0.07), (0.085, 0.05, 0.11), M_EYE, head, segs=24))
cone("nose", (0, -0.66, -0.1), 0.06, 0.07, (math.pi / 2 + 0.3, 0, 0), M_NOSE, head, verts=3)

TAIL_N = 12
tail_curve = bpy.data.curves.new("tail", "CURVE")
tail_curve.dimensions = "3D"
tail_curve.bevel_depth = 0.13
tail_curve.bevel_resolution = 6
tail_curve.use_fill_caps = True
tail_spline = tail_curve.splines.new("NURBS")
tail_spline.points.add(TAIL_N - 1)
tail_spline.use_endpoint_u = True
tail_spline.order_u = 4
for i, pt in enumerate(tail_spline.points):
    pt.radius = 1.0 - 0.35 * i / (TAIL_N - 1)
tail_obj = bpy.data.objects.new("tail", tail_curve)
tail_obj.data.materials.append(M_FUR)
bpy.context.collection.objects.link(tail_obj)
tail_obj.parent = cat

# Whiskers as thin curves so Freestyle-free ink still reads.
for s in (-1, 1):
    for dz in (-0.02, -0.1):
        curve = bpy.data.curves.new(f"whisker{s}{dz}", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = 0.008
        spline = curve.splines.new("POLY")
        spline.points.add(1)
        spline.points[0].co = (0.18 * s, -0.6, -0.12, 1)
        spline.points[1].co = (0.78 * s, -0.45, -0.12 + dz * 2, 1)
        w = bpy.data.objects.new(f"whisker{s}{dz}", curve)
        w.data.materials.append(M_EYE)
        bpy.context.collection.objects.link(w)
        w.parent = head

# --- camera --------------------------------------------------------------------------------

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 85
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam
cam.location = (3.4, -9.6, 3.0)
direction = Vector((0, 0, 1.35)) - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("sun", sun)
sun_obj.rotation_euler = (math.radians(50), math.radians(-10), math.radians(35))
bpy.context.collection.objects.link(sun_obj)

# --- animation -----------------------------------------------------------------------------


def wave(f, cycles, phase=0.0):
    return math.sin(TAU * cycles * (f - 1) / FRAMES + phase)


def pose(f):
    t = (f - 1) / FRAMES
    body.scale = (1.0, 0.85, 1.05 + 0.015 * wave(f, 2))  # breathing, two breaths a loop
    head.rotation_euler = (0.05 * wave(f, 1, 1.0), 0, 0.12 * wave(f, 1))  # slow look around
    # Blink once, around 60% of the loop.
    blink = 1.0 if not (0.58 <= t < 0.62) else 0.12
    for e in eyes:
        e.scale = (0.085, 0.05, 0.11 * blink)
    # Ear twitch: the right ear flicks twice, quickly, early in the loop.
    flick = math.exp(-((t - 0.2) / 0.03) ** 2) * 0.4
    ears[1].rotation_euler = (0, flick, 0)
    ears[0].rotation_euler = (0, 0, 0)
    # Tail: a wave travelling along it, curling up behind.
    for i, pt in enumerate(tail_spline.points):
        u = i / (TAIL_N - 1)
        ph = TAU * (f - 1) / FRAMES * 2 - u * 2.4
        pt.co = (0.55 + u * 0.6 + math.sin(ph) * 0.3 * u,
                 0.45 + u * 0.25 + math.cos(ph) * 0.12 * u,
                 0.2 + u * u * 1.5, 1)
        pt.keyframe_insert("co", frame=f)


animated = [body, head, *eyes, *ears]
for f in range(1, FRAMES + 1):
    pose(f)
    for o in animated:
        o.keyframe_insert("location", frame=f)
        o.keyframe_insert("rotation_euler", frame=f)
        o.keyframe_insert("scale", frame=f)

scene.render.filepath = f"{OUT}/frame_"
if STILL:
    scene.frame_set(1)
    scene.render.filepath = f"{OUT}/poster.png"
    bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
