/*!
 * RPM Editor v1.0.3
 * 2019.02.03.
 */

import Utility from '../hd.utility.js';
import DOM from '../hd.dom.js';
import Socket from '../socket.js';

import EditorElements from './editor.elements.js';
import State from './editor.state.js';
import Storage from './editor.storage.js';
import Interaction from './editor.interaction.js';

/**
 * Editor névtér
 * @type {Object}
 */
const Editor = {

    /**
     * Map betöltése és inicializálás
     * @param {Object} [preloadData=null]
     * @param {Boolean} [clearPreviousData=false]
     */
    init: function(preloadData = null, clearPreviousData = false){
        let loaded = false;
        if (clearPreviousData){
            Storage.clear();
        }
        if (preloadData){
            loaded = Editor.preloadMap(preloadData);
        }
        DOM.Util.rightClickProtection(EditorElements.Map.elem());
        Editor.loadTileset(function(){
            const tileSelector = '#map .tile[data-selected]';
            Editor.initMap();
            Editor.toolbarEvents();
            Editor.dialog(DOM.id('keymap-panel'));
            Editor.dialog(DOM.id('import-panel'));
            Editor.dialog(DOM.id('export-panel'));
            Editor.dialog(DOM.id('export-selected-panel'));
            Interaction.put(EditorElements.Map, EditorElements.Tiles);
            Interaction.select(EditorElements.Map, '#map .tile');
            Interaction.delete(EditorElements.Map, tileSelector);
            Interaction.copy(EditorElements.Map, tileSelector);
            Interaction.paste(EditorElements.Map);
            Interaction.move(EditorElements.Map, tileSelector);
            Interaction.axialMove(EditorElements.Map, tileSelector);
            Interaction.resize(EditorElements.Map, tileSelector);
            Interaction.rotate(EditorElements.Map, tileSelector);
            Interaction.drag(EditorElements.Map, tileSelector);
        });
    },

    /**
     * [description]
     * @param {Object} obj - [description]
     */
    displayError: function(obj){
        console.warn(obj);
        // alert(JSON.stringify(obj));  TODO: dev mód
    },

    /**
     * Tile adatok lekérése socket-en keresztül
     * @param {Function} callback - tile darabolás utáni műveletek
     * @return {Promise}
     */
    loadTileset: function(callback){
        return Socket.connect(obj => {
            console.log(obj);
            if (obj.type === 'login_success'){
                Socket.send({
                    type: 'EDITOR',
                    command: 'load_Sprites'
                });
            }
            if (obj.type === 'notice_warning'){
                Editor.displayError(obj.data.texts);
            }
            if (obj.type === 'loadSpritesResponse'){
                Editor.cutToTiles(obj.data).then(callback);
            }
        }).then(event => {
            Socket.send({
                type: 'login',
                data: {
                    username: 'editor',
                    password: 'asdasd'
                }
            });
        }).catch(error => {
            Editor.displayError(error);
        });
    },

    /**
     * Tile darabolás
     * @param {Array} coords - koordináta-adatok
     * @return {Promise}
     * @description
     *  coords = [
     *      {
     *          file_id: String,    // "1"
     *          file_path: String,  // "img/towns/Newbopolis.png"
     *          sprite_id: String,  // "1"
     *          sprite_x: String,   // "0"
     *          sprite_y: String,   // "0"
     *          sprite_h: String,   // "1080"
     *          sprite_w: String,   // "1920"
     *          sprite_dh: String,  // "1080"
     *          sprite_dw: String,  // "1920"
     *          sprite_dx: String,  // "0"
     *          sprite_dy: String,  // "0"
     *      },
     *      ...
     *  ]
     */
    cutToTiles(coords){
        const files = new Set(coords.map(coord => coord.file_path));
        const imgLoadings = [];
        files.forEach(file => {
            if (file){
                imgLoadings.push(
                    new Promise(function(resolve, reject){
                        const image = document.createElement('img');
                        image.onload = event => {
                            // TODO ez mehet stackoverflowra:
                            // const obj = {...event};
                            // console.log('SPREAD', obj);
                            // console.log('EVENT', event);
                            // console.log('LOOP');
                            // for (let i in event){
                            //     if (event.hasOwnProperty(i)){
                            //         console.log(i, event[i]);
                            //     }
                            // }
                            // console.log('----------------------');
                            image.dataset.source = file;
                            resolve(image);
                        };
                        image.onerror = error => {
                            resolve({event: 'imageLoadError', error});
                        };
                        image.src = file;
                    })
                );
            }
        });
        return Promise.all(
            imgLoadings
        ).then(loadEvents => {
            loadEvents.filter(event => !!event.error).forEach(event => Editor.displayError(event));
            const images = loadEvents.filter(event => !event.error);
            const tiles = [];
            coords.forEach(crd => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const currentImage = images.find(image => image.dataset.source === crd.file_path);
                if (currentImage){
                    canvas.width = crd.sprite_w;
                    canvas.height = crd.sprite_h;
                    ctx.drawImage(currentImage, crd.sprite_x, crd.sprite_y, crd.sprite_w, crd.sprite_h, 0, 0, crd.sprite_w, crd.sprite_h);
                    const image = document.createElement('img');
                    image.src = canvas.toDataURL();
                    image.classList.add('tile');
                    image.dataset.action = 'copy';
                    image.dataset.tile = crd.sprite_name || '<unknown>';
                    image.setAttribute('title', crd.sprite_name);
                    DOM('#tile-container .tile-list').elem().appendChild(image);
                }
            });
        }).catch(error => {
            Editor.displayError(error);
        });
    },

    /**
     * Dialog ablakok (popup) kezelése
     * @param {DOM} DialogElement - [description]
     */
    dialog: function(DialogElement){

        DOM.id(`${DialogElement.elem().id}-opener`).event('click', function(){
            DialogElement.css({
                display: 'block'
            });
        });
        DialogElement.descendants('.close').event('click', function(){
            DialogElement.css({
                display: 'none'
            });
        });

    },

    /**
     * Toolbar kezelése
     */
    toolbarEvents: function(){
        const Toolbar = DOM.id('toolbar');
        Toolbar.css({
            zIndex: State.axisScale.toolbar
        });
        Toolbar.descendants('.hide').event('click', function(){
            Toolbar.class('toggle', 'hide-active');
        });
        Toolbar.descendants('[data-tab]').event('click', function(target){
            const label = DOM(target).data('tab');
            Toolbar.descendants('[data-tab], [data-tabpanel]').class('remove', 'tab-selected');
            Toolbar.descendants(`[data-tab="${label}"], [data-tabpanel="${label}"]`).class('add', 'tab-selected');
        });
        Toolbar.descendants('[data-tile-search]').event('keyup', function(target){
            EditorElements.Tiles.css({display: 'none'});
            EditorElements.Tiles.elements.filter(
                elem => elem.dataset.tile.includes(target.value)
            ).forEach(
                elem => DOM(elem).css({display: 'inline-block'})
            );
        });
        DOM.id('grid-toggle').event('change', function(){
            State.grid.active = !State.grid.active;
            Editor.initGrid();
        });
        DOM.id('data-save').event('click', function(){
            Interaction.applyDataPanel();
        });
        DOM.id('map-resize').event('click', function(){
            const [w, h] = [
                Toolbar.descendants('[data-map-width]').elem().value,
                Toolbar.descendants('[data-map-height]').elem().value
            ];
            const min = {w: 0, h: 0};
            Storage.iterate(function(key, tileId){
                const tile = Storage.get(tileId);
                min.w = Math.max(tile.center.x, min.w);
                min.h = Math.max(tile.center.y, min.h);
            });
            if (w < min.w || h < min.h){
                alert(`Minimális méret: ${min.w}x${min.h}`);
            }
            else {
                EditorElements.Map.css({
                    width: `${w}px`,
                    height: `${h}px`
                });
                EditorElements.MapBorder.css({
                    width: `${w}px`,
                    height: `${h}px`
                });
                State.mapData.size = {w, h};
                Editor.drawGrid(EditorElements.Grid.elem());
            }
        });
        DOM('#import-panel .import-start').event('click', function(){
            const data = DOM('#import-panel .import-data').elem().value;
            try {
                const success = Editor.setTilesToMap(JSON.parse(data));
                if (success){
                    DOM.id('import-panel').css({
                        display: 'none'
                    });
                }
            }
            catch (error){
                Editor.displayError({
                    message: 'Nem megfelelő a JSON formátuma!',
                    error
                });
            }
        });
        DOM.id('export-panel-opener').event('click', function(){
            const data = JSON.stringify(Editor.getTilesData());
            DOM.id('export-panel').descendants('.export-data').elem().value = data;
            console.info(data);
        });
        DOM.id('export-selected-panel-opener').event('click', function(){
            const data = JSON.stringify(Editor.getSelectedData());
            DOM.id('export-selected-panel').descendants('.export-data').elem().value = data;
            console.info(data);
        });
        DOM.id('map-save').event('click', function(){
            const mapData = Editor.saveMap();
            console.info(mapData);
            console.info(JSON.stringify(mapData));
        });
    },

    /**
     * Grid előkészítése
     */
    initMap: function(){
        EditorElements.Map.css({
            width: `${State.mapData.w}px`,
            height: `${State.mapData.h}px`
        });
        EditorElements.Map.event('click', function(){
            EditorElements.Map.elem().focus();
        });
        EditorElements.Map.event('focus focusin', function(target, event){
            event.preventDefault();
        });
        // EditorElements.Map.event('blur', function(){
        //     setTimeout(() => {
        //         if (!document.activeElement.dataset.keepFocus){
        //             EditorElements.Map.elem().focus();
        //         }
        //     }, 500);
        // });
        EditorElements.MapBorder.css({
            zIndex: State.axisScale.mapBorder,
            pointerEvents: 'none'
        });
    },

    /**
     * Grid előkészítése
     */
    initGrid: function(){
        const Grid = EditorElements.Grid;
        Grid.css({
            display: State.grid.active ? 'block' : 'none',
            zIndex: State.axisScale.grid,
            pointerEvents: 'none'
        });
        if (State.grid.active){
            Editor.drawGrid(Grid.elem());
        }
    },

    /**
     * Grid kirajzolása
     * @param {HTMLCanvasElement} canvas - canvas elem
     */
    drawGrid: function(canvas){
        let x, y;
        canvas.width = DOM(canvas).css('width').replace('px', '');
        canvas.height = DOM(canvas).css('height').replace('px', '');
        const ctx = canvas.getContext('2d');
        const w = State.mapData.size.w;
        const h = State.mapData.size.h;
        const lineDistance = State.grid.distance;
        ctx.strokeStyle = State.grid.color;
        ctx.lineWidth = State.grid.width;
        ctx.beginPath();

        const correction = (State.grid.width % 2 === 1) ? 0.5 : 0;
        for (x = 0, y = 0; y < h; y += lineDistance){
            // vízszintes vonalak
            ctx.moveTo(x, y + correction);
            ctx.lineTo(w, y + correction);
        }
        for (x = 0, y = 0; x < w; x += lineDistance){
            // függőleges vonalak
            ctx.moveTo(x + correction, y);
            ctx.lineTo(x + correction, h);
        }
        ctx.stroke();
    },

    /**
     * Tile-ok generálása és ráhelyezése a map-re
     * @param {Array} data - tile-ok adatai
     * @return {Boolean} sikerült-e az össyes tile beszúrása
     * @description
     *  data = [
     *      {
     *          tile: String,
     *          x: Number,
     *          y: Number,
     *          z: Number,
     *          w: Number,
     *          h: Number,
     *          angle: Number
     *      },
     *      ...
     *  ]
     */
    setTilesToMap: function(data){
        let success = true;
        const map = EditorElements.Map.elem();
        data.forEach(tileData => {
            const tile = Storage.generateElement(tileData);
            if (tile){
                map.appendChild(tile);
            }
            else {
                Editor.displayError({
                    message: `Nem azonosítható tile: ${tileData.tile}`,
                    tileData
                });
                success = false;
            }
        });
        return success;
    },

    /**
     * Kiválasztott elemek lekérése
     * @return {Array} a kiválasztott tile-okat leíró teljes adatszerkezetek
     * @description
     *  return = [
     *      {
     *          id: Number,
     *          tile: String,
     *          x: Number,
     *          y: Number,
     *          z: Number,
     *          w: Number,
     *          h: Number,
     *          angle: Number,
     *          center: {x: Number, y: Number},
     *          corners: [
     *              {x: Number, y: Number},  // lt
     *              {x: Number, y: Number},  // rt
     *              {x: Number, y: Number},  // rb
     *              {x: Number, y: Number}   // lb
     *          ]
     *      },
     *      ...
     *  ]
     */
    getSelectedData: function(){
        const selected = EditorElements.Selected.elements;
        return selected.map(e => Storage.collectData(DOM(e).dataNum('tile-id')));
    },

    /**
     * Tile-ok adatai
     * @return {Array} tile-okat leíró minimális adatszerkezetek
     */
    getTilesData: function(){
        const mapData = Storage.getAllMinimal();
        return mapData.surfaces;
    },

    /**
     * Elmentett map importálása TODO
     * @param {Object} data - export által viszaadott objektum
     * @return {Boolean}
     */
    preloadMap: function(data){
        return false;
    },

    /**
     * Map exportálása
     * @return {Object} map leíró adatszerkezet
     */
    saveMap: function(){
        const mapData = Storage.getAll();
        // Storage.clear();
        Socket.send({
            type: 'EDITOR',
            command: 'saveMap',
            params: {
                name: '',
                data: mapData
            }
        });
        return mapData;
        /*
        Jelenlegi struktúra:
        {
            id: 0,
            size: {
                w: Number,
                h: Number
            },
            surfaces: [
                {
                    id: Number,
                    tile: String,
                    x: Number,
                    y: Number,
                    z: Number,
                    w: Number,
                    h: Number,
                    angle: Number,
                    center: {x: Number, y: Number},
                    corners: [
                        {x: Number, y: Number},
                        {x: Number, y: Number},
                        {x: Number, y: Number},
                        {x: Number, y: Number}
                    ]
                }
            ]
        }
        //--------------------------------
        const mapData = {
            size: {width: 2500, height: 1000},
            zones: [
                {
                    id: 5,
                    coord: {x1: 0, y1: 0, x2: 400, y2: 400},
                    areas: [
                        {
                            move: 1,
                            slide: 0,
                            type: 'rectangle',
                            coord: {x1: 0, y1: 0, x2: 400, y2: 400}
                        }, {
                            move: 0,
                            slide: 0,
                            type: 'circle',
                            coord: {x: 340, y: 300},
                            r: 20
                        }, {
                            move: 0.4,
                            slide: 0.3,
                            type: 'circle',
                            coord: {x: 360, y: 240},
                            r: 40
                        }, {
                            move: 0.6,
                            slide: 1,
                            type: 'rectangle',
                            coord: {x1: 40, y1: 80, x2: 160, y2: 160}
                        }
                    ],
                    surfaces: [
                        {
                            id: 1,
                            objectType: 'ground',
                            type: 'tile',
                            source: 'images/tiles/rough_100x100.png',
                            coord: {x: 0, y: 0},
                            zIndex: 0,
                            width: 400,
                            height: 400,
                            opacity: 1,
                            trigger: null
                        }, {
                            id: 2,
                            objectType: 'ground',
                            type: 'tile',
                            source: 'images/tiles/grass_50x50.png',
                            coord: {x: 200, y: 120},
                            zIndex: 1,
                            width: 200,
                            height: 200,
                            opacity: 1,
                            trigger: null
                        }, {
                            id: 3,
                            objectType: 'block',
                            type: 'tile',
                            source: 'images/tiles/bush_10x10.png',
                            coord: {x: 320, y: 280},
                            zIndex: 2,
                            width: 40,
                            height: 40,
                            opacity: 1,
                            trigger: null
                        }, {
                            id: 4,
                            objectType: 'ground',
                            type: 'tile',
                            source: 'images/tiles/mud_20x20.png',
                            coord: {x: 320, y: 200},
                            zIndex: 2,
                            width: 80,
                            height: 80,
                            opacity: 1,
                            trigger: null
                        }, {
                            id: 5,
                            objectType: 'ground',
                            type: 'tile',
                            source: 'images/tiles/ice_30x20.png',
                            coord: {x: 40, y: 80},
                            zIndex: 2,
                            width: 120,
                            height: 80,
                            opacity: 0.8,
                            trigger: null
                        }, {
                            id: 6,
                            objectType: 'chest',
                            type: 'tile',
                            source: 'images/tiles/chest_5x5.png',
                            coord: {x: 320, y: 40},
                            zIndex: 100,
                            width: 20,
                            height: 20,
                            opacity: 1,
                            trigger: 'chest1'
                        }
                    ]
                }
            ]
        };
        return mapData;
        */
    }

};

export default Editor;
