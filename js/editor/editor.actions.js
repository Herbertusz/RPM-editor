import DOM from '../hd.dom.js';

import EditorElements from './editor.elements.js';
import Storage from './editor.storage.js';
import Interaction from './editor.interaction.js';

/**
 * Tile-okkal végezhető műveletek definiálása
 *  tileModify = {
 *      id: Number,
 *      tile: String,
 *      x: Number,
 *      y: Number,
 *      z: Number,
 *      w: Number,
 *      h: Number,
 *      angle: Number
 *  }
 * @type {Object}
 */
const Actions = {

    meta: {
        select: function(id){},
        deselect: function(id){},
        copy: function(id){}
    },

    create: {
        put: function(tile){},
        paste: function(tile, {x, y, z, w, h, angle}){}
    },

    modify: {
        move: function(id, {x, y}){},
        drag: function(id, {x, y}){},
        axialMove: function(id, {z}){},
        resize: function(id, {w, h}){},
        rotate: function(id, {angle}){}
    },

    delete: {
        delete: function(id){}
    }

};

export default Actions;
