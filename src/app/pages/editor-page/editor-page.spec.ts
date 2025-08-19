import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorPage } from './editor-page';

describe('EditorPage', () => {
  let component: EditorPage;
  let fixture: ComponentFixture<EditorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
