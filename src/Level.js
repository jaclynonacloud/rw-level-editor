export class Level {

    /*--------------------------------------- STATIC METHODS ------------------*/
    static load() {
        Level._tileSize = 17;
        Level._width = 680;
        Level._height = 408;

        //load all scenes with this size
        Array.from(document.querySelectorAll(".scene__bounds")).forEach(el => {
            el.style.width = `${Level._width}px`;
            el.style.height = `${Level._height}px`;
        });
    }   
    /*--------------------------------------- METHODS -------------------------*/
    /*--------------------------------------- EVENTS --------------------------*/
    /*--------------------------------------- OVERRIDES -----------------------*/
    /*--------------------------------------- GETTERS AND SETTERS -------------*/
    static get TileSize() { return Level._tileSize; }
    static get Width() { return Level._width; }
    static get Height() { return Level._height; }
}