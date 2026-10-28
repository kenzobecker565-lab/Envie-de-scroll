# From AI still images (ChatGPT / GPT Image) to 2D puppets or frame-by-frame animation, with no AI video model: layer decomposition, hidden-area fill, auto-rigging, prompting, interpolation (headless Linux, state as of Oct 2026)

Research date: 2026-10-28. Scope: tools a coding agent can run headless on Linux, free or low cost, with licenses noted. **NC** marks a non-commercial or otherwise restrictive license. **VIDEO-MODEL** marks a tool built on a video diffusion model, which this project's "no AI video generation" rule excludes.

Method caveat: GitHub's API was blocked from this sandbox. I read licenses from raw `LICENSE` files on raw.githubusercontent.com where possible, and otherwise from READMEs and model cards fetched with a summarizing web fetcher. Treat star counts and dates as approximate.

---

## (a) Layer decomposition and segmentation: turning one flat AI illustration of a cartoon character into separate parts

### Takeaway
There are two families of tools.
- **Cut-out tools** (SAM 2 or SAM 3, BiRefNet via rembg, `isnet-anime`) are mature, CLI-friendly and permissively licensed. They give clean masks but never invent the hidden pixels behind a part.
- **Full layer decomposers** do produce complete RGBA layers, hidden regions included. Qwen-Image-Layered is general purpose (Apache-2.0, 20B, GPU-heavy). See-through is anime-specific (Apache-2.0 code, OpenRAIL++ weights, 12–16 GB VRAM, outputs a PSD). Neither is validated on round, non-human mascots.

For a simple mascot, the most reliable route is usually to have the image generator draw the parts separately (see section d) and keep segmentation for cleanup.

### Cited Findings

#### Full layer decomposition (one image in, several RGBA layers out)
- **Qwen-Image-Layered** (Alibaba Qwen), arXiv 2512.15603, submitted 17 Dec 2025. It is "an end-to-end diffusion model that decomposes a single RGB image into multiple semantically disentangled RGBA layers", and each layer "can be independently manipulated without affecting other content". It supports variable-length decomposition, and its training data was extracted from PSD files. — [arXiv abstract](https://arxiv.org/abs/2512.15603)
- Qwen-Image-Layered practical details:
  - License: Apache 2.0. Diffusers pipeline `QwenImageLayeredPipeline.from_pretrained("Qwen/Qwen-Image-Layered")`, with example settings `layers: 4`, `resolution: 640`, `num_inference_steps: 50`, `true_cfg_scale: 4.0`.
  - Resolution buckets are 640 and 1024, and "for this version, 640 is recommended".
  - The model is 20B parameters in BF16. The card shows 3- and 8-layer examples and recursive decomposition: any layer can be decomposed again.
  - No VRAM figure is published.
  - — [Hugging Face model card](https://huggingface.co/Qwen/Qwen-Image-Layered); [GitHub](https://github.com/QwenLM/Qwen-Image-Layered)
- The released Qwen-Image-Layered weights are fine-tuned for image-to-multi-RGBA decomposition, and their text-to-multi-RGBA generation is "limited". The model is also hosted on Replicate, an option when no local GPU is available. — [search summary of the HF card / Runware mirror](https://huggingface.co/Runware/Qwen-Image-Layered/blob/main/README.md); [Replicate](https://replicate.com/qwen/qwen-image-layered); [ComfyUI tutorial](https://docs.comfy.org/tutorials/image/qwen/qwen-image-layered)
- Competitor papers from 2026 report weaknesses in Qwen-Image-Layered's occlusion handling. These claims come from rivals using their own benchmarks.
  - RevealLayer (arXiv 2605.11818) says it "suffers from background artifacts and incomplete foregrounds".
  - MRT (arXiv 2605.27235) lists occluded-layer completion and background inpainting under severe occlusion as open problems. It reports Qwen-Image-Layered at PSNR 22.18 vs 25.72 for MRT on 16–32 layers.
  - PixelART (arXiv 2609.22789) is another 2026 image-to-layer paper.
  - — [RevealLayer](https://arxiv.org/pdf/2605.11818); [MRT](https://arxiv.org/pdf/2605.27235); [PixelART](https://arxiv.org/pdf/2609.22789)
- **See-through** (arXiv 2602.03749, Feb 2026; listed as SIGGRAPH 2026): "Single-image Layer Decomposition for Anime Characters". It splits one illustration into "4-channel, inpainted, semantically distinct body part layers" (19 in the paper, "up to 23" in the repo) and infers draw order from a per-layer pseudo-depth map.
  - Supervision comes from commercial Live2D models (ArtMesh visibility masks and draw order).
  - Components: SDXL plus a LayerDiffusion transparency decoder, SAM-HQ fine-tuned into a 19-decoder part segmenter, Marigold for depth, and LaMa for inpainting strata.
  - Runtime is about 74 s per 1024² image, plus about 10 s for depth on one RTX 4090.
  - — [arXiv HTML](https://arxiv.org/html/2602.03749v1)
- See-through limitations stated in the paper:
  - Predicted layers sometimes overlap outside the body.
  - Depth stratification "is difficult to split into multiple stable sublayers".
  - The transparency decoder can attenuate fine hatching.
  - Artists reported "AI-like" texture patterns and asked for finer splits, such as separate left and right arms.
  - Training and evaluation cover only Live2D-style anime characters. Chibi or non-human characters are not addressed.
  - — [arXiv HTML](https://arxiv.org/html/2602.03749v1)
- See-through code and CLI ([GitHub shitagaki-lab/see-through](https://github.com/shitagaki-lab/see-through)):
  - Apache-2.0. Requires Python 3.12 and PyTorch 2.8 with CUDA 12.8, with a ROCm path available.
  - Main script: `inference/scripts/inference_psd.py --srcp <img|folder> --save_to_psd`, writing to `workspace/layerdiff_output/`.
  - About 12–16 GB VRAM at 1280 px in bf16. Group offload brings this to about 10 GB, and the NF4 / block-swap scripts to about 8 GB.
  - Output is a layered PSD plus depth maps and masks. `heuristic_partseg.py` can split an existing PSD by depth or left/right.
  - The README says it is not Image-to-Live2D "at least, not yet", and that it does no rigging.
  - Its Marigold depth model is "fine-tuned for anime".
- See-through weights are licensed **OpenRAIL++**. The model cards state "Commercial use is permitted", but the use-based restrictions in Attachment A apply to every use and must be passed on if you redistribute or host the weights.
  - The LayerDiff-3D weights are derived from Animagine XL 4.0, itself an SDXL fine-tune.
  - The depth weights are fine-tuned from Marigold Depth v1.1, which is built on SD2.
  - — [LayerDiff3D card](https://huggingface.co/layerdifforg/seethroughv0.0.2_layerdiff3d); [Marigold card](https://huggingface.co/24yearsold/seethroughv0.0.1_marigold)
- See-through has a third-party MIT-licensed ComfyUI wrapper. Per a blog, code was released in late March 2026. — [ComfyUI-See-through](https://github.com/jtydhr88/ComfyUI-See-through); [lilting.ch write-up](https://lilting.ch/en/articles/see-through-anime-layer-decomposition)
- **LayerDiffuse** (lllyasviel, Apache-2.0) does "Transparent Image Layer Diffusion using Latent Transparency". It generates transparent images, but it is not a decomposer for existing flat images.
  - Its pure-diffusers CLI repo implements SDXL transparent text-to-image and image-to-image, plus "RGB padding". RGB padding fills the invisible pixels of a transparent PNG with smooth colours, which is useful for clean edges when deforming parts.
  - It needs 8 GB of NVIDIA VRAM, and the "SDXL layer system" (fg/bg layering) was still listed as TODO in that repo.
  - — [LayerDiffuse](https://github.com/lllyasviel/LayerDiffuse); [LayerDiffuse_DiffusersCLI README](https://github.com/lllyasviel/LayerDiffuse_DiffusersCLI)

#### Segmentation and cut-out (masks only; hidden pixels are not invented)
- **SAM 2**: Apache-2.0 (LICENSE file). — [sam2 LICENSE](https://raw.githubusercontent.com/facebookresearch/sam2/main/LICENSE)
- **SAM 3** adds open-vocabulary concept segmentation: it can "exhaustively segment all instances of an open-vocabulary concept specified by a short text phrase" (or by exemplars). It has 848M parameters.
  - Python usage: `build_sam3_image_model()` → `Sam3Processor` → `set_image` → `set_text_prompt(...)`, which returns masks, boxes and scores.
  - Requires Python ≥3.12, PyTorch ≥2.7 and CUDA ≥12.6. Checkpoints are **gated on Hugging Face**.
  - SAM 3.1 (Object Multiplex) was released 27 Mar 2026.
  - — [facebookresearch/sam3](https://github.com/facebookresearch/sam3)
- The SAM 3 license is the custom **"SAM License"** (last updated 19 Nov 2025). It grants a "non-exclusive, worldwide, non-transferable and royalty-free limited license… to use, reproduce, distribute, copy, create derivative works". It has no non-commercial clause, but it adds trade-control and ITAR/military use restrictions and a patent-litigation termination clause. — [SAM 3 LICENSE](https://raw.githubusercontent.com/facebookresearch/sam3/main/LICENSE)
- **BiRefNet** is MIT-licensed (LICENSE file). — [BiRefNet LICENSE](https://raw.githubusercontent.com/ZhengPeng7/BiRefNet/main/LICENSE)
- **rembg** is MIT, but model weights "carry their own licenses".
  - Models: `u2net`, `isnet-anime` ("A high-accuracy segmentation for anime character"), `sam` (point prompts via `-x`), the `birefnet-*` family, and the default `bria-rmbg`, which is **NC: a paid agreement is required for commercial use**.
  - CLI: `rembg i -m isnet-anime in.png out.png`; batch with `rembg p in_dir out_dir`; mask-only with `-om`; binary mask with `-ppm`; colour decontamination with `-dc`.
  - GPU via `rembg[gpu]` (onnxruntime-gpu).
  - — [rembg README](https://github.com/danielgatis/rembg)
- **Live2D** has no AI auto-separation in Cubism 5.3, whose release notes cover Blend Mode / Offscreen Drawing and brushes.
  - The separate "Material Separation Photoshop Plugin" does "semi-automatic cutting out, color filling, and transparency filling" and requires a **Cubism PRO license** (Photoshop add-on).
  - Cubism 5.1 added AI auto-generation of sway/physics, not part separation.
  - — [Material Separation plugin](https://docs.live2d.com/en/cubism-editor-manual/material-separation-ps-plugin-download); [What's New in 5.3](https://docs.live2d.com/en/cubism-editor-manual/new-function5-3/); [Automaton on 5.1](https://automaton-media.com/articles/newsjp/20240730-303793/)
- Cubism Editor officially supports only Windows 10/11 and macOS 13–26. Linux works only unofficially through Wine/DXVK. — [Live2D requirements](https://www.live2d.com/en/?p=9210); [community Linux thread](https://community.live2d.com/discussion/1207/support-for-linux)
- A third-party tool, "anysplit", targets layer separation and hidden-area prep for Live2D artists. — [Live2D community post](https://community.live2d.com/discussion/2379/seeking-feedback-on-layer-prep-tool-for-live2d-setup)

### Inferences
- For a **round non-human mascot** (body blob, eyes, mouth, small limbs), See-through is likely a poor fit: it is trained on Live2D anime humans and its part taxonomy is human (hair, face, topwear and so on). Qwen-Image-Layered is general purpose, but it decides the layer semantics itself and is reported to leave artifacts in occluded areas. Both need a ≥10–24 GB GPU or a hosted API.
- Cheapest robust headless route:
  1. Generate a clean base on a transparent background.
  2. Use SAM 3 text prompts ("left arm", "mouth") or SAM 2 point prompts to cut parts.
  3. Fill the holes per section (b).
  4. Better still, have GPT Image produce each part as its own transparent asset, registered to the base (section d).
- Use rembg `isnet-anime` or `birefnet-general` for the silhouette alpha, not `bria-rmbg`, because of its commercial-use restriction.
- See-through's PSD output can be parsed with `psd-tools` (Python) and fed to any rig. Its Apache-2.0 code and OpenRAIL++ weights allow commercial use subject to the use-based restrictions.

### Gaps
- No published evaluation of Qwen-Image-Layered or See-through on simple flat-colour mascots or non-human characters. This must be tested empirically.
- No VRAM figure published for Qwen-Image-Layered (20B), and no independently verified local runtime.
- SAM-HQ part-segmenter weights for See-through (`24yearsold/l2d_sam_iter2`): license not checked.
- RevealLayer, MRT and PixelART: code and weight availability and licenses not checked.

---

## (b) Inpainting hidden regions under limbs and face

### Takeaway
- **OpenCV Telea/NS** (built into OpenCV) is fine for thin slivers and seams.
- **LaMa** (Apache-2.0; usable headless through the archived but pip-installable IOPaint CLI, which also has an `anime-lama` variant) is the standard free tool for large flat-colour holes.
- **GPT Image masked edits** can invent plausible hidden anatomy in the same style. However, OpenAI states the mask is only guidance, so the agent must composite only the masked pixels back onto the untouched original to keep alignment.

### Cited Findings
- **OpenCV**: `cv2.inpaint(src, inpaintMask, inpaintRadius, flags)` with `cv2.INPAINT_TELEA` (Telea 2004, fast marching method) or `cv2.INPAINT_NS` (Bertalmío et al. 2001, Navier-Stokes-like). Non-zero mask pixels mark the area to fill, and tutorials use radius 3.
  - In LearnOpenCV's informal tests, "INPAINT_NS produced better results… and the speed was also marginally better".
  - — [LearnOpenCV inpainting](https://learnopencv.com/image-inpainting-with-opencv-c-python/); [OpenCV 4.3 tutorial](https://docs.opencv.org/4.3.0/df/d3d/tutorial_py_inpainting.html)
- **LaMa** ("Resolution-Robust Large Mask Inpainting with Fourier Convolutions", WACV 2022) uses fast Fourier convolutions for an image-wide receptive field and is trained with large masks. Trained at 256×256, it generalizes to higher resolutions. — [CVF open access](https://openaccess.thecvf.com/content/WACV2022/html/Suvorov_Resolution-Robust_Large_Mask_Inpainting_With_Fourier_Convolutions_WACV_2022_paper.html)
- LaMa code is Apache-2.0 (LICENSE file). — [lama LICENSE](https://raw.githubusercontent.com/advimman/lama/main/LICENSE)
- **IOPaint** (formerly lama-cleaner) is Apache-2.0, **archived on 13 Aug 2025** (read-only).
  - Batch CLI: `iopaint run --model=lama --device=cpu --image=<img_dir> --mask=<mask_dir> --output=<out_dir>`. A single mask file is applied to all images.
  - Plugins include RemoveBG, Anime Segmentation and Segment Anything.
  - — [IOPaint README](https://github.com/Sanster/IOPaint)
- IOPaint ships `anime-lama`, a LaMa fine-tuned for anime and manga (from dreMaz/AnimeMangaInpainting), selected with `--model=anime-lama`. — [IOPaint lama.py](https://huggingface.co/spaces/tom12112/IOPaint/blob/main/iopaint/model/lama.py); [IOPaint 1.5.0 release mirror](https://www.sourceforge.net/projects/lama-cleaner.mirror/files/iopaint-1.5.0)
- The See-through paper itself uses LaMa to inpaint depth strata, and a diffusion model to hallucinate the occluded body-part regions. — [See-through arXiv](https://arxiv.org/html/2602.03749v1)
- **GPT Image masked edits**, per the OpenAI docs fetched 2026-10-28:
  - "The image to edit and mask must be of the same format and size (less than 50MB in size)." "The mask image must also contain an alpha channel."
  - "If you provide multiple input images, the mask will be applied to the first image."
  - Critically: "Masking with GPT Image is entirely prompt-based… The model uses the mask as guidance, but may not follow its exact shape with complete precision."
  - — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- OpenAI's prompting guide: "If a region must remain pixel-identical, composite the approved edit into the original image instead of relying on prompting alone." Also: "Repeated edits can still change details you intended to preserve." — [OpenAI image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)
- `input_fidelity` (`low`/`high`) controls how strongly input details are preserved on gpt-image-1, 1.5 and 1-mini. On gpt-image-2, "omit this parameter; the API doesn't allow changing it", because inputs are always high fidelity. — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation); [OpenAI image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)
- A community report found `input_fidelity=high` still produced inconsistent characters through the API (anecdotal). — [OpenAI community thread](https://community.openai.com/t/inconsistent-character-images-despite-input-fidelity-high/1354610)
- LayerDiffuse's "RGB padding" fills invisible pixels of a transparent PNG with smooth, continuous colours. This prevents dark or white fringes when parts are scaled or rotated. — [LayerDiffuse_DiffusersCLI](https://github.com/lllyasviel/LayerDiffuse_DiffusersCLI)

### Inferences
- Recommended hybrid for a flat cartoon:
  1. Cut the part (for example an arm) with SAM, dilating the mask a few pixels to swallow the outline.
  2. Fill the hole in the body layer with LaMa or anime-lama. Flat-colour fills are usually convincing. For a missing outline segment, a GPT Image masked edit is better, or redraw the outline with a contour step.
  3. Composite the generated pixels back **only inside the mask** onto the original, so the rest stays pixel-identical. This is required because GPT Image masks are not exact.
- Consistency risk: each GPT Image edit may shift line weight or palette slightly. Run colour matching (section d) and a pixel-diff check outside the mask to detect drift.
- Prefer having the generator produce a "body without arms" variant at the outset. Hidden areas are then drawn by the same model in the same style, rather than inpainted afterwards.

### Gaps
- No benchmark found comparing LaMa vs anime-lama vs GPT Image edits on flat-colour cartoon occlusions.
- Mask behaviour of the newest GPT Image 2.5 models (Sunburst/Flare) is not documented beyond the general "mask is guidance" statement. The docs fetch did not show whether `input_fidelity` exists for 2.5.
- The license of the anime-lama weights (dreMaz/AnimeMangaInpainting) was not verified.

---

## (c) Auto-rigging of drawings, and what works for a round non-human character

### Takeaway
Meta's **Animated Drawings** is the only fully open-source, scriptable "drawing → rig → BVH retarget" pipeline. It is MIT-licensed but **archived since 3 Sep 2025**, pinned to Python 3.8, and designed for human-like figures. It can be bent to other skeletons through config files.

The commercial puppet tools (Live2D Cubism, Adobe Character Animator, Spine) are GUI-centric:
- Live2D and Character Animator have no Linux build and no automation API.
- Spine has a real CLI for export, but meshes need the paid Professional tier.
- DragonBones is abandoned.

For a round, mostly limbless mascot, the most robust headless solution is a home-made cut-out rig: layered PNGs plus transforms, ARAP or mesh warp for squash and stretch, and sprite swaps for eyes and mouth, rendered with Python or Blender in background mode.

### Cited Findings
- **Animated Drawings** ([GitHub](https://github.com/facebookresearch/AnimatedDrawings)):
  - Status and license: archived 3 Sep 2025. Code, weights and the Amateur Drawings Dataset are MIT.
  - Install: Python 3.8.13 conda env; tested on macOS 13 and Ubuntu 18.04. Headless rendering is enabled with `USE_MESA: True` in the config's `view` section.
  - Segmentation and pose come from detector and pose models served by TorchServe in Docker (ports 8080/8081, about 16 GB RAM).
  - Running `python image_to_animation.py drawing.png out_dir` produces `video.gif`, `mask.png`, `texture.png` and `char_cfg.yaml`.
  - Fixing annotations: joints can be fixed in a local web UI (`fix_annotations.py`) and `mask.png` edited by hand, then re-rendered with `annotations_to_animation.py`.
  - Motion: any BVH clip works, given matching motion and retarget configs; Rokoko exports need the Mixamo skeleton preset.
  - Outputs: MP4, transparent GIF, optional background.
  - Skeleton limits: "Our method is primarily designed with these human-like characters in mind." Other skeletons are possible by editing the character and retarget configs, for example `six_arms_example.yaml`, `four_legs_example.yaml` and an `examples/quadruped` folder.
- The method is described in Smith et al., "A Method for Animating Children's Drawings of the Human Figure", ACM TOG 2023. It includes a twisted-perspective retargeting technique, and the dataset was collected from a public demo used by millions. — [arXiv 2303.12741](https://arxiv.org/pdf/2303.12741); [MIT DSpace](https://dspace.mit.edu/handle/1721.1/150815)
- **Spine** (Esoteric Software):
  - "Mesh attachments are not available in Spine Essential", so the paid Professional tier is needed for deformation.
  - `Trace` "creates a mesh hull automatically" from opaque pixels, with Detail, Concavity, Refinement, Alpha threshold and Padding settings. `Generate` "adds new vertices… at positions that will benefit deformation the most".
  - "Most or all deformation should be done using weights."
  - — [Spine meshes](https://esotericsoftware.com/spine-meshes)
- Spine CLI: `./Spine.sh -i project.spine -o out/ -e binary+pack` (Linux) handles export, atlas packing, import and clean-up. "Most CLI parameters can be used headless", but "to export images or video an OS windowing system and OpenGL are required". The CLI page does not state which license is required. — [Spine CLI](https://esotericsoftware.com/spine-command-line-interface)
- **Adobe Character Animator**: the system requirements pages list only Windows and macOS. Scripting and SDK support remains a user feature request, with no API found. — [system requirements](https://helpx.adobe.com/ae_en/adobe-character-animator/system-requirements.html); [Adobe community request](https://community.adobe.com/feature-requests-572/i-want-to-create-scripts-to-character-animator-is-it-possible-1428430)
- **Live2D Cubism**: Windows and macOS only (see section a). Its AI features are physics/sway generation (5.1) and a semi-automatic material separation plugin for PRO users, not auto-rigging. — [Live2D requirements](https://www.live2d.com/en/?p=9210); [Automaton on 5.1](https://automaton-media.com/articles/newsjp/20240730-303793/)
- **DragonBones**: listed as discontinued; "the developer disappeared, hasn't responded to anyone for a few years". Its JS libraries are reported unmaintained (informal sources; no official EOL notice found). — [AlternativeTo](https://alternativeto.net/software/dragonbones/about); [GDevelop forum](https://forum.gdevelop.io/t/dragonbones-implementation/42579)
- **Inochi2D**, an open-source Live2D-like toolkit: "BSD-2-Clause toolkit for real-time 2D puppet animation" with Inochi Creator and Inochi Session. It received an NLnet grant for Feb 2024 – Sep 2025. Pricing and distribution are reported inconsistently (a paid build on the official site vs free on GitHub). — [NLnet](https://nlnet.nl/project/Inochi2D/); [AlternativeTo](https://www.alternativeto.net/software/inochi-2d/about/)
- **ARAP / puppet warp** in Python: `puppet-warp` (PyPI; GitHub mikecokina/puppet-warp, **GPL-3.0**) implements as-rigid-as-possible manipulation of a triangle mesh and warps the image to it. It depends on numpy, OpenCV, scikit-image and scikit-learn, with optional `triangle`. The reference is Igarashi, Moscovich & Hughes, SIGGRAPH 2005. — [puppet-warp](https://libraries.io/pypi/puppet-warp); [Igarashi 2005 PDF](https://typeset.io/pdf/as-rigid-as-possible-shape-manipulation-4ir0osawg2.pdf)
- **Blender** renders headless: `blender -b file.blend -x 1 -o //render -a`, where `-b` means render "in the background (without UI)". — [Blender 5.2 manual](https://docs.blender.org/manual/en/latest/advanced/command_line/render.html)
- The COA Tools 2D cut-out add-on for Blender imports PSD/GIMP layers as sprites attached to bones. Its original line targeted Blender 2.9, and Blender 3.4+ support comes from the fork `coa_tools2`. Blender 4.x/5.x support is unconfirmed. — [awesome.ecosyste.ms entry](https://awesome.ecosyste.ms/projects/github.com%2Fndee85%2Fcoa_tools); [BlenderArtists "COA tools dead?"](https://blenderartists.org/t/coa-tools-dead/1479623/)
- **Synfig** has Skeleton and Skeleton Deformation layers (since Studio 1.5.0) and a separate CLI renderer package. — [Synfig skeleton docs](https://synfig.readthedocs.io/en/latest/tools/skeleton.html); [Fedora synfig package](https://packages.fedoraproject.org/pkgs/synfig/synfig)

### Inferences
- **Round non-human character.** Animated Drawings' pose model expects a human-like figure, so its automatic joint detection will likely fail or produce odd joints on a blob.
  - The agent can bypass TorchServe entirely: write `mask.png` from SAM or rembg and hand-write `char_cfg.yaml` joints, the same files the fix-annotation UI edits, then call `annotations_to_animation.py`.
  - Even so, BVH human motions mapped onto stubby limbs look odd. Simple procedural motion is usually better: bounce, squash and stretch, sway, blink, lip flaps.
- **Recommended headless rig for a mascot**, in pure Python (Pillow / OpenCV / skia-python) or Blender `-b`:
  - Layers: body, eyes as an open/half/closed sprite set, mouth visemes, arms and legs as separate PNGs with pivot points, and an optional shadow.
  - Animation from per-layer affine transforms on keyframed curves, plus ARAP or a simple grid or lattice warp on the body for squash and stretch.
  - This avoids GUI-only tools and license costs.
  - Note puppet-warp is GPL-3.0. Write your own ARAP or MLS warp if GPL is a problem.
- Spine is the strongest commercial option if a GUI rigging step by a human is acceptable. Its CLI can then batch-export, but rendering video needs OpenGL (Xvfb plus Mesa on a headless server; untested here).
- Live2D and Character Animator are not viable for a headless Linux agent.

### Gaps
- No quality evaluation found of Animated Drawings on non-humanoid or round characters, nor any fork maintaining it after archival.
- Spine pricing and whether the CLI works under the Essential license were not verified. Xvfb behaviour is not documented.
- Inochi2D's current release state and its headless rendering ability are unknown. Synfig's CLI support for skeleton deformation is unconfirmed.
- No up-to-date permissive (MIT/BSD) Python ARAP library was identified; only the GPL `puppet-warp` was confirmed.

---

## (d) What to ask the image generator for: animation-ready assets, failure modes and fixes

### Takeaway
OpenAI's own guidance supports an anchor-plus-edit workflow:
- one canonical character reference;
- each new asset made as an edit of that reference, with an explicit "change only X / keep everything else" preserve list, one change per iteration;
- `background="transparent"` with PNG or WebP;
- compositing approved edits into the original wherever pixels must stay identical.

The models still drift (OpenAI admits recurring-character and layout precision limits). Every output should therefore be checked and normalized with registration (ECC or phase correlation), colour matching, and optionally vectorization.

### Cited Findings
- **Current OpenAI models**, per the docs fetched 2026-10-28; verify, because the fetcher summarized a long page:
  - The page centres on `gpt-image-2.5-sunburst` (editing precision) and `gpt-image-2.5-flare` (fast).
  - `gpt-image-2` is listed under "Earlier GPT Image models".
  - "`gpt-image-1` was shut down on October 23, 2026."
  - gpt-image-2 per-image prices (1024²): low $0.006, medium $0.053, high $0.211. The 2.5 models are token-priced.
  - — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
  - A third party says GPT Image 1.5 was succeeded by the GPT Image 2 family in April 2026. — [Hedra](https://www.hedra.com/models/image/openai/gpt-image-15)
- **Sizes** (newer models): custom `WIDTHxHEIGHT` with edges that are multiples of 16, an aspect ratio between 1:3 and 3:1, a maximum edge of 3840 px, and 655,360–8,294,400 total pixels. — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Transparency**:
  - "For transparent assets, explicitly request `background="transparent"` and use PNG or WebP." "A drawn checkerboard is not transparency." "Check the decoded image's alpha channel…"
  - "For subsequent edits, repeat the requirement to preserve the transparent background."
  - — [OpenAI image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)
  - The cookbook adds that converting RGBA to RGB discards transparency. — [OpenAI cookbook prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- **Edit in place**:
  - "For edits, identify what should change and what must stay the same". Use "change only X" and list what to keep, for example "identity, geometry, layout, lighting".
  - "Pass the previous output as the next edit input, request one change, and repeat the details to preserve."
  - Name multiple inputs by role: subject, style, background.
  - — [OpenAI image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)
  - The cookbook adds "repeat the preserve list on each iteration to reduce drift", and for surgical edits "also say not to alter saturation, contrast, layout". — [OpenAI cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- **Character consistency**:
  - "create a reusable character reference to help preserve appearance across scenes, poses, and pages". "Repeat the appearance constraints…". "Do not redesign the character." — [OpenAI image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)
  - The cookbook's "character anchor" pipeline is "designed for multi-page illustration pipelines where character drift is unacceptable" and recommends gpt-image-2 for identity-sensitive edits. — [OpenAI cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- **Admitted limitations**: "the model may occasionally struggle to maintain visual consistency for recurring characters or brand elements across multiple generations", and "may have difficulty placing elements precisely in structured or layout-sensitive compositions". This directly affects sprite grids and registration. — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Community sprite-sheet practice** (a skill file; anecdotal):
  - Anchor to an actual existing sprite rather than a loose concept, to lock "palette, proportions, line weight, and shading direction".
  - Lay the anchor on a larger transparent canvas (for example 1024²) with reserved frame slots.
  - "Frame-by-frame generation causes character drift". Request 4–8 frames per strip.
  - "Never scale individual frames independently". Use one global scale, lock frame 1 to the anchor, and check palette drift between the first and last frames.
  - It reports community claims that Nano Banana 2 beats GPT Image 1.5 on sheet consistency.
  - — [animated-sprite-gen SKILL.md](https://claudskills.com/skills/animated-sprite-gen/SKILL.md)
- Scenario says GPT Image 1.5 can produce a 6×6 grid of distinct requested objects and do localized edits that keep the rest stable (vendor claim). — [Scenario help](https://help.scenario.com/en/articles/gpt-image-1-5-the-essentials)
- **Registration fixes**:
  - OpenCV `findTransformECC` maximizes the correlation coefficient between template and warped input, supporting translation, Euclidean, affine and homography models. A tutorial was updated for OpenCV 4.14 / 5.0 in July 2026. — [LearnOpenCV ECC](https://learnopencv.com/image-alignment-ecc-in-opencv-c-python/); [OpenCV image_alignment sample](https://docs.opencv.org/4.11.0/dd/d93/samples_2cpp_2image_alignment_8cpp-example.html)
  - scikit-image `phase_cross_correlation` gives "efficient subpixel image translation registration by cross-correlation". — [skimage.registration](https://scikit-image.org/docs/stable/api/skimage.registration.html)
- **Colour fix**: `skimage.exposure.match_histograms` "adjust[s] an image so that its cumulative histogram matches that of another". — [skimage.exposure](https://scikit-image.org/docs/stable/api/skimage.exposure.html)
- **Outline and vector clean-up**: VTracer (MIT-style license file; Rust, Python and npm packages, Linux AppImage) converts raster to SVG and handles colour images, unlike Potrace. — [VTracer README](https://github.com/visioncortex/vtracer); [VTracer LICENSE](https://raw.githubusercontent.com/visioncortex/vtracer/master/LICENSE)

### Inferences
**Assets to request, in this order**, all as edits of one anchor image at a fixed canvas size, transparent background, character centred at a fixed scale:
1. **Anchor**: neutral front pose, limbs clear of the body (a slight "A-pose"), flat colours, uniform outline, no cast shadow, on a transparent background.
2. **Clean body**: the same image with arms, legs, eyes and mouth removed and the body surface fully drawn. Asking the generator to draw this makes hidden areas native and style-consistent.
3. **Part sheet**: each limb alone, at the same scale, with the joint end drawn as a rounded overlap cap so rotation does not show a gap. Then cut each part out with SAM or rembg.
4. **Expression and mouth set**: eyes (open, half, closed, happy, surprised) and mouth visemes (A/I/U/E/O, closed, smile). Each is an edit of the anchor with "change only the mouth", so its position is registered. Composite only the mouth or eye region back onto the anchor.
5. **Turnaround** (front, 3/4, side, back) only if the character must turn. Treat each view as a separate puppet.
6. **Keyframes** for frame-by-frame work, with the same "change only the pose of X" approach.

**Failure modes and automated fixes:**
- **Global shift or scale drift**: ECC with an affine model, or phase correlation, against the anchor. Compute it on the alpha channel or a binarized outline for robustness on flat cartoons.
- **Palette drift**: histogram matching to the anchor, or snapping to the anchor palette with k-means quantization and nearest-palette remapping.
- **Line-weight drift**: vectorize with VTracer and re-render, or run morphological erode/dilate on an extracted outline mask.
- **Mirrored accessories** (a bow or badge switching sides): state the side explicitly ("on the character's left, viewer's right"), and detect by comparing a part mask's centroid against the anchor's. If flipped, reject and regenerate.
- **Accept/reject loop**: diff each output against the anchor outside the edit region, and auto-reject when the difference exceeds a threshold.
- Prefer generating one part per edit over large multi-cell sheets. OpenAI admits layout-precision limits, while single-part edits keep registration with the anchor.

### Gaps
- No official OpenAI documentation on sprite sheets, turnaround sheets or character sheets specifically.
- No source found documenting "mirrored accessories" or "inconsistent line weight" as named failure modes, or quantifying drift. The fixes above are engineering inferences.
- The current 2.5 models' mask precision, transparency on edits, and `input_fidelity` behaviour are not fully documented in what was retrieved.
- Nano Banana 2 vs GPT Image comparisons are anecdotal only.

---

## (e) Frame-by-frame animation from AI keyframes with interpolation (no video-generation model)

### Takeaway
- Flow-based interpolators run headless on Linux under permissive licenses:
  - RIFE: MIT; Practical-RIFE v4.25/4.26; `rife-ncnn-vulkan` binary with CPU fallback.
  - FILM: Apache-2.0, archived Oct 2025, TensorFlow 2.
  - AnimeInterp: MIT, but very old PyTorch.
  - EISAI: **AGPL-3.0**.
- All of them blur or break on large, non-linear cartoon motion and dis-occlusion.
- **ToonCrafter is a video diffusion model** (built on DynamiCrafter image-to-video), so the project's rule excludes it.

In practice, use AI keyframes close enough together, interpolate only small motions (one or two in-betweens), animate on twos with holds, and handle big pose changes with cut-out transforms or mesh warps rather than optical flow.

### Cited Findings
- **Practical-RIFE** (MIT; models "under the same MIT license"):
  - Latest listed model is 4.26 (Sep 2024), with 4.25 recommended "by default for most scenes"; 4.25 notes say "anime scenes have been significantly improved". There is also a 4.25.lite.
  - CLI: `python3 inference_video.py --multi=2 --video=in.mp4`, or `--img=dir/` for numbered PNGs, with `--scale=0.5` for 4K. Requires Python ≤3.11.
  - The maintainer notes "improving the PSNR index is not consistent with subjective perception".
  - — [Practical-RIFE](https://github.com/hzwer/Practical-RIFE); [LICENSE](https://raw.githubusercontent.com/hzwer/Practical-RIFE/main/LICENSE)
- **rife-ncnn-vulkan** (MIT) is a portable binary for Windows, Linux and macOS: "no CUDA or PyTorch runtime environment is needed".
  - Usage: `-0 a.png -1 b.png -o out.png`, `-s` time step (0–1), `-n` target frame count, `-g -1` for CPU, `-x` / `-z` for TTA, `-u` for UHD.
  - Models from rife 1.x up to `rife-v4.6`, including `rife-anime`.
  - — [rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan)
- **FILM** (Google; Apache-2.0; "not an officially supported Google product") is "a frame interpolation network for large motion" built for near-duplicate photos. It was **archived 14 Oct 2025**.
  - CLI: `python -m eval.interpolator_test --frame1 a.png --frame2 b.png --model_path … --output_frame mid.png`, or `eval.interpolator_cli --times_to_interpolate N`.
  - TF2 environment (the recommended Docker image is tf2-gpu.2-6).
  - — [google-research/frame-interpolation](https://github.com/google-research/frame-interpolation)
- **AnimeInterp** (CVPR 2021) code is MIT. Segment-Guided Matching handles "lack of textures" and Recurrent Flow Refinement handles "non-linear and extremely large motion". It introduced the ATD-12K dataset (12k triplets, test set split by motion and occlusion difficulty).
  - Requires "0.4 <= pytorch <= 1.1", or `align_corners` patches for newer versions. The ATD-12K license is not stated.
  - — [AnimeInterp GitHub](https://github.com/lisiyao21/AnimeInterp); [paper](https://ar5iv.labs.arxiv.org/html/2104.02495)
- **EISAI** (ECCV 2022) is **AGPL-3.0** (copyleft, including network use). SoftsplatLite forward warping plus a Distance Transform Module "leverages line proximity cues to correct aberrations in difficult solid-color regions".
  - CLI: `python3 -m _scripts.interpolate f0.png f1.png --fps=12 --out=…`. Requires "docker with a GPU". Inactive.
  - — [eisai-anime-interpolator](https://github.com/ShuhongChen/eisai-anime-interpolator)
- **ToonCrafter: VIDEO-MODEL, excluded.**
  - The paper says "Our generative cartoon interpolation framework is built upon the open-sourced DynamiCrafter interpolation model" (an image-to-video latent diffusion model). The README says it leverages "pre-trained image-to-video diffusion priors".
  - Output is up to 16 frames at 512×320, using about 24 GB on an A100 (community versions about 10–12 GB).
  - Code is Apache-2.0, but no separate weights license is stated, and the authors call it "open-source research exploration, instead of commercial products".
  - — [ToonCrafter paper](https://arxiv.org/html/2405.17933); [ToonCrafter GitHub](https://github.com/Doubiiu/ToonCrafter)
- **Why flow methods struggle on cartoons**:
  - The ToonCrafter abstract says correspondence-based methods "implicitly assume linear motion and the absence of complicated phenomena like dis-occlusion". On its cartoon test set it reports FVD 43.92 vs AnimeInterp 196.66, EISAI 146.65 and FILM 189.88, and a user study preferring it for motion quality (68.98%). These are the authors' own numbers. — [ToonCrafter abstract](https://arxiv.org/abs/2405.17933); [paper](https://arxiv.org/html/2405.17933)
  - VFIBench (arXiv 2501.03699), anime subset: RIFE FID 62.35 / FVD 628.55; EMA-VFI 53.27 / 517.60; ToonCrafter 40.63 / 425.71; the authors' MoG 33.73 / 351.41. The paper notes "flow-based VFI often produces blurry results in complex motion scenarios". MoG itself is generative and video-prior based. — [VFIBench / MoG](https://arxiv.org/html/2501.03699)
  - A 2025 survey says cartoon VFI lacks standardized high-quality datasets, and ATD-12K's triplet-only format limits it. — [AceVFI survey](https://arxiv.org/pdf/2506.01061)
  - SGM-VFI (CVPR 2024) targets large motion with sparse global matching, evaluated on real-footage benchmarks, not anime. — [SGM-VFI](https://arxiv.org/pdf/2404.06913)
- **Classical interpolation**: FFmpeg `minterpolate` supports `mi_mode=dup|blend|mci` (motion-compensated), with `mc_mode=obmc|aobmc` and bidirectional or bilateral motion estimation. — [FFmpeg filters doc](https://ffmpeg.org/ffmpeg-filters.html#minterpolate)
- **Ones and twos**: at 24 fps, "on ones" is a new drawing every frame and "on twos" a new drawing every other frame (12 per second). "Most things can be animated sufficiently well on… 'twos'". Limited animation reuses static parts to save cost, and quick actions go on ones, slower ones on twos. — [Traditional animation study guide](https://www.remnote.com/learn/arts-and-humanities/visual-arts-and-design/animation/traditional-animation/traditional-animation-study-guide); [Taylor & Francis chapter](https://www.taylorfrancis.com/books/9781136134623/chapters/10.4324/9780080519272-31); [Animated Views forum](https://forum.animatedviews.com/viewtopic.php?p=91914)

### Inferences
**Pipeline for an agent:**
1. Generate keyframes as edits of the anchor (section d), so the character stays registered.
2. Register each keyframe to the anchor with ECC.
3. Colour-match.
4. Insert at most one or two RIFE in-betweens, only where motion is small: blinks, sways, arm swings of a few degrees. Use `rife-ncnn-vulkan -0 k1.png -1 k2.png -s 0.5`.
5. Hold frames on twos (12 fps of drawings in a 24 fps timeline) for a deliberately hand-made look that also hides interpolation artifacts.

**Large pose changes**, such as a jump or the body turning, should not be flow-interpolated. Instead:
- generate an extra AI keyframe (a "breakdown") in between;
- or cut on action with a smear frame;
- or animate the move with the cut-out rig from section (c): transforms plus ARAP or lattice warp, which interpolates deterministically without ghosting.
- A mesh-warp "morph" between two registered keyframes, using matched control points, is a classical alternative for shapes that deform but keep the same topology.

**Interpolating on transparent PNGs**: RIFE works on RGB. Interpolate RGB and alpha separately, or composite onto a flat key colour, interpolate, and re-key. Expect halo artifacts at outlines and check them visually.

**FFmpeg `minterpolate`** is the zero-dependency fallback. Block-based motion compensation on flat-colour cartoons is likely to smear outlines, so `dup` (holds) is usually the better classical choice. This is an inference; I found no benchmark.

**Licensing summary for commercial use:**
- Permissive: RIFE (MIT), rife-ncnn-vulkan (MIT), FILM (Apache-2.0), AnimeInterp code (MIT).
- Copyleft: EISAI (AGPL-3.0).
- Excluded: ToonCrafter (video model; research-only framing; weights license unclear).

### Gaps
- No independent benchmark found of RIFE 4.25/4.26 specifically on large-motion cartoon keyframes (VFIBench tested an unspecified RIFE version).
- Licenses of the ATD-12K dataset and of the AnimeInterp and EISAI checkpoints are not stated.
- No source quantifying FFmpeg `minterpolate` quality on cartoons.
- I did not check whether non-diffusion large-motion methods such as SGM-VFI, GIMM-VFI or EMA-VFI provide easy CLIs or permissive licenses.
- Newer cartoon in-betweening research (for example AnimeInbet, ICCV 2023, which works on line-art vector inputs) was not investigated in depth.
