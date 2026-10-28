# AI production workflow for short vertical animated videos with a consistent mascot (state as of Oct 2026)

Research date: 2026-10-28. Pricing figures are dated where the source dated them. Many sources are vendor or creator blogs. Where only secondary sources exist, this is flagged.

## 1. Keeping the character consistent in image generation (GPT Image, Midjourney, Flux, Nano Banana, Ideogram, Leonardo, Canva)

### Takeaway
In 2026 the reliable method is reference-driven, not description-driven. Build one canonical character sheet (front, profile and 3/4 views, expressions), feed it back as a reference image on every generation, and change one variable per generation. GPT Image 2 is ranked best for reference-driven edits (re-pose, re-outfit). Nano Banana 2 is ranked best for multi-panel storyboards. Recraft V4 Pro is ranked best for illustrated brand mascots with a locked style. In Midjourney V7, `--cref` has been replaced by Omni-Reference (`--oref` + `--ow`), which reviewers still describe as unreliable.

### Cited Findings
- **Canonical reference sheet beats longer prompts.** A creator guide says consistent characters in ChatGPT Images 2.0 come from a named reference-sheet system, not from better descriptions. — [AI Meets Girlboss (Substack)](https://aimeetsgirlboss.substack.com/cp/197554874)
- **Separate fixed identity traits from editable details.** Leadde recommends anchoring on one canonical reference, keeping identity traits apart from editable ones, changing one major variable at a time, and rolling back when drift appears. — [Leadde: keeping characters consistent in GPT Image 2](https://leadde.ai/blog/how-to-keep-characters-consistent-in-gpt-image-2-5-fix-face-and-pose-drift)
- **Supply several reference views at once.** A GPT Image 2.5 workflow passes a frontal view, a profile view and a lighting study together. Staged edits are more reliable than sweeping changes. — reported via search summary of [Leadde](https://leadde.ai/blog/how-to-keep-characters-consistent-in-gpt-image-2-5-fix-face-and-pose-drift) and NanoPic (secondary, unverified)
- **Shorter prompts drift less.** A video tutorial on GPT Image 2 character sheets found that a trimmed, visual-only prompt gave fewer inconsistencies than a long description, and that small errors can be fixed with follow-up edits. — [GPT Image 2 Character Sheets (video summary)](https://videohighlight.com/v/d7EOD-rdDNw)
- **Ropewalk ranking (published Jul 1, 2026; tests run Jun 11, 2026).** The ranking is the vendor's own assessment:
  - Nano Banana 2: best for multi-panel storyboards. It kept one character consistent across 4 panels in one generation, with no reference needed.
  - FLUX 2 Pro: best for photoreal character sheets (consistent 4-panel grid).
  - GPT Image 2: best for reference-driven identity edits (re-pose, restyle, re-outfit an existing character).
  - Seedream 4: best for multi-image sets from one reference.
  - Recraft V4 Pro: best for branded illustrated mascots. It locks the style and brand language rather than a photoreal face.
  - Relative cost in Ropewalk "gems" per image: FLUX 2 Pro 60, Seedream 4 120, GPT Image 2 130, Nano Banana 2 270, Recraft V4 Pro 1000.
  - Main failure mode: character drift (face, hair, outfit). Changing the lighting can make the model reinterpret the face, so keep lighting and camera language stable.
  — [Ropewalk: Best AI character consistency tools 2026](https://ropewalk.ai/blog/best-ai-tools-for-character-consistency-2026)
- **Midjourney V7 Omni-Reference.**
  - `--oref <image URL>` places a character, object or creature from a reference into a new image. Its influence is set with `--ow`.
  - V7 does not support `--cref`.
  - It accepts one reference image per prompt.
  - It is reported as incompatible with inpainting/outpainting (still V6.1), Fast/Draft/Conversational modes, and `--q 4`.
  — [CometAPI Omni-Reference guide](https://www.cometapi.com/?p=25326); [Upwork tutorial](https://www.upwork.com/resources/create-consistent-characters-midjourney); [Aiarty guide](https://www.aiarty.com/midjourney-guide/midjourney-omni-reference.htm)
- **Sources conflict on the `--ow` scale.** One guide says 0 to 1. Another gives bands such as 100–400 for strong resemblance. — [Aiarty](https://www.aiarty.com/midjourney-guide/midjourney-omni-reference.htm); [CometAPI](https://www.cometapi.com/?p=25326)
- **Omni-Reference reliability is disputed.** It is described as "still experimental", and one user review reports a failure rate above 50%. — [The AI Lab newsletter](https://theailab.substack.com/p/midjourney-v7-keeps-adding-features)
- **No official OpenAI guidance found.** These searches turned up no official OpenAI documentation on character sheets or consistency. All tips above come from creators and vendors. — [search context: getimg.ai 2026 guide](https://getimg.ai/blog/how-to-create-consistent-characters-with-ai)

### Inferences
- **Recommended pipeline for a stylised (non-photoreal) mascot.**
  - (1) Design the mascot once, then generate a turnaround or character sheet on a plain background: front, 3/4, profile, back, and 6–8 expressions.
  - (2) Freeze a short identity block (silhouette, 3–5 colour hex codes, signature accessory, eye shape, proportions such as "head = 1/2 of body height") and paste it verbatim into every prompt.
  - (3) Always attach the sheet plus the best "hero" image as references.
  - (4) Per generation, change only the pose, the action or the background.
  - (5) Fix small drift with a targeted edit or inpaint rather than regenerating.
  These steps follow directly from the cited reference-sheet and one-variable-at-a-time advice.
- **Style suits the downstream steps.** A flat or 2D cartoon style with a simple silhouette and few colours is more robust to drift, both in image models and later in image-to-video. It also suits the puppet/motion-design fallback in section 2.
- **Common failure modes and fixes.**
  - Colour shift: fix by giving hex codes and putting a colour swatch on the sheet.
  - Extra or missing accessories: fix by naming accessories explicitly and adding "no other accessories".
  - Proportion drift (head size, limb length): fix with the proportion ratio and a full-body reference.
  - Style creep toward generic 3D/Pixar rendering: fix by naming the style (e.g. "flat 2D vector, thick outline, no gradients") and re-attaching the style reference.
  - Face reinterpretation when lighting changes: keep the lighting constant (cited above).
- **Canva, Leonardo and Ideogram.** Each has its own character or reference features, but this research found no 2026 primary documentation on them. See Gaps.

### Gaps
- No official 2026 documentation was retrieved for Ideogram Character, Leonardo (character reference / Lucid / Phoenix), Canva Magic Media, or Flux Kontext (Ropewalk covers FLUX 2 Pro, not Kontext). Their current consistency features and prices are unverified.
- Official Midjourney docs were not retrieved, so the `--ow` range and the one-reference limit remain unconfirmed.
- No official OpenAI page on GPT Image 2 reference-image limits (count, fidelity setting) or ChatGPT plan quotas was retrieved.

## 2. Image-to-video and animation tools (Sora 2, Veo 3.1, Kling, Runway, Hailuo, Pika, invideo) and the motion-design alternative

### Takeaway
Sora 2 is no longer an option. OpenAI announced its shutdown on Mar 24, 2026: the app closed on Apr 26, 2026 and the API sunset on Sep 24, 2026. As of Aug 2026, the main candidates are:
- Google Veo 3.1: native audio, 8 s per generation, "ingredients" reference images for consistency.
- Kling 3.0: Elements references, up to 15 s single pass, subscription-priced, rated strongest on character consistency in comparisons.
- MiniMax Hailuo (H3, launched Jul 31, 2026).
- ByteDance Seedance 2.x.

Clips are short (6–15 s), so a 30–60 s Short is assembled from several clips. For a mascot series, a cheaper and more controllable path is to animate still images as cut-out puppets, or with pan/zoom, in an editor. Generative video can then be kept for hero shots.

### Cited Findings
- **Sora shutdown timeline.** Shutdown announced Mar 24, 2026. Web and mobile apps closed Apr 26, 2026. API end date Sep 24, 2026. Sora continues as a research project on world models. — [The Decoder](https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/); [Engadget](https://engadget.com/ai/openai-is-shutting-down-its-sora-video-generation-app-211023358.html); [Zilliz FAQ](https://zilliz.com/ai-faq/what-is-the-sora-shutdown-timeline)
- **Sora API status after Aug 2026.** One Aug 2026 article said the API still worked at that time, so actual deactivation on Sep 24 is confirmed only by secondary sources. — [invideo: Sora 2, what it was](https://invideo.io/blog/sora-ai-video-generator/)
- **Sora 2 pricing before shutdown, for reference.** $0.10/s (sora-2, 720p) to $0.70/s (sora-2-pro, 1080p). Durations up to 20 s. — [invideo AI video model pricing, Aug 6, 2026](https://invideo.io/blog/ai-video-model-pricing)
- **Veo 3.1 pricing (Gemini API, Aug 2026).**
  - Standard: $0.40/s (720p–1080p), $0.60/s (4K).
  - Fast: $0.10/s (720p), $0.12/s (1080p), $0.30/s (4K).
  - Lite: $0.05/s (720p), $0.08/s (1080p).
  - 8 s per generation. Audio is always on and included in the price.
  — [invideo pricing, Aug 2026](https://invideo.io/blog/ai-video-model-pricing)
- **Veo 3.1 vertical output and clip extension.** One comparison says Veo 3.1 supports native 9:16 vertical, and that scene extension chains 8 s segments. These are secondary claims; no Google doc was retrieved. — [search summary of Picsart / MindStudio comparisons](https://www.mindstudio.ai/blog/sora-vs-veo-3-1-vs-seedance-2-comparison-3)
- **Veo 3.1 "ingredients to video".** Reference images keep characters consistent across scenes. Sources conflict on the limit: 3 references in one comparison, 1–5 in another. — [invideo: Kling 3 vs Veo 3.1 (Aug 2026)](https://invideo.io/blog/kling-3-vs-veo-3-1/); [CometAPI Kling 3.0 vs Veo 3.1](https://www.cometapi.com/fr/kling-3-0-vs-veo-3-1/)
- **Kling 3.0 vs Veo 3.1 on consistency.** Kling's "Elements 3.0" consistency is rated "excellent" against Veo's "solid". Kling accepts 7 reference inputs and 15 s single-pass clips. Kling 4.0 was not yet generally available. — [invideo: Kling 3 vs Veo 3.1](https://invideo.io/blog/kling-3-vs-veo-3-1/); [vo3ai](https://www.vo3ai.com/kling-4-vs-veo3)
- **Kling pricing (Aug 2026).**
  - Subscription plans: Standard $10, Pro $37, Premier $92, Ultra $180 per month.
  - Free tier: 66 credits per day. Extending a video requires a paid plan.
  - The only official per-second rate is Kling 3.0 Turbo 720p at ¥0.8/s (about $0.11).
  - Kling 2.5 Turbo: 25 credits per 5 s clip.
  — [invideo pricing](https://invideo.io/blog/ai-video-model-pricing)
- **Hailuo / MiniMax pricing.**
  - Pre-H3 models, per finished video: $0.28 (6 s, 768p), $0.49 (6 s, 1080p), $0.56 (10 s, 768p).
  - MiniMax-H3: $0.13/s at 2K, launched Jul 31, 2026.
  - Failed generations are not billed.
  — [invideo pricing](https://invideo.io/blog/ai-video-model-pricing)
- **Seedance 2.x pricing.** About ¥1 (about $0.14) per second at 1080p. It is billed in tokens. — [invideo pricing](https://invideo.io/blog/ai-video-model-pricing)
- **9:16 support.** No 9:16 confirmation was found in the retrieved sources for Kling or Hailuo. — [invideo pricing](https://invideo.io/blog/ai-video-model-pricing) (states no aspect ratios)

### Inferences
- **Approximate cost per 45 s Short.** Using about 6 generated 8 s clips with a 2x retry margin, i.e. about 96 s of generation:
  - Veo 3.1 Fast 1080p: about $11.50.
  - Veo 3.1 Lite 1080p: about $7.70.
  - Veo 3.1 Standard: about $38.
  - Kling: Standard or Pro plan credits likely cover several Shorts a month.
  These are calculations from the Aug 2026 rates above, not quoted prices.
- **Image-to-video beats text-to-video for a mascot.** Animate from your approved key frames, using the character sheet as an ingredient or element where supported. Keep camera moves simple and clips short, since drift grows with duration and motion.
- **Low-cost alternative: "motion design from stills".** Generate key poses as separate PNGs with transparent backgrounds, then animate them in CapCut / After Effects / DaVinci Fusion:
  - Ken Burns pan/zoom.
  - Squash-and-stretch "bounce" keyframes.
  - Swapping between 2–3 mouth shapes to give lip-sync.
  - Blinks done with eyelid layers.
  - Parallax between background and character layers.
  This gives 100% character consistency and near-zero marginal cost. It suits a cute mascot well, and can be mixed with occasional generative clips. (Inference; no source retrieved on specific puppet tools such as Adobe Character Animator or Live2D.)
- **Monetisation risk of slideshows.** A pure slideshow of stills with scrolling text risks the YouTube "inauthentic content" exclusion (see section 5), so even a puppet approach needs real narrative and varied scenes.

### Gaps
- Runway (Gen-4 / Gen-4.5 references), Pika and invideo AI: no 2026 pricing or spec data was retrieved.
- 9:16 support could not be confirmed from primary docs for any model except via the Veo secondary claim.
- Official Google or Kuaishou documentation was not fetched. All figures come from invideo's Aug 2026 compilation, and invideo is itself a vendor that resells these models.

## 3. French AI voices (ElevenLabs etc.) for a cute mascot voice; music and SFX licensing

### Takeaway
ElevenLabs remains the default choice. Commercial use requires a paid plan: Starter at $6/month is the first tier with commercial rights, and Creator at $22/month is the typical creator tier. Its multilingual models cover French. A cute mascot voice can be made with Voice Design (described by prompt) or picked from the Voice Library. For music, YouTube Audio Library tracks are safe on YouTube, but the license must be checked per track: some require attribution (Creative Commons), and some are licensed for YouTube only.

### Cited Findings
- **ElevenLabs 2026 plan ladder.**
  - Free: $0, no commercial use.
  - Starter: $6, the first paid tier with commercial rights.
  - Creator: $22 (sometimes 50% off the first month).
  - Pro: $99. Scale: $299. Business: $990. Enterprise: custom.
  - Some third-party pages show older prices.
  — [Smallest.ai, ElevenLabs pricing 2026](https://smallest.ai/blog/elevenlabs-pricing-plans-cost-what-you-get-in-2026); [Fora Soft, May 31, 2026](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/elevenlabs-pricing-voice-cloning-no-fakes-act); [HappyRobot](https://www.happyrobot.ai/hub/elevenlabs-pricing)
- **Credit consumption estimates (sources differ).**
  - Eleven v3: about 1 credit per character, so Creator's ~121k credits give roughly 100–120 min of narration per month. — [frankx.ai workflow 2026](https://www.frankx.ai/blog/ultimate-elevenlabs-workflow-2026)
  - Multilingual v2: about 1,000 credits per minute. — [Hackceleration (FR)](https://hackceleration.com/fr/labs/combien-coute-elevenlabs)
- **No language surcharge found.** No source gives French-specific pricing; pricing appears to be per plan and per credit regardless of language. — inferred from the sources above
- **YouTube Audio Library licensing.**
  - Many tracks can be used anywhere if you comply with that track's license.
  - Some tracks are Creative Commons and need attribution.
  - The "Music in this video" panel does not replace a required credit in the description.
  - Tracks marked "no attribution" may be licensed for YouTube use only.
  — [SocialPilot](https://www.socialpilot.co/youtube-marketing/youtube-audio-library); [Foximusic guide (FR) 2026](https://www.foximusic.com/blog/fr/?p=546)

### Inferences
- **Voice workflow.**
  - Create a dedicated mascot voice with ElevenLabs Voice Design: "petite voix aiguë, enjouée, française, dessin animé".
  - Or pick a French Voice Library voice and raise its pitch slightly in the editor.
  - Lock the voice ID and settings (stability, style) for the whole series.
  - Use v3 audio tags or punctuation for expressiveness.
  - Keep the plan paid while publishing, because commercial rights come from the plan.
- **Do not clone a real person's voice without consent.** A recognisable voice also triggers the YouTube synthetic-content disclosure (section 5).
- **Keep license proof.** For SFX and music, keep a log of each track's licence. Prefer the YouTube Audio Library (YouTube-only use) or a subscription library with a licence certificate (Epidemic Sound, Artlist, Uppbeat) if the Shorts are also posted on TikTok or Instagram. No sources were retrieved on these third-party libraries.

### Gaps
- Official ElevenLabs pricing and terms pages were not fetched. Prices are from third-party aggregators.
- No retrieved comparison of French TTS alternatives (e.g. Google, Azure, OpenAI TTS, CapCut built-in voices) on quality for a cartoon voice.
- No retrieved primary YouTube Audio Library terms page.

## 4. Editing tools for Shorts (CapCut, Descript, Premiere, DaVinci) and caption styles

### Takeaway
No sources were retrieved specifically on Shorts editors or caption styles in this pass. The points below are practitioner inference, not sourced findings.

### Cited Findings
- No sources retrieved.

### Inferences
- CapCut (desktop/mobile) is the fastest route for 9:16 projects, with auto-captions in French, animated word-by-word caption templates, keyframes for puppet animation, and a built-in SFX library.
- Descript suits text-based editing of voiceover-led content and has auto-captions.
- DaVinci Resolve (free) and Premiere Pro offer more control: Fusion or After Effects for puppet rigs, plus auto-transcription captions.
- A typical caption style for Shorts:
  - 1–3 words on screen at a time, highlighting the active word.
  - Bold rounded sans-serif with a thick outline or drop shadow, in the mascot's palette.
  - Placed in the centre or lower-middle third, clear of YouTube's bottom UI overlay (title and buttons) and right-hand action column.
- Export at 1080×1920, 9:16, 30 or 60 fps, under the Shorts length limit.

### Gaps
- Not verified: current CapCut licensing terms for commercial use of its templates, stock and voices (relevant for monetised channels); 2026 pricing for CapCut Pro, Descript and Premiere; YouTube's current Shorts maximum length and safe-zone guidance. Each needs a primary-source check.

## 5. YouTube rules (synthetic-content disclosure, July 2025 inauthentic-content update), copyright of AI images (US, France/EU), OpenAI output terms

### Takeaway
- **Disclosure label.** YouTube's "altered or synthetic content" disclosure is required only for realistic content. Clearly unrealistic or animated content is exempt, so a cartoon mascot normally needs no label (unless it imitates a real person or realistic events or voices).
- **Monetisation.** The July 15, 2025 YPP change renamed "repetitious content" to "inauthentic content". It explicitly allows using AI to visualise your own unique character and narrative. It excludes templated, mass-produced AI content, characters repeatedly placed in the same situation with the same outcome, and image slideshows with little narrative value. A further tightening took effect around July 16, 2026, per secondary press.
- **Copyright.** Pure AI output is generally not copyrightable in the US, and doubtfully so in France. Human selection, arrangement and modification are protectable.
- **OpenAI terms.** OpenAI assigns to the user whatever rights it has in outputs, with no commercial-use restriction, but this does not guarantee exclusivity or copyright.

### Cited Findings
- **Disclosure: what is exempt.** Creators don't need to disclose content that is clearly unrealistic or animated, includes special effects, or uses beauty filters. — [YouTube Blog: disclosing AI-generated content](https://blog.youtube/news-and-events/disclosing-ai-generated-content); [YouTube Help 14328491](https://support.google.com/youtube/answer/14328491)
- **Disclosure: what is required.** Making a real person appear to say or do something they didn't. Altering footage of a real event or place. Generating a realistic-looking scene that didn't occur. — [YouTube Help 14328491](https://support.google.com/youtube/answer/14328491)
- **How disclosure works.** It is a toggle in YouTube Studio's upload flow, and the label appears in the expanded description. Content made with YouTube's own generative tools is labelled automatically. YouTube may add a label itself if creators consistently fail to disclose. — [YouTube Blog](https://blog.youtube/news-and-events/disclosing-ai-generated-content); [YouTube Help 14328491](https://support.google.com/youtube/answer/14328491)
- **Jul 15, 2025 policy update.** "Repetitious content" was renamed "inauthentic content" and clarified to cover repetitive or mass-produced content. The reused-content policy was unchanged. — [YouTube Help: Channel monetization policies (1311392)](https://support.google.com/youtube/answer/1311392)
- **Inauthentic content: allowed.** The same intro and outro with different main content. A series where each video has a distinct storyline, focus or concept. — [YouTube Help 1311392](https://support.google.com/youtube/answer/1311392)
- **Inauthentic content: not allowed.**
  - Repetitive content with low educational value or minimal variation.
  - Characters repeatedly placed in the same situation with the same outcome.
  - Image slideshows, templated storylines or scrolling text with little narrative or educational value.
  - AI-generated content made with generic or unoriginal templates.
  — [YouTube Help 1311392](https://support.google.com/youtube/answer/1311392)
- **AI explicitly allowed.** Using AI to visualise a unique character and narrative you created, or to edit scripts or generate background visuals, as long as the final video shows your creative vision. — [YouTube Help 1311392](https://support.google.com/youtube/answer/1311392)
- **AI explicitly not allowed.**
  - Stitching together unrelated or inconsistent AI clips to shock viewers.
  - Deceptive realistic visuals.
  - AI personas presenting as experts on sensitive topics (health, legal, finance, politics).
  — [YouTube Help 1311392](https://support.google.com/youtube/answer/1311392)
- **YouTube framed July 2025 as a minor clarification.** Creator liaison Rene Ritchie called it a "minor update". Using AI does not automatically disqualify content. — [eWeek](https://www.eweek.com/news/youtube-responds-to-ai-concerns/); [BetaNews, Jul 10, 2025](https://betanews.com/2025/07/10/youtube-is-fighting-ai-slop-with-new-monetization-guidelines/)
- **Further tightening reported for July 16, 2026.** The changes reportedly target repetitive AI videos, emotionally manipulative content, and AI avatars on sensitive topics, without banning AI video. This rests on one secondary source; the official changelog was not seen. — [TechRepublic, Jul 21, 2026](https://techrepublic.com/article/news-youtube-ai-video-monetization-rules)
- **US Copyright Office, Part 2 report (Jan 29, 2025).**
  - Prompts alone do not give enough human control to make the user the author of AI output.
  - Human authorship is protectable where it shows in creative selection, coordination or arrangement of AI outputs, or in creative modification of them.
  - Each case is decided individually, and no new legislation is needed.
  — [IPWatchdog](https://ipwatchdog.com/2025/01/29/part-two-copyright-office-ai-report-says-creative-prompting-doesnt-constitute-authorship/); [Copyright Alliance summary](https://copyrightalliance.org/ai-report-part-2-copyrightability/)
- **France: originality test.** Protection requires originality that reflects the author's personality ("empreinte de la personnalité", i.e. free creative choices). Works generated solely by AI are of doubtful protection. AI-assisted works with real human creative input can be protected. — [Blog du Modérateur](https://www.blogdumoderateur.com/droit-auteur-contenus-generes-ia/); [Blog du Modérateur (business use)](https://www.blogdumoderateur.com/peut-on-utiliser-images-generees-par-ia-pour-entreprise/)
- **France: CSPLA 2020 report.** It considered that existing law should accommodate AI-assisted creations and floated a possible special regime. This is reported via a lawyer's blog; the original was not verified. — [consultation.avocat.fr](https://consultation.avocat.fr/barreau-tours/blog/ludovic-de-la-monneraye/article-2971734-l-intelligence-artificielle-peut-elle-etre-auteure-d-une-oeuvre.html)
- **France: imitation risk.** Prompting "in the style of" an artist is not itself infringing. Reproducing a recognisable protected work or character engages the user's liability. — [Eurojuris](https://www.eurojuris.fr/categories/informatique-et-internet-6200/articles/images-generees-par-intelligence-articifielle-utilisation-43743.htm)
- **OpenAI Terms of Use (Dec 11, 2024 revision).**
  - Quoted text: "As between you and OpenAI, and to the extent permitted by applicable law, you (a) retain your ownership rights in Input and (b) own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output."
  - Output may not be unique; other users may receive similar output. The assignment excludes other users' output and third-party output.
  - The earlier Mar 2023 terms explicitly allowed commercial use (sale, publication) subject to compliance.
  — [OpenAI ToU revision 2024-12-11](https://openai.com/policies/row-terms-of-use/revisions/2024-12-11/); [OpenAI Mar 2023 terms](https://openai.com/policies/mar-2023-terms); [terms.law commentary](https://terms.law/ai-output-rights/chatgpt/)

### Inferences
- **Disclosure for this series.** For a stylised animated mascot, the YouTube "altered or synthetic" toggle is normally not required. It becomes required if a Short shows photorealistic scenes presented as real, or a realistic synthetic voice of a real person. Enabling it voluntarily carries no stated penalty.
- **Monetisation design rules for an AI mascot series** (derived from policy 1311392):
  - Each episode needs a distinct story, gag or idea. Avoid the same setup and punchline every time ("characters repeatedly placed in the same situation with the same outcome").
  - Avoid slideshow-only visuals with TTS over them.
  - Show the creator's creative vision: an original script, a consistent world and an authored voice.
  - Vary formats.
  - A recurring intro and outro is explicitly fine.
- **Protecting the mascot as IP.** Keep human-authored elements: hand sketches or edits of the design, written scripts, editing and arrangement, and a log of the design process. Consider a trademark (INPI / EUIPO) for the mascot name and logo, which does not depend on copyright authorship. The trademark route is an inference; trademark sources were not retrieved.
- **Tool terms.** Make sure each tool's terms allow commercial use on the plan used: ElevenLabs paid tier, Midjourney paid plan, Kling paid plan, CapCut commercial terms.

### Gaps
- The official YouTube changelog for the reported July 2026 update was not retrieved. Only TechRepublic reports it.
- EU AI Act transparency obligations (Art. 50, deepfake labelling, applicable from Aug 2026) and their relevance to cartoon content were not researched in this pass.
- The original CSPLA report and any French or EU court decisions on AI-generated images (2024–2026) were not retrieved.
- The current OpenAI Terms page (post-2024) could not be fetched (HTTP 403). It is unverified whether the 2024 wording still applies in Oct 2026, and whether OpenAI's image-generation usage policies add restrictions (e.g. on public figures or brand imitation).
