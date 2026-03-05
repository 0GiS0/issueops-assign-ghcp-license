// Extract target username from a GitHub Issue Form body.
// Used with actions/github-script:
//   script: |
//     const run = require('./scripts/parse-issue-username.js');
//     await run({ github, context, core });

module.exports = async ({ github, context, core }) => {
  const body = context.payload.issue?.body || '';

  const match = body.match(
    /###\s*GitHub username\s*[\r\n]+([\s\S]*?)(?:\r?\n\r?\n|\r?\n###\s|$)/i
  );
  if (!match) {
    core.setFailed('Could not find GitHub username in issue form.');
    return;
  }

  const firstLine = match[1]
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)[0];

  if (!firstLine) {
    core.setFailed('GitHub username field is empty.');
    return;
  }

  const target = firstLine.replace(/^@/, '').trim();
  core.setOutput('target', target);
  core.setOutput('org', process.env.ORG);
};
