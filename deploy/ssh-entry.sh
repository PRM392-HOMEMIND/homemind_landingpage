#!/usr/bin/env bash
set -euo pipefail
command=${SSH_ORIGINAL_COMMAND:-}
if [[ $command == owner-policy ]]; then
  exec /usr/bin/sudo -n -- /usr/local/sbin/homemind-landingpage-deploy --owner-policy
fi
if [[ $command =~ ^deploy\ ([a-f0-9]{40})\ (sha256:[a-f0-9]{64})\ ([1-9][0-9]{0,11})$ ]]; then
  exec /usr/bin/sudo -n -- /usr/local/sbin/homemind-landingpage-deploy "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}"
fi
if [[ $command =~ ^rollback-if\ ([a-f0-9]{40})\ (sha256:[a-f0-9]{64})\ ([1-9][0-9]{0,11})$ ]]; then
  exec /usr/bin/sudo -n -- /usr/local/sbin/homemind-landingpage-rollback --if-current "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}"
fi
printf '%s\n' 'Only a validated digest deployment is permitted by this SSH identity.' >&2
exit 2
