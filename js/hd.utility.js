/**
 * HD-keret Utility
 *
 * @description Alapvető segédfüggvények
 * @requires -
 */

const Utility = {};

/**
 * Általános műveletek és adatok
 * @type {Object}
 */
Utility.Misc = {

    /**
     * Eseményt kiváltó egér gombok (event.button értékei)
     * @type {Object}
     */
    mouse: {
        LEFT: 0, MIDDLE: 1, RIGHT: 2
    },

    /**
     * Jelenleg nyomvatartott egér gombok (event.buttons értékei)
     * @type {Object}
     */
    mousePress: {
        NONE: 0, LEFT: 1, RIGHT: 2, LEFTRIGHT: 3, MIDDLE: 4, LEFTMIDDLE: 5, RIGHTMIDDLE: 6, LEFTRIGHTMIDDLE: 7
    },

    /**
     * Speciális billentyűk
     * @type {Object}
     * @deprecated event.key használandó (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)
     */
    keys: {
        ALT: 18, BACKSPACE: 8, CAPS_LOCK: 20, COMMA: 188, CTRL: 17, DELETE: 46, DOWN: 40, END: 35, ENTER: 13,
        ESC: 27, HOME: 36, INSERT: 45, LEFT: 37, NUM_LOCK: 144, NUMPAD_ADD: 107, NUMPAD_DECIMAL: 110,
        NUMPAD_DIVIDE: 111, NUMPAD_ENTER: 108, NUMPAD_MULTIPLY: 106, NUMPAD_SUBTRACT: 109, PAGE_DOWN: 34,
        PAGE_UP: 33, PAUSE: 19, PERIOD: 190, RIGHT: 39, RIGHT_CLICK: 93, SCROLL_LOCK: 145, SHIFT: 16, SPACE: 32,
        TAB: 9, UP: 38, WINDOWS: 91
    },

    /**
     * Alfanumerikus karakterek
     * @type {Object}
     * @deprecated event.key használandó
     */
    letters: {
        'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73,
        'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82,
        's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57
    },

    /**
     * Értékadásra használt switch szerkezetet helyettesítő függvény
     * @param {*} variable - változó
     * @param {Object} relations - változó különböző értékeihez rendelt visszatérési értékek
     * @param {*} [defaultValue=null] - alapértelmezett érték (default)
     * @return {*}
     * @example
     *  control = Utility.Misc.switching(key, {
     *      'W': 'accelerate',
     *      'A': 'turnLeft',
     *      'S': 'brake',
     *      'D': 'turnRight'
     *  }, null);
     */
    switching: function(variable, relations, defaultValue = null){
        let index;
        for (index in relations){
            if (variable === index){
                return relations[index];
            }
        }
        return defaultValue;
    },

    /**
     * Változó deklaráltságának ellenőrzése
     * @param {*} param - változó
     * @return {boolean} true ha deklarált
     */
    defined: function(param){
        return typeof param !== 'undefined';
    },

    /**
     * Változó deklarálása ha nem deklarált
     * @param {*} param - változó
     * @param {*} value - alapértelmezett érték
     * @return {*} új érték
     */
    define: function(param, value){
        return typeof param !== 'undefined' ? param : value;
    }

};

/**
 * Szám-műveletek (Number objektum kiegészítései)
 * @type {Object}
 */
Utility.Number = {

    /**
     * Egyedi (pszeudo) id generálása
     * @return {Number}
     */
    getUniqueId: function(){
        return Number(String(Date.now()).substr(6) + String(Math.floor(Math.random() * 1000)));
    },

    /**
     * Szám elejének feltöltése nullákkal
     * @param {Number} num - szám
     * @param {Number} len - kívánt hossz
     * @return {String} nullákkal feltöltött szám
     */
    fillZero: function(num, len){
        let numStr = '';
        const originalNumStr = String(num);
        const originalLen = originalNumStr.length;
        for (let n = originalLen; n < len; n++){
            numStr += '0';
        }
        return numStr + originalNumStr;
    },

    /**
     * Fájlméret kiírása
     * @param {Number} size - méret bájtokban
     * @param {Number} [precision=2] - pontosság (tizedesjegyek száma)
     * @param {Number} [prefixLimit=0.5] - ha ennél kisebb, az alacsonyabb prefixum használata
     * @return {String} olvasható érték
     */
    displaySize: function(size, precision = 2, prefixLimit = 0.5){
        let n = 1.0;
        let k, i;
        const pref = ['', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
        for (k = 0; k < precision; k++){
            n *= 10.0;
        }
        for (i = 1; i < 9; i++){
            if (size < Math.pow(1024, i) * prefixLimit){
                return `${Math.round((size / Math.pow(1024.0, i - 1)) * n) / n} ${pref[i]}B`;
            }
        }
        return `${Math.round((size / Math.pow(1024.0, i - 1)) * n) / n} ${pref[i]}B`;
    },

    /**
     * Fájlméret visszafejtése (a displaysize inverze)
     * Pl.: '10.5 MB', '1000kB', '3 400 000 B', '2,7 GB'
     * @param {String} size - méret olvasható formában
     * @return {Number} értéke bájtban
     */
    recoverSize: function(size){
        let numberpart, multiply, offset, prefixum, index, n;
        let q = '';
        const pref = {
            none: 1,
            k: 1024,
            M: 1048576,
            G: 1073741824,
            T: 1099511627776
        };
        for (n = size.length - 1; n >= 0; n--){
            if (/[0-9]/.test(size[n])){
                n++;
                break;
            }
            q += size[n];
        }
        if (n === 0){
            // nincs numerikus karakter
            numberpart = 0.0;
        }
        else {
            if (q.length === 0){
                offset = size.length;
            }
            else {
                offset = size.length - q.length;
            }
            numberpart = size.substr(0, offset);
            if (size.indexOf('.') === -1 && size.indexOf(',') > -1){
                numberpart = numberpart.replace(',', '.');
            }
            numberpart = numberpart.replace(' ', '');
        }
        q = this.reverse(q).toLowerCase().trim();
        if (q.length === 2){
            prefixum = q[0];
            if (pref.hasOwnProperty(prefixum)){
                for (index in pref){
                    if (index === prefixum){
                        multiply = pref[index];
                        break;
                    }
                }
            }
            else if (pref.hasOwnProperty(prefixum.toUpperCase())){
                for (index in pref){
                    if (index === prefixum.toUpperCase()){
                        multiply = pref[index];
                        break;
                    }
                }
            }
            else {
                // nincs ilyen prefixum definiálva
                multiply = 0.0;
            }
        }
        else if (q.length === 1){
            // nincs prefixum
            multiply = pref.none;
        }
        else {
            // nincs mértékegység megadva vagy túl hosszú
            multiply = 0.0;
        }
        return parseFloat(multiply) * parseFloat(numberpart);
    }

};

/**
 * Karakterlánc műveletek (String objektum kiegészítései)
 * @type {Object}
 */
Utility.String = {

    /**
     * Első karakter nagybetűssé alakítása
     * @param {String} str
     * @return {String}
     */
    ucFirst: function(str){
        return str[0].toUpperCase() + str.slice(1);
    },

    /**
     * A php urlencode() függvényével egyenértékű
     * @param {String} str
     * @return {String}
     */
    urlEncode: function(str){
        str = String(str);
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A')
            .replace(/%20/g, '+');
    },

    /**
     * Karakterlánc megfordítása
     * @param {String} str - karakterlánc
     * @return {String} karakterlánc visszafelé
     */
    reverse: function(str){
        return str.split('').reverse().join('');
    },

    /**
     * Előtag eltávolítása a karakterláncról
     * @param {String} str - karakterlánc
     * @param {String} separator - előtag kapcsoló karakter
     * @return {String} maradék karakterlánc
     */
    removePrefix: function(str, separator){
        const arr = str.split(separator);
        arr.shift();
        return arr.join(separator);
    },

    /**
     * E-mail cím ellenőrzés
     * @param {String} email - e-mail cím
     * @return {Boolean} true, ha jó a formátum
     */
    validateEmail: function(email){
        return /^[a-z0-9._-]+@[a-z0-9._-]+\.[a-z]+$/.test(email);
    },

    /**
     * Karakterlánc átalakítása RegExp objektummá
     * @param {String} str - regexp literál pl.: '/x/gi'
     * @return {RegExp}
     */
    createRegExp: function(str){
        const pattern = str.replace(/^\/(.*)\/[gimuy]*$/, '$1');
        const flags = str.replace(/^\/.*\/([gimuy]*)$/, '$1');
        return new RegExp(pattern, flags);
    },

    /**
     * Ékezetes betűk (magyar) és írásjelek kiszedése (pl. "Űkuöí Owá-43" -> "Ukuoi_Owa_43")
     * az írásjeleket az exceptions-ben lévő karakterek kivételével a replace-re cseréli
     * @param {String} str - átalakítandó karakterlánc
     * @param {String} [replace='_'] - karakterlánc, amire az írásjelek cserélődnek
     * @param {Object} [options] - egyéb beállítások
     * @return {String} átalakított karakterlánc
     * TODO: tesztelés
     */
    canonic: function(str, replace = '_', options = {}){
        options = Object.assign({
            exceptions: '',
            tolower: false,
            trim: true,
            chars: 'a-zA-Z0-9'
        }, options);

        let canonic = '';

        [...str].forEach(c => {
            canonic += Utility.Misc.switching(c, {
                'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u',
                'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O', 'Ú': 'U', 'Ü': 'U', 'Ű': 'U'
            }, c);
        });

        if (options.trim) canonic = canonic.trim();
        canonic = canonic.replace(new RegExp(`/[^${options.chars}${options.exceptions}]+/`), replace);
        if (options.tolower) canonic = canonic.toLowerCase();
        return canonic;
    },

    /**
     * Megadott hosszúságú karakterlánc generálása (pl jelszóhoz)
     * @param {Number} len - hossz
     * @param {String} [type=1aA] - használható karaktertípusok
     * @return {String} generált karakterlánc
     * TODO: tesztelés
     */
    generate: function(len, type = '1aA'){
        let n;
        let chars = '';
        let ret = '';
        const nums = '0123456789';
        const lowchars = 'abcdefghijklmnopqrstuvwxyz';
        const upchars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const signs = '\'"+!%/=()~^`$<>#&@{}[]\\|,.-?:_;*';

        if (type.indexOf('1') > -1){
            chars += nums;
        }
        if (type.indexOf('a') > -1){
            chars += lowchars;
        }
        if (type.indexOf('A') > -1){
            chars += upchars;
        }
        if (type.indexOf('s') > -1){
            chars += signs;
        }

        for (n = 0; n < len; n++){
            ret += chars[Math.floor(Math.random() * chars.length)];
        }
        return ret;
    },

    /**
     * Jelszó kódolása
     * @param {String} pwd - kódolandó jelszó
     * @param {String} [salt] - só
     * @return {String} kódolt jelszó
     * TODO: sha1 függvény
     * TODO: tesztelés
     */
    hash: function(pwd, salt){
        const sha1 = (s) => s;
        const PROJECT_NAME = '';

        if (typeof salt === 'undefined'){
            pwd = sha1(pwd);
        }
        else {
            let i;
            let salt2 = '';
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const salt1 = salt;
            const salt2_original = PROJECT_NAME;
            for (i = 0; i < salt2_original.length; i++){
                salt2 += chars[chars.indexOf(salt2_original[i]) + 1 % chars.length];
            }
            pwd = sha1(salt1 + pwd + salt2);
        }
        return pwd;
    }

};

/**
 * Függvény műveletek
 * @type {Object}
 */
Utility.Function = {

    /**
     * Alapértelmezett paraméterérték megadása függvényben
     * @param {*} param - paraméter
     * @param {*} value - alapértelmezett érték
     * @return {*} ezt kell értékül adni a paraméternek
     * @example
     *  par = Utility.Function.param(par, 0);
     * @deprecated ES2015 alapértelmezett paraméterek használandó
     */
    param: function(param, value){
        if (typeof param === 'undefined'){
            return value;
        }
        else {
            return param;
        }
    }

};

/**
 * Tömb műveletek (Array objektum kiegészítései)
 * @type {Object}
 */
Utility.Array = {

    /**
     * For ciklus funkcionális helyettesítét teszi lehetővé
     * for (let i = 0; i < n; i++) helyett Utility.Array.fromNum(n).forEach(...)
     * @param {Number} length - iterációk száma
     * @return {Array}
     */
    fromNum: function(length){
        return [...Array(length).keys()];
    },

    /**
     * For-in ciklus funkcionális helyettesítét teszi lehetővé
     * for (let i in obj) helyett Utility.Array.fromObj(obj).forEach(...)
     * @param {Object} obj - bejárandó objektum
     * @return {Array} Object.values(obj)
     */
    fromObj: function(obj){
        const values = [];
        let i;
        for (i in obj){
            values.push(obj[i]);
        }
        return values;
    },

    /**
     * Általános indexOf
     * @param {Object} val - keresendő elem
     * @param {Array} arr - tömb
     * @param {Function} comparer - összehasonlító függvény
     * @return {Number}
     * @deprecated Array.prototype.includes() használandó
     */
    indexOf: function(val, arr, comparer){
        let len, i;
        for (i = 0, len = arr.length; i < len; ++i){
            if (i in arr && comparer(arr[i], val)){
                return i;
            }
        }
        return -1;
    },

    /**
     * Hozzáadás tömbhöz, ha még nem tartalmazza az adott értéket
     * @param {Array} arr - tömb
     * @param {*} val - érték
     * @return {Array} módosított tömb
     */
    addByVal: function(arr, val){
        if (arr.indexOf(val) === -1){
            arr.push(val);
        }
        return arr;
    },

    /**
     * Érték eltávolítása a tömbből
     * @param {Array} arr - tömb
     * @param {*} val - érték
     * @return {Array} módosított tömb
     */
    removeByVal: function(arr, val){
        const index = arr.indexOf(val);
        if (index > -1){
            arr.slice(index, 1);
        }
        return arr;
    },

    /**
     * 2D-s tömb "elforgatása"
     * @param {Array} arr - tömb
     * @return {Array}
     * @example
     *  [[1,2],[3,4],[5,6]] -> [[1,3,5],[2,4,6]]
     */
    rotate: function(arr){
        let i, j;
        const rotated = [];
        for (i = 0; i < arr[0].length; i++){
            rotated[i] = [];
            for (j = 0; j < arr.length; j++){
                rotated[i][j] = arr[j][i];
            }
        }
        return rotated;
    }

};

/**
 * Objektum műveletek (Object objektum kiegészítései)
 * @type {Object}
 */
Utility.Object = {

    /**
     * Objektum iterálhatóvá tétele
     * @param {Object} obj
     * @return {Object}
     */
    iterable: function(obj){
        obj[Symbol.iterator] = function*(){
            for (const i in obj){
                yield obj[i];
            }
        };
        return obj;
    },

    /**
     * Egyszintű keresés objektumban callback függvény alapján
     * @param {Object} obj - haystack
     * @param {Function} callback - keresendő elemre truthy értéket kell adnia
     * @return {*} keresett elem
     * @description
     *  callback argumentumai:
     *   param {*} - objektum egy eleme
     *   param {String} - objektum elemének kulcsa
     *   param {Object} - az objektum
     */
    search: function(obj, callback){
        for (const prop in obj){
            if (callback(obj[prop], prop, obj)){
                return obj[prop];
            }
        }
    },

    /**
     * Objektumok közti részleges egyezés vizsgálata
     * @param {Object} partialObject - keresendő rész
     * @param {Object} fullObject - keresett objektum
     * @return {Boolean} a keresett objektum tartalmazza a keresendő részt
     */
    partialMatch: function(partialObject, fullObject){
        const properties = Object.keys(partialObject);
        return properties.every(prop => partialObject[prop] === fullObject[prop]);
    }

};

export default Utility;
