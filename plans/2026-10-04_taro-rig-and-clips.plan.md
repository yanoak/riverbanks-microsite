---
slug: 2026-10-04_taro-rig-and-clips
status: active
started: 2026-10-04
finished:
issue:
---

# Taro kitten: from the Tripo mesh to rigged, toon-shaded animation clips

## Context

Part of the holding page in [river-map-holding-page](2026-10-04_river-map-holding-page.plan.md):
an animated Taro, rendered in Blender and played on the site as transparent video, says the site
is under construction.

- `art/taro/taro_blender.py` is the first attempt. Taro there is built from primitives, with
  toon shading (Shader-to-RGB with a constant ramp, emission), Freestyle ink, and a 96-frame
  seamless loop. It looks like a toy. Its scene, toon and ink set-up carry over; its model does
  not.
- `art/taro/refs/taro-kitten-{front,left,back,right}.png` are four matching views generated in
  the riverbanks generator on 2026-10-04.
- `art/taro/model/taro-kitten-tripo.glb` is the Higgsfield `tripo_h3_1_multiview_to_3d` result
  (job `78db19f3-b7c2-473e-8c85-bc5280fcfdee`, 18 credits). It is gitignored, 62 MB and
  1.9M triangles. It's one connected mesh with a 4096² colour, normal and ORM texture set; the
  model faces +X, Z is up, and it measures 0.98 × 0.41 × 0.87 units.
- Blender 4.5 ships Rigify with a cat metarig (`armature_cat_metarig_add`).

## Goal

Running `art/taro/taro_rig.py` builds a rigged, toon-shaded Taro from the GLB with no hand steps.
`art/taro/taro_clips.py` renders a set of transparent clips (an idle loop plus one-off moments).
Every clip starts and ends on the same rest pose, so the site can cut between them at random
without a visible jump. Each clip is encoded as WebM (VP9 with alpha) and HEVC with alpha.

## Approach

**Mesh: decimate, don't remesh.** A collapse decimate to around 40k triangles keeps the UVs, so
the Tripo texture still applies. A voxel or QuadriFlow remesh would give cleaner topology but
throws the UVs away, which means baking the texture onto the new mesh: more steps, and a softer
texture. Toon shading with ink outlines hides triangle topology, so decimate first and remesh only
if the deformation looks bad. Downscale the colour map to 2048²; drop the normal and ORM maps,
since flat toon shading doesn't use them.

**Rig: 30 bones, with Rigify cat names, driven straight from the script.** The cat metarig has
174 bones, and over 100 of them are face bones (lids, lips, brows, tongue). Taro's face is painted
on, so they would have nothing to drive. The script builds only the bones Taro moves: a spine of
six (hips to head), four tail bones, one per ear, and full front and hind legs. They use the
metarig's names and parenting, so a Rigify control rig could still be generated later. Rigify's
generated control rig (IK, widgets) is for animating by hand. Here every pose is computed in
Python, so FK rotations are simpler. Joints are placed from slices through the decimated mesh.
Weights come from bone heat, then the ear weights are confined to the ears (bone heat let them
claim most of the skull), and a check asserts that no vertex is unweighted.

**Shading: reuse taro_blender.py's toon look, fed by the texture.** The Tripo colour map goes into
the multiply in place of the flat fur colour, and a constant ramp makes two tones. Freestyle ink
draws silhouettes only; the painted stripes already supply the interior marks.

**Clips.** Each one starts and ends on the rest pose.
- `idle`: a 96-frame seamless loop. Breathing, a slow look around, an occasional tail sway.
- `ear-flick`, `tail-swish`, `look-up`: short one-offs, 24–48 frames each.
- `paw-wash` (stretch): lift the front paw and lick, using front-leg and head FK.
- **Blink and yawn don't come free.** Tripo painted the eyes and mouth on; there are no eyelids
  and no mouth geometry. Blink needs closed-eye decals, or a texture swap keyed on a frame.
  Yawn needs mouth geometry. Both are deferred; see Open questions.

**Rejected:**
- Higgsfield auto-rigging: humanoid only.
- Live three.js in the browser: decided earlier (video loop, option a).
- Quad output from Tripo: 1.5 more credits, and decimation makes it moot.

## Tasks

- [x] `taro_rig.py`: import, decimate to ~40k, shrink textures, toon material, save
      `art/taro/model/taro-kitten.blend` (gitignored)
- [x] Build a cat skeleton fitted to the mesh, add automatic weights, check weights; render a
      deformation test sheet
- [ ] `taro_clips.py`: the rest pose and the `idle` loop, rendered and encoded
- [ ] One-off clips: `ear-flick`, `tail-swish`, `look-up`
- [ ] Encode all clips (WebM and HEVC), check alpha and file sizes, publish a preview page
- [ ] `paw-wash` (stretch)

## Verification

- Turntable renders of the rest pose with the toon look: it reads as the kitten in the reference
  views, with ink only on the silhouette.
- Deformation test sheet (head turned ±30°, tail swung, ears rotated, a front paw raised): no
  tearing, no stray vertices following the wrong bone, no collapsed volume at the neck or
  shoulders.
- Loop seam: in `idle`, the difference between the last frame and the first frame is about the
  same as between any two neighbouring frames.
- Clip joins: the first and last frames of every clip match `idle`'s first frame pixel for pixel.
- On the preview page, in Chrome and Safari (desktop, and an iPhone for HEVC alpha): the
  background shows through, with no black matte.
- File size: `idle` WebM is at most 400 KB at 720².

## Out of scope

- Putting the clips on the site and the random clip mixer. That's the holding-page plan.
- The adult Taro.
- Blink and yawn, unless the Open questions below get answered.

## Open questions

- [ ] Blink: are closed-eye decals worth the work, or is a Taro that doesn't blink fine?
- [ ] Is the comic look (toon + ink) right for the site, or should Taro be less flat?

## Outcome

_Filled in when this goes to `done` or `abandoned`._
