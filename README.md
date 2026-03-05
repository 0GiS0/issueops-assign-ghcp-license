# issueops-assign-ghcp-license

IssueOps workflow to assign a **GitHub Copilot Business/Enterprise** seat to an org member via issue comments.

## How it works
1. Create a request using the issue form: **Request GitHub Copilot seat**.
2. An **organization owner** comments on the issue:
   - `/copilot-assign` (uses the username from the issue form)
   - `/copilot-assign @octocat` (explicit override)
   - (optional) `/copilot-status @octocat`
3. The workflow validates the commenter is an org owner, then calls the Copilot seat management REST API.

Org: `AgenticGroot`

## Required GitHub App
This implementation is **GitHub App only** (no PAT fallback).

### 1) Create + install the App
Create a GitHub App and install it on the `AgenticGroot` organization.

**Important:** GitHub Docs for these Copilot billing endpoints explicitly mention OAuth/PAT scopes (preview) and do **not** state GitHub Apps are supported. If the API rejects GitHub App tokens (401/403), this automation will not work (by design).

### 2) App permissions (suggested starting point)
You may need to iterate here depending on what GitHub accepts for these endpoints, but to support the checks we do:
- Organization members: **Read** (for `GET /orgs/{org}/memberships/{actor}` and `GET /orgs/{org}/memberships/{username}`)

The Copilot seat call is:
- `POST /orgs/{org}/copilot/billing/selected_users`

### 3) Repo configuration
Set:
- Repo variable: `COPILOT_APP_ID` (App ID)
- Repo secret: `COPILOT_APP_PRIVATE_KEY` (PEM)

The workflow uses `actions/create-github-app-token@v2` to mint an installation token scoped to the `AgenticGroot` installation.

### 4) Validation (recommended)
Use the manual trigger to validate the App token can call the Copilot endpoints before relying on IssueOps:
- Run workflow: **IssueOps: Assign Copilot seat**
- `command`: `copilot-status` (or `copilot-assign`)
- `username`: a test org member

## Helper script (optional)
There is a small helper at `scripts/assign-copilot-seat.sh` to run the same `gh api` calls locally.

## Notes
- The Copilot seat endpoints are **preview** and may change.
- The `/copilot-assign` path will comment + label and close the issue on success.
