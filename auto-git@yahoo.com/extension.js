/*
 * Auto GIT gnome extension
 * https://jasonmun.blogspot.my
 * https://github.com/yomun/auto-git
 * 
 * Copyright (C) 2017 Jason Mun
 *
 * Auto GIT gnome extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Auto GIT gnome extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Auto GIT gnome extension.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

const Lang        = imports.lang;
const Gio         = imports.gi.Gio;
const GLib        = imports.gi.GLib;
const Shell       = imports.gi.Shell;
const Soup        = imports.gi.Soup;
const St          = imports.gi.St;
const Main        = imports.ui.main;
const PanelMenu   = imports.ui.panelMenu;
const PopupMenu   = imports.ui.popupMenu;
const Mainloop    = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const CurrExtension  = ExtensionUtils.getCurrentExtension();

const shell_path     = CurrExtension.path + "/sh";
const BoxLayout      = CurrExtension.imports.boxlayout.BoxLayout;
const Convenience    = CurrExtension.imports.convenience;
const Utilities      = CurrExtension.imports.utilities;
const Metadata       = CurrExtension.metadata;

const Gettext = imports.gettext.domain(Metadata['gettext-domain']);
const _ = Gettext.gettext;

const DEFAULT_ICON_SIZE = 16;

const SETTINGS_POSITION     = 'position-in-panel';
const SETTINGS_REFRESH_RATE = 'refresh-rate';

let menu_item_1 = null;
let menu_item_2 = null;
let menu_item_3 = null;

const PanelMenuButton = new Lang.Class({
	Name: "PanelMenuButton",
	Extends: PanelMenu.Button,

	_init: function(file, updateInterval) {
		this.parent(0, "", false);
		
		this._textureCache = St.TextureCache.get_default();
		
		this._settings = Convenience.getSettings(CurrExtension.metadata['settings-schema']);
		
		let self = this;
		
		// Preferences
		let _appSys = Shell.AppSystem.get_default();
		let _gsmPrefs = _appSys.lookup_app('gnome-shell-extension-prefs.desktop');
		let prefs = new PopupMenu.PopupMenuItem(_(" Preferences..."));
		prefs.connect('activate', function() {
			if (_gsmPrefs.get_state() == _gsmPrefs.SHELL_APP_STATE_RUNNING) {
				_gsmPrefs.activate();
			} else {
				let info = _gsmPrefs.get_app_info();
				let timestamp = global.display.get_current_time_roundtrip();
				info.launch_uris([Metadata.uuid], global.create_app_launch_context(timestamp, -1));
				info = null; timestamp = null;
			}
		});		
		this.menu.addMenuItem(prefs);
		_appSys = null; prefs = null;
		
		// Clear all of History
		menu_item_3 = new PopupMenu.PopupMenuItem('');
		let boxLayout311 = new St.BoxLayout();
		let boxLayout312 = new St.BoxLayout();
		boxLayout312.add_actor(new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'media-playback-start', icon_size: 12 }));
		boxLayout312.add_actor(new St.Label({ style_class: 'popup-menu-icon', text: _(" Commits History ( Clear All )") }));
		boxLayout311.add_actor(boxLayout312);
		menu_item_3.actor.add(boxLayout311);
		this.menu.addMenuItem(menu_item_3);
		menu_item_3.connect('activate', function() {
			let argv = ["bash", shell_path + "/clear-all.sh"];
			GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
		});
		boxLayout311 = null;
		boxLayout312 = null;
		
		// Clear History (Keep TOP 5)
		menu_item_2 = new PopupMenu.PopupMenuItem('');
		let boxLayout211 = new St.BoxLayout();
		let boxLayout212 = new St.BoxLayout();
		boxLayout212.add_actor(new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'media-playback-start', icon_size: 12 }));
		boxLayout212.add_actor(new St.Label({ style_class: 'popup-menu-icon', text: _(" Commits History ( Keep TOP 5 )") }));
		boxLayout211.add_actor(boxLayout212);
		menu_item_2.actor.add(boxLayout211);
		this.menu.addMenuItem(menu_item_2);
		menu_item_2.connect('activate', function() {
			let argv = ["bash", shell_path + "/clear-keep.sh"];
			GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
		});
		boxLayout211 = null;
		boxLayout212 = null;
		
		let STR_DT = "";
		let STR_TIME = "";
		let STR_URL = "";
		let argv = ["bash", shell_path + "/log.sh", CurrExtension.path + "/update.log" ];
		let [result, output, std_err, status] = this._spawnWithPipes(argv);
		if (result) {
			if (output !== null) {
				if (output.toString().trim().length > 0) {
					let str = output.toString().split(" ");
					STR_DT = str[0];
					STR_TIME = str[1];
					STR_URL = str[2];
					this._prevLabel = " [ " + STR_DT + " " + STR_TIME + " ] " + STR_URL;
				}
			}
		}		
		argv = null;
		
		// Last Updated
		menu_item_1 = new PopupMenu.PopupMenuItem('');
		let boxLayout111 = new St.BoxLayout();
		let boxLayout112 = new St.BoxLayout();
		boxLayout112.add_actor(new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'media-playback-start', icon_size: 12 }));
		boxLayout112.add_actor(new St.Label({ style_class: 'popup-menu-icon', text: this._prevLabel }));
		boxLayout111.add_actor(boxLayout112);
		menu_item_1.actor.add(boxLayout111);
		this.menu.addMenuItem(menu_item_1);
		menu_item_1.connect('activate', function() {
			let argv = ["xdg-open", "http://github.com/" + STR_URL];
			GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
		});
		boxLayout111 = null; boxLayout112 = null;
		
		this.setPrefs();
		
		this._settings.connect('changed', Lang.bind(this, function() {
			
			let position = this._settings.get_string(SETTINGS_POSITION);
			if (this._prevMenuPosition !== position) {
				this.setPrefs();
			
				if (this._timeout) { Mainloop.source_remove(this._timeout); }
				this._timeout = undefined;
				this._removeTimeout();
				
				if (this._timeout2) { Mainloop.source_remove(this._timeout2); }
				this._timeout2 = undefined;
				this._removeTimeout2();
			
				reset_Indicator();
			} else {
				this.setPrefs();
			}
		}));
		
		this._file = file;

		if (this._BoxLayout == null) {
			this._BoxLayout = new BoxLayout();
			this.actor.add_actor(this._BoxLayout);
		}
		
		this._BoxLayout.setPanelLine();

		this._refresh();
		this._refresh2();
	},
	
	setPrefs: function() {
		this._prevMenuPosition = this._menuPosition;
		this._prevRefreshRate  = this._refreshRate;

		this._menuPosition = this._settings.get_string(SETTINGS_POSITION);
		this._refreshRate  = this._settings.get_int(SETTINGS_REFRESH_RATE);
	},

	_update: function() {
	},
	
	_refresh: function () {
		this._loadData();
		
		this._removeTimeout();
		
		let min = this._refreshRate * 60;
		this._timeout = Mainloop.timeout_add_seconds(min, Lang.bind(this, this._refresh));
		
		return true;
	},
	
	_refresh2: function () {
		this._loadData2();
		
		this._removeTimeout2();
		
		let sec = 30;
		this._timeout2 = Mainloop.timeout_add_seconds(sec, Lang.bind(this, this._refresh2));
		
		return true;
	},
	
	_loadData: function () {
		let argv = ["bash", shell_path + "/check.sh", shell_path + "/git.sh" ];
		let [result, output, std_err, status] = this._spawnWithPipes(argv);
		if (result) {
			if (output !== null) {
				if (output.toString().trim().length > 0) {
					if (parseInt(output.toString()) <= 2) {
						let argv２ = ["bash", shell_path + "/git.sh"];
						GLib.spawn_async(null, argv２, null, GLib.SpawnFlags.SEARCH_PATH, null);
					}
				}
			}
		}		
		argv = null;
	},
	
	_loadData2: function () {
		let argv = ["bash", shell_path + "/check.sh", shell_path + "/git.sh" ];
		let [result, output, std_err, status] = this._spawnWithPipes(argv);
		if (result) {
			if (output !== null) {
				if (output.toString().trim().length > 0) {
					if (parseInt(output.toString()) <= 2) {
						
						let STR_DT = "";
						let STR_TIME = "";
						let STR_URL = "";
						let argv3 = ["bash", shell_path + "/log.sh", CurrExtension.path + "/update.log" ];
						let [result, output, std_err, status] = this._spawnWithPipes(argv3);
						if (result) {
							if (output !== null) {
								if (output.toString().trim().length > 0) {
									let str = output.toString().split(" ");
									STR_DT = str[0];
									STR_TIME = str[1];
									STR_URL = str[2];
									
									let LABEL_NOW = " [ " + STR_DT + " " + STR_TIME + " ] " + STR_URL;
									
									if (this._prevLabel.indexOf(LABEL_NOW) == -1) {
										
										this._prevLabel  = LABEL_NOW;

										// Main.notify(STR_TIME);

										menu_item_1.actor.hide();

										menu_item_1 = null;
										
										menu_item_1 = new PopupMenu.PopupMenuItem('');
										let boxLayout311 = new St.BoxLayout();
										let boxLayout312 = new St.BoxLayout();
										boxLayout312.add_actor(new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'media-playback-start', icon_size: 12 }));
										boxLayout312.add_actor(new St.Label({ style_class: 'popup-menu-icon', text: LABEL_NOW }));
										boxLayout311.add_actor(boxLayout312);
										menu_item_1.actor.add(boxLayout311);
										this.menu.addMenuItem(menu_item_1);
										menu_item_1.connect('activate', function() {
											let argv4 = ["xdg-open", "http://github.com/" + STR_URL];
											GLib.spawn_async(null, argv4, null, GLib.SpawnFlags.SEARCH_PATH, null);
										});
										boxLayout311 = null; boxLayout312 = null;

										menu_item_1.actor.show();
									}
								}
							}
						}		
						argv3 = null;
					}
				}
			}
		}		
		argv = null;
	},

	_removeTimeout: function () {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	},
	
	_removeTimeout2: function () {
		if (this._timeout2) {
			Mainloop.source_remove(this._timeout2);
			this._timeout2 = null;
		}
	},
	
	_trySpawnSyncWithPipes: function(argv) {
        let retval = [false, null, null, -1];

        try {
            retval = GLib.spawn_sync(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null, null);
        } catch (err) {
            if (err.code == GLib.SpawnError.G_SPAWN_ERROR_NOENT) {
                err.message = _("Command not found");
            } else {
                err.message = err.message.replace(/.*\((.+)\)/, '$1');
            }

            throw err;
        }
        return retval;
    },
	
	_spawnWithPipes: function(argv) {
        try {
            return this._trySpawnSyncWithPipes(argv);
        } catch (err) {
            this._handleSpawnError(argv[0], err);
            return [false, null, err.message, -1];
        }
    },
	
	_handleSpawnError: function(command, err) {
        let title = _("Execution of '%s' failed:").format(command);
        log(title);
        log(err.message);
    },
	
	stop: function () {
		if (this._timeout) { Mainloop.source_remove(this._timeout); }
		this._timeout = undefined;
		this._removeTimeout();
		
		if (this._timeout2) { Mainloop.source_remove(this._timeout2); }
		this._timeout2 = undefined;
		this._removeTimeout2();
		
		this._BoxLayout.remove_all_children();
	},
	
	destroy: function () {
		this.stop();
	},
});

function _trySpawnSyncWithPipes(argv) {
	let retval = [false, null, null, -1];

	try {
		retval = GLib.spawn_sync(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null, null);
	} catch (err) {
		if (err.code == GLib.SpawnError.G_SPAWN_ERROR_NOENT) {
			err.message = _("Command not found");
		} else {
			err.message = err.message.replace(/.*\((.+)\)/, '$1');
		}

		throw err;
	}
	return retval;
}
	
function _spawnWithPipes(argv) {
	try {
		return _trySpawnSyncWithPipes(argv);
	} catch (err) {
		_handleSpawnError(argv[0], err);
		return [false, null, err.message, -1];
	}
}

function _handleSpawnError(command, err) {
	let title = _("Execution of '%s' failed:").format(command);
	log(title);
	log(err.message);
}

function reset_Indicator() {	
	Main.panel.statusArea['auto-git']._BoxLayout.destroy_all_children();
	Main.panel.statusArea['auto-git'].menu.actor.destroy_all_children();
	Main.panel.statusArea['auto-git'].menu = null;
	Main.panel.statusArea['auto-git'].actor.destroy_all_children();
	Main.panel.statusArea['auto-git'].actor = null;
	Main.panel.statusArea['auto-git'].container.destroy_all_children();
	Main.panel.statusArea['auto-git'].destroy();
	Main.panel.statusArea['auto-git'] = null;
	
	button = null;
	removeButtons();
	
	reset_var();
	addButtons();
}

function reset_var() {
}

let button = null;
let buttons = [];

function init() {
}

function addButtons() {
	
	let settings = Utilities.parseFilename("menu.sh");
	//button = new PanelMenuButton(files[0], settings.updateInterval);
	button = new PanelMenuButton(null, settings.updateInterval);
	buttons.push(button);
	
	let settings2 = Convenience.getSettings(CurrExtension.metadata['settings-schema']);
	let menuPosition = settings2.get_string(SETTINGS_POSITION);
	
	Main.panel.addToStatusArea("auto-git", button, 1, menuPosition);
	// Main.panel.addToStatusArea("auto-git", button, settings.position, settings.box);
}

function removeButtons() {
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].destroy();
		buttons[i] = null;
	}
	buttons = [];
}

function refresh() {
}

function enable() {
	reset_var();
	addButtons();
}

function disable() {
	Main.panel.statusArea['auto-git']._BoxLayout.destroy_all_children();
	Main.panel.statusArea['auto-git'].menu.actor.destroy_all_children();
	Main.panel.statusArea['auto-git'].menu = null;
	Main.panel.statusArea['auto-git'].actor.destroy_all_children();
	Main.panel.statusArea['auto-git'].actor = null;
	Main.panel.statusArea['auto-git'].container.destroy_all_children();
	Main.panel.statusArea['auto-git'].destroy();
	Main.panel.statusArea['auto-git'] = null;
	
	button = null;
	removeButtons();
}
