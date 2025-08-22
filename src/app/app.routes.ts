import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { UnsavedChangesGuard } from './core/guards/UnsavedChangesGaurd';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'editor', component: EditorPage, canDeactivate: [UnsavedChangesGuard] },
];
