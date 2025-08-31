import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

import { LabelModes } from '../../../core/enums/LabelModes';
import { WamLinks } from '../../../core/enums/WamLinks';
import { JointService } from '../../../core/services/jointService';
import { NavControlService } from '../../../core/services/navControlService';

@Component({
  selector: 'app-sheet-header',
  imports: [
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatCheckbox,
    FormsModule,
    MatFormField,
    MatLabel,
    MatButton,
    MatInput,
    MatTooltip,
    MatButtonToggleGroup,
    MatButtonToggle,
    ReactiveFormsModule,
  ],
  templateUrl: './sheet-header.html',
  styleUrl: './sheet-header.css',
})
export class SheetHeader implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: false })
  protected fileInput!: ElementRef<HTMLInputElement>;
  protected _form!: FormGroup;
  protected panelState = { left: false, right: false };

  protected subscriptions: Subscription[] = [];
  protected readonly jointService = inject(JointService);
  protected readonly navControlService = inject(NavControlService);
  protected activeLinkType = this.jointService.activeLinkType$.value;
  protected readonly LabelModes = LabelModes;

  protected linkOptions = [
    { label: 'Invocation', value: WamLinks.Invocation },
    { label: 'Legacy', value: WamLinks.LegacyRelationship },
    { label: 'Trust', value: WamLinks.TrustRelationship },
  ];

  private readonly _formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);
  private _dimensions = this.jointService.paperDimensions();

  protected get title() {
    return this.jointService.title();
  }
  protected set title(v: string) {
    this.jointService.setTitle(v);
  }

  public onLinkTypeChange(val: WamLinks) {
    this.setActiveLinkType(val);
    this.activeLinkType = val;
  }

  public ngOnInit() {
    this.navControlService.state$.subscribe((state) => (this.panelState = state));
    this.buildForm();
  }
  public ngOnDestroy(): void {
    this.subscriptions?.forEach((s) => s.unsubscribe());
  }
  protected setActiveLinkType = (link: WamLinks) => this.jointService.activeLinkType$.next(link);

  protected updateForm(width: number, height: number) {
    this._form.patchValue({
      width: width,
      height: height,
    });
  }

  protected toggleLabels(event: MatCheckboxChange, label: LabelModes) {
    if (event.checked) {
      this.jointService.cellLabelMode.next(label);
    } else {
      this.jointService.cellLabelMode.next(LabelModes.none);
    }
  }

  protected ready() {
    return this.jointService.ready();
  }

  protected openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  protected async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await this.handleFile(file);
    input.value = '';
  }

  protected async exportJSON() {
    await this.jointService.exportJSON();
  }

  protected async exportPNG() {
    await this.jointService.exportPNG();
  }

  protected resetPaper = () => {
    this.jointService.resetPaper();
  };

  private buildForm() {
    this._form = this._formBuilder.group({
      width: this._formBuilder.control(this._dimensions.width, [
        Validators.required,
        Validators.max(10000),
        Validators.min(1000),
      ]),
      height: this._formBuilder.control(this._dimensions.height, [
        Validators.required,
        Validators.max(10000),
        Validators.min(1000),
      ]),
    });

    this.subscriptions.push(
      this._form.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe((value: { width: number; height: number }) => {
          if (this._form.invalid) {
            this._snackBar.open(`Dimensions must be between 1000–10000 px.`, 'Dismiss', {
              duration: 3000,
            });
            return;
          }

          const { width, height } = value;
          this.jointService.updatePaperDimensions(width, height);
          this._snackBar.open(`Sheet set to ${width}×${height} px`, 'Dismiss', { duration: 3000 });
        }),
    );
  }

  private async handleFile(file: File) {
    const text = await file.text();
    console.log('Loaded JSON:', text);
    await this.jointService.importJSON(file);
  }
}
