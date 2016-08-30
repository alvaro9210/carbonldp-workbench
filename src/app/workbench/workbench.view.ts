import { Component, provide, Inject, EventEmitter } from "@angular/core";
import { Location } from "@angular/common";
//import { Router, RouterOutlet, RouteConfig } from "@angular/router-deprecated";
import { Router } from "@angular/router";

import Carbon from "carbonldp/Carbon";

import { AuthService } from "angular2-carbonldp/services";

//import { RouterService } from "carbon-panel/router.service";
import { HeaderService } from "carbon-panel/header.service";
//import { HeaderComponent } from "carbon-panel/header.component";
import { SidebarService } from "carbon-panel/sidebar.service";
//import { SidebarComponent } from "carbon-panel/sidebar.component";
//import { MenuBarComponent } from "carbon-panel/menu-bar.component";
//import { ErrorsAreaComponent } from "carbon-panel/errors-area/errors-area.component";
//import { ErrorsAreaService } from "carbon-panel/errors-area/errors-area.service";
//import { MyAppsSidebarService } from "carbon-panel/my-apps/my-apps-sidebar.service";

// import { MyAppsView } from "carbon-panel/my-apps/my-apps.view";
//
// import { DashboardView } from "app/dashboard/dashboard.view";

import template from "./workbench.view.html!";
import style from "./workbench.view.css!text";

@Component( {
	selector: "div.ng-view",
	template: template,
	styles: [ style ],
	directives: [
		//RouterOutlet,
		//HeaderComponent,
		//SidebarComponent,
		//MenuBarComponent,
		//ErrorsAreaComponent,
	],
	providers: [
		HeaderService, SidebarService
		/*provide( RouterService, {
			useFactory: ( router:Router, location:Location ):RouterService => {
				return new RouterService( router, location );
			},
			deps: [ Router, Location ]
		} ),*/
		//provide( HeaderService, { useClass: HeaderService } ),
		//provide( SidebarService, { useClass: SidebarService } ),
		//provide( ErrorsAreaService, { useClass: ErrorsAreaService } ),

		// If we provide MyAppsSidebarService inside of my-apps.view, Angular would create a new instance each time my-apps is revisited
		// leading to duplicate entries in the sidebar
		//provide( MyAppsSidebarService, { useClass: MyAppsSidebarService } ),
	]
} )
export class WorkbenchView {

	private headerService:HeaderService;
	private sidebarService:SidebarService;
	private authService:AuthService.Class;
	private router:Router;
	private carbon:Carbon;
	private prevUrl:string;

	constructor(  headerService:HeaderService, sidebarService:SidebarService, @Inject( AuthService.Token ) authService:AuthService.Class, router:Router, carbon:Carbon ) {

		this.headerService = headerService;
		this.sidebarService = sidebarService;
		this.authService = authService;
		this.router = router;
		this.carbon = carbon;
		this.router.events.subscribe( ( url )=> {
			/*if( this.prevUrl !== url ) {
				console.log("workbench", url)
				//document.querySelector( ".scrollable-content" ).scrollTop = 0;
				this.prevUrl = url;
			}*/
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
		this.headerService.logo = {
			image: "assets/images/carbon-ldp-logo-lg.png",
			route: [ "" ]
		};

		let onLogout:EventEmitter<any> = new EventEmitter<any>();
		onLogout.subscribe( ( event:any ) => {
			this.authService.logout();
			this.router.navigate( [ "/login" ] );
		} );

		//let name:string = this.carbon.auth.authenticatedAgent[ "name" ] ? this.carbon.auth.authenticatedAgent.name : "User";
		//TODO: fix name
		let name:string = "User";
		this.headerService.addItems( [
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

export default WorkbenchView;
