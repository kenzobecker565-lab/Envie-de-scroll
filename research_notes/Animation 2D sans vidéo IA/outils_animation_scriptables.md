# Scriptable 2D skeletal/cut-out character animation tools for a headless coding agent (Linux, 1080x1920 MP4)

Research date: 2026-10-28. Scope: Spine, DragonBones, Live2D Cubism, Rive, Lottie/Bodymovin, Synfig, OpenToonz, Moho, Toon Boom Harmony, Blender (Grease Pencil v3 + image-plane cut-out), Krita. Where a source is older than 2025 it is flagged. Search-engine summaries were used for several facts; where the underlying page could not be fetched directly this is noted.

## Q1. Per tool: can an agent author content entirely in text/code, is there a headless renderer, and what is the quality ceiling (mesh deformation, IK, blending)?

### Takeaway
Text-native, fully open formats with real CLI renderers exist (Synfig `.sif` XML + `synfig` CLI; Blender `bpy` + `blender -b`; Lottie JSON + several headless renderers; Spine JSON, which is documented and hand-writable, + `spine-canvaskit` in Node). Proprietary binary formats (Live2D `.moc3`, Rive `.riv`) can effectively only be produced by their GUI editors, so an agent can only *drive* pre-made rigs there, not author them. Spine gives the highest 2D cut-out quality ceiling (meshes, weights, IK, physics) in a documented JSON, but needs a paid licence for its runtimes.

### Cited Findings

**Spine (Esoteric Software)**
- The Spine JSON format is fully documented: `skeleton`, `bones` (parents always precede children; position/rotation/scale/shear), `slots` (draw order, blend mode), `ik`/`transform`/`path` constraints, `skins`, seven attachment types including `region` (textured rectangle) and `mesh` (textured mesh with UVs, triangles and optional bone weights), `events`, and `animations` with per-bone rotate/translate/scale/shear, deform, draworder timelines and linear/stepped/Bezier curves. — [Spine JSON format](https://esotericsoftware.com/spine-json-format)
- The JSON doc describes the format as "allowing interoperability with other tools" and "a good choice when needing to manually inspect or otherwise process the data", and gives "Assume X if omitted" defaults for most attributes (helpful for hand-generated files). The page's examples are from Spine 3.8.24 and it does not document a `physics` section (flag: doc page partly dated). — [Spine JSON format](https://esotericsoftware.com/spine-json-format)
- Spine CLI: "Most CLI parameters can be used headless"; it can import JSON/binary into a project (`-i`, `-o`, `-r`), export JSON or binary (`-e json` / `-e binary`), and pack atlases (`-p`, e.g. `-e json+pack`). On Linux it is run via `./Spine.sh -e /path/to/export.json`. However "to export images or video an OS windowing system and OpenGL are required". — [Spine CLI docs](https://esotericsoftware.com/spine-command-line-interface)
- Spine editor video export formats are AVI and MOV only (plus GIF, PNG sequence, APNG, PSD, JPEG); MOV has a Transparent option; size via Scale or Fit; no MP4/WebM listed (so an ffmpeg transcode step is needed). — [Spine export docs](https://esotericsoftware.com/spine-export)
- `spine-canvaskit` (GA July 9, 2024) renders Spine via CanvasKit (Skia WASM) on top of `spine-core`, works in "all JavaScript environments that support WebAssembly", explicitly including Node.js/server-side "headless" use, with a headless rendering example in the repo. — [Esoteric blog: spine-canvaskit released](https://esotericsoftware.com/blog/spine-canvaskit-runtime-released)
- For browser playback Esoteric recommends spine-player, spine-phaser or spine-pixi rather than CanvasKit (~3.3 MB). — [Esoteric blog](https://esotericsoftware.com/blog/spine-canvaskit-runtime-released)
- Feature tiers: Professional adds meshes, weighted meshes/free-form deformation, clipping and IK/transform/path constraints; Essential has core bone/region tools only, and Essential will not open/export projects using those features. Trial has all features except saving. (Forum + reseller sources; official comparison table not retrieved.) — [Esoteric forum: Essential vs trial](https://fr.esotericsoftware.com/forum/d/28769-why-doesnt-spine-ess-have-the-features-that-even-trial-has); [Esoteric forum: Ess or Pro](https://de.esotericsoftware.com/forum/d/7216-new-to-spine-do-i-need-ess-or-pro); [Spine purchase page](https://esotericsoftware.com/spine-purchase) ("Essential ... not meshes or other advanced features")
- Current version line: Spine 4.3 stable has shipped (Defold forum notes the spine-c API "changed completely"); the official `@esotericsoftware/spine-webcomponents` npm package is at 4.3.9. — [Defold forum](https://forum.defold.com/t/can-we-get-update-for-spine-4-3-on-defold/82855); [jsDelivr spine-webcomponents](https://www.jsdelivr.com/package/npm/@esotericsoftware/spine-webcomponents)

**DragonBones**
- AlternativeTo lists DragonBones as discontinued: "The developer disappeared, hasn't responded to anyone for a few years ... Download link does not load for anyone." — [AlternativeTo](https://alternativeto.net/software/dragonbones/about)
- A community Pixi runtime README states Egret "seems to have abandoned DragonBones and its libraries from years ago." — [dragonbones-pixijs README](https://app.unpkg.com/dragonbones-pixijs@1.0.5/files/README.md)
- The DragonBonesJS repo is MIT, not archived, has no releases, and its README now points to "LoongBones" (loongbones.app) for authoring; a Defold forum user post says DragonBones "has been renamed to LoongBones and will continue to be updated" (unofficial). — [DragonBonesJS GitHub](https://github.com/DragonBones/DragonBonesJS); [Defold forum](https://forum.defold.com/t/hope-defold-can-continue-to-support-the-new-loongbones/81757)

**Live2D Cubism**
- `.moc3` is the runtime model data exported from a `.cmo3` project by the Cubism Editor's Model Workspace. — [Live2D manual: file types](https://docs.live2d.com/en/cubism-editor-manual/file-type-and-extension/)
- moc3 is consumption-only: it cannot be converted back to `.cmo3` (third-party guide) and Live2D support says moc3 files can only be used for viewer/embedding. — [shiralive2d guide](https://shiralive2d.com/live2d-cubism/convert-moc3-to-cmo3/); [Live2D community](https://community.live2d.com/discussion/706/need-help-exporting-moc3-to-moc)
- Web display: `pixi-live2d-display` (naari3 fork targets PixiJS v8 + Cubism core 5; requires WebGL); the Cubism Core SDK file must be downloaded separately because of Live2D's SDK policy. — [@naari3/pixi-live2d-display README](https://cdn.jsdelivr.net/npm/@naari3/pixi-live2d-display@1.2.5/README.md); [pixi-live2d README](https://cdn.jsdelivr.net/npm/pixi-live2d@1.2.1/readme.md)
- Cubism 5.0.00 released Sept 21, 2023 (flag: version baseline is 2023). — [CGWorld](https://cgworld.jp/flashnews/202309-live2d-5.html)

**Rive**
- `.riv` is a binary runtime export (little endian, "RIVE" fingerprint, major/minor version, file ID, a ToC field-definition table, LEB128 varuints); runtimes reject a different major version (current major 7). The docs point to C++ reader/decoder code, i.e. it documents *reading*, not a supported writer. — [Rive format docs](https://rive.app/docs/runtimes/advanced-topic/format); [rive-cpp runtime_header.hpp](https://skia.googlesource.com/external/github.com/rive-app/rive-cpp/+/HEAD/include/rive/runtime_header.hpp)
- Rive Scripting (Luau) is live in the editor; script "protocols" are Converter, Node, Layout, Test, PathEffect; the editor generates type definitions from engine APIs (blog dated Nov 20, 2025). Docs mention using an AI coding agent to create/modify scripts. Scripts run *inside* a Rive file authored in the editor — they do not generate `.riv` files from outside. — [Rive blog: why Luau](https://rive.app/blog/why-scripting-runs-on-luau); [Rive blog: scripting is live](https://framer.rive.app/blog/scripting-is-live-in-rive); [Rive scripting docs](https://rive.app/docs/scripting)
- Rigging: bones drive mesh deformation; IK constraints with bone count and strength settings. — [Rive IK constraint docs](https://rive.app/docs/editor/constraints/ik-constraint); [Rive constraints (mirror)](https://vinh-rive-doc.pages.dev/en/docs/editor/constraints)
- Rive team (Product Hunt reply, undated): a "Cloud Renderer" exports `.riv` content to MP4, GIF, PNG sequence and WebM (with transparency). — [Product Hunt Rive for macOS thread](https://www.producthunt.com/p/rive/rive-for-macos)
- `@rive-app/canvas` = high-level JS API on CanvasRenderingContext2D (the `-lite` variant does not render Rive Text). — [npm @rive-app/canvas](https://npmjs.com/package/@rive-app/canvas)

**Lottie / Bodymovin**
- Puppet Pin (mesh warp) is not exported by Bodymovin because it is a pixel operation rather than a transform; the "render unsupported features" fallback only embeds pixels. — [Adobe Community thread](https://community.adobe.com/t5/after-effects-discussions/can-t-export-animaton/m-p/12855125)
- A Bodymovin developer (≈2018, flag: old) said Duik and Rubberhose rigs "should work fine" (they bake to transforms/paths) except tapered strokes. — [aescripts Bodymovin forum](https://aescripts.com/forums/discussion/1525/bodymovin/p2)
- Code authoring: `python-lottie` (`pip install lottie`, "framework to work with lottie files and telegram animated stickers", license AGPLv3+ per a third-party listing) and the Glaxnimate Python bindings (GPLv3+, create documents headlessly, add layers/shapes/keyframes, save as Lottie; latest listed 0.5.4, Sep 2023 — flag: stale). — [PyPI lottie](https://pypi.org/project/lottie/); [depscope listing](https://depscope.dev/pkg/pypi/lottie); [PyPI glaxnimate](https://pypi.org/project/glaxnimate/0.5.0.3/)
- Headless renderers: `puppeteer-lottie` / `puppeteer-lottie-cli` (lottie-web in headless Chrome → PNG frames/GIF/MP4 via ffmpeg; `-i in.json -o out.mp4 -w -h`; repo last pushed July 2023); ThorVG `tvg-lottie2gif` (Debian `thorvg-tools`); `@napi-rs/canvas` `LottieAnimation` built on Skia Skottie with `seekFrame()` + `render()` and an MP4 example via `@napi-rs/webcodecs` (added in PR #1177, Dec 2025); `lottie-node` (lottie-web + node-canvas + jsdom); `lottie.js` server-side PNG frames without a browser. — [puppeteer-lottie](https://github.com/TheJizel/puppeteer-lottie/blob/master/readme.md); [puppeteer-lottie-cli](https://github.com/gnipbao/puppeteer-lottie-cli); [tvg-lottie2gif man page](https://dyn.manpages.debian.org/unstable/thorvg-tools/tvg-lottie2gif.1.en.html); [napi-rs canvas PR #1177](https://github.com/Brooooooklyn/canvas/pull/1177); [lottie-node](https://npmjs.com/package/lottie-node); [lottie.js](https://lottie.js.org/)
- Canva moved iOS Lottie rendering from rLottie to ThorVG (vendor case study: frame generation 10.2 s → 2.34 s, peak memory 236 MB → 72 MB). — [LottieFiles Canva case study](https://lottiefiles.com/blog/working-with-lottie-animations/canva-enhances-ios-rendering-faster-and-efficient-with-thorvg)

**Synfig Studio**
- CLI: `synfig [opts] file.sif[z] -t <target> -o <out> -w -h --begin-time --end-time --fps -Q <0..10> -a <1..30> -c <canvas>`; e.g. `synfig myanimation.sifz -t ffmpeg -vc mpeg4 -vb 1000 -o out.ogg`; `synfig --target-video-codecs` lists codecs (flag: help text from 0.62/2010, wiki page last edited 2014). — [Synfig wiki CLI syntax](https://wiki.synfig.org/Synfig_CLI_syntax)
- Targets include png/cairopng, bmp, ffmpeg, image sequences (PNG/BMP/PPM/OpenEXR); target auto-chosen from extension. — [Synfig wiki Render options](https://wiki.synfig.org/Render_options); [Synfig docs: image sequences](https://synfig.readthedocs.io/en/latest/_sources/artwork_import/image_sequences.rst.txt)
- Skeleton Deformation layer = raster (pixel-level) mesh deformation of whatever renders beneath it, driven by bones with per-bone width (influence) and horizontal/vertical subdivisions (default 32). Child bones inherit parent motion. — [Synfig Skeleton Deformation layer](https://synfig.readthedocs.io/en/latest/layers/skeleton_deformation.html)
- A dedicated Skeleton Tool exists since 1.5.0 (dev branch). — [Synfig Skeleton Tool](https://synfig.readthedocs.io/en/latest/tools/skeleton.html)
- A forum user reported cropped frames when rendering a single layer with `-c` (bug). — [Synfig forum](https://forums.synfig.org/t/problem-rendering-layers-in-the-command-line/1021)

**OpenToonz**
- CLI binaries: `tcleanup`, `tcomposer`, `tconverter`, `tfarmcontroller`, `tfarmserver` (2016 source; with AppImage use `--appimage-exec`). — [Morevna: How to use OpenToonz CLI (2016)](https://morevnaproject.org/2016/11/27/use-opentoonz-cli)
- Toonz Script (JS-like) documented; Morevna Edition 1.3.0 (2019) added running a Toonz script from the command line. — [OpenToonz toonz script docs](https://opentoonz.readthedocs.io/ja/latest/toonzscript.html); [Morevna 1.3.0](https://morevnaproject.org/2019/03/23/opentoonz-morevna-edition-1-3-0-released)
- Plastic tool: mesh levels + Plastic skeletons, multiple skeletons per mesh, hooks/vertex parenting. — [OpenToonz Plastic docs](https://opentoonz.readthedocs.io/en/latest/create_animations_using_plastic_tool.html)
- OpenToonz 1.8.0 released June 19, 2026, first full stable update in ~3 years (drawing tools, screentones, OCA import/export). — [Forest Watch](https://forest.watch.impress.co.jp/docs/news/2118799.html); [GitHub releases](https://github.com/opentoonz/opentoonz/releases)
- No source found confirming tcomposer runs without a display.

**Moho (Lost Marble)**
- Scripts are Lua (menu scripts in `scripts/menu`); a third-party MCP project says the Moho 14 Lua API is Lua 5.4-based. — [Moho manual: Scripts menu](https://www.lostmarble.com/moho/manual/scriptsmenu.html); [MohoMCP README (third-party)](https://cdn.jsdelivr.net/gh/Kveto/MohoMCP@master/README.md)
- Command-line rendering exists but users report you "cannot specify certain parameters" such as width/height without re-saving the scene. — [Lost Marble forum](https://www.lostmarble.com/forum/viewtopic.php?p=213392)
- Officially Windows/macOS only; Linux runs reported by users but unsupported. — [Wikipedia: Moho](https://en.wikipedia.org/wiki/Moho_(software))
- Moho 14.5 released Oct 2026 (free for 14 owners). — [Digital Production](https://digitalproduction.com/2026/10/21/moho-14-5-showtime-live-animation/)

**Toon Boom Harmony**
- Scripting: Qt Script (ECMAScript-based, `.js`) plus a Python scripting interface (Harmony 24 Help menu links a Python Scripting Interface Reference). Scripts can run without the GUI: stand-alone syntax passes the scene with `-batch -compile <script>`; `-readonly` avoids saving. — [Toon Boom: About Scripting (H24)](https://docs.toonboom.com/help/harmony-24/premium/scripting/about-scripting.html); [Harmony 22 scripting](https://docs.toonboom.com/help/harmony-22/premium/scripting/about-scripting.html)
- Linux batch processing via the `tbprocess` daemon (`.../lnx86_64/bin/tbprocess -schedule`), documented for Harmony 15 (flag: old). — [Toon Boom H15 Linux batch](https://docs.toonboom.com/help/harmony-15/advanced/installation/batch/linux/launch-batch-processing-manually-linux.html)
- Premium tier adds node view rigging, curve/mesh deformers and master controllers. — [Toon Boom shop](https://shop.toonboom.com/en/products/harmony)

**Blender (bpy, Grease Pencil v3, image-plane cut-out)**
- Blender 4.3: "The Grease Pencil python API has been rewritten" (GPv3); `bpy.types.AttributeGroupGreasePencil` added. — [Blender 4.3 Python API notes](https://developer.blender.org/docs/release_notes/4.3/python_api/)
- Blender 5.0 released Nov 18, 2025; GP gets motion blur, Pen tool, Join Strokes. — [OSArch](https://osarch.org/2025/11/18/blender-5-0-released/); [Blender 5.0 GP notes](https://developer.blender.org/docs/release_notes/5.0/grease_pencil/)
- Headless GPU: since 2022 Blender has a headless EGL (surfaceless) OpenGL backend on Linux it falls back to in background mode, usable by EEVEE; Linux only. — [Blender commit rB3195a38](https://developer.blender.org/rB3195a38); [bf-blender-cvs mail](https://lists.blender.org/pipermail/bf-blender-cvs/2022-August/176810.html)
- Older bug (2.8x–2.9x, flag: old): GP objects aborted headless Cycles renders for lack of a display; `xvfb-run -a` is the common workaround. — [Blender T85546](https://developer.blender.org/T85546); [devtalk thread](https://devtalk.blender.org/t/blender-2-8-unable-to-open-a-display-by-the-rendering-on-the-background-cycles/8607?page=2)
- "Images as Planes" became a built-in feature in 4.2 (Add > Image > Mesh Plane). — [BlenderNation](https://www.blendernation.com/2024/08/28/blender-tutorial-how-to-restore-the-images-as-planes-add-on/); [Blender Artists](https://blenderartists.org/t/blender-4-3-2-comes-with-very-few-official-and-community-add-ons/1568872)
- Cut-out workflow: cut character into PNG layers, import as planes, orthographic camera, parent planes to bones of an armature. — [Scenario tutorial](https://help.scenario.com/animating-a-2d-character-using-scenario-and-blender); [CodeAndWeb tutorial](https://www.codeandweb.com/texturepacker3d/tutorials/using-images-for-2d-cutout-animations-in-blender); [StS2 Blender wiki](https://github.com/r2Nexus/The-Engineer/wiki/Animating-StS2-models-with-Blender-%E2%80%90-Introduction)
- Paid add-on "Quick Cut Out Character Rig" auto-builds an IK rig for 2D bipeds. — [Blender Market](https://blendermarket.com/products/quick-cut-out-character-rig)

**Krita**
- Since 4.2: `krita --export-sequence --export-filename file.png test.kra` exports an animation as an image sequence. — [KDE bug 364046](https://bugs.kde.org/show_bug.cgi?id=364046)
- Headless pitfalls: CLI export can freeze while the GUI is open (SQLite lock); fails if destination frames already exist (5.2.9+); reuses last-used export settings. — [KDE bug 460631](https://bugs.kde.org/show_bug.cgi?id=460631)
- `kritarunner` scripts reported unable to import the `krita` module (Windows). — [KDE forum](https://forum.kde.org/viewtopic.php%3Ff=156&t=162062.html)
- Krita 5.2+ bundles a small FFmpeg for video render. — [Krita docs: Render Animation](https://docs.krita.org/fr/_sources/reference_manual/render_animation.rst.txt)

### Inferences
- **Fully text-authorable + headless render, open source:** Synfig (`.sif` XML is human-readable; bones + Skeleton Deformation give mesh-like warping of imported PNGs) and Blender (everything scriptable via `bpy`; armature + image planes; EEVEE via EGL or Cycles/Workbench on CPU). Lottie JSON is also text-authorable and has the best set of headless renderers, but has no bones/mesh deformation of bitmaps — limbs are rigid layers with parenting/transforms (sufficient for "paper cut-out" style, not for smooth bends).
- **Text-authorable format, commercial runtime:** Spine JSON can realistically be generated by an agent (bones + region attachments are simple; meshes/weights are harder but documented), and `spine-canvaskit` in Node or spine-ts in headless Chrome renders it with no GUI. The editor's own video export needs OpenGL/windowing (xvfb would likely work but is untested by sources).
- **GUI-only authoring:** Live2D (`.moc3`), Rive (`.riv`), Moho (`.moho`), Toon Boom, OpenToonz Plastic rigs. An agent could at best animate parameters of a rig a human built (Live2D parameters, Rive state-machine inputs/Luau scripts, Harmony JS/Python on an existing scene).
- **Krita** is frame-by-frame raster with no skeletal system documented in the sources found; poor fit for rigged mascots.
- **DragonBones** should be avoided for new work (abandoned editor; LoongBones succession unclear).
- Quality ceiling ranking for cut-out characters (inferred): Live2D ≈ Spine Pro ≈ Rive (mesh + weights + IK + blending) > Harmony/Moho (pro rigging, GUI) > Blender image planes with armature (rigid parts; mesh deform possible with subdivided planes + weights) ≈ Synfig skeleton deformation > OpenToonz Plastic > Lottie (rigid parts only) > Krita.

### Gaps
- Could not confirm the full Spine Essential vs Professional feature table from the official page (relied on forum/reseller summaries), nor whether Spine 4.2 physics constraints are in Essential.
- No source confirmed whether `tcomposer` (OpenToonz) or Moho CLI render runs without an X display.
- No official Rive changelog/date found for the Cloud Renderer video export; Product Hunt replies are undated.
- Did not verify the exact current Synfig CLI flags beyond the 2010 help text, nor Skottie's own `skottie_tool` CLI.
- Did not find documentation on Duik/bone rigs exported to Lottie in 2025-2026.

## Q2. License, cost and commercial terms (2025-2026)

### Takeaway
Free and commercially safe: Blender (GPL, output is yours), Synfig (GPL), OpenToonz (open source), Krita, Lottie renderers (mostly permissive), Rive runtimes (MIT, but editor plans from $0–$120/seat/mo). Paid: Spine ($69 / $379 one-time; Enterprise if ≥$500k revenue; *runtime use requires an editor licence even for hand-written JSON*), Moho ($59.99 / $399.99 one-time, Win/macOS), Toon Boom Harmony ($30–$139/month). Live2D SDK is free for individuals/small enterprises (< ¥10M revenue) but a publication licence is needed for released content, including video plans.

### Cited Findings
- **Spine**: Essential $69 (list $99), Professional $379 (list $449), Enterprise $2499 base + $379/user/year; Enterprise "required for businesses with $500,000 USD or more annual revenue" (FAQ says "more than $500,000" — wording differs). A purchased licence permits saving/exporting data, images, video and using the Spine Runtimes in products; per-named-user licences. — [Spine purchase](https://esotericsoftware.com/spine-purchase)
- Spine Runtimes License: products may be used if "each user of the Products must obtain their own Spine Editor license". — [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license)
- Esoteric staff: exported JSON/binary/atlas/video are your IP; but "anyone who wants to use the official Spine Runtimes still needs a Spine license"; anyone may write their own code to read Spine data as long as it uses no runtime code. — [Esoteric forum: license for runtimes](https://esotericsoftware.com/forum/d/17246)
- Whether the Spine CLI can run unlicensed in a build pipeline was asked on the forum without a visible answer. — [Esoteric forum: licenses and CLI](https://de.esotericsoftware.com/forum/d/25573-licenses-and-cli)
- **Live2D**: "Individuals and Small-Scale Enterprises are exempted from the license and payment (except Expandable Application)"; a Publication License Agreement is required at release (at least one month before), with plans A–G covering games, VTuber tools, AI/chatbots and video (e.g. B non-profit, E one-time purchase, C running royalty for video content). — [Live2D SDK license page](https://www.live2d.com/en/sdk/license/)
- Live2D threshold: Cubism Editor FREE or PRO may be used commercially by general users / small-scale enterprises with most-recent annual sales < ¥10 million; the sales figure applies to the whole company, including parent companies. (Help-center page returned 503 when fetched directly; content from search summary.) — [Live2D Help Center](https://help.live2d.com/en/other/other_14/); [Live2D licence text copy (third-party mirror)](https://cdn.jsdelivr.net/npm/phaser3-rex-plugins@1.80.20/plugins/gameobjects/live2d/framework/LICENSE.md)
- Live2D VTuber tracking software threshold: annual sales > ¥20M requires a publication licence. — [Live2D SDK license page](https://www.live2d.com/en/sdk/license/)
- Cubism PRO price: not found on official pages; aggregator lists $15/month (unverified); PRO sold as subscription "for indie" / "for business", annual and 3-year plans; 76% student discount on 3-year PRO. — [SoftwareSuggest](https://www.softwaresuggest.com/live2d/pricing); [koubo.jp sale 2026](https://koubo.jp/article/99033); [Live2D SDK license page](https://www.live2d.com/en/sdk/license/)
- **Rive**: Free $0, Cadet $9, Voyager $32, Enterprise $120 per seat/month; Free plan can "Export .riv files with a splash screen"; "No revenue share, no runtime fees, no royalties, and MIT open-source runtimes". — [Rive pricing](https://rive.app/pricing)
- **Toon Boom Harmony** (official shop): Essentials $30/mo or $252/yr; Advanced $77/mo or $588/yr; Premium $139/mo or $1,128/yr. — [Toon Boom shop](https://shop.toonboom.com/en/products/harmony)
- **Moho**: Pro 14 $399.99, Debut 14 $59.99, one-time perpetual, Windows/macOS. — [Lost Marble store](https://moho.lostmarble.com/update); [Digital Production, Oct 2026](https://digitalproduction.com/2026/10/21/moho-14-5-showtime-live-animation/)
- **Blender**: GPL; "What you create with Blender is your sole property"; can be used commercially; published Python add-ons must be GPL-compatible. — [Blender license](https://www.blender.org/about/license/)
- **Synfig**: free/open-source (GPL) — [Wikipedia: Synfig](https://en.wikipedia.org/wiki/Synfig)
- **OpenToonz**: open source (from Toonz, released by Dwango) — [Wikipedia: Toonz](https://en.wikipedia.org/wiki/Toonz)
- **DragonBones runtimes**: MIT. — [DragonBonesJS](https://github.com/DragonBones/DragonBonesJS)
- **Lottie tooling**: python-lottie AGPLv3+ (third-party listing), Glaxnimate bindings GPLv3+. — [depscope](https://depscope.dev/pkg/pypi/lottie); [PyPI glaxnimate](https://pypi.org/project/glaxnimate/0.5.0.3/)

### Inferences
- For a solo creator posting Shorts/Reels/TikToks, Blender/Synfig/Lottie cost $0 with no ambiguity. Spine Essential ($69) is cheap but lacks meshes/IK; Spine Pro ($379 one-time) is the cheapest route to pro-grade 2D deformation with a documented text format.
- Live2D is "free" only below ¥10M company revenue and still needs a publication licence agreement for released video content — paperwork overhead even if the fee is zero (fee amounts not published on the page).
- AGPL on python-lottie matters only if distributed/served as a network service; an internal render pipeline is generally unaffected (inference, not legal advice).

### Gaps
- Live2D publication licence fee amounts for video plans are not published on the page.
- Official Cubism PRO price for 2025-2026 not found.
- Rive Free-plan splash screen: unclear whether it appears in runtime playback/exports used commercially; video export per-plan availability not readable from the pricing page.
- Exact OpenToonz licence (BSD) not re-verified from the repo LICENSE file in this session.

## Q3. Known headless pipelines to render Spine / Live2D / Rive / Lottie (and others) to video

### Takeaway
The generic, proven pattern is: deterministic page or Node renderer → seek frame-by-frame → capture PNG/raw frames → pipe to ffmpeg (encode H.264 1080x1920). Lottie has the most turnkey tools (puppeteer-lottie CLI, ThorVG, Skottie via @napi-rs/canvas). Spine has an official Node-capable renderer (spine-canvaskit). Rive and Live2D need a custom headless-Chrome harness (WebGL via GPU or SwiftShader). Blender and Synfig render natively from CLI.

### Cited Findings
- Generic Puppeteer frame renderer: opens headless browser, calls `seekToFrame(n)` per frame, screenshots, pipes to ffmpeg without temp files; does not support CSS animations or nondeterministic animation. — [html5-animation-video-renderer](https://github.com/andreybo/html5-animation-video-renderer)
- Lottie → MP4: `puppeteer-lottie -i anim.json -o out.mp4` (MP4 needs ffmpeg; height may shift by 1px for even dimensions; setting both width+height pads instead of stretching). — [puppeteer-lottie-cli](https://github.com/gnipbao/puppeteer-lottie-cli); [puppeteer-lottie](https://github.com/TheJizel/puppeteer-lottie/blob/master/readme.md)
- Lottie → frames in Node without a browser: `@napi-rs/canvas` `LottieAnimation.loadFromFile/loadFromData`, `seekFrame(30)`, `render(ctx, rect)`, MP4 example via `@napi-rs/webcodecs` (PR Dec 2025). — [napi-rs canvas PR #1177](https://github.com/Brooooooklyn/canvas/pull/1177)
- Lottie → GIF via ThorVG `tvg-lottie2gif` (resolution flag default 600x600, fps default 30). — [Debian man page](https://dyn.manpages.debian.org/unstable/thorvg-tools/tvg-lottie2gif.1.en.html)
- Spine → frames in Node: spine-canvaskit headless example (CanvasKit WASM). — [Esoteric blog](https://esotericsoftware.com/blog/spine-canvaskit-runtime-released)
- Spine editor CLI can export video only with a windowing system + OpenGL; formats AVI/MOV. — [Spine CLI](https://esotericsoftware.com/spine-command-line-interface); [Spine export](https://esotericsoftware.com/spine-export)
- A community npm package describes itself as a headless spine-ts runtime for exporting animations (not verified). — [npm ~nattsu39](https://npmjs.com/~nattsu39)
- Live2D in browser via pixi-live2d-display requires WebGL; updates via Pixi ticker (`Live2DModel.registerTicker`). No published Puppeteer→ffmpeg Live2D recipe found. — [@naari3/pixi-live2d-display README](https://cdn.jsdelivr.net/npm/@naari3/pixi-live2d-display@1.2.5/README.md)
- Rive: no documented headless frame-seek recipe found; Rive's own Cloud Renderer exports MP4/GIF/PNG/WebM (editor-side). — [Product Hunt Rive thread](https://www.producthunt.com/p/rive/rive-for-macos)
- Blender: `blender -b` works on headless Linux; EEVEE uses EGL headless backend (Linux); Cycles scenes may still error if another scene is set to EEVEE; `xvfb-run -a` fallback. — [Blender rB3195a38](https://developer.blender.org/rB3195a38); [devtalk](https://devtalk.blender.org/t/blender-2-8-unable-to-open-a-display-by-the-rendering-on-the-background-cycles/8607/12); [Blender issue 77339](https://projects.blender.org/blender/blender/issues/77339)
- Synfig: `synfig file.sifz -t ffmpeg ... -o out` or PNG sequence target. — [Synfig wiki CLI](https://wiki.synfig.org/Synfig_CLI_syntax)
- Toon Boom: `-batch -compile script.js` scene scripting without GUI. — [Toon Boom H24 scripting](https://docs.toonboom.com/help/harmony-24/premium/scripting/about-scripting.html)
- Krita: `--export-sequence` then ffmpeg. — [KDE bug 364046](https://bugs.kde.org/show_bug.cgi?id=364046)
- Remotion (React video framework) exposes frame-by-frame rendering APIs (`renderFrames`), a common host for canvas/WebGL runtimes. — [Remotion renderFrames docs](https://cloudrun.remotion.dev/docs/renderer/render-frames)

### Inferences
- For 1080x1920 vertical output, any of these renderers can target the canvas size directly; encode with `ffmpeg -c:v libx264 -pix_fmt yuv420p -r 30` (even dimensions satisfied).
- Headless Chrome WebGL on a GPU-less Linux box falls back to SwiftShader (CPU) — fine for 2D at 1080x1920 but slower; deterministic seeking (not real-time playback) is essential for clean frames.
- Spine runtimes (spine-ts `AnimationState.update(dt)` / `skeleton.updateWorldTransform`) are naturally deterministic, making frame-stepped capture straightforward; Rive state machines with `advance(dt)` likely similar (not verified by a source).

### Gaps
- No public, maintained end-to-end "Spine JSON → MP4" or "Live2D → MP4" open-source CLI found.
- Rive headless rendering in pure Node (without browser) not documented in sources found.

## Q4. Best quality-to-effort option for a cartoon mascot built from PNG parts (e.g., generated by ChatGPT)

### Takeaway
For an agent with no GUI: (1) **Spine JSON generated by code + spine-ts/spine-canvaskit headless render → ffmpeg** gives the best quality ceiling (mesh deform, IK, smooth curves, physics in 4.2+) with a documented text format, at the cost of a $69–$379 licence for runtime use. (2) **Blender `bpy` (image planes + armature, rendered with `blender -b`)** is the best free, fully supported, fully scriptable option with strong rendering (motion blur, lighting, compositing). (3) **Lottie JSON (image layers + parenting) rendered via Skottie/puppeteer-lottie** is the lightest and fastest for rigid cut-out "paper puppet" style. Live2D and Rive offer top quality but require GUI rigging, so they are poor fits for a 100% agent pipeline.

### Cited Findings
- Spine JSON supports `region` attachments (textured rectangles = PNG parts), bones with rotate/translate/scale/shear timelines and Bezier curves, plus `mesh` with weights for deformation. — [Spine JSON format](https://esotericsoftware.com/spine-json-format)
- Runtime use legally requires a Spine Editor licence per user; Essential is $69. — [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license); [Spine purchase](https://esotericsoftware.com/spine-purchase)
- spine-canvaskit runs headless in Node.js. — [Esoteric blog](https://esotericsoftware.com/blog/spine-canvaskit-runtime-released)
- Blender cut-out: PNG parts as planes, orthographic camera, planes parented to armature bones; images-as-planes built in since 4.2; output owned by user and commercial use allowed. — [Scenario tutorial](https://help.scenario.com/animating-a-2d-character-using-scenario-and-blender); [BlenderNation](https://www.blendernation.com/2024/08/28/blender-tutorial-how-to-restore-the-images-as-planes-add-on/); [Blender license](https://www.blender.org/about/license/)
- Lottie cannot carry mesh/puppet deformation (pixel ops), only transforms/paths. — [Adobe Community](https://community.adobe.com/t5/after-effects-discussions/can-t-export-animaton/m-p/12855125)
- Live2D `.moc3` only produced by the Cubism Editor export. — [Live2D manual](https://docs.live2d.com/en/cubism-editor-manual/file-type-and-extension/)
- Rive `.riv` is a binary format with documented readers only; scripting runs within editor-authored files. — [Rive format](https://rive.app/docs/runtimes/advanced-topic/format); [Rive scripting docs](https://rive.app/docs/scripting)
- Synfig Skeleton Deformation applies bone-driven raster warping to imported imagery, rendered via CLI. — [Synfig docs](https://synfig.readthedocs.io/en/latest/layers/skeleton_deformation.html); [Synfig wiki CLI](https://wiki.synfig.org/Synfig_CLI_syntax)
- Synfig stable is still 1.4.5 (May 2024); 1.5.x dev builds continue (1.5.5, March 2026). — [Synfig stable releases](https://www.synfig.org/category/releases/stable-releases/); [Synfig dev releases](https://www.synfig.org/category/releases/development-releases/)

### Inferences
Comparison summary (inferred from the findings above):

| Tool | Agent can author in text/code | Headless render on Linux | Deformation / IK quality | Cost for commercial use | Fit for PNG-parts mascot |
|---|---|---|---|---|---|
| Spine (JSON + spine-ts/canvaskit) | Yes (documented JSON) | Yes (Node/CanvasKit or headless Chrome) | High: mesh, weights, IK, physics (Pro) | $69 Ess. / $379 Pro, one-time; Enterprise ≥$500k rev. | Excellent (best ceiling) |
| Blender bpy (planes + armature; GPv3) | Yes (Python) | Yes (`blender -b`; EGL/Cycles/xvfb) | Medium-High (rigid parts; mesh deform with weighted subdivided planes; GP v3 strokes) | Free (GPL, output yours) | Very good (best free) |
| Lottie (JSON + Skottie/ThorVG/puppeteer) | Yes (JSON, python-lottie) | Yes (many renderers) | Low-Medium: transforms/parenting, path morphs; no bitmap mesh | Free (renderers OSS) | Good for rigid "paper puppet" |
| Synfig (.sif XML + CLI) | Yes (XML) | Yes (`synfig` CLI) | Medium (Skeleton Deformation raster warp) | Free (GPL) | Good but niche, docs dated |
| Live2D | No (moc3 from editor only) | Via headless Chrome + WebGL (custom) | Very high (parameter-based deformation) | Free < ¥10M + publication licence | Poor for no-GUI agent |
| Rive | No (.riv editor-only; Luau scripts inside) | Custom harness / Rive Cloud Renderer | High (bones, mesh, IK, state machines) | Editor $0–$120/seat/mo; MIT runtimes | Poor for no-GUI agent |
| OpenToonz | Partly (Toonz Script) | tcomposer CLI (display need unverified) | Medium (Plastic mesh) | Free | Weak (GUI rigging) |
| Moho | Partly (Lua inside app) | CLI render, limited params; Win/macOS only | High (Smart Bones) | $59.99/$399.99 | Poor (no Linux) |
| Toon Boom Harmony | Partly (JS/Python on scenes) | `-batch` scripting | Very high (Premium deformers) | $30–$139/month | Poor (cost, GUI rigging) |
| Krita | Partly (Python) | `--export-sequence`, fragile | None (raster frame-by-frame) | Free | Poor |
| DragonBones | JSON exists but tooling abandoned | Runtimes only | Medium | MIT runtimes | Avoid |

- Practical recommendation: start with **Blender** (zero licence risk, Python end-to-end, scales to lip-sync via shape-key/texture swaps and to effects/compositing) or a **custom JSON scene → canvas renderer** for rigid cut-out; move to **Spine** if smooth limb bending/squash-and-stretch via meshes and IK becomes necessary — the agent can emit Spine JSON directly and render with spine-ts headless, buying an Essential/Pro licence to stay compliant.
- ChatGPT-generated PNG parts typically need consistent pivot points and overlap margins at joints; all options above require the agent to define pivots (bone origins) per part — Spine and Blender make this explicit in data.
- Risk: hand-generated Spine JSON must match the runtime version (4.2 vs 4.3 field differences); the doc page examples are from 3.8, so the agent should validate against the runtime it ships (inferred).

### Gaps
- No benchmark comparing render time or visual quality across these pipelines at 1080x1920 was found.
- No published case study of an AI agent generating Spine JSON or Blender cut-out rigs end-to-end was found.
- Blender GPv3 Python API specifics (creating strokes, layers) were not retrieved beyond "rewritten in 4.3"; the migration guide was not fetched.
