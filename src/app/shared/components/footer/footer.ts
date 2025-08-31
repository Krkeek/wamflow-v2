import { Component, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { DialogService } from '../../../core/services/dialogService';
import { AppSettings } from '../app-settings/app-settings';
import { CredentialDialog } from '../credential-dialog/credential-dialog';

@Component({
  selector: 'app-footer',
  imports: [MatIcon, MatButton, MatTooltip],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private _bottomSheet = inject(MatBottomSheet);
  private _dialogService = inject(DialogService);
  protected openCredentialDialog = () => {
    this._dialogService.openDialog(CredentialDialog);
  };

  protected openSettingsDialog = () => {
    this._bottomSheet.open(AppSettings);
  };
}
