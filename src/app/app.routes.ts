import { Routes } from '@angular/router';

import { UnsavedChangesGuard } from './core/guards/UnsavedChangesGaurd';
import { EditorPage } from './pages/editor-page/editor-page';

export const routes: Routes = [
  { path: 'editor', component: EditorPage, canDeactivate: [UnsavedChangesGuard] },
  { path: '', redirectTo: 'editor', pathMatch: 'full' },
  { path: '**', redirectTo: 'editor' },
];
