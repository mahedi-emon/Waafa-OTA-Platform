/**
 * Conventional Commits that reference the issue, e.g. `feat(web): unified search card (#12)`.
 * The commit-msg hook also runs scripts/check-attribution.mjs (no co-author or AI attribution).
 * @type {import("@commitlint/types").UserConfig}
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Long bodies are fine (squash merges carry the PR summary); keep the subject readable.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "header-max-length": [2, "always", 100],
    "subject-case": [0],
  },
};

export default config;
