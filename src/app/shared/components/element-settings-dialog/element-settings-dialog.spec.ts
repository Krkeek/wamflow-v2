import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementSettingsDialog } from './element-settings-dialog';

describe('ElementSettingsDialog', () => {
  let component: ElementSettingsDialog;
  let fixture: ComponentFixture<ElementSettingsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElementSettingsDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ElementSettingsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
