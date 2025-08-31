import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CellDetailsPanel } from './cell-details-panel';

describe('CellDetailsPanel', () => {
  let component: CellDetailsPanel;
  let fixture: ComponentFixture<CellDetailsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CellDetailsPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(CellDetailsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
