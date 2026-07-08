import { Injectable } from "@angular/core";

/**
 * Provides user data -- task-fw-02 fixture: `@Injectable` service.
 */
@Injectable({
    providedIn: "root",
})
export class UserService {
    /**
     * Lists all known user names.
     * @returns {string[]}
     */
    list(): string[] {
        return ["Ada", "Grace"];
    }
}
