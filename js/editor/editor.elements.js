import DOM from '../hd.dom.js';

/**
 * Használt DOM elemek
 * @type {Object}
 */
const Elements = {

    /**
     * A map amibe a tile-k behúzhatók
     * @type {DOM}
     */
    Map: DOM.id('map'),

    /**
     * A map amibe a tile-k behúzhatók
     * @type {DOM}
     */
    MapBorder: DOM.id('map-border'),

    /**
     * Egy tile adatait megjelenítő doboz
     * @type {DOM}
     */
    Datapanel: DOM.id('data-panel'),

    /**
     * Átméretezéshez húzható pöcök
     * @type {DOM}
     */
    Resizer: DOM.id('resizer'),

    /**
     * Forgáspont
     * @type {DOM}
     */
    RotationPoint: DOM.id('rotation-point'),

    /**
     * Csoportos kijelöléshez használható téglalap
     * @type {DOM}
     */
    Lasso: DOM.id('lasso'),

    /**
     * Grid (canvas)
     * @type {DOM}
     */
    Grid: DOM.id('grid'),

    /**
     * Behúzható tile-ok (képek)
     * @type {DOM}
     */
    get Tiles(){
        return DOM('#tile-container [data-tile]');
    },

    /**
     * Behúzott tile-ok
     * @type {DOM}
     */
    get MapTiles(){
        return DOM('#map [data-tile]');
    },

    /**
     * Kijelölt elemek
     * @type {DOM}
     */
    get Selected(){
        return DOM('#map .tile[data-selected]');
    }

};

export default Elements;
