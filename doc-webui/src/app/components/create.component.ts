import { Component, Input, OnInit, inject } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {DeckService} from '../deck.service';
import {CreateDeckOptions} from '../models/models';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {

  @Input()
  deckId!: string

  @Input()
  name!: string

  form!: FormGroup

  private title = inject(Title)
  private fb = inject(FormBuilder)
  private router = inject(Router)
  private deckSvc = inject(DeckService)

  ngOnInit(): void {
    this.title.setTitle(this.name || 'Not set')
    this.form = this.createForm()
  }

  process() {
    const opts = this.form.value as CreateDeckOptions
    this.deckSvc.createDeck(this.deckId, opts)
      .then(result => {
        this.router.navigate(['/play', result.deck_id ])
      })
      .catch(error => {
        alert(`Error: ${JSON.stringify(error)}`)
      })
  }

  private createForm(): FormGroup {
    return this.fb.group({
      deckCount: this.fb.control<number>(1, [Validators.min(1), Validators.max(10), Validators.required]),
      shuffle: this.fb.control<boolean>(true),
      replacement: this.fb.control<boolean>(false),
      split: this.fb.control<number>(1, [Validators.min(1), Validators.max(10) ]),
    })
  }


}
