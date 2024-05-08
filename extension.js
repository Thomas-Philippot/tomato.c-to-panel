/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        this.label = new St.Label({
            text: 'Loading...',
            y_align: Clutter.ActorAlign.CENTER
        })
        this.add_child(this.label);
    }

    updateText(text) {
        this.label.set_text(text);
    }

});

export default class IndicatorExampleExtension extends Extension {
    update() {
        this._indicator.updateText(this.getStatus())
        return true;
    }

    getStatus() {
        let [success, stdout, stderr] = GLib.spawn_command_line_sync("tomato -t");
        if (success) {
            return stdout.toString();
        } else {
            return 'Error: ' + stderr.toString();
        }
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        this.timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this.update()
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        GLib.source_remove(this.timeout);
    }
}
