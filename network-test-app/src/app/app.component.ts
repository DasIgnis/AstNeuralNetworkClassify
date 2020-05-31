import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'network-test-app';
  
	private _files: File[];
	private _results: {file: string, type: number}[];
	
	constructor(private _http: HttpClient) {
		this._files = [];
		this._results = [];
	}

	ngOnInit() {

    }
	
	fileChange(element) {
        this._files = element.target.files;
    }

    upload() {
        let formData = new FormData();
        for (var i = 0; i < this._files.length; i++) {
            formData.append("uploads[]", this._files[i], this._files[i].name);
        }
        this._http.post('/api/upload', formData)
            .subscribe((response: {file: string, result: any, message: string}) => {
				if (response.hasOwnProperty('file') && response.hasOwnProperty('result') && response.file) {
					this._results.push({file: response.file, type: JSON.parse(response.result)[0] > JSON.parse(response.result)[1] ? 1 : 2})
				}
				else if (response.hasOwnProperty('message')) {
					alert(response.message);
				}
            })
    }
	
	public get results(): {file: string, type: number}[] {return this._results;}
}
