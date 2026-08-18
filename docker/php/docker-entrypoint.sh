#!/bin/sh
set -e

# Xdebug is installed but off unless XDEBUG_MODE says otherwise (php.ini cannot read env vars)
XDEBUG_INI=/usr/local/etc/php/conf.d/98-xdebug-mode.ini
{
  echo "xdebug.mode=${XDEBUG_MODE:-off}"
  echo "xdebug.client_host=host.docker.internal"
  echo "xdebug.start_with_request=trigger"
} > "$XDEBUG_INI"

exec "$@"
