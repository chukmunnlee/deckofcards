import { Component, Input, OnInit, inject } from '@angular/core';
import {Router} from '@angular/router';
import {DeckService} from '../deck.service';
import {DeckStatus} from '../models/models';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

  @Input()
  deckId = ''

  @Input()
  count = 1

  backImage = ''
  deckStatus!: DeckStatus

  private deckSvc = inject(DeckService)

  ngOnInit(): void {
    this.deckSvc.createDeck(this.deckId, this.count)
      .then(result => {
        this.deckStatus = result
        return this.deckSvc.getBackImage(result.deck_id)
      })
      .then(backImage => this.backImage = backImage)
  }

}
