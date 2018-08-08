import { Injectable } from "@angular/core";

import { CarbonLDP } from "carbonldp";
import { PlatformMetadata } from "carbonldp/System/PlatformMetadata";
import { SPARQLSelectResults } from "carbonldp/SPARQL/SelectResults";
import { CustomWidget } from "app/root-content/dashboard/widgets/widgets.component";
import { SPARQLQuery } from "app/root-content/sparql-client/response/response.component";

@Injectable()
export class WidgetsService {
	carbonldp:CarbonLDP;

	constructor( carbonldp:CarbonLDP ) {
		this.carbonldp = carbonldp;
	}

	getDocumentsTotalCount():Promise<number> {
		let count;
		let query:string = `
			SELECT ( COUNT (?document) as ?count)
			WHERE{ GRAPH ?document {
					?document a <https://carbonldp.com/ns/v1/platform#Document>
				}
			}
		`;

		return this.carbonldp.documents.executeSELECTQuery( '', query ).then( ( results:SPARQLSelectResults ) => {
			results.bindings.forEach( ( binding ) => {
				count = binding[ "count" ];
			} );
			return count;
		} );

	}

	getTriplesTotalCount():Promise<number> {
		let count;
		let query:string = `
			PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
			SELECT ( COUNT (?s) as ?count)
			WHERE{ 
				?s ?p ?o .
			}
		`;

		return this.carbonldp.documents.executeSELECTQuery( '', query ).then( ( results:SPARQLSelectResults ) => {
			results.bindings.forEach( ( binding ) => {
				count = binding[ "count" ];
			} );
			return count;
		} );

	}

	getPlatformMetadata():Promise<any> {
		return this.carbonldp.getPlatformMetadata();
	}

	refreshPlatformMetadata( platformMetadata:PlatformMetadata ):Promise<any> {
		return platformMetadata.refresh();
	}


	getCustomTotalCount( query:SPARQLQuery, mainVariable:string ):Promise<number> {
		let count;
		return this.carbonldp.documents.executeSELECTQuery( query.endpoint, query.content ).then( ( results:SPARQLSelectResults ) => {
			results.bindings.forEach( ( binding ) => {
				count = binding[ mainVariable ];
			} );
			return count;
		} );
	}

	getCustomWidgetsOnLocalStorage():CustomWidget[] {
		if( ! ! window.localStorage.getItem( "savedWidgets" ) )
			return <CustomWidget[]>JSON.parse( window.localStorage.getItem( "savedWidgets" ) );

	}
}