import { Injectable, EventEmitter } from "@angular/core";

import * as Cookies from "js-cookie";

import { CarbonLDP } from "carbonldp";
import { Response } from "carbonldp/HTTP";
import * as PersistedUser from "carbonldp/Auth/PersistedUser";
import * as Token from "carbonldp/Auth/Token";

import { AUTH_COOKIE } from "./../utils";

import * as AuthService from "./auth.service";

@Injectable()
export class CarbonLDPAuthService implements AuthService.Class {
	private _loggedInEmitter:EventEmitter<any>;
	private _loggedOutEmitter:EventEmitter<any>;
	private _authChangedEmitter:EventEmitter<any>;
	private carbonldp:CarbonLDP;

	get loggedInEmitter():EventEmitter<any> { return this._loggedInEmitter };

	get loggedOutEmitter():EventEmitter<any> { return this._loggedOutEmitter };

	get authChangedEmitter():EventEmitter<any> { return this._authChangedEmitter };

	constructor( carbonldp:CarbonLDP ) {
		this.carbonldp = carbonldp;
		this._loggedInEmitter = new EventEmitter<any>();
		this._loggedOutEmitter = new EventEmitter<any>();
		this._authChangedEmitter = new EventEmitter<any>();

		this.loggedInEmitter.subscribe( ( value:any ) => this.authChangedEmitter.emit( value ) );
		this.loggedOutEmitter.subscribe( ( value:any ) => this.authChangedEmitter.emit( value ) );
	}

	isAuthenticated():boolean {
		return this.carbonldp.auth.isAuthenticated();
	}

	login( username:string, password:string, rememberMe:boolean ):Promise<any> {
		return this.carbonldp.auth.authenticate( username, password ).then( ( token:Token.Class ) => {
			if( rememberMe ) Cookies.set( AUTH_COOKIE, JSON.stringify( {
				expirationTime: token.expirationTime,
				key: token.key
			} ) );
			this.loggedInEmitter.emit( null );
			return token;
		} );
	}

	logout():void {
		Cookies.remove( AUTH_COOKIE );
		this.carbonldp.auth.clearAuthentication();
		this.loggedOutEmitter.emit( null );
	}

	register( name:string, username:string, password:string ):Promise<any>;
	register( name:string, username:string, password:string, enabled:boolean ):Promise<any>;
	register( name:string, username:string, password:string, enabled?:boolean ):Promise<any> {
		return this.carbonldp.auth.users.register( username, password, enabled ).then( ( [ persistedUser, responses ]:[ PersistedUser.Class, Response.Response ] ) => {
			persistedUser.name = name;
			return persistedUser.saveAndRefresh();
		} );
	}
}
