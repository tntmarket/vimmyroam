// ==UserScript==
// @name         vimmyroam
// @namespace    https://roamresearch.com
// @version      0.1
// @description  Vim like keybindings for roam
// @author       Dave Lu
// @match        https://roamresearch.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/hotkeys-js@3.7.3/dist/hotkeys.min.js
// ==/UserScript==


(() => {
    'use strict';

    const viewMoreDailyNotes = () => {
        if (isElementVisible($(SELECTOR.viewMore))) {
            simulateClick($(SELECTOR.viewMore), false);
        }
    };

    const KEYMAP = new Map([
        // Scrolling
        ['j', () => {
            viewMoreDailyNotes();
            scrollingElement().scrollTop += 50;
        }],
        ['k', () => {
            scrollingElement().scrollTop -= 50;
        }],
        ['d', () => {
            viewMoreDailyNotes();
            scrollingElement().scrollTop += 400;
        }],
        ['u', () => {
            scrollingElement().scrollTop -= 400;
        }],
        ['g,g', () => {
            scrollingElement().scrollTop = 0;
        }],
        ['G', () => {
            viewMoreDailyNotes();
            scrollingElement().scrollTop = scrollingElement().scrollHeight;
        }],
        // Navigation
        ['h', () => {
            lastFocusedMainBlock = lastFocusedMainBlock || $(SELECTOR.article);
            simulateClick(lastFocusedMainBlock.querySelector(SELECTOR.block), false);
        }],
        ['l', () => {
            lastFocusedSideBlock = lastFocusedSideBlock || $(SELECTOR.sidebar);
            if (lastFocusedSideBlock) {
                simulateClick(lastFocusedSideBlock.querySelector(SELECTOR.block), false);
            }
        }],
        ['e', () => {
            const targets = targetElements(SELECTOR.block, 'block')
                .concat(targetElements(SELECTOR.title, 'title'));

            hintTargets(targets);
        }],
        ['f', () => {
            const targets = targetElements(SELECTOR.link, 'link')
                .concat(targetElements(SELECTOR.block, 'block'))
                .concat(targetElements(SELECTOR.title, 'title'))
                .concat(targetElements('a', 'anchor'))
                .concat(targetElements(SELECTOR.button, 'button'));

            hintTargets(targets);
        }],
    ]);

    const targetElements = (selector, type) => Array
        .from($$(selector))
        .filter(isElementVisible)
        .map(element => ({ element, type }));

    const hintTargets = (targets) => {
        const hintKeys = getHintKeys(targets.length);
        // zip hintKeys with targets
        const hintToTarget = targets.map((target, i) => [hintKeys[i], target]);

        hintToTarget.forEach(([hint, { element, type }]) => {
            showHint(element, hint, type);
        });

        applyKeyMap(
            new Map(hintToTarget.map(([hint, { element, type }]) => [
                hint,
                ({ shiftKey }) => {
                    if (type === 'anchor') {
                        // Need to click on child of 'a' to bubble up
                        simulateClick(element.firstChild, shiftKey);
                    } else {
                        simulateClick(element, shiftKey);
                    }
                    exitHintMode();
                },
            ])),
            'HINT',
            {
                caseSensitive: false,
                defaultHandler: (event) => {
                    if (event.key === 'Escape') {
                        exitHintMode();
                    }
                },
            },
        );
        hotkeys.setScope('HINT');
    };

    const getHintKeys = (numberOfHints) => {
        if (numberOfHints <= HINT_KEYS.length) {
            return HINT_KEYS.slice(0, numberOfHints);
        }
        if (numberOfHints <= HINT_KEYS.length ** 2) {
            const hintKeys = HINT_KEYS
                .flatMap(keyA => HINT_KEYS.map(keyB => [keyB, keyA]))
                .slice(0, numberOfHints);

            const prefixToHintKey = groupBy(hintKeys, ([keyB, keyA]) => keyB);
            const trimmedHintKeys = Array
                .from(prefixToHintKey.entries())
                .flatMap(([prefix, hintKeys]) => {
                    if (hintKeys.length === 1)  {
                        return [prefix];
                    }
                    return hintKeys.map(keys => keys.join(','));
                });

            return trimmedHintKeys
        }
    };

    const groupBy = (xs, keyFn) => xs.reduce(
        (groups, x) => {
            const key = keyFn(x);
            if (groups.has(key)) {
                groups.get(key).push(x);
            } else {
                groups.set(key, [x]);
            }
            return groups;
        },
        new Map()
    );
    const HINT_KEYS = [
        // home row index/middle
        'j', 'f', 'k', 'd',
        // home row
        'l', 's', 'a',
        // home row index up/down
        'u', 'r', 'v', 'm',
        // home row middle up/down
        'i', 'e', 'c',
        // home row index left/right
        'h', 'g',
        // hard
        // 'q', 'w', 't', 'y', 'o', 'p', 'z', 'x', 'b', 'n', '.', '/',
    ];

    const scrollingElement = () => {
        if (focusedPanel === 'SIDEBAR') {
            return $(SELECTOR.sidebar);
        }

        return $(SELECTOR.article).parentElement;
    };

    const SELECTOR = {
        link: '.rm-page-ref',
        block: '.roam-block',
        editingBlock: '.roam-block-input',
        highlightedBlock: '.block-highlight-blue',
        title: '.rm-title-display',
        // cmd up/down already folds
        foldCaret: '.block-expand',
        article: '.roam-article',
        sidebar: '#roam-right-sidebar-content',
        search: '#find-or-create-input',
        button: '.bp3-button',
        viewMore: '.roam-log-preview',
    };

    // $ = document.querySelector doesn't work for some reason
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);

    function detectMode() {
        if (document.querySelector(SELECTOR.highlightedBlock)) {
            return 'VISUAL';
        }

        if (document.activeElement !== document.body) {
            return 'INSERT';
        }

        return 'NORMAL';
    }

    function triggerMouseEvent(node, eventType, shiftKey) {
        const { x, y } = getScreenXY(node);
        const clickEvent = new MouseEvent(eventType, {
            shiftKey,
            bubbles: true,
            cancelable: true,
            screenX: x,
            screenY: y,
        });
        node.dispatchEvent(clickEvent);
    }

    function simulateClick(element, shiftKey) {
        triggerMouseEvent(element, "mouseover", shiftKey);
        triggerMouseEvent(element, "mousedown", shiftKey);
        triggerMouseEvent(element, "mouseup", shiftKey);
        triggerMouseEvent(element, "click", shiftKey);
        triggerMouseEvent(element, "mouseout", shiftKey);
    }

    // Scope scrolling to the focused panel
    let focusedPanel;
    let lastFocusedMainBlock;
    let lastFocusedSideBlock;

    // Change focused panel when clicking
    window.addEventListener('focus', () => {
        // Keep the previous panel focused when searching
        if($(SELECTOR.search).contains(document.activeElement)) {
            return;
        }

        if($(SELECTOR.sidebar) && $(SELECTOR.sidebar).contains(document.activeElement)) {
            focusedPanel = 'SIDEBAR';
            lastFocusedSideBlock = document.activeElement.closest('.roam-block-container');
            console.log(lastFocusedSideBlock);
        } else {
            focusedPanel = 'MAIN';
            lastFocusedMainBlock = document.activeElement.closest('.roam-block-container');
            console.log(lastFocusedMainBlock);
        }
    }, true);

    // Listen to hotkeys
    const applyKeyMap = (keyMap, scope, options) => {
        let lastKey;

        hotkeys(
            '*',
            { scope, keydown: true, keyup: false },
            (event, hotkey) => {
                const key = options.caseSensitive ? event.key : event.key.toLowerCase();
                const handler = keyMap.get(lastKey + ',' + key) || keyMap.get(key);
                lastKey = key;
                if (handler) {
                    handler(event);
                } else if (options.defaultHandler) {
                    options.defaultHandler(event, hotkey);
                }
            }
        );
    };
    applyKeyMap(KEYMAP, 'NORMAL', {
        caseSensitive: true,
        defaultHandler: (event) => {
            if (event.key === 'Escape') {
                // Blur text areas and inputs
                document.activeElement.blur();
                // Blur tooltips
                simulateClick(escapePixel, false);
            }
        },
    });
    hotkeys.filter = event => {
        if (event.key === 'Escape') {
            return true;
        }
        const tagName = event.target.tagName;
        return !(tagName.isContentEditable || tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
    };
    hotkeys.setScope('NORMAL');

    const escapePixel = document.createElement('div');
    Object.assign(escapePixel.style, {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '1px',
        height: '1px',
        backgroundColor: 'rgba(0,0,0,0.01)',
        zIndex: 999999,
    });
    const hintOverlay = document.createElement('div');
    Object.assign(hintOverlay.style, {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
        fontSize: '10px',
        fontWeight: 'bold',
        zIndex: 999999,
    });
    const waitForLoad = new MutationObserver(() => {
        if ($('.roam-app')) {
            waitForLoad.disconnect();
            document.body.appendChild(hintOverlay);
            document.body.appendChild(escapePixel);
        }
    });
    waitForLoad.observe($('#app'), {
        childList: true,
        attributes: true,
        subtree: true,
    });

    const isElementVisible = (element) => {
        if (!element) {
            return false;
        }
        const { x, y } = getScreenXY(element);
        return x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
    };

    const getScreenXY = element =>
        element.getBoundingClientRect
            ? element.getBoundingClientRect()
            : element.parentElement.getBoundingClientRect();

    const showHint = (element, hintText, type) => {
        const { x, y } = getScreenXY(element);
        const hint = document.createElement('div');
        Object.assign(hint.style, {
            position: 'absolute',
            borderRadius: '3px',
            padding: '0 3px 0 3px',
            border: '1px solid gray',
            boxShadow: '2px 2px 5px gray',
        });
        if (type === 'block' || type === 'title') {
            Object.assign(hint.style, {
                left: (x - 24) + 'px',
                top: (y + 7) + 'px',
                backgroundColor: 'lightgreen',
                zIndex: 1,
            });
        } else if (type === 'button') {
            Object.assign(hint.style, {
                left: (x) + 'px',
                top: (y) + 'px',
                backgroundColor: 'plum',
                zIndex: 2,
            });
        } else {
            Object.assign(hint.style, {
                left: (x) + 'px',
                top: (y) + 'px',
                backgroundColor: 'gold',
                zIndex: 2,
            });
        }
        hint.innerText = hintText.toUpperCase().replace(/,/g,'');
        hintOverlay.appendChild(hint);
    };

    const exitHintMode = () => {
        hintOverlay.innerHTML = '';
        hotkeys.deleteScope('HINT');
        hotkeys.setScope('NORMAL');
    };

    window.addEventListener('click', exitHintMode, true);
})();
