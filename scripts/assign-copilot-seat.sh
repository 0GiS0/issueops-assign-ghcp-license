#!/usr/bin/env bash
set -euo pipefail

# Minimal helper for Copilot seat management via gh api.
# Required env:
#   ORG
#   GH_TOKEN
# Usage:
#   scripts/copilot-seat.sh status <username>
#   scripts/copilot-seat.sh assign <username>

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
  echo "Usage: $0 <status|assign> <username>" >&2
  exit 2
fi

user="${user#@}"

common_headers=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
)

case "$cmd" in
  status)
    gh api "orgs/$ORG/members/$user/copilot" "${common_headers[@]}" || exit 1
    ;;
  assign)
    gh api -X POST "orgs/$ORG/copilot/billing/selected_users" \
      "${common_headers[@]}" \
      -f "selected_usernames[]=$user"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    exit 2
    ;;
esac
