import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialDialog } from './credential-dialog';

describe('CredentialDialog', () => {
  let component: CredentialDialog;
  let fixture: ComponentFixture<CredentialDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CredentialDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
