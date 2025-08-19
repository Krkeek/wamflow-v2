import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { EditorPage } from './pages/editor-page/editor-page';

export const routes: Routes = [
  { path: '', component: HomePage }, // default route
  { path: 'editor', component: EditorPage }, // /editor route
];
