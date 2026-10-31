#!/usr/bin/env bash
set -euo pipefail
if [[ $# -eq 1 && $1 == --owner-policy ]]; then
  exec /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release owner-policy
fi
[[ $# -eq 3 ]] || { printf '%s\n' 'Usage: deploy.sh COMMIT_SHA IMAGE_DIGEST RUN_NUMBER' >&2; exit 2; }
[[ $1 =~ ^[a-f0-9]{40}$ && $2 =~ ^sha256:[a-f0-9]{64}$ && $3 =~ ^[1-9][0-9]{0,11}$ ]] || exit 2
exec /usr/bin/env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin HOME=/root \
  /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release deploy "$1" "$2" "$3"
