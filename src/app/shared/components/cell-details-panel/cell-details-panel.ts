import { KeyValuePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { debounceTime, filter, pairwise, startWith, Subscription } from 'rxjs';

import { CellPanelInfo, CellProp } from '../../../core/dtos/cell-data.dto';
import { DataTypes } from '../../../core/enums/DataTypes';
import { FormHistoryService } from '../../../core/services/formHistoryService';
import { JointService } from '../../../core/services/jointService';
import { BaseUtility } from '../../../core/utilities/BaseUtility';

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
  styleUrl: './cell-details-panel.scss',
})
export class CellDetailsPanel implements OnInit, OnDestroy {
  protected _form!: FormGroup;
  protected _dto = signal<CellPanelInfo | null>(null);

  protected _historyState = signal<{ canUndo: boolean; canRedo: boolean }>({
    canUndo: false,
    canRedo: false,
  });

  private readonly formHistoryService = inject(FormHistoryService);
  private readonly jointService = inject(JointService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly _snackBar = inject(MatSnackBar);
  private subscription = new Subscription();

  protected get form(): FormGroup {
    if (!this._form) throw new Error('Form is undefined');
    return this._form;
  }
  protected get dto(): CellPanelInfo {
    const value = this._dto();
    if (!value) {
      throw new Error('Cell panel info not set yet.');
    }
    return value;
  }

  public ngOnInit() {
    this.subscription.add(
      this.jointService.currentCellPanelInfo$.subscribe((d) => {
        if (!d?.data) {
          this._dto.set(null);
          return;
        }
        this._dto.set(d);
        this._historyState.set(this.formHistoryService.updateHistoryState(this.dto.id));
        this.buildForm();
      }),
    );
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  protected isFormEmpty(): boolean {
    if (!this._form) return true;
    const values = this._form.getRawValue();
    return Object.values(values).every((v) => v === null || v === '' || v === false);
  }

  protected castEnumOptions(cellProp: string[]) {
    if (Array.isArray(cellProp)) {
      return cellProp;
    } else throw new Error('Unsupported type "' + cellProp);
  }

  protected toggleCellLayer = () => {
    this.jointService.toggleCellLayer(this.dto.id);
  };

  protected deleteCell = () => {
    this.jointService.removeCells([this.dto.id]);
  };

  protected resetCellData = (): void => {
    this.jointService.resetCellsData([this.dto.id]);
  };

  protected undoLastChange = (): void => {
    if (this.isFormValid()) {
      const prev = this.formHistoryService.undo(this.dto.id, this.form.value);
      this._historyState.set(this.formHistoryService.updateHistoryState(this.dto.id));

      if (prev) {
        this.form.patchValue(prev, { emitEvent: false });
        this.jointService.updateCellData(this.dto.id, prev);
      }
    }
  };

  protected redoLastChange = (): void => {
    if (this.isFormValid()) {
      const next = this.formHistoryService.redo(this.dto.id, this.form.value);
      this._historyState.set(this.formHistoryService.updateHistoryState(this.dto.id));

      if (next) {
        this.form.patchValue(next, { emitEvent: false });
        this.jointService.updateCellData(this.dto.id, next);
      }
    }
  };

  private buildForm() {
    const d = this.dto;
    const group: Record<string, FormControl> = {
      name: this.formBuilder.control(d.data.name ?? '', []),
      uri: this.formBuilder.control(d.data.uri ?? '', []),
    };

    for (const [key, prop] of Object.entries(d.data.props ?? {})) {
      group[key] = this.makeControlForProp(prop);
    }
    this._form = this.formBuilder.group(group);
    this.subscription.add(
      this.form.valueChanges
        .pipe(
          debounceTime(700),
          startWith(this.form.getRawValue()),
          pairwise(),
          filter(([prev, curr]) => !BaseUtility.deepEqual(prev, curr)),
        )
        .subscribe(([prev, curr]) => {
          {
            if (this.isFormValid()) {
              this.formHistoryService.push(d.id, prev);
              this._historyState.set(this.formHistoryService.updateHistoryState(this.dto.id));
              this.jointService.updateCellData(d.id, curr);
            }
          }
        }),
    );
  }

  private makeControlForProp(prop: CellProp): FormControl {
    const validators = [];

    if (prop.required) validators.push(Validators.required);
    validators.push(Validators.maxLength(255));

    switch (prop.type) {
      case DataTypes.string:
        return this.formBuilder.nonNullable.control(prop.value ?? '', {
          validators: [...validators],
        });

      case DataTypes.number:
        if (prop.min) validators.push(Validators.min(prop.min));
        if (prop.max) validators.push(Validators.max(prop.max));

        return this.formBuilder.nonNullable.control(prop.value ?? null, {
          validators: [...validators, Validators.pattern(/^-?\d+(\.\d+)?$/)],
        });

      case DataTypes.boolean:
        return this.formBuilder.control(prop.value);

      case DataTypes.enum:
        return this.formBuilder.control(prop.value ?? null, {
          validators: [...validators],
        });

      default:
        throw new Error('Unsupported type "' + prop.type + '"');
    }
  }

  private isFormValid(): boolean {
    const messages: string[] = [];
    const props = this.dto.data.props ?? {};

    Object.entries(this.form.controls).forEach(([key, ctrl]) => {
      const label = props[key]?.label || key;

      if (ctrl.errors) {
        if (ctrl.errors['pattern']) {
          messages.push(`${label} has invalid format`);
        }
        if (ctrl.errors['required']) {
          messages.push(`${label} is required`);
        }
        if (ctrl.errors['maxlength']) {
          messages.push(`${label} is too long (max ${ctrl.errors['maxlength'].requiredLength})`);
        }
        if (ctrl.errors['min']) {
          messages.push(`${label} must be ≥ ${ctrl.errors['min'].min}`);
        }
        if (ctrl.errors['max']) {
          messages.push(`${label} must be ≤ ${ctrl.errors['max'].max}`);
        }
        if (ctrl.errors['invalidOption']) {
          messages.push(`${label} must be a valid option`);
        }
      }
    });

    if (messages.length > 0) {
      const text = messages
        .map((m) => `• ${m.trim()}`)
        .join(' ')
        .trim();
      this._snackBar.open(text, 'Dismiss', {
        duration: 10000,
        panelClass: ['warning-snackbar'],
      });
      return false;
    }
    return true;
  }
}
