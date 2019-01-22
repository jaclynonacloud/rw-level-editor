export class Cursor {
    /*--------------------------------------- STATIC METHODS ------------------*/
    static load() {
        Cursor._cursors = {};
        Cursor._lastMousePos = {x:0, y:0};
        Cursor._mouseButton = 0;

        const cursors = document.querySelectorAll("[data-cursor]");
        console.log(cursors);
        for(let i = 0; i < cursors.length; i++) {
            const el = cursors[i];
            //create cursor logic
            Cursor._cursors[el.dataset.cursorname] = new CursorLogic(el); 
        }
    }
    
    /*--------------------------------------- METHODS -------------------------*/
    /*--------------------------------------- EVENTS --------------------------*/
    /*--------------------------------------- OVERRIDES -----------------------*/
    /*--------------------------------------- GETTERS AND SETTERS -------------*/
    static get Cursors() { return Cursor._cursors; }
}



class CursorLogic {
    constructor(cursorElement) {
        this.cursorElement = cursorElement;
        this.cursorBoundsElement = cursorElement.closest("[data-cursor-bounds]");

        this._cursorMoveEvent = this._onCursorMove.bind(this);
        this._cursorClickEvent = this._onCursorClick.bind(this);
        this._cursorReleaseEvent = this._onCursorRelease.bind(this);

        this._position = {x:0, y:0};
        this._isClicked = false;
    }

    /*--------------------------------------- METHODS -------------------------*/
    listen() {

        //listen for cursor movement
        this.cursorBoundsElement.addEventListener("mousemove", this._cursorMoveEvent);
        this.cursorBoundsElement.addEventListener("mousedown", this._cursorClickEvent);
        this.cursorBoundsElement.addEventListener("mouseup", this._cursorReleaseEvent);
    }

    unlisten() {
        //stop listen for cursor movement
        this.cursorBoundsElement.removeEventListener("mousemove", this._cursorMoveEvent);
        this.cursorBoundsElement.removeEventListener("mousedown", this._cursorClickEvent);
        this.cursorBoundsElement.removeEventListener("mouseup", this._cursorReleaseEvent);
    }

    /**Returns a value for the grid. */
    _getClosest(val) {
        return Math.floor(val / 17) * 17;
    }
    /*--------------------------------------- EVENTS --------------------------*/
    _onCursorMove(e) {
        this._position = {x:this._getClosest(e.clientX-this.cursorBoundsElement.offsetLeft), y:this._getClosest(e.clientY-this.cursorBoundsElement.offsetTop)};
        // console.log("MOVE", this._position);
        // console.log(this.cursorElement);
        //move cursor
        this.cursorElement.style.left = `${this._position.x}px`;
        this.cursorElement.style.top = `${this._position.y}px`;

        // const dist = (Math.abs(this._position.x - Cursor._lastMousePos.x) + Math.abs(this._position.y - Cursor._lastMousePos.y)) / 2;
        // console.log("DIST", dist);
        if(this._isClicked) {
            let dragEvent = new CustomEvent("cursor-drag", {'detail': this._position});
            this.cursorElement.dispatchEvent(dragEvent);

            //right click
            if(Cursor._mouseButton == 2) {
                console.log("YE")
                dragEvent = new CustomEvent("cursor-right-drag", {'detail': this._position});
                this.cursorElement.dispatchEvent(dragEvent);
            }
        }
    }

    _onCursorClick(e) {
        Cursor._mouseButton = e.button;

        this._onCursorMove(e);

        this._isClicked = true;

        Cursor._lastMousePos = {x:this._getClosest(e.clientX-this.cursorBoundsElement.offsetLeft), y:this._getClosest(e.clientY-this.cursorBoundsElement.offsetTop)};

        let clickEvent = new CustomEvent("cursor-click", {'detail': this._position});
        this.cursorElement.dispatchEvent(clickEvent);

        //right click
        if(e.button == 2) {
            e.preventDefault();
            e.stopPropagation();
            clickEvent = new CustomEvent("cursor-right-click", {'detail': this._position});
            this.cursorElement.dispatchEvent(clickEvent);
        }
    }

    _onCursorRelease(e) {
        this._isClicked = false;
    }
    /*--------------------------------------- OVERRIDES -----------------------*/
    /*--------------------------------------- GETTERS AND SETTERS -------------*/
    get CursorElement() { return this.cursorElement; }
    get Position() { return this._position; }
}