import { ButtonToggle } from "./ui/ButtonToggle";
import { Cursor } from "./ui/Cursor";
import { Geometry } from "./logic/Geometry";
import { Level } from "./Level";



/*--------------------------------------- STATIC METHODS ------------------*/
function main() {
    console.log("STARTED");
    //load components
    ButtonToggle.load();
    Cursor.load();

    console.log(Cursor.Cursors);

    //load level
    Level.load();

    //load envs
    new Geometry(Cursor.Cursors['geometry-cursor'], document.querySelector(".toolbar.geometry")).listen();

    document.body.draggable = false;
    document.oncontextmenu = (e) => { return false; }
}

/*--------------------------------------- METHODS -------------------------*/
/*--------------------------------------- EVENTS --------------------------*/
/*--------------------------------------- OVERRIDES -----------------------*/
/*--------------------------------------- GETTERS AND SETTERS -------------*/










main()