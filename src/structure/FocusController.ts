import { _scrollTo } from "elexis/src/lib/scrollTo";
import { $EventManager } from "elexis/src/structure/$EventManager";
import { type $FocusLayerEventMap, $FocusLayer } from "./FocusLayer";

export class $FocusController extends $EventManager<$FocusLayerEventMap> {
    layerMap = new Map<number, $FocusLayer>();
    currentLayer?: $FocusLayer;
    historyList: $FocusLayer[] = [];
    constructor() {
        super();
    }
    
    layer(id: number) {
        const layer = this.layerMap.get(id) ?? new $FocusLayer(id)
            .on('blur', (ev) => { this.fire('blur', ev); this.currentLayer = undefined; })
            .on('focus', (ev) => { this.fire('focus', ev); this.currentLayer = layer; })
        this.layerMap.set(layer.id, layer);
        return layer;
    }
    next() { return this.select($FocusNavigation.Next) }
    prev() { return this.select($FocusNavigation.Prev) }
    up() { return this.select($FocusNavigation.Up) }
    down() { return this.select($FocusNavigation.Down) }
    right() { return this.select($FocusNavigation.Right) }
    left() { return this.select($FocusNavigation.Left) }

    blur() {
        this.currentLayer?.blur();
        return this;
    }

    select(navigation: $FocusNavigation) {
        this.currentLayer = this.currentLayer ?? [...this.layerMap.values()].at(0);
        if (!this.currentLayer) return this;
        const $focused = this.currentLayer.currentFocus;
        const eleList = this.currentLayer.elementSet.array;
        if (!$focused) { 
            const $target = this.currentLayer.prevBlur ?? eleList.at(0);
            if (!$target) return this;
            this.currentLayer.focus($target);
            return this;
        }
        const eleIndex = eleList.indexOf($focused)
        switch (navigation) {
            case $FocusNavigation.Next:
            case $FocusNavigation.Prev: {
                let targetIndex = navigation === 0 ? eleIndex + 1 : eleIndex - 1;
                if (targetIndex === eleList.length && this.currentLayer.loop()) targetIndex = 0;
                else if (targetIndex === -1 && !this.currentLayer.loop()) targetIndex = 0;
                const $target = eleList.at(targetIndex);
                if (!$target) break;
                this.currentLayer.focus($target);
                break;
            }
            case $FocusNavigation.Down:
            case $FocusNavigation.Left:
            case $FocusNavigation.Right:
            case $FocusNavigation.Up: {
                const focusedPosition = $focused.coordinate();
                if (!focusedPosition) break;
                const focusedCoordinate = $.call(() => {
                    switch (navigation) {
                        case $FocusNavigation.Up: return {y: focusedPosition.y, x: focusedPosition.x / 2}
                        case $FocusNavigation.Down: return {y: focusedPosition.y + focusedPosition.height, x: focusedPosition.x / 2}
                        case $FocusNavigation.Left: return {y: focusedPosition.y / 2, x: focusedPosition.x}
                        case $FocusNavigation.Right: return {y: focusedPosition.y / 2, x: focusedPosition.x + focusedPosition.width}
                    }
                })
                const eleInfoList = eleList.map($ele => {
                    if ($ele === $focused) return;
                    const elePosition = $ele.coordinate();
                    if (!elePosition) return;
                    const eleCoordinate = $.call(() => {
                        switch (navigation) {
                            case $FocusNavigation.Up: return {y: elePosition.y + elePosition.height, x: elePosition.x / 2};
                            case $FocusNavigation.Down: return {y: elePosition.y, x: elePosition.x / 2};
                            case $FocusNavigation.Left: return {y: elePosition.y / 2, x: elePosition.x + elePosition.width};
                            case $FocusNavigation.Right: return {y: elePosition.y / 2, x: elePosition.x};
                        }
                    })
                    return {
                        $ele, elePosition,
                        distance: Math.sqrt((eleCoordinate.x - focusedCoordinate.x) ** 2 + (eleCoordinate.y - focusedCoordinate.y) ** 2)
                    }
                }).detype(undefined).filter(({elePosition}) => {
                    switch (navigation) {
                        case $FocusNavigation.Up: if (elePosition.y + elePosition.height >= focusedPosition.y) return false; break;
                        case $FocusNavigation.Down: if (elePosition.y <= focusedPosition.y + focusedPosition.height) return false; break;
                        case $FocusNavigation.Left: if (elePosition.x + elePosition.width >= focusedPosition.x) return false; break;
                        case $FocusNavigation.Right: if (elePosition.x <= focusedPosition.x + focusedPosition.width) return false; break;
                    }
                    return true;
                })
                const $target = eleInfoList.sort((a, b) => a.distance - b.distance).at(0)?.$ele;
                if (!$target) break;
                this.currentLayer.focus($target);
            }
        }
        return this;
    }
}

export enum $FocusNavigation { Next, Prev, Up, Down, Right, Left }