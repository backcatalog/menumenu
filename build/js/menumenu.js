var menumenu = (function () {
    'use strict';

    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
            var el = this;

            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    function addClasses(element, classes) {
        var elClasses = element.className.trim();
        var elClassesArray = elClasses ? elClasses.split(' ') : [];

        element.className = dedupe(classes.trim().split(' ').concat(elClassesArray)).join(' ');
    }

    function animationEndEvent() {
        var tempElement = document.createElement('spoink');

        var animationEnds = {
            'animation': 'animationend',
            'WebkitAnimation': 'webkitAnimationEnd',
            'MozAnimation': 'mozAnimationEnd',
            'OAnimation': 'oAnimationEnd',
            'msAnimation': 'MSAnimationEnd'
        };

        for (var a in animationEnds) {
            if (typeof tempElement.style[a] !== 'undefined') return animationEnds[a];
        }
    }

    function dedupe(array) {
        return array.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });
    }

    function differ(haystack, needles) {
        return haystack.filter(function (value) {
            return !needles.includes(value);
        });
    }

    function forEach(array, callback, _this) {
        for (var i = 0; i < array.length; i++) {
            callback.call(_this, array[i], i);
        }
    }

    function getParents(element, filter) {
        if (typeof filter === 'undefined') filter = '*';

        var parents = [];

        var parent = element.parentNode;

        while (parent !== document) {
            if (parent.matches(filter)) parents.push(parent);

            parent = parent.parentNode;
        }

        return parents;
    }

    function isVisible(element) {
        return !!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    function merge(object1, object2) {
        for (var prop in object2) {
            if (object2.hasOwnProperty(prop)) object1[prop] = object2[prop];
        }

        return object1;
    }

    function off(element, events, listener, options) {
        events.split(' ').forEach(function (event) {
            element.removeEventListener(event, listener, options);
        });
    }

    function on(element, events, listener, options) {
        events.split(' ').forEach(function (event) {
            element.addEventListener(event, listener, options);
        });
    }

    function removeClasses(element, classes) {
        var elClasses = element.className.trim();
        var elClassesArray = elClasses ? elClasses.split(' ') : [];

        element.className = differ(elClassesArray, classes.trim().split(' ')).join(' ');
    }

    function menumenu(menu, opts) {
        var menuItems = menu.querySelectorAll('li');
        var subMenus = menu.querySelectorAll('li > ul');
        var animationEnd = animationEndEvent();

        if (!menu || !menuItems.length || !subMenus.length) return;

        var defaults = {
            addBackLink: true,
            addDropdownToggle: true,
            classDropdownToggle: 'dropdown-toggle',
            closeOnOutsideClick: true,
            idMenu: 'menumenu',
            msgBack: 'Back'
        };

        opts = merge(defaults, opts);

        var classBackLink = 'back-link';
        var classHasChildren = 'has-children';
        var classMenuHidden = 'menu-hidden';
        var classMenuIn = 'menu-in';
        var classMenuOut = 'menu-out';
        var classSubMenu = 'sub-menu';
        var classSubMenuIn = 'sub-menu-in';
        var classSubMenuOut = 'sub-menu-out';
        var classSubMenuHidden = 'sub-menu-hidden';
        var classSubMenuShown = 'sub-menu-shown';

        if (!menu.id) menu.id = opts.idMenu;

        addClasses(menu, 'menumenu');

        forEach(menuItems, function (menuItem, index) {
            if (!menuItem.id) menuItem.id = menu.id + '-item-' + (index + 1);
        });

        forEach(subMenus, function (subMenu) {
            addClasses(subMenu, classSubMenu + ' ' + classSubMenuHidden);

            if (opts.addDropdownToggle) {
                var dropdownToggleHTML = '<span class="' + opts.classDropdownToggle + ' generated-toggle"></span>';

                subMenu.insertAdjacentHTML('beforebegin', dropdownToggleHTML);
            }

            if (opts.addBackLink) {
                var backLinkHTML = '<li class="' + classBackLink + '"><a href="#">' + opts.msgBack + '</a></li>';

                subMenu.insertAdjacentHTML('afterbegin', backLinkHTML);
            }

            var parent = subMenu.closest('li');

            subMenu.dataset.id = parent.id;

            addClasses(parent, classHasChildren);
        });

        var backLinkClicked = false;

        var dropdownToggles = menu.querySelectorAll('.' + opts.classDropdownToggle);

        forEach(dropdownToggles, function (dropdownToggle) {
            dropdownToggle.dataset.id = dropdownToggle.closest('li').id;
            dropdownToggle.dataset.depth = getParents(dropdownToggle, 'li > ul').length;

            var targetSubMenuSelector = 'ul[data-id="' + dropdownToggle.dataset.id + '"]';
            var targetSubMenu = menu.querySelector(targetSubMenuSelector);

            on(dropdownToggle, 'click', function (event) {
                event.preventDefault();

                var currentSubMenu = menu.querySelector('.' + classSubMenuShown);

                if (currentSubMenu) {
                    if (dropdownToggle.dataset.depth === '0' && backLinkClicked === false) {
                        hideSubMenu(currentSubMenu, showMenu);
                    } else {
                        hideSubMenu(currentSubMenu, function () {
                            showSubMenu(targetSubMenu);
                        });
                    }
                } else {
                    hideMenu(function () {
                        showSubMenu(targetSubMenu);
                    });
                }

                backLinkClicked = false; // Reset. Seems obvious, but I'm stupid.
            });
        });

        var backLinks = menu.querySelectorAll('.' + classBackLink);

        forEach(backLinks, function (backLink) {
            var grandparent = getParents(backLink, '#' + menu.id + ' li')[1];

            backLink.dataset.id = grandparent ? grandparent.id : 'none';

            on(backLink, 'click', function (event) {
                event.preventDefault();

                var currentSubMenu = menu.querySelector('.' + classSubMenuShown);

                if (backLink.dataset.id === 'none') {
                    hideSubMenu(currentSubMenu, showMenu);
                } else {
                    var targetDropdownToggleSelector = '.' + opts.classDropdownToggle + '[data-id="' + backLink.dataset.id + '"]';

                    backLinkClicked = true;

                    menu.querySelector(targetDropdownToggleSelector).click();
                }
            });
        });

        var showMenu = function showMenu() {
            addClasses(menu, classMenuIn);
            removeClasses(menu, classMenuHidden);
            removeClasses(menu, classMenuOut);
        };

        var hideMenu = function hideMenu(callback, _this) {
            addClasses(menu, classMenuOut);
            addClasses(menu, classMenuHidden);
            removeClasses(menu, classMenuIn);

            if (opts.closeOnOutsideClick) handleDocumentClicks(menu);

            if (typeof callback === 'function') callback.call(_this);
        };

        var showSubMenu = function showSubMenu(targetSubMenu) {
            addClasses(targetSubMenu, classSubMenuIn);

            var listener = function listener(targetSubMenu, event) {
                off(targetSubMenu, event.type, showSubMenuAnimationEnd);

                removeClasses(targetSubMenu, classSubMenuHidden);
                addClasses(targetSubMenu, classSubMenuShown);
            };

            var showSubMenuAnimationEnd = listener.bind(targetSubMenu, targetSubMenu);

            on(targetSubMenu, animationEnd, showSubMenuAnimationEnd);
        };

        var hideSubMenu = function hideSubMenu(currentSubMenu, callback, _this) {
            addClasses(currentSubMenu, classSubMenuOut);
            removeClasses(currentSubMenu, classSubMenuIn);

            var listener = function listener(currentSubMenu, callback, _this, event) {
                off(currentSubMenu, event.type, hideSubMenuAnimationEnd);

                addClasses(currentSubMenu, classSubMenuHidden);
                removeClasses(currentSubMenu, classSubMenuShown);
                removeClasses(currentSubMenu, classSubMenuOut);

                if (typeof callback === 'function') callback.call(_this);
            };

            var hideSubMenuAnimationEnd = listener.bind(currentSubMenu, currentSubMenu, callback, _this);

            on(currentSubMenu, animationEnd, hideSubMenuAnimationEnd);
        };

        var handleDocumentClicks = function handleDocumentClicks(container) {
            var listener = function listener(event) {
                if (!event.target.closest('.' + classHasChildren)) {
                    var currentSubMenu = container.querySelector('.' + classSubMenuShown);

                    if (isVisible(currentSubMenu)) {
                        off(document, 'click', listener);

                        hideSubMenu(currentSubMenu, showMenu);
                    }
                }
            };

            on(document, 'click', listener);
        };
    }

    return menumenu;

}());
