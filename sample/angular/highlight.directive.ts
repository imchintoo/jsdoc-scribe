import { Directive, ElementRef } from "@angular/core";

/**
 * Highlights the host element -- task-fw-02 fixture: `@Directive`.
 */
@Directive({
    selector: "[appHighlight]",
})
export class HighlightDirective {
    /**
     * @constructor
     * @param {ElementRef} el - el.
     */
    constructor(private readonly el: ElementRef) {
        this.el.nativeElement.style.backgroundColor = "yellow";
    }
}
