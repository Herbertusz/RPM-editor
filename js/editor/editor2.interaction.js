import Utility from '../hd.utility.js';
import HDMath from '../hd.math.js';
import DOM from '../hd.dom.js';

import EditorElements from './editor.elements.js';
import Keymap from './editor.keymap.js';
import State from './editor.state.js';
import Storage from './editor.storage.js';

/**
 * Interakciók megvalósítása
 * @type {Object}
 */
const Interaction = {

    /**
     * Csoportos kijelölés állapotát tároló adatszerkezet
     * @type {Object}
     */
    multiselect: {
        elements: [],
        active: false,
        handler: {x: 0, y: 0},
        mouse: {x: 0, y: 0},
        elementCenters: []
    },

    /**
     * [description]
     * @param {String} prop - [description]
     * @param {String|Number} value - [description]
     * @param {String} direction - ('display'|'prog')
     * @return {String} [description]
     */
    convert: function(prop, value, direction){
        let retValue = value;
        value = Number(value);
        if (direction === 'display'){
            if (prop === 'angle'){
                retValue = Number.parseFloat((180 * value) / Math.PI).toFixed(2);
            }
        }
        if (direction === 'prog'){
            if (prop === 'angle'){
                retValue = Number.parseFloat((Math.PI * value) / 180).toFixed(2);
            }
        }
        return String(retValue);
    },

    /**
     * Axiális mozgatás műveletének irányfüggetlen része
     * @param {String} direction - 'up'|'down'
     * @param {DOM} Moveable - mozgatandó elem
     * @return {Number} az elem új z-index értéke
     */
    axialMoveOperation: function(direction, Moveable){
        const tileId = Moveable.dataNum('tile-id');
        const z = State.axis.get(tileId);
        const newZ = direction === 'up' ? z + 1 : z - 1;
        const collideItem = [...State.axis].find(entry => entry[1] === newZ);
        if (collideItem){
            State.axis.set(tileId, newZ);
            State.axis.set(collideItem[0], z);
            Moveable.css({zIndex: newZ});
            EditorElements.Map.descendants(`[data-tile-id="${collideItem[0]}"]`).css({zIndex: z});
        }
        State.axis.forEach((thisZ, thisTileId) => {
            Storage.set(thisTileId, {z: thisZ});
        });
        return collideItem ? newZ : z;
    },

    /**
     * Tile adatait tároló doboz frissítése
     */
    updateDataPanel: function(){
        const selectedTiles = Interaction.multiselect.elements || EditorElements.MapTiles.filterByData('selected', true);
        if (selectedTiles.length === 1){
            const tileData = Storage.get(DOM(selectedTiles[0]).dataNum('tile-id'));
            EditorElements.Datapanel.css({display: 'block'});
            EditorElements.Datapanel.descendants('[data-value]').elements.forEach(input => {
                input.value = Interaction.convert(
                    input.dataset.value, tileData[input.dataset.value], 'display'
                );
            });
        }
        else {
            EditorElements.Datapanel.css({display: 'none'});
        }
    },

    /**
     * Tile adatait tároló dobozba írt értékek alkalmazása
     */
    applyDataPanel: function(){
        const selectedTiles = Interaction.multiselect.elements || EditorElements.MapTiles.filterByData('selected', true);
        if (selectedTiles.length === 1){
            const Tile = DOM(selectedTiles[0]);
            const tileId = Tile.dataNum('tile-id');
            const tileData = Storage.get(tileId);
            const newData = {};
            ['x', 'y', 'z', 'w', 'h', 'angle'].forEach(key => {
                newData[key] = Number(Interaction.convert(
                    key, EditorElements.Datapanel.descendants(`[data-value="${key}"]`).elem().value, 'prog'
                ));
            });
            if (newData.z !== tileData.z){
                const distance = newData.z - tileData.z;
                Utility.Array.fromNum(Math.abs(distance)).forEach(n => {
                    Interaction.axialMoveOperation(distance > 0 ? 'up' : 'down', Tile);
                });
            }
            Storage.set(tileId, {
                tile: tileData.tile,
                ...newData
            });
            Tile.css({
                left: `${newData.x}px`,
                top: `${newData.y}px`,
                zIndex: `${newData.z}px`,
                width: `${newData.w}px`,
                height: `${newData.h}px`,
                transform: `rotate(${newData.angle}rad)`
            });
        }
    },

    /**
     * Elemek kijelölése multiselect módon
     * @param {HTMLElement|Array.<HTMLElement>} elements - elem vagy elemek tömbje
     */
    selectElements: function(elements){
        DOM(elements).dataBool('selected', true).elements.forEach(elem => {
            Interaction.multiselect.elements.push(elem);
        });
    },

    /**
     * Kijelölés funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {String} selectables - kijelölhető elemek szelektora (tile-ok)
     * @param {Function} [callbackSelect] - kiválasztás utáni callback
     * @param {Function} [callbackDeselect] - kiválasztás törlése utáni callback
     */
    select: function({Container, selectables, callbackSelect = () => {}, callbackDeselect = () => {}}){

        /**
         * Kijelölő eszköz elrejtése
         */
        const lassoHide = function(){
            EditorElements.Lasso.css({
                display: 'none',
                left: '0',
                top: '0',
                width: '0',
                height: '0'
            });
        };

        // Kijelölés
        Keymap.setEvent('select', Container, function(target, event){
            if (DOM(event.target).data('tile')){
                if (Interaction.multiselect.elements.length <= 1){
                    State.mode = 'move';
                    Interaction.multiselect.elements = [];
                    DOM(selectables).dataBool('selected', false).dataBool('resize', false);
                    Interaction.selectElements(event.target);
                    lassoHide();
                    callbackSelect([event.target]);
                    Interaction.updateDataPanel();
                }
            }
        });

        // Kijelölés törlése
        Keymap.setEvent('deselect', Container, function(target, event){
            State.mode = 'move';
            Interaction.multiselect.elements = [];
            DOM(selectables).dataBool('selected', false).dataBool('resize', false);
            lassoHide();
            callbackDeselect();
            Interaction.updateDataPanel();
        });

        // Többszörös kijelölés kezdete
        Keymap.setEvent('multiselect/0', Container, function(target, event){
            State.mode = 'move';
            DOM(selectables).dataBool('selected', false).dataBool('resize', false);
            EditorElements.Lasso.css({
                display: 'block',
                zIndex: State.axisScale.lasso
            });
            Interaction.multiselect = {
                ...Interaction.multiselect,
                elements: [],
                active: true,
                handler: {
                    x: event.pageX,
                    y: event.pageY
                },
                mouse: {
                    x: event.pageX,
                    y: event.pageY
                }
            };
            Interaction.multiselect.elementCenters = DOM(selectables).elements.map(
                elem => ({
                    id: DOM(elem).dataNum('tile-id'),
                    center: Storage.get(DOM(elem).dataNum('tile-id')).center
                })
            );
        });

        // Többszörös kijelölés folyamata
        Keymap.setEvent('multiselect/1', Container, function(target, event){
            if (Interaction.multiselect.active){
                let x, y, w, h;
                x = Interaction.multiselect.mouse.x;
                y = Interaction.multiselect.mouse.y;
                w = event.pageX - Interaction.multiselect.mouse.x;
                h = event.pageY - Interaction.multiselect.mouse.y;
                if (w < 0){
                    x = x + w;
                    w = -w;
                }
                if (h < 0){
                    y = y + h;
                    h = -h;
                }
                EditorElements.Lasso.css({
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${w}px`,
                    height: `${h}px`
                });
                Interaction.multiselect.elementCenters.forEach(ec => {
                    const Elem = DOM(selectables).filterByData('tile-id', ec.id);
                    Elem.dataBool(
                        'selected',
                        HDMath.Geometry.isPointInsideRectangle(ec.center, {x, y, w, h})
                    );
                    const elemInArray = Interaction.multiselect.elements.find(
                        e => DOM(e).dataNum('tile-id') === Elem.dataNum('tile-id')
                    );
                    if (Elem.dataBool('selected') && !elemInArray){
                        Interaction.multiselect.elements.push(Elem.elem());
                    }
                });
            }
        });

        // Többszörös kijelölés vége
        Keymap.setEvent('multiselect/2', Container, function(target, event){
            if (Interaction.multiselect.active){
                lassoHide();
                callbackSelect(Interaction.multiselect.elements);
                Interaction.multiselect.active = false;
                Interaction.updateDataPanel();
            }
        });

        // Kijelölt hozzáadása / eltávolítása
        Keymap.setEvent('toggleselect', Container, function(target, event){
            const Target = DOM(event.target);
            if (Target.data('tile')){
                State.mode = 'move';
                DOM(selectables).dataBool('resize', false);
                if (Target.dataBool('selected')){
                    Target.dataBool('selected', false);
                    Interaction.multiselect.elements = Interaction.multiselect.elements.filter(
                        elem => elem !== event.target
                    );
                }
                else {
                    Interaction.selectElements(event.target);
                }
                lassoHide();
                callbackSelect(Interaction.multiselect.elements);
                Interaction.updateDataPanel();
            }
        });

    },

    /**
     * Törlés funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {String} deleteables - törölhető elemek szelektora (tile-ok)
     * @param {Function} [callback] - törlés utáni callback
     */
    delete: function({Container, deleteables, callback = () => {}}){

        Keymap.setEvent('delete', Container, function(target, event){
            const Deleteable = DOM(deleteables);
            Interaction.multiselect.elements = [];
            callback(Deleteable.elements);
            Deleteable.remove();
            Interaction.updateDataPanel();
        });

    },

    /**
     * Másolás funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {String} copyables - másolandó elemek szelektora (tile-ok)
     * @param {Function} [callback] - másolás utáni callback
     */
    copy: function({Container, copyables, callback = () => {}}){

        Keymap.setEvent('copy', Container, function(target, event){
            const copyableElements = DOM(copyables).elements;
            State.clipboard = copyableElements.map(e => Storage.collectData(DOM(e).dataNum('tile-id')));
            callback(State.clipboard);
            Interaction.updateDataPanel();
        });

    },

    /**
     * Beillesztés funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {Function} [callback] - beillesztés utáni callback
     */
    paste: function({Container, callback = () => {}}){

        Keymap.setEvent('paste', Container, function(target, event){
            const pasteableElements = State.clipboard.map(tileData => Storage.generateElement(tileData));
            Interaction.multiselect.elements = [];
            EditorElements.MapTiles.dataBool('selected', false).dataBool('resize', false);
            pasteableElements.forEach(elem => EditorElements.Map.elem().appendChild(elem));
            Interaction.selectElements(pasteableElements);
            callback(pasteableElements);
            Interaction.updateDataPanel();
        });

    },

    /**
     * Axiális mozgatás funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {String} moveables - axiálisan mozgatható elemek szelektora (tile-ok)
     * @param {Function} [callback] - axiális mozgatás utáni callback
     */
    axialMove: function({Container, moveables, callback = () => {}}){

        Keymap.setEvent('axialmove_up', Container, function(target, event){
            const Moveable = DOM(moveables);
            if (Moveable.elements.length){
                const newZ = Interaction.axialMoveOperation('up', Moveable);
                callback(Moveable.elem(), newZ, 'up');
                Interaction.updateDataPanel();
            }
        });

        Keymap.setEvent('axialmove_down', Container, function(target, event){
            const Moveable = DOM(moveables);
            if (Moveable.elements.length){
                const newZ = Interaction.axialMoveOperation('down', Moveable);
                callback(Moveable.elem(), newZ, 'down');
                Interaction.updateDataPanel();
            }
        });

    },

    /**
     * Átméretező funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {String} resizeables - átméretezhető elemek szelektora (tile-ok)
     * @param {Function} [callbackResize] - átméretezés közbeni callback
     * @param {Function} [callbackEnd] - átméretezés utáni callback
     */
    resize: function({Container, resizeables, callbackResize = () => {}, callbackEnd = () => {}}){

        const resize = {
            element: null,
            active: false,
            size: {w: 0, h: 0},
            newSize: {w: 0, h: 0},
            handler: {x: 0, y: 0},
            mouse: {x: 0, y: 0},
            sizechange: false
        };

        EditorElements.Resizer.css({
            zIndex: State.axisScale.resizer
        });

        // Átméretezés mód váltása
        Keymap.setEvent('resize_mode', Container, function(target, event){
            const Target = DOM(event.target);
            if (Target.dataBool('selected')){
                if (State.mode === 'move'){
                    State.mode = 'resize';
                    Target.dataBool('resize', true);
                    const tile = Target.getDimensions();
                    const resizeHandler = EditorElements.Resizer.getDimensions();
                    EditorElements.Resizer.css({
                        left: `${tile.x + tile.w - resizeHandler.w / 2}px`,
                        top: `${tile.y + tile.h - resizeHandler.h / 2}px`
                    });
                    resize.element = Container.descendants('[data-selected]').elem();
                }
                else {
                    State.mode = 'move';
                    Target.dataBool('resize', false);
                }
            }
        });

        // Átméretezés kezdete
        Keymap.setEvent('resize/0', EditorElements.Resizer, function(target, event){
            if (State.mode === 'resize'){
                const tile = DOM(resize.element).getDimensions();
                const resizeHandler = EditorElements.Resizer.getDimensions();
                resize.active = true;
                resize.size.w = tile.w;
                resize.size.h = tile.h;
                resize.handler.x = resizeHandler.x;
                resize.handler.y = resizeHandler.y;
                resize.mouse.x = event.pageX;
                resize.mouse.y = event.pageY;
            }
        });

        // Átméretezés folyamata
        Keymap.setEvent('resize/1', Container, function(target, event){
            if (resize.active){
                const ResizeElement = DOM(resize.element);
                const tile = ResizeElement.getDimensions();
                const newWidth = resize.size.w + event.pageX - resize.mouse.x;
                const newHeight = resize.size.h + event.pageY - resize.mouse.y;
                if (newWidth >= 10 && newHeight >= 10){
                    ResizeElement.css({
                        width: `${newWidth}px`,
                        height: `${newHeight}px`
                    });
                    EditorElements.Resizer.css({
                        left: `${resize.handler.x + event.pageX - resize.mouse.x}px`,
                        top: `${resize.handler.y + event.pageY - resize.mouse.y}px`
                    });
                    resize.newSize.w = newWidth;
                    resize.newSize.h = newHeight;
                }
                resize.sizechange = true;
                callbackResize(resize.element, {
                    w: resize.newSize.w,
                    h: resize.newSize.h
                });
                // const matrix = Element.css('transform');
                // if (matrix !== 'none'){
                //     const values = matrix.split('(')[1].split(')')[0].split(',');
                //     const scale = Math.sqrt(values[0] ** 2 + values[1] ** 2);
                // }
            }
        });

        // Átméretezés vége
        Keymap.setEvent('resize/2', Container, function(target, event){
            if (resize.active){
                if (resize.sizechange){
                    callbackEnd(resize.element, {
                        w: resize.newSize.w,
                        h: resize.newSize.h
                    });
                    resize.sizechange = false;
                    Interaction.updateDataPanel();
                }
                resize.active = false;
            }
        });

    },

    /**
     * Forgatás funkció megvalósítása
     * @param {DOM} Container - konténer elem (map)
     * @param {String} rotateables - forgatható elemek szelektora (tile-ok)
     * @param {Function} [callbackRotate] - elforgatás közbeni callback
     * @param {Function} [callbackEnd] - elforgatás utáni callback
     */
    rotate: function({Container, rotateables, callbackRotate = () => {}, callbackEnd = () => {}}){

        const rotate = {
            Elements: DOM(null),
            active: false,
            positions: [],
            mouse: {x: 0, y: 0},
            angles: [],
            moveAngle: 0
        };

        Keymap.setEvent('rotate_point', Container, function(target, event){
            State.mode = 'move';
            if (State.rotationPointPlaced){
                State.rotationPointPlaced = false;
                EditorElements.RotationPoint.css({
                    display: 'none'
                });
            }
            else {
                const rotateHandler = EditorElements.RotationPoint.getDimensions();
                State.rotationPointPlaced = true;
                EditorElements.RotationPoint.css({
                    display: 'block',
                    left: `${event.pageX - rotateHandler.w / 2}px`,
                    top: `${event.pageY - rotateHandler.h / 2}px`
                });
            }
        });

        // Forgatás kezdete
        Keymap.setEvent('rotate/0', Container, function(target, event){
            rotate.Elements = EditorElements.MapTiles.filterByData('selected', true);
            rotate.positions = rotate.Elements.elements.map(e => DOM(e).getDimensions());
            rotate.angles = rotate.Elements.elements.map(elem => {
                const matrix = elem.css('transform');
                let currentAngle = 0;
                if (matrix !== 'none'){
                    const values = matrix.split('(')[1].split(')')[0].split(',');
                    currentAngle = Math.atan2(values[1], values[0]);
                }
                return currentAngle;
            });
            if (rotate.Elements.elements.length > 0){
                rotate.active = true;
                rotate.mouse.x = event.pageX;
                rotate.mouse.y = event.pageY;
            }
        });

        // Forgatás folyamata
        Keymap.setEvent('rotate/1', Container, function(target, event){
            if (rotate.active){
                // egér relatív koordinátái
                const m = {
                    // eredeti koordináta
                    x1: rotate.mouse.x - rotate.pos.x,
                    y1: rotate.mouse.y - rotate.pos.y,
                    // elforgatott koordináta
                    x2: event.pageX - rotate.pos.x,
                    y2: event.pageY - rotate.pos.y
                };
                // forgatás
                const angle = Math.atan2(m.x1, m.y1) - Math.atan2(m.x2, m.y2) + rotate.angle;
                rotate.moveAngle = angle;
                DOM(rotate.element).css({
                    transform: `rotate(${angle}rad)`
                });
                callbackRotate(rotate.element, rotate.moveAngle);
            }
        });

        // Forgatás vége
        Keymap.setEvent('rotate/2', Container, function(target, event){
            if (rotate.active){
                callbackEnd(rotate.element, rotate.moveAngle);
                rotate.element = null;
                rotate.active = false;
                Interaction.updateDataPanel();
            }
        });

    },

    /**
     * Mozgatás funkció megvalósítása
     * @param {DOM} Container - konténer elem (amin belül működik a drag)
     * @param {String} draggables - drag-gelhető elemek szelektora
     * @param {Function} [callbackMove] - mozgatás során meghívódó függvény
     * @param {Function} [callbackEnd] - a drag végén meghívódó függvény
     */
    drag: function({Container, draggables, callbackMove = () => {}, callbackEnd = () => {}}){

        const drag = {
            Elements: DOM(null),
            active: false,
            positions: [],
            mouse: {x: 0, y: 0},
            movement: false
        };

        // Mozgatás kezdete
        Keymap.setEvent('drag/0', Container, function(target, event){
            let Elements, positions;
            if (DOM(event.target).dataBool('selected') && State.mode === 'move'){
                Elements = EditorElements.MapTiles.filterByData('selected', true);
                positions = Elements.elements.map(e => DOM(e).getDimensions());
            }
            else {
                return;
            }
            drag.Elements = Elements;
            drag.active = true;
            drag.positions = positions;
            drag.mouse.x = event.pageX;
            drag.mouse.y = event.pageY;
            drag.Elements.css({
                display: 'block',
                position: 'absolute'
            });
        });

        // Mozgatás folyamata
        Keymap.setEvent('drag/1', Container, function(target, event){
            if (drag.active){
                drag.Elements.elements.forEach((elem, index) => {
                    DOM(elem).css({
                        display: 'block',
                        left: `${drag.positions[index].x + event.pageX - drag.mouse.x}px`,
                        top: `${drag.positions[index].y + event.pageY - drag.mouse.y}px`
                    });
                });
                drag.movement = true;
                callbackMove(drag.Elements.elements, drag);
            }
        });

        // Mozgatás vége
        Keymap.setEvent('drag/2', Container, function(target, event){
            if (drag.active){
                if (drag.movement){
                    callbackEnd(drag.Elements.elements, drag);
                    drag.movement = false;
                    Interaction.updateDataPanel();
                }
                drag.Elements = DOM(null);
                drag.active = false;
            }
        });

    },

    /**
     * Ráhelyezés funkció megvalósítása
     * @param {DOM} Container - konténer elem (amin belül működik a put)
     * @param {String} putables - ráhelyezhető elemek szelektora
     * @param {Function} [callbackEnd] - a ráhelyezés végén meghívódó függvény
     */
    put: function({Container, putables, callbackEnd = () => {}}){

        Keymap.setEvent('put', DOM(putables), function(target, event){
            const Target = DOM(target);
            const tileId = State.tileId;
            const Element = Target.copyPasteEnd(Container.elem());
            const position = {x: 0, y: 0};
            Element.css({
                display: 'block',
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: State.axisScale.current
            });
            State.axis.set(tileId, State.axisScale.current);
            State.axisScale.current++;
            State.mode = 'move';
            Interaction.multiselect.elements = [];
            EditorElements.MapTiles.dataBool('selected', false).dataBool('resize', false);
            Interaction.selectElements(Element.elem());
            Element.dataNum('tile-id', tileId);
            EditorElements.Map.elem().focus();
            callbackEnd(Element.elem());
            Interaction.updateDataPanel();
        });

    }

};

export default Interaction;
