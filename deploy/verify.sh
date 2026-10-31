#!/usr/bin/env bash
set -euo pipefail
[[ $# -eq 0 ]] || exit 2
exec /usr/bin/env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin HOME=/root \
  /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release verify
