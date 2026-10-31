# Professional 2D cut-out / puppet animation craft, and how to implement it in a custom JS/Canvas/WebGL engine (for "Minuton")

Scope note: research run 2026-10-28. Tool docs used are current versions (Toon Boom Harmony 24/25 docs, Spine 4.2 runtimes + docs while Spine 4.3 is current, Godot "stable" docs flagged by Godot itself as possibly outdated for 4.7). Principles come from classic sources. Everything under "Cited Findings" has a URL. Everything under "Inferences" is my synthesis or standard math and is flagged as such. Pseudo-code in Inferences is written for the Minuton engine and was **not** copied from any source unless stated.

---

## Q1. Which of Disney's 12 principles matter most for cut-out, and how do studios (Harmony / Moho / Spine) achieve them with rigs?

### Takeaway
Cut-out looks stiff because the puppet makes rigid parts, constant limb lengths, linear in-betweens and perfectly synchronised motion easy. Studios fight this with the same principles as hand-drawn work. The most important for puppets are **timing/spacing (slow in/out + holds/moving holds), arcs, overlapping action/drag, squash & stretch (via mesh deformers, not just scale), and drawing substitutions** (hands, mouths, eyes, smears, head views). Harmony does this with peg hierarchies + six deformer types + drawing swaps. Moho uses bones + Smart Bones + Switch layers. Spine uses bones + weighted meshes + IK + physics constraints.

### Cited Findings

**Principles: canonical definitions (Thomas & Johnston, *The Illusion of Life*, 1981)**
- Squash and stretch gives "a sense of weight and flexibility". Volume stays constant, so when length changes the width changes in the opposite direction. — [Wikipedia: Twelve basic principles](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Follow-through and overlapping action: loose parts keep moving after the body stops, and parts move at different rates. **Drag** is where "parts of them take a few frames to catch up". A **moving hold** "animates between two very similar positions", which keeps still characters from looking lifeless. — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Slow in / slow out: "more pictures are drawn near the beginning and end of an action". — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Arcs: natural motion follows curved paths, and mechanical movement goes in straight lines. Limbs rotate around joints, and thrown objects follow parabolas. — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Secondary action should "emphasize, rather than take attention away from the main action". — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Timing: the number of drawings/frames sets speed. Lighter objects react faster, and timing conveys mood and personality. — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Solid drawing: Johnston & Thomas warned against **"twins"**, poses where the left and right sides mirror each other. — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Anticipation "is used to prepare the audience for an action". Exaggeration pushes reality to a "wilder, more extreme form" while staying true to it. — [Wikipedia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Toon Boom's official cut-out training course expects "an applied knowledge of the 12 principles of animation" as a prerequisite. Its lessons cover cycles and prop interaction as recurring production techniques. — [Toon Boom training: Cut-Out Animation](https://toonboom.com/?p=23920)

**Why cut-out looks stiff (practitioner sources; forum-grade, treat as craft advice)**
- Limbs split into upper arm / forearm / hand need patches over joints. "The limbs are consistent in length which adds to the stiff look." — [Toon Boom forum: Cutout animation](https://forums.toonboom.com/t/cutout-animation/2300)
- "Doing straight eases from point A to point B will look stiff and mechanical" (transcript of Zedrin's YouTube tutorial "7 Tips for Smoother Animation", 2017). — [transcript archive](https://www.theponyarchive.com/archive/youtube/UCKbbOCogtCId3zHCiUIm5Bg/TUTORIAL_7_Tips_for_Smoother_Animation-Zedrin-20171202-youtube-1920x1080-yVcZXW80GKA.en.vtt)
- Fix: do a quick gesture **drawover** on top of the rig to block the pose, then match the rig/deformers to it. — [Wacom community](https://community.wacom.com/en-us/wp-json/wp/v2/posts/818662)
- "A gesture of an arm requires a subtle change in the whole pose". In other words, never move one part in isolation. — [Adobe Animate community](https://community.adobe.com/t5/animate-discussions/animation-looks-stiff/td-p/14573269)
- Cut-out follows the same basic principles as all animation. Mixing it with limited frame-by-frame animation helps. — [Synfig forum](https://forums.synfig.org/t/is-cutout-animation-too-stiff/4303)
- Flat 2D shapes make movement toward or away from camera hard. Cut-out "lends itself well to decisive, rapid movement". — [Chron](https://smallbusiness.chron.com/cutout-animation-26573.html)
- Even cut-out practitioners "often want to do some rough hand drawn animating as part of doing cut-out animating". They animate at 24 fps as the industry timing standard, do walk **contact poses first**, and "separate the forward motion from the actual walk cycle motion". — [Cartooning in Toon Boom blog (J. Keslensky, 2008)](https://animationcraft.blogspot.com/2008/02/animating-cut-out-characters-part-2.html)

**Harmony: rigs, deformers, swaps**
- A Harmony rig is the character model with every movable part on its own layer, arranged in a parent-child hierarchy, so "if the character moves their forearm, the hand will follow". — [Harmony 21 docs: How to Rig a Cut-out Character](https://docs.toonboom.com/help/harmony-21/premium/getting-started/character-building.html)
- Harmony Premium has six deformer types: Bone, Game Bone, Curve, Envelope, Free Form, Shape-Aware. — [Harmony 25 docs: How to Use Deformers](https://docs.toonboom.com/help/harmony-25/premium/getting-started/deformation.html)
  - **Bone**: "each part is solid, but with articulations that are flexible". Used for arms, legs, torsos and fingers, and lets one single drawing of an arm bend at the elbow, with parts that rotate, extend and shorten.
  - **Game Bone**: like Bone but "optimized to be exported to game engines such as Unity". It has no Bias or Region of Influence, and its folds are rounder.
  - **Curve**: "does not merely bend, it will deform along its entire length". Used for hair, mouths, eyebrows, torsos and **"rubber hose" limbs**.
  - **Envelope**: a closed shape around the drawing for hair, cloaks, shoulders and chins. It can fake viewing angles so the rig can **"rotate without swapping drawings"**.
  - **Free Form**: points anywhere, including the interior. It "stretches and squashes all the artwork between its control points" and suits **textured shapes / complex drawings**, which is relevant to bitmap art.
  - **Shape-Aware**: combines Point, Bone and Cage methods and "considers the underlying shape of an image", which makes it "more predictable for the animator".
  - Practice: chains are built root to tip (shoulder, elbow, wrist). A deformer affects everything under it. Create deformations "under pegs as much as possible".
  - Deformers extend a rig's range "without having to draw new poses for it or resorting to frame-by-frame animation".
- Mixing IK with Envelope deformers can break pivots (Harmony 14-era forum). The advice is to put pivots/pegs as parents of deformers. — [Toon Boom forum](https://forums.toonboom.com/t/is-it-possible-to-make-ik-style-cutout-rigs-with-envelope-deformers/14888)
- Harmony **Master Controllers** can store "drawing exposures and keyframe information", which makes them a one-slider control for a complex swap or deform. **Image-Switch** nodes swap line visibility. **R** resets the rig to its default pose. Rigs keep a reserved strip of frames (e.g. 40-46) that reveals hidden pieces. — [Toon Boom: Deconstructing the Punk rig with Matt Watts](https://www.toonboom.com/?p=11879)
- Rigger advice from the Punk rig: use a relaxed default arm pose rather than a T-pose. "It is best to have the default position of the mouth closed." "Avoid putting any patterns or designs through an elbow or knee joint." "Only build what is needed." Pose "at least 2 or 3 special poses" to test a rig before finishing it. — [Toon Boom Punk rig article](https://www.toonboom.com/?p=11879)
- In a more complex mouth, teeth, tongue and lips sit on separate layers with deformers + Master Controllers to "get some awesome customized shapes" that tween well. — [Toon Boom Punk rig article](https://www.toonboom.com/?p=11879)
- *Kick Buttowski* (Mercury Filmworks, Toon Boom) built mouths with a stationary upper-teeth layer under a skin drawing layer. Studios treat rigs as trade secrets. Advanced deformation has reduced redrawing, but new drawings are still made when a part is missing from the library. — [Toon Boom forum: Kick Buttowski](https://forums.toonboom.com/t/kick-buttowski/2732)

**Moho: bones, Smart Bones, Switch layers (Lost Marble forum, practitioner-level)**
- Simple head turn: parent all facial features to one "face bone", slide that bone inside the head shape, and mask the face with the head outline. Then store the turn in a Smart Bone action and move the face bone additively for unique poses. — [Lost Marble forum threads](https://lostmarble.com/forum/viewtopic.php?p=213723), [also](https://www.lostmarble.com/forum/viewtopic.php?p=217899) (search-snippet level, and which quote is in which thread was not checked)
- TV rigger practice: each mouth pose sits in its own group split into Mouth / Teeth / Tongue layers. A Head-Turn Smart Bone slides teeth and tongue for depth. Switch layers hold 3/4 views, with a separate switch for profiles. Smart Bones act only on **direct** child layers, so visemes nested in a Switch inside a bone layer did not follow the head turn. — [Lost Marble forum](https://www.lostmarble.com/forum/viewtopic.php?p=217899), [also](https://lostmarble.com/forum/viewtopic.php?p=132213) (search-snippet level)
- Hand swaps: arm/hand layers go in a Switch layer driven by a Smart Bone. Forum consensus: "define the range of views and actions you need for a given shot and build your rig to match." — [Lost Marble forum](https://lostmarble.com/forum/viewtopic.php?p=173300) (search-snippet level)

**Spine: game-side equivalents**
- Spine's feature set: mesh skinning/weights, dopesheet timing, ghosting, inverse kinematics, and "pseudo 3D effects". Runtimes exist for most engines. Spine 4.3 is the current version on the site. — [Esoteric Software homepage](https://www.esotericsoftware.com/)
- IK keeps limbs planted, e.g. feet that don't penetrate the floor during a walk or a hand that stays put while the skeleton stands up. With FK, keeping a hand fixed "takes many keys". — [Spine IK constraints](https://esotericsoftware.com/spine-ik-constraints)
- Physics constraints animate secondary motion for "hair, clothing, and other items". — [Spine physics constraints](https://esotericsoftware.com/spine-physics-constraints)

**Smears, holds, on twos**
- A smear frame simulates motion blur between keys, over **one or two frames**. There are two types: the *elongated in-between*, which distorts the subject along the path, and *multiples*, which duplicate the subject or its parts along the path. — [Wikipedia: Smear frame](https://en.wikipedia.org/wiki/Smear_frame)
- Use smears when the action is too fast to read on twos or threes. Avoid them for subtle acting or when the design must stay readable. — [Prolific Studio: smear frames](https://prolificstudio.co/blog/smear-frames/)
- Rig approaches: a sculpted smear blendshape for one frame, pose-space triggers by speed/angle, or swapping to a smear mesh for one frame and back. In replacement/stop-motion pipelines, smears need extra replacement parts planned ahead. — [GarageFarm: smear frames](https://garagefarm.net/blog/smear-frames-enhancing-motion-in-animation)
- An ETSU honors thesis built a rig where smears can be toggled and their shape and size adjusted. — [ETSU Honors thesis](https://dc.etsu.edu/honors/348)
- An academic method for automatic stylized smears exists: "SMEAR: Stylized Motion Exaggeration with ARt-direction". Only the title was seen. — [HAL](https://hal-iogs.archives-ouvertes.fr/hal-04576817v1)

### Inferences
- **Priority ranking for a puppet engine (my synthesis):**
  1. Timing & spacing: non-linear eases, varied durations, holds and moving holds.
  2. Overlapping action / drag: per-part time offsets and springs.
  3. Arcs: rotate parts around pivots and curve the root's path.
  4. Squash & stretch with area preservation, via mesh deform rather than plain uniform scale.
  5. Anticipation before every big move.
  6. Secondary action: physics on appendages, blinks, breathing.
  7. Appeal / solid drawing: break symmetry ("twins") and use drawing swaps for hands, mouth and eyes.
  8. Exaggeration: push extremes about 20-50% beyond the "natural" pose.

  Staging is mostly a camera/layout concern.
- For a **round mascot like Minuton** (stopwatch body, short limbs), the most visible wins are body squash & stretch anchored at the feet, a delayed face plate/features (drag), springy appendages (crown/button on top, arms), and lively face swaps (blinks, mouth chart, brows). Short "rubber hose" limbs map well onto a Harmony-style **curve deformer**, a bezier-bent strip, rather than two rigid bones.
- A "moving hold" in code means that during a hold the pose keeps drifting toward a slightly pushed version (about 2-5% further, ease-out over the hold), plus a small breathing sine. Never fully freeze all channels unless it's a deliberate comedic "hard hold".
- Drag/overlap in code means giving each child part either (a) a time offset of 1-4 frames behind its parent's rotation curve, or (b) a damped spring that chases its parent's target angle (see Q2).
- The Harmony Envelope trick ("rotate without swapping drawings") and the Moho face-bone-in-mask trick together make a pseudo-3D head turn for a sphere-like face. This is ideal for Minuton's round face (formula in Q2).
- **Background knowledge, not re-verified this session** (from Richard Williams, *The Animator's Survival Kit*, and common studio practice):
  - TV cut-out often keeps the character "on twos" (12 poses/s at 24 fps) for a hand-drawn feel, with fast actions on ones.
  - Camera moves and pans stay on ones, because a character on twos over a panning background strobes.
  - Holds are typically at least 6-8 frames to read, and key poses are planned with timing charts that mark spacing (halves, thirds, favouring a key).

### Gaps
- No primary source found that maps each of the 12 principles onto Harmony/Moho rig features. Toon Boom's training treats the principles as a prerequisite rather than documenting the mapping.
- No authoritative source fetched on "on twos" or stepped interpolation specifically in cut-out TV production. The Williams/practice notes above are background knowledge to verify.
- The Moho forum quotes come from search snippets, and the exact thread for each quote was not verified.

---

## Q2. Algorithms to implement (skinning, bend deformers, springs, cycles, easing, lip-sync, blinks/saccades, timing)

### Takeaway
A credible engine needs six layers:
1. A bone hierarchy with world matrices.
2. Weighted mesh skinning (linear blend skinning) on triangulated images, plus optional curve/FFD/ARAP deformers.
3. Two-bone IK with softness for planted feet and hands.
4. Exact critically damped springs for follow-through and jiggle.
5. Bezier/eased spacing with stepped "twos" sampling and moving holds.
6. Face systems: a mouth chart driven by Rhubarb-style viseme timing, and stochastic blinks and saccades with asymmetric timing.

### Cited Findings

**Linear blend skinning (exact runtime code, Spine)**
- In spine-runtimes `VertexAttachment.computeWorldVertices`, weighted vertices are the sum over bones of the bone's 2x2 world matrix applied to the vertex's bone-local position, plus the bone's world origin, times the weight:
  `wx += (vx * bone.a + vy * bone.b + bone.worldX) * weight;`
  `wy += (vx * bone.c + vy * bone.d + bone.worldY) * weight;`
  Free-form "deform" offsets (FFD keys) are added to local vertices **before** the bone transform: `vx = vertices[b] + deform[f]`. Unweighted meshes use a single bone: `x' = vx*a + vy*b + x`. — [spine-runtimes 4.2, Attachment.ts](https://github.com/EsotericSoftware/spine-runtimes/blob/4.2/spine-ts/spine-core/src/attachments/Attachment.ts)
- Spine calls this "linear blend skinning". Weights are normalized to sum to 100% per vertex. **Prune** caps bones per vertex and removes tiny weights, because each weight costs an extra vertex transform. **Auto weights** "considers the mesh topography". **Smooth** averages weights with neighbours along hull/internal edges. — [Spine user guide: Weights](https://esotericsoftware.com/spine-weights)
- Mesh design for bending: a tail should be "a long, skinny rectangle, bound to bones and weighted". Draw the image near the **centre of its bending range**, because distortion grows as it bends further. — [Spine: Weights](https://esotericsoftware.com/spine-weights)
- Godot's equivalent: `Polygon2D` with UVs bound to `Skeleton2D`/`Bone2D`, weights painted per bone (white = full weight), and a rest pose that must be reset after adding bones. Bends go wrong because of auto-generated internal triangles. The fix is to **add internal vertices in bend regions** and weight them too. "Animating the bones (NOT the polygons!) will have the desired effect." The page notes it may be outdated for Godot 4.7. — [Godot docs: 2D skeletons](https://docs.godotengine.org/en/stable/tutorials/animation/2d_skeletons.html)

**Shape deformation without a skeleton: ARAP**
- Igarashi, Moscovich & Hughes, "As-Rigid-As-Possible Shape Manipulation", ACM TOG 24(3), SIGGRAPH 2005. Input is a 2D triangle mesh plus handle vertices, with no skeleton or FFD lattice. It is a **two-step closed-form** solve: first a rotation-respecting step, then scale adjustment. Quadratic error metrics turn each step into linear systems, which are factored once at interaction start, so dragging is real-time. It "conveys a sense of shape rigidity". An implementation paper exists: Igarashi & Igarashi, "Implementing ARAP Shape Manipulation and Surface Flattening", JGT 14(1), 2009, and the project page links source code and an applet. — [Igarashi ARAP project page](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/research/rigid/)

**IK**
- Spine IK supports one bone (point at target) and two bones (child tip reaches target), but **not three or more**. For those, chain constraints or use FK. — [Spine IK constraints](https://esotericsoftware.com/spine-ik-constraints)
  - **Bend direction**: a "Positive" flag.
  - **Compress/Stretch**: scales the bone when the target is nearer or beyond reach.
  - **Softness**: "With 0 softness, IK bones may move very quickly just before the target goes out of range". Softness sets the distance before maximum reach where a slowdown starts.
  - **Mix**: blends FK and IK. Between 0 and 100% the rotation can suddenly flip, because the blend takes the shortest path.

**Springs / secondary motion**
- Naive damped spring: `a = s(g − x) + d(q − v)`, then `v += dt*a; x += dt*v`. Conversions: `d = 4 ln2 / halflife`, `s = (2π·freq)²`, damping ratio `r = d / (2√s)`, where r = 1 is critical. — [Holden, Spring-It-On / "spring-roll-call"](https://theorangeduck.com/page/spring-roll-call)
- Exact critically damped spring (framerate independent):
  ```
  y = halflife_to_damping(h)/2;  j0 = x - goal;  j1 = v + j0*y;  e = fast_negexp(y*dt)
  x = e*(j0 + j1*dt) + goal;     v = e*(v - j1*y*dt)
  ```
  with `fast_negexp(x) ≈ 1/(1 + x + 0.48x² + 0.235x³)`. Euler integration is unstable at large dt or stiffness and is not framerate independent. The exact form is branch-free and can predict future states. The article also covers **inertialization**: store the offset at a transition and decay it to zero with a spring. — [theorangeduck.com](https://theorangeduck.com/page/spring-roll-call)
- Spine physics-constraint parameters show what artists expect to tune. — [Spine physics constraints](https://esotericsoftware.com/spine-physics-constraints)
  - **Inertia**: how much bone movement transfers into the physics offset.
  - **Strength**: return force to the unconstrained pose.
  - **Damping**: reduces oscillation.
  - **Mass**: resistance to acceleration.
  - **Wind**: constant world-X force. **Gravity**: constant world-Y force.
  - **Limit**: maximum translation speed considered.
  - **Mix**: keyable influence.
  - **FPS**: fixed update rate, usually 30-60.

  Each constraint can affect translate X/Y, rotate, shear X and scale X. "Deterministic" mode recomputes from frame 0 for reproducible renders. Bone length affects motion. The page does not document the integrator.

**Lip-sync (mouth charts)**
- Rhubarb Lip Sync (open source CLI) shapes: — [Rhubarb Lip Sync README](https://github.com/DanielSWolf/rhubarb-lip-sync)
  - **A**: closed, for P/B/M.
  - **B**: slightly open, clenched teeth, for most consonants like K/S/T and EE.
  - **C**: open, for EH/AE, also an in-between.
  - **D**: wide open, for AA.
  - **E**: slightly rounded, for AO/ER, also an in-between.
  - **F**: puckered, for UW/OW/W.
  - Optional **G** (F/V, teeth on lip), **H** (long L, tongue visible) and **X** (idle/rest).

  A-F are the minimum. The README says the shapes "were invented at the Hanna-Barbera studios for shows such as Scooby-Doo and The Flintstones" and became a de facto standard. Output is TSV, XML, JSON or `dat` (Moho/OpenToonz), and Preston Blair names are available as alternative labels for `dat`. Recognizers: PocketSphinx (English only) or "Phonetic" (language-independent, less precise). This matters for French voice-over.
- Harmony's built-in auto lip-sync uses **8 phoneme drawings: A, B, C, D, E, F, G + X** (silence). Approximate mapping: A = m,b,p,h; B = s,d,j,i,k,t; C = e,a; D = A,E; E = o; F = u,oo; G = f,ph; X = silence. The letters are identifiers, not sounds. Auto-detect fills the mouth layer's drawing column with letters, so the mouth layer must contain drawings named by those letters (otherwise use the Map dialog). — [Harmony 24 docs: Animating Lip-Sync](https://docs.toonboom.com/help/harmony-24/premium/cut-out-animation/animate-lip-sync.html)

**Eyes: blinks and saccades**
- Saccade duration rises linearly with amplitude for 5°-50° saccades: duration = intercept (20-30 ms) + slope (2-2.7 ms/deg) × amplitude. — [Lee, Badler & Badler, "Eyes Alive" (UPenn PDF)](https://www.cis.upenn.edu/~badler/papers/EyesAlive.pdf)
- SmartBody exposes saccades driven by talk / listen / think behaviour models. — [SmartBody docs: Eye Saccade](https://smartbody.ict.usc.edu/HTML/documentation/SB/Eye-Saccade_8552851.html)
- Procedural blink figures (secondary tutorial source): a blink every **2-6 s**, lids **close in ~80 ms**, stay **closed 50-100 ms**, **open in ~150 ms**. Fast close plus slower open is what reads as natural. — [Abratabia: facial animation](https://abratabia.com/ai-talking-characters/facial-animation.php)
- A robot eyelid generator uses 150 ms blinks at random 2-10 s intervals and raises blink probability after saccades. This is robot-specific. — [humotion eyelid_motion_generator.cpp](https://opendata.cit-ec.de/projects/humotion/repository/revisions/b1af7a6265c1045ef5123ec937f152db4a715c49/annotate/src/server/eyelid_motion_generator.cpp)

**Walk cycles (practitioner)**
- Workflow: 24 fps, contact poses first, then in-betweens. The cycle is animated in place, and forward travel is a separate motion. The whole rig's pose is copied by copying the collapsed top peg. — [Cartooning in Toon Boom](https://animationcraft.blogspot.com/2008/02/animating-cut-out-characters-part-2.html)

### Inferences (implementation pseudo-code for the Minuton engine; my own synthesis unless marked)

**1. Bone hierarchy + LBS (follows Spine's formula above).** Each bone stores local `{x, y, rot, sx, sy, shx}`. World matrix = parent.world × local. Pre-bind each mesh vertex into each influencing bone's rest space (`v_local = inverse(bone.restWorld) * v_rest`), then each frame:
```js
for (const v of mesh.verts) {
  let wx = 0, wy = 0;
  for (const {bone, lx, ly, w} of v.influences) {   // max 2-4, weights sum to 1
    const m = bone.world;                             // {a,b,c,d,tx,ty}
    wx += (lx*m.a + ly*m.b + m.tx) * w;
    wy += (lx*m.c + ly*m.d + m.ty) * w;
  }
  out.push(wx, wy);
}
// draw triangles: WebGL drawElements with UVs; Canvas2D fallback = per-triangle affine clip+drawImage (slow, visible seams)
```
For layered ChatGPT PNGs: auto-triangulate each layer from its alpha contour (e.g. marching squares → simplify → constrained Delaunay with interior Steiner points). Following the Godot/Spine advice, add extra rows of vertices across bend zones such as the body waist, arm elbows and knees.

**2. Squash & stretch with area preservation (2D version of "constant volume").** Scale about an anchor at the feet or contact point: `sy = s, sx = 1/s`, or `sx = 1/sqrt(s)` for a softer look. Velocity-aligned stretch for jumps: `s = 1 + k*|v|` clamped to about 1.0-1.35, rotate the scale axis to `atan2(vy, vx)`, apply `(s, 1/s)`, rotate back. On landing, play a squash impulse (e.g. `s` 0.75 → 1.08 → 1.0 over about 6-8 frames, via spring). Apply it on the body mesh (FFD/lattice or bone scale with skinning), not on the face features, which should squash less ("solid drawing").

**3. Curve ("rubber hose") limb deformer, analogous to Harmony's Curve deformer.** Parameterize the limb image by `(u ∈ [0,1] along length, w across)`. Each frame, compute a cubic Bezier `B(u)` from shoulder to hand with control points derived from an elbow target. Vertex position = `B(u) + w·N(u)`, where `N` is the unit normal of `B'(u)`. Use arc-length reparameterization so the limb doesn't stretch unevenly, and optionally preserve length by solving the control-point offset. This gives curved, appealing limbs instead of two rigid segments with a patch at the elbow.

**4. Two-bone IK, analytic law of cosines (standard math, not from the Spine page).**
```js
d  = clamp(dist(root, target), |L1-L2|+eps, L1+L2-eps)
// soft IK (Spine-like behaviour; my formula, not Spine's): start slowing within `soft` of full reach
dSoft = L1+L2-soft; if (d > dSoft) d = dSoft + soft*(1 - Math.exp(-(d - dSoft)/soft))
cos2 = (d*d - L1*L1 - L2*L2)/(2*L1*L2);  a2 = bendPositive ? Math.acos(cos2) : -Math.acos(cos2)
a1 = Math.atan2(ty, tx) - Math.atan2(L2*Math.sin(a2), L1 + L2*Math.cos(a2))
```
Use it for planted feet during the walk (target = foot plant point fixed in world space for the contact phase) and for hands touching props. Blend FK/IK by interpolating **angles along the short arc with explicit unwrap** to avoid the flip Spine warns about.

**5. Springs for follow-through, jiggle and antennae (use Holden's exact critically damped spring for smoothing; use an under-damped spring for wobble).** For a wobbly crown/button or hair tuft, apply the spring per bone on its angle offset:
```js
// parent motion "kicks" the child: inertia transfers parent's world acceleration into offset velocity
const targetAngle = restAngle;                       // what the rig/keys want
vel += (-stiffness*(angle - targetAngle) - damping*vel - inertia*parentAngularAccel) * dt;
angle += vel*dt;     // fixed-step at 60 Hz with accumulator, like Spine's FPS param
```
Spine's parameter set (inertia, strength, damping, mass, gravity, wind, mix, fixed FPS, deterministic reset) is a good public API to copy. For deterministic video rendering, always simulate from frame 0 at a fixed step, like Spine's "Deterministic" option. Use damping ratio about 0.3-0.6 for jiggle and 1.0 for drag/smoothing. Chain springs (tip follows mid follows root) to get overlapping action on longer appendages.

**6. Overlap without physics.** Per-part delay: `childPose(t) = keyedPose(t - k*frameDur)`, with k = 1-3 frames for hands vs forearm and 2-4 for the face plate vs the body. Cheap and very effective. Combine it with springs only where wobble is wanted.

**7. Easing / spacing.**
- Use cubic-Bezier easing curves `P0=(0,0), P1, P2, P3=(1,1)`, solving `x(t)=time` by Newton/bisection as CSS does. Common sets: ease-in-out (0.42,0,0.58,1) and "anticipation/overshoot" curves where P1.y < 0 or P2.y > 1.
- Better still, express spacing like an animator's **timing chart**: a key-to-key list of fractions, e.g. slow-out `[0, .04, .14, .3, .52, .74, .9, 1]`, rather than one global curve.
- Never use linear interpolation for character channels (see the Zedrin quote above).
- Give each channel its own timing: rotation leads, translation follows 1-2 frames later, and the face follows last.

**8. "On twos" + mixed timing.** Sample the rig at `frame = floor(t*24)`. For character channels use `f2 = frame - (frame % 2)` (stepped), but keep camera and background moves on ones, and switch the character to ones for fast actions. Add **smears** as a one-frame swap: a stretched body mesh along the motion vector, or "multiples" ghost copies at the previous 2-3 positions with decreasing alpha.

**9. Procedural vs keyed cycles.** Keyed is better for the main body poses (contact / down / passing / up); procedural is better for layers on top. Recommended hybrid:
- Keep the cycle in place, with root translation = stride length / (frames per step) so feet don't slide. Verify by locking the planted foot with IK.
- Add procedural vertical bob `y = A·|sin(π·phase)|`-style with **two bobs per cycle** (down on contact/recoil, up on passing) and body tilt.
- Add spring-driven arm and appendage follow-through, plus random blink and saccade layers.
- Break symmetry: different arm amplitudes and phase offsets about 5-10% to avoid "twins".

**10. Lip-sync pipeline.**
- Generate the audio, then run Rhubarb with `--recognizer phonetic` for French. It outputs `(time, A..X)` cues mapped to mouth drawings.
- Snap to twos, enforce a minimum exposure of 2 frames, and drop 1-frame shapes except closures (A/MBP), which must read.
- Anticipate by 1-2 frames (mouth shapes slightly before the sound reads better). This is common practice, not verified this session.
- Use a closed mouth by default (X/A). Move the jaw/body subtly on stressed syllables.

**11. Blinks and saccades.**
- Schedule blinks with a random interval of 2-6 s (Poisson/jitter). At 24 fps, the 80/50-100/150 ms figures convert to about **close 2 frames, closed 1-2 frames, open 3-4 frames** (my arithmetic). Use lid drawing swaps, e.g. open → half → closed → half → open.
- Add double-blinks occasionally and trigger a blink with head turns and big saccades.
- Saccade duration (ms) = 25 + 2.4×amplitude°. That is about 1-2 frames, so pupils should **snap** (1-frame move) and then hold for 0.5-3 s fixations, not glide.
- For a round face, convert pupil offset to sphere parallax: `x = R·sin(θ)`, with features scaled `cos(θ)` near the rim (pseudo-3D head turn, cf. the Harmony Envelope and Moho face-bone-in-mask techniques).

### Gaps
- The Spine page does not document its physics integrator. The pseudo-code above is my design matching Spine's public parameter names, not Spine's code. Verify against `PhysicsConstraint` in spine-runtimes 4.2 if fidelity matters.
- Spine's exact "softness" IK formula was not retrieved. The exponential soft-IK formula above is a common alternative, not Spine's.
- Godot 4's `SkeletonModification2D` (CCDIK/FABRIK/TwoBoneIK/Jiggle) is not covered on the fetched Godot page, so its current status in 4.7 was not verified.
- The Preston Blair 10-shape set used by Moho/Papagayo (commonly AI, E, O, U, etc, L, WQ, MBP, FV, rest) was not fetched this session. It is only referenced indirectly via Rhubarb's "Preston Blair names" option.
- Primary blink physiology studies (as opposed to tutorial figures) were not fetched. The 80/150 ms numbers come from a secondary tutorial.
- No GDC talk on 2D skeletal animation was retrieved within the budget.

---

## Q3. Typical drawing/swap counts for a production cut-out character

### Takeaway
Hard production counts are rarely published because studios treat rigs as trade secrets. Documented anchors:
- Mouth chart: **6 minimum (A-F), 8-9 typical (A-G + X, optionally H)**.
- Turnaround: **5 poses** in a 180° turn (front, 3/4, profile, 3/4 back, back), with front-to-3/4 views most used in TV.
- Hands: **"over a hundred"** swaps on some TV shows, and riggers draw "hundreds" of hands and feet.
- Hobby/pro freelance rigs: about **16 mouths and 30-35+ hands**.

### Cited Findings
- Harmony's lip-sync standard is 8 mouth drawings (A-G + X). — [Harmony 24 docs: Animating Lip-Sync](https://docs.toonboom.com/help/harmony-24/premium/cut-out-animation/animate-lip-sync.html)
- Rhubarb: 6 basic shapes (A-F) are the minimum. G, H and X are optional extended shapes, for 9 total. — [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync)
- Toon Boom's Punk training rig is built from "five poses of the turnaround" covering a 180-degree turn. "The front to three-quarter front angles" matter most for TV, and profile/back can be drawn separately if time is short. Hair is built as separate tufts numbered through the turn. — [Toon Boom: Punk rig (Matt Watts)](https://www.toonboom.com/?p=11879)
- On hands: riggers often draw "hundreds of original hands and feet" not in the turnarounds. Some TV shows have "over a hundred swaps for the hands". The suggested naming encodes the view angle, e.g. `default_000, default_090, default_180, default_270`, with padding for in-betweens like `default_022`. — [Toon Boom: Punk rig](https://www.toonboom.com/?p=11879)
- Rig building time: props take "a few hours", characters "a few days to weeks". Large studios may have "as many as 30 rigging artists". — [Toon Boom: Punk rig](https://www.toonboom.com/?p=11879)
- Hobbyist/free rigs advertise e.g. 16 mouth shapes + 34 hands (a Sonic fan rig) or 35+ hand poses. These are not production figures. — [Gumroad: Sonic free rig](https://pedrocabral.gumroad.com/l/sonic-free-rig); [Gumroad: BlankGuy rig](https://juhastv.gumroad.com/l/BlankGuy)
- Studio pipelines keep a shared **library** of rigged character and prop templates for all animators. — [Toon Boom Learn: Cut-out animation workflow](https://learn.toonboom.com/modules/animation-workflow/topic/cut-out-animation-workflow)

### Inferences
- **Minimum viable Minuton library (my recommendation, scaled down from the production anchors above):**
  - **Mouth**: 9 drawings (Rhubarb A-H + X) plus 3-4 emotion mouths (big smile, frown, "O" shock, grit).
  - **Eyes**: open / half / closed / happy-closed "^ ^" / angry / wide, about 6 lid states. Pupils are a separate layer moved procedurally.
  - **Brows**: 3-5 drawings, or one curve-deformed brow.
  - **Hands**: 8-12 poses (relaxed, fist, point, open palm, thumbs-up, wave, grab, peace), each ideally in 2 views.
  - **Body/head views**: front + 3/4 left (mirror for right, but break symmetry in details) + profile, plus one "smear" body drawing.
  - **Feet**: flat, toe-off, heel-contact.
- Generate each swap set in one image-generation pass (one sheet per set) so line weight and colours stay consistent, then slice. A matched-style mouth chart matters more than the count.
- Name swaps by convention (`mouth_A`, `hand_point_000`) so a script can auto-map Rhubarb output, as Harmony's Detect/Map does.

### Gaps
- No primary production breakdown (asset sheet) for a named TV cut-out show (e.g. Puffin Rock, Kick Buttowski, Rick and Morty) was found with actual counts of mouths/hands/head views. The figures above are training-rig and practitioner statements.

---

## Q4. High-quality cut-out productions and common pitfalls that make cut-out look cheap

### Takeaway
Long-running TV series show that cut-out holds up at broadcast quality when rigs carry many swaps and deformers and animators still key full-body poses with good timing. Documented examples:
- **Moho**: Cartoon Saloon's *Puffin Rock*, Mechtalёt's *Back to Back*, CUB Animation's *A Door to Othertown*.
- **Harmony**: Mercury Filmworks' *Kick Buttowski*, plus numerous Harmony TV rigs.
- **Games**: Spine-based characters.

Cheapness comes from linear in-betweens, moving one part at a time, symmetric "twin" poses, rigid segmented limbs with visible joints and constant lengths, sliding feet, IK snaps/flips, over-stretched meshes, and frozen holds.

### Cited Findings

**Productions**
- *Puffin Rock* (Cartoon Saloon, Ireland): 78 × 7-minute episodes with a Moho-centered pipeline. — Lost Marble sources from search snippets: [Studio Visits blog](https://lostmarble.com/blog/2017/02/24/studio-visits), [forum: Professionally Used](https://www.lostmarble.com/forum/viewtopic.php?p=176439). The exact page carrying the 78×7 figure was not fetched.
- *Back to Back* (Mechtalёt, Russia): 52 episodes, released in 28 countries, made in Moho. The art director says "Moho allows us to create animation very quickly without sacrificing quality". — [Moho blog](https://moho.lostmarble.com/blogs/news/moho-allows-us-to-create-animation-very-quickly-without-sacrificing-quality-andrey-tkachev-art-director-of-back-to-back)
- *A Door to Othertown* (CUB Animation, Hungary): 13 × ~7-minute episodes in Moho. — [Moho featured artist: CUB Animation](https://moho.lostmarble.com/blogs/news/moho-featured-artist-cub-animation)
- *Cuéntame un cuento* (Novasur, Chile, 2016, 15 episodes) and *Low Season* (13 × 11 min) are listed as made with Moho. — [AnimeStudioTutor: Cuéntame un cuento](https://www.animestudiotutor.com/made_with_moho/tv_shows/cuentame_un_cuento); [Low Season](https://www.animestudiotutor.com/made_with_moho/tv_shows/low_season)
- *Kick Buttowski* (Mercury Filmworks) was produced in Toon Boom with layered mouth rigs. — [Toon Boom forum](https://forums.toonboom.com/t/kick-buttowski/2732)
- The Punk-rig article cites The Loud House, Dexter's Lab, The Fairly OddParents and Kim Possible as **turnaround-style references**. This does not establish that they are cut-out productions. — [Toon Boom: Punk rig](https://www.toonboom.com/?p=11879)
- Spine is aimed at games ("efficient workflow both for creating amazing animation and for integrating it into your games") with runtimes for most engines. — [Esoteric Software](https://www.esotericsoftware.com/); tutorial: [Kodeco Spine tutorial](https://kodeco.com/2589-2d-skeletal-animation-with-spine-tutorial)

**Pitfalls (each sourced)**
- Linear A-to-B eases look "stiff and mechanical". — [Zedrin tutorial transcript](https://www.theponyarchive.com/archive/youtube/UCKbbOCogtCId3zHCiUIm5Bg/TUTORIAL_7_Tips_for_Smoother_Animation-Zedrin-20171202-youtube-1920x1080-yVcZXW80GKA.en.vtt)
- Segmented limbs with joint patches and constant limb lengths look stiff. — [Toon Boom forum](https://forums.toonboom.com/t/cutout-animation/2300)
- Moving one part without adjusting the whole pose looks stiff. — [Adobe community](https://community.adobe.com/t5/animate-discussions/animation-looks-stiff/td-p/14573269)
- Mirror-symmetric "twins" poses look lifeless. — [Wikipedia: 12 principles](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)
- Patterns or designs drawn across elbow/knee joints break when the joints bend. — [Toon Boom: Punk rig](https://www.toonboom.com/?p=11879)
- Overbuilt rigs are "really heavy for the computer to process", so build only what the shots need. — [Toon Boom: Punk rig](https://www.toonboom.com/?p=11879); same advice from [Lost Marble forum](https://lostmarble.com/forum/viewtopic.php?p=173300)
- IK with 0 softness snaps near full extension, and partial IK mix can flip rotation. — [Spine IK](https://esotericsoftware.com/spine-ik-constraints)
- Meshes distort more the further they bend from the drawn rest pose. Bends without internal vertices fold badly. — [Spine Weights](https://esotericsoftware.com/spine-weights); [Godot 2D skeletons](https://docs.godotengine.org/en/stable/tutorials/animation/2d_skeletons.html)
- Mixing deformers and IK without a clean peg/pivot hierarchy causes pivot jumps. — [Toon Boom forum](https://forums.toonboom.com/t/is-it-possible-to-make-ik-style-cutout-rigs-with-envelope-deformers/14888)
- Euler-integrated springs explode or change with frame rate. — [theorangeduck](https://theorangeduck.com/page/spring-roll-call)
- Smears used in subtle acting hurt readability. — [Prolific](https://prolificstudio.co/blog/smear-frames/)
- A non-closed default mouth makes resets and lip-sync awkward. — [Toon Boom: Punk rig](https://www.toonboom.com/?p=11879)
- Holds where nothing moves look lifeless, which is what moving holds fix. — [Wikipedia: 12 principles](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)

### Inferences
- **Checklist for the Minuton agent (my synthesis of the above):**
  1. Never lerp. Use per-channel easing or spacing charts.
  2. Every action gets anticipation (opposite direction, about 4-8 frames) → action (fast, possibly a smear) → overshoot → settle (spring).
  3. Offset children 1-3 frames (drag).
  4. Squash/stretch the body with area preservation, anchored at the feet.
  5. Keep feet planted with IK and match root speed to stride.
  6. Use moving holds, never frozen frames, plus blinks every 2-6 s and pupil snaps.
  7. Break symmetry in every pose and cycle.
  8. Use drawing swaps for hands, mouth, eyes and brows instead of only rotating the same PNG.
  9. Put the character on twos and the camera on ones.
  10. Add one or two frame-by-frame-like swaps per shot (smear, special expression) to mask the puppet feel, as the Synfig forum suggests.
- An LLM agent will tend to pick round-number durations, linear tweens and symmetric motion. The engine should therefore encode these rules as defaults (preset eases, automatic overlap offsets, automatic blink/saccade/breath layers) rather than rely on per-shot prompting.
- AI-generated layered PNGs often lack hidden overlap areas (e.g. the shoulder under the arm, the face behind the mouth). Each part must be generated with **extra overlap/bleed** past the joint, otherwise rotations reveal gaps. This is why studios use patches (Toon Boom forum) or single-drawing limbs with Bone/Curve deformers (Harmony docs).

### Gaps
- Spine use in specific games (e.g. *Darkest Dungeon*, *Cult of the Lamb*, *Slay the Spire*) is widely reported, but the search did not return a confirming source. Not cited.
- Vanillaware (*Odin Sphere*, *Dragon's Crown*, *13 Sentinels*), often cited as the high end of 2D puppet animation in games: no source describing its pipeline was found.
- Rick and Morty / Bob's Burgers / The Simpsons production methods in Harmony (cut-out vs hand-drawn paperless) were not verified this session and should not be stated without a source.
- No GDC talk (e.g. on UbiArt Framework / Rayman Origins-Legends puppet animation) was retrieved within budget.
