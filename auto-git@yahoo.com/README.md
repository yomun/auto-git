<h1 align="center">Auto Git</h1>
<h3 align="center">Automatic update source code to GitHub.com on Linux (Gnome)</h3>
<br>

![Screencast](https://extensions.gnome.org/extension-data/screenshots/screenshot_1311.png)

## Requirements
#### Ubuntu / Linux Mint / Debian / Zorin OS<br>
$ sudo apt install git<br>
<br>
Others Linux Distribution also need to install "git" package..<br>
<br>
$ git clone https://github.com/user/repository<br>
$ cd repository<br>
<br>
$ git config credential.helper store<br>
$ git add filename<br>
$ git commit -m "title"<br>
$ git push https://github.com/user/repository<br>
<br>
After enter your username & password, it will generate 2 files as follow..<br>
$ cat ~/.gitconfig<br>
$ cat ~/.git-credentials<br>
<br>

## Installation<br>
$ git clone https://github.com/yomun/auto-git<br>
$ cd auto-git<br>
$ mv auto-git@yahoo.com ~/.local/share/gnome-shell/extensions<br>
<br>
## License

Copyright &copy; 2017 Jason Mun (<jasonmun@yahoo.com>)

Released under the terms of the [GNU General Public License, version 3](https://gnu.org/licenses/gpl.html)
