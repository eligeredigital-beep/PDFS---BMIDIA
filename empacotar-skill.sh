#!/usr/bin/env bash
# Gera releases/bmidia-design-system.zip (skill pronta para instalar no Claude).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p releases
rm -f releases/bmidia-design-system.zip
zip -r releases/bmidia-design-system.zip bmidia-design-system -x '*.DS_Store'
echo "OK: releases/bmidia-design-system.zip"
