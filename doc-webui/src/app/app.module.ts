import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http'
import {ReactiveFormsModule} from '@angular/forms';

import { AppComponent } from './app.component';
import { MainComponent } from './components/main.component';
import {ExtraOptions, RouterModule, Routes} from '@angular/router';
import {DeckService} from './deck.service';
import { CreateComponent } from './components/create.component';
import { PlayComponent } from './components/play.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'deck/:deckId', component: CreateComponent },
  { path: 'play/:deckId', component: PlayComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
]

const routerConfig: ExtraOptions = {
  useHash: true,
  bindToComponentInputs: true
}

@NgModule({
  declarations: [
    AppComponent,
    MainComponent, CreateComponent, PlayComponent
  ],
  imports: [
    BrowserModule, ReactiveFormsModule, HttpClientModule,
    RouterModule.forRoot(routes, routerConfig)
  ],
  providers: [ DeckService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
