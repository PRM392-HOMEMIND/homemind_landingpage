#!/usr/bin/env bash
set -euo pipefail
[[ $# -eq 3 && $2 =~ ^[a-f0-9]{40}$ && $3 =~ ^(linux/amd64|linux/arm64)$ ]] || exit 2
image=$1
sha=$2
platform=$3
port=${SMOKE_HOST_PORT:-3300}
[[ $port =~ ^[0-9]{4,5}$ && $port -ge 1024 && $port -le 65535 ]] || exit 2
name="homemind-landingpage-ci-$$"
failed_name="$name-failure"
cleanup() {
  local result=$?
  if docker container inspect "$failed_name" >/dev/null 2>&1; then docker rm -f "$failed_name" >/dev/null; fi
  if docker container inspect "$name" >/dev/null 2>&1; then
    if [[ $result -ne 0 ]]; then docker logs --tail 80 "$name"; fi
    docker rm -f "$name" >/dev/null
  fi
  return "$result"
}
trap cleanup EXIT
docker run -d --name "$name" --platform "$platform" --init --read-only \
  --cap-drop ALL --security-opt no-new-privileges:true --memory 512m --memory-swap 512m \
  --cpus 1 --pids-limit 128 --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --tmpfs /app/.next/cache:rw,nosuid,size=64m,uid=1000,gid=1000 \
  -p "127.0.0.1:$port:3000" "$image"
for _attempt in {1..45}; do
  status=$(docker inspect --format '{{.State.Health.Status}}' "$name")
  [[ $status == healthy ]] && break
  [[ $status == unhealthy ]] && { printf '%s\n' 'Production image unhealthy' >&2; exit 1; }
  sleep 2
done
[[ $status == healthy ]]
[[ $(docker inspect --format '{{.Config.User}}' "$name") == node ]]
[[ $(docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$name") == "$sha" ]]
# Inspect the exact runtime image, including its compiled server/static assets.
# This check has no credentials and emits only a count/result.
docker exec "$name" node -e '
const fs=require("node:fs"),path=require("node:path"); let count=0;
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isSymbolicLink())continue;if(/system-admin-bootstrap|admin-storage-state|admin-session.*\.json|\.admin-private/.test(item.name))throw Error("Private file in image");if(item.isDirectory())walk(file);else if(item.isFile()){count++;if(!file.includes("/node_modules/")&&fs.readFileSync(file).includes(Buffer.from("system-admin-bootstrap.json")))throw Error("Private credential reference in compiled asset");}}}walk("/app");console.log("PASS: runtime private-file exclusions; inspected "+count+" files");'
export SMOKE_BASE_URL="http://127.0.0.1:$port" EXPECTED_RELEASE="$sha"
for private_path in /docs/system-admin-bootstrap.json /system-admin-bootstrap.json /admin-storage-state.json /.admin-private/session.json; do
  [[ $(curl --silent --show-error --max-time 10 --output /dev/null --write-out '%{http_code}' "$SMOKE_BASE_URL$private_path") == 404 ]]
done
npm run test:smoke
npm run test:admin:guest
# Isolated failure candidate has no network/public port and cannot reach backend.
docker run -d --name "$failed_name" --platform "$platform" --init --network none \
  --read-only --cap-drop ALL --security-opt no-new-privileges:true --memory 512m --memory-swap 512m --cpus 1 \
  --health-cmd 'node -e "process.exit(1)"' --health-start-period 1s --health-interval 1s --health-timeout 2s --health-retries 1 "$image"
for _attempt in {1..20}; do
  negative=$(docker inspect --format '{{.State.Health.Status}}' "$failed_name")
  [[ $negative == unhealthy ]] && break
  sleep 1
done
[[ $negative == unhealthy ]]
curl --fail --silent --show-error --max-time 10 "$SMOKE_BASE_URL/healthz" | \
  node -e 'if(JSON.parse(require("node:fs").readFileSync(0)).release !== process.env.EXPECTED_RELEASE) process.exit(1)'
[[ $(docker inspect --format '{{.State.Health.Status}}' "$name") == healthy ]]
printf '%s\n' 'PASSED: production image, desktop/mobile smoke and isolated failed-candidate containment.'
