import Utility from '../hd.utility.js';
import DOM from '../hd.dom.js';

import EditorElements from './editor.elements.js';
import State from './editor.state.js';

const prefix = 'rpm_editor_';

/**
 * Map adatainak tárolása (localStorage)
 * @type {Object}
 */
const Storage = {

    /**
     * Tile adatainak lekérdezése
     * @param {Number} tileId - tile azonosító
     * @return {Object}
     * @description
     *  return = {
     *      tile: String,
     *      x: Number,
     *      y: Number,
     *      z: Number,
     *      w: Number,
     *      h: Number,
     *      angle: Number,
     *      center: {x: Number, y: Number},
     *      corners: [
     *          {x: Number, y: Number},  // lt
     *          {x: Number, y: Number},  // rt
     *          {x: Number, y: Number},  // rb
     *          {x: Number, y: Number}   // lb
     *      ]
     *  }
     */
    get: function(tileId){
        const surface = localStorage.getItem(`${prefix}${tileId}`);
        return surface ? {...JSON.parse(surface)} : {};
    },

    /**
     * Tile beszúrása / módosítása
     * @param {Number} tileId - tile azonosító
     * @param {Object} data - tile adatai (az alábbiak egy részhalmazát tartalmazza)
     * @description
     *  data = {
     *      tile: String,
     *      x: Number,
     *      y: Number,
     *      z: Number,
     *      w: Number,
     *      h: Number,
     *      angle: Number
     *  }
     */
    set: function(tileId, data){
        data = Storage.collectData(tileId, data);
        localStorage.setItem(`${prefix}${tileId}`, JSON.stringify(data));
    },

    /**
     * Tile törlése
     * @param {Number} tileId - tile azonosító
     */
    remove: function(tileId){
        localStorage.removeItem(`${prefix}${tileId}`);
    },

    /**
     * Tárolt adatok törlése
     */
    clear: function(){
        const keys = [];
        Storage.iterate(key => keys.push(key));
        keys.forEach(key => localStorage.removeItem(key));
    },

    /**
     * Map leíró adatszerkezet előállítása a tárolt adatok alapján
     * @return {Object} map leíró adatszerkezet
     */
    getAll: function(){
        const mapData = {...State.mapData};
        mapData.surfaces = [];
        Storage.iterate(key => mapData.surfaces.push(
            JSON.parse(localStorage.getItem(key))
        ));
        return mapData;
    },

    /**
     * Map leíró adatszerkezet előállítása a tárolt adatok alapján
     * @return {Object} map leíró adatszerkezet (kiszámítható adatok nélkül)
     */
    getAllMinimal: function(){
        const mapData = {...State.mapData};
        mapData.surfaces = [];
        Storage.iterate(key => {
            const tileData = JSON.parse(localStorage.getItem(key));
            mapData.surfaces.push({
                tile: tileData.tile,
                x: tileData.x,
                y: tileData.y,
                z: tileData.z,
                w: tileData.w,
                h: tileData.h,
                angle: tileData.angle
            });
        });
        return mapData;
    },

    /**
     * Egy függvény lefuttatása a tárolóban lévő tile-okon
     * @param {Function} method - lefuttatandó művelet
     */
    iterate: function(method){
        Utility.Array.fromNum(localStorage.length).forEach(i => {
            const key = localStorage.key(i);
            const regexp = new RegExp(`^${prefix}`);
            if (regexp.test(key)){
                const tileId = key.replace(regexp, '');
                method(key, tileId);
            }
        });
    },

    /**
     * Tila adatainak összegyűjtése
     * @param {Number} tileId - tile azonosító
     * @param {Object} data - tile adatainak részhalmaza
     * @return {Object} tile adatai (teljes)
     * @description
     *  data = {
     *      tile: String,
     *      x: Number,
     *      y: Number,
     *      z: Number,
     *      w: Number,
     *      h: Number,
     *      angle: Number
     *  }
     *  return = {
     *      id: Number,
     *      tile: String,
     *      x: Number,
     *      y: Number,
     *      z: Number,
     *      w: Number,
     *      h: Number,
     *      angle: Number,
     *      center: {x: Number, y: Number},
     *      corners: [
     *          {x: Number, y: Number},  // lt
     *          {x: Number, y: Number},  // rt
     *          {x: Number, y: Number},  // rb
     *          {x: Number, y: Number}   // lb
     *      ]
     *  }
     */
    collectData: function(tileId, originalData){
        let data;
        const surface = localStorage.getItem(`${prefix}${tileId}`);
        if (surface){
            // művelet elvégzése a map-en lévő elemen
            data = {...JSON.parse(surface), ...originalData};
        }
        else {
            // első ráhelyezés a map-re
            let size = {w: 0, h: 0};
            const Element = EditorElements.MapTiles.filterByData('tile', originalData.tile);
            if (Element.elem()){
                // az elem a DOM-ban van így megállapíthatóak a méretei
                size = EditorElements.MapTiles.filterByData('tile', originalData.tile).getDimensions();
            }
            data = {
                ...{
                    x: 0,
                    y: 0,
                    z: State.axisScale.current - 1,
                    w: size.w,
                    h: size.h,
                    angle: 0
                },
                ...originalData,
                id: tileId
            };
        }
        // további adatok kiszámítása
        const providedData = [data.x, data.y, data.w, data.h].every(d => typeof d !== 'undefined');
        if (providedData){
            // középpont
            data.center = {
                x: data.x + data.w / 2,
                y: data.y + data.h / 2
            };
            // sarokpontok
            const sinA = Math.sin(data.angle);
            const cosA = Math.cos(data.angle);
            const tr = function(coord){
                return {
                    x: data.center.x + (coord.x - data.center.x) * cosA - (coord.y - data.center.y) * sinA,
                    y: data.center.y + (coord.x - data.center.x) * sinA + (coord.y - data.center.y) * cosA
                };
            };
            data.corners = [
                tr({x: data.x, y: data.y}),
                tr({x: data.x + data.w, y: data.y}),
                tr({x: data.x + data.w, y: data.y + data.h}),
                tr({x: data.x, y: data.y + data.h})
            ];
        }
        else {
            throw new Error(`Tile data missing to calculate center and corner points (id: ${tileId})`);
        }
        return data;
    },

    /**
     * Tile létrehozása a megadott adatai alapján
     * @param {Object} tileData - tile összes adata (id, center és corners nem szükséges)
     * @return {HTMLElement} az adatok alapján előállított DOM elem
     * @description
     *  tileData = {
     *      id: Number,
     *      tile: String,
     *      x: Number,
     *      y: Number,
     *      z: Number,
     *      w: Number,
     *      h: Number,
     *      angle: Number,
     *      center: {x: Number, y: Number},
     *      corners: [
     *          {x: Number, y: Number},  // lt
     *          {x: Number, y: Number},  // rt
     *          {x: Number, y: Number},  // rb
     *          {x: Number, y: Number}   // lb
     *      ]
     *  }
     */
    generateElement: function(tileData){
        let element = null;
        const tileId = State.nextTileId;
        const elementSample = EditorElements.Tiles.filterByData('tile', tileData.tile).elem();
        if (elementSample){
            element = document.createElement('img');
            const src = elementSample.getAttribute('src');
            State.axis.set(tileId, State.axisScale.current);
            tileData.z = tileData.z || State.axisScale.current++;  // FIXME: lehet hogy van ilyen z-index
            const style = {
                display: 'block',
                position: 'absolute',
                left: `${tileData.x}px`,
                top: `${tileData.y}px`,
                width: `${tileData.w}px`,
                height: `${tileData.h}px`,
                zIndex: tileData.z,
                transform: `rotate(${tileData.angle}rad)`
            };
            element.setAttribute('class', 'tile');
            element.setAttribute('src', src);
            DOM(element).data('action', 'move');
            DOM(element).data('tile', tileData.tile);
            DOM(element).dataNum('tile-id', tileId);
            DOM(element).css(style);
            Storage.set(tileId, tileData);
        }
        return element;
    }

};

export default Storage;
