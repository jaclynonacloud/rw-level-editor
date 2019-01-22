(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Level = exports.Level = function () {
    function Level() {
        _classCallCheck(this, Level);
    }

    _createClass(Level, null, [{
        key: "load",


        /*--------------------------------------- STATIC METHODS ------------------*/
        value: function load() {
            Level._tileSize = 17;
            Level._width = 680;
            Level._height = 408;

            //load all scenes with this size
            Array.from(document.querySelectorAll(".scene__bounds")).forEach(function (el) {
                el.style.width = Level._width + "px";
                el.style.height = Level._height + "px";
            });
        }
        /*--------------------------------------- METHODS -------------------------*/
        /*--------------------------------------- EVENTS --------------------------*/
        /*--------------------------------------- OVERRIDES -----------------------*/
        /*--------------------------------------- GETTERS AND SETTERS -------------*/

    }, {
        key: "TileSize",
        get: function get() {
            return Level._tileSize;
        }
    }, {
        key: "Width",
        get: function get() {
            return Level._width;
        }
    }, {
        key: "Height",
        get: function get() {
            return Level._height;
        }
    }]);

    return Level;
}();

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Geometry = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Level = require("../Level");

var _ButtonGroup = require("../ui/ButtonGroup");

var _CrackLogic = require("./block/CrackLogic");

var _SlopeLogic = require("./block/SlopeLogic");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Geometry = exports.Geometry = function () {
    function Geometry(cursor, toolbarButtonParentElement) {
        var _Geometry$BLOCK_TYPES, _Geometry$BLOCK_TYPES2;

        _classCallCheck(this, Geometry);

        //follows the geometry.scss naming conventions
        Geometry.BLOCKS = {
            Waterfall: "waterfall",
            Solid: "solid",
            Air: "air",
            Pole: { Horizontal: "poleh", Vertical: "polev" },
            Slope: { TopLeft: "slope-tl", TopRight: "slope-tr", BottomLeft: "slope-bl", BottomRight: "slope-br" },
            Floor: "floor",
            Shortcut: "shortcut",
            ShortcutPath: "shortcut-path",
            Barrier: "solid",
            Glass: "glass",
            Crack: { Horizontal: "crack-terrainh", Vertical: "crack-terrainv", Both: "crack-terrainb"

                //set up block type groups -- only one of each type is allowed to exist in a cell -- renders in order, lower - higher
            } };Geometry.BLOCK_TYPES = {
            Full: [Geometry.BLOCKS.Solid, Geometry.BLOCKS.Air], //conflicting blocks, cannot be on same cell
            Solid: [Geometry.BLOCKS.Solid].concat(_toConsumableArray(Object.values(Geometry.BLOCKS.Slope)), [Geometry.BLOCKS.Glass, Geometry.BLOCKS.Floor], _toConsumableArray(Object.values(Geometry.BLOCKS.Crack))),
            Horizontal: [Geometry.BLOCKS.Pole.Horizontal], //used for beams that can cross-section
            Vertical: [Geometry.BLOCKS.Pole.Vertical],
            Overlay: ["shortcut-path", "shortcut"]
        };

        /* include solid block in the horizontal/vertical list as they shouldn't exist on the same plane -- ignore slopes though */
        var solidBlocks = [].concat(_toConsumableArray(Geometry.BLOCK_TYPES.Solid)).filter(function (b) {
            return Object.values(Geometry.BLOCKS.Slope).indexOf(b) == -1;
        });
        (_Geometry$BLOCK_TYPES = Geometry.BLOCK_TYPES.Horizontal).push.apply(_Geometry$BLOCK_TYPES, _toConsumableArray(solidBlocks));
        (_Geometry$BLOCK_TYPES2 = Geometry.BLOCK_TYPES.Vertical).push.apply(_Geometry$BLOCK_TYPES2, _toConsumableArray(solidBlocks));

        //load in any block logic
        _CrackLogic.CrackLogic.load(Geometry.BLOCKS.Crack.Horizontal, Geometry.BLOCKS.Crack.Vertical, Geometry.BLOCKS.Crack.Both);
        _SlopeLogic.SlopeLogic.load(Geometry.BLOCKS.Slope.TopLeft, Geometry.BLOCKS.Slope.TopRight, Geometry.BLOCKS.Slope.BottomLeft, Geometry.BLOCKS.Slope.BottomRight);

        this.cursor = cursor;
        this.toolbarButtons = new _ButtonGroup.ButtonGroup(toolbarButtonParentElement);

        this._lastCoords = { x: -1, y: -1 };

        this.currentLayer = 1;
        this.currentGeoTag = "solid";
        this.lastAssessedGeoTag = "solid"; //released when mouse up is called
        this.isDeleting = false; //flag called when action is delete

        this._isDragRect = false;
        this._startDragCoords = { x: 0, y: 0 };

        //hold layer geometry
        var geoMap = [];
        this._gridSize = this._getCoordsFromPosition(_Level.Level.Width, _Level.Level.Height);
        console.log(this._gridSize);
        for (var y = 0; y < this._gridSize.y; y++) {
            var row = [];
            for (var x = 0; x < this._gridSize.x; x++) {
                row.push(null);
            }geoMap.push(row);
        }
        this.layersGeo = [[].concat(geoMap), [].concat(geoMap), [].concat(geoMap)];
        console.log(this.layersGeo);

        //listen to component events
        this.cursor.CursorElement.addEventListener("cursor-click", this._onCursorClick.bind(this));
        this.cursor.CursorElement.addEventListener("cursor-drag", this._onCursorDrag.bind(this));
        this.cursor.CursorElement.addEventListener("cursor-right-click", this._onCursorRightClick.bind(this));
        this.cursor.CursorElement.addEventListener("cursor-right-drag", this._onCursorRightDrag.bind(this));
        this.toolbarButtons.ParentElement.addEventListener("button-click", this._onToolbarButtonClick.bind(this));
    }

    /*--------------------------------------- STATIC METHODS ------------------*/
    /*--------------------------------------- METHODS -------------------------*/


    _createClass(Geometry, [{
        key: "listen",
        value: function listen() {
            //listen to cursor
            this.cursor.listen();

            console.log("TYPES", Geometry.BLOCK_TYPES.Solid);
        }
    }, {
        key: "unlisten",
        value: function unlisten() {
            //stop listen to cursor
            this.cursor.unlisten();
        }
    }, {
        key: "_setBlock",
        value: function _setBlock(coords) {
            var removeDup = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;


            var layerGeo = this.layersGeo[this.currentLayer - 1];

            //see if we have a geoDiv in this coordinate
            //if our tag is CLEAR, remove all children from this position
            if (this.currentGeoTag == "clear") {
                Array.from(geoContainer.children).forEach(function (el) {
                    return el.remove();
                });
                this._lastCoords = coords;
                return;
            }

            //PRE PROCESSING
            //process block type by category

            var geoDiv = layerGeo[coords.y][coords.x];

            switch (this.lastAssessedGeoTag) {
                case Geometry.BLOCKS.Slope.TopLeft:
                case Geometry.BLOCKS.Slope.TopRight:
                case Geometry.BLOCKS.Slope.BottomLeft:
                case Geometry.BLOCKS.Slope.BottomRight:
                    //if this is a new coord, reassess slope
                    if (coords.x != this._lastCoords.x || coords.y != this._lastCoords.y) {
                        _SlopeLogic.SlopeLogic.slopeTerrain(layerGeo, coords.x, coords.y, Geometry.BLOCK_TYPES.Solid);
                        this.currentGeoTag = _SlopeLogic.SlopeLogic.CurrentSlopeTag;
                        this._assessBlock(layerGeo, geoDiv, coords.x, coords.y);
                    } else {
                        _SlopeLogic.SlopeLogic.next();
                        var wantedGeoTag = _SlopeLogic.SlopeLogic.CurrentSlopeTag;
                        if (wantedGeoTag == "") {
                            this._removeTerrainBlock(this.currentGeoTag, geoDiv);
                        } else {
                            this._makeTerrainBlock(layerGeo, wantedGeoTag, coords.x, coords.y);
                            this.currentGeoTag = wantedGeoTag;
                        }
                    }
                    break;

                default:
                    {
                        this._assessBlock(layerGeo, geoDiv, coords.x, coords.y);
                    }
            }

            this._lastCoords = coords;
        }

        /**Try to add the block, or remove if deletion flag is set. */

    }, {
        key: "_assessBlock",
        value: function _assessBlock(layerGeo, geoDiv, x, y) {
            //if our delete flag is on, try to remove the blocks, or don't make them
            if (this.isDeleting) this._removeTerrainBlock(this.currentGeoTag, geoDiv);
            //otherwise, make the block
            else this._makeTerrainBlock(layerGeo, this.currentGeoTag, x, y);
        }

        /**Returns the coordinates from the given position, using the tile size of 17. */

    }, {
        key: "_getCoordsFromPosition",
        value: function _getCoordsFromPosition(x, y) {
            return { x: Math.floor(x / _Level.Level.TileSize), y: Math.floor(y / _Level.Level.TileSize) };
        }

        /**Makes a terrain block. If one already exists on this cell, this will return false. */

    }, {
        key: "_makeTerrainBlock",
        value: function _makeTerrainBlock(arr, type, x, y) {
            var _this = this;

            var allowSwapping = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

            if (type == "") return;

            //get the cell, or create one if none exists
            var cell = this._getTerrainContainer(arr, x, y);
            var alreadyExists = Array.from(arr[y][x].children).some(function (el) {
                return el.classList.contains(type);
            });
            //test type against cell, and remove any overlap
            //look for type in lookup
            var types = Geometry.BLOCK_TYPES;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Object.keys(types)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    if (types[key].indexOf(type) != -1) {
                        //remove any blocks that contain that key within the type
                        types[key].filter(function (t) {
                            return t !== type;
                        }).forEach(function (t) {
                            return _this._removeTerrainBlock(t, cell);
                        });
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (alreadyExists) {
                //did not build terrain block
                return false;
            } else {
                //create block type
                var geoDiv = document.createElement("div");
                geoDiv.classList.add(type, "geometry", "tile");
                geoDiv.style.position = "absolute";
                geoDiv.style.left = x * _Level.Level.TileSize + "px";
                geoDiv.style.top = y * _Level.Level.TileSize + "px";
                geoDiv.draggable = false;
                //attach to el
                cell.appendChild(geoDiv);

                //sort the children by their hierarchy in the block types
                var sortedDiv = [].concat(_toConsumableArray(Array.from(cell.children).sort(function (a, b) {
                    //get the names
                    var typeA = a.classList[0];
                    var typeB = b.classList[0];
                    //test their last position in the block types
                    var blocks = Object.values(Geometry.BLOCK_TYPES);
                    var posA = Math.max.apply(Math, _toConsumableArray(blocks.map(function (gr, i) {
                        return gr.indexOf(typeA) != -1 ? i : -1;
                    })));
                    var posB = Math.max.apply(Math, _toConsumableArray(blocks.map(function (gr, i) {
                        return gr.indexOf(typeB) != -1 ? i : -1;
                    })));

                    return posA > posB ? 1 : -1;
                })));

                //re-add children in order
                sortedDiv.forEach(function (ch) {
                    return cell.appendChild(ch);
                });

                return true;
            }
        }
    }, {
        key: "_removeTerrainBlock",
        value: function _removeTerrainBlock(type, cell) {
            if (cell == null) return;
            //look for type
            var geoDiv = Array.from(cell.children).find(function (el) {
                return el.classList.contains(type);
            });
            if (geoDiv != null) geoDiv.remove();
        }
    }, {
        key: "_getTerrainContainer",
        value: function _getTerrainContainer(arr, x, y) {
            if (arr[y][x] != null) return arr[y][x];

            //place an object for test
            var div = document.createElement("div");
            //TODO put on proper layer
            this.cursor.CursorElement.parentElement.querySelector(".layer").appendChild(div);
            arr[y][x] = div;
            return div;
        }

        // _testTerrainBlock(arr, x, y, changeAdjs = true) {
        //     if(x < 0 || x >= arr[0].length || y < 0 || y >= arr.length) return;
        //     if(arr[y][x] == null) return;

        //     //get our terrain block
        //     const terrainBlock = Array.from(arr[y][x].children).find(ch => (ch.classList.contains(Geometry.BLOCKS.Crack.Vertical) || ch.classList.contains(Geometry.BLOCKS.Crack.Horizontal) || ch.classList.contains(Geometry.BLOCKS.Crack.Both)) );
        //     if(terrainBlock != null) {
        //         //test the surrounding
        //         const { left, right, top, bottom } = this._testAdjacentTerrains(arr, x, y);
        //         // console.log(left, right, top, bottom);

        //         if(changeAdjs) {
        //             if(top != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Vertical, x, y-1);
        //             if(bottom != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Vertical, x, y+1);
        //         }

        //         // if(changeAdjs) {
        //         //     if(top != null) this._setTerrainBlock(top, "crack-terrainv");
        //         //     if(bottom != null) this._setTerrainBlock(bottom, "crack-terrainv");
        //         // }

        //         //set ourselves
        //         // if((top != null || bottom != null) && (left != null || right != null)) this._setTerrainBlock(terrainBlock, "crack-terrainb");
        //     }

        // }

    }, {
        key: "_testTerrainBlock",
        value: function _testTerrainBlock(arr, x, y) {
            var changeAdjs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

            if (x < 0 || x >= arr[0].length || y < 0 || y >= arr.length) return;
            if (arr[y][x] == null) return;

            //get our terrain block
            var terrainBlock = Array.from(arr[y][x].children).find(function (ch) {
                return ch.classList.contains(Geometry.BLOCKS.Crack.Vertical) || ch.classList.contains(Geometry.BLOCKS.Crack.Horizontal) || ch.classList.contains(Geometry.BLOCKS.Crack.Both);
            });
            if (terrainBlock != null) {
                //test the surrounding
                var _testAdjacentTerrains2 = this._testAdjacentTerrains(arr, x, y),
                    left = _testAdjacentTerrains2.left,
                    right = _testAdjacentTerrains2.right,
                    top = _testAdjacentTerrains2.top,
                    bottom = _testAdjacentTerrains2.bottom;
                // console.log(left, right, top, bottom);

                if (changeAdjs) {
                    if (top != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Vertical, x, y - 1);
                    if (bottom != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Vertical, x, y + 1);
                    if (left != null && (top != null || bottom != null)) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Both, x - 1, y);else if (left != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Horizontal, x - 1, y);
                    if (right != null && (top != null || bottom != null)) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Both, x + 1, y);else if (right != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Horizontal, x + 1, y);
                }

                // if(changeAdjs) {
                //     if(top != null) this._setTerrainBlock(top, "crack-terrainv");
                //     if(bottom != null) this._setTerrainBlock(bottom, "crack-terrainv");
                // }

                //set ourselves
                if ((top != null || bottom != null) && (left != null || right != null)) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Both, x, y);
            }
        }

        /**Returns the terrain name if it finds one */

    }, {
        key: "_lookForTerrainType",
        value: function _lookForTerrainType(cell) {
            for (var _len = arguments.length, type = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                type[_key - 1] = arguments[_key];
            }

            for (var i = 0; i < type.length; i++) {
                var children = Array.from(cell.children);
                for (var n = 0; n < children.length; n++) {
                    if (children[n].classList.contains(type[i])) return type[i];
                }
            }
            return "";
        }
    }, {
        key: "_testAdjacentTerrains",
        value: function _testAdjacentTerrains(arr, x, y) {
            var currBlockDiv = arr[y][x];
            var terrainBlocks = { left: null, right: null, top: null, bottom: null };

            //test left
            if (x - 1 >= 0) {
                var block = arr[y][x - 1];
                terrainBlocks.left = this._getTerrainBlock(block);
            }
            //test right
            if (x + 1 < arr[0].length) {
                var _block = arr[y][x + 1];
                terrainBlocks.right = this._getTerrainBlock(_block);
            }
            //test top
            if (y - 1 >= 0) {
                var _block2 = arr[y - 1][x];
                terrainBlocks.top = this._getTerrainBlock(_block2);
            }
            //test bottom
            if (y + 1 < arr.length) {
                var _block3 = arr[y + 1][x];
                terrainBlocks.bottom = this._getTerrainBlock(_block3);
            }
            return terrainBlocks;
        }
    }, {
        key: "_getTerrainBlock",
        value: function _getTerrainBlock(block) {
            if (block == null) return null;
            return Array.from(block.children).find(function (ch) {
                return ch.classList.contains('crack-terrainh') || ch.classList.contains('crack-terrainv') || ch.classList.contains('crack-terrainb');
            });
        }
    }, {
        key: "_setTerrainBlock",
        value: function _setTerrainBlock(block, type) {
            if (block == null) return;
            //remove old classlists
            console.log(block);
            block.className = "geometry";
            console.log(block);
            //give new class
            block.classList.add(type);
        }

        /*--------------------------------------- EVENTS --------------------------*/

    }, {
        key: "_onCursorClick",
        value: function _onCursorClick(e) {
            this._isDragRect = false;
            // console.log(e);
            var position = e.detail;

            //set the deletion flag by seeing if this type of terrain exists on this block position already
            var coords = this._getCoordsFromPosition(position.x, position.y);
            var cell = this.layersGeo[this.currentLayer][coords.y][coords.x];
            if (cell == null) this.isDeleting = false;else {
                var t = this._lookForTerrainType(cell, this.currentGeoTag);
                this.isDeleting = t == this.currentGeoTag;
            }

            this._setBlock(coords);
        }
    }, {
        key: "_onCursorDrag",
        value: function _onCursorDrag(e) {
            if (this._isDragRect) return;

            var position = e.detail;
            //get coord
            var coords = this._getCoordsFromPosition(position.x, position.y);
            //if coord is same as last coord, don't do anything
            if (coords.x == this._lastCoords.x && coords.y == this._lastCoords.y) return;
            this._setBlock(coords, false);
        }
        //handles building rect of selection

    }, {
        key: "_onCursorRightClick",
        value: function _onCursorRightClick(e) {
            this._isDragRect = true;
            var position = e.detail;
            //get coord
            var coords = this._getCoordsFromPosition(position.x, position.y);
            this._startDragCoords = coords;
        }
    }, {
        key: "_onCursorRightDrag",
        value: function _onCursorRightDrag(e) {
            console.log("LOOK AT ME");
            var position = e.detail;
            //get coord
            var coords = this._getCoordsFromPosition(position.x, position.y);

            for (var y = this._startDragCoords.y; y < coords.y; y++) {
                for (var x = this._startDragCoords.x; x < coords.x; x++) {
                    this._setBlock({ x: x, y: y }, false);
                }
            }
        }
    }, {
        key: "_onToolbarButtonClick",
        value: function _onToolbarButtonClick(e) {
            var value = e.detail;
            console.log(value);

            switch (value) {
                case "slope":
                    //handle slope renaming
                    this.currentGeoTag = Geometry.BLOCKS.Slope.TopLeft;
                    break;
                case "tunnel":
                    //handle tunnel renaming
                    this.currentGeoTag = Geometry.BLOCKS.Crack.Horizontal;
                    break;
                case "shortcut":
                    //handle shortcut entrance
                    this.currentGeoTag = value;
                    break;
                default:
                    this.currentGeoTag = value;
            }

            this.lastAssessedGeoTag = this.currentGeoTag;
        }
        /*--------------------------------------- OVERRIDES -----------------------*/
        /*--------------------------------------- GETTERS AND SETTERS -------------*/

    }]);

    return Geometry;
}();

},{"../Level":1,"../ui/ButtonGroup":6,"./block/CrackLogic":3,"./block/SlopeLogic":4}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**A class to handle manipulating crack terrain data from the geometry class. */
var CrackLogic = exports.CrackLogic = function () {
    function CrackLogic() {
        _classCallCheck(this, CrackLogic);
    }

    _createClass(CrackLogic, null, [{
        key: "load",
        value: function load(hTag, vTag, bTag) {
            CrackLogic.hTag = hTag;
            CrackLogic.vTag = vTag;
            CrackLogic.bTag = bTag;
        }

        /**
         * Returns an array with desired block tags.
         * @param {*} arr 
         * @param {number} x 
         * @param {number} y 
         * @returns An array with desired block tags - {self:string, left:string, right:string, top:string, bottom:string}.
         */

    }, {
        key: "crackTerrain",
        value: function crackTerrain(arr, x, y) {
            //find all of our cracked terrain
            // console.log("RAW", arr);
            var crackedTerrain = CrackLogic._getCrackMap(arr);
            crackedTerrain[y][x] = true; //set our block as true as well

            console.log("TERRAIN CRACK", crackedTerrain);

            var desiredCracks = { self: null, left: null, right: null, top: null, bottom: null };
            //request types for each corner/self
            desiredCracks.left = this._findDesiredCrack(crackedTerrain, x - 1, y);
            desiredCracks.right = this._findDesiredCrack(crackedTerrain, x + 1, y);
            desiredCracks.top = this._findDesiredCrack(crackedTerrain, x, y - 1);
            desiredCracks.bottom = this._findDesiredCrack(crackedTerrain, x, y + 1);
            desiredCracks.self = this._findDesiredCrack(crackedTerrain, x, y);

            return desiredCracks;
        }
    }, {
        key: "_findDesiredCrack",
        value: function _findDesiredCrack(crackArr, x, y) {
            //see if we can even change this crack
            if (x < 0 || x > crackArr[0].length - 1) return "";
            if (y < 0 || y > crackArr.length - 1) return "";
            if (!crackArr[y][x]) return "";

            var desiredCrack = "";
            var sides = { left: false, right: false, top: false, bottom: false };
            //set left
            if (x - 1 >= 0) if (crackArr[y][x - 1]) sides.left = true;
            //set right
            if (x + 1 > crackArr[0].length - 1) if (crackArr[y][x + 1]) sides.right = true;
            //set top
            if (y - 1 >= 0) if (crackArr[y - 1][x]) sides.top = true;
            //set bottom
            if (y + 1 > crackArr.length - 1) if (crackArr[y + 1][x]) sides.bottom = true;

            //test hor/ver
            desiredCrack = sides.top || sides.bottom ? CrackLogic.vTag : CrackLogic.hTag;
            //test both
            if ((sides.top || sides.bottom) && (sides.left || sides.right)) desiredCrack = CrackLogic.bTag;

            return desiredCrack;
        }

        /**Returns a map of true/false values depending on whether that cell has a cracked terrain block. */

    }, {
        key: "_getCrackMap",
        value: function _getCrackMap(arr) {
            return arr.map(function (row) {
                if (row == null) return false;

                return row.map(function (el) {
                    if (el == null) return false;
                    var children = Array.from(el.children);

                    return children.some(function (div) {
                        if (div.children == null) return false;

                        return div.classList.contains(CrackLogic.hTag) || div.classList.contains(CrackLogic.vTag) || div.classList.contains(CrackLogic.bTag);
                    });
                });
            });
        }
    }]);

    return CrackLogic;
}();

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**A class to handle manipulating slope terrain data from the geometry class. */
var SlopeLogic = exports.SlopeLogic = function () {
        function SlopeLogic() {
                _classCallCheck(this, SlopeLogic);
        }

        _createClass(SlopeLogic, null, [{
                key: "load",
                value: function load(tLTag, tRTag, bLTag, bRTag) {
                        SlopeLogic.tLTag = tLTag;
                        SlopeLogic.tRTag = tRTag;
                        SlopeLogic.bLTag = bLTag;
                        SlopeLogic.bRTag = bRTag;

                        SlopeLogic._layerArray = null;
                        SlopeLogic._slopeIndex = 0;
                        SlopeLogic._slopes = [];
                }
        }, {
                key: "slopeTerrain",
                value: function slopeTerrain(arr, x, y, solidBlockTypes) {

                        //remove our slopes from the solid block types
                        solidBlockTypes = solidBlockTypes.filter(function (t) {
                                return t != SlopeLogic.tLTag && t != SlopeLogic.tRTag && t != SlopeLogic.bLTag && t != SlopeLogic.bRTag;
                        });

                        // if(SlopeLogic._slopes.length > 0) return SlopeLogic;

                        SlopeLogic.reset();
                        SlopeLogic._layerArray = arr;

                        //if this block is solid, ignore
                        if (this._isSolidBlock(arr, x, y, solidBlockTypes)) return SlopeLogic;

                        var surroundingBlocks = { left: null, right: null, top: null, bottom: null };

                        //request types for each corner/self
                        surroundingBlocks.left = this._isSolidBlock(arr, x - 1, y, solidBlockTypes);
                        surroundingBlocks.right = this._isSolidBlock(arr, x + 1, y, solidBlockTypes);
                        surroundingBlocks.top = this._isSolidBlock(arr, x, y - 1, solidBlockTypes);
                        surroundingBlocks.bottom = this._isSolidBlock(arr, x, y + 1, solidBlockTypes);

                        var left = surroundingBlocks.left,
                            right = surroundingBlocks.right,
                            top = surroundingBlocks.top,
                            bottom = surroundingBlocks.bottom;


                        console.log("SURROUNDING:", surroundingBlocks);

                        //compare edges
                        if (top && left) SlopeLogic._slopes.push(SlopeLogic.tLTag);
                        if (top && right) SlopeLogic._slopes.push(SlopeLogic.tRTag);
                        if (bottom && left) SlopeLogic._slopes.push(SlopeLogic.bLTag);
                        if (bottom && right) SlopeLogic._slopes.push(SlopeLogic.bRTag);

                        if (left && right) SlopeLogic._slopes = [];

                        console.log("MY SLOPES", SlopeLogic._slopes);

                        return SlopeLogic;
                }

                /**Get the next possible slope for this block.*/

        }, {
                key: "next",
                value: function next() {
                        SlopeLogic._slopeIndex++;
                        if (SlopeLogic._slopeIndex > SlopeLogic._slopes.length) SlopeLogic._slopeIndex = 0;
                        return SlopeLogic;
                }
        }, {
                key: "reset",
                value: function reset() {
                        SlopeLogic._slopes = [];
                        SlopeLogic._slopeIndex = 0;
                }
        }, {
                key: "_isSolidBlock",
                value: function _isSolidBlock(arr, x, y, solidBlockTypes) {
                        //see if we can even change this crack
                        if (x < 0 || x > arr[0].length - 1) return false;
                        if (y < 0 || y > arr.length - 1) return false;
                        if (!arr[y][x]) return false;

                        var block = arr[y][x];
                        var children = Array.from(block.children);
                        if (children == null) return false;
                        return children.some(function (ch) {
                                for (var i = 0; i < solidBlockTypes.length; i++) {
                                        if (ch.classList.contains(solidBlockTypes[i])) return true;
                                }
                        });
                }
        }, {
                key: "CurrentSlopeTag",
                get: function get() {
                        return SlopeLogic._slopes.length <= 0 || SlopeLogic._slopeIndex == SlopeLogic._slopes.length ? "" : SlopeLogic._slopes[SlopeLogic._slopeIndex];
                }
        }]);

        return SlopeLogic;
}();

},{}],5:[function(require,module,exports){
"use strict";

var _ButtonToggle = require("./ui/ButtonToggle");

var _Cursor = require("./ui/Cursor");

var _Geometry = require("./logic/Geometry");

var _Level = require("./Level");

/*--------------------------------------- STATIC METHODS ------------------*/
function main() {
    console.log("STARTED");
    //load components
    _ButtonToggle.ButtonToggle.load();
    _Cursor.Cursor.load();

    console.log(_Cursor.Cursor.Cursors);

    //load level
    _Level.Level.load();

    //load envs
    new _Geometry.Geometry(_Cursor.Cursor.Cursors['geometry-cursor'], document.querySelector(".toolbar.geometry")).listen();

    document.body.draggable = false;
    document.oncontextmenu = function (e) {
        return false;
    };
}

/*--------------------------------------- METHODS -------------------------*/
/*--------------------------------------- EVENTS --------------------------*/
/*--------------------------------------- OVERRIDES -----------------------*/
/*--------------------------------------- GETTERS AND SETTERS -------------*/

main();

},{"./Level":1,"./logic/Geometry":2,"./ui/ButtonToggle":7,"./ui/Cursor":8}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ButtonGroup = exports.ButtonGroup = function () {
    function ButtonGroup(parentElement) {
        _classCallCheck(this, ButtonGroup);

        this._parentElement = parentElement;
        //find all the buttons within the parent element
        this.buttons = Array.from(parentElement.querySelectorAll("button"));
        console.log("BUTTONS", this.buttons);

        this.selectable = true;
        this.currentSelected = this.buttons[0];

        //listen to all the buttons for a click
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].onclick = this._onButtonClicked.bind(this);
        }
    }
    /*--------------------------------------- STATIC METHODS ------------------*/
    /*--------------------------------------- METHODS -------------------------*/
    /*--------------------------------------- EVENTS --------------------------*/


    _createClass(ButtonGroup, [{
        key: "_onButtonClicked",
        value: function _onButtonClicked(e) {
            console.log("CALLED");
            if (this.selectable) {
                //test against current if selectable
                if (this.currentSelected != e.target) {
                    //change selected
                    this.currentSelected.classList.remove("selected");
                    this.currentSelected = e.target;
                    this.currentSelected.classList.add("selected");
                }
            }

            //look for a data value
            if (e.target.dataset.value != null) {
                var clickEvent = new CustomEvent("button-click", { detail: e.target.dataset.value });
                this._parentElement.dispatchEvent(clickEvent);
            }
        }
        /*--------------------------------------- OVERRIDES -----------------------*/
        /*--------------------------------------- GETTERS AND SETTERS -------------*/

    }, {
        key: "ParentElement",
        get: function get() {
            return this._parentElement;
        }
    }]);

    return ButtonGroup;
}();

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ButtonToggle = exports.ButtonToggle = function () {
    function ButtonToggle() {
        _classCallCheck(this, ButtonToggle);
    }

    _createClass(ButtonToggle, null, [{
        key: "load",

        /*--------------------------------------- STATIC METHODS ------------------*/
        value: function load() {
            console.log("LOADED BUTTONS");
            var toggles = document.querySelectorAll("[data-toggle]");
            console.log(toggles);

            var _loop = function _loop(i) {
                var el = toggles[i];
                //set to false
                if (el.dataset.toggle == null) el.dataset.toggle = false;

                //listen to click
                el.onclick = function (e) {
                    console.log(e.target);
                    var isOn = el.dataset.toggle != null ? el.dataset.toggle == "true" : false;
                    el.dataset.toggle = !isOn;
                };
            };

            for (var i = 0; i < toggles.length; i++) {
                _loop(i);
            }
        }

        /*--------------------------------------- METHODS -------------------------*/
        /*--------------------------------------- EVENTS --------------------------*/
        /*--------------------------------------- OVERRIDES -----------------------*/
        /*--------------------------------------- GETTERS AND SETTERS -------------*/

    }]);

    return ButtonToggle;
}();

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cursor = exports.Cursor = function () {
    function Cursor() {
        _classCallCheck(this, Cursor);
    }

    _createClass(Cursor, null, [{
        key: "load",

        /*--------------------------------------- STATIC METHODS ------------------*/
        value: function load() {
            Cursor._cursors = {};
            Cursor._lastMousePos = { x: 0, y: 0 };
            Cursor._mouseButton = 0;

            var cursors = document.querySelectorAll("[data-cursor]");
            console.log(cursors);
            for (var i = 0; i < cursors.length; i++) {
                var el = cursors[i];
                //create cursor logic
                Cursor._cursors[el.dataset.cursorname] = new CursorLogic(el);
            }
        }

        /*--------------------------------------- METHODS -------------------------*/
        /*--------------------------------------- EVENTS --------------------------*/
        /*--------------------------------------- OVERRIDES -----------------------*/
        /*--------------------------------------- GETTERS AND SETTERS -------------*/

    }, {
        key: "Cursors",
        get: function get() {
            return Cursor._cursors;
        }
    }]);

    return Cursor;
}();

var CursorLogic = function () {
    function CursorLogic(cursorElement) {
        _classCallCheck(this, CursorLogic);

        this.cursorElement = cursorElement;
        this.cursorBoundsElement = cursorElement.closest("[data-cursor-bounds]");

        this._cursorMoveEvent = this._onCursorMove.bind(this);
        this._cursorClickEvent = this._onCursorClick.bind(this);
        this._cursorReleaseEvent = this._onCursorRelease.bind(this);

        this._position = { x: 0, y: 0 };
        this._isClicked = false;
    }

    /*--------------------------------------- METHODS -------------------------*/


    _createClass(CursorLogic, [{
        key: "listen",
        value: function listen() {

            //listen for cursor movement
            this.cursorBoundsElement.addEventListener("mousemove", this._cursorMoveEvent);
            this.cursorBoundsElement.addEventListener("mousedown", this._cursorClickEvent);
            this.cursorBoundsElement.addEventListener("mouseup", this._cursorReleaseEvent);
        }
    }, {
        key: "unlisten",
        value: function unlisten() {
            //stop listen for cursor movement
            this.cursorBoundsElement.removeEventListener("mousemove", this._cursorMoveEvent);
            this.cursorBoundsElement.removeEventListener("mousedown", this._cursorClickEvent);
            this.cursorBoundsElement.removeEventListener("mouseup", this._cursorReleaseEvent);
        }

        /**Returns a value for the grid. */

    }, {
        key: "_getClosest",
        value: function _getClosest(val) {
            return Math.floor(val / 17) * 17;
        }
        /*--------------------------------------- EVENTS --------------------------*/

    }, {
        key: "_onCursorMove",
        value: function _onCursorMove(e) {
            this._position = { x: this._getClosest(e.clientX - this.cursorBoundsElement.offsetLeft), y: this._getClosest(e.clientY - this.cursorBoundsElement.offsetTop) };
            // console.log("MOVE", this._position);
            // console.log(this.cursorElement);
            //move cursor
            this.cursorElement.style.left = this._position.x + "px";
            this.cursorElement.style.top = this._position.y + "px";

            // const dist = (Math.abs(this._position.x - Cursor._lastMousePos.x) + Math.abs(this._position.y - Cursor._lastMousePos.y)) / 2;
            // console.log("DIST", dist);
            if (this._isClicked) {
                var dragEvent = new CustomEvent("cursor-drag", { 'detail': this._position });
                this.cursorElement.dispatchEvent(dragEvent);

                //right click
                if (Cursor._mouseButton == 2) {
                    console.log("YE");
                    dragEvent = new CustomEvent("cursor-right-drag", { 'detail': this._position });
                    this.cursorElement.dispatchEvent(dragEvent);
                }
            }
        }
    }, {
        key: "_onCursorClick",
        value: function _onCursorClick(e) {
            Cursor._mouseButton = e.button;

            this._onCursorMove(e);

            this._isClicked = true;

            Cursor._lastMousePos = { x: this._getClosest(e.clientX - this.cursorBoundsElement.offsetLeft), y: this._getClosest(e.clientY - this.cursorBoundsElement.offsetTop) };

            var clickEvent = new CustomEvent("cursor-click", { 'detail': this._position });
            this.cursorElement.dispatchEvent(clickEvent);

            //right click
            if (e.button == 2) {
                e.preventDefault();
                e.stopPropagation();
                clickEvent = new CustomEvent("cursor-right-click", { 'detail': this._position });
                this.cursorElement.dispatchEvent(clickEvent);
            }
        }
    }, {
        key: "_onCursorRelease",
        value: function _onCursorRelease(e) {
            this._isClicked = false;
        }
        /*--------------------------------------- OVERRIDES -----------------------*/
        /*--------------------------------------- GETTERS AND SETTERS -------------*/

    }, {
        key: "CursorElement",
        get: function get() {
            return this.cursorElement;
        }
    }, {
        key: "Position",
        get: function get() {
            return this._position;
        }
    }]);

    return CursorLogic;
}();

},{}]},{},[5])

//# sourceMappingURL=main.js.map
