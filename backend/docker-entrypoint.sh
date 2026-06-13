#!/bin/sh
set -e

mkdir -p /app/models
chown -R app:app /app/models

exec gosu app "$@"
