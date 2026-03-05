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

  const total = parseInt(totalSeats, 10) || 0;
  const inactiveNum = parseInt(inactiveCount, 10) || 0;
  const active = total - inactiveNum;

  let table = '| # | User | Last Activity |\n|--:|------|---------------|\n';
  inactive.forEach((u, i) => {
    table += `| ${i + 1} | @${u.login} | ${u.last_activity} |\n`;
  });

  const title = dryRun
    ? `[Copilot] Inactivity report (${inactiveCount} users)`
    : `[Copilot] Revoked ${inactiveCount} inactive seats`;

  const modeLabel = dryRun
    ? ':test_tube: Dry run — no changes were made'
    : ':warning: Revocations applied';

  const modeNote = dryRun
    ? '> **Note:** This was a dry run. No seats were revoked.'
    : '> **Action taken:** Seats have been revoked for the users listed above.';

  const body = [
    `# :bar_chart: Copilot Seat Cleanup Report`,
    '',
    `> **Mode:** ${modeLabel}`,
    '',
    '---',
    '',
    '## Overview',
    '',
    '| | Metric | Value |',
    '|---|--------|------:|',
    `| :office: | Organization | \`${org}\` |`,
    `| :calendar: | Inactivity threshold | **${inactivityDays}** days |`,
    `| :busts_in_silhouette: | Total seats | **${total}** |`,
    `| :green_circle: | Active users | **${active}** |`,
    `| :red_circle: | Inactive users | **${inactiveNum}** |`,
    '',
    '---',
    '',
    `## :busts_in_silhouette: Inactive Users (${inactiveNum})`,
    '',
    '<details>',
    '<summary>Click to expand the full list</summary>',
    '',
    table,
    '</details>',
    '',
    modeNote,
  ].join('\n');

  await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title,
    body,
    labels: ['copilot-cleanup'],
  });
};
