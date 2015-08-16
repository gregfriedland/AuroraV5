#! /bin/sh

### BEGIN INIT INFO
# Provides:	aurora	
# Default-Start:	2 3 4 5
# Default-Stop:
# Required-Start:	$network $local_fs $fcserver
# Required-Stop:	$network $local_fs $fcserver
# Short-Description:	Aurora LED pattern generator
### END INIT INFO

set -e
umask 022

. /lib/lsb/init-functions


case "$1" in
  start)
  log_daemon_msg "Starting Aurora" "aurora" || true
  if start-stop-daemon --start --quiet --oknodo --background --exec /usr/local/bin/node /home/pi/AuroraV5/server.js; then
      log_end_msg 0 || true
      else
          log_end_msg 1 || true
	  fi
	  ;;
  stop)
  log_daemon_msg "Stopping Aurora" "aurora" || true
  if start-stop-daemon --stop --quiet --oknodo --exec /usr/local/bin/node; then
      log_end_msg 0 || true
      else
          log_end_msg 1 || true
	  fi
	  ;;

  status)
  status_of_proc /usr/local/bin/node aurora && exit 0 || exit $?
  ;;

  *)
  log_action_msg "Usage: /etc/init.d/aurora {start|stop|status}" || true
  exit 1
esac

exit 0
