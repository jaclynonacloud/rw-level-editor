export class ButtonGroup {
    constructor(parentElement) {
        this._parentElement = parentElement;
        //find all the buttons within the parent element
        this.buttons = Array.from(parentElement.querySelectorAll("button"));
        console.log("BUTTONS", this.buttons);

        this.selectable = true;
        this.currentSelected = this.buttons[0];

        //listen to all the buttons for a click
        for(let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].onclick = this._onButtonClicked.bind(this);
        }
    }
    /*--------------------------------------- STATIC METHODS ------------------*/    
    /*--------------------------------------- METHODS -------------------------*/
    /*--------------------------------------- EVENTS --------------------------*/
    _onButtonClicked(e) {
        console.log("CALLED");
        if(this.selectable) {
            //test against current if selectable
            if(this.currentSelected != e.target) {
                //change selected
                this.currentSelected.classList.remove("selected");
                this.currentSelected = e.target;
                this.currentSelected.classList.add("selected");
            }
        }

        //look for a data value
        if(e.target.dataset.value != null) {
            let clickEvent = new CustomEvent("button-click", {detail:e.target.dataset.value});
            this._parentElement.dispatchEvent(clickEvent);
        }
    }
    /*--------------------------------------- OVERRIDES -----------------------*/
    /*--------------------------------------- GETTERS AND SETTERS -------------*/
    get ParentElement() { return this._parentElement; }
}