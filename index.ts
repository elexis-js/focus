import 'elexis/core'
import { $FocusController } from './src/structure/FocusController'

declare module 'elexis/core' {
    export namespace $ {
        export function focus(): $FocusController;
    }
}

Object.assign($, {
    focus() { return new $FocusController() }
})