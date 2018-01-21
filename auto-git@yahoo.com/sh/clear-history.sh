#!/usr/bin/env bash

GIT_PATH="${1}"

DT=`date '+%Y-%m-%d %H:%M'`

branch_name=`git -C "${GIT_PATH}" branch --no-color | cut -c3-`

SSH_URL=`git -C "${GIT_PATH}" remote get-url origin`

git -C "${GIT_PATH}" checkout --orphan latest_branch

git -C "${GIT_PATH}" add -A

git -C "${GIT_PATH}" commit -am "${DT}"

git -C "${GIT_PATH}" branch -D ${branch_name}

git -C "${GIT_PATH}" branch -m ${branch_name}

# git -C "${GIT_PATH}" push -f origin ${branch_name}

git -C "${GIT_PATH}" push -f ${SSH_URL}