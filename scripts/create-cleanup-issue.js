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

  const { owner, repo } = context.repo;
  const total = parseInt(totalSeats, 10) || 0;
  const inactiveNum = parseInt(inactiveCount, 10) || 0;
  const active = total - inactiveNum;

  // Separate never-used users from inactive users
  const neverUsed = inactive.filter((u) => u.last_activity === 'never');
  const staleUsers = inactive.filter((u) => u.last_activity !== 'never');

  // --- Title with emojis ---
  const title = dryRun
    ? `🔍 [Copilot] Inactivity report — ${inactiveCount} users need attention`
    : `🧹 [Copilot] Revoked ${inactiveCount} inactive seats`;

  // --- Labels ---
  const labels = ['copilot-cleanup'];
  if (neverUsed.length > 0) labels.push('copilot-never-used');
  if (!dryRun) labels.push('copilot-revoked');

  // Ensure labels exist with proper colors
  const labelDefs = {
    'copilot-cleanup': { color: '1d76db', description: '🧹 Copilot seat cleanup report' },
    'copilot-never-used': { color: 'e4e669', description: '⚠️ Users who never activated Copilot' },
    'copilot-revoked': { color: 'd93f0b', description: '🚫 Copilot seats were revoked' },
  };

  for (const name of Object.keys(labelDefs)) {
    if (!labels.includes(name)) continue;
    try {
      await github.rest.issues.getLabel({ owner, repo, name });
    } catch {
      try {
        await github.rest.issues.createLabel({
          owner, repo, name, ...labelDefs[name],
        });
      } catch {
        // label may already exist via race condition
      }
    }
  }

  // --- Build body ---
  const modeNote = dryRun
    ? '> [!NOTE]\n> This was a **dry run**. No seats were revoked. Review the list below and re-run with dry run disabled to apply changes.'
    : '> [!IMPORTANT]\n> Seats have been **revoked** for **all** users listed below. They can request a new seat if needed.';

  const sections = [
    `# 📊 Copilot Seat Cleanup Report`,
    '',
    dryRun
      ? '> [!NOTE]\n> **Mode:** 🧪 Dry run — no changes were made'
      : '> [!WARNING]\n> **Mode:** ⚡ Revocations applied',
    '',
    '---',
    '',
    '## 📋 Overview',
    '',
    '| | Metric | Value |',
    '|---|--------|------:|',
    `| 🏢 | Organization | \`${org}\` |`,
    `| 📅 | Inactivity threshold | **${inactivityDays}** days |`,
    `| 👥 | Total seats | **${total}** |`,
    `| 🟢 | Active users | **${active}** |`,
    `| 🔴 | Inactive users | **${staleUsers.length}** |`,
    `| ⚠️ | Never used Copilot | **${neverUsed.length}** |`,
  ];

  // Alert callout for never-used users
  if (neverUsed.length > 0) {
    sections.push(
      '',
      '---',
      '',
      '## 🚨 Attention: Users who NEVER used Copilot',
      '',
      `> [!CAUTION]`,
      `> **${neverUsed.length}** user(s) have a Copilot seat assigned but have **never activated** it. These seats are consuming licenses with zero usage.`,
      '',
      '| # | User | Seat assigned |',
      '|--:|------|---------------|',
    );
    neverUsed.forEach((u, i) => {
      sections.push(`| ${i + 1} | @${u.login} | ${u.created_at || 'unknown'} |`);
    });
  }

  // Stale users section
  if (staleUsers.length > 0) {
    sections.push(
      '',
      '---',
      '',
      `## 😴 Inactive Users (${staleUsers.length})`,
      '',
      'These users were previously active but have not used Copilot within the inactivity threshold.',
      '',
      '<details>',
      `<summary>Show ${staleUsers.length} inactive user(s)</summary>`,
      '',
      '| # | User | Last Activity |',
      '|--:|------|---------------|',
    );
    staleUsers.forEach((u, i) => {
      sections.push(`| ${i + 1} | @${u.login} | ${u.last_activity} |`);
    });
    sections.push('', '</details>');
  }

  // Footer
  sections.push('', '---', '', modeNote);

  const body = sections.join('\n');

  await github.rest.issues.create({
    owner, repo, title, body, labels,
  });
};
