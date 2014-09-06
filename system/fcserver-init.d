#! /bin/sh

### BEGIN INIT INFO
# Provides:	fcserver
# Default-Start:	2 3 4 5
# Default-Stop:
# Required-Start:	$network $local_fs
# Required-Stop:	$network $local_fs
# Short-Description:	Fadecandy LED server
### END INIT INFO

set -e
umask 022

. /lib/lsb/init-functions

FADECANDY_OPTS="/etc/fcserver.json"

case "$1" in
  start)
  log_daemon_msg "Starting Fadecandy LED server" "fcserver" || true
  if start-stop-daemon --start --quiet --oknodo --background --exec /usr/bin/fcserver -- $FADECANDY_OPTS; then
      log_end_msg 0 || true
      else
          log_end_msg 1 || true
	  fi
	  ;;
  stop)
  log_daemon_msg "Stopping Fadecandy LED server" "fcserver" || true
  if start-stop-daemon --stop --quiet --oknodo --exec /usr/bin/fcserver; then
      log_end_msg 0 || true
      else
          log_end_msg 1 || true
	  fi
	  ;;

  status)
  status_of_proc /usr/bin/fcserver fcserver && exit 0 || exit $?
  ;;

  *)
  log_action_msg "Usage: /etc/init.d/fcserver {start|stop|status}" || true
  exit 1
esac

exit 0
