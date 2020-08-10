import Utility from '../hd.utility.js';

/**
 * Keymap beállítása és kezelése
 * @type {Object}
 */
const Keymap = {

    /**
     * Keymap
     * @type {Object}
     * @description
     *  az elemek megadásának módja:
     *  <művelet>: <interakció> vagy többlépéses művelet esetén az <interakciók tömbje>
     *  egy interakció alakja: 'event/key+modifier1+modifier2...'
     *  event: esemény neve
     *  key: event.key vagy event.buttons (Utility.Misc.mouse kulcsok)
     *  modifier: lenyomva tartott módosító billentyűk ('shift'|'ctrl'|'alt'|'meta')
     */
    functions: {
        select: 'click/left',  // click-nél az event.buttons valamiért mindig 0
        deselect: 'keydown/escape',
        multiselect: ['mousedown/left+shift', 'mousemove/left+shift', 'mouseup/left+shift'],
        toggleselect: 'mousedown/left+ctrl',
        put: 'dblclick/left',
        drag: ['mousedown/left', 'mousemove/left', 'mouseup/left'],
        rotate_point: 'mousedown/right+shift',
        rotate: ['mousedown/right', 'mousemove/right', 'mouseup/right'],
        resize_mode: 'mousedown/middle',
        resize: ['mousedown/left', 'mousemove/left', 'mouseup/left'],
        move_up: 'keydown/arrowup+ctrl',
        move_down: 'keydown/arrowdown+ctrl',
        move_left: 'keydown/arrowleft+ctrl',
        move_right: 'keydown/arrowright+ctrl',
        axialmove_up: 'keydown/arrowup+shift',
        axialmove_down: 'keydown/arrowdown+shift',
        delete: 'keydown/delete',
        copy: 'keydown/c+ctrl',
        paste: 'keydown/v+ctrl'
    },

    /**
     * Keymap-ben definiálható billentyű események
     * lekérdezés (esemény kiváltó): event.key
     * @type {Array}
     */
    keyEvents: ['keydown', 'keypress', 'keyup'],

    /**
     * Keymap-ben definiálható egér események, melyeknél egy gomb váltja ki az eseményt
     * lekérdezés (esemény kiváltó): event.button
     * @type {Array}
     */
    mouseTriggerEvents: ['click', 'dblclick', 'mousedown', 'mouseup'],

    /**
     * Keymap-ben definiálható egér események, melyeknél nem egy gomb az esemény kiváltója
     * lekérdezés (lenyomott gomb): event.buttons
     * @type {Array}
     */
    mouseProcessEvents: ['mousemove', 'wheel', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout'],

    /**
     * Definiált módosító billentyűk (lenyomva tartva módosíthatja az eseménykezelő működését)
     * @type {Array}
     */
    modifierKeys: ['shift', 'ctrl', 'alt', 'meta'],

    /**
     * Esemény adatai a functions értékeinek megfelelő formában
     * @param {Event} event - Event objektum
     * @return {String} eseményt leíró karakterlánc (a/b+c+d+... alakú)
     */
    getKey: function(event){
        let descriptor = event.type;
        if (Keymap.keyEvents.includes(event.type)){
            // billentyű
            descriptor += `/${event.key.toLowerCase()}`;
        }
        else {
            // egér
            let button;
            if (Keymap.mouseTriggerEvents.includes(event.type)){
                button = Object.keys(Utility.Misc.mouse).find(
                    i => Utility.Misc.mouse[i] === event.button
                );
            }
            else if (Keymap.mouseProcessEvents.includes(event.type)){
                button = Object.keys(Utility.Misc.mouse).find(
                    i => Utility.Misc.mousePress[i] === event.buttons
                );
            }
            if (button){
                descriptor += `/${button.toLowerCase()}`;
            }
        }
        Keymap.modifierKeys.forEach(mod => {
            if (event[`${mod}Key`]){
                descriptor += `+${mod}`;
            }
        });
        return descriptor;
    },

    /**
     * Eseményhez tartozó műveletek lekérdezése
     * @param {Event} event - Event objektum
     * @return {Array} lehetséges műveletek tömbje
     * @description
     *  return = [
     *      String,  // 'művelet'|'művelet/lépés' alakú, ahol a művelet a functions objektum kulcsa,
     *               // a lépés pedig a hozzá tartozó érték megfelelő tömbelemének a sorszáma
     *      ...
     *  ]
     */
    getFunctions: function(event){
        const functions = Keymap.functions;
        const descriptor = Keymap.getKey(event);
        const possibleFunctions = Object.keys(functions).filter(func => (
            functions[func] === descriptor ||
            (Array.isArray(functions[func]) && functions[func].includes(descriptor))
        ));
        const possibleFunctionsWithStep = possibleFunctions.map(func => {
            if (Array.isArray(functions[func])){
                const step = functions[func].findIndex(item => item === descriptor);
                return `${func}/${step}`;
            }
            else {
                return func;
            }
        });
        return possibleFunctionsWithStep;
    },

    /**
     * Eseménykezelő csatolása egy adott művelethez
     * @param {String} operation - művelet neve (pl 'delete', 'drag/2', ...)
     * @param {DOM} Element - csatolás ehhez az elemhez
     * @param {Function} eventHandler - eseménykezelő (argumentumok: target, event)
     */
    setEvent: function(operation, Element, eventHandler){
        const [mainOp, subOp] = operation.split('/');
        const func = Keymap.functions[mainOp];
        if (
            (Array.isArray(func) && typeof subOp === 'undefined') ||
            (!Array.isArray(func) && typeof subOp !== 'undefined')
        ){
            throw new Error(`No matching keymap operation for '${operation}'`);
        }
        const descriptor = Array.isArray(func) ? func[Number(subOp)] : func;
        const eventType = descriptor.split('/')[0];

        Element.event(eventType, function(target, event){
            if (Keymap.getFunctions(event).includes(operation)){
                event.preventDefault();
                eventHandler(target, event);
            }
        });
    }

};

export default Keymap;
