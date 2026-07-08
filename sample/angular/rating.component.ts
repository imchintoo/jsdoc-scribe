import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Star-rating widget -- task-fw-02 fixture: `@Input`/`@Output` decorated
 * properties (the ask this fixture set exists to confirm/deny support for).
 */
@Component({
    selector: "app-rating",
    template: "<span>{{ value }}</span>",
})
export class RatingComponent {
    /**
     * The current rating value, provided by the parent.
     */
    @Input() value: number = 0;

    /**
     * The maximum selectable rating.
     */
    @Input() max: number = 5;

    /**
     * Fires when the user changes the rating.
     */
    @Output() valueChange = new EventEmitter<number>();

    /**
     * Sets a new rating and emits the change.
     * @param {number} next
     * @returns {void}
     */
    setValue(next: number): void {
        this.value = next;
        this.valueChange.emit(next);
    }
}
