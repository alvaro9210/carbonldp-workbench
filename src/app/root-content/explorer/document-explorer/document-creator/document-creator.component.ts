import { Component, ElementRef, Input, Output, EventEmitter, AfterViewInit } from "@angular/core";

import { Class as Carbon } from "carbonldp/Carbon";
import * as PersistedDocument from "carbonldp/PersistedDocument";
import { Error as HTTPError } from "carbonldp/HTTP/Errors";

import { DocumentsResolverService } from "../documents-resolver.service"
import { Message } from "app/shared/messages-area/message.component";
import { DocumentExplorerLibrary } from "src/app/root-content/explorer/document-explorer/document-explorer-library";
import { ErrorMessageGenerator } from "app/shared/messages-area/error/error-message-generator";

import "semantic-ui/semantic";

@Component( {
	selector: "cw-document-creator",
	templateUrl: "./document-creator.component.html",
} )

export class DocumentCreatorComponent implements AfterViewInit {

	private carbon:Carbon;
	private element:ElementRef;
	private $element:JQuery;

	private $createDocumentModal:JQuery;

	private documentsResolverService:DocumentsResolverService;

	public errorMessage:Message;
	public createChildFormModel:{ slug:string, advancedOptions:{ hasMemberRelation:string, isMemberOfRelation:string } } = {
		slug: "",
		advancedOptions: {
			hasMemberRelation: "http://www.w3.org/ns/ldp#member",
			isMemberOfRelation: ""
		}
	};
	@Input() parentURI:string = "";
	@Output() onSuccess:EventEmitter<any> = new EventEmitter<any>();
	@Output() onError:EventEmitter<any> = new EventEmitter<any>();


	constructor( element:ElementRef, carbon:Carbon, documentsResolverService:DocumentsResolverService ) {
		this.element = element;
		this.carbon = carbon;
		this.documentsResolverService = documentsResolverService;
	}

	ngAfterViewInit():void {
		this.$element = $( this.element.nativeElement );
		this.$createDocumentModal = this.$element.find( ".create.document.modal" ).modal( { closable: false } );
		this.$createDocumentModal.find( ".advancedoptions.accordion" ).accordion();
	}

	public onSubmitCreateChild( data:{ slug:string, advancedOptions:{ hasMemberRelation:string, isMemberOfRelation:string } }, $event:any ):void {
		$event.preventDefault();
		let childSlug:string = null;
		if( ! ! data.slug )
			childSlug = data.slug + ((data.slug.endsWith( "/" ) && data.slug.trim() !== "" ) ? "/" : "");
		let childContent:any = {
			hasMemberRelation: data.advancedOptions.hasMemberRelation
		};
		if( ! ! data.advancedOptions.isMemberOfRelation ) childContent[ "isMemberOfRelation" ] = data.advancedOptions.isMemberOfRelation;
		this.documentsResolverService.createChild( this.parentURI, childContent, childSlug ).then( ( createdChild:PersistedDocument.Class ) => {
			this.onSuccess.emit( createdChild );
			this.hide();
		} ).catch( ( error:HTTPError ) => {
			this.onError.emit( error );
			this.errorMessage = ErrorMessageGenerator.getErrorMessage( error );
		} );
	}

	private clearErrorMessage():void {
		this.errorMessage = null;
	}

	public getSanitizedSlug( slug:string ):string {
		return DocumentExplorerLibrary.getSanitizedSlug( slug );
	}

	public slugLostFocus( evt:any ):void {
		evt.target.value = DocumentExplorerLibrary.getAppendedSlashSlug( evt.target.value );
	}

	public show():void {
		this.$createDocumentModal.modal( "show" );
	}

	public hide():void {
		this.hideForm();
	}

	public hideForm():void {
		this.$createDocumentModal.modal( "hide" );
		this.clearErrorMessage();
		this.createChildFormModel.slug = "";
		this.createChildFormModel.advancedOptions.hasMemberRelation = "http://www.w3.org/ns/ldp#member";
		this.createChildFormModel.advancedOptions.isMemberOfRelation = "";
	}

	public toggle():void {
		this.$createDocumentModal.modal( "toggle" );
	}

}

