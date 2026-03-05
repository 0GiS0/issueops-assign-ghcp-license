#!/usr/bin/env bash
set -euo pipefail

# Copilot seat management helper via gh api.
# Required env:
#   ORG       - GitHub organization
#   GH_TOKEN  - GitHub token with copilot scope
#
# Optional env:
#   API_VERSION - GitHub API version (default: 2022-11-28)
#
# Usage:
#   scripts/assign-copilot-seat.sh membership <username>
#   scripts/assign-copilot-seat.sh status <username>
#   scripts/assign-copilot-seat.sh assign <username>

require_env() {
  local name="$1"
  if [[ -z "${!name-}" ]]; then
    echo "Missing env: $name" >&2
    exit 2
  fi
}

require_env ORG
require_env GH_TOKEN

cmd="${1-}"
user="${2-}"

if [[ -z "$cmd" || -z "$user" ]]; then
  echo "Usage: $0 <membership|status|assign> <username>" >&2
  exit 2
fi

user="${user#@}"

API_VERSION="${API_VERSION:-2022-11-28}"

common_headers=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: $API_VERSION"
)

case "$cmd" in
  membership)
    # Returns the membership state (active, pending) or empty on error.
    gh api "/orgs/$ORG/memberships/$user" "${common_headers[@]}" --jq .state 2>/dev/null || echo ""
    ;;
  status)
    gh api "/orgs/$ORG/members/$user/copilot" "${common_headers[@]}" || exit 1
    ;;
  assign)
    gh api -X POST "/orgs/$ORG/copilot/billing/selected_users" \
      "${common_headers[@]}" \
      -f "selected_usernames[]=$user"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    exit 2
    ;;
esac
