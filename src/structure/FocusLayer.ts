import { _scrollTo } from "elexis/lib/scrollTo";
import type { $HTMLElement } from "elexis/node/$HTMLElement";
import { type $EventMap, $EventManager } from "elexis/structure/$EventManager";
import type { $StateArgument } from "elexis/structure/$State";

export interface $FocusLayerEventMap extends $EventMap {
    focus: [{$prevFocus?: $HTMLElement, $focused: $HTMLElement, layer: $FocusLayer}],
    blur: [{$prevFocus: $HTMLElement, layer: $FocusLayer}]
}
export class $FocusLayer extends $EventManager<$FocusLayerEventMap> {
    id: number;
    elementSet = new Set<$HTMLElement>();
    entrySet = new Set<$HTMLElement>();
    prevBlur?: $HTMLElement;
    currentFocus?: $HTMLElement;
    private focusHandler = (e: Event, $element: $HTMLElement) => this.focus($element, true);
    private blurHandler = (e: Event, $element: $HTMLElement) => this.blur($element);
    private options = {
        loop: true,
        scrollThreshold: 0,
        scrollBehavior: undefined as ScrollBehavior | undefined
    }
    constructor(id: number) {
        super();
        this.id = id
        this.add = this.add.bind(this);
        this.entry = this.entry.bind(this);
    }

    add($elements: OrArray<$HTMLElement>) {
        $.orArrayResolve($elements).forEach($element => {
            if (this.elementSet.has($element)) return;
            this.elementSet.add($element);
            $element.tabIndex(0)
            // .on('focus', this.focusHandler);
        });
        return this;
    }

    remove($element: $HTMLElement) {
        if (this.currentFocus === $element) this.blur();
        if (this.prevBlur === $element) this.prevBlur = undefined;
        this.elementSet.delete($element);
        // $element.off('focus', this.focusHandler);
        return this;
    }

    entry($elements: OrArray<$HTMLElement>) {
        $.orArrayResolve($elements).forEach(this.entrySet.add.bind(this.entrySet))
        return this;
    }

    focus($element: $HTMLElement | undefined, focused: boolean = false) {
        if (!$element) return this;
        $element.hide(false);
        const $focused = this.currentFocus;
        this.blur();
        this.currentFocus = $element;
        $element.attribute('focus', '');
        this.fire('focus', {$prevFocus: $focused, $focused: $element, layer: this});
        _scrollTo($element, {threshold: this.options.scrollThreshold, behavior: this.options.scrollBehavior});
        if (!focused) $element.trigger('focus');
        return this;
    }

    blur($element?: $HTMLElement) {
        if ($element && $element !== this.currentFocus) return this;
        if (!this.currentFocus) return this;
        this.prevBlur = this.currentFocus;
        this.currentFocus.attribute('focus', null);
        this.currentFocus = undefined;
        this.fire('blur', {$prevFocus: this.prevBlur, layer: this});
        this.prevBlur.trigger('blur');
        return this;
    }

    removeAll() {
        this.elementSet.forEach($ele => this.remove($ele));
        return this;
    }

    loop(): boolean;
    loop(boolean: boolean): this;
    loop(boolean?: boolean) { return $.fluent(this, arguments, () => this.options.loop, () => $.set(this.options, 'loop', boolean)) }

    scrollThreshold(): number;
    scrollThreshold(number: $StateArgument<number>): this;
    scrollThreshold(number?: $StateArgument<number>) { return $.fluent(this, arguments, () => this.options.scrollThreshold, () => $.set(this.options, 'scrollThreshold', number)) }

    scrollBehavior(): ScrollBehavior | undefined;
    scrollBehavior(behavior: $StateArgument<ScrollBehavior | undefined>): this;
    scrollBehavior(behavior?: $StateArgument<ScrollBehavior | undefined>) { return $.fluent(this, arguments, () => this.options.scrollBehavior, () => $.set(this.options, 'scrollBehavior', behavior))}
}