import { Component, Input, OnInit, inject } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';

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

  ngOnInit(): void {
    this.title.setTitle(this.name || 'Not set')
    this.form = this.createForm()
  }

  process() {
    const count = this.form.value['deckCount']
    this.router.navigate(['/play', this.deckId ], { queryParams: { count }})
  }

  private createForm(): FormGroup {
    return this.fb.group({
      deckCount: this.fb.control<number>(1, [Validators.min(1), Validators.max(10), Validators.required])
    })
  }


}
