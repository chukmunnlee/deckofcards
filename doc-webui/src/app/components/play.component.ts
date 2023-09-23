import { Component, Input, OnInit, inject } from '@angular/core';
import {Router} from '@angular/router';
import {DeckService} from '../deck.service';
import {Card, DeckStatus} from '../models/models';
import {Title} from '@angular/platform-browser';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

  @Input()
  deckId = ''

  backImage = ''
  deckStatus!: DeckStatus
  minCards = 1
  maxCards = 1
  remaining = 1
  drawnCards: Card[] = []

  form!: FormGroup

  private deckSvc = inject(DeckService)
  private title = inject(Title)
  private fb = inject(FormBuilder)

  ngOnInit(): void {
    this.title.setTitle(`Deck Id: ${this.deckId}`)
    this.form = this.createForm()
    this.deckSvc.getDeckStatus(this.deckId)
      .then(result => {
        this.updateControls(result)
        return this.deckSvc.getBackImage(result.deck_id)
      })
      .then(backImage => this.backImage = backImage)
      .catch(error => {
        alert(`Error: ${JSON.stringify(error)}`)
      })
  }

  process() {
    const count = this.form.controls['count'].value
    this.deckSvc.drawDeck(this.deckId, count)
      .then(result => {
        this.updateControls(result)
        this.form.controls['count'].setValue(1)
        this.drawnCards = this.deckStatus.cards || []
      })
      .catch(error => {
        alert(`Error: ${JSON.stringify(error)}`)
      })
  }

  private createForm(): FormGroup {
    return this.fb.group({
      count: this.fb.control<number>(1, [ Validators.required, Validators.min(1) ])
    })
  }

  private updateControls(result: DeckStatus) {
    this.deckStatus = result
    this.maxCards = result.remaining
    this.minCards = result.remaining > 0? 1: 0
    this.form.controls['count'].setValue(this.minCards)
  }

}
