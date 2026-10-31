#!/usr/bin/env bash
set -euo pipefail
[[ $(uname -m) == x86_64 ]] || { printf '%s\n' 'Use the verified matching gitleaks release for this architecture.' >&2; exit 2; }
directory=$(mktemp -d)
trap 'rm -rf -- "$directory"' EXIT
curl --fail --silent --show-error --location --max-time 60 \
  https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz -o "$directory/gitleaks.tar.gz"
printf '%s  %s\n' 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb "$directory/gitleaks.tar.gz" | sha256sum -c -
tar -xzf "$directory/gitleaks.tar.gz" -C "$directory" gitleaks
"$directory/gitleaks" git --redact --no-banner .
mkdir "$directory/reviewed-source"
git ls-files -z --cached --others --exclude-standard | python3 -c '
import pathlib,shutil,sys
destination=pathlib.Path(sys.argv[1])
for name in sys.stdin.buffer.read().split(b"\0"):
 if not name: continue
 source=pathlib.Path(name.decode())
 if source.is_file() and not source.is_symlink():
  target=destination/source;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
' "$directory/reviewed-source"
"$directory/gitleaks" dir --redact --no-banner "$directory/reviewed-source"
