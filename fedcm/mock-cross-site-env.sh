# !/bin/bash

#  Copyright 2025 Google Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#
#  NOTE: This is not an officially supported Google product

echo "Starting Caddy local cross-site environment proxy..."

# Determine the directory where this script is located (e.g., monorepo/fedcm)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# The Caddy directory is now a sibling to the script (e.g., monorepo/fedcm/caddy)
CADDY_DIR="${SCRIPT_DIR}/caddy"

if [ ! -f "${CADDY_DIR}/Caddyfile" ]; then
    echo "Error: Caddyfile not found at ${CADDY_DIR}/Caddyfile"
    echo "Please ensure the Caddyfile is in the 'fedcm/caddy' subdirectory."
    exit 1
fi

# Change directory to where the Caddyfile is located for 'caddy run' to find it
cd "${CADDY_DIR}"

# Run Caddy in the foreground
caddy run

echo "Caddy stopped."

# -------------------------------------------------
# ----------------- WINDOWS VERSION ---------------
# -------------------------------------------------
# @echo off
# echo Starting Caddy local cross-site environment proxy...

# :: %~dp0 is the drive and path of the script itself (e.g., monorepo\fedcm\)
# :: The Caddy directory is now a sibling (e.g., monorepo\fedcm\caddy\)
# set "CADDY_DIR=%~dp0caddy"

# if not exist "%CADDY_DIR%\Caddyfile" (
#     echo Error: Caddyfile not found at %CADDY_DIR%\Caddyfile
#     echo Please ensure the Caddyfile is in the 'fedcm\caddy' subdirectory.
#     exit /b 1
# )

# cd "%CADDY_DIR%"

# caddy run
# echo Caddy stopped.