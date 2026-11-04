#!/usr/bin/env bash
# Reviewed system-file bootstrap. No project root, releases tree or app checkout.
set -euo pipefail
umask 077
[[ $EUID -eq 0 && $# -eq 0 ]] || { printf '%s\n' 'Usage (root): installed homemind-landingpage-bootstrap (no arguments)' >&2; exit 2; }
for command in docker python3 ss flock sudo visudo useradd install; do command -v "$command" >/dev/null; done
docker compose version >/dev/null
python3 - <<'PY'
import pathlib,runpy
m=runpy.run_path('/usr/local/sbin/homemind-landingpage-release',run_name='bootstrap_validation')
c=m['Controller']()
c.protected()
c.capacity()
c.proxy('check')
key=pathlib.Path('/etc/homemind-landingpage-deploy.pub').read_text().strip().split()
m['require'](len(key)>=2 and key[0]=='ssh-ed25519', 'Dedicated PUBLIC key required')
PY
if id homemind >/dev/null 2>&1; then
  [[ -f /etc/homemind-landingpage-identity-managed ]] || { printf '%s\n' 'Existing homemind user requires collision audit.' >&2; exit 1; }
  [[ $(getent passwd homemind | cut -d: -f6) == /home/homemind && $(id -nG homemind) == homemind ]] || exit 1
else
  useradd --create-home --shell /bin/bash homemind
fi
# OS-managed SSH home; no application source or deployment root here.
chown root:root /home/homemind
chmod 0755 /home/homemind
install -d -o root -g root -m 0755 /home/homemind/.ssh
backup_prefix="/var/backups/homemind-landingpage-bootstrap-$(date -u +%Y%m%dT%H%M%SZ)-$$"
if [[ -e /home/homemind/.ssh/authorized_keys ]]; then cp -a /home/homemind/.ssh/authorized_keys "$backup_prefix-authorized_keys"; fi
read -r key_type key_data _ < /etc/homemind-landingpage-deploy.pub
printf 'restrict,command="/usr/local/sbin/homemind-landingpage-ssh" %s %s\n' "$key_type" "$key_data" > /home/homemind/.ssh/authorized_keys
chown root:root /home/homemind/.ssh/authorized_keys
chmod 0644 /home/homemind/.ssh/authorized_keys
candidate=$(mktemp /run/homemind-landingpage-sudoers.XXXXXX)
trap 'rm -f -- "$candidate"' EXIT
printf '%s\n' 'Defaults:homemind !setenv' 'homemind ALL=(root) NOPASSWD: /usr/local/sbin/homemind-landingpage-deploy *, /usr/local/sbin/homemind-landingpage-rollback --if-current *' > "$candidate"
visudo -cf "$candidate"
if [[ -e /etc/sudoers.d/homemind-landingpage ]]; then cp -a /etc/sudoers.d/homemind-landingpage "$backup_prefix-sudoers"; fi
install -o root -g root -m 0440 "$candidate" /etc/sudoers.d/homemind-landingpage
printf '%s\n' PRM392-HOMEMIND/homemind_landingpage > /etc/homemind-landingpage-identity-managed
chmod 0600 /etc/homemind-landingpage-identity-managed
printf '%s\n' 'Scoped SSH identity installed; root wrappers and config validated; no app directory was created.' "Backup prefix (files only when prior files existed): $backup_prefix"
