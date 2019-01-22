/**A class to handle manipulating slope terrain data from the geometry class. */
export class SlopeLogic {
    static load(tLTag, tRTag, bLTag, bRTag) {
        SlopeLogic.tLTag = tLTag;
        SlopeLogic.tRTag = tRTag;
        SlopeLogic.bLTag = bLTag;
        SlopeLogic.bRTag = bRTag;

        SlopeLogic._layerArray = null;
        SlopeLogic._slopeIndex = 0;
        SlopeLogic._slopes = [];
    }


    static slopeTerrain(arr, x, y, solidBlockTypes) {

        //remove our slopes from the solid block types
        solidBlockTypes = solidBlockTypes.filter(t => t != SlopeLogic.tLTag && t != SlopeLogic.tRTag && t != SlopeLogic.bLTag && t != SlopeLogic.bRTag);

        // if(SlopeLogic._slopes.length > 0) return SlopeLogic;

        SlopeLogic.reset();
        SlopeLogic._layerArray = arr;

        //if this block is solid, ignore
        if(this._isSolidBlock(arr, x, y, solidBlockTypes)) return SlopeLogic;

        let surroundingBlocks = {left:null, right:null, top:null, bottom:null};

        //request types for each corner/self
        surroundingBlocks.left = this._isSolidBlock(arr, x-1, y, solidBlockTypes);
        surroundingBlocks.right = this._isSolidBlock(arr, x+1, y, solidBlockTypes);
        surroundingBlocks.top = this._isSolidBlock(arr, x, y-1, solidBlockTypes);
        surroundingBlocks.bottom = this._isSolidBlock(arr, x, y+1, solidBlockTypes);

        const {left, right, top, bottom} = surroundingBlocks;

        console.log("SURROUNDING:", surroundingBlocks);

        //compare edges
        if(top && left) SlopeLogic._slopes.push(SlopeLogic.tLTag);
        if(top && right) SlopeLogic._slopes.push(SlopeLogic.tRTag);
        if(bottom && left) SlopeLogic._slopes.push(SlopeLogic.bLTag);
        if(bottom && right) SlopeLogic._slopes.push(SlopeLogic.bRTag);

        if(left && right) SlopeLogic._slopes = [];

        console.log("MY SLOPES", SlopeLogic._slopes);

        return SlopeLogic;
    }

    /**Get the next possible slope for this block.*/
    static next() {
        SlopeLogic._slopeIndex++;
        if(SlopeLogic._slopeIndex > SlopeLogic._slopes.length) SlopeLogic._slopeIndex = 0;
        return SlopeLogic;
    }
    
    static reset() {
        SlopeLogic._slopes = [];
        SlopeLogic._slopeIndex = 0;
    }


    static _isSolidBlock(arr, x, y, solidBlockTypes) {
        //see if we can even change this crack
        if(x < 0 || x > (arr[0].length-1)) return false;
        if(y < 0 || y > (arr.length-1)) return false;
        if(!arr[y][x]) return false;

        const block = arr[y][x];
        const children = Array.from(block.children);
        if(children == null) return false;
        return children.some(ch => {
            for(let i = 0; i < solidBlockTypes.length; i++)
                if(ch.classList.contains(solidBlockTypes[i]))
                    return true;
        });
    }


    static get CurrentSlopeTag() { return ((SlopeLogic._slopes.length <= 0) || (SlopeLogic._slopeIndex == SlopeLogic._slopes.length) ) ? "" : SlopeLogic._slopes[SlopeLogic._slopeIndex]; }

}