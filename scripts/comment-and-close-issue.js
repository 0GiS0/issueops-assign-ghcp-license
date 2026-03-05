// Comment result, label, and close a Copilot seat request issue.
// Used with actions/github-script:
//   script: |
//     const run = require('./scripts/comment-and-close-issue.js');
//     await run({ github, context, core });
//
// Required env: RESULT, MESSAGE, USER

module.exports = async ({ github, context, core }) => {
  const issue_number = context.payload.issue?.number;
  if (!issue_number) {
    core.info('No issue in context; skipping comment/label/close.');
    return;
  }

  const { owner, repo } = context.repo;
  const result = process.env.RESULT || 'error';
  const msg = process.env.MESSAGE || 'Unknown error.';
  const user = process.env.USER;

  const labels = [];
  if (result === 'assigned' || result === 'already_assigned') {
    labels.push('copilot-assigned');
  } else {
    labels.push('copilot-error');
  }

  // Ensure labels exist (best-effort)
  for (const name of ['copilot-assigned', 'copilot-error', 'copilot-seat-request']) {
    try {
      await github.rest.issues.getLabel({ owner, repo, name });
    } catch {
      try {
        await github.rest.issues.createLabel({
          owner,
          repo,
          name,
          color: name.includes('error') ? 'd73a4a' : '0e8a16',
          description: 'Managed by IssueOps Copilot seat workflow',
        });
      } catch {
        // ignore - label may already exist via race condition
      }
    }
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body: `Copilot seat request for @${user}: **${result}**\n\n${msg}`,
  });

  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels,
  });

  if (result === 'assigned' || result === 'already_assigned') {
    await github.rest.issues.update({
      owner,
      repo,
      issue_number,
      state: 'closed',
    });
  }
};
