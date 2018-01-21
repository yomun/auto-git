#!/usr/bin/env bash

#
# Auto GIT gnome extension
# https://jasonmun.blogspot.my
# https://github.com/yomun/auto-git
# 
# Copyright (C) 2017 Jason Mun
#
# Auto GIT gnome extension is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Auto GIT gnome extension is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Auto GIT gnome extension.  If not, see <http://www.gnu.org/licenses/>.
# 
#

SHELL_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

DATA_PATH=`echo "${SHELL_PATH}" | sed -e 's/\/sh$//'`

function CAN_COMMIT_FILES()
{
	CNT_COMMIT=$((0))

	GIT_STATUS=`git -C "${iPath}" status`; echo "${GIT_STATUS}" > "${DATA_PATH}/status.txt"
	
	local branch_name=`git -C "${iPath}" branch --no-color | cut -c3-`
	
	local FILENAME_LISTS=`cat "${DATA_PATH}/status.txt" | sed 's/.*://g' | sed 's/.*：//g' | sed -e 's/^[ \t]*//' | sed '/^\s*$/d' | sed '/git /d' | sed "/ ${branch_name}/d" | sed "/origin\/${branch_name}/d" | sed 's/ /%40/g' | sed '/,/d' | sed '/，/d' | sed '/(/d' | sed '/（/d'`
	
	for i in ${FILENAME_LISTS}
	do
		content=`echo "${i}" | sed 's/%40/ /g'`
		
		if [ -f "${iPath}/${content}" ]
		then
			# update file
			git -C "${iPath}" add "${content}"
			echo ">> new/upd file - ${content}"
			CNT_COMMIT=$((CNT_COMMIT + 1))
		else			
			if [ "${content: -1}" = "/" ]
			then
				if [ -d "${iPath}/${content}" ]
				then
					# new folder
					git -C "${iPath}" add "${i}"
					echo ">> new/upd folder - ${content}"
					CNT_COMMIT=$((CNT_COMMIT + 1))
				else
					# delete folder
					git -C "${iPath}" rm "${content}"
					echo ">> del folder - ${content}"
					CNT_COMMIT=$((CNT_COMMIT + 1))
				fi
			else
				# delete file
				git -C "${iPath}" rm "${content}"
				echo ">> del file - ${content}"
				CNT_COMMIT=$((CNT_COMMIT + 1))
			fi
		fi
	done
	
	if [ ${CNT_COMMIT} -gt 0 ]
	then				
		local DT=$(date '+%Y-%m-%d %H:%M')
		
		git -C "${iPath}" commit -m "${DT}"
		git -C "${iPath}" push ${SSH_URL}
		
		local REPOSITORY=`echo "${SSH_URL}" | sed "s/.*github.com\///g"`
		local REPO_ID=`echo "${REPOSITORY}" | sed "s/^.*\///g"`
		sed -i "/${REPO_ID}/d" "${DATA_PATH}/update.log"
		echo "${DT} ${REPOSITORY}" >> "${DATA_PATH}/update.log"
		echo "${DT} ${REPOSITORY}"
	fi
}

PATH_LIST=`find "/home/${USER}" -name ".git" 2>&1 | grep -v '^find: '`

for git_iPath in ${PATH_LIST}
do	
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/.git"`       -gt 0 ]; then continue; fi
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/Downloads/"` -gt 0 ]; then continue; fi
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/Music/"`     -gt 0 ]; then continue; fi
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/Pictures/"`  -gt 0 ]; then continue; fi
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/Public/"`    -gt 0 ]; then continue; fi
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/Templates/"` -gt 0 ]; then continue; fi
	if [ `echo "${git_iPath}" | grep -c "/home/${USER}/Videos/"`    -gt 0 ]; then continue; fi
	
	iPath=`echo "${git_iPath}" | sed 's/\/.git//g'`
	
	SSH_URL=`git -C "${iPath}" remote get-url origin`
	
	if [ `echo "${SSH_URL}" | grep -c "github.com"` -gt 0 ]
	then
		echo "--- ${SSH_URL} ---"
		CAN_COMMIT_FILES
	fi
done
