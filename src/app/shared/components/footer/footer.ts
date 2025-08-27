import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CredentialDialog } from '../credential-dialog/credential-dialog';
import { DialogService } from '../../../core/services/dialogService';
import { MatTooltip } from '@angular/material/tooltip';
import { AppSettings } from '../app-settings/app-settings';

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
