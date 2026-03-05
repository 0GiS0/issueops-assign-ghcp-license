#!/usr/bin/env bash
set -euo pipefail

# Find inactive Copilot seats in an organization.
# Required env:
#   ORG              - GitHub organization
#   GH_TOKEN         - GitHub token with copilot scope
#   INACTIVITY_DAYS  - Number of days to consider as inactive
#   GITHUB_OUTPUT    - GitHub Actions output file
#
# Optional env:
#   API_VERSION      - GitHub API version (default: 2022-11-28)

API_VERSION="${API_VERSION:-2022-11-28}"

# Validate INACTIVITY_DAYS is a positive integer
if ! [[ "$INACTIVITY_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::INACTIVITY_DAYS must be a positive integer, got: '$INACTIVITY_DAYS'"
  exit 1
fi

common_headers=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: $API_VERSION"
)

echo "Fetching Copilot seats for $ORG (inactivity threshold: $INACTIVITY_DAYS days)"

cutoff_date=$(date -d "-${INACTIVITY_DAYS} days" -u +%Y-%m-%dT%H:%M:%SZ)
echo "Cutoff date: $cutoff_date"

# Paginate through all seats
page=1
all_seats="[]"

while true; do
  response=$(gh api \
    "/orgs/$ORG/copilot/billing/seats?per_page=100&page=$page" \
    "${common_headers[@]}" 2>&1) || {
    echo "::error::Failed to fetch seats (page $page): $response"
    exit 1
  }

  seats=$(echo "$response" | jq -c '.seats // []')
  count=$(echo "$seats" | jq 'length')

  if [[ "$count" -eq 0 ]]; then
    break
  fi

  all_seats=$(echo "$all_seats $seats" | jq -s 'add')
  ((page++))
done

total=$(echo "$all_seats" | jq 'length')
echo "Total seats: $total"

# Filter inactive users
inactive_users=$(echo "$all_seats" | jq -c --arg cutoff "$cutoff_date" '
  [.[] | select(
    .last_activity_at == null or
    .last_activity_at < $cutoff
  ) | {
    login: .assignee.login,
    last_activity: (.last_activity_at // "never"),
    created_at: .created_at
  }]
')

inactive_count=$(echo "$inactive_users" | jq 'length')
echo "Inactive users: $inactive_count"

# Write outputs using random delimiter to avoid collisions
delimiter=$(openssl rand -hex 8)
{
  echo "inactive_users<<${delimiter}"
  echo "$inactive_users"
  echo "${delimiter}"
  echo "inactive_count=${inactive_count}"
  echo "total_seats=${total}"
} >> "$GITHUB_OUTPUT"
