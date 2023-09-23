import { Component, OnInit, inject } from '@angular/core';
import {DeckService} from '../deck.service';
import {DeckInfo} from '../models/models';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  private deckSvc = inject(DeckService)

  decks$!: Promise<DeckInfo[]>

  ngOnInit(): void {
    this.decks$ = this.deckSvc.getDecks()
  }

  selectedDeck(id: string) {
    console.info('>>> deckId: ', id)
  }

}
