/**
 * Socket névtér
 * @type {Object}
 */
const Socket = {

    /**
     * WebSocket URL
     * @type {String}
     */
    URL: `ws://roleplaymadness.com:9000`,

    /**
     * WebSocket interface
     * @type {Object}
     */
    IO: null,

    /**
     * Adatok küldése a szervernek socketen keresztül
     * @param {Object} obj
     */
    send: function(obj){
        Socket.IO.send(JSON.stringify(obj));
    },

    /**
     * WebSocket létrehozása
     * @param {Function} handleMessage - adatok fogadását végző callback
     * @param {Boolean} [persistent=true] - ha true, megszakítás esetén újra kapcsolódik
     * @return {Promise}
     */
    connect: function(handleMessage, persistent = true){
        return new Promise(function(resolve, reject){
            Socket.IO = new WebSocket(Socket.URL);
            Socket.IO.onopen = function(event){
                console.info('Kapcsolat létrehozva a szerverrel!');
                resolve(event);
            };
            Socket.IO.onerror = function(event){
                console.warn('Kapcsolat összeomlott!');
                reject(event);
            };
            Socket.IO.onclose = function(event){
                console.info('Kapcsolat bontva a szerverrel!');
                if (persistent){
                    setTimeout(Socket.connect, 1000);
                }
            };
            Socket.IO.onmessage = function(event){
                handleMessage(JSON.parse(event.data));
            };
        });
    }

};

export default Socket;
