// Create a summary issue for Copilot seat cleanup.
// Used with actions/github-script:
//   script: |
//     const run = require('./scripts/create-cleanup-issue.js');
//     await run({ github, context, core });
//
// Required env: INACTIVE_USERS, INACTIVE_COUNT, TOTAL_SEATS, DRY_RUN, INACTIVITY_DAYS, ORG

module.exports = async ({ github, context, core }) => {
  const inactive = JSON.parse(process.env.INACTIVE_USERS);
  const dryRun = process.env.DRY_RUN === 'true';
  const inactivityDays = process.env.INACTIVITY_DAYS;
  const org = process.env.ORG;
  const inactiveCount = process.env.INACTIVE_COUNT;
  const totalSeats = process.env.TOTAL_SEATS;

  let table = '| User | Last Activity |\n|------|---------------|\n';
  for (const u of inactive) {
    table += `| @${u.login} | ${u.last_activity} |\n`;
  }

  const title = dryRun
    ? `[Copilot] Inactivity report (${inactiveCount} users)`
    : `[Copilot] Revoked ${inactiveCount} inactive seats`;

  const mode = dryRun ? 'Dry run (no changes)' : 'Revocations applied';

  const body = [
    '## Copilot Seat Cleanup Report',
    '',
    `**Organization:** ${org}`,
    `**Inactivity threshold:** ${inactivityDays} days`,
    `**Mode:** ${mode}`,
    `**Total seats:** ${totalSeats}`,
    `**Inactive users:** ${inactiveCount}`,
    '',
    '### Inactive Users',
    '',
    table,
    dryRun
      ? '> This was a dry run. No seats were revoked.'
      : '> Seats have been revoked for the users listed above.',
  ].join('\n');

  await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title,
    body,
    labels: ['copilot-cleanup'],
  });
};
