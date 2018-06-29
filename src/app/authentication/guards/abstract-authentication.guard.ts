import { Injectable } from "@angular/core";
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from "@angular/router";

import { inject } from "./../utils";
import { AuthService } from "./../services";
import { carbonldpProvider } from "app/providers";

/*
*  Parent Guard of Authenticated and NotAuthenticated guards that provides the AuthService and
*  determines if they canActivate themselves
* */
@Injectable()
export abstract class AbstractAuthenticationGuard implements CanActivate {
	protected authService:AuthService.Class;

	constructor( protected router:Router ) {}

	/*
	*  Determines if the AuthService is ready so it can be used by its children
	* */
	canActivate( route:ActivatedRouteSnapshot, state:RouterStateSnapshot ):Promise<boolean> {
		return carbonldpProvider.promise.then( () => {
			// AuthService needs to be injected here so we don't cause a premature initialization of AuthService
			// If AuthService is injected in the constructor, the carbonProvider won't be ready and will cause an error
			return inject( AuthService.Token );
		} ).then( ( authService:any ) => {
			this.authService = authService;
			return true;
		} ).catch( ( error ) => {
			return this.onError( route, state );
		} );
	}

	protected onReject( route:ActivatedRouteSnapshot, state:RouterStateSnapshot ):boolean {
		if( typeof route.data === "object" && route.data !== null && typeof route.data[ "onReject" ] !== "undefined" ) {
			this.router.navigate( route.data[ "onReject" ] );
		} else {
			console.error( "AuthenticatedGuard was configured in a route without an 'onReject' property" );
		}
		return false;
	}

	protected onError( route:ActivatedRouteSnapshot, state:RouterStateSnapshot ):boolean {
		if( typeof route.data === "object" && route.data !== null && typeof route.data[ "onError" ] !== "undefined" ) {
			this.router.navigate( route.data[ "onError" ] );
		} else {
			return this.onReject( route, state );
		}
		return false;
	}
}
