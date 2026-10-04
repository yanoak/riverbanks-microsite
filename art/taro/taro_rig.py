"""Build a rigged, toon-shaded Taro kitten from the Tripo mesh.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P art/taro/taro_rig.py -- [--preview DIR]

Reads art/taro/model/taro-kitten-tripo.glb, writes art/taro/model/taro-kitten.blend.
With --preview, also renders turntable views into DIR. See
plans/2026-10-04_taro-rig-and-clips.plan.md.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
GLB = os.path.join(HERE, "model", "taro-kitten-tripo.glb")
BLEND = os.path.join(HERE, "model", "taro-kitten.blend")

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
PREVIEW = argv[argv.index("--preview") + 1] if "--preview" in argv else None

TARGET_TRIS = 40_000
TEXTURE_SIZE = 2048
INK = "#1c1917"


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


# --- scene ---------------------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
scene.render.resolution_x = scene.render.resolution_y = 720
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.render.fps = 24

# Ink on the silhouette only: the painted stripes already draw the interior.
scene.render.use_freestyle = True
scene.render.line_thickness_mode = "ABSOLUTE"
view_layer = scene.view_layers[0]
view_layer.use_freestyle = True
fs = view_layer.freestyle_settings
lineset = fs.linesets[0] if fs.linesets else fs.linesets.new("ink")
for attr in ("select_silhouette", "select_border", "select_external_contour"):
    setattr(lineset, attr, True)
for attr in ("select_crease", "select_contour", "select_material_boundary", "select_edge_mark"):
    setattr(lineset, attr, False)
if lineset.linestyle is None:
    lineset.linestyle = bpy.data.linestyles.new("ink")
lineset.linestyle.color = hex_rgb(INK)[:3]
lineset.linestyle.thickness = 2.4

world = bpy.data.worlds.new("world")
world.color = (1, 1, 1)
scene.world = world

sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(50), math.radians(-10), math.radians(35))
scene.collection.objects.link(sun)

# --- mesh ----------------------------------------------------------------------------------

bpy.ops.import_scene.gltf(filepath=GLB)
taro = next(o for o in scene.objects if o.type == "MESH")
taro.name = taro.data.name = "taro"
# glTF imports under an empty sometimes; keep the mesh at the root with transforms applied.
world_matrix = taro.matrix_world.copy()
taro.parent = None
taro.matrix_world = world_matrix
for o in [o for o in scene.objects if o.type == "EMPTY"]:
    bpy.data.objects.remove(o)
bpy.context.view_layer.objects.active = taro
taro.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# glTF arrives split along every UV seam. Weld it back into one surface (UVs are per-corner, so
# they survive): otherwise the seams tear open when the rig bends them, and Freestyle inks them.
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=1e-5)
bpy.ops.object.mode_set(mode="OBJECT")

taro.data.calc_loop_triangles()
before = len(taro.data.loop_triangles)
dec = taro.modifiers.new("decimate", "DECIMATE")
dec.decimate_type = "COLLAPSE"
dec.ratio = TARGET_TRIS / before
bpy.ops.object.modifier_apply(modifier=dec.name)
taro.data.calc_loop_triangles()
after = len(taro.data.loop_triangles)
print(f"TARO decimated {before} -> {after} triangles")


def open_edges(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    n = sum(1 for e in bm.edges if e.is_boundary)
    bm.free()
    return n


print(f"TARO open edges after weld: {open_edges(taro)}")
bpy.ops.object.shade_smooth()

# Stand Taro on the ground plane, centred over the origin.
lo = Vector([min(v.co[i] for v in taro.data.vertices) for i in range(3)])
hi = Vector([max(v.co[i] for v in taro.data.vertices) for i in range(3)])
offset = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for v in taro.data.vertices:
    v.co -= offset
print(f"TARO size {tuple(round(c, 3) for c in hi - lo)}")

# --- toon material -------------------------------------------------------------------------

old = taro.data.materials[0]
colour = next(
    n.image
    for n in old.node_tree.nodes
    if n.type == "TEX_IMAGE" and n.image and n.image.name.startswith("Color")
)
colour.scale(TEXTURE_SIZE, TEXTURE_SIZE)
for img in list(bpy.data.images):
    if img != colour:
        bpy.data.images.remove(img)


def toon_textured(name, image, shade=0.8):
    """taro_blender.py's two-tone toon, with the painted texture in place of a flat colour."""
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
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    mult = nt.nodes.new("ShaderNodeMixRGB")
    mult.blend_type = "MULTIPLY"
    mult.inputs[0].default_value = 1.0
    emit = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(diffuse.outputs[0], to_rgb.inputs[0])
    nt.links.new(to_rgb.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mult.inputs[1])
    nt.links.new(tex.outputs["Color"], mult.inputs[2])
    nt.links.new(mult.outputs[0], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return m


taro.data.materials.clear()
taro.data.materials.append(toon_textured("taro-toon", colour))
bpy.data.materials.remove(old)

# --- camera --------------------------------------------------------------------------------

centre = Vector((0, 0, (hi.z - lo.z) / 2))
radius = (hi - lo).length
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = 85
scene.collection.objects.link(cam)
scene.camera = cam


def aim(direction, distance=None):
    """Point the camera at Taro from a direction (x, y, z) relative to the body."""
    d = Vector(direction).normalized()
    cam.location = centre + d * (distance or radius * 3.4)
    cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()


# Taro faces +X. The holding page's view: three-quarter front, a little above.
aim((1.0, -0.9, 0.35))

# Pack the texture so the .blend stands alone.
colour.pack()
bpy.ops.wm.save_as_mainfile(filepath=BLEND, compress=True)
print(f"TARO saved {BLEND}")

if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    views = {
        "hero": (1.0, -0.9, 0.35),
        "front": (1, 0, 0.05),
        "left": (0, -1, 0.05),
        "back": (-1, 0, 0.05),
        "right": (0, 1, 0.05),
        "above": (0.6, -0.6, 1.0),
    }
    for name, d in views.items():
        aim(d)
        scene.render.filepath = os.path.join(PREVIEW, f"turn_{name}.png")
        bpy.ops.render.render(write_still=True)
