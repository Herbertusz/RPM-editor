import EditorElements from './editor.elements.js';

/**
 * A pálya aktuális állapotait jelző értékek
 * @type {Object}
 */
const State = {

    /**
     * A következő tile azonosítója
     * @type {Number}
     * @private
     */
    _nextTileId: 0,

    /**
     * A legutóbb berakott tile azonosítója
     * @type {Number}
     */
    get tileId(){
        return State._nextTileId;
    },

    /**
     * A következő tile azonosítója
     * @type {Number}
     */
    get nextTileId(){
        ++State._nextTileId;
        return State._nextTileId;
    },

    /**
     * A kijelölt tile módosítási módja
     * @type {String}
     */
    currentMode: 'move',

    /**
     * A kijelölt tile módosítási módjának lekérdezése ('move': mozgatás, 'resize': átméretezés)
     * @return {String} 'move'|'resize'
     */
    get mode(){
        return State.currentMode;
    },

    /**
     * A kijelölt tile módosítási módjának változtatása ('move': mozgatás, 'resize': átméretezés)
     * @param {String} value - 'move'|'resize'
     */
    set mode(value){
        State.currentMode = value;
        EditorElements.Resizer.css({
            display: (value === 'move') ? 'none' : 'block'
        });
    },

    /**
     * Grid adatai
     * @type {Object}
     */
    grid: {
        active: false,
        distance: 10,
        color: 'rgba(0, 0, 0, 0.2)',
        width: 1
    },

    /**
     * Forgáspont pozíciója
     * @type {Object}
     * @description
     *  rotationPoint: {
     *      x: Number,
     *      y: Number
     *  }
     */
    rotationPoint: null,

    /**
     * Segédváltozó (tileId - zIndex párok)
     * @type {Map}
     * @description
     *  axis = [
     *      [tileId(Number), zIndex(Number)],
     *      ...
     *  ]
     */
    axis: new Map(),

    /**
     * Egyes elemek rögzített z-index értékei
     * @type {Object}
     */
    axisScale: {
        current: 1,
        grid: 100000,
        mapBorder: 100010,
        resizer: 100020,
        rotationPoint: 100030,
        lasso: 100040,
        toolbar: 100050
    },

    /**
     * Vágólap-szerű implemetáció a copy-paste művelethet (beszúrandó Tile objektumok tömbje)
     * NOTE: azért kell a teljes tile objektum, mert ha másolás után törli a tile-t, akkor is beszúrható marad
     * @type {Array}
     */
    clipboard: [],

    /**
     * A pálya adatainak tárolása
     * @type {Object}
     */
    mapData: {
        id: 0,
        size: {w: 1000, h: 1000}
        // coord: {x1: 0, y1: 0, x2: 2500, y2: 1000}
    }

};

export default State;
