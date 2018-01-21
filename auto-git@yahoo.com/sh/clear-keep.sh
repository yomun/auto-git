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

# DATA_PATH=`echo "${SHELL_PATH}" | sed -e 's/\/sh$//'`

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
	
	# echo ${git_iPath}
	
	iPath=`echo "${git_iPath}" | sed 's/\/.git//g'`
	
	echo "[${iPath}]"
	
	SSH_URL=`git -C "${iPath}" remote get-url origin`
	
	TEST=`echo "${SSH_URL}" | grep -c "github.com"`
	
	if [ ${TEST} -gt 0 ]
	then		
		branch_name=`git -C "${iPath}" branch --no-color | cut -c3-`
		
		COMMIT_COUNT=`git -C "${iPath}" rev-list --count ${branch_name}`
		
		if [ ${COMMIT_COUNT} -gt 5 ]
		then			
			CMD=`bash ${SHELL_PATH}/rebase-last-five.sh "${iPath}"`
		fi
	fi
done