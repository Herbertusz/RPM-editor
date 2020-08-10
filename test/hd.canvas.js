/**
 * HD-keret Canvas v2.1.0
 * 2018.03.16
 *
 * @description Canvas kezelése (2D layer-kezelés)
 * @requires -
 */

const Canvas = {

    Util: {

        /**
         * Teljes canvas törlése
         * @param {HTMLCanvasElement} canvas - a törlendő canvas elem
         * @return {HTMLCanvasElement} az átadott canvas (láncolható)
         */
        clear: function(canvas){
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return canvas;
        }

    },

    /**
     * Rétegcsoportokat kezelő objektum (Module minta)
     * @param {HTMLElement|null} element - az elem amelyikhez a layerset tartozik
     * @param {Layer|Level} [layers] - tetszőleges számú réteg
     * @return {Object}
     */
    Layerset: function(element, ...layers){

        /**
         * Rétegezés típusa ('layer'|'level')
         * @type {String}
         */
        const type = (typeof element === 'object' && element instanceof HTMLCanvasElement) ? 'layer' : 'level';

        /**
         * Réteg keresése a layerset-ben
         * @private
         * @param {Layer|Level} currentLayer - a keresett réteg
         * @return {Number} a réteg indexe vagy -1
         */
        const getLayerIndex = function(currentLayer){
            return layers.findIndex(layer => layer === currentLayer);
        };

        /**
         * A zIndex értékek beállítása a layers tömb sorrendje alapján
         * @private
         */
        const setZIndex = function(){
            layers.forEach((layer, i) => {
                layer.zIndex = i;
                if (type === 'level'){
                    layer.getCanvas().style.zIndex = i;
                }
            });
        };

        /**
         * Inicializálás
         * @param {Array} _layers - a konstruktornak átadott rétegek
         * @param {Object} _Interface - a konstruktor által visszaadott felület
         */
        const init = function(_layers, _Interface){
            _layers.forEach(layer => {
                layer.ownerSet = _Interface;
            });
            setZIndex();
        };

        /**
         * API
         * @type {Object}
         */
        const Interface = {

            /**
             * A DOM elem amelyikhez a layerset tartozik
             * @type {HTMLElement}
             */
            element: element,

            /**
             * Réteg beszúrása
             * @param {Layer|Level} currentLayer - az új réteg
             * @param {Number|String} zIndex - az új réteg helye (Number|'top'|'bg')
             * @return {Layerset}
             */
            pushLayer: function(currentLayer, zIndex){
                if (zIndex === 'top'){
                    // legfelső réteg
                    layers.push(currentLayer);
                }
                else if (zIndex === 'bg'){
                    // háttérréteg
                    layers.unshift(currentLayer);
                }
                else {
                    // beszúrás a paraméter alapján
                    layers.splice(zIndex, 0, currentLayer);
                }
                currentLayer.ownerSet = this;
                setZIndex();
                return this;
            },

            /**
             * Réteg törlése
             * @param {Layer|Level} currentLayer - az eltávolítandó réteg
             * @return {Layerset}
             */
            removeLayer: function(currentLayer){
                const n = getLayerIndex(currentLayer);
                if (n > -1){
                    layers.splice(n, 1);
                    if (type === 'layer'){
                        currentLayer.clear();
                        this.reDraw();
                    }
                    else {
                        const canvasElement = currentLayer.getCanvas();
                        canvasElement.parentNode.removeChild(canvasElement);
                    }
                    setZIndex();
                }
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {Layer|Level} currentLayer - a mozdítandó réteg
             * @param {String} direction - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [step=1] - down és up esetében a lépések száma
             * @return {Layerset}
             */
            moveLayer: function(currentLayer, direction, step = 1){
                const from = getLayerIndex(currentLayer);
                if (from > -1){
                    // réteg áthelyezése a layers tömbben
                    const max = layers.length - 1;
                    let to;
                    if (direction === 'up'){
                        to = Math.min(from + step, max);
                    }
                    else if (direction === 'down'){
                        to = Math.max(from - step, 0);
                    }
                    else if (direction === 'top'){
                        to = max;
                    }
                    else if (direction === 'bg'){
                        to = 0;
                    }
                    layers.splice(to, 0, layers.splice(from, 1)[0]);
                    setZIndex();

                    if (type === 'layer'){
                        // újrarajzolás
                        this.reDraw();
                    }
                }
                return this;
            },

            /**
             * Újrarajzolás
             * @param {Array.<Layer|Level>} [except=[]] - ezeket a rétegeket nem rajzolja újra
             * @return {Layerset}
             */
            reDraw: function(except = []){
                if (type === 'layer'){
                    Canvas.Util.clear(this.element);
                }
                layers.forEach(layer => {
                    // FIXME: indexOf argumentuma egy objektum!
                    if (except.indexOf(layer) === -1 && !layer.hidden){
                        layer.reDraw();
                    }
                });
                return this;
            }

        };

        init(layers, Interface);

        return Interface;

    },

    /**
     * Egy canvason belüli rétegeket kezelő objektum (Module minta)
     * @param {HTMLCanvasElement|String|Function} [args]
	 *  {HTMLCanvasElement} [predefinedCanvas=null] - saját canvas
	 *  {String} [ctxType=null] - alapértelmezett rajzoló kontextus ('2d'|'webgl'|...)
     *  {Function} [subCommand=function(){}] - minden újrarajzoló művelet előtt végrehajtandó függvény
     *   argumentumok sorrendje tetszőleges, a predefinedCanvas nincs használva, a Level felülettel való egységesítés
     *   miatt adható meg
     * @return {Object}
     */
    Layer: function(...args){

        /**
         * Rajzoló kontextus
         * @private
         * @type {Object}
         */
        let ctxType = null;

        /**
         * Az eddigi műveletek tárolása
         * @private
         * @type {Array.<Function>}
         * Függvények argumentumai:
         *  {HTMLCanvasElement} canvas - a canvas amiben a layer van
         *  {Object} ctx - alapértelmezzett rajzoló kontextus
         *  this: {Object} Layer objektum
         */
        let drawing = [];

        /**
         * Inicializálás
         * @param {Array} _args - a konstruktornak átadott argumentumok
         * @param {Object} _Interface - a konstruktor által visszaadott felület
         */
        const init = function(_args, _Interface){
            // argumentumok kezelése
            let subCommand = () => {};
            _args.forEach(arg => {
                if (typeof arg === 'string'){
                    ctxType = arg;
                }
                else if (typeof arg === 'function'){
                    subCommand = arg;
                }
            });
            // inicializálás
            _Interface.subCommand = subCommand;
        };

        /**
         * API
         * @type {Object}
         */
        const Interface = {

            /**
             * A Layerset amelyikhez a réteg tartozik
             * @private
             * @type {Layerset}
             */
            ownerSet: null,

            /**
             * Pozíció a z-tengelyen (hézagmentes, automatikusan állítódik be)
             * @type {Number}
             */
            zIndex: 0,

            /**
             * Láthatóság szabályozása
             * @type {Boolean}
             */
            hidden: false,

            /**
             * Minden újrarajzoló művelet előtt végrehajtandó függvény
             * @type {Function}
             */
            subCommand: function(){},

            /**
             * A canvas elem ami a réteget alkotja
             * @return {HTMLCanvasElement}
             */
            getCanvasCtx: function(){
                const canvas = this.ownerSet.element;
                const ctx = canvas.getContext(ctxType);
                return [canvas, ctx];
            },

            /**
             * Újrarajzolás
             * @return {Layer}
             */
            reDraw: function(){
                const layer = this;
                drawing.forEach(drawOperation => {
                    this.subCommand(...this.getCanvasCtx());
                    drawOperation.call(layer, ...this.getCanvasCtx());
                });
                return this;
            },

            /**
             * Művelet beszúrása a sorba
             * @param {Function} command - műveletek
             * @return {Layer}
             */
            push: function(command){
                drawing.push(command);
                return this;
            },

            /**
             * Művelet beszúrása és végrehajtása
             * @param {Function} command - műveletek
             * @return {Layer}
             */
            draw: function(command){
                drawing.push(command);
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg eltüntetése
             * @return {Layer}
             */
            hide: function(){
                Canvas.Util.clear(this.ownerSet.element);
                this.hidden = true;
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg megjelenítése
             * @return {Layer}
             */
            show: function(){
                this.hidden = false;
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg leradírozása (ürítés, a drawing sor megmarad)
             * @return {Layer}
             */
            erase: function(){
                Canvas.Util.clear(this.ownerSet.element);
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg ürítése
             * @return {Layer}
             */
            clear: function(){
                Canvas.Util.clear(this.ownerSet.element);
                drawing = [];
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg törlése
             * @return {Layer}
             */
            remove: function(){
                this.ownerSet.removeLayer(this);
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {String} location - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [num=1] - down és up esetében a lépések száma
             * @return {Layer}
             */
            move: function(location, num){
                this.ownerSet.moveLayer(this, location, num);
                return this;
            }

        };

        init(args, Interface);

        return Interface;

    },

    /**
     * Canvas elemeket rétegekként kezelő objektum (Module minta)
	 * @param {HTMLCanvasElement|String|Function} [args]
	 *  {HTMLCanvasElement} [predefinedCanvas=null] - saját canvas
	 *  {String} [ctxType=null] - alapértelmezett rajzoló kontextus ('2d'|'webgl'|...)
     *  {Function} [subCommand=function(){}] - minden újrarajzoló művelet előtt végrehajtandó függvény
     *   argumentumok sorrendje tetszőleges
     * @return {Object}
     */
    Level: function(...args){

        /**
         * A canvas elem (réteg)
         * @private
         * @type {HTMLCanvasElement}
         */
        let canvas = null;

        /**
         * Rajzoló kontextus
         * @private
         * @type {Object}
         */
        let defaultCtx = null;

        /**
         * Az eddigi műveletek tárolása
         * @private
         * @type {Array.<Function>}
         * Függvények argumentumai:
         *  {HTMLCanvasElement} canvas - a canvas amiben a layer van
         *  {Object} ctx - alapértelmezzett rajzoló kontextus
         *  this: {Object} Layer objektum
         */
        let drawing = [];

        /**
         * Inicializálás
         * @param {Array} _args - a konstruktornak átadott argumentumok
         * @param {Object} _Interface - a konstruktor által visszaadott felület
         */
        const init = function(_args, _Interface){
            // argumentumok kezelése
            let predefinedCanvas = null;
            let ctxType = null;
            let subCommand = () => {};
            _args.forEach(arg => {
                if (typeof arg === 'object'){
                    predefinedCanvas = arg;
                }
                else if (typeof arg === 'string'){
                    ctxType = arg;
                }
                else if (typeof arg === 'function'){
                    subCommand = arg;
                }
            });

            // inicializálás
            if (predefinedCanvas !== null && predefinedCanvas instanceof HTMLCanvasElement){
                canvas = predefinedCanvas;
                canvas.dataset.appended = true;
            }
            else {
                canvas = document.createElement('canvas');
            }
            if (ctxType !== null){
                defaultCtx = canvas.getContext(ctxType);
            }
            _Interface.subCommand = subCommand;
        };

        /**
         * API
         * @type {Object}
         */
        const Interface = {

            /**
             * A Layerset amelyikhez a réteg tartozik
             * @private
             * @type {Layerset}
             */
            ownerSet: null,

            /**
             * Pozíció a z-tengelyen (hézagmentes, automatikusan állítódik be)
             * @type {Number}
             */
            zIndex: 0,

            /**
             * Láthatóság szabályozása
             * @type {Boolean}
             */
            hidden: false,

            /**
             * Minden újrarajzoló művelet előtt végrehajtandó függvény
             * @type {Function}
             */
            subCommand: function(canvasElement, ctx){},

            /**
             * A canvas elem létrehozása
             * @return {Level}
             */
            create: function(){
                if (!canvas.dataset.appended){
                    const container = this.ownerSet.element;
                    container.style.position = 'relative';
                    canvas.style.position = 'absolute';
                    canvas.style.left = 0;
                    canvas.style.top = 0;
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                    container.appendChild(canvas);
                    canvas.dataset.appended = true;
                }
                return this;
            },

            /**
             * A canvas elem ami a réteget alkotja
             * @return {HTMLCanvasElement}
             */
            getCanvas: function(){
                this.create();
                return canvas;
            },

            /**
             * Újrarajzolás
             * @return {Level}
             */
            reDraw: function(){
                const layer = this;
                this.create();
                drawing.forEach(drawOperation => {
                    this.subCommand(canvas, defaultCtx);
                    drawOperation.call(layer, canvas, defaultCtx);
                });
                return this;
            },

            /**
             * Művelet beszúrása a sorba
             * @param {Function} command - műveletek
             * @return {Level}
             */
            push: function(command){
                drawing.push(command);
                return this;
            },

            /**
             * Művelet beszúrása és végrehajtása
             * @param {Function} command - műveletek
             * @return {Level}
             */
            draw: function(command){
                this.create();
                drawing.push(command);
                this.subCommand(canvas, defaultCtx);
                command.call(this, canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg eltüntetése
             * @return {Level}
             */
            hide: function(){
                this.create();
                canvas.style.visibility = 'hidden';
                this.hidden = true;
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg megjelenítése
             * @return {Level}
             */
            show: function(){
                this.create();
                canvas.style.visibility = 'visible';
                this.hidden = false;
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg leradírozása (ürítés, a drawing sor megmarad)
             * @return {Level}
             */
            erase: function(){
                this.create();
                Canvas.Util.clear(canvas);
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg ürítése
             * @return {Level}
             */
            clear: function(){
                this.create();
                Canvas.Util.clear(canvas);
                drawing = [];
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg törlése
             * @return {Level}
             */
            remove: function(){
                this.ownerSet.removeLayer(this);
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {String} location - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [num=1] - down és up esetében a lépések száma
             * @return {Level}
             */
            move: function(location, num){
                this.ownerSet.moveLayer(this, location, num);
                return this;
            }

        };

        init(args, Interface);

        return Interface;

    }

};

export default Canvas;
