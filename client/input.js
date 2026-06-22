let changed = true;
const Controls = {
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ShiftLeft: 'shift',
    ShiftRight: 'shift',
    KeyZ: 'zoomOut',
    KeyX: 'zoomIn'
};

window.input = {};
for(let key in Controls){
    window.input[Controls[key]] = false;
}

const minimapCanvasEl = document.getElementById('minimapCanvas');
let minimapDragging = false;
let minimapHovering = false;

function panCameraToMinimap(e){
    const rect = minimapCanvasEl.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;

    camera.x = -(fx * boardW * squareSize);
    camera.y = -(fy * boardH * squareSize);
    changed = true;
}

function isOverMinimapRect(e){
    const r = window.minimapViewRect;
    if(!r) return false;

    const rect = minimapCanvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

function updateMinimapHoverCursor(e){
    if(minimapDragging === true) return;

    const hovering = isOverMinimapRect(e);
    if(hovering !== minimapHovering){
        minimapHovering = hovering;
        minimapCanvasEl.classList.toggle('hover-rect', hovering);
    }
}

minimapCanvasEl.addEventListener('mousemove', updateMinimapHoverCursor);
minimapCanvasEl.addEventListener('mouseleave', () => {
    minimapHovering = false;
    minimapCanvasEl.classList.remove('hover-rect');
});

minimapCanvasEl.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    minimapDragging = true;
    minimapCanvasEl.classList.remove('hover-rect');
    minimapCanvasEl.classList.add('grabbing');
    panCameraToMinimap(e);
});
window.addEventListener('mousemove', (e) => {
    if(minimapDragging === true){
        e.stopPropagation();
        panCameraToMinimap(e);
    }
}, true);
window.addEventListener('mouseup', (e) => {
    if(minimapDragging === true){
        minimapDragging = false;
        minimapCanvasEl.classList.remove('grabbing');
        updateMinimapHoverCursor(e);
    }
});

document.querySelectorAll('.pan-btn').forEach((btn) => {
    const dir = btn.dataset.dir;
    const press = (e) => {
        e.preventDefault();
        window.input[dir] = true;
        btn.classList.add('active');
    };
    const release = () => {
        window.input[dir] = false;
        btn.classList.remove('active');
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
});

window.onresize = () => {
    canvas.width = canvas.w = window.innerWidth;
    canvas.height = canvas.h = window.innerHeight;
    lastRenderedMinimap = -1E5;
    changed = true;
}
window.onresize();

let chatOpen = false;
let uiHidden = false;

const chatDiv = document.querySelector('.chatContainer');
const chatMsgContainer = document.querySelector('.chat-div');
const chatInput = document.querySelector('.chat');
const lbDiv = document.querySelector('.leaderboard-div');
const visChatDiv = document.querySelector('.chat-div');

chatMsgContainer.onwheel = (e) => {
    if(chatMsgContainer.scrollHeight > chatMsgContainer.clientHeight){
        return e.stopPropagation();
    }
}

let loadedChat = false;

window.onkeydown = window.onkeyup = (e) => {
    if(e.repeat) return;

    if(selfId !== -1){
        if(loadedChat === false){
            loadedChat = true;
            chatInput.classList.remove('hidden');
            const color = teamToColor(selfId);
            chatInput.style.color = `rgb(${color.r},${color.g},${color.b})`;
        }
        if(e.type === 'keydown'){
            if (e.code === 'Enter') {
                if (chatOpen === true && e.type === 'keydown') {
                    // send chat message
                    const text = chatInput.value.trim();
    
                    if(text.length !== 0){
                        sendChatMsg(text);
                    }
                    
                    chatOpen = false;
                    chatInput.value = '';
                    chatInput.blur();
    
                    chatInput.style.opacity = "0";
                } else if (e.type === 'keydown') {
                    // focus chat
                    chatOpen = true;
                    chatDiv.classList.remove('hidden');
                    chatInput.setAttribute('tabindex', '0');
                    chatInput.focus();
    
                    chatInput.style.opacity = "1";
                }
                return e.preventDefault();
            } else if (e.code === 'KeyH' && chatOpen === false) {
                if (uiHidden === false) {
                    chatInput.blur();
                    if (!visChatDiv.classList.contains('hideChat')) {
                        visChatDiv.classList.add('hideChat');
                    }
                    if (!lbDiv.classList.contains('hideLB')) {
                        lbDiv.classList.add('hideLB');
                    }
                } else {
                    if (visChatDiv.classList.contains('hideChat')) {
                        visChatDiv.classList.remove('hideChat');
                        visChatDiv.scrollTop = visChatDiv.scrollHeight;
                    }
                    if (lbDiv.classList.contains('hideLB')) {
                        lbDiv.classList.remove('hideLB');
                    }
                }
                uiHidden = !uiHidden;
            }
        }

        if(chatOpen === true){
            return;
        }
    }

    if (Controls[e.code] !== undefined) {
        const name = Controls[e.code];
        const state = e.type === 'keydown';
        window.input[name] = state;
    }

    // if(hotkeyFns[e.code] !== undefined && e.type === 'keydown'){
    //     hotkeyFns[e.code](e);
    // }
}

window.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.scale *= (1 - e.deltaY / 2100);
    if(camera.scale > 6) camera.scale = 6;
    else if(camera.scale < 0.27) camera.scale = 0.27;
    changed = true;
}, { passive: false });

function appendChatMessage(msg, color='white'){
    const chatMessage = document.createElement('div');
    chatMessage.innerText = msg;
    if(color === 'rainbow'){
        setInterval(() => {
            chatMessage.style.color = `hsl(${performance.now() / 12}, 50%, 50%)`;
        }, 1000 / 60)
    }
    else chatMessage.style.color = color;
    chatMessage.className = "chat-message";
    chatMsgContainer.prepend(chatMessage);
    setTimeout(() => {
        // animating fadeout after 5s
        chatMessage.animate([
            {
                opacity: 1,
            },
            {
                transform: 'rotateZ(2deg)',
                'font-size': '0rem',
                opacity: 0,
            },
        ], {
            duration: 1000,
            iterations: 1
        });
        
        setTimeout(() => {
            chatMessage.remove();
        }, 950);
    }, 30000);
}

const leaderboard = document.querySelector('.leaderboard-div');
function addToLeaderboard(playerName, playerId, mapName, bracketValue=0, lbColor='white'){
    let mapDiv = document.getElementById(`leaderboard-map-${mapName}`);
    if(mapDiv === null){
        // create mapDiv
        mapDiv = document.createElement('div');
        mapDiv.classList.add("lb-group");
        mapDiv.id = `leaderboard-map-${mapName}`;

        const displayMapName = stringHTMLSafe(mapName);

        const mapNameDiv = document.createElement('span');
        mapDiv.appendChild(mapNameDiv);
        mapNameDiv.classList.add('lb-name');
        mapNameDiv.style.color = /*window.mapColors[mapName] ??*/ /*'#6cd95b'*/ '#3528e0';
        mapNameDiv.innerText = displayMapName;

        leaderboard.appendChild(mapDiv);
    }

    // add the player to the mapDiv
    const playerContainer = document.createElement('div');
    playerContainer.id = `player-container-${playerId}-${mapName}`;
    playerContainer.classList.add('lb-players');
    mapDiv.appendChild(playerContainer);

    const playerDiv = document.createElement('div');
    playerContainer.appendChild(playerDiv);

    const playerNameDiv = document.createElement('span');
    playerNameDiv.classList.add('player-name');
    playerNameDiv.innerText = playerName + ` [${bracketValue}]`;
    playerNameDiv.style.color = lbColor;
    playerDiv.appendChild(playerNameDiv);
}

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if(isMobile){
    chatInput.onclick = () => {
        chatDiv.classList.remove('hidden');
        chatInput.setAttribute('tabindex', '0');
        chatInput.focus();
        
        chatInput.style.opacity = "1";

        let text = prompt("Send a chat message");
        if(text.length !== 0){
            sendChatMsg(text);
        }
        
        chatOpen = false;
        chatInput.value = '';
        chatInput.blur();

        chatInput.style.opacity = "0";
    }
}

function sendChatMsg(txt){
    if(txt === '/clear'){
        while(chatMsgContainer.firstChild) {chatMsgContainer.firstChild.remove();}
        return;
    }
    const buf = new Uint8Array(txt.length + (txt.length % 2) + 2);
    buf[0] = 247;
    buf[1] = 183;
    encodeAtPosition(txt, buf, 2);
    send(buf);
}