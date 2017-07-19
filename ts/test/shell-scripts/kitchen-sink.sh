#!/usr/bin/env bash
case $1 in
  1)
    for idx in {1..5}
    do
      echo String sent to stdout
      sleep 2
    done
    exit 1
    ;;
  2)
    sleep 2
    echo String sent to stderr >&2
    exit 0
    ;;
esac

