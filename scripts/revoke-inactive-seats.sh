#!/usr/bin/env bash
set -euo pipefail

# Revoke inactive Copilot seats.
# Required env:
#   ORG             - GitHub organization
#   GH_TOKEN        - GitHub token with copilot scope
#   DRY_RUN         - "true" to only report, "false" to revoke
#   INACTIVE_USERS  - JSON array of inactive users
#   GITHUB_OUTPUT   - GitHub Actions output file
#
# Optional env:
#   API_VERSION     - GitHub API version (default: 2022-11-28)

API_VERSION="${API_VERSION:-2022-11-28}"

common_headers=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: $API_VERSION"
)

revoked=""
failed=""

for login in $(echo "$INACTIVE_USERS" | jq -r '.[].login'); do
  echo "Processing: $login"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would revoke seat for $login"
    revoked="${revoked}${login}\n"
    continue
  fi

  if gh api -X DELETE \
    "/orgs/$ORG/copilot/billing/selected_users" \
    "${common_headers[@]}" \
    -f "selected_usernames[]=$login" 2>&1; then
    echo "  Revoked seat for $login"
    revoked="${revoked}${login}\n"
  else
    echo "  Failed to revoke seat for $login"
    failed="${failed}${login}\n"
  fi
done

# Write outputs using random delimiters
delim_revoked=$(openssl rand -hex 8)
delim_failed=$(openssl rand -hex 8)
{
  echo "revoked<<${delim_revoked}"
  echo -e "$revoked"
  echo "${delim_revoked}"
  echo "failed<<${delim_failed}"
  echo -e "$failed"
  echo "${delim_failed}"
} >> "$GITHUB_OUTPUT"
