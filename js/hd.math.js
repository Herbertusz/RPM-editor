/**
 * HD-keret Maths
 *
 * @description Matematikai segédfüggvények
 * @requires -
 */

/**
 * Matematikai műveletek (Math objektum kiegészítései)
 * @type {Object}
 */
const Maths = {

    /**
     * Véletlenszám a és b között (a és b is benne lehet)
     * @param {Number} min - egész szám
     * @param {Number} max - egész szám
     * @return {Number} egész szám
     */
    rand: function(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Tizes számrendszerbeli kerekítés
     * @param {String} type - kjerekítés típusa
     * @param {*} value - szám
     * @param {Number} [exp=0] - exponens (...|-2|-1|0|1|2|...) (a kerekítési alap 10-es alapú logaritmusa)
     * @return {Number} kerekített érték
     */
    _decimalAdjust: function(type, value, exp = 0){
        // If the exp is undefined or zero...
        if (+exp === 0){
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)){
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    },

    /**
     * Szám kerekítése
     * @param {Number} value - szám
     * @param {Number} [exp=0] - pontosság (helyiérték csúsztatása)
     * @return {Number} kerekített érték
     */
    round: function(value, exp){
        return Maths._decimalAdjust('round', value, exp);
    },
    /**
     * Szám lefelé kerekítése
     * @param {Number} value - szám
     * @param {Number} [exp=0] - pontosság (helyiérték csúsztatása)
     * @return {Number} kerekített érték
     */
    floor: function(value, exp){
        return Maths._decimalAdjust('floor', value, exp);
    },
    /**
     * Szám felfelé kerekítése
     * @param {Number} value - szám
     * @param {Number} [exp=0] - pontosság (helyiérték csúsztatása)
     * @return {Number} kerekített érték
     */
    ceil: function(value, exp){
        return Maths._decimalAdjust('ceil', value, exp);
    },

    /**
     * Halmazműveletek
     * @type {Object}
     */
    Set: {

        /**
         * Unió
         * @param {Array} A
         * @param {Array} B
         * @return {Array} A|B
         */
        union: function(A, B){
            let n;
            const ret = A;
            for (n = 0; n < B.length; n++){
                if (ret.indexOf(B[n]) === -1){
                    ret.push(B[n]);
                }
            }
            return ret;
        },

        /**
         * Metszet
         * @param {Array} A
         * @param {Array} B
         * @return {Array} A&B
         */
        intersection: function(A, B){
            let n;
            const ret = [];
            for (n = 0; n < A.length; n++){
                if (B.indexOf(A[n]) > -1){
                    ret.push(A[n]);
                }
            }
            return ret;
        },

        /**
         * Különbség
         * @param {Array} A
         * @param {Array} B
         * @return {Array} A\B
         */
        difference: function(A, B){
            let n;
            const ret = [];
            for (n = 0; n < A.length; n++){
                if (B.indexOf(A[n]) === -1){
                    ret.push(A[n]);
                }
            }
            return ret;
        },

        /**
         * Egyenlőség
         * @param {Array} A
         * @param {Array} B
         * @return {Boolean} A === B sorrendtől eltekintve
         */
        equal: function(A, B){
            let i;
            if (A === B) return true;
            if (A.length !== B.length) return false;
            A.sort();
            B.sort();
            for (i = 0; i < A.length; ++i){
                if (A[i] !== B[i]) return false;
            }
            return true;
        }

    },

    /**
     * Geometriai műveletek
     * @type {Object}
     */
    Geometry: {

        /**
         * Két pont távolsága
         * @param {Object} a - pont {x: Number, y: Number}
         * @param {Object} b - pont {x: Number, y: Number}
         * @return {Number} távolság
         */
        distance: function(a, b){
            return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        },

        /**
         * Abszolút koordináták kiszámítása
         * @param {Array} positions - relatív koordináták [[Number, Number], ...]
         * @param {Number} w - abszolút szélesség
         * @param {Number} h - abszolút magasság
         * @param {Number} [xOffset=0] - abszolút vízszintes eltolás
         * @param {Number} [yOffset=0] - abszolút függőleges eltolás
         * @return {Array} abszolút koordináták [{x: Number, y: Number}, ...]
         */
        getAbsoluteCoords: function(positions, w, h, xOffset = 0, yOffset = 0){
            let x, y;
            const coords = [];
            positions.forEach((elem, index) => {
                x = elem[0] / 100;
                y = elem[1] / 100;
                coords[index] = {
                    x: Maths.round(w * x) + xOffset,
                    y: Maths.round(h * y) + yOffset
                };
            });
            return coords;
        },

        /**
         * Pont benne van-e egy téglalapban
         * @param {Object} point - {x: Number, y: Number}
         * @param {Object} rectangle - {x: Number, y: Number, w: Number, h: Number}
         * @return {Boolean}
         */
        isPointInsideRectangle: function(point, rectangle){
            return (
                rectangle.x < point.x && rectangle.x + rectangle.w > point.x &&
                rectangle.y < point.y && rectangle.y + rectangle.h > point.y
            );
        }

    },

    /**
     * Animációk kezelése
     * @type {Object}
     */
    Animation: {

        /**
         * Timeout ID-k
         * @type {Object}
         * @desc timers = {
         *     <ID>: Number,
         *     ...
         * }
         */
        timers: {},

        /**
         * Aktulási animációs értékek
         * @type {Object}
         * @desc values = {
         *     <ID>: Number,
         *     ...
         * }
         */
        values: {},

        /**
         * Animáció lefutási görbéjét meghatározó függvények
         * @type {Object}
         * @desc easings = {
         *     <name>: Function,
         *     ...
         * }
         */
        easings: {
            /**
             * Easing függvény (továbbiak: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js)
             * @param {Number} t - független változó (idő)
             * @param {Number} b - kezdeti érték y(t0)
             * @param {Number} c - érték változása y(t1) - y(t0)
             * @param {Number} d - időtartam (t1 - t0)
             * @return {Number} függvény értéke y(t)
             */
            linear: function(t, b, c, d){
                return c * t / d + b;
            },
            swing: function(t, b, c, d){
                return ((-Math.cos(t * Math.PI / d) / 2) + 0.5) * c + b;
            }
        },

        /**
         * Animáció futtatása
         * @param {String} ID - animáció azonosítója (ajánlott minden elemre egyedi ID)
         * @param {Object} options - beállítások
         * @desc options = {
         *     action: Function    // minden lépésnél meghívott függvény (megkapja az animáció értékét): (Number) => {}
         *     callback: Function  // az animáció végén meghívott függvény: () => {}
         *     delay: Number       // animáció hossza (ms): 1000
         *     range: Array        // animációs érték tartománya: [0, 1]
         *     easing: String      // animációs függvény: 'swing'
         * }
         */
        run: function(ID, options){
            options = Object.assign({
                action: () => {},
                callback: () => {},
                delay: 1000,
                range: [0, 1],
                easing: 'swing'
            }, options);

            let value = 0;
            const steps = options.delay / 20;
            const len = Maths.floor(steps);
            const animation = Maths.Animation;

            const makeStep = function(val, currentStep){
                const timerID = setTimeout(function(){
                    animation.values[ID] = val;
                    options.action.call(this, val);
                    if (currentStep === len && typeof callback === 'function'){
                        options.callback.call(this);
                        Reflect.deleteProperty(animation.timers, ID);
                    }
                }.bind(Maths.Animation), options.delay / steps * currentStep);
                animation.timers[ID].push(timerID);
            };

            animation.timers[ID] = [];
            [...Array(len).keys()].forEach(i => {
                value = animation.easings[options.easing](
                    i, options.range[0], options.range[1] - options.range[0], steps
                );
                makeStep(value, i);
            });
        },

        /**
         * Animáció megállítása
         * @param {Number} ID - timeout ID
         * @return {Number} animáció utolsó értéke
         */
        stop: function(ID){
            const animation = Maths.Animation;
            if (animation.timers.hasOwnProperty(ID)){
                animation.timers[ID].forEach(function(id){
                    clearTimeout(id);
                });
                return animation.values[ID];
            }
            else {
                return null;
            }
        }

    }

};

export default Maths;
