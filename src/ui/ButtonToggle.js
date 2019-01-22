export class ButtonToggle {
    /*--------------------------------------- STATIC METHODS ------------------*/
    static load() {
        console.log("LOADED BUTTONS");
        const toggles = document.querySelectorAll("[data-toggle]");
        console.log(toggles);
        for(let i = 0; i < toggles.length; i++) {
            const el = toggles[i];
            //set to false
            if(el.dataset.toggle == null) el.dataset.toggle = false;

            //listen to click
            el.onclick = (e) => {
                console.log(e.target);
                const isOn = (el.dataset.toggle != null) ? el.dataset.toggle == "true" : false;
                el.dataset.toggle = !isOn;
            }            
        }
    }
    
    /*--------------------------------------- METHODS -------------------------*/
    /*--------------------------------------- EVENTS --------------------------*/
    /*--------------------------------------- OVERRIDES -----------------------*/
    /*--------------------------------------- GETTERS AND SETTERS -------------*/
}