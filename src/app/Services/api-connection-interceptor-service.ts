import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiConnectionInterceptorService {

  isApiConnectionGoing = signal(false);

  ApiConnectionStarted(){
    this.isApiConnectionGoing.set(true);
  }

  ApiConnectionFinished(){
    this.isApiConnectionGoing.set(false);
  }
  
}
