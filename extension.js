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
import Gio from 'gi://Gio';
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
    async update() {
        const status = await this.execCommunicate(['tomato', '-t']).catch((e) => {
            console.log(e)
        });
        this._indicator.updateText(status)
        return true;
    }

    async execCommunicate(argv, input = null, cancellable = null) {
        let cancelId = 0;
        let flags = Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_PIPE;

        if (input !== null)
            flags |= Gio.SubprocessFlags.STDIN_PIPE;

        const proc = new Gio.Subprocess({argv, flags});
        proc.init(cancellable);

        if (cancellable instanceof Gio.Cancellable)
            cancelId = cancellable.connect(() => proc.force_exit());

        try {
            Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async', 'communicate_utf8_finish');
            const [stdout, stderr] = await proc.communicate_utf8_async(input, null);

            const status = proc.get_exit_status();

            if (status !== 0) {
                throw new Gio.IOErrorEnum({
                    code: Gio.IOErrorEnum.FAILED,
                    message: stderr ? stderr.trim() : `Command '${argv}' failed with exit code ${status}`,
                });
            }

            return stdout.toString();
        } finally {
            if (cancelId > 0)
                cancellable.disconnect(cancelId);
        }
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        this.timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this.update().then(() => {})
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        GLib.source_remove(this.timeout);
    }
}
