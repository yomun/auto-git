#!/usr/bin/env bash

GIT_PATH="${1}"

branch_name=`git -C "${GIT_PATH}" branch --no-color | cut -c3-`

hash_1st_commit_id=`git -C "${GIT_PATH}" rev-parse ${branch_name}`
hash_5th_commit_id=`git -C "${GIT_PATH}" rev-parse ${branch_name}~4`

CMD=`git -C "${GIT_PATH}" checkout --orphan new-start ${hash_5th_commit_id}`

CMD=`cd "${GIT_PATH}" && git commit -C ${hash_5th_commit_id}`

CMD=`git -C "${GIT_PATH}" rebase --onto new-start ${hash_5th_commit_id} ${branch_name}`

CMD=`git -C "${GIT_PATH}" branch -d new-start`

CMD=`git -C "${GIT_PATH}" reflog expire --expire=now --all`
CMD=`git -C "${GIT_PATH}" gc --prune=now`

CMD=`git -C "${GIT_PATH}" push -f origin ${branch_name}`
