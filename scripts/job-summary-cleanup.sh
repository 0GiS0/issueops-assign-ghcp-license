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

{
  echo "## Copilot Seat Cleanup Report"
  echo ""
  echo "| Metric | Value |"
  echo "|--------|-------|"
  echo "| **Organization** | $ORG |"
  echo "| **Inactivity threshold** | $INACTIVITY_DAYS days |"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "| **Mode** | Dry run |"
  else
    echo "| **Mode** | Revocations |"
  fi
  echo "| **Total seats** | $total |"
  echo "| **Inactive users** | $inactive |"
  echo "| **Active users** | $active |"
  echo ""

  if [[ "$inactive" -gt 0 ]]; then
    echo "### Inactive Users"
    echo ""
    echo "| User | Last Activity |"
    echo "|------|---------------|"
    echo "$INACTIVE_USERS" | jq -r '.[] | "| @\(.login) | \(.last_activity) |"'
  else
    echo "### All users are active!"
    echo ""
    echo "No users have been inactive for more than $INACTIVITY_DAYS days."
  fi
} >> "$GITHUB_STEP_SUMMARY"
