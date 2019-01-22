/**A class to handle manipulating crack terrain data from the geometry class. */
export class CrackLogic {
    static load(hTag, vTag, bTag) {
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
    static crackTerrain(arr, x, y) {
        //find all of our cracked terrain
        // console.log("RAW", arr);
        let crackedTerrain = CrackLogic._getCrackMap(arr);
        crackedTerrain[y][x] = true; //set our block as true as well

        console.log("TERRAIN CRACK", crackedTerrain);

        let desiredCracks = {self:null, left:null, right:null, top:null, bottom:null};
        //request types for each corner/self
        desiredCracks.left = this._findDesiredCrack(crackedTerrain, x-1, y);
        desiredCracks.right = this._findDesiredCrack(crackedTerrain, x+1, y);
        desiredCracks.top = this._findDesiredCrack(crackedTerrain, x, y-1);
        desiredCracks.bottom = this._findDesiredCrack(crackedTerrain, x, y+1);
        desiredCracks.self = this._findDesiredCrack(crackedTerrain, x, y);

        return desiredCracks;
    }


    static _findDesiredCrack(crackArr, x, y) {
        //see if we can even change this crack
        if(x < 0 || x > (crackArr[0].length-1)) return "";
        if(y < 0 || y > (crackArr.length-1)) return "";
        if(!crackArr[y][x]) return "";

        let desiredCrack = "";
        let sides = {left:false, right:false, top:false, bottom:false};
        //set left
        if((x-1) >= 0) if(crackArr[y][x-1]) sides.left = true;
        //set right
        if((x+1) > (crackArr[0].length-1)) if(crackArr[y][x+1]) sides.right = true;
        //set top
        if((y-1) >= 0) if(crackArr[y-1][x]) sides.top = true;
        //set bottom
        if((y+1) > (crackArr.length-1)) if(crackArr[y+1][x]) sides.bottom = true;

        //test hor/ver
        desiredCrack = (sides.top || sides.bottom) ? CrackLogic.vTag : CrackLogic.hTag;
        //test both
        if((sides.top || sides.bottom) && (sides.left || sides.right)) desiredCrack = CrackLogic.bTag;

        return desiredCrack;
    }


    /**Returns a map of true/false values depending on whether that cell has a cracked terrain block. */
    static _getCrackMap(arr) {
        return arr.map(row => {
            if(row == null) return false;

            return row.map(el => {
                if(el == null) return false;
                const children = Array.from(el.children);

                return children.some(div => {
                    if(div.children == null) return false;

                    return  div.classList.contains(CrackLogic.hTag) ||
                            div.classList.contains(CrackLogic.vTag) ||
                            div.classList.contains(CrackLogic.bTag);

                });
                    
            });

        });
    }

}