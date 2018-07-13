import { Injectable, EventEmitter } from "@angular/core";

import { CarbonLDP } from "carbonldp";
import { User, PersistedUser, UsernameAndPasswordCredentials, LDAPCredentials } from "carbonldp/Auth";
import { URI } from "carbonldp/RDF/URI";
import { SPARQLSelectResults } from "carbonldp/SPARQL/SelectResults";
import { CS } from "carbonldp/Vocabularies";
import { QueryDocumentsBuilder } from "carbonldp/SPARQL/QueryDocument/QueryDocumentsBuilder";


@Injectable()
export class UsersService {

	private carbonldp:CarbonLDP;
	public users:Map<string, PersistedUser>;
	private _activeUser:PersistedUser;
	public set activeUser( user:PersistedUser ) {
		this._activeUser = user;
		this.onUserHasChanged.emit( this.activeUser );
	}

	public get activeUser():PersistedUser {
		return this._activeUser;
	}

	public onUserHasChanged:EventEmitter<PersistedUser> = new EventEmitter<PersistedUser>();

	constructor( carbonldp:CarbonLDP ) {
		this.carbonldp = carbonldp;
		this.users = new Map<string, PersistedUser>();
	}

	public get( slugOrURI:string ):Promise<PersistedUser> {
		let uri:string = this.carbonldp.baseURI + `users/${slugOrURI}/`;
		if( URI.isAbsolute( slugOrURI ) ) uri = slugOrURI;
		return this.carbonldp.documents.get<PersistedUser>( uri ).then( ( user:PersistedUser ) => {
			// TODO: Remove this when SDK resolves preference of Full document instead of partial document. issue:#264
			delete user._partialMetadata;
			this.users.set( user.id, user );
			return user;
		} );
	}

	public getAll( limit?:number, page?:number, orderBy?:string, ascending:boolean = true ):Promise<PersistedUser[]> {

		let property:string = orderBy ? orderBy : "id";

		return this.carbonldp.auth.users.getChildren<PersistedUser>( ( _:QueryDocumentsBuilder ) => {
			let func = _.withType( CS.User )
				.properties( {
					"created": _.inherit,
					"modified": _.inherit,
				} );
			if( ! orderBy ) func.orderBy( property, ascending ? "ASC" : "DESC" );
			if( typeof limit !== "undefined" ) func.limit( limit );
			if( typeof page !== "undefined" ) func.offset( page * limit );

			return func;
		} ).then( ( users:PersistedUser[] ) => {

			return orderBy ? this.getSortedUsers( users, orderBy, ascending ) : users;
		} );
	}

	public getNumberOfUsers():Promise<number> {
		let usersURI:string = this.carbonldp.baseURI + "users/",
			query:string = `SELECT DISTINCT (COUNT(?user) AS ?count) WHERE {
			?user a <${CS.User}> . 
		}`;
		return this.carbonldp.documents.executeSELECTQuery( usersURI, query ).then( ( results:SPARQLSelectResults ) => {
			if( typeof results.bindings[ 0 ] === "undefined" ) return 0;
			return <number>results.bindings[ 0 ][ "count" ];
		} );
	}

	public saveUser( user:PersistedUser ):Promise<PersistedUser> {
		return user.save();
	}

	public saveAndRefreshUser( user:PersistedUser ):Promise<PersistedUser> {
		return user.saveAndRefresh();
	}

	public createUser( credentials:UsernameAndPasswordCredentials | LDAPCredentials, slug?:string ):Promise<PersistedUser> {

		let newUser:User = User.create( { credentials: credentials } );

		return this.carbonldp.auth.users.createChild( newUser, slug );
	}

	public deleteUser( user:User, slug?:string ):Promise<void> {
		return this.carbonldp.documents.delete( user.id );
	}

	private getSortedUsers( users:PersistedUser[], orderBy:string, ascending:boolean ):PersistedUser[] {
		return users.sort( ( userA, userB ) => {
			if( typeof userA[ orderBy ] === "string" && typeof userB[ orderBy ] === "string" ) {
				if( userA[ orderBy ].toLowerCase() > userB[ orderBy ].toLowerCase() ) return ascending ? - 1 : 1;
				if( userA[ orderBy ].toLowerCase() < userB[ orderBy ].toLowerCase() ) return ascending ? 1 : - 1;
			} else {
				if( userA[ orderBy ] > userB[ orderBy ] ) return ascending ? - 1 : 1;
				if( userA[ orderBy ] < userB[ orderBy ] ) return ascending ? 1 : - 1;
			}
			return 0;
		} );
	}
}