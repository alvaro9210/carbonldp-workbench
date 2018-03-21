import { Injectable } from "@angular/core";

import { CarbonLDP } from "carbonldp";
import { Response }  from "carbonldp/HTTP";
import { PersistedDocument } from "carbonldp/PersistedDocument";
import * as Utils from "carbonldp/Utils";
import * as Pointer from "carbonldp/Pointer";

import * as Job from "./job"

@Injectable()
export class JobsService {

	carbonldp:CarbonLDP;

	jobs:Map<string, PersistedDocument>;
	jobsUri:string = "";

	constructor( carbonldp:CarbonLDP ) {
		this.carbonldp = carbonldp;
		this.jobs = new Map<string, PersistedDocument>();
		this.jobsUri = this.carbonldp.baseURI + ".system/jobs/";
	}

	getJobOfType( type:string ):Promise<PersistedDocument> {
		if( ! type ) return <any> Promise.reject( new Error( "Provide a job type." ) );

		let jobsArray:PersistedDocument[] = Utils.A.from( this.jobs.values() );
		let job:PersistedDocument = jobsArray.find( ( job:PersistedDocument ) => job.types.indexOf( type ) !== - 1 );
		if( ! ! job ) return Promise.resolve( job );

		return this.getAll().then(
			( jobs:PersistedDocument[] ) => {
				let jobsArray:PersistedDocument[] = Utils.A.from( jobs.values() );
				return jobsArray.find( ( job:PersistedDocument ) => job.types.indexOf( type ) !== - 1 );
			}
		);
	}

	getAll():Promise<PersistedDocument[]> {
		return this.carbonldp.documents.getChildren( this.jobsUri ).then( ( [ existingJobs, response ]:[ PersistedDocument[], Response ] ) => {
			existingJobs.filter( ( job:PersistedDocument ) => ! this.jobs.has( job.id ) )
				.forEach( ( job:PersistedDocument ) => this.jobs.set( job.id, job ) );
			return Utils.A.from( this.jobs.values() );
		} );
	}

	createExportBackup():Promise<PersistedDocument> {
		return new Promise<PersistedDocument>(
			( resolve:( result:any ) => void, reject:( error:Error ) => void ) => {
				let tempJob:any = {};
				tempJob[ "types" ] = [ Job.Type.EXPORT_BACKUP ];
				this.carbonldp.documents.createChild( this.jobsUri, tempJob ).then( ( [ pointer, response ]:[ Pointer.Class, Response ] ) => {
					pointer.resolve().then( ( [ importJob, response ]:[ PersistedDocument, Response ] ) => {
						resolve( importJob );
						this.jobs.set( importJob.id, importJob );
					} );
				} ).catch( ( error ) => reject( error ) );
			}
		);
	}

	createImportBackup( backupURI:string ):Promise<PersistedDocument> {
		let tempJob:any = {},
			backup = this.carbonldp.documents.getPointer( backupURI );
		tempJob[ "types" ] = [ Job.Type.IMPORT_BACKUP ];
		tempJob[ Job.namespace + "backup" ] = this.carbonldp.documents.getPointer( backupURI );

		return this.carbonldp.documents.createChild( this.jobsUri, tempJob ).then( ( [ pointer, response ]:[ Pointer.Class, Response ] ) => {
			return pointer.resolve();
		} ).then( ( [ importJob, response ]:[ PersistedDocument, Response ] ) => {
			this.jobs.set( importJob.id, importJob );
			return importJob;
		} );
	}

	runJob( job:PersistedDocument ):Promise<PersistedDocument> {
		let tempJob:any = {};
		tempJob[ "types" ] = [ Job.namespace + "Execution" ];
		return this.carbonldp.documents.createChild( job.id, tempJob ).then( ( [ pointer, response ]:[ Pointer.Class, Response ] ) => {
			return pointer.resolve();
		} ).then( ( [ importJob, response ]:[ PersistedDocument, Response ] ) => {
			return importJob;
		} );
	}

	checkJobExecution( jobExecution:PersistedDocument ):Promise<PersistedDocument> {
		if( jobExecution.isResolved() ) {
			return jobExecution.refresh().then(
				( [ resolvedJobExecution, response ]:[ PersistedDocument, Response ] ) => {
					return resolvedJobExecution;
				} ).catch( ( error ) => { return Promise.reject( error ) } );
		} else {
			return this.carbonldp.documents.get( jobExecution.id ).then(
				( [ resolvedJobExecution, response ]:[ PersistedDocument, Response ] ) => {
					return resolvedJobExecution;
				} ).catch( ( error ) => { return Promise.reject( error ) } );
		}
	}
}
