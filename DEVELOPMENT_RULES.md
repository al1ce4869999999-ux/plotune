# plotune DEVELOPMENT_RULES

This is the repository-side development policy for plotune. It follows the execution and verification principles of moco.'s DEVELOPMENT_RULES.md, adapted for a browser-based music composition app. A green CI does not prove music quality or working iPhone playback.

## Roles and execution order
1. GPT inspects current GitHub source, branch HEAD, existing design and CI; scopes, implements and verifies available direct operations first.
2. Delegate materially complex coding and testing to Codex when appropriate. Use a browser/Work only for actions not possible with direct tools.
3. Ask the user to operate tools only after AI-side alternatives are checked. Never request secrets in chat.
4. If blocked, prepare an executable handoff with target, verified state, steps, prohibitions and acceptance criteria; report the task incomplete until verified.

## GitHub and release safety
- Read this document from the target branch before changing code. Verify HEAD and preserve existing musical behavior unless explicitly changing it.
- Do not modify main, live GitHub Pages, public releases, authentication, or deployment settings without explicit authorization.
- Develop in a separate branch, run CI, review the diff, and open a PR before merging. No unreviewed production changes or surprise deployments.
- Do not initiate billable services, paid inference, or irreversible operations without authorization.
- GitHub Actions may run on push to development branches or PRs; do not confuse a successful workflow with a deployed release.

## Composition architecture and musical invariants
- Normal songs, music boxes, flutes and character themes should share compatible phrase/melody composition concepts while keeping instrument articulation and arrangement distinct.
- Generate and inspect phrase-level pitch, onset, duration, rest, repetition/variation, cadences and emotional trajectory; verify how harmony and melodic tension/resolution influence one another.
- Preserve requested sound identity, including handheld/DS timbres, piano, ocarina/flute, and storybook atmospheres.
- Every musical change needs a precise explanation of which rules changed and why: do not claim that different pitches alone means a perceptually different melody.
- Ensure stable seeded examples when deterministic generation is supported; keep baseline fixtures and record measurable differences.

## Verification gates
- Keep syntax/unit, structural/seeded music tests, audio rendering/playback, listening A/B and mobile iPhone Safari checks distinct.
- Test representative routes, instrumentation, rhythmic variation, cadences, harmonic tension/resolution and previous regression fixtures when those systems are affected.
- Compare pre/post outputs under matched seeds and conditions; document observable changes, failures and uncertainty.
- A generated MIDI/event list is not proof the audio sounds right. Code-only tests do not prove iPhone Safari audio works. Require user listening feedback for subjective quality; do not claim subjective acceptance without it.
- Never call a fix verified if the exact revised commit or deployed version was not actually tested.

## Mobile feedback and result handoff
- Every async user operation (generate, audition, compare, export) must show pending, success/empty and failure states; explain meaningful disabled actions.
- Do not require downloads/uploads or many repeated copy steps from an iPhone as the default feedback path. Provide accessible on-screen, selectable, reasonably compact diagnostics for experiments.
- Each A/B experiment should store or expose its source commit, preset, seed, parameters, comparison arms, generated events, relevant engine rules, outcomes and errors so GPT can analyze the result.
- Validate no-download result access and the anticipated result size before asking for extensive user testing. Do not expose private data or bypass access controls.

## Issue logging and progress
- Record each significant bug or experiment in GitHub Issues: problem, reproducible steps, suspected/verified root cause (clearly distinguish them), change, baseline and post-change tests, audible result (when actually heard), unresolved concerns and source commit.
- Maintain a running roadmap / progress checkpoint in GitHub: completed implementation, verified implementation, unverified audio/mobile checks, active priorities and next action.
- Record unresolved failures instead of masking them with optimistic completion language.

## Before reporting completion
- Report exact files/commit/branch/PR and tests actually performed, and distinguish proposed, committed, CI-tested, deployed, device-tested and listening-approved states.
- Check remaining directly executable fixes and tests before asking the user for action. Provide actionable handoff for any blocked task.
- Do not replace a requested implementation with a status explanation.

## CI-enforced invariants
- `node scripts/check-development-rules.mjs` checks mandatory sections and required checks against accidental removal.
- This safeguard is not proof of actual release safety, A/B listening quality, mobile behavior or successful handoffs.
