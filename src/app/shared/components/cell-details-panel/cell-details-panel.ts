import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { JointService } from '../../../core/services/jointService';
import { CellDataDto, CellProp } from '../../../core/dtos/cell-data.dto';
import { Subscription } from 'rxjs';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { KeyValuePipe } from '@angular/common';
import { DataTypes } from '../../../core/enums/DataTypes';

@Component({
  selector: 'app-cell-details-panel',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatTooltip,
    MatMenuTrigger,
    KeyValuePipe,
    MatSelect,
    MatOption,
    MatSlideToggle,
  ],
  templateUrl: './cell-details-panel.html',
  styleUrl: './cell-details-panel.css',
})
export class CellDetailsPanel implements OnInit, OnDestroy {
  private readonly jointService = inject(JointService);
  private readonly formBuilder = inject(FormBuilder);

  protected form!: FormGroup;
  protected dto = signal<CellDataDto | null>(null);
  private sub = new Subscription();

  public ngOnInit() {
    this.sub.add(
      this.jointService.currentCellPanelInfo$.subscribe((d) => {
        this.dto.set(d);
        console.log(this.dto());
        this.buildForm();
      }),
    );
  }
  public ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private buildForm() {
    const d = this.dto();
    if (!d) return;
    const group: Record<string, FormControl> = {
      name: this.formBuilder.control(d.name ?? '', []),
      uri: this.formBuilder.control(d.uri ?? '', []),
    };

    for (const [key, prop] of Object.entries(d.props ?? {})) {
      group[key] = this.makeControlForProp(prop);
    }
    this.form = this.formBuilder.group(group);
    /*   // keep JointJS in sync (debounced)
    this.sub.add(
      this.form.valueChanges
        .pipe(debounceTime(150), distinctUntilChanged())
        .subscribe(v => this.pushFormToModel(v))
    );*/
  }

  private makeControlForProp(prop: CellProp): FormControl {
    switch (prop.type) {
      case DataTypes.string:
        return this.formBuilder.nonNullable.control(prop.value);
      case DataTypes.number:
        return this.formBuilder.nonNullable.control(prop.value);
      case DataTypes.boolean:
        return this.formBuilder.control(prop.value);
      case DataTypes.enum:
        return this.formBuilder.control(prop.value);
      default:
        throw new Error('Unsupported type "' + prop.type);
    }
  }

  protected castEnumOptions(cellProp: string[]) {
    if (Array.isArray(cellProp)) {
      return cellProp;
    } else throw new Error('Unsupported type "' + cellProp);
  }
}
