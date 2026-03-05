#!/usr/bin/env bash
set -euo pipefail

# Write Copilot seat cleanup Job Summary.
# Required env:
#   ORG              - GitHub organization
#   DRY_RUN          - "true" or "false"
#   INACTIVITY_DAYS  - Inactivity threshold in days
#   INACTIVE_USERS   - JSON array of inactive users (may be empty)
#   INACTIVE_COUNT   - Number of inactive users
#   TOTAL_SEATS      - Total number of Copilot seats
#   GITHUB_STEP_SUMMARY - GitHub Actions step summary file

total="${TOTAL_SEATS:-0}"
inactive="${INACTIVE_COUNT:-0}"
active=$((total - inactive))

# Calculate usage percentage for visual indicator
if [[ "$total" -gt 0 ]]; then
  active_pct=$((active * 100 / total))
else
  active_pct=0
fi

{
  # Header with mode badge
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "# :mag: Copilot Seat Cleanup Report"
    echo ""
    echo "> **Mode:** :test_tube: Dry run — no changes were made"
  else
    echo "# :broom: Copilot Seat Cleanup Report"
    echo ""
    echo "> **Mode:** :warning: Revocations applied"
  fi

  echo ""
  echo "---"
  echo ""

  # Metrics dashboard
  echo "## :bar_chart: Overview"
  echo ""
  echo "| | Metric | Value |"
  echo "|---|--------|------:|"
  echo "| :office: | Organization | \`$ORG\` |"
  echo "| :calendar: | Inactivity threshold | **$INACTIVITY_DAYS** days |"
  echo "| :busts_in_silhouette: | Total seats | **$total** |"
  echo "| :green_circle: | Active users | **$active** |"
  echo "| :red_circle: | Inactive users | **$inactive** |"
  echo ""

  # Seat utilization bar
  echo "**Seat utilization:** ${active_pct}%"
  echo ""

  echo "---"
  echo ""

  # Inactive users section
  if [[ "$inactive" -gt 0 ]]; then
    echo "## :busts_in_silhouette: Inactive Users ($inactive)"
    echo ""
    echo "<details>"
    echo "<summary>Click to expand the full list</summary>"
    echo ""
    echo "| # | User | Last Activity |"
    echo "|--:|------|---------------|"
    echo "$INACTIVE_USERS" | jq -r 'to_entries[] | "| \(.key + 1) | @\(.value.login) | \(.value.last_activity) |"'
    echo ""
    echo "</details>"
  else
    echo "## :white_check_mark: All users are active!"
    echo ""
    echo "No users have been inactive for more than **$INACTIVITY_DAYS** days."
  fi
} >> "$GITHUB_STEP_SUMMARY"
