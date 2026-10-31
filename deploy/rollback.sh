#!/usr/bin/env bash
set -euo pipefail
if [[ $# -eq 0 ]]; then
  args=(rollback)
elif [[ $# -eq 4 && $1 == --if-current && $2 =~ ^[a-f0-9]{40}$ && $3 =~ ^sha256:[a-f0-9]{64}$ && $4 =~ ^[1-9][0-9]{0,11}$ ]]; then
  args=(rollback-if "$2" "$3" "$4")
else
  exit 2
fi
exec /usr/bin/env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin HOME=/root \
  /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release "${args[@]}"
