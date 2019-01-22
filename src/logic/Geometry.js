import { Level } from "../Level";
import { ButtonGroup } from "../ui/ButtonGroup";
import { CrackLogic } from "./block/CrackLogic";
import { SlopeLogic } from "./block/SlopeLogic";

export class Geometry {
    constructor(cursor, toolbarButtonParentElement) {

        //follows the geometry.scss naming conventions
        Geometry.BLOCKS = {
            Waterfall : "waterfall",
            Solid : "solid",
            Air : "air",
            Pole : {Horizontal:"poleh", Vertical:"polev"},
            Slope : {TopLeft:"slope-tl", TopRight:"slope-tr", BottomLeft:"slope-bl", BottomRight:"slope-br"},
            Floor : "floor",
            Shortcut : "shortcut",
            ShortcutPath : "shortcut-path",
            Barrier : "solid",
            Glass : "glass",
            Crack : {Horizontal:"crack-terrainh", Vertical:"crack-terrainv", Both:"crack-terrainb"}
        }

        //set up block type groups -- only one of each type is allowed to exist in a cell -- renders in order, lower - higher
        Geometry.BLOCK_TYPES = {
            Full : [Geometry.BLOCKS.Solid, Geometry.BLOCKS.Air], //conflicting blocks, cannot be on same cell
            Solid : [Geometry.BLOCKS.Solid, ...Object.values(Geometry.BLOCKS.Slope), Geometry.BLOCKS.Glass, Geometry.BLOCKS.Floor, ...Object.values(Geometry.BLOCKS.Crack)],
            Horizontal : [Geometry.BLOCKS.Pole.Horizontal], //used for beams that can cross-section
            Vertical : [Geometry.BLOCKS.Pole.Vertical],
            Overlay : ["shortcut-path", "shortcut"]
        };

        /* include solid block in the horizontal/vertical list as they shouldn't exist on the same plane -- ignore slopes though */
        const solidBlocks = [...Geometry.BLOCK_TYPES.Solid].filter(b => Object.values(Geometry.BLOCKS.Slope).indexOf(b) == -1);
        Geometry.BLOCK_TYPES.Horizontal.push(...solidBlocks);
        Geometry.BLOCK_TYPES.Vertical.push(...solidBlocks);

        //load in any block logic
        CrackLogic.load(Geometry.BLOCKS.Crack.Horizontal, Geometry.BLOCKS.Crack.Vertical, Geometry.BLOCKS.Crack.Both);
        SlopeLogic.load(Geometry.BLOCKS.Slope.TopLeft, Geometry.BLOCKS.Slope.TopRight, Geometry.BLOCKS.Slope.BottomLeft, Geometry.BLOCKS.Slope.BottomRight);
        

        this.cursor = cursor;
        this.toolbarButtons = new ButtonGroup(toolbarButtonParentElement);

        this._lastCoords = {x:-1, y:-1};

        this.currentLayer = 1;
        this.currentGeoTag = "solid";
        this.lastAssessedGeoTag = "solid"; //released when mouse up is called
        this.isDeleting = false; //flag called when action is delete

        this._isDragRect = false;
        this._startDragCoords = {x:0, y:0};

        //hold layer geometry
        let geoMap = [];
        this._gridSize = this._getCoordsFromPosition(Level.Width, Level.Height);
        console.log(this._gridSize);
        for(let y = 0; y < this._gridSize.y; y++) {
            let row = [];
            for(let x = 0; x < this._gridSize.x; x++)
                row.push(null);
            geoMap.push(row);
        }
        this.layersGeo = [[...geoMap],[...geoMap],[...geoMap]];
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
    listen() {
        //listen to cursor
        this.cursor.listen();

        console.log("TYPES", Geometry.BLOCK_TYPES.Solid);
    }

    unlisten() {
        //stop listen to cursor
        this.cursor.unlisten();
    }

    _setBlock(coords, removeDup = true) {

        const layerGeo = this.layersGeo[this.currentLayer-1];


        //see if we have a geoDiv in this coordinate
        //if our tag is CLEAR, remove all children from this position
        if(this.currentGeoTag == "clear") {
            Array.from(geoContainer.children).forEach(el => el.remove());
            this._lastCoords = coords;
            return;
        }
        

        //PRE PROCESSING
        //process block type by category

        const geoDiv = layerGeo[coords.y][coords.x];


        switch(this.lastAssessedGeoTag) {
            case Geometry.BLOCKS.Slope.TopLeft:
            case Geometry.BLOCKS.Slope.TopRight:
            case Geometry.BLOCKS.Slope.BottomLeft:
            case Geometry.BLOCKS.Slope.BottomRight:
                //if this is a new coord, reassess slope
                if(coords.x != this._lastCoords.x || coords.y != this._lastCoords.y) {
                    SlopeLogic.slopeTerrain(layerGeo, coords.x, coords.y, Geometry.BLOCK_TYPES.Solid);
                    this.currentGeoTag = SlopeLogic.CurrentSlopeTag;
                    this._assessBlock(layerGeo, geoDiv, coords.x, coords.y);
                }
                else {
                    SlopeLogic.next();
                    const wantedGeoTag = SlopeLogic.CurrentSlopeTag;
                    if(wantedGeoTag == "") {
                        this._removeTerrainBlock(this.currentGeoTag, geoDiv);
                    }
                    else {
                        this._makeTerrainBlock(layerGeo, wantedGeoTag, coords.x, coords.y);
                        this.currentGeoTag = wantedGeoTag;
                    }
                }
                break;

            default: {
                this._assessBlock(layerGeo, geoDiv, coords.x, coords.y);
            }
        }

        this._lastCoords = coords;           

            
    }

    /**Try to add the block, or remove if deletion flag is set. */
    _assessBlock(layerGeo, geoDiv, x, y) {
        //if our delete flag is on, try to remove the blocks, or don't make them
        if(this.isDeleting) this._removeTerrainBlock(this.currentGeoTag, geoDiv);
        //otherwise, make the block
        else this._makeTerrainBlock(layerGeo, this.currentGeoTag, x, y);
    }


    /**Returns the coordinates from the given position, using the tile size of 17. */
    _getCoordsFromPosition(x, y) {
        return {x:Math.floor(x/Level.TileSize), y:Math.floor(y/Level.TileSize)};
    }


    /**Makes a terrain block. If one already exists on this cell, this will return false. */
    _makeTerrainBlock(arr, type, x, y, allowSwapping = true) {
        if(type == "") return;

        //get the cell, or create one if none exists
        const cell = this._getTerrainContainer(arr, x, y);
        const alreadyExists = Array.from(arr[y][x].children).some(el => el.classList.contains(type));
        //test type against cell, and remove any overlap
        //look for type in lookup
        const types = Geometry.BLOCK_TYPES;
        for(let key of Object.keys(types)) {
            if(types[key].indexOf(type) != -1) {
                //remove any blocks that contain that key within the type
                types[key].filter(t => t !== type).forEach(t => this._removeTerrainBlock(t, cell));
            }
        }

        if(alreadyExists) {
            //did not build terrain block
            return false;
        }
        else {
            //create block type
            let geoDiv = document.createElement("div");
            geoDiv.classList.add(type, "geometry", "tile");
            geoDiv.style.position = "absolute";
            geoDiv.style.left = `${x * Level.TileSize}px`;
            geoDiv.style.top = `${y * Level.TileSize}px`;
            geoDiv.draggable = false;
            //attach to el
            cell.appendChild(geoDiv);

            //sort the children by their hierarchy in the block types
            const sortedDiv = [...Array.from(cell.children).sort((a, b) => {
                //get the names
                const typeA = a.classList[0];
                const typeB = b.classList[0];
                //test their last position in the block types
                const blocks = Object.values(Geometry.BLOCK_TYPES);
                const posA = Math.max(...blocks.map((gr, i) => (gr.indexOf(typeA) != -1) ? i : -1 ));
                const posB = Math.max(...blocks.map((gr, i) => (gr.indexOf(typeB) != -1) ? i : -1 ));

                return posA > posB ? 1 : -1;
            })]

            //re-add children in order
            sortedDiv.forEach(ch => cell.appendChild(ch));

            return true;
        }
    }
    _removeTerrainBlock(type, cell) {
        if(cell == null) return;
        //look for type
        const geoDiv = Array.from(cell.children).find(el => el.classList.contains(type));
        if(geoDiv != null) geoDiv.remove();
    }
    _getTerrainContainer(arr, x, y) {
        if(arr[y][x] != null) return arr[y][x];

        //place an object for test
        let div = document.createElement("div");
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

    _testTerrainBlock(arr, x, y, changeAdjs = true) {
        if(x < 0 || x >= arr[0].length || y < 0 || y >= arr.length) return;
        if(arr[y][x] == null) return;

        //get our terrain block
        const terrainBlock = Array.from(arr[y][x].children).find(ch => (ch.classList.contains(Geometry.BLOCKS.Crack.Vertical) || ch.classList.contains(Geometry.BLOCKS.Crack.Horizontal) || ch.classList.contains(Geometry.BLOCKS.Crack.Both)) );
        if(terrainBlock != null) {
            //test the surrounding
            const { left, right, top, bottom } = this._testAdjacentTerrains(arr, x, y);
            // console.log(left, right, top, bottom);

            if(changeAdjs) {
                if(top != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Vertical, x, y-1);
                if(bottom != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Vertical, x, y+1);
                if(left != null && (top != null || bottom != null)) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Both, x-1, y);
                else if(left != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Horizontal, x-1, y);
                if(right != null && (top != null || bottom != null)) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Both, x+1, y);
                else if(right != null) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Horizontal, x+1, y);
            }

            // if(changeAdjs) {
            //     if(top != null) this._setTerrainBlock(top, "crack-terrainv");
            //     if(bottom != null) this._setTerrainBlock(bottom, "crack-terrainv");
            // }

            //set ourselves
            if((top != null || bottom != null) && (left != null || right != null)) this._makeTerrainBlock(arr, Geometry.BLOCKS.Crack.Both, x, y);
        }

    }

    /**Returns the terrain name if it finds one */
    _lookForTerrainType(cell, ...type) {
        for(let i = 0; i < type.length; i++) {
            const children = Array.from(cell.children);
            for(let n = 0; n < children.length; n++) {
                if(children[n].classList.contains(type[i])) return type[i];
            }
        }
        return "";
    }

    _testAdjacentTerrains(arr, x, y) {
        const currBlockDiv = arr[y][x];
        let terrainBlocks = {left:null, right:null, top:null, bottom:null};

        //test left
        if(x-1 >= 0) {
            const block = arr[y][x-1];
            terrainBlocks.left = this._getTerrainBlock(block);
        }
        //test right
        if(x+1 < arr[0].length) {
            const block = arr[y][x+1];
            terrainBlocks.right = this._getTerrainBlock(block);
        }
        //test top
        if(y-1 >= 0) {
            const block = arr[y-1][x];
            terrainBlocks.top = this._getTerrainBlock(block);
        }
        //test bottom
        if(y+1 < arr.length) {
            const block = arr[y+1][x];
            terrainBlocks.bottom = this._getTerrainBlock(block);
        }
        return terrainBlocks;
    }
    _getTerrainBlock(block) {
        if(block == null) return null;
        return Array.from(block.children).find(ch => (ch.classList.contains('crack-terrainh') || ch.classList.contains('crack-terrainv') || ch.classList.contains('crack-terrainb') ));
    }
    _setTerrainBlock(block, type) {
        if(block == null) return;
        //remove old classlists
        console.log(block);
        block.className = "geometry";
        console.log(block);
        //give new class
        block.classList.add(type);
    }

    /*--------------------------------------- EVENTS --------------------------*/
    _onCursorClick(e) {
        this._isDragRect = false;
        // console.log(e);
        const position = e.detail;

        //set the deletion flag by seeing if this type of terrain exists on this block position already
        const coords = this._getCoordsFromPosition(position.x, position.y);
        const cell = this.layersGeo[this.currentLayer][coords.y][coords.x];
        if(cell == null) this.isDeleting = false;
        else {
            const t = this._lookForTerrainType(cell, this.currentGeoTag);
            this.isDeleting = (t == this.currentGeoTag);
        }

        this._setBlock(coords);
    }
    _onCursorDrag(e) {
        if(this._isDragRect) return;

        const position = e.detail;
        //get coord
        const coords = this._getCoordsFromPosition(position.x, position.y);
        //if coord is same as last coord, don't do anything
        if(coords.x == this._lastCoords.x && coords.y == this._lastCoords.y) return;
        this._setBlock(coords, false);
    }
    //handles building rect of selection
    _onCursorRightClick(e) {
        this._isDragRect = true;
        const position = e.detail;
        //get coord
        const coords = this._getCoordsFromPosition(position.x, position.y);
        this._startDragCoords = coords;
    }
    _onCursorRightDrag(e) {
        console.log("LOOK AT ME");
        const position = e.detail;
        //get coord
        const coords = this._getCoordsFromPosition(position.x, position.y);

        for(let y = this._startDragCoords.y; y < coords.y; y++) {
            for(let x = this._startDragCoords.x; x < coords.x; x++) {
                this._setBlock({x, y}, false);
            }
        }        
    }

    _onToolbarButtonClick(e) {
        const value = e.detail;
        console.log(value);

        switch(value) {
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
}