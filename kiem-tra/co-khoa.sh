#!/bin/bash
# Chạy một lệnh NẶNG (Chrome ẩn chụp ảnh, tự kiểm, dựng app) nhưng không quá 3 lệnh nặng cùng lúc trên cả máy,
# để nhiều lượt kiểm chạy song song không làm nghẽn card đồ hoạ (kiểm bị quá giờ, máy giật).
#   bash kiem-tra/co-khoa.sh bash kiem-tra/tu-kiem.sh dist/index.html "canh=hai-khe&tukiem=1"
D="/tmp/trilu-khoa-nang"; mkdir -p "$D"
while :; do
  for i in 1 2 3; do
    # khoá bị bỏ quên quá 40 phút (tiến trình giữ khoá đã chết) thì gỡ
    [ -d "${D:?}/${i:?}" ] && [ -n "$(find "${D:?}/${i:?}" -maxdepth 0 -mmin +40 2>/dev/null)" ] && rmdir "${D:?}/${i:?}" 2>/dev/null
    if mkdir "${D:?}/${i:?}" 2>/dev/null; then
      KHOA="${D:?}/${i:?}"; trap 'rmdir "${KHOA:?}" 2>/dev/null' EXIT
      "$@"; exit $?
    fi
  done
  sleep $((2 + RANDOM % 5))
done
