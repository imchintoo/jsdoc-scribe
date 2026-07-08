import { Component, OnInit } from "@angular/core";
import { UserService } from "./user.service";

/**
 * Component listing users -- task-fw-02 fixture: `@Component` with
 * constructor-injected dependency.
 */
@Component({
    selector: "app-user-list",
    template: "<ul><li *ngFor=\"let u of users\">{{ u.name }}</li></ul>",
})
export class UserListComponent implements OnInit {
    /**
     * @member users
     * @type {string[]}
     * @public
     */
    users: string[] = [];

    /**
     * @constructor
     * @param {UserService} userService - user service instance.
     */
    constructor(private readonly userService: UserService) {}

    /**
     * Loads the user list on init.
     * @returns {void}
     */
    ngOnInit(): void {
        this.users = this.userService.list();
    }
}
