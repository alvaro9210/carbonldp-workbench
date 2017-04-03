import { Component, Inject, EventEmitter } from "@angular/core";
import { Router, Event, NavigationEnd } from "@angular/router";

import { Class as Carbon } from "carbonldp/Carbon";

import { AuthService } from "angular2-carbonldp/services";
import { HeaderService } from "carbonldp-panel/header.service";
import { SidebarService } from "carbonldp-panel/sidebar.service";


@Component( {
	selector: "div.ng-view",
	templateUrl: "./workbench.view.html",
	styleUrls: [ "./workbench.view.scss" ],
} )
export class WorkbenchView {

	private headerService:HeaderService;
	private sidebarService:SidebarService;
	private authService:AuthService.Class;
	private router:Router;
	private carbon:Carbon;
	private prevUrl:string;

	constructor( headerService:HeaderService, sidebarService:SidebarService, @Inject( AuthService.Token ) authService:AuthService.Class, router:Router, carbon:Carbon ) {

		this.headerService = headerService;
		this.sidebarService = sidebarService;
		this.authService = authService;
		this.router = router;
		this.carbon = carbon;
		this.router.events.subscribe( ( event:Event ) => {
			let url:string = "", scrollableContent:Element;
			if( event instanceof NavigationEnd ) {
				url = event.url;
				if( this.prevUrl !== url ) {
					scrollableContent = document.querySelector( ".scrollable-content" );
					if( scrollableContent ) scrollableContent.scrollTop = 0;
					this.prevUrl = url;
				}
			}
		} );
	}


	ngOnInit():void {
		this.populateHeader();
		this.populateSidebar();
	}

	toggleSidebar():void {
		this.sidebarService.toggle();
	}

	private populateHeader():void {
		this.headerService.clear();
		this.headerService.logo = {
			image: "assets/images/carbon-ldp-logo-lg.png",
			route: [ "" ]
		};

		let onLogout:EventEmitter<boolean> = new EventEmitter<boolean>();
		onLogout.subscribe( ( event:any ) => {
			this.authService.logout();
			this.router.navigate( [ "/login" ] );
		} );

		let name:string = this.carbon.auth.authenticatedAgent[ "name" ] ? this.carbon.auth.authenticatedAgent.name : "User";
		// TODO: Remove any to use HeaderItem instead
		this.headerService.addItems( <any>[
			{
				name: "Dashboard",
				route: [ "" ],
				index: 0,
			},
			{
				name: name,
				children: [
					{
						icon: "sign out icon",
						name: "Log Out",
						onClick: onLogout,
						index: 100,
					}
				],
				index: 100,
			}
		] );
	}

	private populateSidebar():void {
		this.sidebarService.clear();
		this.sidebarService.addItems( [
			{
				type: "link",
				name: "Dashboard",
				route: [ "" ],
				index: 0,
			},
			{
				type: "link",
				name: "Apps",
				route: [ "", "my-apps" ]
			}
		] );
	}
}