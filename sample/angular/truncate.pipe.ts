import { Pipe, PipeTransform } from "@angular/core";

/**
 * Truncates a string to a max length -- task-fw-02 fixture: `@Pipe`.
 */
@Pipe({
    name: "truncate",
})
export class TruncatePipe implements PipeTransform {
    /**
     * Transforms the input value.
     * @param {string} value
     * @param {number} [limit]
     * @returns {string}
     */
    transform(value: string, limit?: number): string {
        /**
         * @constant max
         * @type {any}
         */
        const max = limit || 20;
        return value.length > max ? value.slice(0, max) + "..." : value;
    }
}
