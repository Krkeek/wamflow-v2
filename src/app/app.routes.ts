import { Routes } from '@angular/router';
import { EditorPage } from './pages/editor-page/editor-page';
import { UnsavedChangesGuard } from './core/guards/UnsavedChangesGaurd';

export const routes: Routes = [
  { path: 'editor', component: EditorPage, canDeactivate: [UnsavedChangesGuard] },
  { path: '', redirectTo: 'editor', pathMatch: 'full' },
  { path: '**', redirectTo: 'editor' }
];
