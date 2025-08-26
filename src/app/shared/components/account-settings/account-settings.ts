import { Component, inject } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { DialogService } from '../../../core/services/dialogService';
import { CredentialDialog } from '../credential-dialog/credential-dialog';

@Component({
  selector: 'app-account-settings',
  imports: [MatIcon, MatButton,MatIconModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettings {

  private readonly _dialogService = inject(DialogService);

  protected openCredentialDialog = () => {
    this._dialogService.openDialog(CredentialDialog);
  }
}
